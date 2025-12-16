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

export function useGeminiLive(): GeminiLiveHookReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [outputAudioLevel, setOutputAudioLevel] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<any>(null);
    const audioBufferRef = useRef<Int16Array[]>([]);
    const isPlayingRef = useRef(false);
    const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const isRecordingRef = useRef(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const configRef = useRef<GeminiLiveConfig | null>(null);
    const apiKeyRef = useRef<string | null>(null);
    const autoStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasAutoStartedRef = useRef(false);

    const maxReconnectAttempts = 5;
    const reconnectDelay = 5000;

    const sendAudioData = useCallback(async (int16Data: Int16Array) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
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
            wsRef.current.send(JSON.stringify(message));
        } catch (error) {
            console.warn('⚠️ Error processing audio buffer:', error);
        }
    }, []);

    const bufferAudioChunk = useCallback((audioData: Int16Array) => {
        if (audioData.length === 0) return;

        audioBufferRef.current.push(audioData);

        if (playbackTimeoutRef.current) {
            clearTimeout(playbackTimeoutRef.current);
        }

        if (isPlayingRef.current) return;

        const waitTime = audioBufferRef.current.length >= 2 ? 0 : 50;

        playbackTimeoutRef.current = setTimeout(() => {
            if (audioBufferRef.current.length > 0 && !isPlayingRef.current) {
                playBufferedAudio();
            }
        }, waitTime);
    }, []);

    const playBufferedAudio = useCallback(async () => {
        if (audioBufferRef.current.length === 0 || isPlayingRef.current) return;

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }

            const audioContext = audioContextRef.current;

            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            const chunksToPlay = [...audioBufferRef.current];
            audioBufferRef.current = [];

            const totalSamples = chunksToPlay.reduce((sum, chunk) => sum + chunk.length, 0);
            const combinedAudio = new Int16Array(totalSamples);
            let offset = 0;

            for (const chunk of chunksToPlay) {
                combinedAudio.set(chunk, offset);
                offset += chunk.length;
            }

            if (combinedAudio.length < 240) return;

            const sampleRate = 24000;
            const audioBuffer = audioContext.createBuffer(1, combinedAudio.length, sampleRate);
            const channelData = audioBuffer.getChannelData(0);

            for (let i = 0; i < combinedAudio.length; i++) {
                const sample = combinedAudio[i];
                channelData[i] = sample / (sample < 0 ? 32768 : 32767);
            }

            let outputSum = 0;
            for (let i = 0; i < channelData.length; i++) {
                outputSum += Math.abs(channelData[i]);
            }
            const outputLevel = Math.min(1, (outputSum / channelData.length) * 5);
            setOutputAudioLevel(outputLevel);

            if (audioSourceRef.current) {
                try {
                    audioSourceRef.current.stop();
                } catch (e) {
                    // Source might already be stopped
                }
            }

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            source.onended = () => {
                audioSourceRef.current = null;
                isPlayingRef.current = false;

                if (audioBufferRef.current.length > 0) {
                    setTimeout(() => playBufferedAudio(), 0);
                } else {
                    setIsSpeaking(false);
                    setOutputAudioLevel(0);
                }
            };

            setIsSpeaking(true);
            isPlayingRef.current = true;
            audioSourceRef.current = source;
            source.start();

        } catch (error) {
            console.error('❌ Error playing buffered audio:', error);
            setIsSpeaking(false);
            isPlayingRef.current = false;
            audioBufferRef.current = [];
        }
    }, []);

    const sendTextMessage = useCallback((text: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
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

        wsRef.current.send(JSON.stringify(message));
        console.log('📤 Sent text message:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        return true;
    }, []);

    const attemptReconnect = useCallback(() => {
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            setError('Connection failed after multiple attempts. Please check your API key and try again.');
            return;
        }

        reconnectAttemptsRef.current += 1;
        setError(`Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

        reconnectTimeoutRef.current = setTimeout(async () => {
            if (apiKeyRef.current && configRef.current) {
                await connect(apiKeyRef.current, configRef.current);
            }
        }, reconnectDelay);
    }, []);

    const connectWebSocket = useCallback(async (apiKey: string, config?: GeminiLiveConfig) => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        const host = 'generativelanguage.googleapis.com';
        const path = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
        const url = `wss://${host}${path}?key=${apiKey}`;

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('✅ Gemini Live WebSocket connected successfully');
            setIsConnected(true);
            setConnectionState('connected');
            setError(null);
            reconnectAttemptsRef.current = 0;
            hasAutoStartedRef.current = false;

            const modelToUse = config?.model || 'models/gemini-2.5-flash-native-audio-preview-12-2025';
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

            if (config?.autoStartMessage && !hasAutoStartedRef.current) {
                const delay = config.autoStartDelay || 1000;
                autoStartTimeoutRef.current = setTimeout(() => {
                    if (ws.readyState === WebSocket.OPEN && !hasAutoStartedRef.current && config.autoStartMessage) {
                        sendTextMessage(config.autoStartMessage);
                        hasAutoStartedRef.current = true;
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
                                const binaryString = window.atob(base64Data);
                                const len = binaryString.length;
                                const bytes = new Uint8Array(len);
                                for (let i = 0; i < len; i++) {
                                    bytes[i] = binaryString.charCodeAt(i);
                                }
                                const int16Array = new Int16Array(bytes.buffer);
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
            setConnectionState('error');
            setError('Connection error occurred. Will attempt to reconnect...');
        };

        ws.onclose = (e) => {
            console.log('🔌 Gemini Live WebSocket closed');
            setIsConnected(false);
            setConnectionState('disconnected');
            setIsRecording(false);
            setIsSpeaking(false);

            if (e.code !== 1000) {
                let errorMessage = 'Connection lost. ';
                switch (e.code) {
                    case 1006:
                        errorMessage += 'Network connection interrupted.';
                        break;
                    case 4001:
                        errorMessage += 'Invalid API key or authentication failed.';
                        break;
                    case 4003:
                        errorMessage += 'API quota exceeded or rate limited.';
                        break;
                    default:
                        errorMessage += `Error code: ${e.code}`;
                }

                setError(errorMessage);

                if (e.code !== 4001 && e.code !== 4003 && apiKeyRef.current && configRef.current) {
                    setTimeout(() => attemptReconnect(), 100);
                }
            }
        };
    }, [bufferAudioChunk, attemptReconnect, sendTextMessage]);

    const connect = useCallback(async (apiKey: string, config?: GeminiLiveConfig) => {
        try {
            setError(null);
            setConnectionState('connecting');
            apiKeyRef.current = apiKey;
            configRef.current = config || {};
            await connectWebSocket(apiKey, config);
        } catch (err: any) {
            console.error('❌ Failed to connect to Gemini Live:', err);
            setError(err.message || 'Failed to connect');
            setIsConnected(false);
            setConnectionState('error');
        }
    }, [connectWebSocket]);

    const cleanupResources = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (autoStartTimeoutRef.current) {
            clearTimeout(autoStartTimeoutRef.current);
            autoStartTimeoutRef.current = null;
        }

        if (playbackTimeoutRef.current) {
            clearTimeout(playbackTimeoutRef.current);
            playbackTimeoutRef.current = null;
        }

        if (mediaStreamRef.current) {
            try {
                mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => {
                    track.stop();
                });
            } catch (e) {
                console.warn('Error stopping media stream:', e);
            }
            mediaStreamRef.current = null;
        }

        if (processorRef.current) {
            try {
                if (typeof processorRef.current.disconnect === 'function') {
                    processorRef.current.disconnect();
                }
            } catch (e) {
                console.warn('Error disconnecting audio processor:', e);
            }
            processorRef.current = null;
        }

        if (audioSourceRef.current) {
            try {
                audioSourceRef.current.stop();
                audioSourceRef.current.disconnect();
            } catch (e) {
                console.warn('Error stopping audio source:', e);
            }
            audioSourceRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try {
                audioContextRef.current.close();
            } catch (e) {
                console.warn('Error closing audio context:', e);
            }
            audioContextRef.current = null;
        }

        audioBufferRef.current = [];
        isPlayingRef.current = false;
        isRecordingRef.current = false;
        hasAutoStartedRef.current = false;

        setIsRecording(false);
        setIsSpeaking(false);
        setAudioLevel(0);
        setOutputAudioLevel(0);
    }, []);

    const disconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        apiKeyRef.current = null;
        configRef.current = null;

        if (wsRef.current) {
            try {
                wsRef.current.close(1000, 'Manual disconnect');
            } catch (e) {
                console.warn('Error closing WebSocket:', e);
            }
            wsRef.current = null;
        }

        cleanupResources();
        setConnectionState('disconnected');
        setIsConnected(false);
        setError(null);
    }, [cleanupResources]);

    const startRecording = useCallback(async () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setError('Not connected to Gemini Live');
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

            mediaStreamRef.current = stream;
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
                        setAudioLevel(data);
                    } else if (type === 'audioData') {
                        sendAudioData(data);
                    }
                };

                source.connect(workletNode);
                processorRef.current = workletNode;
            } catch (error) {
                console.warn('AudioWorklet not supported, using fallback implementation');
                setError('Modern audio processing not supported in this browser. Audio quality may be reduced.');
                return;
            }

            isRecordingRef.current = true;
            setIsRecording(true);
            setError(null);

        } catch (err: any) {
            console.error('❌ Failed to start recording:', err);
            setError(getMicrophoneErrorMessage(err));
        }
    }, [sendAudioData]);

    const stopRecording = useCallback(() => {
        isRecordingRef.current = false;
        setIsRecording(false);
        setAudioLevel(0);

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            mediaStreamRef.current = null;
        }

        if (processorRef.current) {
            if (typeof processorRef.current.disconnect === 'function') {
                processorRef.current.disconnect();
            }
            processorRef.current = null;
        }
    }, []);

    const sendText = useCallback((text: string) => {
        const success = sendTextMessage(text);
        if (!success) {
            setError('Not connected to Gemini Live');
        }
    }, [sendTextMessage]);

    const triggerAutoStart = useCallback(() => {
        const config = configRef.current;
        if (config?.autoStartMessage && wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('🎭 Manually triggering auto-start message');
            sendTextMessage(config.autoStartMessage);
            hasAutoStartedRef.current = true;
        }
    }, [sendTextMessage]);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected,
        isRecording,
        isSpeaking,
        connectionState,
        error,
        audioLevel,
        outputAudioLevel,
        connect,
        disconnect,
        startRecording,
        stopRecording,
        sendText,
        triggerAutoStart,
    };
}