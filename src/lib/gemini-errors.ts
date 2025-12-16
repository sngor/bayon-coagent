/**
 * Error handling utilities for Gemini Live integration
 */

export interface GeminiError {
    code: string;
    message: string;
    retryable: boolean;
}

export const GEMINI_ERROR_CODES = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    QUOTA_ERROR: 'QUOTA_ERROR',
    INVALID_REQUEST: 'INVALID_REQUEST',
    MICROPHONE_ERROR: 'MICROPHONE_ERROR',
    AUDIO_PROCESSING_ERROR: 'AUDIO_PROCESSING_ERROR',
    WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',
} as const;

export function getWebSocketErrorInfo(code: number): GeminiError {
    switch (code) {
        case 1006:
            return {
                code: GEMINI_ERROR_CODES.NETWORK_ERROR,
                message: 'Network connection interrupted. Check your internet connection.',
                retryable: true,
            };
        case 4001:
            return {
                code: GEMINI_ERROR_CODES.AUTH_ERROR,
                message: 'Invalid API key or authentication failed. Please check your API key.',
                retryable: false,
            };
        case 4003:
            return {
                code: GEMINI_ERROR_CODES.QUOTA_ERROR,
                message: 'API quota exceeded or rate limited. Please try again later.',
                retryable: false,
            };
        default:
            return {
                code: GEMINI_ERROR_CODES.WEBSOCKET_ERROR,
                message: `WebSocket connection failed with code: ${code}`,
                retryable: true,
            };
    }
}

export function getMicrophoneError(error: DOMException): GeminiError {
    switch (error.name) {
        case 'NotAllowedError':
            return {
                code: GEMINI_ERROR_CODES.MICROPHONE_ERROR,
                message: 'Microphone access denied. Please allow microphone permissions and try again.',
                retryable: true,
            };
        case 'NotFoundError':
            return {
                code: GEMINI_ERROR_CODES.MICROPHONE_ERROR,
                message: 'No microphone found. Please connect a microphone and try again.',
                retryable: false,
            };
        case 'NotReadableError':
            return {
                code: GEMINI_ERROR_CODES.MICROPHONE_ERROR,
                message: 'Microphone is already in use by another application.',
                retryable: true,
            };
        case 'OverconstrainedError':
            return {
                code: GEMINI_ERROR_CODES.MICROPHONE_ERROR,
                message: 'Microphone does not meet the required specifications.',
                retryable: false,
            };
        case 'SecurityError':
            return {
                code: GEMINI_ERROR_CODES.MICROPHONE_ERROR,
                message: 'Microphone access blocked due to security restrictions.',
                retryable: false,
            };
        default:
            return {
                code: GEMINI_ERROR_CODES.MICROPHONE_ERROR,
                message: error.message || 'Failed to access microphone',
                retryable: true,
            };
    }
}

export function isRetryableError(error: GeminiError): boolean {
    return error.retryable;
}

export function shouldShowRetryButton(error: GeminiError): boolean {
    return error.retryable && error.code !== GEMINI_ERROR_CODES.NETWORK_ERROR;
}