'use client';

import { ReactNode } from 'react';
import { FavoritesButton } from '@/components/favorites-button';
import { type FavoriteItem } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils/common';

interface PageHeaderWithPinProps {
    title: string | ReactNode;
    description?: string | ReactNode;
    actions?: ReactNode;
    pageMetadata: Omit<FavoriteItem, 'addedAt'>;
    className?: string;
    showPin?: boolean;
}

/**
 * Standardized page header component with integrated pin button
 * Use this for all pages to ensure consistent pin functionality
 */
export function PageHeaderWithPin({
    title,
    description,
    actions,
    pageMetadata,
    className,
    showPin = true
}: PageHeaderWithPinProps) {
    return (
        <div className={cn("flex items-start justify-between gap-4", className)}>
            <div className="flex-1 space-y-1">
                {typeof title === 'string' ? (
                    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                ) : (
                    title
                )}
                {description && (
                    typeof description === 'string' ? (
                        <p className="text-muted-foreground">{description}</p>
                    ) : (
                        description
                    )
                )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {actions}
                {showPin && (
                    <FavoritesButton
                        item={pageMetadata}
                        variant="outline"
                        size="sm"
                        showText={false}
                    />
                )}
            </div>
        </div>
    );
}
