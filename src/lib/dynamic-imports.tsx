/**
 * Dynamic import utilities for code splitting
 * Helps reduce initial bundle size by lazy-loading components
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Simple loading component
 */
function DefaultLoading() {
    return <div className="animate-pulse">Loading...</div>;
}

/**
 * Create a dynamically imported component with loading state
 */
export function createDynamicComponent<P = {}>(
    importFn: () => Promise<{ default: ComponentType<P> }>,
    options?: {
        loading?: () => JSX.Element;
        ssr?: boolean;
    }
) {
    return dynamic(importFn, {
        loading: options?.loading || DefaultLoading,
        ssr: options?.ssr ?? true,
    });
}

/**
 * Preload a component for better UX
 * Call this when you know the user will need a component soon
 */
export function preloadComponent(importFn: () => Promise<any>) {
    if (typeof window !== 'undefined') {
        // Preload on idle or after a short delay
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => importFn());
        } else {
            setTimeout(() => importFn(), 1);
        }
    }
}
