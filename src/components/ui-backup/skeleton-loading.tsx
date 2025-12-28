'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils/common';

/**
 * Skeleton loading states for content workflow components
 * Following React best practices for Suspense boundaries
 */

export function ContentCalendarSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("space-y-6", className)} role="status" aria-label="Loading calendar">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-9 w-9" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>

            {/* Calendar grid skeleton */}
            <div className="border rounded-lg overflow-hidden">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-b bg-muted/30">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="p-4 text-center">
                            <Skeleton className="h-4 w-8 mx-auto" />
                        </div>
                    ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7">
                    {Array.from({ length: 35 }).map((_, i) => (
                        <div key={i} className="min-h-[120px] p-2 border border-border/50">
                            <div className="flex items-center justify-between mb-2">
                                <Skeleton className="h-4 w-6" />
                                {i % 3 === 0 && <Skeleton className="h-5 w-5 rounded-full" />}
                            </div>
                            {i % 4 === 0 && (
                                <div className="space-y-1">
                                    <Skeleton className="h-12 w-full rounded-md" />
                                    {i % 8 === 0 && <Skeleton className="h-8 w-full rounded-md" />}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <span className="sr-only">Loading calendar content...</span>
        </div>
    );
}

export function SchedulingModalSkeleton() {
    return (
        <div className="space-y-6" role="status" aria-label="Loading scheduling options">
            {/* Step indicator skeleton */}
            <div className="flex items-center justify-center space-x-4 mb-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <React.Fragment key={i}>
                        <div className="flex items-center space-x-2">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <div className="hidden sm:block">
                                <Skeleton className="h-4 w-16 mb-1" />
                            </div>
                        </div>
                        {i < 2 && <Skeleton className="h-4 w-4" />}
                    </React.Fragment>
                ))}
            </div>

            {/* Content skeleton */}
            <div className="space-y-4">
                <div className="text-center space-y-2">
                    <Skeleton className="h-6 w-48 mx-auto" />
                    <Skeleton className="h-4 w-64 mx-auto" />
                </div>

                <div className="grid gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Skeleton className="w-10 h-10 rounded-lg" />
                                        <div>
                                            <Skeleton className="h-4 w-32 mb-1" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-4" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
            <span className="sr-only">Loading scheduling configuration...</span>
        </div>
    );
}

export function AnalyticsDashboardSkeleton() {
    return (
        <div className="space-y-6" role="status" aria-label="Loading analytics dashboard">
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            {/* Metric cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>

            {/* Additional content skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                    <div>
                                        <Skeleton className="h-4 w-32 mb-1" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Skeleton className="h-4 w-16 mb-1" />
                                    <Skeleton className="h-3 w-12" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <span className="sr-only">Loading analytics data...</span>
        </div>
    );
}

export function TemplateLibrarySkeleton() {
    return (
        <div className="space-y-6" role="status" aria-label="Loading template library">
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            {/* Filter tabs skeleton */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-20" />
                ))}
            </div>

            {/* Template grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="group">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <Skeleton className="h-5 w-32 mb-2" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-8 w-8 rounded-md" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-16 w-full mb-4" />
                            <div className="flex items-center justify-between">
                                <div className="flex gap-1">
                                    <Skeleton className="h-5 w-12 rounded-full" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                                <Skeleton className="h-8 w-20" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <span className="sr-only">Loading template library...</span>
        </div>
    );
}

export function ContentListSkeleton() {
    return (
        <div className="space-y-4" role="status" aria-label="Loading content list">
            {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Skeleton className="w-12 h-12 rounded-lg" />
                                <div className="flex-1">
                                    <Skeleton className="h-5 w-48 mb-2" />
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-12" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-16 rounded-full" />
                                <Skeleton className="h-8 w-8" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            <span className="sr-only">Loading content items...</span>
        </div>
    );
}