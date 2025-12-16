'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
    audioToBase64,
    getMicrophoneErrorMessage,
    DEFAULT_AUDIO_CONFIG
} from '@/lib/audio-utils';

// ... (previous interfaces and types remain the same)

// Memoized audio processor for better performance
const useAudioProcessor = () => {
    return useMemo(() => ({
        async convertBase64ToInt16Array(base64Data: string): Promise<Int16Array> {
            const binaryString = window.atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);

            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            return new Int16Array(bytes.buffer);
        },

        combineAudioChunks(chunks: Int16Array[]): Int16Array {
            const totalSamples = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const combinedAudio = new Int16Array(totalSamples);
            let offset = 0;

            for (const chunk of chunks) {
                combinedAudio.set(chunk, offset);
                offset += chunk.length;
            }

            return combinedAudio;
        },

        calculateAudioLevel(channelData: Float32Array): number {
            let outputSum = 0;
            for (let i = 0; i < channelData.length; i++) {
                outputSum += Math.abs(channelData[i]);
            }
            return Math.min(1, (outputSum / channelData.length) * 5);
        },

        convertInt16ToFloat32(int16Data: Int16Array): Float32Array {
            const float32Data = new Float32Array(int16Data.length);
            for (let i = 0; i < int16Data.length; i++) {
                const sample = int16Data[i];
                float32Data[i] = sample / (sample < 0 ? 32768 : 32767);
            }
            return float32Data;
        }
    }), []);
};

// Custom hook for WebSocket message handling with better error boundaries
const useWebSocketMessageHandler = (
    config: GeminiLiveConfig | null,
    bufferAudioChunk: (data: Int16Array) => void
) => {
    const audioProcessor = useAudioProcessor();

    return useCallback(async (event: MessageEvent) => {
        try {
            let data;
            if (event.data instanceof Blob) {
                data = JSON.parse(await event.data.text());
            } else {
                data = JSON.parse(event.data);
            }

            // Call user-provided message handler first
            if (config?.onMessage) {
                try {
                    config.onMessage(data);
                } catch (error) {
                    console.warn('⚠️ Error in user message handler:', error);
                }
            }

            // Process audio data
            if (data.serverContent?.modelTurn?.parts) {
                const audioPromises = data.serverContent.modelTurn.parts
                    .filter((part: any) => part.inlineData && part.inlineData.mimeType.startsWith('audio/'))
                    .map(async (part: any) => {
                        try {
                            const int16Array = await audioProcessor.convertBase64ToInt16Array(part.inlineData.data);
                            bufferAudioChunk(int16Array);
                        } catch (e) {
                            console.error('❌ Error processing audio part:', e);
                        }
                    });

                // Process audio parts in parallel
                await Promise.allSettled(audioPromises);
            }
        } catch (e) {
            console.error('❌ Error parsing WebSocket message:', e);
        }
    }, [config, bufferAudioChunk, audioProcessor]);
};

// Debounced audio level updates for better performance
const useDebouncedAudioLevel = (audioLevel: number, delay: number = 16) => {
    const [debouncedLevel, setDebouncedLevel] = useState(audioLevel);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setDebouncedLevel(audioLevel);
        }, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [audioLevel, delay]);

    return debouncedLevel;
};

// Enhanced error handling with retry logic
const useConnectionErrorHandler = () => {
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;

    const handleError = useCallback((error: Error | string, shouldRetry: boolean = true) => {
        const errorMessage = typeof error === 'string' ? error : error.message;

        if (shouldRetry && retryCount < maxRetries) {
            setRetryCount(prev => prev + 1);
            return { shouldRetry: true, message: `${errorMessage} (Retry ${retryCount + 1}/${maxRetries})` };
        }

        setRetryCount(0);
        return { shouldRetry: false, message: errorMessage };
    }, [retryCount, maxRetries]);

    const resetRetryCount = useCallback(() => {
        setRetryCount(0);
    }, []);

    return { handleError, resetRetryCount, retryCount };
};

export function useGeminiLive(): GeminiLiveHookReturn {
    // ... (state and refs remain similar but with performance optimizations)

    // Use debounced audio levels for smoother UI updates
    const [rawAudioLevel, setRawAudioLevel] = useState(0);
    const [rawOutputAudioLevel, setRawOutputAudioLevel] = useState(0);
    const audioLevel = useDebouncedAudioLevel(rawAudioLevel);
    const outputAudioLevel = useDebouncedAudioLevel(rawOutputAudioLevel);

    // Enhanced error handling
    const errorHandler = useConnectionErrorHandler();

    // Memoized WebSocket URL to prevent unnecessary reconnections
    const getWebSocketUrl = useCallback((apiKey: string) => {
        return `wss://${GEMINI_WEBSOCKET_HOST}${GEMINI_WEBSOCKET_PATH}?key=${apiKey}`;
    }, []);

    // Optimized message handler
    const messageHandler = useWebSocketMessageHandler(configRef.current, bufferAudioChunk);

    // ... (rest of the implementation with performance optimizations)

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