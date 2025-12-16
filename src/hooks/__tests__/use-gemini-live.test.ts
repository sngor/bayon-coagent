import { renderHook, act } from '@testing-library/react';
import { useGeminiLive } from '../use-gemini-live';

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
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            this.onopen?.(new Event('open'));
        }, 0);
    }

    send(data: string) {
        // Mock implementation
    }

    close(code?: number, reason?: string) {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.(new CloseEvent('close', { code: code || 1000, reason }));
    }
}

// Mock getUserMedia
const mockGetUserMedia = jest.fn();
Object.defineProperty(navigator, 'mediaDevices', {
    value: {
        getUserMedia: mockGetUserMedia,
    },
});

// Mock AudioContext
class MockAudioContext {
    state = 'running';
    createMediaStreamSource = jest.fn();
    createBuffer = jest.fn();
    createBufferSource = jest.fn();
    resume = jest.fn();
    close = jest.fn();

    audioWorklet = {
        addModule: jest.fn().mockResolvedValue(undefined),
    };
}

global.AudioContext = MockAudioContext as any;
global.WebSocket = MockWebSocket as any;

describe('useGeminiLive', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetUserMedia.mockResolvedValue({
            getTracks: () => [{ stop: jest.fn() }],
        });
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useGeminiLive());

        expect(result.current.isConnected).toBe(false);
        expect(result.current.isRecording).toBe(false);
        expect(result.current.isSpeaking).toBe(false);
        expect(result.current.connectionState).toBe('disconnected');
        expect(result.current.error).toBe(null);
        expect(result.current.audioLevel).toBe(0);
        expect(result.current.outputAudioLevel).toBe(0);
    });

    it('should connect to WebSocket successfully', async () => {
        const { result } = renderHook(() => useGeminiLive());

        await act(async () => {
            await result.current.connect('test-api-key');
        });

        expect(result.current.connectionState).toBe('connecting');

        // Wait for WebSocket to open
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        expect(result.current.isConnected).toBe(true);
        expect(result.current.connectionState).toBe('connected');
    });

    it('should handle connection errors gracefully', async () => {
        // Mock WebSocket to fail
        global.WebSocket = class extends MockWebSocket {
            constructor(url: string) {
                super(url);
                setTimeout(() => {
                    this.onerror?.(new Event('error'));
                }, 0);
            }
        } as any;

        const { result } = renderHook(() => useGeminiLive());

        await act(async () => {
            await result.current.connect('invalid-key');
        });

        expect(result.current.connectionState).toBe('error');
        expect(result.current.error).toBeTruthy();
    });

    it('should start and stop recording', async () => {
        const { result } = renderHook(() => useGeminiLive());

        // Connect first
        await act(async () => {
            await result.current.connect('test-api-key');
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        // Start recording
        await act(async () => {
            await result.current.startRecording();
        });

        expect(mockGetUserMedia).toHaveBeenCalled();
        expect(result.current.isRecording).toBe(true);

        // Stop recording
        act(() => {
            result.current.stopRecording();
        });

        expect(result.current.isRecording).toBe(false);
    });

    it('should send text messages', async () => {
        const { result } = renderHook(() => useGeminiLive());
        const mockSend = jest.fn();

        // Mock WebSocket send
        global.WebSocket = class extends MockWebSocket {
            send = mockSend;
        } as any;

        await act(async () => {
            await result.current.connect('test-api-key');
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        act(() => {
            result.current.sendText('Hello, Gemini!');
        });

        expect(mockSend).toHaveBeenCalledWith(
            expect.stringContaining('Hello, Gemini!')
        );
    });

    it('should cleanup resources on disconnect', async () => {
        const { result } = renderHook(() => useGeminiLive());

        await act(async () => {
            await result.current.connect('test-api-key');
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        act(() => {
            result.current.disconnect();
        });

        expect(result.current.isConnected).toBe(false);
        expect(result.current.connectionState).toBe('disconnected');
        expect(result.current.error).toBe(null);
    });
});