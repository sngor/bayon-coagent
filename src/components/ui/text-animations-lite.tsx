'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Performance-optimized text animation components
 * These are lightweight alternatives to the full text-animations.tsx
 */

/**
 * Simple Typewriter Effect - No character-by-character animation
 * Just shows text with a blinking cursor
 */
interface TypewriterLiteProps {
    text: string;
    className?: string;
    showCursor?: boolean;
}

export function TypewriterLite({
    text,
    className,
    showCursor = true
}: TypewriterLiteProps) {
    return (
        <span className={cn('inline-block', className)}>
            {text}
            {showCursor && (
                <span className="inline-block ml-0.5 animate-pulse opacity-70">|</span>
            )}
        </span>
    );
}

/**
 * Instant Counter - No animation, just shows the final value
 */
interface CounterLiteProps {
    value: number;
    className?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
}

export function CounterLite({
    value,
    className,
    prefix = '',
    suffix = '',
    decimals = 0
}: CounterLiteProps) {
    const formattedValue = decimals > 0
        ? value.toFixed(decimals)
        : value.toString();

    return (
        <span className={className}>
            {prefix}{formattedValue}{suffix}
        </span>
    );
}

/**
 * Static Gradient Text - No animation
 */
interface GradientTextLiteProps {
    text: string;
    className?: string;
}

export function GradientTextLite({
    text,
    className
}: GradientTextLiteProps) {
    return (
        <span className={cn(
            'bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent',
            className
        )}>
            {text}
        </span>
    );
}

/**
 * Simple Loading Dots - Uses CSS animation only
 */
interface LoadingDotsLiteProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function LoadingDotsLite({
    className,
    size = 'md'
}: LoadingDotsLiteProps) {
    const sizeClasses = {
        sm: 'w-1 h-1',
        md: 'w-2 h-2',
        lg: 'w-3 h-3'
    };

    return (
        <div className={cn('flex items-center gap-1', className)}>
            <div className={cn('rounded-full bg-current animate-pulse', sizeClasses[size])} />
            <div className={cn('rounded-full bg-current animate-pulse', sizeClasses[size])} style={{ animationDelay: '0.2s' }} />
            <div className={cn('rounded-full bg-current animate-pulse', sizeClasses[size])} style={{ animationDelay: '0.4s' }} />
        </div>
    );
}

/**
 * Simple Text Reveal - Single fade-in animation
 */
interface TextRevealLiteProps {
    text: string;
    className?: string;
    delay?: number;
}

export function TextRevealLite({
    text,
    className,
    delay = 0
}: TextRevealLiteProps) {
    return (
        <div
            className={cn('animate-in fade-in duration-300', className)}
            style={{ animationDelay: `${delay}ms` }}
        >
            {text}
        </div>
    );
}

/**
 * Simple Success Message - No typewriter effect
 */
interface SuccessLiteProps {
    message: string;
    className?: string;
}

export function SuccessLite({
    message,
    className
}: SuccessLiteProps) {
    return (
        <div className={cn(
            'flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg',
            'animate-in slide-in-from-top-2 duration-200',
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

/**
 * Performance-optimized text animation selector
 * Automatically chooses between full and lite versions based on device performance
 */
export function useOptimizedTextAnimations() {
    // Check for reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    // Check for mobile device
    const isMobile = typeof window !== 'undefined'
        ? window.innerWidth <= 768
        : false;

    // Use lite versions on mobile or when reduced motion is preferred
    const useLiteVersions = prefersReducedMotion || isMobile;

    return {
        useLiteVersions,
        Typewriter: useLiteVersions ? TypewriterLite : null, // Import full version when needed
        Counter: useLiteVersions ? CounterLite : null,
        GradientText: useLiteVersions ? GradientTextLite : null,
        LoadingDots: useLiteVersions ? LoadingDotsLite : null,
        TextReveal: useLiteVersions ? TextRevealLite : null,
        Success: useLiteVersions ? SuccessLite : null,
    };
}