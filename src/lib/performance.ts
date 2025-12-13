/**
 * Performance monitoring utilities for AI operations
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();

  startTimer(operation: string): string {
    const id = `${operation}-${Date.now()}-${Math.random()}`;
    this.timers.set(id, performance.now());
    return id;
  }

  endTimer(id: string, success: boolean = true, metadata?: Record<string, any>): void {
    const startTime = this.timers.get(id);
    if (!startTime) return;

    const duration = performance.now() - startTime;
    const operation = id.split('-')[0];

    this.metrics.push({
      operation,
      duration,
      success,
      metadata,
      timestamp: Date.now()
    });

    this.timers.delete(id);

    // Log slow operations (>10s)
    if (duration > 10000) {
      console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  getMetrics(operation?: string): PerformanceMetric[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return [...this.metrics];
  }

  getAverageTime(operation: string): number {
    const operationMetrics = this.getMetrics(operation);
    if (operationMetrics.length === 0) return 0;

    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / operationMetrics.length;
  }

  getSuccessRate(operation: string): number {
    const operationMetrics = this.getMetrics(operation);
    if (operationMetrics.length === 0) return 0;

    const successful = operationMetrics.filter(m => m.success).length;
    return (successful / operationMetrics.length) * 100;
  }

  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Helper hook for React components
export function usePerformanceTimer(operation: string) {
  const startTimer = () => performanceMonitor.startTimer(operation);
  const endTimer = (id: string, success: boolean = true, metadata?: Record<string, any>) =>
    performanceMonitor.endTimer(id, success, metadata);

  return { startTimer, endTimer };
}

// Decorator for server actions
export function withPerformanceTracking<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const id = performanceMonitor.startTimer(operation);
    try {
      const result = await fn(...args);
      performanceMonitor.endTimer(id, true, { argsLength: args.length });
      return result;
    } catch (error) {
      performanceMonitor.endTimer(id, false, { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  };
}

// Log performance metrics for development monitoring
export function logPerformanceMetrics(): void {
  if (typeof window === 'undefined') return; // Server-side guard

  // Log Web Vitals and performance metrics
  if ('performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      const metrics = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: 0,
        firstContentfulPaint: 0,
      };

      // Get paint metrics if available
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-paint') {
          metrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime;
        }
      });

      console.log('🚀 Performance Metrics:', metrics);

      // Warn if initial content takes longer than 2 seconds
      if (metrics.firstContentfulPaint > 2000) {
        console.warn('⚠️ Slow initial content load:', `${metrics.firstContentfulPaint.toFixed(2)}ms`);
      }
    }
  }
}