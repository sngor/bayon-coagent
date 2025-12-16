'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export interface AudioPlaybackState {
    isSpeaking: boolean;
    outputAudioLevel: number;
    error: string | null;
}

export function useAudioPlayback() {
    const [state, setState] = useState<AudioPlaybackState>({
        isSpeaking: false,
        outputAudioLevel: 0,
        error: null
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<Int16Array[]>([]);
    const isPlayingRef = useRef(false);
    const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const updateState = useCallback((updates: Partial<AudioPlaybackState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Queue audio for playback with smart buffering
    const queueAudio = useCallback((audioData: Int16Array) => {
        if (audioData.length === 0) return;

        audioQueueRef.current.push(audioData);

        // Clear existing timeout
        if (playbackTimeoutRef.current) {
            clearTimeout(playbackTimeoutRef.current);
        }

        // If already playing, let current playback finish
        if (isPlayingRef.current) {
            return;
        }

        // Smart buffering strategy
        const queueLength = audioQueueRef.current.length;
        let waitTime = 0;

        if (queueLength >= 8) {
            waitTime = 0; // Play immediately for good quality
        } else if (queueLength >= 5) {
            waitTime = 25; // Very short wait
        } else if (queueLength >= 3) {
            waitTime = 75; // Short wait for more chunks
        } else {
            waitTime = 150; // Wait longer to accumulate more audio
        }

        playbackTimeoutRef.current = setTimeout(() => {
            if (audioQueueRef.current.length > 0 && !isPlayingRef.current) {
                playQueuedAudio();
            }
        }, waitTime);
    }, []);

    // Play queued audio chunks as smooth segments
    const playQueuedAudio = useCallback(async () => {
        if (audioQueueRef.current.length === 0 || isPlayingRef.current) {
            return;
        }

        try {
            // Initialize audio context if needed
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }

            const audioContext = audioContextRef.current;

            // Resume if suspended
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Combine queued chunks
            const totalSamples = audioQueueRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
            const combinedAudio = new Int16Array(totalSamples);
            let offset = 0;

            for (const chunk of audioQueueRef.current) {
                combinedAudio.set(chunk, offset);
                offset += chunk.length;
            }

            // Clear queue
            const chunksPlayed = audioQueueRef.current.length;
            audioQueueRef.current = [];

            // Skip very small chunks to prevent artifacts
            if (combinedAudio.length < 480) { // Less than 20ms at 24kHz
                return;
            }

            // Create audio buffer (Gemini sends 24kHz)
            const sampleRate = 24000;
            const audioBuffer = audioContext.createBuffer(1, combinedAudio.length, sampleRate);
            const channelData = audioBuffer.getChannelData(0);

            // Convert Int16 to Float32 with improved precision
            for (let i = 0; i < combinedAudio.length; i++) {
                const sample = combinedAudio[i];
                channelData[i] = sample / (sample < 0 ? 32768 : 32767);
            }

            // Calculate output level for visualization
            let outputSum = 0;
            for (let i = 0; i < channelData.length; i++) {
                outputSum += Math.abs(channelData[i]);
            }
            const outputLevel = Math.min(1, (outputSum / channelData.length) * 5);
            updateState({ outputAudioLevel: outputLevel });

            // Create and configure audio source
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            // Handle playback completion
            source.onended = () => {
                currentSourceRef.current = null;
                isPlayingRef.current = false;

                // Continue with next queued audio
                if (audioQueueRef.current.length > 0) {
                    playQueuedAudio();
                } else {
                    updateState({
                        isSpeaking: false,
                        outputAudioLevel: 0
                    });
                }
            };

            // Start playback
            updateState({ isSpeaking: true });
            isPlayingRef.current = true;
            currentSourceRef.current = source;
            source.start();

            // Log for debugging large segments
            if (chunksPlayed > 50) {
                console.log(`🎵 Playing audio segment: ${combinedAudio.length} samples from ${chunksPlayed} chunks`);
            }

        } catch (error) {
            console.error('Error playing audio:', error);
            updateState({
                error: 'Audio playback failed',
                isSpeaking: false,
                outputAudioLevel: 0
            });
            isPlayingRef.current = false;
            audioQueueRef.current = [];
        }
    }, [updateState]);

    // Stop current playback
    const stopPlayback = useCallback(() => {
        if (currentSourceRef.current) {
            try {
                currentSourceRef.current.stop();
            } catch (error) {
                // Source might already be stopped
            }
            currentSourceRef.current = null;
        }

        if (playbackTimeoutRef.current) {
            clearTimeout(playbackTimeoutRef.current);
            playbackTimeoutRef.current = null;
        }

        audioQueueRef.current = [];
        isPlayingRef.current = false;

        updateState({
            isSpeaking: false,
            outputAudioLevel: 0,
            error: null
        });
    }, [updateState]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopPlayback();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [stopPlayback]);

    return {
        ...state,
        queueAudio,
        stopPlayback,
    };
}