'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { getPageMetadata } from '@/lib/page-metadata';
import { type FavoriteItem } from '@/hooks/use-favorites';

/**
 * Hook to get page metadata for the current page
 * Returns undefined if the current page is not registered
 */
export function usePageMetadata(): Omit<FavoriteItem, 'addedAt'> | undefined {
    const pathname = usePathname();

    return useMemo(() => {
        return getPageMetadata(pathname);
    }, [pathname]);
}

/**
 * Hook to get page metadata for a specific path
 */
export function usePageMetadataForPath(path: string): Omit<FavoriteItem, 'addedAt'> | undefined {
    return useMemo(() => {
        return getPageMetadata(path);
    }, [path]);
}
