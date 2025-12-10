'use client';

import { useCallback } from 'react';
import { useFavorites } from '@/hooks/use-favorites';
import { toast } from '@/hooks/use-toast';
import { type PageMetadata } from '@/lib/page-metadata';

/**
 * Custom hook for managing page favorites with consistent error handling and notifications
 */
export function usePageManagement() {
    const { favorites, isLoading, toggleFavorite } = useFavorites();

    const handleAddPage = useCallback((page: PageMetadata) => {
        try {
            const wasAlreadyFavorited = favorites.some(f => f.id === page.id);

            toggleFavorite({
                id: page.id,
                title: page.title,
                description: page.description,
                href: page.href,
                icon: page.icon,
                color: page.color,
                gradient: page.gradient
            });

            const action = wasAlreadyFavorited ? 'Unpinned' : 'Pinned';
            const actionDescription = wasAlreadyFavorited ? 'removed from' : 'added to';

            toast({
                title: action,
                description: `${page.title} ${actionDescription} quick actions`,
            });

            return !wasAlreadyFavorited; // Return true if added, false if removed
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            toast({
                title: "Error",
                description: "Failed to update quick actions. Please try again.",
                variant: "destructive",
            });
            return false;
        }
    }, [favorites, toggleFavorite]);

    const handleRemovePage = useCallback((id: string, event?: React.MouseEvent) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        try {
            const favorite = favorites.find(f => f.id === id);
            if (favorite) {
                toggleFavorite(favorite);
                toast({
                    title: "Unpinned",
                    description: `${favorite.title} removed from quick actions`,
                });
            }
        } catch (error) {
            console.error('Failed to remove favorite:', error);
            toast({
                title: "Error",
                description: "Failed to remove from quick actions. Please try again.",
                variant: "destructive",
            });
        }
    }, [favorites, toggleFavorite]);

    return {
        favorites,
        isLoading,
        handleAddPage,
        handleRemovePage
    };
}