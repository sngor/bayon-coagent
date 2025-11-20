/**
 * Performance monitoring utilities for tracking page load times
 * and ensuring initial content displays within 2 seconds
 */

export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
}

/**
 * Measure and log page performance metrics
 */
export function measurePagePerformance(): PerformanceMetrics | null {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');
  
  const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
  const lcp = performance.getEntriesByType('largest-contentful-paint').pop() as PerformanceEntry;

  const metrics: PerformanceMetrics = {
    pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
    firstContentfulPaint: fcp ? fcp.startTime : 0,
    largestContentfulPaint: lcp ? lcp.startTime : 0,
    timeToInteractive: navigation ? navigation.domInteractive - navigation.fetchStart : 0,
    totalBlockingTime: 0, // Would need more complex calculation
    cumulativeLayoutShift: 0, // Will be measured separately
  };

  return metrics;
}

/**
 * Measure Cumulative Layout Shift (CLS)
 * CLS measures visual stability - lower is better
 * Good: < 0.1, Needs Improvement: 0.1-0.25, Poor: > 0.25
 */
export function measureCLS(): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      resolve(0);
      return;
    }

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only count layout shifts without recent user input
        if ((entry as any).hadRecentInput) {
          continue;
        }

        const firstSessionEntry = sessionEntries[0];
        const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

        // If the entry occurred less than 1 second after the previous entry and
        // less than 5 seconds after the first entry in the session, include the
        // entry in the current session. Otherwise, start a new session.
        if (
          sessionValue &&
          entry.startTime - lastSessionEntry.startTime < 1000 &&
          entry.startTime - firstSessionEntry.startTime < 5000
        ) {
          sessionValue += (entry as any).value;
          sessionEntries.push(entry);
        } else {
          sessionValue = (entry as any).value;
          sessionEntries = [entry];
        }

        // If the current session value is larger than the current CLS value,
        // update CLS and the entries contributing to it.
        if (sessionValue > clsValue) {
          clsValue = sessionValue;
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    // Resolve after a short delay to capture initial layout shifts
    setTimeout(() => {
      observer.disconnect();
      resolve(clsValue);
    }, 3000);
  });
}

/**
 * Check if CLS meets the "Good" threshold (< 0.1)
 */
export function checkCLSTarget(cls: number): boolean {
  const GOOD_CLS_THRESHOLD = 0.1;
  return cls < GOOD_CLS_THRESHOLD;
}

/**
 * Check if page load performance meets the 2-second target
 */
export function checkPerformanceTarget(metrics: PerformanceMetrics): boolean {
  const TARGET_TIME = 2000; // 2 seconds in milliseconds
  return metrics.firstContentfulPaint <= TARGET_TIME;
}

/**
 * Log performance metrics to console in development
 */
export function logPerformanceMetrics(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  // Wait for page to fully load
  window.addEventListener('load', () => {
    setTimeout(async () => {
      const metrics = measurePagePerformance();
      if (metrics) {
        const meetsTarget = checkPerformanceTarget(metrics);
        const cls = await measureCLS();
        const meetsCLSTarget = checkCLSTarget(cls);
        
        console.group('📊 Performance Metrics');
        console.log(`Page Load Time: ${metrics.pageLoadTime.toFixed(2)}ms`);
        console.log(`First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`);
        console.log(`Largest Contentful Paint: ${metrics.largestContentfulPaint.toFixed(2)}ms`);
        console.log(`Time to Interactive: ${metrics.timeToInteractive.toFixed(2)}ms`);
        console.log(`Cumulative Layout Shift: ${cls.toFixed(4)}`);
        console.log(`Load Time Target Met (< 2s): ${meetsTarget ? '✅' : '❌'}`);
        console.log(`CLS Target Met (< 0.1): ${meetsCLSTarget ? '✅' : '❌'}`);
        console.groupEnd();
      }
    }, 0);
  });
}

/**
 * Report performance metrics to analytics (placeholder for future implementation)
 */
export function reportPerformanceMetrics(metrics: PerformanceMetrics): void {
  // In production, you would send these to your analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: analytics.track('page_performance', metrics);
  }
}

/**
 * Hook to measure component render time
 */
export function measureComponentRender(componentName: string): () => void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return () => {};
  }

  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (renderTime > 16) { // More than one frame (60fps)
      console.warn(`⚠️ ${componentName} took ${renderTime.toFixed(2)}ms to render`);
    }
  };
}
