/**
 * Performance monitoring hook for Gemini Live integration
 */

import { useRef, useCallback } from 'react';

export interface PerformanceMetrics {
    connectionTime: number;
    audioLatency: number;
    audioChunksProcessed: number;
    reconnectionAttempts: number;
    errorCount: number;
    lastError?: string;
}

export interface PerformanceHookReturn {
    metrics: PerformanceMetrics;
    startConnectionTimer: () => void;
    endConnectionTimer: () => void;
    recordAudioLatency: (latency: number) => void;
    incrementAudioChunks: () => void;
    incrementReconnections: () => void;
    recordError: (error: string) => void;
    resetMetrics: () => void;
    getAverageLatency: () => number;
}

export function useGeminiPerformance(): PerformanceHookReturn {
    const metricsRef = useRef<PerformanceMetrics>({
        connectionTime: 0,
        audioLatency: 0,
        audioChunksProcessed: 0,
        reconnectionAttempts: 0,
        errorCount: 0,
    });

    const connectionStartRef = useRef<number>(0);
    const latencyMeasurementsRef = useRef<number[]>([]);

    const startConnectionTimer = useCallback(() => {
        connectionStartRef.current = performance.now();
    }, []);

    const endConnectionTimer = useCallback(() => {
        if (connectionStartRef.current > 0) {
            metricsRef.current.connectionTime = performance.now() - connectionStartRef.current;
            connectionStartRef.current = 0;
        }
    }, []);

    const recordAudioLatency = useCallback((latency: number) => {
        latencyMeasurementsRef.current.push(latency);
        // Keep only last 100 measurements for average calculation
        if (latencyMeasurementsRef.current.length > 100) {
            latencyMeasurementsRef.current.shift();
        }
        metricsRef.current.audioLatency = latency;
    }, []);

    const incrementAudioChunks = useCallback(() => {
        metricsRef.current.audioChunksProcessed += 1;
    }, []);

    const incrementReconnections = useCallback(() => {
        metricsRef.current.reconnectionAttempts += 1;
    }, []);

    const recordError = useCallback((error: string) => {
        metricsRef.current.errorCount += 1;
        metricsRef.current.lastError = error;
    }, []);

    const resetMetrics = useCallback(() => {
        metricsRef.current = {
            connectionTime: 0,
            audioLatency: 0,
            audioChunksProcessed: 0,
            reconnectionAttempts: 0,
            errorCount: 0,
        };
        latencyMeasurementsRef.current = [];
        connectionStartRef.current = 0;
    }, []);

    const getAverageLatency = useCallback(() => {
        const measurements = latencyMeasurementsRef.current;
        if (measurements.length === 0) return 0;

        const sum = measurements.reduce((acc, val) => acc + val, 0);
        return sum / measurements.length;
    }, []);

    return {
        metrics: metricsRef.current,
        startConnectionTimer,
        endConnectionTimer,
        recordAudioLatency,
        incrementAudioChunks,
        incrementReconnections,
        recordError,
        resetMetrics,
        getAverageLatency,
    };
}