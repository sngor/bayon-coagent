'use client';

/**
 * VirtualList - Virtualized list component for efficiently rendering large datasets
 * 
 * Features:
 * - Virtualization logic for large lists (only renders visible items)
 * - Support for variable item heights
 * - Configurable overscan for smooth scrolling
 * - Scroll to index functionality
 * - Empty state support
 * 
 * Requirements: 8.4 - List components with built-in virtualization
 * 
 * @example
 * ```tsx
 * <VirtualList
 *   items={largeDataset}
 *   itemHeight={80}
 *   renderItem={(item) => <ListItem data={item} />}
 *   overscan={3}
 * />
 * ```
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { StandardEmptyState } from '@/components/standard/empty-state';
import { List } from 'lucide-react';

interface VirtualListProps<T> {
    /**
     * Array of items to render
     */
    items: T[];

    /**
     * Height of each item in pixels (for fixed height items)
     */
    itemHeight?: number;

    /**
     * Function to get height for variable height items
     */
    getItemHeight?: (item: T, index: number) => number;

    /**
     * Function to render each item
     */
    renderItem: (item: T, index: number) => React.ReactNode;

    /**
     * Number of items to render outside visible area (for smooth scrolling)
     */
    overscan?: number;

    /**
     * Container height (defaults to 100% of parent)
     */
    height?: number | string;

    /**
     * Custom className for container
     */
    className?: string;

    /**
     * Empty state component
     */
    emptyState?: React.ReactNode;

    /**
     * Callback when scroll position changes
     */
    onScroll?: (scrollTop: number) => void;

    /**
     * Unique key extractor for items
     */
    getItemKey?: (item: T, index: number) => string | number;
}

/**
 * VirtualList component with support for fixed and variable item heights
 */
export function VirtualList<T>({
    items,
    itemHeight = 80,
    getItemHeight,
    renderItem,
    overscan = 3,
    height = '100%',
    className,
    emptyState,
    onScroll,
    getItemKey,
}: VirtualListProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    // Calculate item heights and positions
    const itemPositions = React.useMemo(() => {
        const positions: Array<{ top: number; height: number }> = [];
        let currentTop = 0;

        items.forEach((item, index) => {
            const height = getItemHeight ? getItemHeight(item, index) : itemHeight;
            positions.push({ top: currentTop, height });
            currentTop += height;
        });

        return positions;
    }, [items, itemHeight, getItemHeight]);

    const totalHeight = itemPositions.length > 0
        ? itemPositions[itemPositions.length - 1].top + itemPositions[itemPositions.length - 1].height
        : 0;

    // Update container height on mount and resize
    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.clientHeight);
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // Handle scroll
    const handleScroll = useCallback(() => {
        if (containerRef.current) {
            const newScrollTop = containerRef.current.scrollTop;
            setScrollTop(newScrollTop);
            onScroll?.(newScrollTop);
        }
    }, [onScroll]);

    // Calculate visible range
    const { startIndex, endIndex } = React.useMemo(() => {
        if (itemPositions.length === 0) {
            return { startIndex: 0, endIndex: 0 };
        }

        // Binary search for start index
        let start = 0;
        let end = itemPositions.length - 1;

        while (start < end) {
            const mid = Math.floor((start + end) / 2);
            if (itemPositions[mid].top < scrollTop) {
                start = mid + 1;
            } else {
                end = mid;
            }
        }

        const startIdx = Math.max(0, start - overscan);

        // Find end index
        const visibleBottom = scrollTop + containerHeight;
        let endIdx = startIdx;

        while (
            endIdx < itemPositions.length &&
            itemPositions[endIdx].top < visibleBottom
        ) {
            endIdx++;
        }

        endIdx = Math.min(itemPositions.length - 1, endIdx + overscan);

        return { startIndex: startIdx, endIndex: endIdx };
    }, [scrollTop, containerHeight, itemPositions, overscan]);

    // Generate visible items
    const visibleItems = React.useMemo(() => {
        const result: Array<{
            index: number;
            item: T;
            top: number;
            height: number;
            key: string | number;
        }> = [];

        for (let i = startIndex; i <= endIndex && i < items.length; i++) {
            const position = itemPositions[i];
            const key = getItemKey ? getItemKey(items[i], i) : i;

            result.push({
                index: i,
                item: items[i],
                top: position.top,
                height: position.height,
                key,
            });
        }

        return result;
    }, [startIndex, endIndex, items, itemPositions, getItemKey]);

    // Empty state
    if (items.length === 0) {
        return (
            <div className={cn('flex items-center justify-center', className)} style={{ height }}>
                {emptyState || (
                    <StandardEmptyState
                        icon={List}
                        title="No items"
                        description="There are no items to display"
                    />
                )}
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn('overflow-auto', className)}
            style={{ height }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleItems.map(({ index, item, top, height, key }) => (
                    <div
                        key={key}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height,
                            transform: `translateY(${top}px)`,
                        }}
                    >
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Hook for programmatic scrolling in VirtualList
 */
export function useVirtualListScroll() {
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToIndex = useCallback((index: number, itemPositions: Array<{ top: number }>) => {
        if (containerRef.current && itemPositions[index]) {
            containerRef.current.scrollTop = itemPositions[index].top;
        }
    }, []);

    const scrollToTop = useCallback(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, []);

    const scrollToBottom = useCallback((totalHeight: number) => {
        if (containerRef.current) {
            containerRef.current.scrollTop = totalHeight;
        }
    }, []);

    return {
        containerRef,
        scrollToIndex,
        scrollToTop,
        scrollToBottom,
    };
}

/**
 * Simple VirtualList for fixed-height items (optimized version)
 */
export function SimpleVirtualList<T>({
    items,
    itemHeight,
    renderItem,
    overscan = 3,
    height = '100%',
    className,
    emptyState,
    getItemKey,
}: Omit<VirtualListProps<T>, 'getItemHeight'> & { itemHeight: number }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    // Update container height
    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.clientHeight);
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // Calculate visible range (simpler for fixed heights)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);

    const totalHeight = items.length * itemHeight;

    // Handle scroll
    const handleScroll = useCallback(() => {
        if (containerRef.current) {
            setScrollTop(containerRef.current.scrollTop);
        }
    }, []);

    // Empty state
    if (items.length === 0) {
        return (
            <div className={cn('flex items-center justify-center', className)} style={{ height }}>
                {emptyState || (
                    <StandardEmptyState
                        icon={List}
                        title="No items"
                        description="There are no items to display"
                    />
                )}
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn('overflow-auto', className)}
            style={{ height }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                {items.slice(startIndex, endIndex + 1).map((item, i) => {
                    const index = startIndex + i;
                    const key = getItemKey ? getItemKey(item, index) : index;

                    return (
                        <div
                            key={key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: itemHeight,
                                transform: `translateY(${index * itemHeight}px)`,
                            }}
                        >
                            {renderItem(item, index)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
