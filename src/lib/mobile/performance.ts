/**
 * Mobile Performance Optimization Utilities
 * 
 * Provides utilities for:
 * - Progressive image loading with lazy loading
 * - Navigation prefetching based on context
 * - Cancellable operations with visual feedback
 * - Image compression and WebP conversion
 */

import { useEffect, useRef, useState } from 'react';

// ============================================================================
// Progressive Image Loading
// ============================================================================

export interface ProgressiveImageOptions {
    src: string;
    placeholder?: string;
    alt: string;
    className?: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}

export interface ImageLoadState {
    isLoading: boolean;
    isLoaded: boolean;
    error: Error | null;
    currentSrc: string;
}

/**
 * Hook for progressive image loading with lazy loading support
 */
export function useProgressiveImage(options: ProgressiveImageOptions): ImageLoadState {
    const [state, setState] = useState<ImageLoadState>({
        isLoading: true,
        isLoaded: false,
        error: null,
        currentSrc: options.placeholder || '',
    });

    const imgRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        // Create image element for preloading
        const img = new Image();
        imgRef.current = img;

        img.onload = () => {
            setState({
                isLoading: false,
                isLoaded: true,
                error: null,
                currentSrc: options.src,
            });
            options.onLoad?.();
        };

        img.onerror = () => {
            const error = new Error(`Failed to load image: ${options.src}`);
            setState({
                isLoading: false,
                isLoaded: false,
                error,
                currentSrc: options.placeholder || '',
            });
            options.onError?.(error);
        };

        // Start loading
        img.src = options.src;

        return () => {
            // Cleanup
            if (imgRef.current) {
                imgRef.current.onload = null;
                imgRef.current.onerror = null;
            }
        };
    }, [options.src, options.placeholder]);

    return state;
}

/**
 * Hook for lazy loading images using Intersection Observer
 */
export function useLazyImage(options: ProgressiveImageOptions & { threshold?: number }) {
    const [shouldLoad, setShouldLoad] = useState(false);
    const elementRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setShouldLoad(true);
                        observer.disconnect();
                    }
                });
            },
            {
                threshold: options.threshold || 0.1,
                rootMargin: '50px',
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [options.threshold]);

    const imageState = useProgressiveImage({
        ...options,
        src: shouldLoad ? options.src : '',
    });

    return { elementRef, imageState, shouldLoad };
}

// ============================================================================
// Navigation Prefetching
// ============================================================================

export interface PrefetchContext {
    currentRoute: string;
    userRole?: string;
    recentRoutes: string[];
    timeOfDay: 'morning' | 'afternoon' | 'evening';
}

export interface PrefetchStrategy {
    routes: string[];
    priority: 'high' | 'medium' | 'low';
}

/**
 * Determines which routes to prefetch based on current context
 */
export function getPrefetchRoutes(context: PrefetchContext): PrefetchStrategy {
    const routes: string[] = [];
    let priority: 'high' | 'medium' | 'low' = 'medium';

    // Hub-based prefetching
    if (context.currentRoute.startsWith('/studio')) {
        routes.push('/library/content', '/brand/profile');
        priority = 'high';
    } else if (context.currentRoute.startsWith('/brand')) {
        routes.push('/studio/write', '/research/agent');
        priority = 'high';
    } else if (context.currentRoute.startsWith('/research')) {
        routes.push('/library/reports', '/market/insights');
        priority = 'medium';
    } else if (context.currentRoute.startsWith('/market')) {
        routes.push('/tools/calculator', '/research/agent');
        priority = 'medium';
    } else if (context.currentRoute.startsWith('/tools')) {
        routes.push('/market/insights', '/library/content');
        priority = 'medium';
    } else if (context.currentRoute.startsWith('/library')) {
        routes.push('/studio/write', '/studio/describe');
        priority = 'high';
    }

    // Time-based prefetching
    if (context.timeOfDay === 'morning') {
        routes.push('/dashboard', '/assistant');
    } else if (context.timeOfDay === 'evening') {
        routes.push('/library/content', '/market/insights');
    }

    // Recent routes prefetching
    const recentUnique = [...new Set(context.recentRoutes)].slice(0, 3);
    routes.push(...recentUnique);

    // Remove duplicates and current route
    const uniqueRoutes = [...new Set(routes)].filter(
        (route) => route !== context.currentRoute
    );

    return { routes: uniqueRoutes, priority };
}

/**
 * Hook for navigation prefetching
 */
export function useNavigationPrefetch(context: PrefetchContext) {
    useEffect(() => {
        const { routes, priority } = getPrefetchRoutes(context);

        // Use requestIdleCallback for low-priority prefetching
        const prefetch = () => {
            routes.forEach((route) => {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = route;
                link.as = 'document';
                document.head.appendChild(link);
            });
        };

        if (priority === 'high') {
            prefetch();
        } else if ('requestIdleCallback' in window) {
            requestIdleCallback(prefetch);
        } else {
            setTimeout(prefetch, 1000);
        }
    }, [context.currentRoute, context.recentRoutes.join(',')]);
}

// ============================================================================
// Cancellable Operations
// ============================================================================

export interface CancellableOperation<T> {
    promise: Promise<T>;
    cancel: () => void;
    isCancelled: () => boolean;
}

export class OperationCancelledError extends Error {
    constructor(message = 'Operation was cancelled') {
        super(message);
        this.name = 'OperationCancelledError';
    }
}

/**
 * Creates a cancellable operation wrapper
 */
export function createCancellableOperation<T>(
    operation: (signal: AbortSignal) => Promise<T>
): CancellableOperation<T> {
    const controller = new AbortController();
    let cancelled = false;

    const promise = operation(controller.signal).catch((error) => {
        if (error.name === 'AbortError' || cancelled) {
            throw new OperationCancelledError();
        }
        throw error;
    });

    return {
        promise,
        cancel: () => {
            cancelled = true;
            controller.abort();
        },
        isCancelled: () => cancelled,
    };
}

/**
 * Hook for managing cancellable operations
 */
export function useCancellableOperation<T>() {
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const operationRef = useRef<CancellableOperation<T> | null>(null);

    const execute = async (
        operation: (signal: AbortSignal, updateProgress: (p: number) => void) => Promise<T>
    ): Promise<T> => {
        setIsRunning(true);
        setProgress(0);

        const cancellableOp = createCancellableOperation<T>((signal) =>
            operation(signal, setProgress)
        );

        operationRef.current = cancellableOp;

        try {
            const result = await cancellableOp.promise;
            setIsRunning(false);
            setProgress(100);
            return result;
        } catch (error) {
            setIsRunning(false);
            setProgress(0);
            throw error;
        }
    };

    const cancel = () => {
        if (operationRef.current) {
            operationRef.current.cancel();
            setIsRunning(false);
            setProgress(0);
        }
    };

    return { execute, cancel, isRunning, progress };
}

// ============================================================================
// Image Compression and WebP Conversion
// ============================================================================

export interface ImageCompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputFormat?: 'webp' | 'jpeg' | 'png';
}

export interface CompressedImage {
    blob: Blob;
    url: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    width: number;
    height: number;
    format: string;
}

/**
 * Compresses an image and optionally converts to WebP
 */
export async function compressImage(
    file: File,
    options: ImageCompressionOptions = {}
): Promise<CompressedImage> {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.85,
        outputFormat = 'webp',
    } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        reader.onerror = reject;

        img.onload = () => {
            try {
                // Calculate new dimensions
                let { width, height } = img;
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Draw image
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to create blob'));
                            return;
                        }

                        const url = URL.createObjectURL(blob);
                        const compressionRatio = file.size / blob.size;

                        resolve({
                            blob,
                            url,
                            originalSize: file.size,
                            compressedSize: blob.size,
                            compressionRatio,
                            width,
                            height,
                            format: outputFormat,
                        });
                    },
                    `image/${outputFormat}`,
                    quality
                );
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = reject;

        reader.readAsDataURL(file);
    });
}

/**
 * Checks if WebP is supported in the browser
 */
export function isWebPSupported(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Gets the optimal image format for the browser
 */
export function getOptimalImageFormat(): 'webp' | 'jpeg' {
    return isWebPSupported() ? 'webp' : 'jpeg';
}

// ============================================================================
// Performance Monitoring
// ============================================================================

export interface PerformanceMetrics {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    ttfb: number; // Time to First Byte
}

/**
 * Collects Core Web Vitals metrics
 */
export function collectPerformanceMetrics(): Partial<PerformanceMetrics> {
    const metrics: Partial<PerformanceMetrics> = {};

    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
        metrics.ttfb = navigation.responseStart - navigation.requestStart;
    }

    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
    if (fcp) {
        metrics.fcp = fcp.startTime;
    }

    return metrics;
}
