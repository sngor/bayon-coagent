'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';

export interface GeminiLiveConfig {
    model?: string;
    systemInstruction?: string;
    responseModalities?: string[];
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

            // Minimal config to test connection
            const sessionConfig: any = {
                model: 'gemini-2.0-flash-exp',
            };

            console.log('Connecting to Gemini Live with minimal config...');
            console.log('Config:', JSON.stringify(sessionConfig, null, 2));

            // Manual WebSocket implementation to bypass SDK issues
            const host = 'generativelanguage.googleapis.com';
            const path = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
            const url = `wss://${host}${path}?key=${apiKey}`;

            console.log('Connecting to Gemini Live via manual WebSocket:', url);

            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('Gemini Live WebSocket opened');
                setIsConnected(true);

                // Send initial setup message
                const setupMessage = {
                    setup: {
                        model: config?.model || 'models/gemini-2.0-flash-exp',
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

                console.log('Sending setup message:', JSON.stringify(setupMessage, null, 2));
                ws.send(JSON.stringify(setupMessage));
            };

            ws.onmessage = async (event) => {
                try {
                    let data;
                    if (event.data instanceof Blob) {
                        data = JSON.parse(await event.data.text());
                    } else {
                        data = JSON.parse(event.data);
                    }

                    // console.log('Received message:', data);

                    // Call the onMessage callback if provided
                    if (config?.onMessage) {
                        config.onMessage(data);
                    }

                    // Handle serverContent (audio)
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

                                    if (isPlayingRef.current) {
                                        audioQueueRef.current.push(int16Array);
                                    } else {
                                        playAudioChunk(int16Array);
                                    }
                                } catch (e) {
                                    console.error('Error processing audio data:', e);
                                }
                            }
                        }
                    }

                    // Handle turnComplete
                    if (data.serverContent?.turnComplete) {
                        // console.log('Turn complete');
                    }
                } catch (e) {
                    console.error('Error parsing message:', e);
                }
            };

            ws.onerror = (e) => {
                console.error('Gemini Live WebSocket error:', e);
                setError('Connection failed. Please check your network connection and API key.');
                setIsConnected(false);
            };

            ws.onclose = (e) => {
                console.log('Gemini Live WebSocket closed. Code:', e.code, 'Reason:', e.reason);
                setIsConnected(false);
                setIsRecording(false);
                setIsSpeaking(false);
            };

            // Store the WebSocket instance in the ref (casting to any to match existing type)
            sessionRef.current = {
                close: () => ws.close(),
                sendRealtimeInput: (input: any) => {
                    if (ws.readyState === WebSocket.OPEN) {
                        const message: any = {
                            clientContent: {
                                turns: [{
                                    parts: []
                                }],
                                turnComplete: false
                            }
                        };

                        if (input.text) {
                            message.clientContent.turns[0].parts.push({ text: input.text });
                            message.clientContent.turnComplete = true;
                        } else if (input.audio) {
                            message.realtimeInput = {
                                mediaChunks: [{
                                    mimeType: input.audio.mimeType,
                                    data: input.audio.data
                                }]
                            };
                            delete message.clientContent;
                        }

                        ws.send(JSON.stringify(message));
                    }
                }
            };
        } catch (err: any) {
            console.error('Failed to connect to Gemini Live:', err);
            if (err instanceof Error) {
                console.error('Stack:', err.stack);
            }
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

                // Convert to base64 using FileReader (more efficient/robust)
                const blob = new Blob([int16Data.buffer as any], { type: 'application/octet-stream' });
                const reader = new FileReader();
                reader.onload = () => {
                    const base64String = (reader.result as string).split(',')[1];
                    if (sessionRef.current) {
                        sessionRef.current.sendRealtimeInput({
                            audio: {
                                data: base64String,
                                mimeType: 'audio/pcm;rate=16000',
                            },
                        });
                    }
                };
                reader.readAsDataURL(blob);
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
