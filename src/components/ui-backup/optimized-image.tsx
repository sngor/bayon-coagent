/**
 * Optimized Image component with progressive loading and placeholders
 * Ensures images load efficiently and don't block initial content display
 */

'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils/common';

interface OptimizedImageProps extends Omit<ImageProps, 'placeholder' | 'blurDataURL'> {
    /**
     * Show a shimmer effect while loading
     */
    showShimmer?: boolean;
    /**
     * Custom placeholder color (defaults to gray)
     */
    placeholderColor?: string;
    /**
     * Aspect ratio for the container (e.g., "16/9", "1/1")
     */
    aspectRatio?: string;
}

/**
 * Generate a simple blur data URL for placeholder
 */
function generateBlurDataURL(color: string = '#e5e7eb'): string {
    // Create a 10x10 pixel blur placeholder
    const svg = `
    <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
      <rect width="10" height="10" fill="${color}"/>
    </svg>
  `;

    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
}

export function OptimizedImage({
    src,
    alt,
    className,
    showShimmer = true,
    placeholderColor,
    aspectRatio,
    onLoad,
    ...props
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        setIsLoading(false);
        onLoad?.(e);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    // Fallback for broken images
    if (hasError) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center bg-muted text-muted-foreground',
                    className
                )}
                style={aspectRatio ? { aspectRatio } : undefined}
            >
                <span className="text-xs">Image unavailable</span>
            </div>
        );
    }

    return (
        <div className={cn('relative overflow-hidden', className)} style={aspectRatio ? { aspectRatio } : undefined}>
            {/* Shimmer effect while loading */}
            {isLoading && showShimmer && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer bg-[length:200%_100%]" />
            )}

            <Image
                src={src}
                alt={alt}
                className={cn(
                    'transition-opacity duration-300',
                    isLoading ? 'opacity-0' : 'opacity-100',
                    className
                )}
                placeholder="blur"
                blurDataURL={generateBlurDataURL(placeholderColor)}
                onLoad={handleLoad}
                onError={handleError}
                loading="lazy"
                {...props}
            />
        </div>
    );
}

/**
 * Avatar component with optimized loading
 */
export function OptimizedAvatar({
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
            className={cn('rounded-full', className)}
            aspectRatio="1/1"
            priority={false}
        />
    );
}

/**
 * Card image component with optimized loading
 */
export function OptimizedCardImage({
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
            className={className}
            aspectRatio="4/3"
            priority={false}
        />
    );
}
