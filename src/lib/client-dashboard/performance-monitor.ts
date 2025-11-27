/**
 * Performance Monitoring for Client Dashboard
 * 
 * Tracks and reports performance metrics for optimization
 * 
 * Requirements: Performance optimization (Task 26)
 */

export interface PerformanceMetric {
    name: string;
    value: number;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface PerformanceReport {
    metrics: PerformanceMetric[];
    summary: {
        avgLoadTime: number;
        avgRenderTime: number;
        cacheHitRate: number;
        errorRate: number;
    };
}

/**
 * Performance monitor class
 */
class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private maxMetrics = 1000; // Keep last 1000 metrics

    /**
     * Track a performance metric
     */
    track(name: string, value: number, metadata?: Record<string, any>): void {
        const metric: PerformanceMetric = {
            name,
            value,
            timestamp: Date.now(),
            metadata,
        };

        this.metrics.push(metric);

        // Keep only the last N metrics
        if (this.metrics.length > this.maxMetrics) {
            this.metrics.shift();
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Performance] ${name}: ${value}ms`, metadata);
        }
    }

    /**
     * Track component render time
     */
    trackRender(componentName: string, startTime: number): void {
        const duration = Date.now() - startTime;
        this.track(`render:${componentName}`, duration, {
            component: componentName,
        });
    }

    /**
     * Track API call duration
     */
    trackAPICall(endpoint: string, duration: number, success: boolean): void {
        this.track(`api:${endpoint}`, duration, {
            endpoint,
            success,
        });
    }

    /**
     * Track cache hit/miss
     */
    trackCache(key: string, hit: boolean): void {
        this.track(`cache:${hit ? 'hit' : 'miss'}`, hit ? 1 : 0, {
            key,
            hit,
        });
    }

    /**
     * Track error
     */
    trackError(error: Error, context?: string): void {
        this.track('error', 1, {
            message: error.message,
            context,
            stack: error.stack,
        });
    }

    /**
     * Get all metrics
     */
    getMetrics(): PerformanceMetric[] {
        return [...this.metrics];
    }

    /**
     * Get metrics by name pattern
     */
    getMetricsByName(pattern: string): PerformanceMetric[] {
        return this.metrics.filter(m => m.name.includes(pattern));
    }

    /**
     * Get performance report
     */
    getReport(): PerformanceReport {
        const renderMetrics = this.getMetricsByName('render:');
        const apiMetrics = this.getMetricsByName('api:');
        const cacheMetrics = this.getMetricsByName('cache:');
        const errorMetrics = this.getMetricsByName('error');

        const avgLoadTime = apiMetrics.length > 0
            ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
            : 0;

        const avgRenderTime = renderMetrics.length > 0
            ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
            : 0;

        const cacheHits = cacheMetrics.filter(m => m.name.includes('hit')).length;
        const cacheMisses = cacheMetrics.filter(m => m.name.includes('miss')).length;
        const cacheHitRate = (cacheHits + cacheMisses) > 0
            ? cacheHits / (cacheHits + cacheMisses)
            : 0;

        const totalOperations = apiMetrics.length + renderMetrics.length;
        const errorRate = totalOperations > 0
            ? errorMetrics.length / totalOperations
            : 0;

        return {
            metrics: this.metrics,
            summary: {
                avgLoadTime,
                avgRenderTime,
                cacheHitRate,
                errorRate,
            },
        };
    }

    /**
     * Clear all metrics
     */
    clear(): void {
        this.metrics = [];
    }

    /**
     * Export metrics as JSON
     */
    export(): string {
        return JSON.stringify(this.getReport(), null, 2);
    }
}

/**
 * Singleton instance
 */
let performanceMonitor: PerformanceMonitor | null = null;

/**
 * Get performance monitor instance
 */
export function getPerformanceMonitor(): PerformanceMonitor {
    if (!performanceMonitor) {
        performanceMonitor = new PerformanceMonitor();
    }
    return performanceMonitor;
}

/**
 * Hook for tracking component render time
 */
export function usePerformanceTracking(componentName: string) {
    const startTime = Date.now();

    return () => {
        const monitor = getPerformanceMonitor();
        monitor.trackRender(componentName, startTime);
    };
}

/**
 * Measure function execution time
 */
export async function measureAsync<T>(
    name: string,
    fn: () => Promise<T>
): Promise<T> {
    const startTime = Date.now();
    const monitor = getPerformanceMonitor();

    try {
        const result = await fn();
        const duration = Date.now() - startTime;
        monitor.track(name, duration, { success: true });
        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        monitor.track(name, duration, { success: false });
        monitor.trackError(error as Error, name);
        throw error;
    }
}

/**
 * Measure synchronous function execution time
 */
export function measure<T>(name: string, fn: () => T): T {
    const startTime = Date.now();
    const monitor = getPerformanceMonitor();

    try {
        const result = fn();
        const duration = Date.now() - startTime;
        monitor.track(name, duration, { success: true });
        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        monitor.track(name, duration, { success: false });
        monitor.trackError(error as Error, name);
        throw error;
    }
}

/**
 * Web Vitals tracking
 */
export function trackWebVitals() {
    if (typeof window === 'undefined') return;

    // Track First Contentful Paint (FCP)
    const observer = new PerformanceObserver((list) => {
        const monitor = getPerformanceMonitor();

        for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
                monitor.track('web-vitals:fcp', entry.startTime, {
                    metric: 'First Contentful Paint',
                });
            }
        }
    });

    try {
        observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
        // Browser doesn't support this API
    }

    // Track Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
        const monitor = getPerformanceMonitor();
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        if (lastEntry) {
            monitor.track('web-vitals:lcp', lastEntry.startTime, {
                metric: 'Largest Contentful Paint',
            });
        }
    });

    try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
        // Browser doesn't support this API
    }

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
        const monitor = getPerformanceMonitor();

        for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
                monitor.track('web-vitals:cls', clsValue, {
                    metric: 'Cumulative Layout Shift',
                });
            }
        }
    });

    try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
        // Browser doesn't support this API
    }
}
