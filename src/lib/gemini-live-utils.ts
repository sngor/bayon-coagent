// Utility functions following the codebase pattern of separating utilities

import { GeminiLiveConfig, ConnectionState } from '@/types/gemini-live.types';

// Constants following the pattern in other utility files
export const GEMINI_LIVE_CONSTANTS = {
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 5000,
    WEBSOCKET_HOST: 'generativelanguage.googleapis.com',
    WEBSOCKET_PATH: '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent',
    DEFAULT_MODEL: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
    AUDIO_SAMPLE_RATE: 24000,
    MIN_AUDIO_BUFFER_SIZE: 240,
    AUDIO_LEVEL_UPDATE_DELAY: 16, // ~60fps
} as const;

// Error message utilities following the pattern in audio-utils.ts
export function getGeminiWebSocketErrorMessage(code: number): string {
    switch (code) {
        case 1006:
            return 'Network connection interrupted.';
        case 4001:
            return 'Invalid API key or authentication failed.';
        case 4003:
            return 'API quota exceeded or rate limited.';
        case 4004:
            return 'Request timeout. Please try again.';
        case 4005:
            return 'Service temporarily unavailable.';
        default:
            return `Connection error (code: ${code})`;
    }
}

// Configuration validation following Zod pattern used elsewhere
export function validateGeminiLiveConfig(config: GeminiLiveConfig): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (config.model && !config.model.startsWith('models/')) {
        errors.push('Model must start with "models/"');
    }

    if (config.responseModalities) {
        const validModalities = ['AUDIO', 'TEXT'];
        const invalidModalities = config.responseModalities.filter(
            m => !validModalities.includes(m)
        );
        if (invalidModalities.length > 0) {
            errors.push(`Invalid response modalities: ${invalidModalities.join(', ')}`);
        }
    }

    if (config.voiceName) {
        const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'];
        if (!validVoices.includes(config.voiceName)) {
            errors.push(`Invalid voice name. Must be one of: ${validVoices.join(', ')}`);
        }
    }

    if (config.autoStartDelay && (config.autoStartDelay < 0 || config.autoStartDelay > 10000)) {
        errors.push('Auto start delay must be between 0 and 10000ms');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// WebSocket URL builder
export function buildGeminiWebSocketUrl(apiKey: string): string {
    if (!apiKey || apiKey.trim().length === 0) {
        throw new Error('API key is required');
    }

    return `wss://${GEMINI_LIVE_CONSTANTS.WEBSOCKET_HOST}${GEMINI_LIVE_CONSTANTS.WEBSOCKET_PATH}?key=${apiKey.trim()}`;
}

// Setup message builder following the pattern of structured message creation
export function createGeminiSetupMessage(config: GeminiLiveConfig) {
    return {
        setup: {
            model: config.model || GEMINI_LIVE_CONSTANTS.DEFAULT_MODEL,
            generationConfig: {
                responseModalities: config.responseModalities || ['AUDIO'],
                ...(config.voiceName && {
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: config.voiceName,
                            },
                        },
                    },
                }),
            },
            ...(config.systemInstruction && {
                systemInstruction: {
                    parts: [{ text: config.systemInstruction }],
                },
            }),
        },
    };
}

// Text message builder
export function createGeminiTextMessage(text: string) {
    if (!text || text.trim().length === 0) {
        throw new Error('Text message cannot be empty');
    }

    return {
        clientContent: {
            turns: [{
                parts: [{ text: text.trim() }],
            }],
            turnComplete: true,
        },
    };
}

// Audio message builder
export function createGeminiAudioMessage(base64Data: string, mimeType: string = 'audio/pcm;rate=16000') {
    if (!base64Data) {
        throw new Error('Audio data is required');
    }

    return {
        realtimeInput: {
            mediaChunks: [{
                mimeType,
                data: base64Data,
            }],
        },
    };
}

// Connection state helpers
export function isConnectedState(state: ConnectionState): boolean {
    return state === 'connected';
}

export function isConnectingState(state: ConnectionState): boolean {
    return state === 'connecting' || state === 'reconnecting';
}

export function isErrorState(state: ConnectionState): boolean {
    return state === 'error';
}

export function canAttemptConnection(state: ConnectionState): boolean {
    return state === 'disconnected' || state === 'error';
}

// Retry logic helper following the pattern used in other AWS service integrations
export function shouldRetryConnection(errorCode: number, attemptCount: number): boolean {
    // Don't retry on authentication or quota errors
    if (errorCode === 4001 || errorCode === 4003) {
        return false;
    }

    // Don't retry if we've exceeded max attempts
    if (attemptCount >= GEMINI_LIVE_CONSTANTS.MAX_RECONNECT_ATTEMPTS) {
        return false;
    }

    return true;
}

// Calculate exponential backoff delay
export function calculateRetryDelay(attemptCount: number): number {
    const baseDelay = GEMINI_LIVE_CONSTANTS.RECONNECT_DELAY;
    const maxDelay = 30000; // 30 seconds max
    const delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 1000;
    return delay + jitter;
}