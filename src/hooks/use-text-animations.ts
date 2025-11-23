'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing text animation states and effects
 */
export function useTextAnimations() {
    const [animationStates, setAnimationStates] = useState<Record<string, boolean>>({});
    const [completedAnimations, setCompletedAnimations] = useState<Set<string>>(new Set());

    /**
     * Trigger an animation for a specific element
     */
    const triggerAnimation = useCallback((id: string, duration = 1000) => {
        setAnimationStates(prev => ({ ...prev, [id]: true }));

        setTimeout(() => {
            setAnimationStates(prev => ({ ...prev, [id]: false }));
            setCompletedAnimations(prev => new Set([...prev, id]));
        }, duration);
    }, []);

    /**
     * Reset animation state for a specific element
     */
    const resetAnimation = useCallback((id: string) => {
        setAnimationStates(prev => ({ ...prev, [id]: false }));
        setCompletedAnimations(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    }, []);

    /**
     * Reset all animations
     */
    const resetAllAnimations = useCallback(() => {
        setAnimationStates({});
        setCompletedAnimations(new Set());
    }, []);

    /**
     * Check if an animation is currently active
     */
    const isAnimating = useCallback((id: string) => {
        return animationStates[id] || false;
    }, [animationStates]);

    /**
     * Check if an animation has completed
     */
    const hasCompleted = useCallback((id: string) => {
        return completedAnimations.has(id);
    }, [completedAnimations]);

    return {
        triggerAnimation,
        resetAnimation,
        resetAllAnimations,
        isAnimating,
        hasCompleted,
        animationStates,
        completedAnimations
    };
}

/**
 * Hook for typewriter effect with more control
 */
export function useTypewriter(text: string, options: {
    speed?: number;
    delay?: number;
    onComplete?: () => void;
    autoStart?: boolean;
} = {}) {
    const { speed = 100, delay = 0, onComplete, autoStart = true } = options; // Doubled speed from 50ms to 100ms

    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [isStarted, setIsStarted] = useState(autoStart);

    const start = useCallback(() => {
        setIsStarted(true);
        setCurrentIndex(0);
        setDisplayText('');
        setIsComplete(false);
    }, []);

    const reset = useCallback(() => {
        setIsStarted(false);
        setCurrentIndex(0);
        setDisplayText('');
        setIsComplete(false);
    }, []);

    useEffect(() => {
        if (!isStarted || isComplete) return;

        if (currentIndex < text.length) {
            const timer = setTimeout(() => {
                setDisplayText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, currentIndex === 0 ? delay : speed);

            return () => clearTimeout(timer);
        } else {
            setIsComplete(true);
            onComplete?.();
        }
    }, [currentIndex, text, speed, delay, onComplete, isStarted, isComplete]);

    return {
        displayText,
        isComplete,
        isStarted,
        start,
        reset,
        progress: text.length > 0 ? currentIndex / text.length : 0
    };
}

/**
 * Hook for staggered animations
 */
export function useStaggeredAnimation(
    itemCount: number,
    options: {
        delay?: number;
        staggerDelay?: number;
        autoStart?: boolean;
    } = {}
) {
    const { delay = 0, staggerDelay = 50, autoStart = true } = options; // Reduced stagger delay from 100ms to 50ms
    const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
    const [isComplete, setIsComplete] = useState(false);

    const start = useCallback(() => {
        setVisibleItems(new Set());
        setIsComplete(false);

        for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
                setVisibleItems(prev => {
                    const newSet = new Set([...prev, i]);
                    if (newSet.size === itemCount) {
                        setIsComplete(true);
                    }
                    return newSet;
                });
            }, delay + (i * staggerDelay));
        }
    }, [itemCount, delay, staggerDelay]);

    const reset = useCallback(() => {
        setVisibleItems(new Set());
        setIsComplete(false);
    }, []);

    useEffect(() => {
        if (autoStart && itemCount > 0) {
            start();
        }
    }, [autoStart, itemCount, start]);

    return {
        visibleItems,
        isComplete,
        start,
        reset,
        isVisible: (index: number) => visibleItems.has(index),
        progress: itemCount > 0 ? visibleItems.size / itemCount : 0
    };
}

/**
 * Hook for success/error message animations
 */
export function useMessageAnimation(duration = 3000) {
    const [message, setMessage] = useState<{
        text: string;
        type: 'success' | 'error' | 'info';
        id: string;
    } | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const showMessage = useCallback((
        text: string,
        type: 'success' | 'error' | 'info' = 'info'
    ) => {
        const id = `msg-${Date.now()}`;
        setMessage({ text, type, id });
        setIsVisible(true);

        setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => setMessage(null), 300); // Allow fade out animation
        }, duration);
    }, [duration]);

    const hideMessage = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => setMessage(null), 300);
    }, []);

    return {
        message,
        isVisible,
        showMessage,
        hideMessage
    };
}

/**
 * Hook for loading text animations
 */
export function useLoadingText(baseText: string, options: {
    dots?: boolean;
    cycle?: string[];
    speed?: number;
} = {}) {
    const { dots = true, cycle, speed = 800 } = options; // Increased speed from 500ms to 800ms (slower updates)
    const [currentText, setCurrentText] = useState(baseText);
    const [isLoading, setIsLoading] = useState(false);

    const start = useCallback(() => {
        setIsLoading(true);

        if (cycle && cycle.length > 0) {
            let index = 0;
            const interval = setInterval(() => {
                setCurrentText(cycle[index]);
                index = (index + 1) % cycle.length;
            }, speed);

            return () => clearInterval(interval);
        } else if (dots) {
            let dotCount = 0;
            const interval = setInterval(() => {
                const dotsStr = '.'.repeat((dotCount % 3) + 1);
                setCurrentText(`${baseText}${dotsStr}`);
                dotCount++;
            }, speed);

            return () => clearInterval(interval);
        }
    }, [baseText, cycle, dots, speed]);

    const stop = useCallback(() => {
        setIsLoading(false);
        setCurrentText(baseText);
    }, [baseText]);

    useEffect(() => {
        if (isLoading) {
            const cleanup = start();
            return cleanup;
        }
    }, [isLoading, start]);

    return {
        currentText,
        isLoading,
        start: () => setIsLoading(true),
        stop
    };
}