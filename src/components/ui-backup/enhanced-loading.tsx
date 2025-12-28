'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loading } from './loading';

interface LoadingOverlayProps {
    isVisible: boolean;
    text?: string;
    variant?: 'default' | 'ai';
    className?: string;
}

export function LoadingOverlay({
    isVisible,
    text = "Loading...",
    variant = 'default',
    className
}: LoadingOverlayProps) {
    if (!isVisible) return null;

    return (
        <Loading
            variant={variant}
            size="lg"
            message={text}
            fullScreen={true}
            className={className}
        />
    );
}

// AI-specific loading states
export function AIProcessingIndicator({
    stage = "Analyzing",
    className
}: {
    stage?: string;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20", className)}>
            <Loading variant="pulse" size="sm" />
            <div className="flex-1">
                <p className="font-medium text-sm">AI {stage}...</p>
                <p className="text-xs text-muted-foreground">
                    Creating personalized content for you
                </p>
            </div>
        </div>
    );
}