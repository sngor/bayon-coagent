/**
 * Voice feature analytics tracking
 * Follows the analytics pattern used throughout the codebase
 */

import { VoiceErrorType } from '@/lib/voice-errors';

export interface VoiceAnalyticsEvent {
    event: string;
    properties?: Record<string, any>;
}

export function trackVoiceConnection(success: boolean, errorType?: VoiceErrorType): void {
    // Track connection attempts and success/failure rates
    const event: VoiceAnalyticsEvent = {
        event: 'voice_connection_attempt',
        properties: {
            success,
            error_type: errorType,
            timestamp: new Date().toISOString(),
        }
    };

    // Integration with existing analytics system would go here
    console.log('Voice Analytics:', event);
}

export function trackVoiceUsage(duration: number, audioChunks: number): void {
    const event: VoiceAnalyticsEvent = {
        event: 'voice_session_completed',
        properties: {
            duration_seconds: duration,
            audio_chunks_processed: audioChunks,
            timestamp: new Date().toISOString(),
        }
    };

    console.log('Voice Analytics:', event);
}

export function trackDiagnosticsRun(results: Record<string, 'success' | 'error' | 'warning'>): void {
    const event: VoiceAnalyticsEvent = {
        event: 'voice_diagnostics_run',
        properties: {
            results,
            timestamp: new Date().toISOString(),
        }
    };

    console.log('Voice Analytics:', event);
}