import { getErrorType, createVoiceError, WebSocketCloseCode } from '../voice-errors';

describe('voice-errors', () => {
    describe('getErrorType', () => {
        it('should detect API key errors', () => {
            expect(getErrorType('Invalid API key')).toBe('api-key');
            expect(getErrorType('Authentication failed')).toBe('api-key');
            expect(getErrorType(null, WebSocketCloseCode.INVALID_API_KEY)).toBe('api-key');
        });

        it('should detect network errors', () => {
            expect(getErrorType('Network connection failed')).toBe('network');
            expect(getErrorType('Connection timeout')).toBe('network');
            expect(getErrorType(null, WebSocketCloseCode.ABNORMAL_CLOSURE)).toBe('network');
        });

        it('should detect microphone errors', () => {
            expect(getErrorType('Microphone access denied')).toBe('microphone');
            expect(getErrorType('Media permission required')).toBe('microphone');
        });

        it('should detect quota errors', () => {
            expect(getErrorType('API quota exceeded')).toBe('quota');
            expect(getErrorType('Rate limit reached')).toBe('quota');
            expect(getErrorType(null, WebSocketCloseCode.QUOTA_EXCEEDED)).toBe('quota');
        });

        it('should return unknown for unrecognized errors', () => {
            expect(getErrorType('Some random error')).toBe('unknown');
            expect(getErrorType(null)).toBe('unknown');
        });
    });

    describe('createVoiceError', () => {
        it('should create structured error objects', () => {
            const error = createVoiceError('API key invalid', WebSocketCloseCode.INVALID_API_KEY);

            expect(error.type).toBe('api-key');
            expect(error.message).toBe('API key invalid');
            expect(error.solutions).toContain('Get a Gemini API key from Google AI Studio');
        });
    });
});