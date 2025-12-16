'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { VoiceService, type VoiceServiceConfig, type VoiceServiceState } from '@/services/voice-service';
import { type VoiceConfig } from '@/lib/voice-config';

export interface UseVoiceServiceReturn extends VoiceServiceState {
    connect: (apiKey: string, config?: VoiceServiceConfig) => Promise<void>;
    disconnect: () => void;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    sendText: (text: string) => void;
    isReady: boolean;
}

/**
 * React hook for voice service functionality
 * Follows the established pattern of wrapping services in hooks
 */
export function useVoiceService(configOverrides?: Partial<VoiceConfig>): UseVoiceServiceReturn {
    const [state, setState] = useState<VoiceServiceState>({
        isConnected: false,
        isRecording: false,
        isSpeaking: false,
        error: null,
        audioLevel: 0,
        outputAudioLevel: 0,
        connectionStatus: 'disconnected'
    });

    const serviceRef = useRef<VoiceService | null>(null);

    // Initialize service
    useEffect(() => {
        serviceRef.current = new VoiceService(setState, configOverrides);

        return () => {
            serviceRef.current?.disconnect();
        };
    }, [configOverrides]);

    const connect = useCallback(async (apiKey: string, config?: VoiceServiceConfig) => {
        await serviceRef.current?.connect(apiKey, config);
    }, []);

    const disconnect = useCallback(() => {
        serviceRef.current?.disconnect();
    }, []);

    const startRecording = useCallback(async () => {
        await serviceRef.current?.startRecording();
    }, []);

    const stopRecording = useCallback(() => {
        serviceRef.current?.stopRecording();
    }, []);

    const sendText = useCallback((text: string) => {
        serviceRef.current?.sendText(text);
    }, []);

    return {
        ...state,
        connect,
        disconnect,
        startRecording,
        stopRecording,
        sendText,
        isReady: serviceRef.current?.isReady || false,
    };
}