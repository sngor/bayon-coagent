import { useState, useMemo } from 'react';

export interface PaginationOptions {
    itemsPerPage?: number;
    initialPage?: number;
}

export interface PaginationResult<T> {
    currentPage: number;
    totalPages: number;
    pageItems: T[];
    goToPage: (page: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    canGoNext: boolean;
    canGoPrevious: boolean;
    startIndex: number;
    endIndex: number;
}

/**
 * Custom hook for pagination
 * Provides fallback for virtual scrolling when needed
 */
export function usePagination<T>(
    items: T[],
    options: PaginationOptions = {}
): PaginationResult<T> {
    const { itemsPerPage = 20, initialPage = 1 } = options;
    const [currentPage, setCurrentPage] = useState(initialPage);

    const totalPages = Math.ceil(items.length / itemsPerPage);

    const pageItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return items.slice(startIndex, endIndex);
    }, [items, currentPage, itemsPerPage]);

    const goToPage = (page: number) => {
        const validPage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(validPage);
    };

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const previousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, items.length);

    return {
        currentPage,
        totalPages,
        pageItems,
        goToPage,
        nextPage,
        previousPage,
        canGoNext: currentPage < totalPages,
        canGoPrevious: currentPage > 1,
        startIndex,
        endIndex,
    };
}
