'use client';

import * as React from 'react';
import { Sparkles, X, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Progress } from './progress';
import {
    AIOperationTracker,
    getOperationEstimate,
    formatDuration,
    getContextualMessage,
} from '@/lib/ai-operation-tracker';

export interface AIOperationProgressProps {
    operationName: string;
    tracker: AIOperationTracker;
    onCancel?: () => void;
    className?: string;
}

/**
 * AI Operation Progress Component
 * 
 * Displays smart progress indicators for AI operations with:
 * - Estimated completion time based on historical data
 * - Contextual status messages
 * - Ability to cancel long-running operations
 * - Visual progress bar with animations
 */
export function AIOperationProgress({
    operationName,
    tracker,
    onCancel,
    className,
}: AIOperationProgressProps) {
    const [progress, setProgress] = React.useState(0);
    const [message, setMessage] = React.useState('');
    const [elapsedTime, setElapsedTime] = React.useState(0);
    const [estimatedRemaining, setEstimatedRemaining] = React.useState(0);
    const [estimate] = React.useState(() => getOperationEstimate(operationName));

    React.useEffect(() => {
        // Set up progress callback
        tracker.onProgress((newProgress, newMessage) => {
            setProgress(newProgress);
            setMessage(newMessage);
        });

        // Update elapsed time and estimated remaining every 100ms
        const interval = setInterval(() => {
            const elapsed = tracker.getElapsedTime();
            setElapsedTime(elapsed);

            const remaining = tracker.getEstimatedTimeRemaining();
            setEstimatedRemaining(remaining);

            // Auto-update progress based on elapsed time if no manual updates
            if (progress === 0 && elapsed > 0) {
                const autoProgress = Math.min(
                    95,
                    (elapsed / estimate.estimatedDuration) * 100
                );
                setProgress(autoProgress);
            }

            // Update contextual message based on progress
            if (!message) {
                setMessage(getContextualMessage(operationName, progress));
            }
        }, 100);

        return () => clearInterval(interval);
    }, [tracker, operationName, estimate, progress, message]);

    const handleCancel = () => {
        tracker.cancel();
        onCancel?.();
    };

    const showEstimate = estimate.basedOnSamples > 0;
    const confidenceColor = {
        low: 'text-yellow-600 dark:text-yellow-400',
        medium: 'text-blue-600 dark:text-blue-400',
        high: 'text-green-600 dark:text-green-400',
    }[estimate.confidence];

    return (
        <div
            className={cn(
                'relative rounded-xl border bg-card p-6 shadow-lg',
                'animate-in fade-in-0 slide-in-from-bottom-4 duration-500',
                className
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {/* Animated sparkles icon */}
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                        </div>
                        {/* Spinning ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">AI Processing</h3>
                        <p className="text-sm text-muted-foreground">
                            {formatOperationName(operationName)}
                        </p>
                    </div>
                </div>

                {/* Cancel button */}
                {onCancel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancel}
                        className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Cancel operation</span>
                    </Button>
                )}
            </div>

            {/* Progress bar */}
            <div className="space-y-2 mb-4">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Math.round(progress)}% complete</span>
                    {showEstimate && estimatedRemaining > 0 && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(estimatedRemaining)} remaining
                        </span>
                    )}
                </div>
            </div>

            {/* Status message */}
            <div className="mb-4">
                <p className="text-sm text-foreground animate-pulse">
                    {message || getContextualMessage(operationName, progress)}
                </p>
            </div>

            {/* Estimate info */}
            {showEstimate && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t">
                    <TrendingUp className="w-3 h-3" />
                    <span>
                        Estimate based on {estimate.basedOnSamples} previous operation
                        {estimate.basedOnSamples !== 1 ? 's' : ''}
                    </span>
                    <span className={cn('font-medium', confidenceColor)}>
                        ({estimate.confidence} confidence)
                    </span>
                </div>
            )}
        </div>
    );
}

/**
 * Compact AI Operation Progress Component
 * A smaller version for inline display
 */
export function AIOperationProgressCompact({
    operationName,
    tracker,
    onCancel,
    className,
}: AIOperationProgressProps) {
    const [progress, setProgress] = React.useState(0);
    const [message, setMessage] = React.useState('');

    React.useEffect(() => {
        tracker.onProgress((newProgress, newMessage) => {
            setProgress(newProgress);
            setMessage(newMessage);
        });

        const interval = setInterval(() => {
            const elapsed = tracker.getElapsedTime();
            const estimate = getOperationEstimate(operationName);

            if (progress === 0 && elapsed > 0) {
                const autoProgress = Math.min(
                    95,
                    (elapsed / estimate.estimatedDuration) * 100
                );
                setProgress(autoProgress);
            }

            if (!message) {
                setMessage(getContextualMessage(operationName, progress));
            }
        }, 100);

        return () => clearInterval(interval);
    }, [tracker, operationName, progress, message]);

    return (
        <div
            className={cn(
                'flex items-center gap-3 p-3 rounded-lg border bg-card',
                className
            )}
        >
            <Sparkles className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message}</p>
                <Progress value={progress} className="h-1 mt-1" />
            </div>
            {onCancel && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        tracker.cancel();
                        onCancel();
                    }}
                    className="h-6 w-6 flex-shrink-0"
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}

/**
 * Format operation name for display
 */
function formatOperationName(name: string): string {
    return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Hook for managing AI operation progress
 */
export function useAIOperation(operationName: string) {
    const [tracker, setTracker] = React.useState<AIOperationTracker | null>(null);
    const [isRunning, setIsRunning] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const start = React.useCallback(() => {
        const newTracker = new AIOperationTracker(operationName);
        newTracker.start();
        setTracker(newTracker);
        setIsRunning(true);
        setError(null);
        return newTracker;
    }, [operationName]);

    const complete = React.useCallback(() => {
        if (tracker) {
            tracker.complete();
            setIsRunning(false);
        }
    }, [tracker]);

    const fail = React.useCallback((errorMessage: string) => {
        if (tracker) {
            tracker.fail(errorMessage);
            setIsRunning(false);
            setError(errorMessage);
        }
    }, [tracker]);

    const cancel = React.useCallback(() => {
        if (tracker) {
            tracker.cancel();
            setIsRunning(false);
        }
    }, [tracker]);

    const updateProgress = React.useCallback((progress: number, message: string) => {
        if (tracker) {
            tracker.updateProgress(progress, message);
        }
    }, [tracker]);

    return {
        tracker,
        isRunning,
        error,
        start,
        complete,
        fail,
        cancel,
        updateProgress,
    };
}
