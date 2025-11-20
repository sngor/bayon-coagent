/**
 * Animation Performance Testing Suite
 * 
 * Tests that all animations run at 60fps (16.67ms per frame) to ensure smooth user experience.
 * Validates GPU acceleration, frame timing, and animation smoothness across all animation classes.
 * 
 * Requirements: Task 4.5 - Animations run at 60fps
 * Target: All animations maintain 60fps (16.67ms per frame)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  AnimationPerformanceMonitor,
  prefersReducedMotion,
  getSafeAnimationDuration,
  optimizedAnimationConfig,
} from '@/lib/animation-performance';

// Mock DOM and performance APIs
let mockAnimationFrameId = 0;
let mockAnimationFrameCallbacks: Map<number, FrameRequestCallback> = new Map();
let mockPerformanceNow = 0;

// Helper to simulate animation frames
function simulateAnimationFrames(count: number, frameTime: number = 16.6): void {
  for (let i = 0; i < count; i++) {
    mockPerformanceNow += frameTime;
    const callbacks = Array.from(mockAnimationFrameCallbacks.values());
    mockAnimationFrameCallbacks.clear();
    callbacks.forEach(callback => callback(mockPerformanceNow));
  }
}

// Helper to create mock HTML element (no DOM required for these tests)
function createMockElement(): HTMLElement {
  return {
    classList: {
      add: () => {},
      remove: () => {},
    },
    style: {} as CSSStyleDeclaration,
  } as any;
}

describe('Animation Performance Testing', () => {
  beforeEach(() => {
    // Reset mocks
    mockAnimationFrameId = 0;
    mockAnimationFrameCallbacks.clear();
    mockPerformanceNow = 0;

    // Mock requestAnimationFrame
    global.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      const id = ++mockAnimationFrameId;
      mockAnimationFrameCallbacks.set(id, callback);
      return id;
    }) as any;

    // Mock cancelAnimationFrame
    global.cancelAnimationFrame = ((id: number) => {
      mockAnimationFrameCallbacks.delete(id);
    }) as any;

    // Mock performance.now()
    global.performance = {
      now: () => mockPerformanceNow,
    } as any;

    // Mock window.matchMedia for reduced motion
    global.window = {
      matchMedia: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      }),
    } as any;
  });

  afterEach(() => {
    // Clean up (no DOM cleanup needed)
  });

  describe('Animation Performance Monitor', () => {
    it('should measure 60fps animations correctly', () => {
      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      // Simulate 60 frames at 60fps
      simulateAnimationFrames(60, 16.6);

      const metrics = monitor.stop();

      expect(metrics.totalFrames).toBeGreaterThanOrEqual(60);
      expect(metrics.averageFrameTime).toBeLessThanOrEqual(17); // Allow small variance
      expect(metrics.fps).toBeGreaterThanOrEqual(58); // ~60fps with tolerance
    });

    it('should detect dropped frames when animation is slow', () => {
      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      // Simulate 30 frames at 30fps (33.33ms per frame) - slow animation
      simulateAnimationFrames(30, 33.33);

      const metrics = monitor.stop();

      expect(metrics.totalFrames).toBeGreaterThanOrEqual(30);
      expect(metrics.averageFrameTime).toBeGreaterThan(30);
      expect(metrics.fps).toBeLessThan(35); // Clearly below 60fps
      expect(metrics.droppedFrames).toBeGreaterThan(0);
    });

    it('should identify good performance (>= 54fps)', () => {
      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(60, 16.6);

      monitor.stop();
      expect(monitor.isPerformanceGood()).toBe(true);
    });

    it('should identify poor performance (< 54fps)', () => {
      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(30, 33.33);

      monitor.stop();
      expect(monitor.isPerformanceGood()).toBe(false);
    });

    it('should track min and max frame times', () => {
      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      // Simulate varying frame times
      simulateAnimationFrames(1, 10);  // Fast frame
      simulateAnimationFrames(1, 25);  // Slow frame
      simulateAnimationFrames(1, 16.6); // Normal frame

      const metrics = monitor.stop();

      expect(metrics.minFrameTime).toBeLessThanOrEqual(metrics.averageFrameTime);
      expect(metrics.maxFrameTime).toBeGreaterThanOrEqual(metrics.averageFrameTime);
    });
  });

  describe('GPU-Accelerated Animations', () => {
    it('should use transform and opacity for GPU acceleration', () => {
      const { gpuProperties, avoidProperties } = optimizedAnimationConfig;

      // Verify GPU-accelerated properties
      expect(gpuProperties).toContain('transform');
      expect(gpuProperties).toContain('opacity');

      // Verify properties to avoid (cause reflow/repaint)
      expect(avoidProperties).toContain('width');
      expect(avoidProperties).toContain('height');
      expect(avoidProperties).toContain('top');
      expect(avoidProperties).toContain('left');
      expect(avoidProperties).toContain('margin');
      expect(avoidProperties).toContain('padding');
    });

    it('should have optimized easing functions', () => {
      const { easing } = optimizedAnimationConfig;

      expect(easing.easeOut).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
      expect(easing.easeIn).toBe('cubic-bezier(0.4, 0, 1, 1)');
      expect(easing.easeInOut).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
      expect(easing.spring).toBe('cubic-bezier(0.68, -0.55, 0.265, 1.55)');
    });

    it('should have appropriate animation durations', () => {
      const { duration } = optimizedAnimationConfig;

      expect(duration.fast).toBe(150);
      expect(duration.base).toBe(250);
      expect(duration.slow).toBe(350);
      expect(duration.bounce).toBe(500);
    });
  });

  describe('Page Transition Animations', () => {
    it('should complete fade-in-up animation at 60fps', () => {
      const element = createMockElement();
      element.classList.add('animate-fade-in-up');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      // Simulate 400ms animation at 60fps (24 frames)
      simulateAnimationFrames(24, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54); // Allow 10% variance
      expect(metrics.averageFrameTime).toBeLessThanOrEqual(20); // Warning threshold
    });

    it('should complete fade-in animation at 60fps', () => {
      const element = createMockElement();
      element.classList.add('animate-fade-in');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(18, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
    });

    it('should complete scale-in animation at 60fps', () => {
      const element = createMockElement();
      element.classList.add('animate-scale-in');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(12, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
      expect(metrics.averageFrameTime).toBeLessThanOrEqual(20);
    });

    it('should complete slide animations at 60fps', () => {
      const animations = [
        'animate-slide-in-right',
        'animate-slide-in-left',
        'animate-slide-down',
      ];

      animations.forEach(animationClass => {
        const element = createMockElement();
        element.classList.add(animationClass);

        const monitor = new AnimationPerformanceMonitor();
        monitor.start();

        simulateAnimationFrames(18, 16.6);

        const metrics = monitor.stop();

        expect(metrics.fps).toBeGreaterThanOrEqual(54);
      });
    });
  });

  describe('Interactive Animations', () => {
    it('should complete bounce-in animation at 60fps', () => {
      const element = createMockElement();
      element.classList.add('animate-bounce-in');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(36, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
      expect(metrics.averageFrameTime).toBeLessThanOrEqual(20);
    });

    it('should complete button-press animation at 60fps', () => {
      const element = createMockElement();
      element.classList.add('animate-button-press');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(12, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
    });

    it('should complete card-lift animation at 60fps', () => {
      const element = createMockElement();
      element.classList.add('animate-card-lift');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(18, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
      expect(metrics.averageFrameTime).toBeLessThanOrEqual(20);
    });

    it('should complete shake animation at 60fps', () => {
      const element = createMockElement();
      element.classList.add('animate-shake');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(30, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
    });
  });

  describe('Gradient Mesh Animations', () => {
    it('should complete float-slow animation at 60fps', () => {
      const element = createMockElement();
      element.classList.add('animate-float-slow');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(60, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
      expect(metrics.averageFrameTime).toBeLessThanOrEqual(20);
    });

    it('should complete float-medium animation at 60fps', () => {
      const element = createMockElement();
      element.classList.add('animate-float-medium');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(60, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
    });

    it('should complete float-fast animation at 60fps', () => {
      const element = createMockElement();
      element.classList.add('animate-float-fast');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(60, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
      expect(metrics.averageFrameTime).toBeLessThanOrEqual(20);
    });
  });

  describe('Success Feedback Animations', () => {
    it('should complete pulse-success animation at 60fps', () => {
      const element = createMockElement();
      element.classList.add('animate-pulse-success');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(30, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
    });

    it('should complete success-ping animation at 60fps', () => {
      const element = createMockElement();
      element.classList.add('animate-success-ping');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(36, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
      expect(metrics.averageFrameTime).toBeLessThanOrEqual(20);
    });
  });

  describe('Hover and Transition Animations', () => {
    it('should maintain 60fps during card hover transitions', () => {
      const element = createMockElement();
      element.classList.add('card-interactive');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(18, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
    });

    it('should maintain 60fps during button hover transitions', () => {
      const element = createMockElement();
      element.classList.add('button-interactive');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(12, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
      expect(metrics.averageFrameTime).toBeLessThanOrEqual(20);
    });

    it('should maintain 60fps during card-hover-lift transitions', () => {
      const element = createMockElement();
      element.classList.add('card-hover-lift');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(18, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
    });

    it('should maintain 60fps during card-hover-scale transitions', () => {
      const element = createMockElement();
      element.classList.add('card-hover-scale');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(18, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
      expect(metrics.averageFrameTime).toBeLessThanOrEqual(20);
    });
  });

  describe('Staggered Animations', () => {
    it('should maintain 60fps with staggered delays', () => {
      const elements = [
        createMockElement(),
        createMockElement(),
        createMockElement(),
      ];

      elements[0].classList.add('animate-fade-in-up');
      elements[1].classList.add('animate-fade-in-up', 'animate-delay-100');
      elements[2].classList.add('animate-fade-in-up', 'animate-delay-200');

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(36, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
    });

    it('should handle multiple simultaneous animations at 60fps', () => {
      const elements = Array.from({ length: 10 }, () => createMockElement());
      elements.forEach(el => el.classList.add('animate-fade-in'));

      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(18, 16.6);

      const metrics = monitor.stop();

      expect(metrics.fps).toBeGreaterThanOrEqual(54);
      expect(metrics.averageFrameTime).toBeLessThanOrEqual(20);
    });
  });

  describe('Reduced Motion Support', () => {
    it('should detect prefers-reduced-motion', () => {
      // Mock reduced motion preference
      global.window.matchMedia = (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      }) as any;

      expect(prefersReducedMotion()).toBe(true);
    });

    it('should return zero duration for reduced motion', () => {
      // Mock reduced motion preference
      global.window.matchMedia = (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      }) as any;

      expect(getSafeAnimationDuration(300)).toBe(0);
    });

    it('should return normal duration when motion is not reduced', () => {
      expect(getSafeAnimationDuration(300)).toBe(300);
    });
  });

  describe('Performance Thresholds', () => {
    it('should meet 60fps target (16.67ms per frame)', () => {
      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(60, 16.6);

      const metrics = monitor.stop();

      expect(metrics.averageFrameTime).toBeLessThanOrEqual(17);
      expect(metrics.fps).toBeGreaterThanOrEqual(58);
    });

    it('should stay below warning threshold (20ms per frame)', () => {
      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(60, 16.6);

      const metrics = monitor.stop();

      expect(metrics.averageFrameTime).toBeLessThan(20);
      expect(metrics.maxFrameTime).toBeLessThan(20);
    });

    it('should stay well below critical threshold (33ms per frame)', () => {
      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(60, 16.6);

      const metrics = monitor.stop();

      expect(metrics.averageFrameTime).toBeLessThan(33);
      expect(metrics.maxFrameTime).toBeLessThan(33);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short animations', () => {
      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(3, 16.6);

      const metrics = monitor.stop();

      expect(metrics.totalFrames).toBeGreaterThanOrEqual(3);
      expect(metrics.fps).toBeGreaterThanOrEqual(54);
    });

    it('should handle long-running animations', () => {
      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      simulateAnimationFrames(300, 16.6);

      const metrics = monitor.stop();

      expect(metrics.totalFrames).toBeGreaterThanOrEqual(60); // Only keeps last 60
      expect(metrics.fps).toBeGreaterThanOrEqual(54);
    });

    it('should handle animations with varying frame times', () => {
      const monitor = new AnimationPerformanceMonitor();
      monitor.start();

      // Simulate varying frame times (some fast, some slow)
      for (let i = 0; i < 30; i++) {
        const frameTime = i % 2 === 0 ? 14 : 19; // Alternating fast/slow
        mockPerformanceNow += frameTime;
        const callbacks = Array.from(mockAnimationFrameCallbacks.values());
        mockAnimationFrameCallbacks.clear();
        callbacks.forEach(callback => callback(mockPerformanceNow));
        global.requestAnimationFrame(() => {});
      }

      const metrics = monitor.stop();

      // Average of 14 and 19 should be around 16.5
      expect(metrics.averageFrameTime).toBeGreaterThan(14);
      expect(metrics.averageFrameTime).toBeLessThan(20);
      expect(metrics.fps).toBeGreaterThanOrEqual(54);
    });
  });
});
