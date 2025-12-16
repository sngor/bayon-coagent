import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProgressHeroSkeleton() {
    return (
        <Card className="relative overflow-hidden">
            <CardHeader className="relative">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-xl" />
                            <div>
                                <Skeleton className="h-6 w-48 mb-2" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                        </div>
                    </div>
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>
            </CardHeader>
            <CardContent className="relative space-y-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-12" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-full rounded-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-xl border">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div>
                                <Skeleton className="h-3 w-16 mb-1" />
                                <Skeleton className="h-5 w-8" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function ModuleAccordionSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border rounded-xl">
                    <div className="px-6 py-5">
                        <div className="flex items-center gap-4 w-full">
                            <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

export function LearningPageSkeleton() {
    return (
        <div className="space-y-6">
            <ProgressHeroSkeleton />

            <div className="space-y-8">
                {/* Tabs skeleton */}
                <div className="flex space-x-1 rounded-lg bg-muted p-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-24 rounded-md" />
                    ))}
                </div>

                {/* Content skeleton */}
                <Card>
                    <CardHeader className="space-y-6">
                        <div className="flex items-start gap-4">
                            <Skeleton className="h-16 w-16 rounded-2xl" />
                            <div className="flex-1">
                                <Skeleton className="h-8 w-64 mb-2" />
                                <Skeleton className="h-4 w-96" />
                            </div>
                        </div>

                        <div className="p-6 rounded-xl border">
                            <div className="flex items-center justify-between mb-3">
                                <Skeleton className="h-4 w-32" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-6 w-12" />
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                            </div>
                            <Skeleton className="h-3 w-full rounded-full mb-3" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <ModuleAccordionSkeleton />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}