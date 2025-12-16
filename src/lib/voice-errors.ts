/**
 * Voice and microphone error handling utilities
 */

export type VoiceErrorType = 'api-key' | 'network' | 'quota' | 'microphone' | 'unknown';

export interface VoiceError {
    type: VoiceErrorType;
    message: string;
    solutions: string[];
    timestamp?: string;
    code?: number;
}

// Microphone error mapping
export const MICROPHONE_ERROR_MESSAGES: Record<string, string> = {
    'NotAllowedError': 'Microphone access denied. Please allow microphone permissions and try again.',
    'NotFoundError': 'No microphone found. Please connect a microphone and try again.',
    'NotReadableError': 'Microphone is already in use by another application.',
    'OverconstrainedError': 'Microphone does not meet the required specifications.',
    'SecurityError': 'Microphone access blocked due to security restrictions.',
};

// WebSocket error mapping
export const WEBSOCKET_ERROR_MESSAGES: Record<number, string> = {
    1006: 'Network connection interrupted.',
    1011: 'Server error occurred.',
    1012: 'Service restarting.',
    4001: 'Invalid API key or authentication failed.',
    4003: 'API quota exceeded or rate limited.',
};

// Error solutions mapping
export const ERROR_SOLUTIONS: Record<VoiceErrorType, string[]> = {
    'api-key': [
        'Get a Gemini API key from Google AI Studio',
        'Add the API key to your environment configuration',
        'Ensure the API key has access to Gemini Live features'
    ],
    'network': [
        'Check your internet connection',
        'Verify firewall settings allow WebSocket connections',
        'Try refreshing the page'
    ],
    'quota': [
        'Check your Gemini API usage limits',
        'Wait for quota reset or upgrade your plan',
        'Verify billing is set up correctly'
    ],
    'microphone': [
        'Allow microphone permissions in your browser',
        'Check if another application is using the microphone',
        'Ensure your microphone is properly connected'
    ],
    'unknown': [
        'Try reconnecting to the service',
        'Check the browser console for detailed errors',
        'Contact support if the issue persists'
    ]
};

// WebSocket close codes enum for better type safety
export enum WebSocketCloseCode {
    NORMAL_CLOSURE = 1000,
    ABNORMAL_CLOSURE = 1006,
    SERVER_ERROR = 1011,
    SERVICE_RESTART = 1012,
    INVALID_API_KEY = 4001,
    QUOTA_EXCEEDED = 4003,
}

// Type guard for WebSocket close codes
export function isWebSocketCloseCode(code: number): code is WebSocketCloseCode {
    return Object.values(WebSocketCloseCode).includes(code as WebSocketCloseCode);
}

/**
 * Get error type from error message or code
 */
export function getErrorType(error: string | null, code?: number): VoiceErrorType {
    if (!error && !code) return 'unknown';

    if (code && isWebSocketCloseCode(code)) {
        switch (code) {
            case WebSocketCloseCode.INVALID_API_KEY:
                return 'api-key';
            case WebSocketCloseCode.QUOTA_EXCEEDED:
                return 'quota';
            case WebSocketCloseCode.ABNORMAL_CLOSURE:
            case WebSocketCloseCode.SERVER_ERROR:
            case WebSocketCloseCode.SERVICE_RESTART:
                return 'network';
            default:
                break;
        }
    }

    if (error) {
        const errorLower = error.toLowerCase();
        const errorPatterns: Record<VoiceErrorType, string[]> = {
            'api-key': ['api key', 'authentication', 'unauthorized'],
            'network': ['network', 'connection', 'timeout'],
            'quota': ['quota', 'rate limit', 'exceeded'],
            'microphone': ['microphone', 'media', 'permission', 'denied'],
            'unknown': []
        };

        for (const [type, patterns] of Object.entries(errorPatterns)) {
            if (patterns.some(pattern => errorLower.includes(pattern))) {
                return type as VoiceErrorType;
            }
        }
    }

    return 'unknown';
}

/**
 * Get user-friendly error message for microphone errors
 */
export function getMicrophoneErrorMessage(err: any): string {
    return MICROPHONE_ERROR_MESSAGES[err.name] || err.message || 'Failed to access microphone';
}

/**
 * Get user-friendly error message for WebSocket errors
 */
export function getWebSocketErrorMessage(code: number, reason?: string): string {
    return WEBSOCKET_ERROR_MESSAGES[code] || reason || `Error code: ${code}`;
}

/**
 * Factory for creating structured voice error objects
 * Follows the error handling pattern used throughout the AWS service layer
 */
export function createVoiceError(error: string | null, code?: number): VoiceError {
    const type = getErrorType(error, code);
    const message = error || 'Unknown error occurred';

    return {
        type,
        message,
        solutions: ERROR_SOLUTIONS[type],
        timestamp: new Date().toISOString(),
        code
    };
}

/**
 * Create error from microphone access failure
 */
export function createMicrophoneError(err: any): VoiceError {
    const message = getMicrophoneErrorMessage(err);
    return createVoiceError(message);
}

/**
 * Create error from WebSocket failure
 */
export function createWebSocketError(code: number, reason?: string): VoiceError {
    const message = getWebSocketErrorMessage(code, reason);
    return createVoiceError(message, code);
}