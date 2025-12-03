'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/common';

export interface CancellableOperationProps {
    isRunning: boolean;
    progress: number;
    onCancel: () => void;
    title?: string;
    description?: string;
    className?: string;
    showProgress?: boolean;
}

/**
 * Visual feedback component for cancellable operations
 * Implements Requirements 7.5: Operation cancellation with visual feedback
 */
export function CancellableOperation({
    isRunning,
    progress,
    onCancel,
    title = 'Processing...',
    description,
    className,
    showProgress = true,
}: CancellableOperationProps) {
    if (!isRunning) return null;

    return (
        <Card
            className={cn(
                'fixed bottom-4 left-4 right-4 z-50 p-4 shadow-lg md:left-auto md:right-4 md:w-96',
                className
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <h3 className="font-medium text-sm">{title}</h3>
                    </div>
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                    {showProgress && (
                        <div className="space-y-1">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground text-right">
                                {Math.round(progress)}%
                            </p>
                        </div>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCancel}
                    className="h-8 w-8 shrink-0"
                    aria-label="Cancel operation"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </Card>
    );
}

/**
 * Hook-based wrapper for cancellable operations with UI
 */
export interface UseCancellableOperationUIOptions {
    title?: string;
    description?: string;
    showProgress?: boolean;
}

export function useCancellableOperationUI(options: UseCancellableOperationUIOptions = {}) {
    return {
        renderUI: (isRunning: boolean, progress: number, onCancel: () => void) => (
            <CancellableOperation
                isRunning={isRunning}
                progress={progress}
                onCancel={onCancel}
                title={options.title}
                description={options.description}
                showProgress={options.showProgress}
            />
        ),
    };
}
