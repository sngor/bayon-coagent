'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-muted',
                className
            )}
            {...props}
        />
    );
}

interface ProfileSkeletonProps {
    className?: string;
}

export function ProfileSkeleton({ className }: ProfileSkeletonProps) {
    return (
        <div className={cn('space-y-8', className)}>
            {/* Header skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* Form sections skeleton */}
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>

                    {/* Professional Details */}
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-40" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>

                    {/* Bio section */}
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-10 w-32" />
                    </div>

                    {/* Social Media */}
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-28" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-14" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-18" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                    </div>

                    <div className="space-y-4">
                        <Skeleton className="h-6 w-28" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-20" />
            </div>
        </div>
    );
}

interface TestimonialSkeletonProps {
    className?: string;
}

export function TestimonialSkeleton({ className }: TestimonialSkeletonProps) {
    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* Testimonial cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                        </div>
                        <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, j) => (
                                <Skeleton key={j} className="h-4 w-4" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}