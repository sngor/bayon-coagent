'use client';

/**
 * OptimizedImageClient - Client Component wrapper for interactive image loading
 * 
 * Handles client-side loading states and error handling.
 * Used internally by OptimizedImage Server Component.
 */

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

interface OptimizedImageClientProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
    showShimmer?: boolean;
    aspectRatio?: string;
    fallback?: React.ReactNode;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    containerClassName?: string;
}

export function OptimizedImageClient({
    src,
    alt,
    width,
    height,
    fill,
    className,
    containerClassName,
    showShimmer = true,
    aspectRatio,
    fallback,
    onLoad,
    onError,
    priority = false,
    quality = 85,
    sizes,
    ...props
}: OptimizedImageClientProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoading(false);
        onLoad?.();
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
        onError?.(new Error(`Failed to load image: ${src}`));
    };

    // Error fallback
    if (hasError) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div
                className={cn(
                    'flex items-center justify-center bg-muted text-muted-foreground',
                    containerClassName,
                    className
                )}
                style={
                    aspectRatio
                        ? { aspectRatio }
                        : fill
                            ? undefined
                            : { width, height }
                }
            >
                <div className="flex flex-col items-center gap-2 p-4">
                    <ImageOff className="h-8 w-8" />
                    <span className="text-xs text-center">Image unavailable</span>
                </div>
            </div>
        );
    }

    // Container styles
    const containerStyle: React.CSSProperties = {
        ...(aspectRatio && { aspectRatio }),
        ...(!aspectRatio && !fill && width && height && { width, height }),
    };

    return (
        <div
            className={cn('relative overflow-hidden', containerClassName)}
            style={containerStyle}
        >
            {/* Shimmer loading effect */}
            {isLoading && showShimmer && (
                <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%]" />
            )}

            {/* Optimized image */}
            <Image
                src={src}
                alt={alt}
                width={fill ? undefined : width}
                height={fill ? undefined : height}
                fill={fill}
                className={cn(
                    'transition-opacity duration-300',
                    isLoading ? 'opacity-0' : 'opacity-100',
                    className
                )}
                quality={quality}
                priority={priority}
                sizes={sizes}
                onLoad={handleLoad}
                onError={handleError}
                {...props}
            />
        </div>
    );
}
