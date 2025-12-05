/**
 * Reduced Motion Utilities
 * 
 * Utilities for detecting and respecting user preferences for reduced motion.
 */

/**
 * Check if the user prefers reduced motion
 * @returns true if user prefers reduced motion, false otherwise
 */
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
}

/**
 * Hook into reduced motion preference changes
 * @param callback Function to call when preference changes
 * @returns Cleanup function to remove the listener
 */
export function onReducedMotionChange(callback: (prefersReduced: boolean) => void): () => void {
    if (typeof window === 'undefined') {
        return () => { };
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handler = (event: MediaQueryListEvent) => {
        callback(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }

    // Fallback for older browsers
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
}

/**
 * Get animation duration based on reduced motion preference
 * @param normalDuration Duration in milliseconds for normal motion
 * @param reducedDuration Duration in milliseconds for reduced motion (default: 0)
 * @returns Appropriate duration based on user preference
 */
export function getAnimationDuration(normalDuration: number, reducedDuration: number = 0): number {
    return prefersReducedMotion() ? reducedDuration : normalDuration;
}

/**
 * Get CSS class for animations that respects reduced motion
 * @param animationClass The animation class to apply
 * @param fallbackClass Optional class to use when reduced motion is preferred
 * @returns Appropriate class based on user preference
 */
export function getAnimationClass(animationClass: string, fallbackClass: string = ''): string {
    return prefersReducedMotion() ? fallbackClass : animationClass;
}
