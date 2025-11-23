'use client';

import { cn } from '@/lib/utils';

export interface DataGridProps {
    children: React.ReactNode;
    className?: string;
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
    gap?: 'default' | 'compact' | 'spacious';
    responsive?: boolean;
}

export function DataGrid({
    children,
    className,
    columns = 3,
    gap = 'default',
    responsive = true
}: DataGridProps) {
    const columnClasses = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
        6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
    };

    const nonResponsiveColumns = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6'
    };

    const gapClasses = {
        compact: 'gap-3',
        default: 'gap-4 md:gap-6',
        spacious: 'gap-6 md:gap-8'
    };

    return (
        <div className={cn(
            'grid',
            responsive ? columnClasses[columns] : nonResponsiveColumns[columns],
            gapClasses[gap],
            className
        )}>
            {children}
        </div>
    );
}