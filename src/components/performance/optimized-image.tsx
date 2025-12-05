/**
 * OptimizedImage - Wrapper around Next.js Image with consistent sizing and loading
 * 
 * Server Component with Client Component wrapper for interactive features.
 * 
 * Features:
 * - Wraps Next.js Image component with best practices
 * - Consistent sizing patterns
 * - Priority loading support
 * - Prevents layout shift with proper dimensions
 * - Lazy loading by default
 * - Error handling with fallback
 * - Loading states with shimmer effect
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.5 - Image optimization and layout shift prevention
 * 
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/hero.jpg"
 *   alt="Hero image"
 *   width={1200}
 *   height={600}
 *   priority
 * />
 * ```
 */

import React from 'react';
import { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { OptimizedImageClient } from './optimized-image-client';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
    /**
     * Show shimmer loading effect
     */
    showShimmer?: boolean;

    /**
     * Aspect ratio for the container (e.g., "16/9", "1/1", "4/3")
     */
    aspectRatio?: string;

    /**
     * Custom fallback component for errors
     */
    fallback?: React.ReactNode;

    /**
     * Callback when image loads successfully
     */
    onLoad?: () => void;

    /**
     * Callback when image fails to load
     */
    onError?: (error: Error) => void;

    /**
     * Container className (applied to wrapper div)
     */
    containerClassName?: string;
}

/**
 * OptimizedImage component with loading states and error handling
 * Server Component that delegates to Client Component for interactivity
 */
export function OptimizedImage(props: OptimizedImageProps) {
    // Delegate to client component for loading/error state management
    return <OptimizedImageClient {...props} />;
}

/**
 * Preset: Hero image (full-width, 16:9 aspect ratio)
 */
export function HeroImage({
    src,
    alt,
    priority = true,
    className,
}: {
    src: string;
    alt: string;
    priority?: boolean;
    className?: string;
}) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            width={1920}
            height={1080}
            aspectRatio="16/9"
            priority={priority}
            sizes="100vw"
            className={cn('w-full object-cover', className)}
        />
    );
}

/**
 * Preset: Card image (4:3 aspect ratio)
 */
export function CardImage({
    src,
    alt,
    className,
}: {
    src: string;
    alt: string;
    className?: string;
}) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            width={400}
            height={300}
            aspectRatio="4/3"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn('w-full object-cover', className)}
        />
    );
}

/**
 * Preset: Avatar image (1:1 aspect ratio, circular)
 */
export function AvatarImage({
    src,
    alt,
    size = 96,
    className,
}: {
    src: string;
    alt: string;
    size?: number;
    className?: string;
}) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            width={size}
            height={size}
            aspectRatio="1/1"
            className={cn('rounded-full object-cover', className)}
        />
    );
}

/**
 * Preset: Thumbnail image (small, square)
 */
export function ThumbnailImage({
    src,
    alt,
    size = 80,
    className,
}: {
    src: string;
    alt: string;
    size?: number;
    className?: string;
}) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            width={size}
            height={size}
            aspectRatio="1/1"
            className={cn('object-cover', className)}
        />
    );
}

/**
 * Preset: Property listing image (16:9 aspect ratio)
 */
export function PropertyImage({
    src,
    alt,
    priority = false,
    className,
}: {
    src: string;
    alt: string;
    priority?: boolean;
    className?: string;
}) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            width={800}
            height={450}
            aspectRatio="16/9"
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
            className={cn('w-full object-cover', className)}
        />
    );
}

/**
 * Preset: Logo image (contain, no crop)
 */
export function LogoImage({
    src,
    alt,
    width = 200,
    height = 80,
    className,
}: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
}) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={true}
            className={cn('object-contain', className)}
        />
    );
}

/**
 * Preset: Background image (fill container)
 */
export function BackgroundImage({
    src,
    alt,
    priority = false,
    className,
}: {
    src: string;
    alt: string;
    priority?: boolean;
    className?: string;
}) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="100vw"
            className={cn('object-cover', className)}
        />
    );
}

/**
 * Utility: Generate blur data URL for placeholder
 */
export function generateBlurDataURL(color: string = '#e5e7eb'): string {
    const svg = `
    <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
      <rect width="10" height="10" fill="${color}"/>
    </svg>
  `;

    if (typeof window === 'undefined') {
        // Server-side
        return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    } else {
        // Client-side
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }
}
