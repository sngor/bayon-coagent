'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';

// Page Header Skeleton
export function PageHeaderSkeleton() {
    return (
        <div className="space-y-4 mb-8">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
        </div>
    );
}

// Form Skeleton
export function FormSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
    );
}

// Card List Skeleton
export function CardListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(count)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-4 w-1/4" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

// Table Skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-4">
            {/* Table Header */}
            <div className="flex space-x-4 pb-2 border-b">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
            </div>
            {/* Table Rows */}
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex space-x-4 py-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                </div>
            ))}
        </div>
    );
}

// Content Skeleton (for articles, reports, etc.)
export function ContentSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="space-y-2 pt-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
    );
}

// Dashboard Stats Skeleton
export function StatsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(count)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-4 rounded" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-1" />
                        <Skeleton className="h-3 w-20" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// Navigation Skeleton
export function NavigationSkeleton() {
    return (
        <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-4 w-24" />
                </div>
            ))}
        </div>
    );
}

// Chat Message Skeleton
export function ChatMessageSkeleton() {
    return (
        <div className="space-y-4">
            {/* User message */}
            <div className="flex justify-end">
                <div className="max-w-xs space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
            {/* AI response */}
            <div className="flex justify-start">
                <div className="max-w-md space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
        </div>
    );
}

// Profile Skeleton
export function ProfileSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Hub Layout Skeleton
export function HubLayoutSkeleton() {
    return (
        <div className="space-y-6">
            {/* Hub Header */}
            <div className="space-y-4">
                <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <Skeleton className="h-4 w-96" />
            </div>

            {/* Hub Tabs */}
            <div className="flex space-x-6 border-b">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-20" />
                ))}
            </div>

            {/* Content Area */}
            <div className="space-y-6">
                <FormSkeleton />
                <CardListSkeleton />
            </div>
        </div>
    );
}

// Research Report Skeleton
export function ResearchReportSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>

            <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>

            <div className="space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>
        </div>
    );
}

// Image Gallery Skeleton
export function ImageGallerySkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="aspect-video w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            ))}
        </div>
    );
}