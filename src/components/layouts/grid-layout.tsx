'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/common';

/**
 * GridLayout - Responsive grid layout with consistent spacing
 *
 * @example
 * <GridLayout columns={3} gap="lg">
 *   <Card>...</Card>
 *   <Card>...</Card>
 *   <Card>...</Card>
 * </GridLayout>
 *
 * @requirements 8.1
 */
export interface GridLayoutProps {
    columns?: 1 | 2 | 3 | 4;
    gap?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    className?: string;
}

export function GridLayout({
    columns = 3,
    gap = 'md',
    children,
    className,
}: GridLayoutProps) {
    // Responsive column classes with mobile-first approach
    const columnClasses = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    };

    const gapClasses = {
        sm: 'gap-4',
        md: 'gap-6',
        lg: 'gap-8',
    };

    return (
        <div
            className={cn(
                'grid',
                columnClasses[columns],
                gapClasses[gap],
                className
            )}
        >
            {children}
        </div>
    );
}
