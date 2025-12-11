/**
 * Code Splitting Utilities for Mobile Routes
 * 
 * Provides dynamic imports and lazy loading for mobile-specific components
 * to reduce initial bundle size and improve load times.
 */

import dynamic from 'next/dynamic';
import React, { ComponentType } from 'react';

// ============================================================================
// Mobile Component Lazy Loading
// ============================================================================

/**
 * Lazy load mobile-specific components with loading fallback
 * Note: These will be available once the components are implemented
 */
export const MobileComponents = {
    // Image Compressor
    ImageCompressor: dynamic(() => import('@/components/mobile/image-compressor').then(m => ({ default: m.ImageCompressor })), {
        ssr: false,
    }),

    // Progressive Image
    ProgressiveImage: dynamic(() => import('@/components/mobile/progressive-image').then(m => ({ default: m.ProgressiveImage })), {
        ssr: false,
    }),

    // Cancellable Operation UI
    CancellableOperation: dynamic(() => import('@/components/mobile/cancellable-operation').then(m => ({ default: m.CancellableOperation })), {
        ssr: false,
    }),
};

// ============================================================================
// Preload Utilities
// ============================================================================

/**
 * Preload a mobile component
 */
export function preloadMobileComponent(componentName: keyof typeof MobileComponents) {
    const component = MobileComponents[componentName];
    if (component && 'preload' in component) {
        (component as any).preload();
    }
}

/**
 * Preload multiple mobile components
 */
export function preloadMobileComponents(componentNames: (keyof typeof MobileComponents)[]) {
    componentNames.forEach(preloadMobileComponent);
}

// ============================================================================
// Bundle Size Optimization
// ============================================================================

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    ) || window.innerWidth < 768;
}

/**
 * Conditionally load mobile-specific code
 */
export function loadMobileCode<T>(
    mobileLoader: () => Promise<T>,
    desktopLoader: () => Promise<T>
): Promise<T> {
    return isMobileDevice() ? mobileLoader() : desktopLoader();
}

/**
 * Create a mobile-optimized dynamic component
 */
export function createMobileDynamic<P = {}>(
    loader: () => Promise<{ default: ComponentType<P> }>,
    options?: {
        loading?: ComponentType;
        ssr?: boolean;
    }
) {
    return dynamic(loader, {
        loading: options?.loading ? () => React.createElement(options.loading!) : undefined,
        ssr: options?.ssr ?? false,
    });
}

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Track component load time
 */
export async function trackComponentLoad<T>(
    name: string,
    loader: () => Promise<T>
): Promise<T> {
    const startTime = performance.now();

    try {
        const result = await loader();
        const loadTime = performance.now() - startTime;

        // Log to analytics or monitoring service
        if (typeof window !== 'undefined' && 'gtag' in window) {
            (window as any).gtag('event', 'component_load', {
                component_name: name,
                load_time: loadTime,
            });
        }

        return result;
    } catch (error) {
        const loadTime = performance.now() - startTime;

        // Log error to monitoring service
        console.error(`Failed to load component ${name} after ${loadTime}ms:`, error);
        throw error;
    }
}
