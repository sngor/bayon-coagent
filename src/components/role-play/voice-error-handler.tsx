'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getMicrophoneErrorMessage } from '@/lib/audio-utils';

interface VoiceErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: string | null;
}

interface VoiceErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export class VoiceErrorBoundary extends Component<VoiceErrorBoundaryProps, VoiceErrorBoundaryState> {
    constructor(props: VoiceErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): VoiceErrorBoundaryState {
        return {
            hasError: true,
            error,
            errorInfo: error.message,
        };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Voice Error Boundary caught an error:', error, errorInfo);

        // Log to monitoring service if available
        if (typeof window !== 'undefined' && 'gtag' in window) {
            (window as any).gtag('event', 'exception', {
                description: `Voice Error: ${error.message}`,
                fatal: false,
            });
        }
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const isAudioError = this.state.error?.name?.includes('NotAllowed') ||
                this.state.error?.name?.includes('NotFound') ||
                this.state.error?.name?.includes('NotReadable');

            const errorMessage = isAudioError
                ? getMicrophoneErrorMessage(this.state.error)
                : 'An unexpected error occurred with the voice feature.';

            return (
                <Alert variant="destructive" className="m-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Voice Feature Error</AlertTitle>
                    <AlertDescription className="mt-2 space-y-3">
                        <p>{errorMessage}</p>
                        {isAudioError && (
                            <div className="text-sm space-y-1">
                                <p className="font-medium">To fix this:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Check your browser's microphone permissions</li>
                                    <li>Ensure no other apps are using your microphone</li>
                                    <li>Try refreshing the page</li>
                                    <li>Use a different browser if the issue persists</li>
                                </ul>
                            </div>
                        )}
                        <Button
                            onClick={this.handleRetry}
                            variant="outline"
                            size="sm"
                            className="mt-3"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </AlertDescription>
                </Alert>
            );
        }

        return this.props.children;
    }
}