'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

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

    const wsRef = useRef<WebSocket | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<any>(null);
    const audioQueueRef = useRef<Int16Array[]>([]);
    const isPlayingRef = useRef(false);
    const isRecordingRef = useRef(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 3; // Reduced for faster feedback
    const reconnectDelay = 2000; // Reduced delay
    const configRef = useRef<GeminiLiveConfig | null>(null);
    const apiKeyRef = useRef<string | null>(null);

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

    // Clear reconnection timeout
    const clearReconnectTimeout = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    // Attempt to reconnect
    const attemptReconnect = useCallback(() => {
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            setError('Connection failed after multiple attempts. Please check your API key and try again.');
            return;
        }

        reconnectAttemptsRef.current += 1;
        setError(`Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

        reconnectTimeoutRef.current = setTimeout(async () => {
            if (apiKeyRef.current && configRef.current) {
                await connectWebSocket(apiKeyRef.current, configRef.current);
            }
        }, reconnectDelay);
    }, []);

    // Test API key with a simple HTTP request
    const testApiKey = useCallback(async (apiKey: string): Promise<boolean> => {
        try {
            console.log('🧪 Testing API key validity...');

            // Test with a simple models list request
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                let errorMsg = 'API key test failed: ';
                switch (response.status) {
                    case 400:
                        errorMsg += 'Invalid request format';
                        break;
                    case 401:
                        errorMsg += 'Invalid API key or authentication failed';
                        break;
                    case 403:
                        errorMsg += 'API key does not have required permissions';
                        break;
                    case 429:
                        errorMsg += 'API quota exceeded or rate limited';
                        break;
                    default:
                        errorMsg += `HTTP ${response.status}`;
                }

                console.error('❌ API key test failed:', errorMsg);
                setError(errorMsg);
                return false;
            }

            const data = await response.json();
            console.log('✅ API key test successful');
            console.log('📋 Available models:', data.models?.slice(0, 5).map((m: any) => m.name) || 'No models listed');

            // Look for models that specifically support bidiGenerateContent (WebSocket live audio)
            const liveModels = data.models?.filter((m: any) =>
                m.supportedGenerationMethods?.includes('generateContent')
            ) || [];

            const bidiModels = data.models?.filter((m: any) =>
                m.supportedGenerationMethods?.includes('bidiGenerateContent') ||
                m.name.includes('live') ||
                m.name.includes('audio')
            ) || [];

            console.log('🎤 Live-compatible models found:', liveModels.map((m: any) => m.name));
            console.log('🔄 Bidi-compatible models found:', bidiModels.map((m: any) => m.name));

            // Log detailed info about each model's capabilities
            data.models?.forEach((model: any) => {
                if (model.name.includes('gemini-2.0')) {
                    console.log(`📋 ${model.name}:`, {
                        methods: model.supportedGenerationMethods,
                        inputTokenLimit: model.inputTokenLimit,
                        outputTokenLimit: model.outputTokenLimit
                    });
                }
            });

            // Store available models for fallback
            const availableGeminiModels = data.models?.filter((m: any) =>
                m.name.includes('gemini-2.0')
            ).map((m: any) => m.name) || [];

            if (availableGeminiModels.length > 0) {
                console.log('💾 Storing available Gemini models for fallback:', availableGeminiModels);
                // Store in a ref for later use
                (window as any).__availableGeminiModels = availableGeminiModels;
            }

            // Check if any models support bidiGenerateContent
            const hasBidiSupport = data.models?.some((m: any) =>
                m.supportedGenerationMethods?.includes('bidiGenerateContent')
            );

            if (!hasBidiSupport) {
                console.warn('⚠️ No models found with bidiGenerateContent support. Gemini Live may not be available with this API key.');
                console.log('💡 This might require early access or specific API permissions.');
            }

            return true;
        } catch (error) {
            console.error('❌ API key test error:', error);
            setError(`API key validation failed: ${error instanceof Error ? error.message : 'Network error'}`);
            return false;
        }
    }, []);

    // Create WebSocket connection
    const connectWebSocket = useCallback(async (apiKey: string, config?: GeminiLiveConfig) => {
        // Basic validation
        if (!apiKey || apiKey.trim() === '') {
            setError('No API key provided');
            return;
        }

        if (apiKey.length < 20) {
            setError('API key appears to be invalid (too short)');
            return;
        }

        if (!apiKey.startsWith('AIza')) {
            setError('API key format appears to be invalid (should start with AIza)');
            return;
        }

        // Test API key first
        const isValidKey = await testApiKey(apiKey);
        if (!isValidKey) {
            return; // Error already set by testApiKey
        }

        // Clean up existing connection
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        const host = 'generativelanguage.googleapis.com';
        const path = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
        const url = `wss://${host}${path}?key=${apiKey}`;

        console.log('🚀 Connecting to Gemini Live WebSocket...');
        console.log('📊 API Key length:', apiKey.length);
        console.log('🔑 API Key starts with:', apiKey.substring(0, 10) + '...');

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('✅ Gemini Live WebSocket connected successfully');
            setIsConnected(true);
            setError(null);
            reconnectAttemptsRef.current = 0;

            // Send initial setup message
            const setupMessage = {
                setup: {
                    model: config?.model || 'models/gemini-2.5-flash-native-audio-preview-09-2025',
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

            console.log('📤 Sending setup message to Gemini Live');
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

                console.log('📥 Received message from Gemini Live:', data.serverContent ? 'Audio response' : 'Setup response');

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
            console.error('🔍 Debug info:');
            console.error('  - WebSocket URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));
            console.error('  - API Key length:', apiKey.length);
            console.error('  - WebSocket readyState:', ws.readyState);
            console.error('  - Navigator online:', navigator.onLine);

            let errorMessage = 'Connection failed. ';
            if (!navigator.onLine) {
                errorMessage += 'No internet connection.';
            } else if (apiKey.length < 30) {
                errorMessage += 'API key may be invalid.';
            } else {
                errorMessage += 'Please check your API key and try again.';
            }

            setError(errorMessage);
        };

        ws.onclose = (e) => {
            console.log('🔌 Gemini Live WebSocket closed');
            console.log('  - Code:', e.code);
            console.log('  - Reason:', e.reason || 'No reason provided');

            setIsConnected(false);
            setIsRecording(false);
            setIsSpeaking(false);

            // Handle different close codes
            if (e.code !== 1000) { // 1000 = normal closure
                let errorMessage = 'Connection lost. ';
                switch (e.code) {
                    case 1006:
                        errorMessage += 'Network connection interrupted.';
                        break;
                    case 1011:
                        errorMessage += 'Server error occurred.';
                        break;
                    case 1012:
                        errorMessage += 'Service restarting.';
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

                console.log('❌ Connection error:', errorMessage);
                setError(errorMessage);

                // Only attempt reconnect if it wasn't an auth error
                if (e.code !== 4001 && e.code !== 4003 && apiKeyRef.current && configRef.current) {
                    console.log('🔄 Will attempt to reconnect...');
                    attemptReconnect();
                }
            }
        };
    }, [playAudioChunk, attemptReconnect, testApiKey]);

    // Connect to Gemini Live API
    const connect = useCallback(async (apiKey: string, config?: GeminiLiveConfig) => {
        try {
            console.log('🚀 Starting Gemini Live connection...');
            setError(null);

            // Store config and API key for reconnection
            apiKeyRef.current = apiKey;
            configRef.current = config || {};

            await connectWebSocket(apiKey, config);
        } catch (err: any) {
            console.error('❌ Failed to connect to Gemini Live:', err);
            setError(err.message || 'Failed to connect');
            setIsConnected(false);
        }
    }, [connectWebSocket]);

    // Disconnect from Gemini Live API
    const disconnect = useCallback(() => {
        console.log('🛑 Disconnecting from Gemini Live...');

        clearReconnectTimeout();
        reconnectAttemptsRef.current = 0;

        // Clear stored config
        apiKeyRef.current = null;
        configRef.current = null;

        if (wsRef.current) {
            wsRef.current.close(1000, 'Manual disconnect');
            wsRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (processorRef.current) {
            if (typeof processorRef.current.disconnect === 'function') {
                processorRef.current.disconnect();
            }
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
    }, [clearReconnectTimeout]);

    // Start recording audio from microphone
    const startRecording = useCallback(async () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setError('Not connected to Gemini Live');
            return;
        }

        try {
            console.log('🎤 Starting audio recording...');

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

            // Use ScriptProcessorNode (deprecated but widely supported)
            const processor = audioContext.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e: any) => {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isRecordingRef.current) return;

                const inputData = e.inputBuffer.getChannelData(0);
                const int16Data = float32ToInt16(inputData);

                // Convert to base64
                const blob = new Blob([int16Data.buffer as ArrayBuffer], { type: 'application/octet-stream' });
                const reader = new FileReader();
                reader.onload = () => {
                    const base64String = (reader.result as string).split(',')[1];
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        const message = {
                            realtimeInput: {
                                mediaChunks: [{
                                    mimeType: 'audio/pcm;rate=16000',
                                    data: base64String
                                }]
                            }
                        };
                        wsRef.current.send(JSON.stringify(message));
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

            console.log('✅ Audio recording started');
        } catch (err: any) {
            console.error('❌ Failed to start recording:', err);
            setError(err.message || 'Failed to access microphone');
        }
    }, [float32ToInt16]);

    // Stop recording
    const stopRecording = useCallback(() => {
        console.log('🛑 Stopping audio recording...');

        isRecordingRef.current = false;
        setIsRecording(false);

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (processorRef.current) {
            if (typeof processorRef.current.disconnect === 'function') {
                processorRef.current.disconnect();
            }
            processorRef.current = null;
        }
    }, []);

    // Send text message
    const sendText = useCallback((text: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setError('Not connected to Gemini Live');
            return;
        }

        console.log('📤 Sending text message:', text);

        const message = {
            clientContent: {
                turns: [{
                    parts: [{ text: text }]
                }],
                turnComplete: true
            }
        };

        wsRef.current.send(JSON.stringify(message));
    }, []);

    // Connection health check
    useEffect(() => {
        if (!isConnected || !wsRef.current) return;

        const healthCheckInterval = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                // Send a ping to keep connection alive
                try {
                    wsRef.current.send(JSON.stringify({ ping: Date.now() }));
                } catch (error) {
                    console.warn('⚠️ Failed to send ping:', error);
                }
            } else if (wsRef.current && wsRef.current.readyState === WebSocket.CLOSED) {
                // Connection is closed, attempt reconnect
                console.log('💔 Health check detected closed connection');
                setIsConnected(false);
                if (apiKeyRef.current && configRef.current) {
                    attemptReconnect();
                }
            }
        }, 30000); // Check every 30 seconds

        return () => clearInterval(healthCheckInterval);
    }, [isConnected, attemptReconnect]);

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