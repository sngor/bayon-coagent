'use client';

import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
    variant?: 'default' | 'network' | 'timeout';
}

export function ErrorState({
    title,
    message,
    onRetry,
    className,
    variant = 'default'
}: ErrorStateProps) {
    const getIcon = () => {
        switch (variant) {
            case 'network':
                return <WifiOff className="h-8 w-8 text-muted-foreground" />;
            case 'timeout':
                return <RefreshCw className="h-8 w-8 text-muted-foreground" />;
            default:
                return <AlertCircle className="h-8 w-8 text-muted-foreground" />;
        }
    };

    const getDefaultTitle = () => {
        switch (variant) {
            case 'network':
                return 'Connection Problem';
            case 'timeout':
                return 'Loading Timeout';
            default:
                return 'Something went wrong';
        }
    };

    const getDefaultMessage = () => {
        switch (variant) {
            case 'network':
                return 'Please check your internet connection and try again.';
            case 'timeout':
                return 'This is taking longer than expected. Please try again.';
            default:
                return 'An error occurred while loading this content.';
        }
    };

    return (
        <Card className={cn('border-dashed', className)}>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4">
                    {getIcon()}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                    {title || getDefaultTitle()}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                    {message || getDefaultMessage()}
                </p>
                {onRetry && (
                    <Button onClick={onRetry} variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

interface LoadingTimeoutProps {
    onRetry?: () => void;
    className?: string;
}

export function LoadingTimeout({ onRetry, className }: LoadingTimeoutProps) {
    return (
        <ErrorState
            variant="timeout"
            title="Still Loading..."
            message="This is taking longer than usual. Your connection might be slow or there could be a temporary issue."
            onRetry={onRetry}
            className={className}
        />
    );
}

interface NetworkErrorProps {
    onRetry?: () => void;
    className?: string;
}

export function NetworkError({ onRetry, className }: NetworkErrorProps) {
    return (
        <ErrorState
            variant="network"
            onRetry={onRetry}
            className={className}
        />
    );
}