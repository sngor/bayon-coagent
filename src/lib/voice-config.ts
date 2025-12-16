/**
 * Voice feature configuration
 * Follows the config pattern used throughout the codebase
 */

export interface VoiceConfig {
    // API Configuration
    defaultModel: string;
    fallbackModels: string[];
    apiTimeout: number;

    // Audio Configuration
    sampleRate: number;
    bufferSize: number;
    noiseGateThreshold: number;

    // Buffering Configuration
    bufferThresholds: {
        large: number;    // Play immediately
        medium: number;   // Short wait
        small: number;    // Medium wait
        // Below small = long wait
    };
    bufferWaitTimes: {
        large: number;
        medium: number;
        small: number;
        tiny: number;
    };

    // Connection Configuration
    maxReconnectAttempts: number;
    reconnectDelay: number;
    healthCheckInterval: number;

    // Feature Flags
    enableAnalytics: boolean;
    enableDiagnostics: boolean;
    enableAutoReconnect: boolean;
}

// Model configuration with versioning strategy
export const GEMINI_MODELS = {
    LATEST: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
    STABLE: 'models/gemini-2.0-flash-exp',
    FALLBACK: 'models/gemini-1.5-pro'
} as const;

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
    // API Configuration
    defaultModel: GEMINI_MODELS.LATEST,
    fallbackModels: [
        GEMINI_MODELS.STABLE,
        GEMINI_MODELS.FALLBACK
    ],
    apiTimeout: 30000,

    // Audio Configuration - Optimized for real-time streaming
    sampleRate: 16000,
    bufferSize: 4096, // Reduced buffer size for lower latency
    noiseGateThreshold: 0.005, // More sensitive noise gate

    // Buffering Configuration - Balanced for quality and latency
    bufferThresholds: {
        large: 4,     // 4+ chunks = play immediately
        medium: 2,    // 2-3 chunks = short wait
        small: 1,     // 1 chunk = medium wait
    },
    bufferWaitTimes: {
        large: 0,     // No wait for large buffers
        medium: 30,   // 30ms wait for medium buffers
        small: 50,    // 50ms wait for small buffers
        tiny: 100,    // 100ms wait for tiny buffers
    },

    // Connection Configuration
    maxReconnectAttempts: 5,
    reconnectDelay: 5000,
    healthCheckInterval: 60000,

    // Feature Flags
    enableAnalytics: true,
    enableDiagnostics: true,
    enableAutoReconnect: true,
};

/**
 * Get voice configuration with environment-specific overrides
 * Follows the config pattern used throughout the AWS service layer
 */
export function getVoiceConfig(overrides?: Partial<VoiceConfig>): VoiceConfig {
    const baseConfig = { ...DEFAULT_VOICE_CONFIG };

    // Environment-specific overrides
    if (process.env.NODE_ENV === 'development') {
        baseConfig.enableDiagnostics = true;
        baseConfig.enableAnalytics = false; // Reduce noise in dev
    }

    // Production optimizations
    if (process.env.NODE_ENV === 'production') {
        baseConfig.maxReconnectAttempts = 3; // Fewer attempts in prod
        baseConfig.reconnectDelay = 3000; // Faster reconnection
    }

    // Apply user overrides
    return { ...baseConfig, ...overrides };
}

/**
 * Validate voice configuration
 */
export function validateVoiceConfig(config: Partial<VoiceConfig>): string[] {
    const errors: string[] = [];

    if (config.apiTimeout && config.apiTimeout < 5000) {
        errors.push('API timeout must be at least 5 seconds');
    }

    if (config.maxReconnectAttempts && config.maxReconnectAttempts < 1) {
        errors.push('Max reconnect attempts must be at least 1');
    }

    if (config.sampleRate && ![16000, 24000, 44100, 48000].includes(config.sampleRate)) {
        errors.push('Sample rate must be 16000, 24000, 44100, or 48000 Hz');
    }

    return errors;
}