/**
 * Image Optimization Utilities
 * 
 * Provides utilities for optimizing images in the onboarding flow.
 * Uses Next.js Image component with proper sizing and lazy loading.
 * 
 * Requirements: 7.1
 */

import type { ImageProps } from 'next/image';

/**
 * Image size presets for onboarding
 */
export const ONBOARDING_IMAGE_SIZES = {
    icon: {
        width: 48,
        height: 48,
    },
    card: {
        width: 400,
        height: 300,
    },
    hero: {
        width: 800,
        height: 600,
    },
    illustration: {
        width: 600,
        height: 400,
    },
} as const;

/**
 * Get optimized image props for Next.js Image component
 */
export function getOptimizedImageProps(
    src: string,
    alt: string,
    size: keyof typeof ONBOARDING_IMAGE_SIZES,
    priority: boolean = false
): Partial<ImageProps> {
    const dimensions = ONBOARDING_IMAGE_SIZES[size];

    return {
        src,
        alt,
        width: dimensions.width,
        height: dimensions.height,
        priority,
        loading: priority ? 'eager' : 'lazy',
        quality: 85,
        placeholder: 'blur',
        blurDataURL: getBlurDataURL(dimensions.width, dimensions.height),
    };
}

/**
 * Generate a blur data URL for placeholder
 */
function getBlurDataURL(width: number, height: number): string {
    // Create a simple SVG blur placeholder
    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:rgb(240,240,240);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgb(220,220,220);stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad)" />
        </svg>
    `;

    // Convert to base64
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Preload critical images
 * Call this for above-the-fold images
 */
export function preloadImage(src: string): void {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
}

/**
 * Lazy load images with Intersection Observer
 */
export function useLazyImage(ref: React.RefObject<HTMLImageElement>) {
    React.useEffect(() => {
        if (!ref.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const img = entry.target as HTMLImageElement;
                        const src = img.dataset.src;
                        if (src) {
                            img.src = src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                });
            },
            {
                rootMargin: '50px',
            }
        );

        observer.observe(ref.current);

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [ref]);
}

/**
 * Get responsive image sizes string
 */
export function getResponsiveImageSizes(
    mobile: number,
    tablet: number,
    desktop: number
): string {
    return `(max-width: 768px) ${mobile}px, (max-width: 1024px) ${tablet}px, ${desktop}px`;
}

/**
 * Optimize image for different device types
 */
export function getDeviceOptimizedImage(
    src: string,
    deviceType: 'mobile' | 'tablet' | 'desktop'
): string {
    // In a real implementation, this would return different image URLs
    // based on device type (e.g., from a CDN with image transformation)
    const qualityMap = {
        mobile: 70,
        tablet: 80,
        desktop: 90,
    };

    // For now, just return the original src
    // In production, you'd append quality parameters or use a CDN
    return src;
}

// Add React import for hooks
import React from 'react';
