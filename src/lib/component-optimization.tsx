/**
 * Component Optimization Utilities
 * 
 * Provides utilities for optimizing React components including memoization,
 * lazy loading, virtual scrolling, and performance monitoring.
 */

import React, { 
  memo, 
  useMemo, 
  useCallback, 
  lazy, 
  Suspense, 
  forwardRef,
  useRef,
  useEffect,
  useState,
} from 'react';
import { performanceMonitor } from './performance-monitoring';

// ============================================================================
// Memoization Utilities
// ============================================================================

/**
 * Enhanced memo with custom comparison function
 */
export function createMemoComponent<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  const MemoizedComponent = memo(Component, propsAreEqual);
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

/**
 * Shallow comparison for props (useful for memo)
 */
export function shallowEqual<T extends Record<string, any>>(obj1: T, obj2: T): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Deep comparison for complex props
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

// ============================================================================
// Lazy Loading Utilities
// ============================================================================

interface LazyComponentOptions {
  fallback?: React.ComponentType;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Enhanced lazy loading with error handling and retry logic
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  options: LazyComponentOptions = {}
) {
  const { fallback: Fallback, retryCount = 3, retryDelay = 1000 } = options;

  const LazyComponent = lazy(() => {
    let attempts = 0;
    
    const loadWithRetry = async (): Promise<{ default: React.ComponentType<P> }> => {
      try {
        return await importFn();
      } catch (error) {
        attempts++;
        
        if (attempts < retryCount) {
          console.warn(`Failed to load component, retrying... (${attempts}/${retryCount})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return loadWithRetry();
        }
        
        throw error;
      }
    };
    
    return loadWithRetry();
  });

  return forwardRef<any, P>((props, ref) => (
    <Suspense fallback={Fallback ? <Fallback /> : <div>Loading...</div>}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
}

/**
 * Preload a lazy component
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  importFn().catch(error => {
    console.warn('Failed to preload component:', error);
  });
}

// ============================================================================
// Virtual Scrolling
// ============================================================================

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Performance Monitoring HOC
// ============================================================================

interface WithPerformanceMonitoringOptions {
  measureRender?: boolean;
  measureEffects?: boolean;
  logSlowRenders?: boolean;
  slowRenderThreshold?: number; // milliseconds
}

export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  options: WithPerformanceMonitoringOptions = {}
) {
  const {
    measureRender = true,
    measureEffects = true,
    logSlowRenders = true,
    slowRenderThreshold = 16, // 60fps = 16.67ms per frame
  } = options;

  const PerformanceMonitoredComponent = forwardRef<any, P>((props, ref) => {
    const renderStartTime = useRef<number>();
    const componentName = Component.displayName || Component.name || 'Unknown';

    // Measure render time
    if (measureRender) {
      renderStartTime.current = performance.now();
    }

    useEffect(() => {
      if (measureRender && renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        
        performanceMonitor.recordMetric(
          `component_render_${componentName}`,
          renderTime,
          'ms',
          { componentName }
        );

        if (logSlowRenders && renderTime > slowRenderThreshold) {
          console.warn(
            `Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms to render`
          );
        }
      }
    });

    // Measure effect execution time
    useEffect(() => {
      if (measureEffects) {
        const effectStartTime = performance.now();
        
        return () => {
          const effectTime = performance.now() - effectStartTime;
          performanceMonitor.recordMetric(
            `component_effect_${componentName}`,
            effectTime,
            'ms',
            { componentName }
          );
        };
      }
    });

    return <Component {...props} ref={ref} />;
  });

  PerformanceMonitoredComponent.displayName = `WithPerformanceMonitoring(${componentName})`;
  
  return PerformanceMonitoredComponent;
}

// ============================================================================
// Intersection Observer Hook
// ============================================================================

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const { threshold = 0, rootMargin = '0px', triggerOnce = false } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    if (triggerOnce && hasTriggered) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersectingNow = entry.isIntersecting;
        setIsIntersecting(isIntersectingNow);
        
        if (triggerOnce && isIntersectingNow) {
          setHasTriggered(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { ref: targetRef, isIntersecting, hasTriggered };
}

// ============================================================================
// Debounced State Hook
// ============================================================================

export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [value, debouncedValue, setValue];
}

// ============================================================================
// Optimized List Component
// ============================================================================

interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
  itemClassName?: string;
  virtualized?: boolean;
  itemHeight?: number;
  containerHeight?: number;
  loadingComponent?: React.ComponentType;
  emptyComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  className = '',
  itemClassName = '',
  virtualized = false,
  itemHeight = 50,
  containerHeight = 400,
  loadingComponent: LoadingComponent,
  emptyComponent: EmptyComponent,
  errorComponent: ErrorComponent,
}: OptimizedListProps<T>) {
  const [error, setError] = useState<Error | null>(null);

  const memoizedRenderItem = useCallback(
    (item: T, index: number) => {
      try {
        return (
          <div key={keyExtractor(item, index)} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        );
      } catch (err) {
        setError(err as Error);
        return null;
      }
    },
    [renderItem, keyExtractor, itemClassName]
  );

  const retry = useCallback(() => {
    setError(null);
  }, []);

  if (error && ErrorComponent) {
    return <ErrorComponent error={error} retry={retry} />;
  }

  if (items.length === 0 && EmptyComponent) {
    return <EmptyComponent />;
  }

  if (virtualized && itemHeight && containerHeight) {
    return (
      <VirtualScroll
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={memoizedRenderItem}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      {items.map(memoizedRenderItem)}
    </div>
  );
}

// ============================================================================
// Component Size Tracker
// ============================================================================

export function useComponentSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.unobserve(element);
    };
  }, []);

  return { ref, size };
}

// ============================================================================
// Render Optimization Utilities
// ============================================================================

/**
 * Prevent unnecessary re-renders by stabilizing object references
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Memoize expensive calculations
 */
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Create a stable object reference
 */
export function useStableObject<T extends Record<string, any>>(obj: T): T {
  return useMemo(() => obj, Object.values(obj));
}

// ============================================================================
// Error Boundary Hook
// ============================================================================

export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureError = useCallback((error: Error) => {
    setError(error);
  }, []);

  useEffect(() => {
    if (error) {
      console.error('Component Error:', error);
    }
  }, [error]);

  return { error, resetError, captureError };
}