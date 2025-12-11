import { useCallback, useMemo, useState } from 'react';
import { debounce } from 'lodash';

interface UseAdminPerformanceOptions {
    debounceMs?: number;
    pageSize?: number;
}

export function useAdminPerformance<T>({
    debounceMs = 300,
    pageSize = 20
}: UseAdminPerformanceOptions = {}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Debounced search to prevent excessive API calls
    const debouncedSetSearch = useMemo(
        () => debounce((term: string) => {
            setSearchTerm(term);
            setCurrentPage(1); // Reset to first page on search
        }, debounceMs),
        [debounceMs]
    );

    // Pagination helpers
    const paginateItems = useCallback((items: T[]) => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return {
            items: items.slice(startIndex, endIndex),
            totalPages: Math.ceil(items.length / pageSize),
            totalItems: items.length,
            hasNextPage: endIndex < items.length,
            hasPrevPage: currentPage > 1
        };
    }, [currentPage, pageSize]);

    // Filter items based on search term
    const filterItems = useCallback((items: T[], searchFields: (keyof T)[]) => {
        if (!searchTerm) return items;

        return items.filter(item =>
            searchFields.some(field => {
                const value = item[field];
                return typeof value === 'string' &&
                    value.toLowerCase().includes(searchTerm.toLowerCase());
            })
        );
    }, [searchTerm]);

    return {
        searchTerm,
        setSearchTerm: debouncedSetSearch,
        currentPage,
        setCurrentPage,
        pageSize,
        paginateItems,
        filterItems
    };
}