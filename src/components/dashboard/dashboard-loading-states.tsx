import { LoadingState } from '@/components/ui/loading-state';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardLoadingProps {
    variant: 'welcome' | 'metrics' | 'actions' | 'reviews' | 'workflows';
    className?: string;
}

export function DashboardLoadingState({ variant, className }: DashboardLoadingProps) {
    switch (variant) {
        case 'welcome':
            return (
                <Card className={`border-primary/20 shadow-xl ${className}`}>
                    <div className="p-6 md:p-8">
                        <div className="flex items-start gap-6">
                            <Skeleton className="w-16 h-16 rounded-2xl" />
                            <div className="flex-1 space-y-3">
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                                <div className="flex gap-3 pt-3">
                                    <Skeleton className="h-10 w-32" />
                                    <Skeleton className="h-10 w-28" />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            );

        case 'metrics':
            return (
                <div className="grid grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="p-5">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="w-10 h-10 rounded-lg" />
                                    <Skeleton className="w-12 h-5 rounded-full" />
                                </div>
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </Card>
                    ))}
                </div>
            );

        case 'actions':
            return (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="p-6">
                            <div className="flex items-start gap-4">
                                <Skeleton className="w-12 h-12 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            );

        case 'reviews':
            return (
                <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Card key={i} className="p-6">
                            <div className="flex items-start gap-4">
                                <Skeleton className="w-12 h-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            );

        case 'workflows':
            return <LoadingState variant="dashboard" count={2} />;

        default:
            return <LoadingState variant="dashboard" count={3} />;
    }
}