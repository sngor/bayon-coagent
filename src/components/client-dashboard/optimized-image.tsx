'use client';

/**
 * Optimized Image Component with Lazy Loading
 * 
 * Features:
 * - Lazy loading with Intersection Observer
 * - Blur placeholder
 * - Error handling with fallback
 * - Responsive sizing
 * 
 * Requirements: Performance optimization (Task 26)
 */

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    fill?: boolean;
    sizes?: string;
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    onLoad?: () => void;
    onError?: () => void;
}

/**
 * Optimized image component with lazy loading
 */
export function OptimizedImage({
    src,
    alt,
    width,
    height,
    className,
    priority = false,
    fill = false,
    sizes,
    objectFit = 'cover',
    onLoad,
    onError,
}: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (priority || !imgRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading 50px before image enters viewport
            }
        );

        observer.observe(imgRef.current);

        return () => {
            observer.disconnect();
        };
    }, [priority]);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setHasError(true);
        onError?.();
    };

    // Fallback image for errors
    if (hasError) {
        return (
            <div
                ref={imgRef}
                className={cn(
                    'flex items-center justify-center bg-muted text-muted-foreground',
                    className
                )}
                style={fill ? undefined : { width, height }}
            >
                <svg
                    className="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            </div>
        );
    }

    return (
        <div
            ref={imgRef}
            className={cn('relative overflow-hidden', className)}
            style={fill ? undefined : { width, height }}
        >
            {isInView ? (
                <>
                    {/* Blur placeholder */}
                    {!isLoaded && (
                        <div className="absolute inset-0 bg-muted animate-pulse" />
                    )}

                    {/* Actual image */}
                    <Image
                        src={src}
                        alt={alt}
                        width={fill ? undefined : width}
                        height={fill ? undefined : height}
                        fill={fill}
                        sizes={sizes}
                        className={cn(
                            'transition-opacity duration-300',
                            isLoaded ? 'opacity-100' : 'opacity-0',
                            objectFit === 'cover' && 'object-cover',
                            objectFit === 'contain' && 'object-contain',
                            objectFit === 'fill' && 'object-fill',
                            objectFit === 'none' && 'object-none',
                            objectFit === 'scale-down' && 'object-scale-down'
                        )}
                        onLoad={handleLoad}
                        onError={handleError}
                        priority={priority}
                        quality={85}
                    />
                </>
            ) : (
                // Placeholder before image is in view
                <div className="absolute inset-0 bg-muted" />
            )}
        </div>
    );
}

/**
 * Property image component with optimized loading
 */
export function PropertyImage({
    src,
    alt,
    className,
    priority = false,
}: {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
}) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={className}
            priority={priority}
            objectFit="cover"
        />
    );
}

/**
 * Logo image component with optimized loading
 */
export function LogoImage({
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
            width={200}
            height={200}
            className={className}
            priority={true}
            objectFit="contain"
        />
    );
}

/**
 * Document thumbnail component
 */
export function DocumentThumbnail({
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
            width={80}
            height={80}
            className={className}
            objectFit="cover"
        />
    );
}
