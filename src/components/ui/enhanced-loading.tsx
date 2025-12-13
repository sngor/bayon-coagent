'use client';

import React from 'react';
import { cn } from '@/lib/utils/common';
import { Loading, Skeleton, LoadingCard, ProgressLoading } from './loading';

interface LoadingStateProps {
    variant?: 'default' | 'ai' | 'skeleton' | 'pulse' | 'shimmer';
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

/**
 * @deprecated Use Loading component instead
 */
export function EnhancedLoading({
    variant = 'default',
    size = 'md',
    text,
    className
}: LoadingStateProps) {
    if (variant === 'skeleton') {
        return <Skeleton className={className} />;
    }

    if (variant === 'shimmer') {
        return (
            <div className={cn("relative overflow-hidden bg-muted rounded animate-shimmer", className)}>
                <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-background/50 to-transparent"
                    style={{
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s linear infinite'
                    }}
                />
            </div>
        );
    }

    return (
        <Loading
            variant={variant === 'pulse' ? 'pulse' : variant === 'ai' ? 'ai' : 'default'}
            size={size}
            message={text}
            className={className}
        />
    );
}

interface SkeletonCardProps {
    showHeader?: boolean;
    showFooter?: boolean;
    lines?: number;
    className?: string;
}

/**
 * @deprecated Use LoadingCard from loading.tsx instead
 */
export function SkeletonCard({
    showHeader = true,
    showFooter = false,
    lines = 3,
    className
}: SkeletonCardProps) {
    return <LoadingCard className={className} lines={lines} showHeader={showHeader} />;
}

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

interface ProgressStepsProps {
    steps: string[];
    currentStep: number;
    className?: string;
}

/**
 * @deprecated Use ProgressLoading from loading.tsx instead
 */
export function ProgressSteps({
    steps,
    currentStep,
    className
}: ProgressStepsProps) {
    return <ProgressLoading steps={steps} currentStep={currentStep} className={className} />;
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