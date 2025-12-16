'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
    audioToBase64,
    getMicrophoneErrorMessage,
    DEFAULT_AUDIO_CONFIG
} from '@/lib/audio-utils';

export interface GeminiLiveConfig {
    model?: string;
    systemInstruction?: string;
    responseModalities?: string[];
    voiceName?: string;
    onMessage?: (message: any) => void;
    autoStartMessage?: string;
    autoStartDelay?: number;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface GeminiLiveHookReturn {
    isConnected: boolean;
    isRecording: boolean;
    isSpeaking: boolean;
    connectionState: ConnectionState;
    error: string | null;
    audioLevel: number;
    outputAudioLevel: number;
    connect: (apiKey: string, config?: GeminiLiveConfig) => Promise<void>;
    disconnect: () => void;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    sendText: (text: string) => void;
    triggerAutoStart: () => void;
}

// Constants
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;
const GEMINI_WEBSOCKET_HOST = 'generativelanguage.googleapis.com';
const GEMINI_WEBSOCKET_PATH = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
const DEFAULT_MODEL = 'models/gemini-2.5-flash-native-audio-preview-12-2025';
const AUDIO_SAMPLE_RATE = 24000;
const MIN_AUDIO_BUFFER_SIZE = 240;

// Custom hooks for separation of concerns
function useWebSocketConnection() {
    const wsRef = useRef<WebSocket | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const configRef = useRef<GeminiLiveConfig | null>(null);
    const apiKeyRef = useRef<string | null>(null);

    return {
        wsRef,
        connectionState,
        setConnectionState,
        isConnected,
        setIsConnected,
        error,
        setError,
        reconnectAttemptsRef,
        reconnectTimeoutRef,
        configRef,
        apiKeyRef,
    };
}

function useAudioRecording() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<any>(null);
    const isRecordingRef = useRef(false);

    return {
        isRecording,
        setIsRecording,
        audioLevel,
        setAudioLevel,
        mediaStreamRef,
        processorRef,
        isRecordingRef,
    };
}

function useAudioPlayback() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [outputAudioLevel, setOutputAudioLevel] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<Int16Array[]>([]);
    const isPlayingRef = useRef(false);
    const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    return {
        isSpeaking,
        setIsSpeaking,
        outputAudioLevel,
        setOutputAudioLevel,
        audioContextRef,
        audioBufferRef,
        isPlayingRef,
        playbackTimeoutRef,
        audioSourceRef,
    };
}

function useAutoStart() {
    const autoStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasAutoStartedRef = useRef(false);

    return {
        autoStartTimeoutRef,
        hasAutoStartedRef,
    };
}

// Error handling utility
function getWebSocketErrorMessage(code: number): string {
    switch (code) {
        case 1006:
            return 'Network connection interrupted.';
        case 4001:
            return 'Invalid API key or authentication failed.';
        case 4003:
            return 'API quota exceeded or rate limited.';
        default:
            return `Error code: ${code}`;
    }
}

// Audio processing utilities
class AudioProcessor {
    static async convertBase64ToInt16Array(base64Data: string): Promise<Int16Array> {
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return new Int16Array(bytes.buffer);
    }

    static combineAudioChunks(chunks: Int16Array[]): Int16Array {
        const totalSamples = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedAudio = new Int16Array(totalSamples);
        let offset = 0;

        for (const chunk of chunks) {
            combinedAudio.set(chunk, offset);
            offset += chunk.length;
        }

        return combinedAudio;
    }

    static calculateAudioLevel(channelData: Float32Array): number {
        let outputSum = 0;
        for (let i = 0; i < channelData.length; i++) {
            outputSum += Math.abs(channelData[i]);
        }
        return Math.min(1, (outputSum / channelData.length) * 5);
    }

    static convertInt16ToFloat32(int16Data: Int16Array): Float32Array {
        const float32Data = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
            const sample = int16Data[i];
            float32Data[i] = sample / (sample < 0 ? 32768 : 32767);
        }
        return float32Data;
    }
}

export function useGeminiLive(): GeminiLiveHookReturn {
    // Separate concerns into focused hooks
    const webSocket = useWebSocketConnection();
    const audioRecording = useAudioRecording();
    const audioPlayback = useAudioPlayback();
    const autoStart = useAutoStart();

    // Audio processing functions
    const sendAudioData = useCallback(async (int16Data: Int16Array) => {
        if (!webSocket.wsRef.current || webSocket.wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            const base64String = await audioToBase64(int16Data);
            const message = {
                realtimeInput: {
                    mediaChunks: [{
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64String
                    }]
                }
            };
            webSocket.wsRef.current.send(JSON.stringify(message));
        } catch (error) {
            console.warn('⚠️ Error processing audio buffer:', error);
        }
    }, [webSocket.wsRef]);

    const bufferAudioChunk = useCallback((audioData: Int16Array) => {
        if (audioData.length === 0) return;

        audioPlayback.audioBufferRef.current.push(audioData);

        if (audioPlayback.playbackTimeoutRef.current) {
            clearTimeout(audioPlayback.playbackTimeoutRef.current);
        }

        if (audioPlayback.isPlayingRef.current) return;

        const waitTime = audioPlayback.audioBufferRef.current.length >= 2 ? 0 : 50;

        audioPlayback.playbackTimeoutRef.current = setTimeout(() => {
            if (audioPlayback.audioBufferRef.current.length > 0 && !audioPlayback.isPlayingRef.current) {
                playBufferedAudio();
            }
        }, waitTime);
    }, [audioPlayback.audioBufferRef, audioPlayback.playbackTimeoutRef, audioPlayback.isPlayingRef]);

    const playBufferedAudio = useCallback(async () => {
        if (audioPlayback.audioBufferRef.current.length === 0 || audioPlayback.isPlayingRef.current) return;

        try {
            if (!audioPlayback.audioContextRef.current) {
                audioPlayback.audioContextRef.current = new AudioContext();
            }

            const audioContext = audioPlayback.audioContextRef.current;

            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            const chunksToPlay = [...audioPlayback.audioBufferRef.current];
            audioPlayback.audioBufferRef.current = [];

            const combinedAudio = AudioProcessor.combineAudioChunks(chunksToPlay);

            if (combinedAudio.length < MIN_AUDIO_BUFFER_SIZE) return;

            const audioBuffer = audioContext.createBuffer(1, combinedAudio.length, AUDIO_SAMPLE_RATE);
            const channelData = audioBuffer.getChannelData(0);
            const float32Data = AudioProcessor.convertInt16ToFloat32(combinedAudio);
            channelData.set(float32Data);

            const outputLevel = AudioProcessor.calculateAudioLevel(channelData);
            audioPlayback.setOutputAudioLevel(outputLevel);

            if (audioPlayback.audioSourceRef.current) {
                try {
                    audioPlayback.audioSourceRef.current.stop();
                } catch (e) {
                    // Source might already be stopped
                }
            }

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            source.onended = () => {
                audioPlayback.audioSourceRef.current = null;
                audioPlayback.isPlayingRef.current = false;

                if (audioPlayback.audioBufferRef.current.length > 0) {
                    setTimeout(() => playBufferedAudio(), 0);
                } else {
                    audioPlayback.setIsSpeaking(false);
                    audioPlayback.setOutputAudioLevel(0);
                }
            };

            audioPlayback.setIsSpeaking(true);
            audioPlayback.isPlayingRef.current = true;
            audioPlayback.audioSourceRef.current = source;
            source.start();

        } catch (error) {
            console.error('❌ Error playing buffered audio:', error);
            audioPlayback.setIsSpeaking(false);
            audioPlayback.isPlayingRef.current = false;
            audioPlayback.audioBufferRef.current = [];
        }
    }, [audioPlayback]);

    // Message handling
    const sendTextMessage = useCallback((text: string) => {
        if (!webSocket.wsRef.current || webSocket.wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ Cannot send text: WebSocket not connected');
            return false;
        }

        const message = {
            clientContent: {
                turns: [{
                    parts: [{ text: text }]
                }],
                turnComplete: true
            }
        };

        webSocket.wsRef.current.send(JSON.stringify(message));
        console.log('📤 Sent text message:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        return true;
    }, [webSocket.wsRef]);

    // Connection management
    const attemptReconnect = useCallback(() => {
        if (webSocket.reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            webSocket.setError('Connection failed after multiple attempts. Please check your API key and try again.');
            return;
        }

        webSocket.reconnectAttemptsRef.current += 1;
        webSocket.setError(`Reconnecting... (${webSocket.reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

        webSocket.reconnectTimeoutRef.current = setTimeout(async () => {
            if (webSocket.apiKeyRef.current && webSocket.configRef.current) {
                await connect(webSocket.apiKeyRef.current, webSocket.configRef.current);
            }
        }, RECONNECT_DELAY);
    }, [webSocket]);

    const connectWebSocket = useCallback(async (apiKey: string, config?: GeminiLiveConfig) => {
        if (webSocket.wsRef.current) {
            webSocket.wsRef.current.close();
            webSocket.wsRef.current = null;
        }

        const url = `wss://${GEMINI_WEBSOCKET_HOST}${GEMINI_WEBSOCKET_PATH}?key=${apiKey}`;
        const ws = new WebSocket(url);
        webSocket.wsRef.current = ws;

        ws.onopen = () => {
            console.log('✅ Gemini Live WebSocket connected successfully');
            webSocket.setIsConnected(true);
            webSocket.setConnectionState('connected');
            webSocket.setError(null);
            webSocket.reconnectAttemptsRef.current = 0;
            autoStart.hasAutoStartedRef.current = false;

            const modelToUse = config?.model || DEFAULT_MODEL;
            const setupMessage = {
                setup: {
                    model: modelToUse,
                    generationConfig: {
                        responseModalities: config?.responseModalities || ['AUDIO'],
                        speechConfig: config?.voiceName ? {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: config.voiceName,
                                },
                            },
                        } : undefined,
                    },
                    systemInstruction: config?.systemInstruction ? {
                        parts: [{ text: config.systemInstruction }]
                    } : undefined,
                }
            };

            ws.send(JSON.stringify(setupMessage));

            if (config?.autoStartMessage && !autoStart.hasAutoStartedRef.current) {
                const delay = config.autoStartDelay || 1000;
                autoStart.autoStartTimeoutRef.current = setTimeout(() => {
                    if (ws.readyState === WebSocket.OPEN && !autoStart.hasAutoStartedRef.current && config.autoStartMessage) {
                        sendTextMessage(config.autoStartMessage);
                        autoStart.hasAutoStartedRef.current = true;
                    }
                }, delay);
            }
        };

        ws.onmessage = async (event) => {
            try {
                let data;
                if (event.data instanceof Blob) {
                    data = JSON.parse(await event.data.text());
                } else {
                    data = JSON.parse(event.data);
                }

                if (config?.onMessage) {
                    config.onMessage(data);
                }

                if (data.serverContent?.modelTurn?.parts) {
                    for (const part of data.serverContent.modelTurn.parts) {
                        if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                            const base64Data = part.inlineData.data;
                            try {
                                const int16Array = await AudioProcessor.convertBase64ToInt16Array(base64Data);
                                bufferAudioChunk(int16Array);
                            } catch (e) {
                                console.error('❌ Error processing audio data:', e);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('❌ Error parsing WebSocket message:', e);
            }
        };

        ws.onerror = (e) => {
            console.error('❌ Gemini Live WebSocket error:', e);
            webSocket.setConnectionState('error');
            webSocket.setError('Connection error occurred. Will attempt to reconnect...');
        };

        ws.onclose = (e) => {
            console.log('🔌 Gemini Live WebSocket closed');
            webSocket.setIsConnected(false);
            webSocket.setConnectionState('disconnected');
            audioRecording.setIsRecording(false);
            audioPlayback.setIsSpeaking(false);

            if (e.code !== 1000) {
                const errorMessage = 'Connection lost. ' + getWebSocketErrorMessage(e.code);
                webSocket.setError(errorMessage);

                if (e.code !== 4001 && e.code !== 4003 && webSocket.apiKeyRef.current && webSocket.configRef.current) {
                    setTimeout(() => attemptReconnect(), 100);
                }
            }
        };
    }, [webSocket, audioRecording, audioPlayback, autoStart, bufferAudioChunk, attemptReconnect, sendTextMessage]);

    const connect = useCallback(async (apiKey: string, config?: GeminiLiveConfig) => {
        try {
            webSocket.setError(null);
            webSocket.setConnectionState('connecting');
            webSocket.apiKeyRef.current = apiKey;
            webSocket.configRef.current = config || {};
            await connectWebSocket(apiKey, config);
        } catch (err: any) {
            console.error('❌ Failed to connect to Gemini Live:', err);
            webSocket.setError(err.message || 'Failed to connect');
            webSocket.setIsConnected(false);
            webSocket.setConnectionState('error');
        }
    }, [webSocket, connectWebSocket]);

    // Resource cleanup
    const cleanupResources = useCallback(() => {
        // Clear timeouts
        [webSocket.reconnectTimeoutRef, autoStart.autoStartTimeoutRef, audioPlayback.playbackTimeoutRef]
            .forEach(timeoutRef => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
            });

        // Stop media stream
        if (audioRecording.mediaStreamRef.current) {
            try {
                audioRecording.mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => {
                    track.stop();
                });
            } catch (e) {
                console.warn('Error stopping media stream:', e);
            }
            audioRecording.mediaStreamRef.current = null;
        }

        // Disconnect audio processor
        if (audioRecording.processorRef.current) {
            try {
                if (typeof audioRecording.processorRef.current.disconnect === 'function') {
                    audioRecording.processorRef.current.disconnect();
                }
            } catch (e) {
                console.warn('Error disconnecting audio processor:', e);
            }
            audioRecording.processorRef.current = null;
        }

        // Stop audio source
        if (audioPlayback.audioSourceRef.current) {
            try {
                audioPlayback.audioSourceRef.current.stop();
                audioPlayback.audioSourceRef.current.disconnect();
            } catch (e) {
                console.warn('Error stopping audio source:', e);
            }
            audioPlayback.audioSourceRef.current = null;
        }

        // Close audio context
        if (audioPlayback.audioContextRef.current && audioPlayback.audioContextRef.current.state !== 'closed') {
            try {
                audioPlayback.audioContextRef.current.close();
            } catch (e) {
                console.warn('Error closing audio context:', e);
            }
            audioPlayback.audioContextRef.current = null;
        }

        // Reset state
        audioPlayback.audioBufferRef.current = [];
        audioPlayback.isPlayingRef.current = false;
        audioRecording.isRecordingRef.current = false;
        autoStart.hasAutoStartedRef.current = false;

        audioRecording.setIsRecording(false);
        audioPlayback.setIsSpeaking(false);
        audioRecording.setAudioLevel(0);
        audioPlayback.setOutputAudioLevel(0);
    }, [webSocket, audioRecording, audioPlayback, autoStart]);

    const disconnect = useCallback(() => {
        webSocket.reconnectAttemptsRef.current = 0;
        webSocket.apiKeyRef.current = null;
        webSocket.configRef.current = null;

        if (webSocket.wsRef.current) {
            try {
                webSocket.wsRef.current.close(1000, 'Manual disconnect');
            } catch (e) {
                console.warn('Error closing WebSocket:', e);
            }
            webSocket.wsRef.current = null;
        }

        cleanupResources();
        webSocket.setConnectionState('disconnected');
        webSocket.setIsConnected(false);
        webSocket.setError(null);
    }, [webSocket, cleanupResources]);

    const startRecording = useCallback(async () => {
        if (!webSocket.wsRef.current || webSocket.wsRef.current.readyState !== WebSocket.OPEN) {
            webSocket.setError('Not connected to Gemini Live');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: DEFAULT_AUDIO_CONFIG.channelCount,
                    echoCancellation: DEFAULT_AUDIO_CONFIG.echoCancellation,
                    noiseSuppression: DEFAULT_AUDIO_CONFIG.noiseSuppression,
                }
            });

            audioRecording.mediaStreamRef.current = stream;
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);

            try {
                await audioContext.audioWorklet.addModule('/audio-processor.js');
                const workletNode = new AudioWorkletNode(audioContext, 'audio-processor', {
                    processorOptions: {
                        targetSampleRate: DEFAULT_AUDIO_CONFIG.sampleRate,
                        bufferSize: DEFAULT_AUDIO_CONFIG.bufferSize
                    }
                });

                workletNode.port.onmessage = (event) => {
                    const { type, data } = event.data;

                    if (type === 'audioLevel') {
                        audioRecording.setAudioLevel(data);
                    } else if (type === 'audioData') {
                        sendAudioData(data);
                    }
                };

                source.connect(workletNode);
                audioRecording.processorRef.current = workletNode;
            } catch (error) {
                console.warn('AudioWorklet not supported, using fallback implementation');
                webSocket.setError('Modern audio processing not supported in this browser. Audio quality may be reduced.');
                return;
            }

            audioRecording.isRecordingRef.current = true;
            audioRecording.setIsRecording(true);
            webSocket.setError(null);

        } catch (err: any) {
            console.error('❌ Failed to start recording:', err);
            webSocket.setError(getMicrophoneErrorMessage(err));
        }
    }, [webSocket, audioRecording, sendAudioData]);

    const stopRecording = useCallback(() => {
        audioRecording.isRecordingRef.current = false;
        audioRecording.setIsRecording(false);
        audioRecording.setAudioLevel(0);

        if (audioRecording.mediaStreamRef.current) {
            audioRecording.mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            audioRecording.mediaStreamRef.current = null;
        }

        if (audioRecording.processorRef.current) {
            if (typeof audioRecording.processorRef.current.disconnect === 'function') {
                audioRecording.processorRef.current.disconnect();
            }
            audioRecording.processorRef.current = null;
        }
    }, [audioRecording]);

    const sendText = useCallback((text: string) => {
        const success = sendTextMessage(text);
        if (!success) {
            webSocket.setError('Not connected to Gemini Live');
        }
    }, [webSocket, sendTextMessage]);

    const triggerAutoStart = useCallback(() => {
        const config = webSocket.configRef.current;
        if (config?.autoStartMessage && webSocket.wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('🎭 Manually triggering auto-start message');
            sendTextMessage(config.autoStartMessage);
            autoStart.hasAutoStartedRef.current = true;
        }
    }, [webSocket, autoStart, sendTextMessage]);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected: webSocket.isConnected,
        isRecording: audioRecording.isRecording,
        isSpeaking: audioPlayback.isSpeaking,
        connectionState: webSocket.connectionState,
        error: webSocket.error,
        audioLevel: audioRecording.audioLevel,
        outputAudioLevel: audioPlayback.outputAudioLevel,
        connect,
        disconnect,
        startRecording,
        stopRecording,
        sendText,
        triggerAutoStart,
    };
}