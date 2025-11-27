/**
 * Loading Skeleton Components for Client Dashboard
 * 
 * Provides loading states for better UX while data is being fetched
 * 
 * Requirements: Performance optimization (Task 26)
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Dashboard header skeleton
 */
export function DashboardHeaderSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
            <Skeleton className="h-10 w-full max-w-xs" />
        </div>
    );
}

/**
 * CMA report skeleton
 */
export function CMAReportSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full max-w-md mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Subject property */}
                <div className="space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-6 w-16" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Price recommendation */}
                <div className="space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-8 w-24" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comparables */}
                <div className="space-y-3">
                    <Skeleton className="h-5 w-48" />
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 border rounded-lg space-y-2">
                                <Skeleton className="h-5 w-full max-w-xs" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart */}
                <div className="space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Property search skeleton
 */
export function PropertySearchSkeleton() {
    return (
        <div className="space-y-6">
            {/* Search filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </CardContent>
            </Card>

            {/* Property grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <PropertyCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

/**
 * Property card skeleton
 */
export function PropertyCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
}

/**
 * Home valuation skeleton
 */
export function HomeValuationSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full max-w-md mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Input form */}
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                    <Skeleton className="h-10 w-full max-w-xs" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Home valuation results skeleton
 */
export function ValuationResultsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Estimated value */}
                <div className="space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-8 w-24" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Confidence level */}
                <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-24" />
                </div>

                {/* Comparables */}
                <div className="space-y-3">
                    <Skeleton className="h-5 w-48" />
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-3 border rounded space-y-2">
                                <Skeleton className="h-4 w-full max-w-xs" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Market trends */}
                <div className="space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Document viewer skeleton
 */
export function DocumentViewerSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded">
                        <Skeleton className="h-10 w-10 rounded" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

/**
 * Analytics skeleton
 */
export function AnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="pt-6 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Chart */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>

            {/* Activity list */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border rounded">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-full max-w-xs" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Generic content skeleton
 */
export function ContentSkeleton({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
            ))}
        </div>
    );
}

/**
 * Generic card skeleton
 */
export function CardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full max-w-md mt-2" />
            </CardHeader>
            <CardContent>
                <ContentSkeleton lines={5} />
            </CardContent>
        </Card>
    );
}
