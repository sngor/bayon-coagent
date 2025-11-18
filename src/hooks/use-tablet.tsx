'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect tablet viewport and orientation
 * Tablet viewport is defined as 768px - 1024px
 * 
 * Requirements: 4.2, 4.4
 */
export function useTablet() {
    const [isTablet, setIsTablet] = useState(false);
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

    useEffect(() => {
        const checkTablet = () => {
            const width = window.innerWidth;
            const isTabletViewport = width >= 768 && width <= 1024;
            setIsTablet(isTabletViewport);

            // Check orientation
            const isPortrait = window.innerHeight > window.innerWidth;
            setOrientation(isPortrait ? 'portrait' : 'landscape');
        };

        // Check on mount
        checkTablet();

        // Listen for resize and orientation changes
        window.addEventListener('resize', checkTablet);
        window.addEventListener('orientationchange', checkTablet);

        return () => {
            window.removeEventListener('resize', checkTablet);
            window.removeEventListener('orientationchange', checkTablet);
        };
    }, []);

    return {
        isTablet,
        orientation,
        isTabletPortrait: isTablet && orientation === 'portrait',
        isTabletLandscape: isTablet && orientation === 'landscape',
    };
}
