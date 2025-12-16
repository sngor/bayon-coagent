import { useMemo, useCallback } from 'react';
import { useVirtualScroll } from '@/hooks/use-virtual-scroll';

interface TrainingItem {
    id: string;
    category?: string;
    title?: string;
    description?: string;
    tags?: string[];
}

interface VirtualTrainingListProps<T extends TrainingItem> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    searchQuery?: string;
    selectedCategory?: string;
    searchFields?: (keyof T)[];
    filterFn?: (item: T) => boolean;
}

interface VirtualTrainingListResult<T> {
    filteredItems: T[];
    totalCount: number;
    visibleRange: { start: number; end: number };
    scrollToIndex: (index: number) => void;
    scrollToTop: () => void;
}

export function useVirtualTrainingList<T extends TrainingItem>({
    items,
    itemHeight,
    containerHeight,
    searchQuery = '',
    selectedCategory = 'all',
    searchFields = ['title', 'description'] as (keyof T)[],
    filterFn,
}: VirtualTrainingListProps<T>): VirtualTrainingListResult<T> {
    // Memoize search terms for better performance
    const searchTerms = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    }, [searchQuery]);

    // Filter items based on search and category - optimized
    const filteredItems = useMemo(() => {
        let filtered = items;

        // Early return if no filters
        if (!filterFn && selectedCategory === 'all' && searchTerms.length === 0) {
            return items;
        }

        // Apply custom filter first
        if (filterFn) {
            filtered = filtered.filter(filterFn);
        }

        // Category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        // Search filter - optimized algorithm
        if (searchTerms.length > 0) {
            filtered = filtered.filter(item => {
                // Use some() for early termination when any term matches
                return searchTerms.some(term =>
                    searchFields.some(field => {
                        const value = item[field];
                        if (typeof value === 'string') {
                            return value.toLowerCase().includes(term);
                        }
                        if (Array.isArray(value)) {
                            return value.some((v: unknown) =>
                                typeof v === 'string' && v.toLowerCase().includes(term)
                            );
                        }
                        return false;
                    })
                );
            });
        }

        return filtered;
    }, [items, selectedCategory, searchTerms, searchFields, filterFn]);

    // Use virtual scrolling for performance
    const virtualScroll = useVirtualScroll(filteredItems, {
        itemHeight,
        containerHeight,
        overscan: 5,
    });

    // Scroll utilities
    const scrollToTop = useCallback(() => {
        if (virtualScroll.scrollToIndex) {
            virtualScroll.scrollToIndex(0);
        }
    }, [virtualScroll]);

    return {
        filteredItems,
        totalCount: filteredItems.length,
        visibleRange: virtualScroll.visibleRange || { start: 0, end: Math.min(filteredItems.length, 10) },
        scrollToIndex: virtualScroll.scrollToIndex || (() => { }),
        scrollToTop,
    };
}