import { useEffect, useRef, useState, useCallback } from 'react';

export interface VirtualScrollOptions {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
    enabled?: boolean;
}

export interface VirtualScrollResult<T> {
    virtualItems: Array<{
        index: number;
        item: T;
        offsetTop: number;
    }>;
    totalHeight: number;
    scrollToIndex: (index: number) => void;
    containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Custom hook for virtual scrolling large lists
 * Only renders visible items plus overscan buffer for smooth scrolling
 */
export function useVirtualScroll<T>(
    items: T[],
    options: VirtualScrollOptions
): VirtualScrollResult<T> {
    const { itemHeight, containerHeight, overscan = 3, enabled = true } = options;
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    // Calculate visible range
    const startIndex = enabled
        ? Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
        : 0;
    const endIndex = enabled
        ? Math.min(
            items.length - 1,
            Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
        )
        : items.length - 1;

    // Handle scroll events
    const handleScroll = useCallback(() => {
        if (containerRef.current) {
            setScrollTop(containerRef.current.scrollTop);
        }
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !enabled) return;

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [handleScroll, enabled]);

    // Scroll to specific index
    const scrollToIndex = useCallback(
        (index: number) => {
            if (containerRef.current) {
                containerRef.current.scrollTop = index * itemHeight;
            }
        },
        [itemHeight]
    );

    // Generate virtual items
    const virtualItems = enabled
        ? items.slice(startIndex, endIndex + 1).map((item, i) => ({
            index: startIndex + i,
            item,
            offsetTop: (startIndex + i) * itemHeight,
        }))
        : items.map((item, i) => ({
            index: i,
            item,
            offsetTop: i * itemHeight,
        }));

    const totalHeight = items.length * itemHeight;

    return {
        virtualItems,
        totalHeight,
        scrollToIndex,
        containerRef,
    };
}
