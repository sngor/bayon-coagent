"use client";

import { useEffect, useState } from "react";

/**
 * React hook to detect if the user prefers reduced motion
 * 
 * @returns true if user prefers reduced motion, false otherwise
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const prefersReducedMotion = useReducedMotion();
 *   
 *   return (
 *     <div className={prefersReducedMotion ? '' : 'animate-fade-in'}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Check initial preference
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mediaQuery.matches);

        // Listen for changes
        const handler = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handler);
            return () => mediaQuery.removeEventListener("change", handler);
        }

        // Fallback for older browsers
        mediaQuery.addListener(handler);
        return () => mediaQuery.removeListener(handler);
    }, []);

    return prefersReducedMotion;
}

/**
 * Get animation class based on reduced motion preference
 * 
 * @param animationClass The animation class to apply
 * @param fallbackClass Optional class to use when reduced motion is preferred
 * @returns Appropriate class based on user preference
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const animationClass = useAnimationClass('animate-fade-in', 'opacity-100');
 *   
 *   return <div className={animationClass}>Content</div>;
 * }
 * ```
 */
export function useAnimationClass(
    animationClass: string,
    fallbackClass: string = ""
): string {
    const prefersReducedMotion = useReducedMotion();
    return prefersReducedMotion ? fallbackClass : animationClass;
}

/**
 * Get animation duration based on reduced motion preference
 * 
 * @param normalDuration Duration in milliseconds for normal motion
 * @param reducedDuration Duration in milliseconds for reduced motion (default: 0)
 * @returns Appropriate duration based on user preference
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const duration = useAnimationDuration(300, 0);
 *   
 *   return (
 *     <motion.div
 *       animate={{ opacity: 1 }}
 *       transition={{ duration: duration / 1000 }}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useAnimationDuration(
    normalDuration: number,
    reducedDuration: number = 0
): number {
    const prefersReducedMotion = useReducedMotion();
    return prefersReducedMotion ? reducedDuration : normalDuration;
}
