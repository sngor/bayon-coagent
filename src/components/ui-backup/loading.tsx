'use client';

import React, { useMemo } from 'react';
import { Loader2, Sparkles, Brain, Search, BarChart3, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    text?: string;
    message?: string;
    variant?: 'default' | 'ai' | 'pulse' | 'shimmer';
    showSubtext?: boolean;
    fullScreen?: boolean;
    featureType?: 'content' | 'image' | 'research' | 'analysis' | 'market' | 'calculation' | 'default';
}

type FeatureType = NonNullable<LoadingProps['featureType']>;
type LoadingSize = NonNullable<LoadingProps['size']>;
type LoadingVariant = NonNullable<LoadingProps['variant']>;

const FEATURE_ICONS: Record<FeatureType, LucideIcon> = {
    content: Sparkles,
    image: Brain,
    research: Search,
    analysis: BarChart3,
    market: BarChart3,
    calculation: Loader2,
    default: Loader2,
} as const;

const FEATURE_MESSAGES: Record<FeatureType, string> = {
    content: 'Creating personalized real estate content for you',
    image: 'Processing your property image with AI',
    research: 'Gathering market insights and property data',
    analysis: 'Analyzing market trends and opportunities',
    market: 'Fetching latest market intelligence',
    calculation: 'Crunching the numbers for your deal',
    default: 'Processing your request',
} as const;

const SIZE_CLASSES: Record<LoadingSize, string> = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
} as const;

/**
 * Loading component with multiple variants and feature-specific icons
 * 
 * @example
 * ```tsx
 * // Basic loading
 * <Loading size="md" text="Loading..." />
 * 
 * // AI variant with feature-specific icon
 * <Loading variant="ai" featureType="content" showSubtext />
 * 
 * // Full screen loading
 * <Loading fullScreen variant="ai" message="Processing your request" />
 * ```
 */
export function Loading({ 
    className, 
    size = 'md', 
    text, 
    message,
    variant = 'default',
    showSubtext = false,
    fullScreen = false,
    featureType = 'default'
}: LoadingProps) {
    const displayText = message || text;
    const IconComponent = FEATURE_ICONS[featureType];
    const subtextMessage = FEATURE_MESSAGES[featureType];

    // Memoize common props to prevent unnecessary re-renders
    const commonProps = useMemo(() => ({
        variant,
        size,
        IconComponent,
        displayText,
        showSubtext,
        subtextMessage
    }), [variant, size, IconComponent, displayText, showSubtext, subtextMessage]);

    if (fullScreen) {
        return <FullScreenLoading {...commonProps} />;
    }

    if (variant === 'ai') {
        return <AIVariantLoading className={className} {...commonProps} />;
    }

    if (variant === 'shimmer') {
        return <ShimmerLoading className={className} />;
    }

    return (
        <div className={cn('flex items-center justify-center space-x-2', className)}>
            <LoadingContent {...commonProps} />
        </div>
    );
}

interface CommonLoadingProps {
    variant: LoadingVariant;
    size: LoadingSize;
    IconComponent: LucideIcon;
    displayText?: string;
    showSubtext: boolean;
    subtextMessage: string;
}

const FullScreenLoading = React.memo(function FullScreenLoading(props: CommonLoadingProps) {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-card border shadow-lg">
                <LoadingContent {...props} />
            </div>
        </div>
    );
});

const AIVariantLoading = React.memo(function AIVariantLoading({ className, ...props }: CommonLoadingProps & { className?: string }) {
    const { IconComponent, size, displayText, showSubtext, subtextMessage } = props;
    
    return (
        <div className={cn('flex flex-col items-center gap-4 p-6 rounded-xl bg-primary/5 border border-primary/20', className)}>
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-full animate-pulse" />
                <IconComponent className={cn('animate-spin relative z-10', SIZE_CLASSES[size!], 'text-primary')} />
            </div>
            {displayText && (
                <div className="text-center">
                    <p className="font-medium text-sm">{displayText}</p>
                    {showSubtext && (
                        <p className="text-xs text-muted-foreground mt-1">{subtextMessage}</p>
                    )}
                </div>
            )}
        </div>
    );
});

const ShimmerLoading = React.memo(function ShimmerLoading({ className }: { className?: string }) {
    return (
        <div className={cn("relative overflow-hidden bg-muted rounded animate-pulse", className)}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/50 to-transparent animate-shimmer" />
        </div>
    );
});

interface LoadingContentProps {
    variant: LoadingVariant;
    size: LoadingSize;
    IconComponent: LucideIcon;
    displayText?: string;
    showSubtext: boolean;
    subtextMessage: string;
}

function LoadingContent({ 
    variant, 
    size, 
    IconComponent, 
    displayText, 
    showSubtext, 
    subtextMessage 
}: LoadingContentProps) {
    return (
        <>
            <IconComponent 
                className={cn(
                    'animate-spin', 
                    SIZE_CLASSES[size!],
                    variant === 'pulse' ? 'text-primary animate-pulse' : ''
                )}
                aria-hidden="true"
            />
            {displayText && (
                <div className="flex flex-col" role="status" aria-live="polite">
                    <span className="text-muted-foreground text-sm">{displayText}</span>
                    {showSubtext && (
                        <span className="text-xs text-muted-foreground/70 mt-1">{subtextMessage}</span>
                    )}
                </div>
            )}
        </>
    );
}

// Skeleton loading component
export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={cn("animate-pulse rounded-md bg-muted", className)} />
    );
}

// Loading card component
export function LoadingCard({ 
    className, 
    lines = 3, 
    showHeader = true 
}: { 
    className?: string; 
    lines?: number; 
    showHeader?: boolean; 
}) {
    return (
        <div className={cn("p-4 border rounded-lg space-y-3", className)}>
            {showHeader && <Skeleton className="h-4 w-3/4" />}
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-1/2" : "w-full")} />
            ))}
        </div>
    );
}

// Progress loading component
export function ProgressLoading({ 
    steps, 
    currentStep, 
    className 
}: { 
    steps: string[]; 
    currentStep: number; 
    className?: string; 
}) {
    return (
        <div className={cn("space-y-4", className)}>
            <Loading variant="ai" size="md" message={steps[currentStep]} showSubtext />
            <div className="flex gap-2">
                {steps.map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "h-2 rounded-full flex-1",
                            index <= currentStep ? "bg-primary" : "bg-muted"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

// Full page loading component
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loading size="lg" text={text} />
        </div>
    );
}

// Page transition loading
export function PageTransitionLoading({ text = 'Loading...' }: { text?: string }) {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Loading size="lg" text={text} variant="ai" />
        </div>
    );
}

// Inline loading component
export function InlineLoading({ text }: { text?: string }) {
    return <Loading size="sm" text={text} />;
}

// Button loading component
export function ButtonLoading({ text = 'Loading...' }: { text?: string }) {
    return <Loading size="sm" text={text} />;
}