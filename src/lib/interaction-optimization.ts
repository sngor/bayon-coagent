/**
 * Interaction Optimization Utilities
 * 
 * This module provides utilities to ensure UI responds within 100ms to interactions
 * and implements optimistic UI updates for better perceived performance.
 * 
 * Requirements: 17.2 - Ensure UI responds within 100ms to interactions
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Debounces a function call, delaying execution until after wait milliseconds
 * have elapsed since the last time it was invoked.
 * 
 * Use for: Search inputs, resize handlers, scroll handlers
 * 
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait (default: 300ms)
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
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
 * Throttles a function call, ensuring it's only called once per specified time period.
 * 
 * Use for: Scroll handlers, mouse move handlers, resize handlers
 * 
 * @param func - Function to throttle
 * @param limit - Milliseconds between calls (default: 100ms for responsive feel)
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 100
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
 * React hook for debounced values
 * 
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React hook for throttled values
 * 
 * @param value - Value to throttle
 * @param limit - Limit in milliseconds (default: 100ms)
 * @returns Throttled value
 */
export function useThrottle<T>(value: T, limit: number = 100): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * React hook for debounced callbacks
 * 
 * @param callback - Callback to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * React hook for throttled callbacks
 * 
 * @param callback - Callback to throttle
 * @param limit - Limit in milliseconds (default: 100ms)
 * @returns Throttled callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 100
): (...args: Parameters<T>) => void {
  const inThrottle = useRef(false);

  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    },
    [callback, limit]
  );
}

/**
 * Optimistic UI Update Manager
 * 
 * Provides utilities for implementing optimistic UI updates that respond
 * immediately to user actions while the actual operation completes in the background.
 */
export interface OptimisticUpdate<T> {
  /** Unique identifier for this update */
  id: string;
  /** The optimistic data to display */
  data: T;
  /** Timestamp when the update was created */
  timestamp: number;
  /** Whether the update has been confirmed by the server */
  confirmed: boolean;
  /** Error if the update failed */
  error?: Error;
}

/**
 * React hook for managing optimistic UI updates
 * 
 * @param initialData - Initial data state
 * @returns Object with current data, pending updates, and update functions
 */
export function useOptimisticUpdate<T>(initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [pendingUpdates, setPendingUpdates] = useState<OptimisticUpdate<Partial<T>>[]>([]);

  /**
   * Apply an optimistic update immediately
   * 
   * @param updateData - Partial data to update optimistically
   * @param updateFn - Async function that performs the actual update
   * @returns Promise that resolves when the update is confirmed
   */
  const applyOptimisticUpdate = useCallback(
    async (
      updateData: Partial<T>,
      updateFn: () => Promise<T>
    ): Promise<T> => {
      const updateId = `${Date.now()}-${Math.random()}`;
      
      // Immediately apply the optimistic update
      setData((current) => ({ ...current, ...updateData }));
      
      // Track the pending update
      const update: OptimisticUpdate<Partial<T>> = {
        id: updateId,
        data: updateData,
        timestamp: Date.now(),
        confirmed: false,
      };
      setPendingUpdates((current) => [...current, update]);

      try {
        // Perform the actual update
        const result = await updateFn();
        
        // Confirm the update
        setPendingUpdates((current) =>
          current.map((u) =>
            u.id === updateId ? { ...u, confirmed: true } : u
          )
        );
        
        // Update with the confirmed data
        setData(result);
        
        // Remove the confirmed update after a short delay
        setTimeout(() => {
          setPendingUpdates((current) =>
            current.filter((u) => u.id !== updateId)
          );
        }, 1000);
        
        return result;
      } catch (error) {
        // Revert the optimistic update on error
        setPendingUpdates((current) =>
          current.map((u) =>
            u.id === updateId
              ? { ...u, error: error as Error }
              : u
          )
        );
        
        // Revert the data (this is simplified - in production you'd want to track the previous state)
        setData(initialData);
        
        throw error;
      }
    },
    [initialData]
  );

  /**
   * Clear all pending updates
   */
  const clearPendingUpdates = useCallback(() => {
    setPendingUpdates([]);
  }, []);

  return {
    data,
    pendingUpdates,
    applyOptimisticUpdate,
    clearPendingUpdates,
    hasPendingUpdates: pendingUpdates.length > 0,
  };
}

/**
 * Ensures a function responds within a specified time limit
 * If the function takes longer, a timeout callback is invoked
 * 
 * @param func - Function to execute
 * @param timeoutMs - Maximum time to wait (default: 100ms)
 * @param onTimeout - Callback to invoke if timeout is exceeded
 * @returns Wrapped function
 */
export function withResponseTimeout<T extends (...args: any[]) => Promise<any>>(
  func: T,
  timeoutMs: number = 100,
  onTimeout?: () => void
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        if (onTimeout) {
          onTimeout();
        }
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([func(...args), timeoutPromise]);
  };
}

/**
 * Measures the response time of an interaction
 * Useful for monitoring and ensuring 100ms response time
 * 
 * @param label - Label for the interaction
 * @param func - Function to measure
 * @returns Wrapped function that logs performance
 */
export function measureInteractionTime<T extends (...args: any[]) => any>(
  label: string,
  func: T
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    const startTime = performance.now();
    const result = func(...args);

    // If it's a promise, measure when it resolves
    if (result instanceof Promise) {
      result.then(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (duration > 100) {
          console.warn(
            `[Performance] ${label} took ${duration.toFixed(2)}ms (target: <100ms)`
          );
        } else {
          console.log(
            `[Performance] ${label} took ${duration.toFixed(2)}ms ✓`
          );
        }
      });
    } else {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) {
        console.warn(
          `[Performance] ${label} took ${duration.toFixed(2)}ms (target: <100ms)`
        );
      }
    }

    return result;
  };
}

/**
 * Request idle callback wrapper for non-critical updates
 * Defers work until the browser is idle
 * 
 * @param callback - Callback to execute when idle
 * @param options - Options for requestIdleCallback
 */
export function runWhenIdle(
  callback: () => void,
  options?: { timeout?: number }
): void {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, options);
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(callback, 1);
  }
}

/**
 * React hook for running effects when the browser is idle
 * 
 * @param callback - Callback to execute when idle
 * @param deps - Dependencies array
 */
export function useIdleEffect(
  callback: () => void,
  deps: React.DependencyList
): void {
  useEffect(() => {
    runWhenIdle(callback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
