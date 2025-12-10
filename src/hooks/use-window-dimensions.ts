import { useState, useEffect, useCallback } from 'react';

interface WindowDimensions {
    width: number;
    height: number;
}

const DEFAULT_DIMENSIONS: WindowDimensions = {
    width: 1200,
    height: 800,
};

/**
 * Custom hook for tracking window dimensions with SSR safety
 * Follows the codebase pattern of responsive hooks like use-mobile.tsx
 */
export function useWindowDimensions(): WindowDimensions & { isClient: boolean } {
    const [dimensions, setDimensions] = useState<WindowDimensions>(DEFAULT_DIMENSIONS);
    const [isClient, setIsClient] = useState(false);

    const handleResize = useCallback(() => {
        setDimensions({
            width: window.innerWidth,
            height: window.innerHeight,
        });
    }, []);

    useEffect(() => {
        // Set client flag for hydration safety
        setIsClient(true);

        // Set initial dimensions
        handleResize();

        // Add resize listener with passive option for better performance
        window.addEventListener('resize', handleResize, { passive: true });

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [handleResize]);

    return {
        ...dimensions,
        isClient,
    };
}