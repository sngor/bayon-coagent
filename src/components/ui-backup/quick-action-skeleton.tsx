import { cn } from '@/lib/utils';

interface QuickActionSkeletonProps {
    className?: string;
}

export function QuickActionSkeleton({ className }: QuickActionSkeletonProps) {
    return (
        <div className={cn("aspect-square rounded-xl border bg-card p-4 animate-pulse", className)}>
            <div className="w-8 h-8 bg-muted rounded-lg mb-3" />
            <div className="space-y-2">
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-3/4" />
            </div>
        </div>
    );
}