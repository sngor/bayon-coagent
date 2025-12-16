'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSavedContentAction } from '@/app/actions';
import { useUser } from '@/aws/auth/use-user';
import type { SavedContentItem } from '@/app/library-actions';

interface UseRecentContentOptions {
    limit?: number;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

interface UseRecentContentReturn {
    content: SavedContentItem[];
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    refresh: (showRefreshing?: boolean) => Promise<void>;
}

export function useRecentContent(options: UseRecentContentOptions = {}): UseRecentContentReturn {
    const { limit = 10, autoRefresh = false, refreshInterval = 30000 } = options;
    const { user } = useUser();

    const [content, setContent] = useState<SavedContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadContent = useCallback(async (showRefreshing = false) => {
        if (!user?.id) {
            setContent([]);
            setIsLoading(false);
            return;
        }

        if (showRefreshing) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            setError(null);
            const result = await getSavedContentAction(user.id);

            if (result.data) {
                // Sort by creation date and take the most recent
                const sorted = result.data
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, limit);
                setContent(sorted);
            } else if (result.errors?.length) {
                setError(result.errors[0]);
                setContent([]);
            } else {
                setContent([]);
            }
        } catch (error) {
            console.error('Error loading recent content:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load recent content';
            setError(errorMessage);
            setContent([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user?.id, limit]);

    // Initial load
    useEffect(() => {
        loadContent();
    }, [loadContent]);

    // Auto-refresh functionality
    useEffect(() => {
        if (!autoRefresh || !user?.id) return;

        const interval = setInterval(() => {
            loadContent(true);
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, loadContent, user?.id]);

    return {
        content,
        isLoading,
        isRefreshing,
        error,
        refresh: loadContent,
    };
}