/**
 * Alert Loading Skeletons
 * 
 * Provides various skeleton loading states for alert components
 * to improve perceived performance and user experience.
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AlertSkeletonProps {
    className?: string;
}

interface AlertListSkeletonProps {
    count?: number;
    className?: string;
}

/**
 * Skeleton for individual alert cards
 */
export function AlertCardSkeleton({ className }: AlertSkeletonProps) {
    return (
        <Card className={cn('animate-pulse', className)}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Alert Type Icon */}
                        <Skeleton className="w-10 h-10 rounded-full" />

                        <div className="flex-1 min-w-0 space-y-2">
                            {/* Badges and Status */}
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-20 h-5 rounded" />
                                <Skeleton className="w-16 h-5 rounded" />
                                <Skeleton className="w-2 h-2 rounded-full" />
                            </div>

                            {/* Alert Title */}
                            <Skeleton className="w-4/5 h-6" />

                            {/* Metadata */}
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-24 h-4" />
                                <Skeleton className="w-20 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Skeleton className="w-8 h-8 rounded" />
                        <Skeleton className="w-8 h-8 rounded" />
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}

/**
 * Skeleton for alert list
 */
export function AlertListSkeleton({ count = 5, className }: AlertListSkeletonProps) {
    return (
        <div className={cn('space-y-4', className)}>
            {Array.from({ length: count }, (_, i) => (
                <AlertCardSkeleton key={i} />
            ))}
        </div>
    );
}

/**
 * Skeleton for alert detail modal
 */
export function AlertDetailSkeleton({ className }: AlertSkeletonProps) {
    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-24 h-6 rounded" />
                        <Skeleton className="w-20 h-6 rounded" />
                        <Skeleton className="w-16 h-6 rounded" />
                    </div>
                    <Skeleton className="w-3/4 h-7" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-28 h-4" />
                    </div>
                </div>
            </div>

            {/* Content Cards */}
            <div className="space-y-6">
                {/* Main Information Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-5 h-5" />
                            <Skeleton className="w-32 h-6" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 4 }, (_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="w-20 h-4" />
                                    <Skeleton className="w-full h-5" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Actions Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-5 h-5" />
                            <Skeleton className="w-40 h-6" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="w-full h-16" />
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 3 }, (_, i) => (
                                <Skeleton key={i} className="w-24 h-8 rounded" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

/**
 * Skeleton for alert filters
 */
export function AlertFiltersSkeleton({ className }: AlertSkeletonProps) {
    return (
        <Card className={cn(className)}>
            <CardContent className="p-4 space-y-4">
                {/* Search Bar */}
                <Skeleton className="w-full h-10" />

                {/* Filter Groups */}
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 8 }, (_, i) => (
                        <Skeleton key={i} className="w-20 h-8 rounded-full" />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Skeleton for alert statistics
 */
export function AlertStatsSkeleton({ className }: AlertSkeletonProps) {
    return (
        <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
            {Array.from({ length: 4 }, (_, i) => (
                <Card key={i}>
                    <CardContent className="p-4 text-center">
                        <Skeleton className="w-8 h-8 mx-auto mb-2" />
                        <Skeleton className="w-12 h-8 mx-auto mb-1" />
                        <Skeleton className="w-16 h-4 mx-auto" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/**
 * Skeleton for pagination
 */
export function AlertPaginationSkeleton({ className }: AlertSkeletonProps) {
    return (
        <div className={cn('flex items-center justify-between', className)}>
            <Skeleton className="w-32 h-4" />
            <div className="flex items-center gap-2">
                {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="w-8 h-8 rounded" />
                ))}
            </div>
            <Skeleton className="w-24 h-4" />
        </div>
    );
}

/**
 * Skeleton for alert dashboard header
 */
export function AlertHeaderSkeleton({ className }: AlertSkeletonProps) {
    return (
        <div className={cn('flex items-center justify-between', className)}>
            <div className="space-y-2">
                <Skeleton className="w-48 h-8" />
                <Skeleton className="w-64 h-4" />
            </div>
            <Skeleton className="w-20 h-6 rounded-full" />
        </div>
    );
}

/**
 * Skeleton for empty state (when no skeletons should show)
 */
export function AlertEmptyStateSkeleton({ className }: AlertSkeletonProps) {
    return (
        <div className={cn('text-center py-12', className)}>
            <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-full" />
            <Skeleton className="w-48 h-6 mx-auto mb-2" />
            <Skeleton className="w-64 h-4 mx-auto" />
        </div>
    );
}

/**
 * Comprehensive skeleton for the entire alerts page
 */
export function AlertPageSkeleton({ className }: AlertSkeletonProps) {
    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <AlertHeaderSkeleton />

            {/* Filters */}
            <AlertFiltersSkeleton />

            {/* Stats */}
            <AlertStatsSkeleton />

            {/* Alert List */}
            <AlertListSkeleton count={6} />

            {/* Pagination */}
            <AlertPaginationSkeleton />
        </div>
    );
}

/**
 * Skeleton variants for different loading states
 */
export const AlertSkeletons = {
    Card: AlertCardSkeleton,
    List: AlertListSkeleton,
    Detail: AlertDetailSkeleton,
    Filters: AlertFiltersSkeleton,
    Stats: AlertStatsSkeleton,
    Pagination: AlertPaginationSkeleton,
    Header: AlertHeaderSkeleton,
    EmptyState: AlertEmptyStateSkeleton,
    Page: AlertPageSkeleton,
};

/**
 * Hook for managing skeleton states
 */
export function useAlertSkeletons() {
    return {
        /**
         * Gets appropriate skeleton based on loading state
         */
        getSkeleton: (
            type: keyof typeof AlertSkeletons,
            isLoading: boolean,
            hasData: boolean
        ) => {
            if (!isLoading) return null;

            if (type === 'EmptyState' && !hasData) {
                return AlertSkeletons.EmptyState;
            }

            return AlertSkeletons[type];
        },

        /**
         * Gets skeleton count based on viewport size
         */
        getSkeletonCount: (viewportHeight: number, itemHeight: number = 120) => {
            return Math.ceil(viewportHeight / itemHeight) + 2; // +2 for buffer
        },
    };
}