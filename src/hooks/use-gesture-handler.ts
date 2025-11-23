/**
 * React Hook for Gesture Handling
 * 
 * Provides a convenient React hook interface for the GestureHandler utility.
 * Handles cleanup and ref management automatically.
 * 
 * Requirements: 10.3
 */

import { useRef, useEffect, useCallback } from 'react';
import {
    GestureHandler,
    GestureCallbacks,
    GestureHandlerOptions,
    SwipeGesture,
    PinchGesture,
    LongPressGesture
} from '@/lib/gesture-handler';

export interface UseGestureHandlerReturn<T extends HTMLElement = HTMLElement> {
    ref: React.RefObject<T>;
    gestureHandler: GestureHandler | null;
    enable: () => void;
    disable: () => void;
}

export function useGestureHandler<T extends HTMLElement = HTMLElement>(
    callbacks: GestureCallbacks,
    options: GestureHandlerOptions = {}
): UseGestureHandlerReturn<T> {
    const elementRef = useRef<T>(null);
    const gestureHandlerRef = useRef<GestureHandler | null>(null);

    // Initialize gesture handler when element is available
    useEffect(() => {
        if (elementRef.current && !gestureHandlerRef.current) {
            gestureHandlerRef.current = new GestureHandler(
                elementRef.current,
                callbacks,
                options
            );
        }

        return () => {
            if (gestureHandlerRef.current) {
                gestureHandlerRef.current.destroy();
                gestureHandlerRef.current = null;
            }
        };
    }, []);

    // Update callbacks when they change
    useEffect(() => {
        if (gestureHandlerRef.current) {
            gestureHandlerRef.current.updateCallbacks(callbacks);
        }
    }, [callbacks]);

    // Update options when they change
    useEffect(() => {
        if (gestureHandlerRef.current) {
            gestureHandlerRef.current.updateOptions(options);
        }
    }, [options]);

    const enable = useCallback(() => {
        gestureHandlerRef.current?.enable();
    }, []);

    const disable = useCallback(() => {
        gestureHandlerRef.current?.disable();
    }, []);

    return {
        ref: elementRef,
        gestureHandler: gestureHandlerRef.current,
        enable,
        disable,
    };
}

/**
 * Specialized hook for swipe gestures only
 */
export function useSwipeGesture<T extends HTMLElement = HTMLElement>(
    onSwipe: (gesture: SwipeGesture) => void,
    options: Pick<GestureHandlerOptions, 'swipeThreshold' | 'swipeVelocityThreshold' | 'hapticFeedback' | 'visualFeedback'> = {}
): UseGestureHandlerReturn<T> {
    return useGestureHandler(
        { onSwipe },
        {
            swipeThreshold: 50,
            swipeVelocityThreshold: 0.3,
            hapticFeedback: true,
            visualFeedback: true,
            ...options,
        }
    );
}

/**
 * Specialized hook for pinch gestures only
 */
export function usePinchGesture<T extends HTMLElement = HTMLElement>(
    callbacks: {
        onPinch?: (gesture: PinchGesture) => void;
        onPinchStart?: (gesture: PinchGesture) => void;
        onPinchEnd?: (gesture: PinchGesture) => void;
    },
    options: Pick<GestureHandlerOptions, 'pinchThreshold' | 'hapticFeedback' | 'visualFeedback'> = {}
): UseGestureHandlerReturn<T> {
    return useGestureHandler(
        callbacks,
        {
            pinchThreshold: 0.1,
            hapticFeedback: true,
            visualFeedback: true,
            ...options,
        }
    );
}

/**
 * Specialized hook for long press gestures only
 */
export function useLongPressGesture<T extends HTMLElement = HTMLElement>(
    callbacks: {
        onLongPress?: (gesture: LongPressGesture) => void;
        onLongPressStart?: (gesture: LongPressGesture) => void;
        onLongPressEnd?: (gesture: LongPressGesture) => void;
    },
    options: Pick<GestureHandlerOptions, 'longPressDelay' | 'longPressMoveThreshold' | 'hapticFeedback' | 'visualFeedback'> = {}
): UseGestureHandlerReturn<T> {
    return useGestureHandler(
        callbacks,
        {
            longPressDelay: 500,
            longPressMoveThreshold: 10,
            hapticFeedback: true,
            visualFeedback: true,
            ...options,
        }
    );
}

/**
 * Hook for handling common mobile gestures with sensible defaults
 */
export function useMobileGestures<T extends HTMLElement = HTMLElement>(
    callbacks: {
        onSwipeLeft?: () => void;
        onSwipeRight?: () => void;
        onSwipeUp?: () => void;
        onSwipeDown?: () => void;
        onPinchIn?: (scale: number) => void;
        onPinchOut?: (scale: number) => void;
        onLongPress?: (x: number, y: number) => void;
    },
    options: GestureHandlerOptions = {}
): UseGestureHandlerReturn<T> {
    const gestureCallbacks: GestureCallbacks = {
        onSwipe: (gesture) => {
            switch (gesture.direction) {
                case 'left':
                    callbacks.onSwipeLeft?.();
                    break;
                case 'right':
                    callbacks.onSwipeRight?.();
                    break;
                case 'up':
                    callbacks.onSwipeUp?.();
                    break;
                case 'down':
                    callbacks.onSwipeDown?.();
                    break;
            }
        },
        onPinch: (gesture) => {
            if (gesture.scale < 1) {
                callbacks.onPinchIn?.(gesture.scale);
            } else if (gesture.scale > 1) {
                callbacks.onPinchOut?.(gesture.scale);
            }
        },
        onLongPress: (gesture) => {
            callbacks.onLongPress?.(gesture.x, gesture.y);
        },
    };

    return useGestureHandler(gestureCallbacks, {
        swipeThreshold: 50,
        swipeVelocityThreshold: 0.3,
        pinchThreshold: 0.1,
        longPressDelay: 500,
        longPressMoveThreshold: 10,
        hapticFeedback: true,
        visualFeedback: true,
        ...options,
    });
}

// Re-export types for convenience
export type {
    SwipeGesture,
    PinchGesture,
    LongPressGesture,
    GestureCallbacks,
    GestureHandlerOptions,
} from '@/lib/gesture-handler';