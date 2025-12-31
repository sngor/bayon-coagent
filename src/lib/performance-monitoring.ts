/**
 * Performance Monitoring System
 * 
 * Provides comprehensive performance tracking, metrics collection,
 * and optimization recommendations for the Bayon Coagent platform.
 */

import { z } from 'zod';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: number;
  context?: Record<string, any>;
}

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: 'script' | 'stylesheet' | 'image' | 'fetch' | 'other';
}

export interface PerformanceReport {
  pageUrl: string;
  userAgent: string;
  timestamp: number;
  webVitals: WebVitalsMetric[];
  customMetrics: PerformanceMetric[];
  resourceTimings: ResourceTiming[];
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

// ============================================================================
// Performance Monitoring Class
// ============================================================================

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private isInitialized = false;

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.setupWebVitalsObserver();
    this.setupResourceTimingObserver();
    this.setupNavigationTimingObserver();
    this.setupMemoryMonitoring();
    
    this.isInitialized = true;
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'] = 'ms',
    context?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      context,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Keep only last 100 metrics per type
    if (metrics.length > 100) {
      metrics.shift();
    }

    // Send to analytics if configured
    this.sendToAnalytics(metric);
  }

  /**
   * Measure function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric(name, duration, 'ms', {
        ...context,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric(name, duration, 'ms', {
        ...context,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  /**
   * Measure synchronous function execution time
   */
  measure<T>(
    name: string,
    fn: () => T,
    context?: Record<string, any>
  ): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric(name, duration, 'ms', {
        ...context,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric(name, duration, 'ms', {
        ...context,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  /**
   * Get performance metrics for a specific name
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): Map<string, PerformanceMetric[]> {
    return new Map(this.metrics);
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now(),
      webVitals: this.getWebVitalsMetrics(),
      customMetrics: Array.from(this.metrics.values()).flat(),
      resourceTimings: this.getResourceTimings(),
    };

    // Add memory usage if available
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      report.memoryUsage = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }

    return report;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setupWebVitalsObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      
      this.recordMetric('LCP', lastEntry.startTime, 'ms', {
        element: lastEntry.element?.tagName,
        url: lastEntry.url,
      });
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.recordMetric('FID', entry.processingStart - entry.startTime, 'ms', {
          eventType: entry.name,
        });
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      this.recordMetric('CLS', clsValue, 'count');
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    } catch (e) {
      console.warn('CLS observer not supported');
    }
  }

  private setupResourceTimingObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const resourceType = this.getResourceType(entry.name, entry.initiatorType);
        
        this.recordMetric(`resource_${resourceType}_duration`, entry.duration, 'ms', {
          name: entry.name,
          size: entry.transferSize || 0,
        });

        if (entry.transferSize) {
          this.recordMetric(`resource_${resourceType}_size`, entry.transferSize, 'bytes', {
            name: entry.name,
          });
        }
      });
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (e) {
      console.warn('Resource timing observer not supported');
    }
  }

  private setupNavigationTimingObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    const navigationObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        // Time to First Byte (TTFB)
        const ttfb = entry.responseStart - entry.requestStart;
        this.recordMetric('TTFB', ttfb, 'ms');

        // DOM Content Loaded
        const dcl = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
        this.recordMetric('DCL', dcl, 'ms');

        // Load Complete
        const loadComplete = entry.loadEventEnd - entry.loadEventStart;
        this.recordMetric('LoadComplete', loadComplete, 'ms');
      });
    });

    try {
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navigationObserver);
    } catch (e) {
      console.warn('Navigation timing observer not supported');
    }
  }

  private setupMemoryMonitoring(): void {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    // Monitor memory usage every 30 seconds
    setInterval(() => {
      const memory = (performance as any).memory;
      
      this.recordMetric('memory_used', memory.usedJSHeapSize, 'bytes');
      this.recordMetric('memory_total', memory.totalJSHeapSize, 'bytes');
      this.recordMetric('memory_limit', memory.jsHeapSizeLimit, 'bytes');
      
      // Calculate memory usage percentage
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      this.recordMetric('memory_usage_percentage', usagePercentage, 'percentage');
    }, 30000);
  }

  private getResourceType(url: string, initiatorType: string): string {
    if (initiatorType === 'script') return 'script';
    if (initiatorType === 'link' || url.includes('.css')) return 'stylesheet';
    if (initiatorType === 'img' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return 'image';
    if (initiatorType === 'fetch' || initiatorType === 'xmlhttprequest') return 'fetch';
    return 'other';
  }

  private getWebVitalsMetrics(): WebVitalsMetric[] {
    const webVitals: WebVitalsMetric[] = [];
    
    // Convert recorded metrics to Web Vitals format
    ['LCP', 'FID', 'CLS', 'TTFB'].forEach(name => {
      const metrics = this.getMetrics(name);
      if (metrics.length > 0) {
        const latestMetric = metrics[metrics.length - 1];
        webVitals.push({
          name: name as WebVitalsMetric['name'],
          value: latestMetric.value,
          rating: this.getWebVitalRating(name, latestMetric.value),
          timestamp: latestMetric.timestamp,
        });
      }
    });

    return webVitals;
  }

  private getWebVitalRating(name: string, value: number): WebVitalsMetric['rating'] {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private getResourceTimings(): ResourceTiming[] {
    const resourceTimings: ResourceTiming[] = [];
    
    ['script', 'stylesheet', 'image', 'fetch', 'other'].forEach(type => {
      const durationMetrics = this.getMetrics(`resource_${type}_duration`);
      const sizeMetrics = this.getMetrics(`resource_${type}_size`);
      
      durationMetrics.forEach((metric, index) => {
        const sizeMetric = sizeMetrics[index];
        resourceTimings.push({
          name: metric.context?.name || 'unknown',
          duration: metric.value,
          size: sizeMetric?.value || 0,
          type: type as ResourceTiming['type'],
        });
      });
    });

    return resourceTimings;
  }

  private sendToAnalytics(metric: PerformanceMetric): void {
    // In a real implementation, you would send this to your analytics service
    // For now, we'll just log it in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metric:', metric);
    }
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
    this.isInitialized = false;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const performanceMonitor = new PerformanceMonitor();

// ============================================================================
// React Hook
// ============================================================================

export function usePerformanceMonitor() {
  const recordMetric = (
    name: string,
    value: number,
    unit: PerformanceMetric['unit'] = 'ms',
    context?: Record<string, any>
  ) => {
    performanceMonitor.recordMetric(name, value, unit, context);
  };

  const measureAsync = async <T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> => {
    return performanceMonitor.measureAsync(name, fn, context);
  };

  const measure = <T>(
    name: string,
    fn: () => T,
    context?: Record<string, any>
  ): T => {
    return performanceMonitor.measure(name, fn, context);
  };

  const getMetrics = (name: string) => performanceMonitor.getMetrics(name);
  const generateReport = () => performanceMonitor.generateReport();

  return {
    recordMetric,
    measureAsync,
    measure,
    getMetrics,
    generateReport,
  };
}

// ============================================================================
// Performance Decorators
// ============================================================================

/**
 * Decorator for measuring method performance
 */
export function measurePerformance(metricName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      return performanceMonitor.measure(name, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Decorator for measuring async method performance
 */
export function measureAsyncPerformance(metricName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      return performanceMonitor.measureAsync(name, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}