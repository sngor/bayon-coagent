'use client';

import { useRef, useState, useCallback } from 'react';
import { AudioResampler } from '@/lib/audio-buffer-manager';
import { getVoiceConfig } from '@/lib/voice-config';

export interface AudioRecordingState {
    isRecording: boolean;
    audioLevel: number;
    error: string | null;
}

export function useAudioRecording(onAudioData?: (data: Int16Array) => void) {
    const [state, setState] = useState<AudioRecordingState>({
        isRecording: false,
        audioLevel: 0,
        error: null
    });

    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<any>(null);
    const isRecordingRef = useRef(false);

    const voiceConfig = getVoiceConfig();

    const updateState = useCallback((updates: Partial<AudioRecordingState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    const processAudioData = useCallback((inputData: Float32Array) => {
        if (!isRecordingRef.current || !onAudioData) return;

        // Calculate audio level for visualization
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
        }
        const level = Math.min(1, (sum / inputData.length) * 10);
        updateState({ audioLevel: level });

        // Apply noise gate
        for (let i = 0; i < inputData.length; i++) {
            if (Math.abs(inputData[i]) < voiceConfig.noiseGateThreshold) {
                inputData[i] = 0;
            }
        }

        // Resample to target sample rate
        const resampledData = AudioResampler.resample(
            inputData,
            audioContextRef.current?.sampleRate || 44100,
            voiceConfig.sampleRate
        );

        const int16Data = AudioResampler.float32ToInt16(resampledData);
        onAudioData(int16Data);
    }, [onAudioData, updateState, voiceConfig]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });

            mediaStreamRef.current = stream;

            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(voiceConfig.bufferSize, 1, 1);

            processor.onaudioprocess = (e: any) => {
                const inputData = e.inputBuffer.getChannelData(0);
                processAudioData(inputData);
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            processorRef.current = processor;
            isRecordingRef.current = true;

            updateState({ isRecording: true, error: null });
        } catch (err: any) {
            const errorMessage = getRecordingErrorMessage(err);
            updateState({ error: errorMessage });
        }
    }, [processAudioData, updateState, voiceConfig]);

    const stopRecording = useCallback(() => {
        isRecordingRef.current = false;
        updateState({ isRecording: false, audioLevel: 0 });

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (processorRef.current) {
            processorRef.current.disconnect?.();
            processorRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }, [updateState]);

    return {
        ...state,
        startRecording,
        stopRecording,
    };
}

function getRecordingErrorMessage(err: any): string {
    switch (err.name) {
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
            return err.message || 'Failed to access microphone';
    }
}