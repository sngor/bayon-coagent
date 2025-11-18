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
  };

  return metrics;
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
    setTimeout(() => {
      const metrics = measurePagePerformance();
      if (metrics) {
        const meetsTarget = checkPerformanceTarget(metrics);
        
        console.group('📊 Performance Metrics');
        console.log(`Page Load Time: ${metrics.pageLoadTime.toFixed(2)}ms`);
        console.log(`First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`);
        console.log(`Largest Contentful Paint: ${metrics.largestContentfulPaint.toFixed(2)}ms`);
        console.log(`Time to Interactive: ${metrics.timeToInteractive.toFixed(2)}ms`);
        console.log(`Target Met (< 2s): ${meetsTarget ? '✅' : '❌'}`);
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
