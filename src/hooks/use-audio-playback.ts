'use client';

import { useRef, useState, useCallback } from 'react';
import { AudioBufferManager } from '@/lib/audio-buffer-manager';
import { getVoiceConfig } from '@/lib/voice-config';

export interface AudioPlaybackState {
    isSpeaking: boolean;
    outputAudioLevel: number;
}

export function useAudioPlayback() {
    const [state, setState] = useState<AudioPlaybackState>({
        isSpeaking: false,
        outputAudioLevel: 0
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const isPlayingRef = useRef(false);
    const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const voiceConfig = getVoiceConfig();
    const bufferManager = useRef(new AudioBufferManager({
        maxBufferSize: voiceConfig.bufferSize * 10,
        sampleRate: 24000, // Gemini sends 24kHz
        channelCount: 1,
        bufferDuration: 1000 // 1 second max buffer
    }));

    const updateState = useCallback((updates: Partial<AudioPlaybackState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    const playBufferedAudio = useCallback(async () => {
        const combinedAudio = bufferManager.current.getAndClearBuffer();
        if (!combinedAudio || combinedAudio.length < 240) return; // Skip very small chunks

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }

            const audioContext = audioContextRef.current;

            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Create audio buffer
            const audioBuffer = audioContext.createBuffer(1, combinedAudio.length, 24000);
            const channelData = audioBuffer.getChannelData(0);

            // Convert Int16 to Float32 and calculate output level
            let outputSum = 0;
            for (let i = 0; i < combinedAudio.length; i++) {
                channelData[i] = combinedAudio[i] / (combinedAudio[i] < 0 ? 32768 : 32767);
                outputSum += Math.abs(channelData[i]);
            }

            const outputLevel = Math.min(1, (outputSum / channelData.length) * 5);
            updateState({ outputAudioLevel: outputLevel });

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            source.onended = () => {
                audioSourceRef.current = null;
                isPlayingRef.current = false;

                // Check for more audio to play
                if (bufferManager.current.hasEnoughData(50)) {
                    setTimeout(() => playBufferedAudio(), 1);
                } else {
                    updateState({ isSpeaking: false, outputAudioLevel: 0 });
                }
            };

            updateState({ isSpeaking: true });
            isPlayingRef.current = true;
            audioSourceRef.current = source;
            source.start();

        } catch (error) {
            console.error('Error playing buffered audio:', error);
            updateState({ isSpeaking: false, outputAudioLevel: 0 });
            isPlayingRef.current = false;
            bufferManager.current.clear();
        }
    }, [updateState]);

    const bufferAudioChunk = useCallback((audioData: Int16Array) => {
        if (audioData.length === 0) return;

        bufferManager.current.addChunk(audioData);

        // Clear existing timeout
        if (playbackTimeoutRef.current) {
            clearTimeout(playbackTimeoutRef.current);
        }

        // If already playing, let current playback finish
        if (isPlayingRef.current) return;

        // Determine wait time based on buffer size
        const stats = bufferManager.current.getStats();
        let waitTime = 0;

        if (stats.bufferCount >= 8) {
            waitTime = 0;
        } else if (stats.bufferCount >= 5) {
            waitTime = 25;
        } else if (stats.bufferCount >= 3) {
            waitTime = 75;
        } else {
            waitTime = 150;
        }

        playbackTimeoutRef.current = setTimeout(() => {
            if (bufferManager.current.hasEnoughData() && !isPlayingRef.current) {
                playBufferedAudio();
            }
        }, waitTime);
    }, [playBufferedAudio]);

    const stopPlayback = useCallback(() => {
        if (audioSourceRef.current) {
            try {
                audioSourceRef.current.stop();
            } catch (e) {
                // Audio source might already be stopped
            }
            audioSourceRef.current = null;
        }

        if (playbackTimeoutRef.current) {
            clearTimeout(playbackTimeoutRef.current);
            playbackTimeoutRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        bufferManager.current.clear();
        isPlayingRef.current = false;
        updateState({ isSpeaking: false, outputAudioLevel: 0 });
    }, [updateState]);

    return {
        ...state,
        bufferAudioChunk,
        stopPlayback,
        getBufferStats: () => bufferManager.current.getStats(),
    };
}