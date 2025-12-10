/**
 * Performance Optimization Utilities
 * 
 * Central export for all performance optimization utilities used in the onboarding flow.
 * 
 * Requirements: 7.1, 8.5
 */

// Debouncing utilities
export {
    debounce,
    useDebouncedCallback,
    useDebouncedValue,
} from './debounce';

// Analytics batching
export {
    AnalyticsBatcher,
    getAnalyticsBatcher,
    destroyAnalyticsBatcher,
} from './analytics-batch';

// Optimistic updates
export {
    useOptimisticUpdate,
    useOptimisticList,
    useOptimisticSteps,
    type OptimisticState,
} from './optimistic-updates';

// Image optimization
export {
    ONBOARDING_IMAGE_SIZES,
    getOptimizedImageProps,
    preloadImage,
    useLazyImage,
    getResponsiveImageSizes,
    getDeviceOptimizedImage,
} from './image-optimization';
