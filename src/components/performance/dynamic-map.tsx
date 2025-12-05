/**
 * DynamicMap - Lazy-loaded map component wrapper
 * 
 * Dynamically imports Google Maps components to reduce initial bundle size.
 * Google Maps library is ~150KB and should only be loaded when needed.
 * 
 * Requirements: 2.4, 3.3 - Code splitting and lazy loading
 */

import dynamic from 'next/dynamic';
import { StandardLoadingState } from '@/components/standard';

/**
 * Dynamic import for map components with loading fallback
 */
export function createDynamicMap<T extends Record<string, any>>(
    importFn: () => Promise<{ default: React.ComponentType<T> }>,
    options?: {
        ssr?: boolean;
        loading?: React.ComponentType;
    }
) {
    return dynamic(importFn, {
        loading: options?.loading || (() => (
            <div className="h-96 w-full bg-muted rounded-lg flex items-center justify-center">
                <StandardLoadingState variant="spinner" text="Loading map..." />
            </div>
        )),
        ssr: options?.ssr ?? false, // Maps require browser APIs
    });
}

/**
 * Preset: CMA Report with Map
 */
export const DynamicCMAReport = createDynamicMap(
    () => import('@/components/client-dashboard/cma-report').then(mod => ({ default: mod.CMAReport }))
);
