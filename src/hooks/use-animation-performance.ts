/**
 * React hooks for animation performance monitoring and optimization
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  AnimationPerformanceMonitor,
  applyWillChange,
  prefersReducedMotion,
  getSafeAnimationDuration,
  type AnimationMetrics,
} from "@/lib/animation-performance";

/**
 * Hook to monitor animation performance
 * 
 * @example
 * const { metrics, isGood, start, stop } = useAnimationPerformance();
 * 
 * useEffect(() => {
 *   start();
 *   return () => stop();
 * }, []);
 */
export function useAnimationPerformance() {
  const monitorRef = useRef<AnimationPerformanceMonitor | null>(null);
  const [metrics, setMetrics] = useState<AnimationMetrics | null>(null);
  const [isGood, setIsGood] = useState<boolean>(true);

  useEffect(() => {
    monitorRef.current = new AnimationPerformanceMonitor();

    return () => {
      if (monitorRef.current) {
        monitorRef.current.stop();
      }
    };
  }, []);

  const start = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.start();
    }
  }, []);

  const stop = useCallback(() => {
    if (monitorRef.current) {
      const finalMetrics = monitorRef.current.stop();
      setMetrics(finalMetrics);
      setIsGood(monitorRef.current.isPerformanceGood());
      return finalMetrics;
    }
    return null;
  }, []);

  const getMetrics = useCallback(() => {
    if (monitorRef.current) {
      const currentMetrics = monitorRef.current.getMetrics();
      setMetrics(currentMetrics);
      setIsGood(monitorRef.current.isPerformanceGood());
      return currentMetrics;
    }
    return null;
  }, []);

  return {
    metrics,
    isGood,
    start,
    stop,
    getMetrics,
  };
}

/**
 * Hook to apply optimized animations to an element
 * Automatically handles will-change hints and cleanup
 * 
 * @example
 * const ref = useOptimizedAnimation("animate-fade-in", isVisible, 300);
 * return <div ref={ref}>Content</div>;
 */
export function useOptimizedAnimation<T extends HTMLElement = HTMLElement>(
  animationClass: string,
  trigger: boolean,
  duration: number = 300
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current || !trigger) return;

    const element = ref.current;
    const safeDuration = getSafeAnimationDuration(duration);

    // Skip animation if reduced motion is preferred
    if (prefersReducedMotion()) {
      element.classList.add(animationClass);
      return;
    }

    // Apply will-change hint
    applyWillChange(element, ["transform", "opacity"], safeDuration);

    // Add animation class
    element.classList.add(animationClass);

    // Remove class after animation
    const timeout = setTimeout(() => {
      element.classList.remove(animationClass);
    }, safeDuration);

    return () => {
      clearTimeout(timeout);
      element.style.willChange = "auto";
      element.classList.remove(animationClass);
    };
  }, [animationClass, trigger, duration]);

  return ref;
}

/**
 * Hook to check if user prefers reduced motion
 * 
 * @example
 * const prefersReduced = useReducedMotion();
 * const duration = prefersReduced ? 0 : 300;
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReduced;
}

/**
 * Hook to get safe animation duration based on user preferences
 * 
 * @example
 * const duration = useSafeAnimationDuration(300);
 */
export function useSafeAnimationDuration(duration: number): number {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? 0 : duration;
}

/**
 * Hook to apply will-change hints strategically
 * Automatically removes hints after animation completes
 * 
 * @example
 * const ref = useWillChange(["transform", "opacity"], isAnimating, 300);
 * return <div ref={ref}>Content</div>;
 */
export function useWillChange<T extends HTMLElement = HTMLElement>(
  properties: string[],
  isActive: boolean,
  duration: number = 300
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current || !isActive) return;

    const element = ref.current;

    // Apply will-change
    element.style.willChange = properties.join(", ");

    // Remove after duration + buffer
    const timeout = setTimeout(() => {
      element.style.willChange = "auto";
    }, duration + 100);

    return () => {
      clearTimeout(timeout);
      element.style.willChange = "auto";
    };
  }, [properties, isActive, duration]);

  return ref;
}

/**
 * Hook to measure FPS during component lifecycle
 * Useful for debugging performance issues
 * 
 * @example
 * const fps = useFPS();
 * console.log(`Current FPS: ${fps}`);
 */
export function useFPS(): number {
  const [fps, setFps] = useState<number>(60);
  const frameTimestamps = useRef<number[]>([]);
  const lastFrameTime = useRef<number>(performance.now());
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const measureFrame = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastFrameTime.current;

      frameTimestamps.current.push(frameTime);
      lastFrameTime.current = currentTime;

      // Keep only last 60 frames
      if (frameTimestamps.current.length > 60) {
        frameTimestamps.current.shift();
      }

      // Calculate FPS
      if (frameTimestamps.current.length > 0) {
        const avgFrameTime =
          frameTimestamps.current.reduce((a, b) => a + b, 0) /
          frameTimestamps.current.length;
        setFps(Math.round(1000 / avgFrameTime));
      }

      animationFrameId.current = requestAnimationFrame(measureFrame);
    };

    animationFrameId.current = requestAnimationFrame(measureFrame);

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return fps;
}

/**
 * Hook to detect if animations are janky (below 60fps)
 * 
 * @example
 * const isJanky = useJankyDetection();
 * if (isJanky) console.warn("Animations are janky!");
 */
export function useJankyDetection(threshold: number = 55): boolean {
  const fps = useFPS();
  return fps < threshold;
}

/**
 * Hook to apply GPU acceleration to an element
 * 
 * @example
 * const ref = useGPUAcceleration();
 * return <div ref={ref}>Content</div>;
 */
export function useGPUAcceleration<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    // Apply GPU acceleration
    element.style.transform = "translateZ(0)";
    element.style.backfaceVisibility = "hidden";

    return () => {
      element.style.transform = "";
      element.style.backfaceVisibility = "";
    };
  }, []);

  return ref;
}
