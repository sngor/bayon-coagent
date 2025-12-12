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
    audioLevel: number;
    outputAudioLevel: number;
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
    const [audioLevel, setAudioLevel] = useState(0);
    const [outputAudioLevel, setOutputAudioLevel] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<any>(null);
    const audioQueueRef = useRef<Int16Array[]>([]);
    const isPlayingRef = useRef(false);
    const audioBufferRef = useRef<Int16Array[]>([]);
    const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastChunkTimeRef = useRef<number>(0);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const continuousAudioRef = useRef<Int16Array>(new Int16Array(0));
    const playbackPositionRef = useRef<number>(0);
    const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isRecordingRef = useRef(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5; // Increased attempts
    const reconnectDelay = 5000; // Longer delay to avoid overwhelming the server
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

    // Smart buffering - collect chunks and play them as larger segments
    const bufferAudioChunk = useCallback((audioData: Int16Array) => {
        // Add chunk to buffer queue
        audioBufferRef.current.push(audioData);
        lastChunkTimeRef.current = Date.now();

        console.log('🎵 Added audio chunk:', audioData.length, 'samples. Queue length:', audioBufferRef.current.length);

        // Clear existing timeout
        if (playbackTimeoutRef.current) {
            clearTimeout(playbackTimeoutRef.current);
        }

        // Real-time streaming strategy:
        // - Start playing quickly with small buffers
        // - Continue playing in smaller chunks for smoother audio
        const bufferLength = audioBufferRef.current.length;
        let waitTime = 80; // Faster default

        if (isPlayingRef.current) {
            // Already playing - let it continue, but check if we should play next batch soon
            if (bufferLength >= 15) {
                // Queue is getting large - prepare next batch
                console.log('🎵 Large queue building, will play next batch soon. Queued:', bufferLength);
                setTimeout(() => {
                    if (audioBufferRef.current.length >= 10 && !isPlayingRef.current) {
                        playBufferedAudio();
                    }
                }, 100);
            }
            return;
        } else if (bufferLength >= 3) {
            // Small buffer - play immediately for low latency
            waitTime = 0;
        } else if (bufferLength >= 2) {
            // Minimal buffer - very short wait
            waitTime = 20;
        } else if (bufferLength >= 1) {
            // Single chunk - short wait to see if more arrive
            waitTime = 40;
        }

        // Set timeout to play buffered audio (only if not already playing)
        playbackTimeoutRef.current = setTimeout(() => {
            if (audioBufferRef.current.length > 0 && !isPlayingRef.current) {
                playBufferedAudio();
            }
        }, waitTime);
    }, []);

    // Play buffered audio chunks as one smooth segment
    const playBufferedAudio = useCallback(async () => {
        if (audioBufferRef.current.length === 0) return;

        // If already playing, don't start another playback - let the onended callback handle it
        if (isPlayingRef.current && audioSourceRef.current) {
            console.log('⏳ Audio already playing, letting onended callback handle queue');
            return;
        }

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
                console.log('🔊 Audio playback context created with sample rate:', audioContextRef.current.sampleRate);
            }

            const audioContext = audioContextRef.current;

            // Resume audio context if suspended
            if (audioContext.state === 'suspended') {
                console.log('🔊 Resuming suspended audio context...');
                await audioContext.resume();
                console.log('🔊 Audio context resumed, new state:', audioContext.state);
            }

            // Combine all buffered chunks into one continuous audio stream
            const totalSamples = audioBufferRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
            const combinedAudio = new Int16Array(totalSamples);
            let offset = 0;

            for (const chunk of audioBufferRef.current) {
                combinedAudio.set(chunk, offset);
                offset += chunk.length;
            }

            // Clear the buffer and track what we're playing
            const chunksPlayed = audioBufferRef.current.length;
            audioBufferRef.current = [];

            // Skip very small audio chunks that might cause pops
            if (combinedAudio.length < 240) { // Less than 10ms at 24kHz
                console.log('🔇 Skipping very small audio chunk:', combinedAudio.length, 'samples');
                return;
            }

            // Create audio buffer with proper sample rate (Gemini sends 24kHz)
            const sampleRate = 24000;
            const audioBuffer = audioContext.createBuffer(1, combinedAudio.length, sampleRate);
            const channelData = audioBuffer.getChannelData(0);

            // Convert Int16 to Float32 for Web Audio API
            for (let i = 0; i < combinedAudio.length; i++) {
                channelData[i] = combinedAudio[i] / (combinedAudio[i] < 0 ? 32768 : 32767);
            }

            // Calculate output audio level for waveform visualization
            let outputSum = 0;
            for (let i = 0; i < channelData.length; i++) {
                outputSum += Math.abs(channelData[i]);
            }
            const outputLevel = Math.min(1, (outputSum / channelData.length) * 5); // Amplify for better visualization
            setOutputAudioLevel(outputLevel);

            // No fade effects - keep audio pure to avoid artifacts

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;

            // Direct connection for cleanest audio
            source.connect(audioContext.destination);

            source.onended = () => {
                audioSourceRef.current = null;

                // Always reset playing state first
                isPlayingRef.current = false;

                // Check if there are more chunks to play with minimal delay
                if (audioBufferRef.current.length > 0) {
                    console.log('🔄 Continuing audio playback - more chunks available:', audioBufferRef.current.length);
                    // Play next segment with minimal delay for seamless audio
                    setTimeout(() => playBufferedAudio(), 1);
                } else {
                    // No more audio - stop speaking
                    console.log('🛑 Audio playback complete - no more chunks');
                    setIsSpeaking(false);
                    setOutputAudioLevel(0);
                }
            };

            setIsSpeaking(true);
            isPlayingRef.current = true;
            audioSourceRef.current = source;
            source.start();

            console.log('🎵 Playing combined audio:', combinedAudio.length, 'samples from', chunksPlayed, 'chunks. Queue remaining:', audioBufferRef.current.length);
            console.log('🔊 Audio context state:', audioContext.state, 'Sample rate:', audioContext.sampleRate);

        } catch (error) {
            console.error('❌ Error playing buffered audio:', error);
            setIsSpeaking(false);
            isPlayingRef.current = false;
            audioBufferRef.current = []; // Clear buffer on error
        }
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

        // Use v1alpha endpoint for better stability
        const host = 'generativelanguage.googleapis.com';
        const path = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
        const url = `wss://${host}${path}?key=${apiKey}`;

        console.log('� Connectineg to Gemini Live WebSocket...');
        console.log('� APII Key length:', apiKey.length);
        console.log('🔑 API Key starts with:', apiKey.substring(0, 10) + '...');
        console.log('🌐 Full WebSocket URL (masked):', url.replace(apiKey, 'API_KEY_MASKED'));

        // Test if the URL is reachable first
        console.log('🧪 Testing WebSocket endpoint reachability...');

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

                const audioPartsCount = data.serverContent?.modelTurn?.parts?.filter((p: any) =>
                    p.inlineData && p.inlineData.mimeType.startsWith('audio/')
                ).length || 0;

                console.log('📥 Received message from Gemini Live:',
                    data.serverContent ? `Audio response ${audioPartsCount}` : 'Setup response');

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

                                // Always buffer audio chunks for smooth playback
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
            console.error('🔍 Debug info:');
            console.error('  - WebSocket URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));
            console.error('  - API Key length:', apiKey.length);
            console.error('  - WebSocket readyState:', ws.readyState);
            console.error('  - Navigator online:', navigator.onLine);

            // Simple error handling - let reconnection logic handle retries
            let errorMessage = 'Connection error occurred. ';
            if (!navigator.onLine) {
                errorMessage += 'No internet connection.';
            } else {
                errorMessage += 'Will attempt to reconnect...';
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
    }, [bufferAudioChunk, attemptReconnect, testApiKey]);

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
        audioBufferRef.current = [];
        isPlayingRef.current = false;

        // Stop any currently playing audio
        if (audioSourceRef.current) {
            try {
                audioSourceRef.current.stop();
            } catch (e) {
                // Audio source might already be stopped
            }
            audioSourceRef.current = null;
        }

        // Clear playback timeout
        if (playbackTimeoutRef.current) {
            clearTimeout(playbackTimeoutRef.current);
            playbackTimeoutRef.current = null;
        }

        // Clear streaming interval if it exists
        if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
            streamingIntervalRef.current = null;
        }

        // Reset continuous audio buffer
        continuousAudioRef.current = new Int16Array(0);
        playbackPositionRef.current = 0;

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
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });

            mediaStreamRef.current = stream;

            // Create audio context with default sample rate (usually 44.1kHz or 48kHz)
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);

            console.log('🎤 Audio context sample rate:', audioContext.sampleRate);

            // Use larger buffer size for more stable processing
            // Note: createScriptProcessor is deprecated but still widely supported
            // TODO: Migrate to AudioWorklet for better performance in the future
            const processor = audioContext.createScriptProcessor(8192, 1, 1);

            let audioBuffer: Float32Array[] = [];
            let bufferCount = 0;
            const BUFFER_SIZE = 3; // Reduced buffer size for lower latency while maintaining stability

            const processAudioData = (inputData: Float32Array) => {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isRecordingRef.current) return;

                // Calculate audio level for waveform visualization
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += Math.abs(inputData[i]);
                }
                const level = Math.min(1, (sum / inputData.length) * 10); // Amplify for better visualization
                setAudioLevel(level);

                audioBuffer.push(new Float32Array(inputData));
                bufferCount++;

                // Only send audio every few buffers to reduce WebSocket load
                if (bufferCount < BUFFER_SIZE) return;

                // Combine buffered audio
                const totalLength = audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
                const combinedData = new Float32Array(totalLength);
                let offset = 0;

                for (const buf of audioBuffer) {
                    combinedData.set(buf, offset);
                    offset += buf.length;
                }

                // Reset buffer
                audioBuffer = [];
                bufferCount = 0;

                // Apply noise gate to reduce background noise
                const noiseGateThreshold = 0.01;
                for (let i = 0; i < combinedData.length; i++) {
                    if (Math.abs(combinedData[i]) < noiseGateThreshold) {
                        combinedData[i] = 0;
                    }
                }

                // Resample from browser's sample rate to 16kHz for Gemini
                const targetSampleRate = 16000;
                const sourceSampleRate = audioContext.sampleRate;
                const resampleRatio = targetSampleRate / sourceSampleRate;
                const targetLength = Math.floor(combinedData.length * resampleRatio);
                const resampledData = new Float32Array(targetLength);

                // Improved resampling with anti-aliasing
                for (let i = 0; i < targetLength; i++) {
                    const sourceIndex = i / resampleRatio;
                    const index = Math.floor(sourceIndex);
                    const fraction = sourceIndex - index;

                    if (index + 1 < combinedData.length) {
                        // Linear interpolation with bounds checking
                        resampledData[i] = combinedData[index] * (1 - fraction) + combinedData[index + 1] * fraction;
                    } else if (index < combinedData.length) {
                        resampledData[i] = combinedData[index];
                    } else {
                        resampledData[i] = 0;
                    }
                }

                const int16Data = float32ToInt16(resampledData);

                // Convert to base64 with error handling
                try {
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

                            try {
                                wsRef.current.send(JSON.stringify(message));
                            } catch (sendError) {
                                console.warn('⚠️ Failed to send audio data:', sendError);
                            }
                        }
                    };
                    reader.onerror = () => {
                        console.warn('⚠️ Failed to convert audio to base64');
                    };
                    reader.readAsDataURL(blob);
                } catch (error) {
                    console.warn('⚠️ Error processing audio buffer:', error);
                }
            };

            processor.onaudioprocess = (e: any) => {
                const inputData = e.inputBuffer.getChannelData(0);
                processAudioData(inputData);
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
        setAudioLevel(0);

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

    // Connection health check - disabled to reduce WebSocket load
    useEffect(() => {
        if (!isConnected || !wsRef.current) return;

        // Reduced frequency health check to avoid overloading the connection
        const healthCheckInterval = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.CLOSED) {
                console.log('💔 Health check detected closed connection');
                setIsConnected(false);
                if (apiKeyRef.current && configRef.current) {
                    attemptReconnect();
                }
            }
        }, 60000); // Check every 60 seconds instead of 30

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
        audioLevel,
        outputAudioLevel,
        connect,
        disconnect,
        startRecording,
        stopRecording,
        sendText,
    };
}