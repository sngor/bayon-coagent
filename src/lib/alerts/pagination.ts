/**
 * Alert Pagination System
 * 
 * Provides efficient pagination for large alert lists with cursor-based pagination
 * and virtual scrolling support.
 */

import { Alert, AlertFilters, AlertQueryOptions, AlertsResponse } from './types';
import { DynamoDBKey } from '@/aws/dynamodb/types';

export interface PaginationState {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    lastEvaluatedKey?: DynamoDBKey;
    cursors: DynamoDBKey[]; // Store cursors for each page
}

export interface PaginationOptions {
    pageSize?: number;
    initialPage?: number;
    enableVirtualScrolling?: boolean;
    preloadPages?: number; // Number of pages to preload
}

export interface VirtualScrollItem {
    index: number;
    alert: Alert;
    height: number;
    offset: number;
}

/**
 * Alert Pagination Manager
 * Handles cursor-based pagination with DynamoDB
 */
export class AlertPaginationManager {
    private pageSize: number;
    private cursors: Map<number, DynamoDBKey> = new Map();
    private pages: Map<number, Alert[]> = new Map();
    private totalCount: number = 0;
    private preloadPages: number;

    constructor(options: PaginationOptions = {}) {
        this.pageSize = options.pageSize || 20;
        this.preloadPages = options.preloadPages || 1;
    }

    /**
     * Calculates pagination state
     */
    getPaginationState(currentPage: number): PaginationState {
        const totalPages = Math.ceil(this.totalCount / this.pageSize);

        return {
            currentPage,
            pageSize: this.pageSize,
            totalCount: this.totalCount,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
            lastEvaluatedKey: this.cursors.get(currentPage),
            cursors: Array.from(this.cursors.values()),
        };
    }

    /**
     * Sets page data and cursor
     */
    setPageData(page: number, alerts: Alert[], lastEvaluatedKey?: DynamoDBKey, totalCount?: number): void {
        this.pages.set(page, alerts);

        if (lastEvaluatedKey) {
            this.cursors.set(page + 1, lastEvaluatedKey);
        }

        if (totalCount !== undefined) {
            this.totalCount = totalCount;
        }
    }

    /**
     * Gets cached page data
     */
    getPageData(page: number): Alert[] | null {
        return this.pages.get(page) || null;
    }

    /**
     * Gets cursor for a specific page
     */
    getCursor(page: number): DynamoDBKey | undefined {
        return this.cursors.get(page);
    }

    /**
     * Clears all cached data
     */
    clear(): void {
        this.pages.clear();
        this.cursors.clear();
        this.totalCount = 0;
    }

    /**
     * Gets pages that should be preloaded
     */
    getPreloadPages(currentPage: number): number[] {
        const pages: number[] = [];
        const totalPages = Math.ceil(this.totalCount / this.pageSize);

        // Preload previous pages
        for (let i = Math.max(1, currentPage - this.preloadPages); i < currentPage; i++) {
            if (!this.pages.has(i)) {
                pages.push(i);
            }
        }

        // Preload next pages
        for (let i = currentPage + 1; i <= Math.min(totalPages, currentPage + this.preloadPages); i++) {
            if (!this.pages.has(i)) {
                pages.push(i);
            }
        }

        return pages;
    }

    /**
     * Invalidates cached pages (e.g., when alerts are updated)
     */
    invalidate(): void {
        this.clear();
    }
}

/**
 * Virtual Scrolling Manager for large alert lists
 */
export class AlertVirtualScrollManager {
    private itemHeight: number;
    private containerHeight: number;
    private overscan: number;
    private items: Alert[] = [];

    constructor(
        itemHeight: number = 120, // Estimated height of alert card
        containerHeight: number = 600,
        overscan: number = 5 // Number of items to render outside visible area
    ) {
        this.itemHeight = itemHeight;
        this.containerHeight = containerHeight;
        this.overscan = overscan;
    }

    /**
     * Sets the items for virtual scrolling
     */
    setItems(items: Alert[]): void {
        this.items = items;
    }

    /**
     * Calculates which items should be visible based on scroll position
     */
    getVisibleRange(scrollTop: number): {
        startIndex: number;
        endIndex: number;
        visibleItems: VirtualScrollItem[];
        totalHeight: number;
        offsetY: number;
    } {
        const totalHeight = this.items.length * this.itemHeight;

        const startIndex = Math.max(
            0,
            Math.floor(scrollTop / this.itemHeight) - this.overscan
        );

        const endIndex = Math.min(
            this.items.length - 1,
            Math.floor((scrollTop + this.containerHeight) / this.itemHeight) + this.overscan
        );

        const visibleItems: VirtualScrollItem[] = [];

        for (let i = startIndex; i <= endIndex; i++) {
            if (this.items[i]) {
                visibleItems.push({
                    index: i,
                    alert: this.items[i],
                    height: this.itemHeight,
                    offset: i * this.itemHeight,
                });
            }
        }

        return {
            startIndex,
            endIndex,
            visibleItems,
            totalHeight,
            offsetY: startIndex * this.itemHeight,
        };
    }

    /**
     * Updates container height (e.g., on window resize)
     */
    updateContainerHeight(height: number): void {
        this.containerHeight = height;
    }

    /**
     * Updates item height (e.g., based on actual measurements)
     */
    updateItemHeight(height: number): void {
        this.itemHeight = height;
    }
}

/**
 * Pagination utilities
 */
export const paginationUtils = {
    /**
     * Calculates offset-based pagination parameters
     */
    getOffsetPagination(page: number, pageSize: number) {
        return {
            offset: (page - 1) * pageSize,
            limit: pageSize,
        };
    },

    /**
     * Calculates total pages from total count and page size
     */
    getTotalPages(totalCount: number, pageSize: number): number {
        return Math.ceil(totalCount / pageSize);
    },

    /**
     * Gets page numbers for pagination UI
     */
    getPageNumbers(currentPage: number, totalPages: number, maxVisible: number = 7): number[] {
        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const half = Math.floor(maxVisible / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    },

    /**
     * Debounces pagination requests
     */
    debouncePagination<T extends any[]>(
        fn: (...args: T) => Promise<any>,
        delay: number = 300
    ): (...args: T) => Promise<any> {
        let timeoutId: NodeJS.Timeout;
        let latestResolve: (value: any) => void;
        let latestReject: (reason: any) => void;

        return (...args: T): Promise<any> => {
            return new Promise((resolve, reject) => {
                latestResolve = resolve;
                latestReject = reject;

                clearTimeout(timeoutId);
                timeoutId = setTimeout(async () => {
                    try {
                        const result = await fn(...args);
                        latestResolve(result);
                    } catch (error) {
                        latestReject(error);
                    }
                }, delay);
            });
        };
    },
};

// Export factory functions
export const createPaginationManager = (options?: PaginationOptions) =>
    new AlertPaginationManager(options);

export const createVirtualScrollManager = (
    itemHeight?: number,
    containerHeight?: number,
    overscan?: number
) => new AlertVirtualScrollManager(itemHeight, containerHeight, overscan);