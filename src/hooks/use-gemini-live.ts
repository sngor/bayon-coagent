'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

export interface GeminiLiveConfig {
    model?: string;
    systemInstruction?: string;
    responseModalities?: Modality[];
    voiceName?: string;
    onMessage?: (message: any) => void;
}

export interface GeminiLiveHookReturn {
    isConnected: boolean;
    isRecording: boolean;
    isSpeaking: boolean;
    error: string | null;
    connect: (apiKey: string, config?: GeminiLiveConfig) => Promise<void>;
    disconnect: () => void;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    sendText: (text: string) => void;
}

export function useGeminiLive(): GeminiLiveHookReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sessionRef = useRef<any>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const audioQueueRef = useRef<Int16Array[]>([]);
    const isPlayingRef = useRef(false);
    const isRecordingRef = useRef(false); // Track recording state in ref to avoid closure issues

    // Convert Float32Array to Int16Array (PCM 16-bit)
    const float32ToInt16 = useCallback((float32Array: Float32Array): Int16Array => {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return int16Array;
    }, []);

    // Play audio response
    const playAudioChunk = useCallback(async (audioData: Int16Array) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        }

        const audioContext = audioContextRef.current;
        const audioBuffer = audioContext.createBuffer(1, audioData.length, 24000);
        const channelData = audioBuffer.getChannelData(0);

        // Convert Int16 to Float32 for Web Audio API
        for (let i = 0; i < audioData.length; i++) {
            channelData[i] = audioData[i] / (audioData[i] < 0 ? 0x8000 : 0x7fff);
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        source.onended = () => {
            setIsSpeaking(false);
            isPlayingRef.current = false;
            // Play next chunk if available
            const nextChunk = audioQueueRef.current.shift();
            if (nextChunk) {
                playAudioChunk(nextChunk);
            }
        };

        setIsSpeaking(true);
        isPlayingRef.current = true;
        source.start();
    }, []);

    // Connect to Gemini Live API
    const connect = useCallback(async (apiKey: string, config?: GeminiLiveConfig) => {
        try {
            setError(null);

            const ai = new GoogleGenAI({ apiKey });

            const sessionConfig: any = {
                model: config?.model || 'gemini-2.0-flash-exp',
                config: {
                    responseModalities: config?.responseModalities || [Modality.AUDIO],
                    systemInstruction: config?.systemInstruction || 'You are a helpful assistant.',
                },
            };

            // Add voice configuration if provided
            if (config?.voiceName) {
                sessionConfig.config.speechConfig = {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: config.voiceName,
                        },
                    },
                };
            }

            const session = await ai.live.connect({
                ...sessionConfig,
                callbacks: {
                    onopen: () => {
                        console.log('Gemini Live session opened');
                        setIsConnected(true);
                    },
                    onmessage: (message: any) => {
                        console.log('Received message:', message);

                        // Call the onMessage callback if provided
                        if (config?.onMessage) {
                            config.onMessage(message);
                        }

                        // Handle audio response
                        if (message.data) {
                            const buffer = Buffer.from(message.data, 'base64');
                            const int16Array = new Int16Array(
                                buffer.buffer,
                                buffer.byteOffset,
                                buffer.byteLength / Int16Array.BYTES_PER_ELEMENT
                            );

                            if (isPlayingRef.current) {
                                audioQueueRef.current.push(int16Array);
                            } else {
                                playAudioChunk(int16Array);
                            }
                        }
                    },
                    onerror: (e: any) => {
                        console.error('Gemini Live error:', e);
                        setError(e.message || 'Connection error');
                        setIsConnected(false);
                    },
                    onclose: (e: any) => {
                        console.log('Gemini Live session closed:', e.reason);
                        setIsConnected(false);
                        setIsRecording(false);
                        setIsSpeaking(false);
                    },
                },
            });

            sessionRef.current = session;
        } catch (err: any) {
            console.error('Failed to connect to Gemini Live:', err);
            setError(err.message || 'Failed to connect');
            setIsConnected(false);
        }
    }, [playAudioChunk]);

    // Disconnect from Gemini Live API
    const disconnect = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        audioQueueRef.current = [];
        isPlayingRef.current = false;
        isRecordingRef.current = false;
        setIsConnected(false);
        setIsRecording(false);
        setIsSpeaking(false);
        setError(null);
    }, []);

    // Start recording audio from microphone
    const startRecording = useCallback(async () => {
        if (!sessionRef.current) {
            setError('Not connected to Gemini Live');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });

            mediaStreamRef.current = stream;

            // Create audio context for processing
            const audioContext = new AudioContext({ sampleRate: 16000 });
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
                if (!sessionRef.current || !isRecordingRef.current) return;

                const inputData = e.inputBuffer.getChannelData(0);
                const int16Data = float32ToInt16(inputData);
                const base64Audio = Buffer.from(int16Data.buffer).toString('base64');

                // Send audio chunk to Gemini Live
                sessionRef.current.sendRealtimeInput({
                    audio: {
                        data: base64Audio,
                        mimeType: 'audio/pcm;rate=16000',
                    },
                });
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            processorRef.current = processor;
            isRecordingRef.current = true;
            setIsRecording(true);
            setError(null);
        } catch (err: any) {
            console.error('Failed to start recording:', err);
            setError(err.message || 'Failed to access microphone');
        }
    }, [float32ToInt16]);

    // Stop recording
    const stopRecording = useCallback(() => {
        isRecordingRef.current = false;
        setIsRecording(false);

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
    }, []);

    // Send text message
    const sendText = useCallback((text: string) => {
        if (!sessionRef.current) {
            setError('Not connected to Gemini Live');
            return;
        }

        sessionRef.current.sendRealtimeInput({
            text: text,
        });
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected,
        isRecording,
        isSpeaking,
        error,
        connect,
        disconnect,
        startRecording,
        stopRecording,
        sendText,
    };
}
