"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
    /**
     * Animation variant to use for page transitions
     * @default "fade"
     */
    variant?: "fade" | "slide-up" | "slide-down" | "scale";
    /**
     * Animation duration
     * @default "base"
     */
    duration?: "fast" | "base" | "slow";
}

/**
 * PageTransition component
 * 
 * Provides smooth transitions between pages with automatic reduced motion support.
 * 
 * @example
 * ```tsx
 * // In layout.tsx
 * export default function Layout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <PageTransition>
 *       {children}
 *     </PageTransition>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // With custom variant
 * <PageTransition variant="slide-up" duration="slow">
 *   {children}
 * </PageTransition>
 * ```
 */
export function PageTransition({
    children,
    className,
    variant = "fade",
    duration = "base",
}: PageTransitionProps) {
    const pathname = usePathname();
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Trigger animation on route change
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 50);
        return () => clearTimeout(timer);
    }, [pathname]);

    const animationClass = getAnimationClass(variant, duration);

    return (
        <div
            className={cn(
                animationClass,
                // Prevent layout shift during transitions
                "min-h-screen",
                className
            )}
            key={pathname}
        >
            {children}
        </div>
    );
}

function getAnimationClass(
    variant: PageTransitionProps["variant"],
    duration: PageTransitionProps["duration"]
): string {
    const variantClasses = {
        fade: "animate-fade-in",
        "slide-up": "animate-slide-up",
        "slide-down": "animate-slide-down",
        scale: "animate-scale-in",
    };

    const durationClasses = {
        fast: "duration-fast",
        base: "duration-base",
        slow: "duration-slow",
    };

    return cn(
        variantClasses[variant || "fade"],
        durationClasses[duration || "base"]
    );
}

/**
 * Simple fade transition wrapper
 * 
 * @example
 * ```tsx
 * <FadeTransition>
 *   <div>Content</div>
 * </FadeTransition>
 * ```
 */
export function FadeTransition({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <PageTransition variant="fade" className={className}>
            {children}
        </PageTransition>
    );
}

/**
 * Slide up transition wrapper
 * 
 * @example
 * ```tsx
 * <SlideUpTransition>
 *   <div>Content</div>
 * </SlideUpTransition>
 * ```
 */
export function SlideUpTransition({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <PageTransition variant="slide-up" className={className}>
            {children}
        </PageTransition>
    );
}
