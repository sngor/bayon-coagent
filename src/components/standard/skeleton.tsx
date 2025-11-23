'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export interface StandardSkeletonProps {
    variant: 'card' | 'list' | 'form' | 'content' | 'metric' | 'feature-grid' | 'step-list';
    count?: number;
    className?: string;
}

export function StandardSkeleton({
    variant,
    count = 1,
    className,
}: StandardSkeletonProps) {
    if (variant === 'card') {
        return (
            <div className={cn('grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3', className)}>
                {Array.from({ length: count }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-20 w-full" />
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-4 w-1/4" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        );
    }

    if (variant === 'list') {
        return (
            <div className={cn('space-y-4', className)}>
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'form') {
        return (
            <div className={cn('space-y-6', className)}>
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'metric') {
        return (
            <div className={cn('grid gap-4 grid-cols-1 md:grid-cols-3', className)}>
                {Array.from({ length: count }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center justify-center p-4">
                                <Skeleton className="h-12 w-24 mb-3" />
                                <Skeleton className="h-4 w-28" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (variant === 'feature-grid') {
        return (
            <div className={cn('grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3', className)}>
                {Array.from({ length: count }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <Skeleton className="h-4 w-full mt-2" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (variant === 'step-list') {
        return (
            <div className={cn('space-y-4', className)}>
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                        <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // content variant
    return (
        <div className={cn('space-y-4', className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                </div>
            ))}
        </div>
    );
}
