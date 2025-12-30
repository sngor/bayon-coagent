'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/common';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

/**
 * PageHeader - Standardized page header with title, description, icon, and actions
 *
 * @example
 * <PageHeader
 *   title="Content Studio"
 *   description="Create AI-powered content"
 *   icon={Wand2}
 *   actions={<Button>New Content</Button>}
 *   variant="hub"
 * />
 *
 * @requirements 8.2
 */
export interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    variant?: 'default' | 'hub' | 'compact';
    breadcrumbs?: Array<{ label: string; href?: string }>;
    className?: string;
}

export function PageHeader({
    title,
    description,
    actions,
    variant = 'default',
    breadcrumbs,
    className,
}: PageHeaderProps) {
    const variantStyles = {
        default: {
            container: 'space-y-4',
            header: 'space-y-2',
            title: 'text-3xl font-bold tracking-tight',
            description: 'text-base text-muted-foreground',
        },
        hub: {
            container: 'space-y-6 pb-6 border-b',
            header: 'space-y-3',
            title: 'text-4xl font-bold tracking-tight',
            description: 'text-lg text-muted-foreground',
        },
        compact: {
            container: 'space-y-2',
            header: 'space-y-1',
            title: 'text-2xl font-semibold tracking-tight',
            description: 'text-sm text-muted-foreground',
        },
    };

    const styles = variantStyles[variant];

    return (
        <div className={cn(styles.container, className)}>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumbs items={breadcrumbs} />
            )}
            <div className="flex items-start justify-between gap-4">
                <div className={styles.header}>
                    <h1 className={styles.title}>{title}</h1>
                    {description && (
                        <p className={styles.description}>{description}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
