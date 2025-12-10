'use client';

import { useState, useCallback, useMemo } from 'react';
import { usePageManagement } from '@/hooks/use-page-management';
import { useOptimisticRemoval } from '@/hooks/use-optimistic-removal';
import { type PageMetadata } from '@/lib/page-metadata';
import { AddPageDialog } from '@/components/dashboard/add-page-dialog';
import { QuickActionSkeleton } from '@/components/ui/quick-action-skeleton';
import { QuickActionCard } from '@/components/ui/quick-action-card';
import { LoadingGrid } from '@/components/ui/loading-grid';

// Constants
const MAX_DISPLAYED_FAVORITES = 8;
const LOADING_SKELETON_COUNT = 4;



export function DashboardQuickActions() {
    const { favorites, isLoading, handleAddPage, handleRemovePage } = usePageManagement();
    const { removingIds, handleOptimisticRemoval } = useOptimisticRemoval();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Memoize displayed favorites to prevent unnecessary re-renders
    const displayedFavorites = useMemo(() =>
        favorites.slice(0, MAX_DISPLAYED_FAVORITES),
        [favorites]
    );

    // Memoize callbacks to prevent unnecessary re-renders
    const handleAddPageWithDialog = useCallback((page: PageMetadata) => {
        const wasAdded = handleAddPage(page);
        if (wasAdded) {
            setIsDialogOpen(false);
        }
    }, [handleAddPage]);

    const handleRemovePageOptimistic = useCallback((actionId: string) => {
        handleOptimisticRemoval(actionId, handleRemovePage);
    }, [handleOptimisticRemoval, handleRemovePage]);

    const handleContextMenu = useCallback((e: React.MouseEvent, actionId: string) => {
        e.preventDefault();
        handleRemovePageOptimistic(actionId);
    }, [handleRemovePageOptimistic]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold font-headline">Quick Actions</h2>
                </div>
                <LoadingGrid
                    columns={4}
                    count={LOADING_SKELETON_COUNT}
                    SkeletonComponent={QuickActionSkeleton}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold font-headline">Quick Actions</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {displayedFavorites.map((action) => (
                    <QuickActionCard
                        key={action.id}
                        action={action}
                        onRemove={handleRemovePageOptimistic}
                        onContextMenu={handleContextMenu}
                        isRemoving={removingIds.has(action.id)}
                    />
                ))}

                {/* Add more button */}
                {favorites.length < MAX_DISPLAYED_FAVORITES && (
                    <AddPageDialog
                        favorites={favorites}
                        onAddPage={handleAddPageWithDialog}
                        isOpen={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                    />
                )}
            </div>
        </div>
    );
}