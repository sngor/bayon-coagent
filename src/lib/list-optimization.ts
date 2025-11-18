/**
 * Utilities for optimizing list rendering performance
 * Helps determine when to use virtual scrolling vs pagination
 */

export interface ListOptimizationConfig {
  itemCount: number;
  estimatedItemHeight?: number;
  containerHeight?: number;
  preferVirtualScroll?: boolean;
}

export interface ListOptimizationResult {
  strategy: 'virtual-scroll' | 'pagination' | 'standard';
  reason: string;
  config: {
    itemsPerPage?: number;
    itemHeight?: number;
    containerHeight?: number;
  };
}

/**
 * Determines the optimal rendering strategy for a list
 * @param config - Configuration for list optimization
 * @returns Recommended strategy and configuration
 */
export function getOptimalListStrategy(
  config: ListOptimizationConfig
): ListOptimizationResult {
  const {
    itemCount,
    estimatedItemHeight = 80,
    containerHeight = 600,
    preferVirtualScroll = false,
  } = config;

  // For very small lists, use standard rendering
  if (itemCount < 50) {
    return {
      strategy: 'standard',
      reason: 'List is small enough for standard rendering',
      config: {},
    };
  }

  // For medium lists, use pagination unless virtual scroll is preferred
  if (itemCount < 500 && !preferVirtualScroll) {
    return {
      strategy: 'pagination',
      reason: 'Medium-sized list works well with pagination',
      config: {
        itemsPerPage: 20,
      },
    };
  }

  // For large lists, use virtual scrolling
  return {
    strategy: 'virtual-scroll',
    reason: 'Large list benefits from virtual scrolling',
    config: {
      itemHeight: estimatedItemHeight,
      containerHeight,
    },
  };
}

/**
 * Calculates optimal items per page for pagination
 * @param totalItems - Total number of items
 * @param targetPageCount - Target number of pages (default: 10)
 * @returns Optimal items per page
 */
export function calculateOptimalPageSize(
  totalItems: number,
  targetPageCount: number = 10
): number {
  const baseSize = Math.ceil(totalItems / targetPageCount);
  
  // Round to nearest multiple of 5 for cleaner numbers
  const roundedSize = Math.ceil(baseSize / 5) * 5;
  
  // Ensure minimum of 10 and maximum of 100
  return Math.max(10, Math.min(100, roundedSize));
}

/**
 * Estimates the performance impact of rendering a list
 * @param itemCount - Number of items
 * @param strategy - Rendering strategy
 * @returns Performance metrics
 */
export function estimatePerformance(
  itemCount: number,
  strategy: 'virtual-scroll' | 'pagination' | 'standard'
): {
  domNodes: number;
  memoryImpact: 'low' | 'medium' | 'high';
  scrollPerformance: 'excellent' | 'good' | 'poor';
  initialRenderTime: 'fast' | 'medium' | 'slow';
} {
  switch (strategy) {
    case 'virtual-scroll':
      return {
        domNodes: 20, // Only visible items
        memoryImpact: 'low',
        scrollPerformance: 'excellent',
        initialRenderTime: 'fast',
      };
    
    case 'pagination':
      return {
        domNodes: 20, // Items per page
        memoryImpact: 'low',
        scrollPerformance: 'good',
        initialRenderTime: 'fast',
      };
    
    case 'standard':
      return {
        domNodes: itemCount,
        memoryImpact: itemCount > 100 ? 'high' : itemCount > 50 ? 'medium' : 'low',
        scrollPerformance: itemCount > 100 ? 'poor' : itemCount > 50 ? 'good' : 'excellent',
        initialRenderTime: itemCount > 100 ? 'slow' : itemCount > 50 ? 'medium' : 'fast',
      };
  }
}

/**
 * Debounces scroll events for better performance
 * @param callback - Function to call after debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounceScroll<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 16 // ~60fps
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

/**
 * Throttles scroll events for consistent performance
 * @param callback - Function to call
 * @param limit - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function throttleScroll<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 16 // ~60fps
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      callback(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
