'use client';

import React from 'react';
import { cn } from '@/lib/utils/common';
import { Loader2, Sparkles, Brain, Zap } from 'lucide-react';

interface LoadingStateProps {
    variant?: 'default' | 'ai' | 'skeleton' | 'pulse' | 'shimmer';
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

export function EnhancedLoading({
    variant = 'default',
    size = 'md',
    text,
    className
}: LoadingStateProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    if (variant === 'ai') {
        return (
            <div className={cn("flex items-center gap-3", className)}>
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-purple-600 animate-pulse" />
                    <div className="relative bg-background rounded-full p-2">
                        <Brain className={cn(sizeClasses[size], "text-primary animate-pulse")} />
                    </div>
                </div>
                {text && (
                    <div className="space-y-1">
                        <p className={cn("font-medium", textSizeClasses[size])}>
                            {text}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Sparkles className="w-3 h-3" />
                            <span>AI Processing...</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (variant === 'skeleton') {
        return (
            <div className={cn("space-y-3", className)}>
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            </div>
        );
    }

    if (variant === 'shimmer') {
        return (
            <div className={cn("relative overflow-hidden bg-muted rounded", className)}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/50 to-transparent animate-shimmer" />
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
            {text && (
                <span className={cn("text-muted-foreground", textSizeClasses[size])}>
                    {text}
                </span>
            )}
        </div>
    );
}

interface SkeletonCardProps {
    showHeader?: boolean;
    showFooter?: boolean;
    lines?: number;
    className?: string;
}

export function SkeletonCard({
    showHeader = true,
    showFooter = false,
    lines = 3,
    className
}: SkeletonCardProps) {
    return (
        <div className={cn("rounded-2xl border bg-card p-6 space-y-4", className)}>
            {showHeader && (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-xl animate-pulse" />
                    <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-4 bg-muted rounded animate-pulse",
                            i === lines - 1 && "w-3/4"
                        )}
                    />
                ))}
            </div>

            {showFooter && (
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="h-8 bg-muted rounded w-20 animate-pulse" />
                    <div className="h-8 bg-muted rounded w-24 animate-pulse" />
                </div>
            )}
        </div>
    );
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
        <div className={cn(
            "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center",
            className
        )}>
            <div className="bg-card border rounded-2xl p-8 shadow-xl max-w-sm w-full mx-4">
                <div className="text-center space-y-4">
                    <EnhancedLoading variant={variant} size="lg" />
                    <div>
                        <p className="font-medium">{text}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            This may take a few moments...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Progress indicator for multi-step processes
interface ProgressStepsProps {
    steps: string[];
    currentStep: number;
    className?: string;
}

export function ProgressSteps({
    steps,
    currentStep,
    className
}: ProgressStepsProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                    Step {currentStep + 1} of {steps.length}
                </span>
                <span className="text-sm text-muted-foreground">
                    {Math.round(((currentStep + 1) / steps.length) * 100)}%
                </span>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={cn(
                                "h-2 rounded-full flex-1 transition-colors",
                                index <= currentStep ? "bg-primary" : "bg-muted"
                            )}
                        />
                    ))}
                </div>

                <p className="text-sm text-muted-foreground">
                    {steps[currentStep]}
                </p>
            </div>
        </div>
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
    const stages = [
        { icon: Brain, label: "Thinking" },
        { icon: Zap, label: "Processing" },
        { icon: Sparkles, label: "Generating" }
    ];

    return (
        <div className={cn("flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20", className)}>
            <div className="flex items-center gap-2">
                {stages.map((stageItem, index) => {
                    const Icon = stageItem.icon;
                    const isActive = stageItem.label === stage;

                    return (
                        <div
                            key={stageItem.label}
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                isActive
                                    ? "bg-primary text-primary-foreground animate-pulse"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                        </div>
                    );
                })}
            </div>

            <div className="flex-1">
                <p className="font-medium text-sm">AI {stage}...</p>
                <p className="text-xs text-muted-foreground">
                    Creating personalized content for you
                </p>
            </div>
        </div>
    );
}