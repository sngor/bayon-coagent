'use client';

import { cn } from '@/lib/utils/common';
import { useProgressiveImage, useLazyImage } from '@/lib/mobile/performance';
import { Loader2 } from 'lucide-react';

export interface ProgressiveImageProps {
    src: string;
    alt: string;
    placeholder?: string;
    className?: string;
    lazy?: boolean;
    threshold?: number;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    showLoader?: boolean;
}

/**
 * Progressive image component with lazy loading support
 * Implements Requirements 7.3: Progressive image loading
 */
export function ProgressiveImage({
    src,
    alt,
    placeholder,
    className,
    lazy = true,
    threshold = 0.1,
    onLoad,
    onError,
    showLoader = true,
}: ProgressiveImageProps) {
    if (lazy) {
        const { elementRef, imageState, shouldLoad } = useLazyImage({
            src,
            alt,
            placeholder,
            threshold,
            onLoad,
            onError,
        });

        return (
            <div
                ref={elementRef as React.RefObject<HTMLDivElement>}
                className={cn('relative overflow-hidden bg-muted', className)}
            >
                {imageState.isLoading && showLoader && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}
                {shouldLoad && imageState.currentSrc && (
                    <img
                        src={imageState.currentSrc}
                        alt={alt}
                        className={cn(
                            'h-full w-full object-cover transition-opacity duration-300',
                            imageState.isLoaded ? 'opacity-100' : 'opacity-0'
                        )}
                    />
                )}
                {imageState.error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <p className="text-sm text-muted-foreground">Failed to load image</p>
                    </div>
                )}
            </div>
        );
    }

    const imageState = useProgressiveImage({
        src,
        alt,
        placeholder,
        onLoad,
        onError,
    });

    return (
        <div className={cn('relative overflow-hidden bg-muted', className)}>
            {imageState.isLoading && showLoader && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}
            {imageState.currentSrc && (
                <img
                    src={imageState.currentSrc}
                    alt={alt}
                    className={cn(
                        'h-full w-full object-cover transition-opacity duration-300',
                        imageState.isLoaded ? 'opacity-100' : 'opacity-0'
                    )}
                />
            )}
            {imageState.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <p className="text-sm text-muted-foreground">Failed to load image</p>
                </div>
            )}
        </div>
    );
}
