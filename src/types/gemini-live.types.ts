// Enhanced type definitions for better type safety

export interface GeminiLiveConfig {
    model?: string;
    systemInstruction?: string;
    responseModalities?: ('AUDIO' | 'TEXT')[];
    voiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';
    onMessage?: (message: GeminiMessage) => void;
    autoStartMessage?: string;
    autoStartDelay?: number;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface GeminiMessage {
    serverContent?: {
        modelTurn?: {
            parts?: Array<{
                text?: string;
                inlineData?: {
                    mimeType: string;
                    data: string;
                };
            }>;
        };
    };
    clientContent?: {
        turns: Array<{
            parts: Array<{ text: string }>;
        }>;
        turnComplete: boolean;
    };
    realtimeInput?: {
        mediaChunks: Array<{
            mimeType: string;
            data: string;
        }>;
    };
    setup?: {
        model: string;
        generationConfig: {
            responseModalities: string[];
            speechConfig?: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: string;
                    };
                };
            };
        };
        systemInstruction?: {
            parts: Array<{ text: string }>;
        };
    };
}

export interface AudioProcessingError extends Error {
    code: 'AUDIO_WORKLET_FAILED' | 'MICROPHONE_ACCESS_DENIED' | 'AUDIO_CONTEXT_FAILED';
    originalError?: Error;
}

export interface WebSocketError extends Error {
    code: number;
    reason?: string;
}

export interface GeminiLiveHookReturn {
    isConnected: boolean;
    isRecording: boolean;
    isSpeaking: boolean;
    connectionState: ConnectionState;
    error: string | null;
    audioLevel: number;
    outputAudioLevel: number;
    connect: (apiKey: string, config?: GeminiLiveConfig) => Promise<void>;
    disconnect: () => void;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    sendText: (text: string) => void;
    triggerAutoStart: () => void;
}

// Result types for better error handling
export type GeminiLiveResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
    code?: string;
};