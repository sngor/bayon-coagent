'use client';

/**
 * Web Vitals Tracker Component
 * 
 * This component initializes Web Vitals tracking when the app loads.
 * It should be included in the root layout.
 */

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/web-vitals';

export function WebVitalsTracker() {
    useEffect(() => {
        // Initialize Web Vitals tracking
        initWebVitals();
    }, []);

    // This component doesn't render anything
    return null;
}
