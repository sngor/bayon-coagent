'use client';

import React, { useMemo, useCallback, forwardRef } from 'react';
import { List } from 'react-window';
import type { ListChildComponentProps } from 'react-window';
import { cn } from '@/lib/utils';
import { DraggableContentItem } from '@/components/content-calendar';
import {
    ScheduledContent,
    CalendarContent,
    PublishChannelType,
    ScheduledContentStatus
} from '@/lib/content-workflow-types';

/**
 * Virtual Calendar List Component using react-window
 * 
 * Optimizes rendering performance for large numbers of scheduled content items
 * by only rendering visible items in the viewport.
 * 
 * Performance targets:
 * - Handle 1000+ items with <2 second initial render
 * - Smooth scrolling at 60fps
 * - Low memory usage (only visible items in DOM)
 */

interface VirtualCalendarListProps {
    items: ScheduledContent[];
    height: number;
    itemHeight?: number;
    overscan?: number;
    onContentClick?: (contentId: string) => void;
    onContentAction?: (action: string, content: ScheduledContent) => void;
    onScheduleUpdate?: (scheduleId: string, newDate: Date) => Promise<void>;
    className?: string;
}

interface VirtualCalendarItemProps extends ListChildComponentProps {
    data: {
        items: ScheduledContent[];
        onContentClick?: (contentId: string) => void;
        onContentAction?: (action: string, content: ScheduledContent) => void;
        onScheduleUpdate?: (scheduleId: string, newDate: Date) => Promise<void>;
    };
}

/**
 * Individual calendar item component for virtual list
 */
const VirtualCalendarItem = React.memo(({ index, style, data }: VirtualCalendarItemProps) => {
    const { items, onContentClick, onContentAction, onScheduleUpdate } = data;
    const content = items[index];

    if (!content) {
        return (
            <div style={style} className="p-2">
                <div className="h-16 bg-muted/20 rounded animate-pulse" />
            </div>
        );
    }

    return (
        <div style={style} className="p-2">
            <DraggableContentItem
                content={content}
                isCompact={true}
                onContentClick={onContentClick}
                onContentAction={onContentAction}
            />
        </div>
    );
});

VirtualCalendarItem.displayName = 'VirtualCalendarItem';

/**
 * Virtual Calendar List with fixed item height for optimal performance
 */
export function VirtualCalendarList({
    items,
    height,
    itemHeight = 80,
    overscan = 5,
    onContentClick,
    onContentAction,
    onScheduleUpdate,
    className
}: VirtualCalendarListProps) {
    const itemData = useMemo(() => ({
        items,
        onContentClick,
        onContentAction,
        onScheduleUpdate
    }), [items, onContentClick, onContentAction, onScheduleUpdate]);

    const itemCount = items.length;

    if (itemCount === 0) {
        return (
            <div className={cn("flex items-center justify-center", className)} style={{ height }}>
                <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium">No scheduled content</p>
                    <p className="text-sm">Create some content to see it here</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("border rounded-lg overflow-hidden", className)}>
            <List
                height={height}
                itemCount={itemCount}
                itemSize={itemHeight}
                itemData={itemData}
                overscanCount={overscan}
                className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
                {VirtualCalendarItem}
            </List>
        </div>
    );
}

/**
 * Variable height virtual list for content with different sizes
 */
interface VariableVirtualCalendarListProps extends Omit<VirtualCalendarListProps, 'itemHeight'> {
    getItemHeight: (index: number) => number;
    estimatedItemSize?: number;
}

const VariableVirtualCalendarItem = React.memo(({ index, style, data }: VirtualCalendarItemProps) => {
    const { items, onContentClick, onContentAction } = data;
    const content = items[index];

    if (!content) {
        return (
            <div style={style} className="p-2">
                <div className="h-20 bg-muted/20 rounded animate-pulse" />
            </div>
        );
    }

    // Calculate dynamic height based on content
    const hasLongTitle = content.title.length > 50;
    const hasMultipleChannels = content.channels.length > 2;
    const hasMetadata = content.metadata && Object.keys(content.metadata).length > 0;

    const dynamicHeight = 60 +
        (hasLongTitle ? 20 : 0) +
        (hasMultipleChannels ? 15 : 0) +
        (hasMetadata ? 10 : 0);

    return (
        <div style={style} className="p-2">
            <div style={{ minHeight: dynamicHeight }}>
                <DraggableContentItem
                    content={content}
                    isCompact={false}
                    onContentClick={onContentClick}
                    onContentAction={onContentAction}
                />
            </div>
        </div>
    );
});

VariableVirtualCalendarItem.displayName = 'VariableVirtualCalendarItem';

export function VariableVirtualCalendarList({
    items,
    height,
    getItemHeight,
    estimatedItemSize = 80,
    overscan = 5,
    onContentClick,
    onContentAction,
    onScheduleUpdate,
    className
}: VariableVirtualCalendarListProps) {
    const itemData = useMemo(() => ({
        items,
        onContentClick,
        onContentAction,
        onScheduleUpdate
    }), [items, onContentClick, onContentAction, onScheduleUpdate]);

    const itemCount = items.length;

    if (itemCount === 0) {
        return (
            <div className={cn("flex items-center justify-center", className)} style={{ height }}>
                <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium">No scheduled content</p>
                    <p className="text-sm">Create some content to see it here</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("border rounded-lg overflow-hidden", className)}>
            <List
                height={height}
                itemCount={itemCount}
                itemSize={getItemHeight}
                itemData={itemData}
                overscanCount={overscan}
                className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
                {VariableVirtualCalendarItem}
            </List>
        </div>
    );
}

/**
 * Grouped virtual calendar list for displaying content by date
 */
interface GroupedVirtualCalendarListProps extends VirtualCalendarListProps {
    groupedContent: CalendarContent[];
    showDateHeaders?: boolean;
}

interface GroupedItemData {
    type: 'header' | 'content';
    date?: Date;
    content?: ScheduledContent;
    totalItems?: number;
}

const GroupedVirtualCalendarItem = React.memo(({ index, style, data }: ListChildComponentProps & {
    data: {
        items: GroupedItemData[];
        onContentClick?: (contentId: string) => void;
        onContentAction?: (action: string, content: ScheduledContent) => void;
    };
}) => {
    const { items, onContentClick, onContentAction } = data;
    const item = items[index];

    if (!item) {
        return (
            <div style={style} className="p-2">
                <div className="h-16 bg-muted/20 rounded animate-pulse" />
            </div>
        );
    }

    if (item.type === 'header') {
        return (
            <div style={style} className="px-4 py-2 bg-muted/50 border-b">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">
                        {item.date?.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                        {item.totalItems} {item.totalItems === 1 ? 'item' : 'items'}
                    </span>
                </div>
            </div>
        );
    }

    if (item.type === 'content' && item.content) {
        return (
            <div style={style} className="px-4 py-1">
                <DraggableContentItem
                    content={item.content}
                    isCompact={true}
                    onContentClick={onContentClick}
                    onContentAction={onContentAction}
                />
            </div>
        );
    }

    return <div style={style} />;
});

GroupedVirtualCalendarItem.displayName = 'GroupedVirtualCalendarItem';

export function GroupedVirtualCalendarList({
    groupedContent,
    height,
    itemHeight = 80,
    overscan = 5,
    onContentClick,
    onContentAction,
    showDateHeaders = true,
    className
}: GroupedVirtualCalendarListProps) {
    const flattenedItems = useMemo(() => {
        const items: GroupedItemData[] = [];

        groupedContent.forEach(dayContent => {
            if (showDateHeaders) {
                items.push({
                    type: 'header',
                    date: dayContent.date,
                    totalItems: dayContent.totalItems
                });
            }

            dayContent.items.forEach(content => {
                items.push({
                    type: 'content',
                    content
                });
            });
        });

        return items;
    }, [groupedContent, showDateHeaders]);

    const itemData = useMemo(() => ({
        items: flattenedItems,
        onContentClick,
        onContentAction
    }), [flattenedItems, onContentClick, onContentAction]);

    const getItemSize = useCallback((index: number) => {
        const item = flattenedItems[index];
        if (item?.type === 'header') {
            return 48; // Header height
        }
        return itemHeight; // Content item height
    }, [flattenedItems, itemHeight]);

    if (flattenedItems.length === 0) {
        return (
            <div className={cn("flex items-center justify-center", className)} style={{ height }}>
                <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium">No scheduled content</p>
                    <p className="text-sm">Create some content to see it here</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("border rounded-lg overflow-hidden", className)}>
            <List
                height={height}
                itemCount={flattenedItems.length}
                itemSize={getItemSize}
                itemData={itemData}
                overscanCount={overscan}
                className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
                {GroupedVirtualCalendarItem}
            </List>
        </div>
    );
}

/**
 * Hook for determining when to use virtual scrolling
 */
export function useVirtualScrolling(itemCount: number, containerHeight: number = 600) {
    return useMemo(() => {
        const itemHeight = 80;
        const visibleItems = Math.floor(containerHeight / itemHeight);
        const shouldUseVirtualScrolling = itemCount > visibleItems * 3; // Use virtual scrolling when more than 3 screens worth

        return {
            shouldUseVirtualScrolling,
            visibleItems,
            estimatedHeight: itemCount * itemHeight,
            strategy: shouldUseVirtualScrolling ? 'virtual-scroll' : 'standard'
        };
    }, [itemCount, containerHeight]);
}

/**
 * Utility function for determining virtual scrolling strategy (non-hook version for testing)
 */
export function getVirtualScrollingStrategy(itemCount: number, containerHeight: number = 600) {
    const itemHeight = 80;
    const visibleItems = Math.floor(containerHeight / itemHeight);
    const shouldUseVirtualScrolling = itemCount > visibleItems * 3; // Use virtual scrolling when more than 3 screens worth

    return {
        shouldUseVirtualScrolling,
        visibleItems,
        estimatedHeight: itemCount * itemHeight,
        strategy: shouldUseVirtualScrolling ? 'virtual-scroll' : 'standard'
    };
}

/**
 * Performance monitoring hook for virtual scrolling
 */
export function useVirtualScrollPerformance() {
    const [metrics, setMetrics] = React.useState({
        renderTime: 0,
        scrollPerformance: 'unknown' as 'excellent' | 'good' | 'poor' | 'unknown',
        memoryUsage: 0,
        visibleItems: 0
    });

    const measureRenderTime = useCallback((startTime: number) => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        setMetrics(prev => ({
            ...prev,
            renderTime,
            scrollPerformance: renderTime < 16 ? 'excellent' : renderTime < 33 ? 'good' : 'poor'
        }));
    }, []);

    const updateVisibleItems = useCallback((count: number) => {
        setMetrics(prev => ({
            ...prev,
            visibleItems: count
        }));
    }, []);

    return {
        metrics,
        measureRenderTime,
        updateVisibleItems
    };
}