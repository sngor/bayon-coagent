/**
 * Voice Service - Centralized voice functionality following AWS service patterns
 * Provides a clean abstraction over the Gemini Live API
 */

import { getVoiceConfig, type VoiceConfig } from '@/lib/voice-config';
import { createVoiceError, type VoiceError } from '@/lib/voice-errors';
import { AudioBufferManager, AudioResampler } from '@/lib/audio-buffer-manager';

export interface VoiceServiceConfig {
    model?: string;
    systemInstruction?: string;
    responseModalities?: string[];
    voiceName?: string;
}

export interface VoiceServiceState {
    isConnected: boolean;
    isRecording: boolean;
    isSpeaking: boolean;
    error: VoiceError | null;
    audioLevel: number;
    outputAudioLevel: number;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

type StateChangeCallback = (state: VoiceServiceState) => void;

export class VoiceService {
    private config: VoiceConfig;
    private state: VoiceServiceState;
    private onStateChange: StateChangeCallback;

    // Connection
    private ws: WebSocket | null = null;
    private apiKey: string | null = null;
    private serviceConfig: VoiceServiceConfig | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private reconnectAttempts = 0;

    // Audio
    private mediaStream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private processor: ScriptProcessorNode | null = null;
    private bufferManager: AudioBufferManager;
    private isRecordingRef = false;

    constructor(onStateChange: StateChangeCallback, configOverrides?: Partial<VoiceConfig>) {
        this.config = getVoiceConfig(configOverrides);
        this.onStateChange = onStateChange;
        this.bufferManager = new AudioBufferManager({
            maxBufferSize: this.config.bufferSize * 10,
            sampleRate: 24000, // Gemini output sample rate
            channelCount: 1,
            bufferDuration: 1000
        });

        this.state = {
            isConnected: false,
            isRecording: false,
            isSpeaking: false,
            error: null,
            audioLevel: 0,
            outputAudioLevel: 0,
            connectionStatus: 'disconnected'
        };
    }

    private updateState(updates: Partial<VoiceServiceState>): void {
        this.state = { ...this.state, ...updates };
        this.onStateChange(this.state);
    }

    async validateApiKey(apiKey: string): Promise<boolean> {
        if (!apiKey?.trim()) {
            this.updateState({ error: createVoiceError('No API key provided') });
            return false;
        }

        if (apiKey.length < 20 || !apiKey.startsWith('AIza')) {
            this.updateState({ error: createVoiceError('Invalid API key format') });
            return false;
        }

        try {
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(this.config.apiTimeout)
            });

            if (!response.ok) {
                const error = response.status === 401
                    ? createVoiceError('Invalid API key or authentication failed', response.status)
                    : createVoiceError(`API validation failed: HTTP ${response.status}`, response.status);
                this.updateState({ error });
                return false;
            }

            return true;
        } catch (error) {
            const voiceError = error instanceof Error
                ? createVoiceError(`API validation failed: ${error.message}`)
                : createVoiceError('Network error during API validation');
            this.updateState({ error: voiceError });
            return false;
        }
    }

    async connect(apiKey: string, config?: VoiceServiceConfig): Promise<void> {
        this.updateState({ connectionStatus: 'connecting', error: null });

        const isValid = await this.validateApiKey(apiKey);
        if (!isValid) return;

        this.apiKey = apiKey;
        this.serviceConfig = config || {};

        await this.createWebSocketConnection();
    }

    private async createWebSocketConnection(): Promise<void> {
        if (!this.apiKey) return;

        // Clean up existing connection
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        const host = 'generativelanguage.googleapis.com';
        const path = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
        const url = `wss://${host}${path}?key=${this.apiKey}`;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            this.updateState({
                isConnected: true,
                connectionStatus: 'connected',
                error: null
            });
            this.reconnectAttempts = 0;
            this.sendSetupMessage();
        };

        this.ws.onmessage = async (event) => {
            try {
                const data = event.data instanceof Blob
                    ? JSON.parse(await event.data.text())
                    : JSON.parse(event.data);

                this.handleIncomingMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.ws.onerror = () => {
            const error = navigator.onLine
                ? createVoiceError('Connection error occurred')
                : createVoiceError('No internet connection');
            this.updateState({ error, connectionStatus: 'error' });
        };

        this.ws.onclose = (event) => {
            this.updateState({
                isConnected: false,
                connectionStatus: event.code === 1000 ? 'disconnected' : 'error'
            });

            if (event.code !== 1000 && event.code !== 4001 && event.code !== 4003) {
                this.attemptReconnect();
            }
        };
    }

    private sendSetupMessage(): void {
        if (!this.ws || !this.serviceConfig) return;

        const setupMessage = {
            setup: {
                model: this.serviceConfig.model || this.config.defaultModel,
                generationConfig: {
                    responseModalities: this.serviceConfig.responseModalities || ['AUDIO'],
                    speechConfig: this.serviceConfig.voiceName ? {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: this.serviceConfig.voiceName,
                            },
                        },
                    } : undefined,
                },
                systemInstruction: this.serviceConfig.systemInstruction ? {
                    parts: [{ text: this.serviceConfig.systemInstruction }]
                } : undefined,
            }
        };

        this.ws.send(JSON.stringify(setupMessage));
    }

    private handleIncomingMessage(data: any): void {
        if (data.serverContent?.modelTurn?.parts) {
            for (const part of data.serverContent.modelTurn.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                    this.processIncomingAudio(part.inlineData.data);
                }
            }
        }
    }

    private processIncomingAudio(base64Data: string): void {
        try {
            const binaryString = window.atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const int16Array = new Int16Array(bytes.buffer);

            this.bufferManager.addChunk(int16Array);
            this.schedulePlayback();
        } catch (error) {
            console.error('Error processing incoming audio:', error);
        }
    }

    private schedulePlayback(): void {
        if (this.state.isSpeaking || !this.bufferManager.hasEnoughData(50)) return;

        const stats = this.bufferManager.getStats();
        const { bufferThresholds, bufferWaitTimes } = this.config;

        let waitTime: number;
        if (stats.bufferCount >= bufferThresholds.large) {
            waitTime = bufferWaitTimes.large;
        } else if (stats.bufferCount >= bufferThresholds.medium) {
            waitTime = bufferWaitTimes.medium;
        } else if (stats.bufferCount >= bufferThresholds.small) {
            waitTime = bufferWaitTimes.small;
        } else {
            waitTime = bufferWaitTimes.tiny;
        }

        setTimeout(() => this.playBufferedAudio(), waitTime);
    }

    private async playBufferedAudio(): Promise<void> {
        const audioData = this.bufferManager.getAndClearBuffer();
        if (!audioData || audioData.length < 240) return;

        try {
            if (!this.audioContext) {
                this.audioContext = new AudioContext();
            }

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const audioBuffer = this.audioContext.createBuffer(1, audioData.length, 24000);
            const channelData = audioBuffer.getChannelData(0);

            // Convert and calculate output level
            let outputSum = 0;
            for (let i = 0; i < audioData.length; i++) {
                channelData[i] = audioData[i] / (audioData[i] < 0 ? 32768 : 32767);
                outputSum += Math.abs(channelData[i]);
            }

            const outputLevel = Math.min(1, (outputSum / channelData.length) * 5);
            this.updateState({ outputAudioLevel: outputLevel, isSpeaking: true });

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);

            source.onended = () => {
                if (this.bufferManager.hasEnoughData(50)) {
                    setTimeout(() => this.playBufferedAudio(), 1);
                } else {
                    this.updateState({ isSpeaking: false, outputAudioLevel: 0 });
                }
            };

            source.start();
        } catch (error) {
            console.error('Error playing audio:', error);
            this.updateState({ isSpeaking: false, outputAudioLevel: 0 });
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            this.updateState({
                error: createVoiceError('Connection failed after multiple attempts'),
                connectionStatus: 'error'
            });
            return;
        }

        this.reconnectAttempts++;
        this.updateState({
            error: createVoiceError(`Reconnecting... (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`),
            connectionStatus: 'connecting'
        });

        this.reconnectTimeout = setTimeout(() => {
            if (this.apiKey && this.serviceConfig) {
                this.createWebSocketConnection();
            }
        }, this.config.reconnectDelay);
    }

    async startRecording(): Promise<void> {
        if (!this.state.isConnected) {
            this.updateState({ error: createVoiceError('Not connected to voice service') });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });

            this.mediaStream = stream;
            this.audioContext = new AudioContext();

            const source = this.audioContext.createMediaStreamSource(stream);
            this.processor = this.audioContext.createScriptProcessor(this.config.bufferSize, 1, 1);

            this.processor.onaudioprocess = (e) => {
                if (!this.isRecordingRef) return;

                const inputData = e.inputBuffer.getChannelData(0);
                this.processRecordingData(inputData);
            };

            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            this.isRecordingRef = true;
            this.updateState({ isRecording: true, error: null });
        } catch (error: any) {
            const voiceError = createVoiceError(
                this.getRecordingErrorMessage(error),
                undefined,
                'microphone'
            );
            this.updateState({ error: voiceError });
        }
    }

    private processRecordingData(inputData: Float32Array): void {
        // Calculate audio level
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
        }
        const level = Math.min(1, (sum / inputData.length) * 10);
        this.updateState({ audioLevel: level });

        // Apply noise gate
        for (let i = 0; i < inputData.length; i++) {
            if (Math.abs(inputData[i]) < this.config.noiseGateThreshold) {
                inputData[i] = 0;
            }
        }

        // Resample and send
        const resampledData = AudioResampler.resample(
            inputData,
            this.audioContext?.sampleRate || 44100,
            this.config.sampleRate
        );

        const int16Data = AudioResampler.float32ToInt16(resampledData);
        this.sendAudioData(int16Data);
    }

    private sendAudioData(audioData: Int16Array): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        try {
            const blob = new Blob([audioData.buffer], { type: 'application/octet-stream' });
            const reader = new FileReader();

            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                const message = {
                    realtimeInput: {
                        mediaChunks: [{
                            mimeType: 'audio/pcm;rate=16000',
                            data: base64String
                        }]
                    }
                };

                this.ws?.send(JSON.stringify(message));
            };

            reader.readAsDataURL(blob);
        } catch (error) {
            console.warn('Error sending audio data:', error);
        }
    }

    stopRecording(): void {
        this.isRecordingRef = false;
        this.updateState({ isRecording: false, audioLevel: 0 });

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
    }

    sendText(text: string): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.updateState({ error: createVoiceError('Not connected to voice service') });
            return;
        }

        const message = {
            clientContent: {
                turns: [{
                    parts: [{ text }]
                }],
                turnComplete: true
            }
        };

        this.ws.send(JSON.stringify(message));
    }

    disconnect(): void {
        this.stopRecording();

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close(1000, 'Manual disconnect');
            this.ws = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.bufferManager.clear();
        this.reconnectAttempts = 0;
        this.apiKey = null;
        this.serviceConfig = null;

        this.updateState({
            isConnected: false,
            isRecording: false,
            isSpeaking: false,
            error: null,
            audioLevel: 0,
            outputAudioLevel: 0,
            connectionStatus: 'disconnected'
        });
    }

    private getRecordingErrorMessage(error: any): string {
        switch (error.name) {
            case 'NotAllowedError':
                return 'Microphone access denied. Please allow microphone permissions and try again.';
            case 'NotFoundError':
                return 'No microphone found. Please connect a microphone and try again.';
            case 'NotReadableError':
                return 'Microphone is already in use by another application.';
            case 'OverconstrainedError':
                return 'Microphone does not meet the required specifications.';
            case 'SecurityError':
                return 'Microphone access blocked due to security restrictions.';
            default:
                return error.message || 'Failed to access microphone';
        }
    }

    // Getters for current state
    get isConnected(): boolean { return this.state.isConnected; }
    get isRecording(): boolean { return this.state.isRecording; }
    get isSpeaking(): boolean { return this.state.isSpeaking; }
    get error(): VoiceError | null { return this.state.error; }
    get connectionStatus(): string { return this.state.connectionStatus; }
    get isReady(): boolean { return this.state.isConnected && !this.state.error; }
}