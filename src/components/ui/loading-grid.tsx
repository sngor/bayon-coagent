import { memo } from 'react';

interface LoadingGridProps {
    columns?: 2 | 3 | 4;
    count?: number;
    SkeletonComponent: React.ComponentType;
}

export const LoadingGrid = memo<LoadingGridProps>(({
    columns = 4,
    count = 4,
    SkeletonComponent
}) => {
    const gridClass = `grid gap-4 ${columns === 2 ? 'grid-cols-2' :
            columns === 3 ? 'grid-cols-2 sm:grid-cols-3' :
                'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
        }`;

    return (
        <div className={gridClass}>
            {Array.from({ length: count }, (_, i) => (
                <SkeletonComponent key={i} />
            ))}
        </div>
    );
});

LoadingGrid.displayName = 'LoadingGrid';