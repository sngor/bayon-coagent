'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

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
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const isRecordingRef = useRef(false);

    const updateState = useCallback((updates: Partial<AudioRecordingState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Modern AudioWorklet-based recording
    const startRecording = useCallback(async () => {
        try {
            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 48000, // Let browser choose, we'll resample
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });

            mediaStreamRef.current = stream;

            // Create audio context
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            // Load AudioWorklet processor (modern replacement for ScriptProcessor)
            try {
                await audioContext.audioWorklet.addModule('/audio-processor.js');
            } catch (error) {
                // Fallback to ScriptProcessor if AudioWorklet not available
                console.warn('AudioWorklet not available, falling back to ScriptProcessor');
                return startRecordingFallback(stream, audioContext);
            }

            const source = audioContext.createMediaStreamSource(stream);
            const workletNode = new AudioWorkletNode(audioContext, 'audio-processor');

            workletNodeRef.current = workletNode;

            // Handle processed audio data
            workletNode.port.onmessage = (event) => {
                const { audioData, audioLevel } = event.data;

                if (isRecordingRef.current && onAudioData) {
                    updateState({ audioLevel });
                    onAudioData(audioData);
                }
            };

            // Connect audio graph
            source.connect(workletNode);
            // Note: Don't connect to destination to avoid feedback

            isRecordingRef.current = true;
            updateState({ isRecording: true, error: null });

        } catch (error: any) {
            const errorMessage = getRecordingErrorMessage(error);
            updateState({ error: errorMessage });
        }
    }, [onAudioData, updateState]);

    // Fallback for browsers without AudioWorklet support
    const startRecordingFallback = useCallback((stream: MediaStream, audioContext: AudioContext) => {
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        let audioBuffer: Float32Array[] = [];
        let bufferCount = 0;
        const BUFFER_SIZE = 3;

        processor.onaudioprocess = (e) => {
            if (!isRecordingRef.current) return;

            const inputData = e.inputBuffer.getChannelData(0);

            // Calculate audio level
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
                sum += Math.abs(inputData[i]);
            }
            const level = Math.min(1, (sum / inputData.length) * 10);
            updateState({ audioLevel: level });

            // Buffer audio for processing
            audioBuffer.push(new Float32Array(inputData));
            bufferCount++;

            if (bufferCount >= BUFFER_SIZE) {
                processAudioBuffer(audioBuffer, audioContext.sampleRate);
                audioBuffer = [];
                bufferCount = 0;
            }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        isRecordingRef.current = true;
        updateState({ isRecording: true, error: null });
    }, [updateState]);

    // Process buffered audio data
    const processAudioBuffer = useCallback((buffer: Float32Array[], sampleRate: number) => {
        if (!onAudioData) return;

        // Combine buffer chunks
        const totalLength = buffer.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedData = new Float32Array(totalLength);
        let offset = 0;

        for (const chunk of buffer) {
            combinedData.set(chunk, offset);
            offset += chunk.length;
        }

        // Resample to 16kHz for Gemini
        const targetSampleRate = 16000;
        const resampleRatio = targetSampleRate / sampleRate;
        const targetLength = Math.floor(combinedData.length * resampleRatio);
        const resampledData = new Float32Array(targetLength);

        // Simple linear interpolation resampling
        for (let i = 0; i < targetLength; i++) {
            const sourceIndex = i / resampleRatio;
            const index = Math.floor(sourceIndex);
            const fraction = sourceIndex - index;

            if (index + 1 < combinedData.length) {
                resampledData[i] = combinedData[index] * (1 - fraction) +
                    combinedData[index + 1] * fraction;
            } else if (index < combinedData.length) {
                resampledData[i] = combinedData[index];
            }
        }

        // Convert to Int16Array
        const int16Data = new Int16Array(resampledData.length);
        for (let i = 0; i < resampledData.length; i++) {
            const s = Math.max(-1, Math.min(1, resampledData[i]));
            int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        onAudioData(int16Data);
    }, [onAudioData]);

    const stopRecording = useCallback(() => {
        isRecordingRef.current = false;
        updateState({ isRecording: false, audioLevel: 0 });

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }, [updateState]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, [stopRecording]);

    return {
        ...state,
        startRecording,
        stopRecording,
    };
}

function getRecordingErrorMessage(error: any): string {
    switch (error.name) {
        case 'NotAllowedError':
            return 'Microphone access denied. Please allow microphone permissions.';
        case 'NotFoundError':
            return 'No microphone found. Please connect a microphone.';
        case 'NotReadableError':
            return 'Microphone is already in use by another application.';
        case 'OverconstrainedError':
            return 'Microphone does not meet the required specifications.';
        case 'SecurityError':
            return 'Microphone access blocked due to security restrictions.';
        default:
            return error.message || 'Failed to access microphone';
    }
}