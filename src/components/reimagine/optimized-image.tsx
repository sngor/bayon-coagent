'use client';

/**
 * Optimized Image Component for Reimagine
 * 
 * Wraps Next.js Image component with lazy loading and optimization
 * for better performance in edit history and preview displays.
 * 
 * Requirements: Performance considerations
 */

import { useState } from 'react';
import Image from 'next/image';
import { Loader2, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    onLoad?: () => void;
    onError?: () => void;
    fill?: boolean;
    sizes?: string;
    quality?: number;
}

export function OptimizedImage({
    src,
    alt,
    width,
    height,
    className,
    priority = false,
    onLoad,
    onError,
    fill = false,
    sizes,
    quality = 85,
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoading(false);
        onLoad?.();
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
        onError?.();
    };

    // Show error state
    if (hasError) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center bg-muted text-muted-foreground',
                    className
                )}
            >
                <div className="flex flex-col items-center gap-2">
                    <ImageOff className="h-8 w-8" />
                    <p className="text-xs">Failed to load image</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('relative', className)}>
            {/* Loading skeleton */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Optimized image */}
            {fill ? (
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes={sizes}
                    quality={quality}
                    className={cn('object-cover', isLoading && 'opacity-0')}
                    onLoad={handleLoad}
                    onError={handleError}
                    priority={priority}
                />
            ) : (
                <Image
                    src={src}
                    alt={alt}
                    width={width || 800}
                    height={height || 600}
                    quality={quality}
                    className={cn('object-cover', isLoading && 'opacity-0')}
                    onLoad={handleLoad}
                    onError={handleError}
                    priority={priority}
                    sizes={sizes}
                />
            )}
        </div>
    );
}
