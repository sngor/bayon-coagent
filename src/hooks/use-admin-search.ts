import { useState, useMemo, useCallback } from 'react';

interface UseAdminSearchOptions<T> {
    searchFields: (keyof T)[];
    initialSearchTerm?: string;
}

export function useAdminSearch<T extends Record<string, any>>(
    items: T[],
    options: UseAdminSearchOptions<T>
) {
    const { searchFields, initialSearchTerm = '' } = options;
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return items;

        const lowercaseSearch = searchTerm.toLowerCase();
        return items.filter(item =>
            searchFields.some(field => {
                const value = item[field];
                return value &&
                    String(value).toLowerCase().includes(lowercaseSearch);
            })
        );
    }, [items, searchTerm, searchFields]);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
    }, []);

    return {
        searchTerm,
        setSearchTerm,
        filteredItems,
        clearSearch,
        hasActiveSearch: searchTerm.trim().length > 0,
        resultCount: filteredItems.length
    };
}