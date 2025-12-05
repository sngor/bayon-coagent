"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ContentTransitionProps {
    children: React.ReactNode;
    className?: string;
    /**
     * Animation variant
     * @default "fade"
     */
    variant?: "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale";
    /**
     * Animation duration
     * @default "base"
     */
    duration?: "fast" | "base" | "slow";
    /**
     * Delay before animation starts (in ms)
     * @default 0
     */
    delay?: number;
    /**
     * Whether to animate on mount
     * @default true
     */
    animateOnMount?: boolean;
    /**
     * Whether to use intersection observer for scroll-triggered animations
     * @default false
     */
    animateOnScroll?: boolean;
    /**
     * Intersection observer threshold (0-1)
     * @default 0.1
     */
    threshold?: number;
}

/**
 * ContentTransition component
 * 
 * Provides smooth transitions for content with support for scroll-triggered animations.
 * 
 * @example
 * ```tsx
 * // Simple fade in
 * <ContentTransition>
 *   <div>Content</div>
 * </ContentTransition>
 * ```
 * 
 * @example
 * ```tsx
 * // Slide up with delay
 * <ContentTransition variant="slide-up" delay={200}>
 *   <div>Content</div>
 * </ContentTransition>
 * ```
 * 
 * @example
 * ```tsx
 * // Animate when scrolled into view
 * <ContentTransition animateOnScroll>
 *   <div>Content</div>
 * </ContentTransition>
 * ```
 */
export function ContentTransition({
    children,
    className,
    variant = "fade",
    duration = "base",
    delay = 0,
    animateOnMount = true,
    animateOnScroll = false,
    threshold = 0.1,
}: ContentTransitionProps) {
    const [isVisible, setIsVisible] = useState(!animateOnScroll && animateOnMount);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!animateOnScroll) {
            if (animateOnMount) {
                const timer = setTimeout(() => setIsVisible(true), delay);
                return () => clearTimeout(timer);
            }
            return;
        }

        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => setIsVisible(true), delay);
                    observer.unobserve(element);
                }
            },
            { threshold }
        );

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [animateOnScroll, animateOnMount, delay, threshold]);

    const animationClass = getAnimationClass(variant, duration);

    return (
        <div
            ref={ref}
            className={cn(
                isVisible && animationClass,
                !isVisible && "opacity-0",
                className
            )}
            style={{
                animationDelay: delay > 0 ? `${delay}ms` : undefined,
            }}
        >
            {children}
        </div>
    );
}

function getAnimationClass(
    variant: ContentTransitionProps["variant"],
    duration: ContentTransitionProps["duration"]
): string {
    const variantClasses = {
        fade: "animate-fade-in",
        "slide-up": "animate-slide-up-base",
        "slide-down": "animate-slide-down-base",
        "slide-left": "animate-slide-left-base",
        "slide-right": "animate-slide-right-base",
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
 * Staggered list transition
 * 
 * Animates list items with sequential delays.
 * 
 * @example
 * ```tsx
 * <StaggeredList>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </StaggeredList>
 * ```
 */
export function StaggeredList({
    children,
    className,
    staggerDelay = 50,
}: {
    children: React.ReactNode;
    className?: string;
    /**
     * Delay between each item (in ms)
     * @default 50
     */
    staggerDelay?: number;
}) {
    return (
        <div className={cn("stagger-children", className)}>
            {children}
        </div>
    );
}

/**
 * Scroll reveal wrapper
 * 
 * Reveals content when scrolled into view.
 * 
 * @example
 * ```tsx
 * <ScrollReveal>
 *   <div>Content revealed on scroll</div>
 * </ScrollReveal>
 * ```
 */
export function ScrollReveal({
    children,
    className,
    variant = "fade",
    threshold = 0.1,
}: {
    children: React.ReactNode;
    className?: string;
    variant?: ContentTransitionProps["variant"];
    threshold?: number;
}) {
    return (
        <ContentTransition
            animateOnScroll
            variant={variant}
            threshold={threshold}
            className={className}
        >
            {children}
        </ContentTransition>
    );
}
