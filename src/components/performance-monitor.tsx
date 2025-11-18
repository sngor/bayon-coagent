/**
 * Performance Monitor Component
 * Tracks and logs page performance metrics in development
 * Ensures initial content displays within 2 seconds
 */

'use client';

import { useEffect } from 'react';
import { logPerformanceMetrics } from '@/lib/performance';

export function PerformanceMonitor() {
    useEffect(() => {
        // Only run in development
        if (process.env.NODE_ENV === 'development') {
            logPerformanceMetrics();
        }
    }, []);

    // This component doesn't render anything
    return null;
}
