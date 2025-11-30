/**
 * Animation Performance Optimization Utilities
 * 
 * This module provides utilities for optimizing animation performance,
 * ensuring 60fps during all animations, and monitoring performance metrics.
 * 
 * Key optimizations:
 * - GPU acceleration via transform and opacity
 * - Strategic will-change hints
 * - Performance monitoring
 * - Reduced motion support
 */

import React from "react";

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  TARGET_FPS: 60,
  FRAME_TIME_MS: 16.67, // 1000ms / 60fps
  WARNING_THRESHOLD_MS: 20, // Warn if frame takes longer than 20ms
  CRITICAL_THRESHOLD_MS: 33, // Critical if frame takes longer than 33ms (30fps)
} as const;

// Animation performance metrics
export interface AnimationMetrics {
  averageFrameTime: number;
  maxFrameTime: number;
  minFrameTime: number;
  droppedFrames: number;
  totalFrames: number;
  fps: number;
}

// Performance monitor class
export class AnimationPerformanceMonitor {
  private frameTimestamps: number[] = [];
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private isMonitoring: boolean = false;
  private metrics: AnimationMetrics = {
    averageFrameTime: 0,
    maxFrameTime: 0,
    minFrameTime: Infinity,
    droppedFrames: 0,
    totalFrames: 0,
    fps: 0,
  };

  /**
   * Start monitoring animation performance
   */
  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.frameTimestamps = [];
    this.lastFrameTime = performance.now();
    this.measureFrame();
  }

  /**
   * Stop monitoring and return metrics
   */
  stop(): AnimationMetrics {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.isMonitoring = false;
    this.calculateMetrics();
    return this.metrics;
  }

  /**
   * Measure individual frame performance
   */
  private measureFrame = (): void => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;

    this.frameTimestamps.push(frameTime);
    this.lastFrameTime = currentTime;

    // Keep only last 60 frames (1 second at 60fps)
    if (this.frameTimestamps.length > 60) {
      this.frameTimestamps.shift();
    }

    this.animationFrameId = requestAnimationFrame(this.measureFrame);
  };

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(): void {
    if (this.frameTimestamps.length === 0) return;

    const sum = this.frameTimestamps.reduce((a, b) => a + b, 0);
    this.metrics.averageFrameTime = sum / this.frameTimestamps.length;
    this.metrics.maxFrameTime = Math.max(...this.frameTimestamps);
    this.metrics.minFrameTime = Math.min(...this.frameTimestamps);
    this.metrics.totalFrames = this.frameTimestamps.length;
    this.metrics.fps = 1000 / this.metrics.averageFrameTime;

    // Count dropped frames (frames that took longer than target)
    this.metrics.droppedFrames = this.frameTimestamps.filter(
      (time) => time > PERFORMANCE_THRESHOLDS.FRAME_TIME_MS
    ).length;
  }

  /**
   * Get current metrics without stopping
   */
  getMetrics(): AnimationMetrics {
    this.calculateMetrics();
    return { ...this.metrics };
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceGood(): boolean {
    this.calculateMetrics();
    return (
      this.metrics.fps >= PERFORMANCE_THRESHOLDS.TARGET_FPS * 0.9 && // Allow 10% variance
      this.metrics.averageFrameTime <= PERFORMANCE_THRESHOLDS.WARNING_THRESHOLD_MS
    );
  }
}

/**
 * Apply will-change hint to element for animation optimization
 * Automatically removes hint after animation completes
 */
export function applyWillChange(
  element: HTMLElement,
  properties: string[],
  duration: number = 1000
): void {
  // Apply will-change
  element.style.willChange = properties.join(", ");

  // Remove after animation completes + buffer
  setTimeout(() => {
    element.style.willChange = "auto";
  }, duration + 100);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get safe animation duration based on user preferences
 */
export function getSafeAnimationDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}

/**
 * Create GPU-accelerated animation class names
 * These use transform and opacity for best performance
 */
export const gpuAnimationClasses = {
  fadeIn: "animate-fade-in",
  fadeOut: "animate-fade-out",
  fadeInUp: "animate-fade-in-up",
  scaleIn: "animate-scale-in",
  slideInRight: "animate-slide-in-right",
  slideInLeft: "animate-slide-in-left",
  slideDown: "animate-slide-down",
} as const;

/**
 * Performance-optimized animation configuration
 */
export const optimizedAnimationConfig = {
  // Use transform and opacity only (GPU accelerated)
  gpuProperties: ["transform", "opacity"],

  // Avoid these properties in animations (cause reflow/repaint)
  avoidProperties: [
    "width",
    "height",
    "top",
    "left",
    "right",
    "bottom",
    "margin",
    "padding",
    "border-width",
  ],

  // Recommended easing functions
  easing: {
    easeOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },

  // Recommended durations
  duration: {
    fast: 150,
    base: 250,
    slow: 350,
    bounce: 500,
  },
} as const;

/**
 * Debounce function for performance-sensitive operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance-sensitive operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Request idle callback with fallback
 */
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): number {
  if ("requestIdleCallback" in window) {
    return window.requestIdleCallback(callback, options);
  }

  // Fallback to setTimeout
  return setTimeout(callback, 1) as unknown as number;
}

/**
 * Cancel idle callback with fallback
 */
export function cancelIdleCallback(id: number): void {
  if ("cancelIdleCallback" in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Measure animation performance for a specific element
 */
export async function measureAnimationPerformance(
  element: HTMLElement,
  animationClass: string,
  duration: number = 1000
): Promise<AnimationMetrics> {
  const monitor = new AnimationPerformanceMonitor();

  return new Promise((resolve) => {
    monitor.start();

    // Add animation class
    element.classList.add(animationClass);

    // Wait for animation to complete
    setTimeout(() => {
      const metrics = monitor.stop();
      element.classList.remove(animationClass);
      resolve(metrics);
    }, duration);
  });
}

/**
 * Log performance metrics to console (development only)
 */
export function logPerformanceMetrics(
  metrics: AnimationMetrics,
  label: string = "Animation"
): void {
  if (process.env.NODE_ENV !== "development") return;

  console.group(`${label} Performance Metrics`);
  console.log(`FPS: ${metrics.fps.toFixed(2)}`);
  console.log(`Average Frame Time: ${metrics.averageFrameTime.toFixed(2)}ms`);
  console.log(`Max Frame Time: ${metrics.maxFrameTime.toFixed(2)}ms`);
  console.log(`Min Frame Time: ${metrics.minFrameTime.toFixed(2)}ms`);
  console.log(`Dropped Frames: ${metrics.droppedFrames}/${metrics.totalFrames}`);

  // Performance assessment
  if (metrics.fps >= PERFORMANCE_THRESHOLDS.TARGET_FPS * 0.9) {
    console.log("✅ Performance: Excellent");
  } else if (metrics.fps >= 30) {
    console.warn("⚠️ Performance: Acceptable but could be improved");
  } else {
    console.error("❌ Performance: Poor - optimization needed");
  }

  console.groupEnd();
}

/**
 * Create a performance-optimized animation hook
 */
export function useOptimizedAnimation(
  ref: React.RefObject<HTMLElement>,
  animationClass: string,
  trigger: boolean,
  duration: number = 300
): void {
  React.useEffect(() => {
    if (!ref.current || !trigger) return;

    const element = ref.current;

    // Apply will-change hint
    applyWillChange(element, ["transform", "opacity"], duration);

    // Add animation class
    element.classList.add(animationClass);

    // Remove class after animation
    const timeout = setTimeout(() => {
      element.classList.remove(animationClass);
    }, duration);

    return () => {
      clearTimeout(timeout);
      element.style.willChange = "auto";
    };
  }, [ref, animationClass, trigger, duration]);
}

// Export singleton monitor for global use
export const globalPerformanceMonitor = new AnimationPerformanceMonitor();

/**
 * Initialize performance monitoring in development
 */
export function initPerformanceMonitoring(): void {
  if (process.env.NODE_ENV !== "development") return;

  // Monitor overall page performance
  if ("PerformanceObserver" in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "measure") {
          console.log(`Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
      }
    });

    observer.observe({ entryTypes: ["measure"] });
  }

  // Log FPS periodically
  setInterval(() => {
    const metrics = globalPerformanceMonitor.getMetrics();
    if (metrics.totalFrames > 0) {
      console.log(`Current FPS: ${metrics.fps.toFixed(2)}`);
    }
  }, 5000);
}

// React import for hook

