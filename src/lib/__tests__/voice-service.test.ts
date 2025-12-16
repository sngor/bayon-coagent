import { VoiceService } from '@/services/voice-service';
import { createVoiceError } from '@/lib/voice-errors';
import { getVoiceConfig } from '@/lib/voice-config';

// Mock WebSocket
class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readyState = MockWebSocket.CONNECTING;
    onopen: ((event: Event) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    constructor(public url: string) {
        // Simulate async connection
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            this.onopen?.(new Event('open'));
        }, 10);
    }

    send(data: string) {
        // Mock send implementation
    }

    close(code?: number, reason?: string) {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.(new CloseEvent('close', { code, reason }));
    }
}

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
        getUserMedia: mockGetUserMedia,
    },
    writable: true,
});

// Mock AudioContext
class MockAudioContext {
    state = 'running';
    sampleRate = 44100;

    createMediaStreamSource() {
        return {
            connect: jest.fn(),
        };
    }

    createScriptProcessor() {
        return {
            connect: jest.fn(),
            disconnect: jest.fn(),
            onaudioprocess: null,
        };
    }

    createBuffer() {
        return {
            getChannelData: () => new Float32Array(1024),
        };
    }

    createBufferSource() {
        return {
            buffer: null,
            connect: jest.fn(),
            start: jest.fn(),
            onended: null,
        };
    }

    get destination() {
        return {};
    }

    resume() {
        return Promise.resolve();
    }

    close() {
        return Promise.resolve();
    }
}

// Setup mocks
beforeAll(() => {
    global.WebSocket = MockWebSocket as any;
    global.AudioContext = MockAudioContext as any;
    global.fetch = jest.fn();
});

describe('VoiceService', () => {
    let voiceService: VoiceService;
    let mockStateChange: jest.Mock;

    beforeEach(() => {
        mockStateChange = jest.fn();
        voiceService = new VoiceService(mockStateChange);
        jest.clearAllMocks();
    });

    afterEach(() => {
        voiceService.disconnect();
    });

    describe('API Key Validation', () => {
        it('should validate API key format', async () => {
            const result = await voiceService.validateApiKey('invalid-key');
            expect(result).toBe(false);
            expect(mockStateChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        type: 'api-key'
                    })
                })
            );
        });

        it('should accept valid API key format', async () => {
            // Mock successful API response
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ models: [] }),
            });

            const result = await voiceService.validateApiKey('AIzaSyDummyKeyForTesting123456789');
            expect(result).toBe(true);
        });

        it('should handle network errors during validation', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            const result = await voiceService.validateApiKey('AIzaSyDummyKeyForTesting123456789');
            expect(result).toBe(false);
        });
    });

    describe('Connection Management', () => {
        it('should connect successfully with valid API key', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ models: [] }),
            });

            await voiceService.connect('AIzaSyDummyKeyForTesting123456789');

            // Wait for WebSocket to connect
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(mockStateChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    isConnected: true,
                    error: null,
                })
            );
        });

        it('should handle connection failures gracefully', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 401,
            });

            await voiceService.connect('invalid-key');

            expect(mockStateChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        type: 'api-key'
                    })
                })
            );
        });

        it('should disconnect cleanly', () => {
            voiceService.disconnect();

            expect(mockStateChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    isConnected: false,
                    isRecording: false,
                    isSpeaking: false,
                    error: null,
                })
            );
        });
    });

    describe('Recording Management', () => {
        beforeEach(async () => {
            // Setup connected state
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ models: [] }),
            });

            await voiceService.connect('AIzaSyDummyKeyForTesting123456789');
            await new Promise(resolve => setTimeout(resolve, 20));
        });

        it('should start recording with microphone permission', async () => {
            const mockStream = {
                getTracks: () => [{ stop: jest.fn() }],
            };
            mockGetUserMedia.mockResolvedValueOnce(mockStream);

            await voiceService.startRecording();

            expect(mockGetUserMedia).toHaveBeenCalledWith({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });

            expect(mockStateChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    isRecording: true,
                    error: null,
                })
            );
        });

        it('should handle microphone permission denial', async () => {
            const micError = new Error('Permission denied');
            micError.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValueOnce(micError);

            await voiceService.startRecording();

            expect(mockStateChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        type: 'microphone'
                    })
                })
            );
        });

        it('should stop recording cleanly', async () => {
            const mockTrack = { stop: jest.fn() };
            const mockStream = {
                getTracks: () => [mockTrack],
            };
            mockGetUserMedia.mockResolvedValueOnce(mockStream);

            await voiceService.startRecording();
            voiceService.stopRecording();

            expect(mockTrack.stop).toHaveBeenCalled();
            expect(mockStateChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    isRecording: false,
                    audioLevel: 0,
                })
            );
        });
    });

    describe('Text Messaging', () => {
        beforeEach(async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ models: [] }),
            });

            await voiceService.connect('AIzaSyDummyKeyForTesting123456789');
            await new Promise(resolve => setTimeout(resolve, 20));
        });

        it('should send text messages when connected', () => {
            const sendSpy = jest.spyOn(MockWebSocket.prototype, 'send');

            voiceService.sendText('Hello, test message');

            expect(sendSpy).toHaveBeenCalledWith(
                expect.stringContaining('Hello, test message')
            );
        });

        it('should handle sending when disconnected', () => {
            voiceService.disconnect();
            voiceService.sendText('This should fail');

            expect(mockStateChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        message: expect.stringContaining('Not connected')
                    })
                })
            );
        });
    });
});

describe('Voice Configuration', () => {
    it('should provide default configuration', () => {
        const config = getVoiceConfig();

        expect(config).toMatchObject({
            defaultModel: expect.stringContaining('gemini'),
            fallbackModels: expect.arrayContaining([expect.any(String)]),
            apiTimeout: expect.any(Number),
            sampleRate: expect.any(Number),
        });
    });

    it('should apply environment-specific overrides', () => {
        const originalEnv = process.env.NODE_ENV;

        process.env.NODE_ENV = 'development';
        const devConfig = getVoiceConfig();
        expect(devConfig.enableDiagnostics).toBe(true);

        process.env.NODE_ENV = 'production';
        const prodConfig = getVoiceConfig();
        expect(prodConfig.maxReconnectAttempts).toBe(3);

        process.env.NODE_ENV = originalEnv;
    });

    it('should merge user overrides', () => {
        const config = getVoiceConfig({
            apiTimeout: 60000,
            enableAnalytics: false,
        });

        expect(config.apiTimeout).toBe(60000);
        expect(config.enableAnalytics).toBe(false);
    });
});

describe('Error Handling', () => {
    it('should create structured error objects', () => {
        const error = createVoiceError('API key invalid', 4001);

        expect(error).toMatchObject({
            type: 'api-key',
            message: 'API key invalid',
            solutions: expect.arrayContaining([expect.any(String)]),
            code: 4001,
            timestamp: expect.any(String),
        });
    });

    it('should categorize errors correctly', () => {
        const micError = createVoiceError('Microphone access denied');
        expect(micError.type).toBe('microphone');

        const networkError = createVoiceError('Connection timeout');
        expect(networkError.type).toBe('network');

        const quotaError = createVoiceError('API quota exceeded');
        expect(quotaError.type).toBe('quota');
    });
});