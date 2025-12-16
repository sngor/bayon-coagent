'use client';

import { useRef, useState, useCallback } from 'react';
import { getVoiceConfig, type VoiceConfig } from '@/lib/voice-config';
import { createVoiceError } from '@/lib/voice-errors';

export interface GeminiConnectionConfig {
    model?: string;
    systemInstruction?: string;
    responseModalities?: string[];
    voiceName?: string;
    onMessage?: (message: any) => void;
}

export interface GeminiConnectionState {
    isConnected: boolean;
    error: string | null;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export function useGeminiConnection() {
    const [state, setState] = useState<GeminiConnectionState>({
        isConnected: false,
        error: null,
        connectionStatus: 'disconnected'
    });

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const configRef = useRef<GeminiConnectionConfig | null>(null);
    const apiKeyRef = useRef<string | null>(null);

    const voiceConfig = getVoiceConfig();

    const updateState = useCallback((updates: Partial<GeminiConnectionState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    const validateApiKey = useCallback((apiKey: string): boolean => {
        if (!apiKey?.trim()) {
            updateState({ error: 'No API key provided' });
            return false;
        }

        if (apiKey.length < 20) {
            updateState({ error: 'API key appears to be invalid (too short)' });
            return false;
        }

        if (!apiKey.startsWith('AIza')) {
            updateState({ error: 'API key format appears to be invalid (should start with AIza)' });
            return false;
        }

        return true;
    }, [updateState]);

    const testApiKey = useCallback(async (apiKey: string): Promise<boolean> => {
        try {
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorMsg = `API key test failed: ${response.status === 401 ? 'Invalid API key' : `HTTP ${response.status}`}`;
                updateState({ error: errorMsg });
                return false;
            }

            return true;
        } catch (error) {
            updateState({
                error: `API key validation failed: ${error instanceof Error ? error.message : 'Network error'}`
            });
            return false;
        }
    }, [updateState]);

    const clearReconnectTimeout = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    const attemptReconnect = useCallback(() => {
        if (reconnectAttemptsRef.current >= voiceConfig.maxReconnectAttempts) {
            updateState({
                error: 'Connection failed after multiple attempts. Please check your API key and try again.',
                connectionStatus: 'error'
            });
            return;
        }

        reconnectAttemptsRef.current += 1;
        updateState({
            error: `Reconnecting... (${reconnectAttemptsRef.current}/${voiceConfig.maxReconnectAttempts})`,
            connectionStatus: 'connecting'
        });

        reconnectTimeoutRef.current = setTimeout(async () => {
            if (apiKeyRef.current && configRef.current) {
                await connectWebSocket(apiKeyRef.current, configRef.current);
            }
        }, voiceConfig.reconnectDelay);
    }, [voiceConfig, updateState]);

    const connectWebSocket = useCallback(async (apiKey: string, config?: GeminiConnectionConfig) => {
        if (!validateApiKey(apiKey)) return;

        const isValidKey = await testApiKey(apiKey);
        if (!isValidKey) return;

        // Clean up existing connection
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        const host = 'generativelanguage.googleapis.com';
        const path = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
        const url = `wss://${host}${path}?key=${apiKey}`;

        updateState({ connectionStatus: 'connecting' });

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            updateState({
                isConnected: true,
                error: null,
                connectionStatus: 'connected'
            });
            reconnectAttemptsRef.current = 0;

            // Send initial setup message
            const setupMessage = {
                setup: {
                    model: config?.model || voiceConfig.defaultModel,
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

                config?.onMessage?.(data);
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        };

        ws.onerror = () => {
            const errorMessage = navigator.onLine
                ? 'Connection error occurred. Will attempt to reconnect...'
                : 'No internet connection.';
            updateState({ error: errorMessage, connectionStatus: 'error' });
        };

        ws.onclose = (e) => {
            updateState({
                isConnected: false,
                connectionStatus: e.code === 1000 ? 'disconnected' : 'error'
            });

            if (e.code !== 1000 && e.code !== 4001 && e.code !== 4003) {
                attemptReconnect();
            }
        };
    }, [validateApiKey, testApiKey, updateState, voiceConfig, attemptReconnect]);

    const connect = useCallback(async (apiKey: string, config?: GeminiConnectionConfig) => {
        apiKeyRef.current = apiKey;
        configRef.current = config || {};
        await connectWebSocket(apiKey, config);
    }, [connectWebSocket]);

    const disconnect = useCallback(() => {
        clearReconnectTimeout();
        reconnectAttemptsRef.current = 0;
        apiKeyRef.current = null;
        configRef.current = null;

        if (wsRef.current) {
            wsRef.current.close(1000, 'Manual disconnect');
            wsRef.current = null;
        }

        updateState({
            isConnected: false,
            error: null,
            connectionStatus: 'disconnected'
        });
    }, [clearReconnectTimeout, updateState]);

    const sendMessage = useCallback((message: any) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            updateState({ error: 'Not connected to Gemini Live' });
            return false;
        }

        try {
            wsRef.current.send(JSON.stringify(message));
            return true;
        } catch (error) {
            updateState({ error: 'Failed to send message' });
            return false;
        }
    }, [updateState]);

    return {
        ...state,
        connect,
        disconnect,
        sendMessage,
        wsRef: wsRef.current,
    };
}