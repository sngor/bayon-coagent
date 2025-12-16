'use client';

import { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DiagnosticItem } from '@/components/ui/diagnostic-item';
import { ErrorAlert } from '@/components/ui/error-alert';
import { type DiagnosticStatus } from '@/components/ui/status-indicators';
import { VoiceErrorBoundary } from '@/components/voice-error-boundary';
import {
    AlertTriangle,
    Wifi,
    Key,
    Settings,
    ExternalLink,
    RefreshCw,
    Mic,
    type LucideIcon
} from 'lucide-react';

type ErrorType = 'microphone' | 'api-key' | 'network' | 'quota' | 'unknown' | null;

interface DiagnosticItemData {
    id: string;
    label: string;
    status: DiagnosticStatus;
    message: string;
    icon: LucideIcon;
}

interface VoiceDiagnosticsProps {
    isConnected: boolean;
    error: string | null;
    onRunDiagnostics: () => void;
    className?: string;
    showDevNote?: boolean;
}

import { getErrorType, ERROR_SOLUTIONS } from '@/lib/voice-errors';

export function VoiceDiagnostics({
    isConnected,
    error,
    onRunDiagnostics,
    className,
    showDevNote = true
}: VoiceDiagnosticsProps) {
    const errorType = useMemo(() => getErrorType(error) as ErrorType, [error]);

    const requestMicrophonePermission = useCallback(async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            // If successful, retry the connection
            onRunDiagnostics();
        } catch (err) {
            console.error('Failed to get microphone permission:', err);
        }
    }, [onRunDiagnostics]);

    const diagnosticItems = useMemo((): DiagnosticItemData[] => {
        const isOnline = navigator.onLine;

        // Helper function to determine status
        const getStatus = (condition: boolean, errorCondition?: boolean): DiagnosticStatus => {
            if (errorCondition) return 'error';
            if (condition) return 'success';
            return 'warning';
        };

        return [
            {
                id: 'connection',
                label: 'Internet Connection',
                status: getStatus(isOnline, !isOnline),
                message: isOnline ? 'Connected' : 'No internet connection',
                icon: Wifi,
            },
            {
                id: 'microphone',
                label: 'Microphone Access',
                status: getStatus(errorType !== 'microphone', errorType === 'microphone'),
                message: errorType === 'microphone'
                    ? 'Microphone access denied'
                    : 'Microphone permission required',
                icon: Mic,
            },
            {
                id: 'api-key',
                label: 'Gemini API Key',
                status: getStatus(isConnected, errorType === 'api-key'),
                message: errorType === 'api-key'
                    ? 'Invalid or missing API key'
                    : isConnected
                        ? 'API key valid'
                        : 'API key not verified',
                icon: Key,
            },
            {
                id: 'service',
                label: 'Gemini Live Service',
                status: getStatus(isConnected, !!error && !isConnected),
                message: isConnected
                    ? 'Connected and ready'
                    : error
                        ? 'Service unavailable'
                        : 'Not connected',
                icon: Settings,
            },
        ];
    }, [isConnected, error, errorType]);



    return (
        <VoiceErrorBoundary>
            <Card
                className={`border-orange-200 dark:border-orange-800 ${className || ''}`}
                role="region"
                aria-label="Voice connection diagnostics"
            >
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" aria-hidden="true" />
                        Voice Connection Diagnostics
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Current Error */}
                    {error && <ErrorAlert message={error} />}

                    {/* Diagnostic Items */}
                    <div className="space-y-3">
                        {diagnosticItems.map((item) => (
                            <DiagnosticItem key={item.id} {...item} />
                        ))}
                    </div>

                    {/* Solutions */}
                    {errorType && (
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Recommended Solutions</h4>
                            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                                {ERROR_SOLUTIONS[errorType].map((solution, index) => (
                                    <p key={index}>• {solution}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                            {errorType === 'microphone' && (
                                <Button onClick={requestMicrophonePermission} variant="default" className="flex-1">
                                    <Mic className="h-4 w-4 mr-2" />
                                    Allow Microphone
                                </Button>
                            )}
                            <Button onClick={onRunDiagnostics} variant="outline" className="flex-1">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry Connection
                            </Button>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                            className="w-full"
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Get API Key
                        </Button>
                    </div>

                    {/* Development Note */}
                    {showDevNote && (
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                            <p className="text-xs text-muted-foreground">
                                <strong>Note:</strong> Voice features require a valid Gemini API key with access to Gemini Live.
                                This is expected during development if no API key is configured.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </VoiceErrorBoundary>
    );
}