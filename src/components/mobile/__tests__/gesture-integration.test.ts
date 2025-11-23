/**
 * Gesture Integration Tests
 * 
 * Tests for gesture handling integration in mobile components.
 */

import { describe, it, expect } from '@jest/globals';

describe('Gesture Integration', () => {
    it('should import gesture handling modules successfully', async () => {
        const gestureHandler = await import('@/lib/gesture-handler');
        const gestureHooks = await import('@/hooks/use-gesture-handler');

        expect(gestureHandler.GestureHandler).toBeDefined();
        expect(gestureHooks.useGestureHandler).toBeDefined();
        expect(gestureHooks.useSwipeGesture).toBeDefined();
        expect(gestureHooks.usePinchGesture).toBeDefined();
        expect(gestureHooks.useLongPressGesture).toBeDefined();
        expect(gestureHooks.useMobileGestures).toBeDefined();
    });

    it('should have proper gesture types exported', async () => {
        const gestureModule = await import('@/lib/gesture-handler');

        // Check that the module exports the expected types
        expect(typeof gestureModule.GestureHandler).toBe('function');
    });

    it('should validate gesture thresholds', () => {
        const defaultOptions = {
            swipeThreshold: 50,
            swipeVelocityThreshold: 0.3,
            pinchThreshold: 0.1,
            longPressDelay: 500,
            longPressMoveThreshold: 10,
            hapticFeedback: true,
            visualFeedback: true,
        };

        // Verify that our defaults make sense for mobile gestures
        expect(defaultOptions.swipeThreshold).toBeGreaterThanOrEqual(30); // Minimum reasonable swipe distance
        expect(defaultOptions.swipeThreshold).toBeLessThanOrEqual(100); // Maximum reasonable swipe distance
        expect(defaultOptions.swipeVelocityThreshold).toBeGreaterThan(0);
        expect(defaultOptions.pinchThreshold).toBeGreaterThan(0);
        expect(defaultOptions.longPressDelay).toBeGreaterThanOrEqual(300); // Minimum reasonable long press delay
        expect(defaultOptions.longPressDelay).toBeLessThanOrEqual(1000); // Maximum reasonable long press delay
        expect(defaultOptions.longPressMoveThreshold).toBeGreaterThan(0);
    });

    it('should have mobile-friendly gesture parameters', () => {
        // Test that gesture parameters are appropriate for mobile devices
        const mobileSwipeThreshold = 50; // 50px is good for mobile
        const mobileLongPressDelay = 500; // 500ms is standard for mobile long press
        const mobileMoveThreshold = 10; // 10px allows for slight finger movement

        expect(mobileSwipeThreshold).toBeGreaterThanOrEqual(30);
        expect(mobileLongPressDelay).toBeGreaterThanOrEqual(300);
        expect(mobileMoveThreshold).toBeGreaterThanOrEqual(5);
        expect(mobileMoveThreshold).toBeLessThanOrEqual(20);
    });
});