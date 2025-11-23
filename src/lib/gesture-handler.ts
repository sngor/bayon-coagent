/**
 * Gesture Handler Utilities
 * 
 * Provides comprehensive gesture handling for mobile interactions including
 * swipe, pinch, and long-press gestures with appropriate feedback.
 * 
 * Requirements: 10.3
 */

export interface SwipeGesture {
    direction: 'left' | 'right' | 'up' | 'down';
    distance: number;
    velocity: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    duration: number;
}

export interface PinchGesture {
    scale: number;
    centerX: number;
    centerY: number;
    startDistance: number;
    currentDistance: number;
}

export interface LongPressGesture {
    x: number;
    y: number;
    duration: number;
}

export interface GestureHandlerOptions {
    // Swipe options
    swipeThreshold?: number; // Minimum distance for swipe (default: 50px)
    swipeVelocityThreshold?: number; // Minimum velocity for swipe (default: 0.3px/ms)

    // Pinch options
    pinchThreshold?: number; // Minimum scale change for pinch (default: 0.1)

    // Long press options
    longPressDelay?: number; // Time to trigger long press (default: 500ms)
    longPressMoveThreshold?: number; // Max movement during long press (default: 10px)

    // Feedback options
    hapticFeedback?: boolean; // Enable haptic feedback (default: true)
    visualFeedback?: boolean; // Enable visual feedback (default: true)
}

export interface GestureCallbacks {
    onSwipe?: (gesture: SwipeGesture) => void;
    onPinch?: (gesture: PinchGesture) => void;
    onPinchStart?: (gesture: PinchGesture) => void;
    onPinchEnd?: (gesture: PinchGesture) => void;
    onLongPress?: (gesture: LongPressGesture) => void;
    onLongPressStart?: (gesture: LongPressGesture) => void;
    onLongPressEnd?: (gesture: LongPressGesture) => void;
}

interface TouchState {
    startTime: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    touches: Touch[];
    longPressTimer?: NodeJS.Timeout;
    isPinching: boolean;
    initialDistance?: number;
    isLongPressing: boolean;
}

export class GestureHandler {
    private element: HTMLElement;
    private options: Required<GestureHandlerOptions>;
    private callbacks: GestureCallbacks;
    private touchState: TouchState | null = null;
    private isEnabled = true;

    constructor(
        element: HTMLElement,
        callbacks: GestureCallbacks,
        options: GestureHandlerOptions = {}
    ) {
        this.element = element;
        this.callbacks = callbacks;
        this.options = {
            swipeThreshold: 50,
            swipeVelocityThreshold: 0.3,
            pinchThreshold: 0.1,
            longPressDelay: 500,
            longPressMoveThreshold: 10,
            hapticFeedback: true,
            visualFeedback: true,
            ...options,
        };

        this.bindEvents();
    }

    private bindEvents() {
        this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        this.element.addEventListener('touchcancel', this.handleTouchCancel, { passive: false });
    }

    private unbindEvents() {
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchmove', this.handleTouchMove);
        this.element.removeEventListener('touchend', this.handleTouchEnd);
        this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    }

    private handleTouchStart = (e: TouchEvent) => {
        if (!this.isEnabled) return;

        const touch = e.touches[0];
        const now = Date.now();

        this.touchState = {
            startTime: now,
            startX: touch.clientX,
            startY: touch.clientY,
            currentX: touch.clientX,
            currentY: touch.clientY,
            touches: Array.from(e.touches),
            isPinching: e.touches.length > 1,
            isLongPressing: false,
        };

        // Handle pinch start
        if (e.touches.length === 2) {
            const distance = this.getDistance(e.touches[0], e.touches[1]);
            this.touchState.initialDistance = distance;
            this.touchState.isPinching = true;

            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            const pinchGesture: PinchGesture = {
                scale: 1,
                centerX,
                centerY,
                startDistance: distance,
                currentDistance: distance,
            };

            this.callbacks.onPinchStart?.(pinchGesture);
            this.provideFeedback('pinch-start');
        } else {
            // Start long press timer for single touch
            this.touchState.longPressTimer = setTimeout(() => {
                if (this.touchState && !this.touchState.isPinching) {
                    const moveDistance = this.getDistance(
                        { clientX: this.touchState.startX, clientY: this.touchState.startY } as Touch,
                        { clientX: this.touchState.currentX, clientY: this.touchState.currentY } as Touch
                    );

                    if (moveDistance <= this.options.longPressMoveThreshold) {
                        this.touchState.isLongPressing = true;
                        const longPressGesture: LongPressGesture = {
                            x: this.touchState.currentX,
                            y: this.touchState.currentY,
                            duration: Date.now() - this.touchState.startTime,
                        };

                        this.callbacks.onLongPressStart?.(longPressGesture);
                        this.provideFeedback('long-press-start');
                    }
                }
            }, this.options.longPressDelay);
        }
    };

    private handleTouchMove = (e: TouchEvent) => {
        if (!this.isEnabled || !this.touchState) return;

        // Prevent default to avoid scrolling during gestures
        if (this.touchState.isPinching || this.touchState.isLongPressing) {
            e.preventDefault();
        }

        const touch = e.touches[0];
        this.touchState.currentX = touch.clientX;
        this.touchState.currentY = touch.clientY;

        // Handle pinch gesture
        if (e.touches.length === 2 && this.touchState.isPinching && this.touchState.initialDistance) {
            const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
            const scale = currentDistance / this.touchState.initialDistance;

            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            const pinchGesture: PinchGesture = {
                scale,
                centerX,
                centerY,
                startDistance: this.touchState.initialDistance,
                currentDistance,
            };

            this.callbacks.onPinch?.(pinchGesture);
        } else {
            // Cancel long press if moved too much
            const moveDistance = this.getDistance(
                { clientX: this.touchState.startX, clientY: this.touchState.startY } as Touch,
                { clientX: this.touchState.currentX, clientY: this.touchState.currentY } as Touch
            );

            if (moveDistance > this.options.longPressMoveThreshold && this.touchState.longPressTimer) {
                clearTimeout(this.touchState.longPressTimer);
                this.touchState.longPressTimer = undefined;
            }
        }
    };

    private handleTouchEnd = (e: TouchEvent) => {
        if (!this.isEnabled || !this.touchState) return;

        const now = Date.now();
        const duration = now - this.touchState.startTime;

        // Handle pinch end
        if (this.touchState.isPinching && e.touches.length < 2) {
            if (this.touchState.initialDistance) {
                const finalDistance = e.touches.length === 1
                    ? this.touchState.initialDistance
                    : this.getDistance(e.touches[0], e.touches[1]);

                const scale = finalDistance / this.touchState.initialDistance;
                const centerX = this.touchState.currentX;
                const centerY = this.touchState.currentY;

                const pinchGesture: PinchGesture = {
                    scale,
                    centerX,
                    centerY,
                    startDistance: this.touchState.initialDistance,
                    currentDistance: finalDistance,
                };

                this.callbacks.onPinchEnd?.(pinchGesture);
                this.provideFeedback('pinch-end');
            }
        }

        // Handle long press end
        if (this.touchState.isLongPressing) {
            const longPressGesture: LongPressGesture = {
                x: this.touchState.currentX,
                y: this.touchState.currentY,
                duration,
            };

            this.callbacks.onLongPressEnd?.(longPressGesture);
            this.callbacks.onLongPress?.(longPressGesture);
            this.provideFeedback('long-press-end');
        }

        // Handle swipe gesture (only for single touch)
        if (e.touches.length === 0 && !this.touchState.isPinching && !this.touchState.isLongPressing) {
            const deltaX = this.touchState.currentX - this.touchState.startX;
            const deltaY = this.touchState.currentY - this.touchState.startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const velocity = distance / duration;

            if (distance >= this.options.swipeThreshold && velocity >= this.options.swipeVelocityThreshold) {
                const direction = this.getSwipeDirection(deltaX, deltaY);

                const swipeGesture: SwipeGesture = {
                    direction,
                    distance,
                    velocity,
                    startX: this.touchState.startX,
                    startY: this.touchState.startY,
                    endX: this.touchState.currentX,
                    endY: this.touchState.currentY,
                    duration,
                };

                this.callbacks.onSwipe?.(swipeGesture);
                this.provideFeedback(`swipe-${direction}`);
            }
        }

        // Clean up
        if (this.touchState.longPressTimer) {
            clearTimeout(this.touchState.longPressTimer);
        }

        if (e.touches.length === 0) {
            this.touchState = null;
        }
    };

    private handleTouchCancel = () => {
        if (this.touchState?.longPressTimer) {
            clearTimeout(this.touchState.longPressTimer);
        }
        this.touchState = null;
    };

    private getDistance(touch1: Touch, touch2: Touch): number {
        const deltaX = touch2.clientX - touch1.clientX;
        const deltaY = touch2.clientY - touch1.clientY;
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }

    private getSwipeDirection(deltaX: number, deltaY: number): SwipeGesture['direction'] {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (absDeltaX > absDeltaY) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }

    private provideFeedback(gestureType: string) {
        // Haptic feedback
        if (this.options.hapticFeedback && 'vibrate' in navigator) {
            switch (gestureType) {
                case 'swipe-left':
                case 'swipe-right':
                case 'swipe-up':
                case 'swipe-down':
                    navigator.vibrate(50);
                    break;
                case 'pinch-start':
                case 'pinch-end':
                    navigator.vibrate([25, 25, 25]);
                    break;
                case 'long-press-start':
                    navigator.vibrate(100);
                    break;
                case 'long-press-end':
                    navigator.vibrate(50);
                    break;
            }
        }

        // Visual feedback
        if (this.options.visualFeedback) {
            this.element.style.transition = 'transform 0.1s ease-out';

            switch (gestureType) {
                case 'swipe-left':
                    this.element.style.transform = 'translateX(-2px)';
                    break;
                case 'swipe-right':
                    this.element.style.transform = 'translateX(2px)';
                    break;
                case 'swipe-up':
                    this.element.style.transform = 'translateY(-2px)';
                    break;
                case 'swipe-down':
                    this.element.style.transform = 'translateY(2px)';
                    break;
                case 'pinch-start':
                    this.element.style.transform = 'scale(1.02)';
                    break;
                case 'long-press-start':
                    this.element.style.transform = 'scale(0.98)';
                    break;
            }

            // Reset transform after feedback
            setTimeout(() => {
                this.element.style.transform = '';
                this.element.style.transition = '';
            }, 100);
        }
    }

    public enable() {
        this.isEnabled = true;
    }

    public disable() {
        this.isEnabled = false;
        if (this.touchState?.longPressTimer) {
            clearTimeout(this.touchState.longPressTimer);
        }
        this.touchState = null;
    }

    public destroy() {
        this.disable();
        this.unbindEvents();
    }

    public updateOptions(options: Partial<GestureHandlerOptions>) {
        this.options = { ...this.options, ...options };
    }

    public updateCallbacks(callbacks: Partial<GestureCallbacks>) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }
}

/**
 * React hook for gesture handling
 */
export function useGestureHandler(
    callbacks: GestureCallbacks,
    options: GestureHandlerOptions = {}
) {
    const elementRef = React.useRef<HTMLElement>(null);
    const gestureHandlerRef = React.useRef<GestureHandler | null>(null);

    React.useEffect(() => {
        if (elementRef.current) {
            gestureHandlerRef.current = new GestureHandler(
                elementRef.current,
                callbacks,
                options
            );

            return () => {
                gestureHandlerRef.current?.destroy();
            };
        }
    }, []);

    React.useEffect(() => {
        if (gestureHandlerRef.current) {
            gestureHandlerRef.current.updateCallbacks(callbacks);
        }
    }, [callbacks]);

    React.useEffect(() => {
        if (gestureHandlerRef.current) {
            gestureHandlerRef.current.updateOptions(options);
        }
    }, [options]);

    return {
        elementRef,
        gestureHandler: gestureHandlerRef.current,
    };
}

// Import React for the hook
import * as React from 'react';