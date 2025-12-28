'use client';

import React from 'react';
import { cn } from '@/lib/utils/common';

/**
 * Disabled Text Animation Components
 * These are simple replacements that don't use any animations to prevent infinite re-renders
 */

interface TypewriterProps {
    text: string;
    speed?: number;
    delay?: number;
    className?: string;
    onComplete?: () => void;
    cursor?: boolean;
    cursorChar?: string;
    disabled?: boolean;
    context?: 'aiChatbot' | 'assistant' | 'onboarding' | 'notifications' | 'general';
}

export function Typewriter({ text, className }: TypewriterProps) {
    return <span className={className}>{text}</span>;
}

interface TextRevealProps {
    text: string;
    delay?: number;
    duration?: number;
    className?: string;
    direction?: 'left' | 'right' | 'up' | 'down';
}

export function TextReveal({ text, className }: TextRevealProps) {
    return <span className={className}>{text}</span>;
}

interface GradientTextProps {
    text: string;
    className?: string;
    colors?: string[];
    speed?: number;
    disabled?: boolean;
}

export function GradientText({ text, className }: GradientTextProps) {
    return <span className={className}>{text}</span>;
}

interface LoadingDotsProps {
    className?: string;
    dotClassName?: string;
    count?: number;
    size?: 'sm' | 'md' | 'lg';
}

export function LoadingDots({ className, count = 3, size = 'md' }: LoadingDotsProps) {
    const sizeClasses = {
        sm: 'w-1 h-1',
        md: 'w-2 h-2',
        lg: 'w-3 h-3'
    };

    return (
        <div className={cn('flex items-center gap-1', className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        'rounded-full bg-current',
                        sizeClasses[size]
                    )}
                />
            ))}
        </div>
    );
}

interface TextShimmerProps {
    text: string;
    className?: string;
    duration?: number;
    delay?: number;
    disabled?: boolean;
}

export function TextShimmer({ text, className }: TextShimmerProps) {
    return <span className={className}>{text}</span>;
}

interface StaggeredTextProps {
    text: string;
    className?: string;
    staggerBy?: 'character' | 'word';
    delay?: number;
    staggerDelay?: number;
    animation?: 'fadeIn' | 'slideUp' | 'scale' | 'bounce';
    disabled?: boolean;
}

export function StaggeredText({ text, className }: StaggeredTextProps) {
    return <span className={className}>{text}</span>;
}

interface SuccessAnimationProps {
    message: string;
    className?: string;
    duration?: number;
    onComplete?: () => void;
}

export function SuccessAnimation({ message, className }: SuccessAnimationProps) {
    return (
        <div className={cn(
            'flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg',
            className
        )}>
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <span className="text-green-800 font-medium">
                {message}
            </span>
        </div>
    );
}