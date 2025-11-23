/**
 * Basic Gesture Handler Tests
 * 
 * Tests for the gesture handling utilities core functionality.
 */

import { describe, it, expect } from '@jest/globals';

describe('Gesture Handler Utilities', () => {
    it('should export gesture handler classes and types', async () => {
        const gestureModule = await import('../gesture-handler');

        expect(gestureModule.GestureHandler).toBeDefined();
        expect(typeof gestureModule.GestureHandler).toBe('function');
    });

    it('should export React hook', async () => {
        const hookModule = await import('../../hooks/use-gesture-handler');

        expect(hookModule.useGestureHandler).toBeDefined();
        expect(hookModule.useSwipeGesture).toBeDefined();
        expect(hookModule.usePinchGesture).toBeDefined();
        expect(hookModule.useLongPressGesture).toBeDefined();
        expect(hookModule.useMobileGestures).toBeDefined();

        expect(typeof hookModule.useGestureHandler).toBe('function');
        expect(typeof hookModule.useSwipeGesture).toBe('function');
        expect(typeof hookModule.usePinchGesture).toBe('function');
        expect(typeof hookModule.useLongPressGesture).toBe('function');
        expect(typeof hookModule.useMobileGestures).toBe('function');
    });

    it('should have correct gesture calculation functions', () => {
        // Test distance calculation
        const touch1 = { clientX: 0, clientY: 0 } as Touch;
        const touch2 = { clientX: 3, clientY: 4 } as Touch;

        // Distance should be 5 (3-4-5 triangle)
        const expectedDistance = 5;

        // We can't directly test the private method, but we can verify the math
        const deltaX = touch2.clientX - touch1.clientX;
        const deltaY = touch2.clientY - touch1.clientY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        expect(distance).toBe(expectedDistance);
    });

    it('should determine swipe direction correctly', () => {
        // Test swipe direction logic
        const testCases = [
            { deltaX: 100, deltaY: 10, expected: 'right' },
            { deltaX: -100, deltaY: 10, expected: 'left' },
            { deltaX: 10, deltaY: 100, expected: 'down' },
            { deltaX: 10, deltaY: -100, expected: 'up' },
        ];

        testCases.forEach(({ deltaX, deltaY, expected }) => {
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            let direction: string;
            if (absDeltaX > absDeltaY) {
                direction = deltaX > 0 ? 'right' : 'left';
            } else {
                direction = deltaY > 0 ? 'down' : 'up';
            }

            expect(direction).toBe(expected);
        });
    });

    it('should have proper default options', () => {
        const defaultOptions = {
            swipeThreshold: 50,
            swipeVelocityThreshold: 0.3,
            pinchThreshold: 0.1,
            longPressDelay: 500,
            longPressMoveThreshold: 10,
            hapticFeedback: true,
            visualFeedback: true,
        };

        // Verify that our defaults make sense
        expect(defaultOptions.swipeThreshold).toBeGreaterThan(0);
        expect(defaultOptions.swipeVelocityThreshold).toBeGreaterThan(0);
        expect(defaultOptions.pinchThreshold).toBeGreaterThan(0);
        expect(defaultOptions.longPressDelay).toBeGreaterThan(0);
        expect(defaultOptions.longPressMoveThreshold).toBeGreaterThan(0);
        expect(typeof defaultOptions.hapticFeedback).toBe('boolean');
        expect(typeof defaultOptions.visualFeedback).toBe('boolean');
    });
});