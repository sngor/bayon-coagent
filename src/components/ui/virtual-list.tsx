import React from 'react';
import { useVirtualScroll } from '@/hooks/use-virtual-scroll';
import { cn } from '@/lib/utils';

export interface VirtualListProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    className?: string;
    overscan?: number;
    enabled?: boolean;
    emptyState?: React.ReactNode;
}

/**
 * Virtual list component for efficiently rendering large lists
 * Only renders visible items to maintain performance
 */
export function VirtualList<T>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    className,
    overscan = 3,
    enabled = true,
    emptyState,
}: VirtualListProps<T>) {
    const { virtualItems, totalHeight, containerRef } = useVirtualScroll(items, {
        itemHeight,
        containerHeight,
        overscan,
        enabled,
    });

    if (items.length === 0 && emptyState) {
        return <div className={className}>{emptyState}</div>;
    }

    return (
        <div
            ref={containerRef}
            className={cn('overflow-auto', className)}
            style={{ height: containerHeight }}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                {virtualItems.map(({ index, item, offsetTop }) => (
                    <div
                        key={index}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: itemHeight,
                            transform: `translateY(${offsetTop}px)`,
                        }}
                    >
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        </div>
    );
}
