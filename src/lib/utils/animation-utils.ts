/**
 * Animation utilities for performance optimization
 * Provides lightweight alternatives to heavy Framer Motion animations
 */

import { cn } from './common';

/**
 * Optimized animation classes that use CSS transitions instead of JS animations
 */
export const animations = {
    // Fade animations
    fadeIn: 'animate-in fade-in duration-200',
    fadeOut: 'animate-out fade-out duration-150',

    // Slide animations
    slideInFromBottom: 'animate-in slide-in-from-bottom-4 duration-300',
    slideInFromTop: 'animate-in slide-in-from-top-4 duration-300',
    slideInFromLeft: 'animate-in slide-in-from-left-4 duration-300',
    slideInFromRight: 'animate-in slide-in-from-right-4 duration-300',

    // Scale animations
    scaleIn: 'animate-in zoom-in duration-200',
    scaleOut: 'animate-out zoom-out duration-150',

    // Optimized hover effects
    hoverScale: 'hover:scale-[1.02] transition-transform duration-200',
    hoverShadow: 'hover:shadow-md transition-shadow duration-200',
    hoverColors: 'hover:text-primary transition-colors duration-150',

    // Loading states
    pulse: 'animate-pulse',
    spin: 'animate-spin',
} as const;

/**
 * Performance-optimized transition classes
 */
export const transitions = {
    colors: 'transition-colors duration-150',
    transform: 'transition-transform duration-200',
    shadow: 'transition-shadow duration-200',
    opacity: 'transition-opacity duration-150',
    all: 'transition-all duration-200', // Use sparingly
} as const;

/**
 * Stagger animation delays for lists
 */
export const staggerDelays = {
    fast: (index: number) => ({ animationDelay: `${index * 50}ms` }),
    medium: (index: number) => ({ animationDelay: `${index * 100}ms` }),
    slow: (index: number) => ({ animationDelay: `${index * 150}ms` }),
} as const;

/**
 * Utility to conditionally apply animations based on user preferences
 */
export function withReducedMotion(
    animationClass: string,
    fallbackClass: string = ''
): string {
    return cn(
        animationClass,
        'motion-reduce:animate-none',
        fallbackClass && `motion-reduce:${fallbackClass}`
    );
}

/**
 * Optimized animation presets for common UI patterns
 */
export const presets = {
    // Card hover effect
    cardHover: cn(transitions.shadow, transitions.transform, 'hover:shadow-lg hover:scale-[1.01]'),

    // Button press effect
    buttonPress: cn(transitions.transform, 'active:scale-95'),

    // List item entrance
    listItem: (index: number) => cn(
        animations.fadeIn,
        animations.slideInFromBottom,
        'animate-delay-' + Math.min(index * 50, 500) // Cap delay at 500ms
    ),

    // Modal/dialog entrance
    modal: cn(animations.fadeIn, animations.scaleIn),

    // Tooltip entrance
    tooltip: cn(animations.fadeIn, 'duration-150'),
} as const;

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}/**

 * Performance-optimized text animation utilities
 */
export const textAnimations = {
    // Lightweight typing effect (no character-by-character animation)
    typewriterFast: 'animate-in fade-in duration-300',

    // Simple cursor blink (reduced frequency)
    cursorBlink: 'animate-pulse',

    // Minimal shimmer effect
    shimmerLight: 'opacity-80 hover:opacity-100 transition-opacity duration-500',

    // Static gradient (no animation)
    gradientStatic: 'bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent',

    // Performance-friendly loading states
    loadingDots: 'animate-pulse',
    loadingText: 'opacity-70',
} as const;

/**
 * Detect if device is low-end and should use minimal animations
 */
export function isLowEndDevice(): boolean {
    if (typeof window === 'undefined') return false;

    // Check for mobile devices
    const isMobile = window.innerWidth <= 768;

    // Check for reduced motion preference
    const prefersReduced = prefersReducedMotion();

    // Check for slow connection (if available)
    const connection = (navigator as any).connection;
    const isSlowConnection = connection && (
        connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        connection.saveData
    );

    return isMobile || prefersReduced || isSlowConnection;
}

/**
 * Get appropriate animation class based on device performance
 */
export function getPerformantAnimation(
    fullAnimation: string,
    lightAnimation: string,
    staticFallback: string = ''
): string {
    if (typeof window === 'undefined') return staticFallback;

    if (prefersReducedMotion()) return staticFallback;
    if (isLowEndDevice()) return lightAnimation;

    return fullAnimation;
}/*
*
 * Global animation performance settings
 */
export const animationConfig = {
    // Performance modes
    PERFORMANCE_MODE: {
        HIGH: 'high',
        MEDIUM: 'medium',
        LOW: 'low',
        DISABLED: 'disabled'
    } as const,

    // Current performance mode (can be set based on device detection)
    currentMode: 'medium' as 'high' | 'medium' | 'low' | 'disabled',

    // Animation duration multipliers for each mode
    durationMultipliers: {
        high: 1,
        medium: 0.7,
        low: 0.5,
        disabled: 0
    },

    // Whether to use lite versions of components
    useLiteComponents: {
        high: false,
        medium: false,
        low: true,
        disabled: true
    }
};

/**
 * Set global animation performance mode
 */
export function setAnimationPerformanceMode(mode: 'high' | 'medium' | 'low' | 'disabled') {
    animationConfig.currentMode = mode;

    // Add class to body for CSS-based optimizations
    if (typeof document !== 'undefined') {
        document.body.classList.remove(
            'animations-high', 'animations-medium', 'animations-low', 'animations-disabled'
        );
        document.body.classList.add(`animations-${mode}`);
    }
}

/**
 * Get optimized duration based on current performance mode
 */
export function getOptimizedDuration(baseDuration: number): number {
    const multiplier = animationConfig.durationMultipliers[animationConfig.currentMode];
    return Math.max(baseDuration * multiplier, 0);
}

/**
 * Check if animations should be disabled
 */
export function shouldDisableAnimations(): boolean {
    return animationConfig.currentMode === 'disabled' || prefersReducedMotion();
}

/**
 * Auto-detect and set optimal performance mode
 */
export function autoSetPerformanceMode() {
    if (typeof window === 'undefined') return;

    let mode: 'high' | 'medium' | 'low' | 'disabled' = 'medium';

    // Check user preferences first
    if (prefersReducedMotion()) {
        mode = 'disabled';
    }
    // Check for mobile devices
    else if (window.innerWidth <= 768) {
        mode = 'low';
    }
    // Check for slow connection
    else if (isLowEndDevice()) {
        mode = 'low';
    }
    // Check for high-end devices (optional)
    else if (window.innerWidth >= 1920 && 'hardwareConcurrency' in navigator && navigator.hardwareConcurrency >= 8) {
        mode = 'high';
    }

    setAnimationPerformanceMode(mode);
    return mode;
}