'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/common';
import { LucideIcon } from 'lucide-react';
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
    icon?: LucideIcon;
    actions?: React.ReactNode;
    variant?: 'default' | 'hub' | 'compact';
    breadcrumbs?: Array<{ label: string; href?: string }>;
    className?: string;
}

export function PageHeader({
    title,
    description,
    icon: Icon,
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
            iconSize: 'h-8 w-8',
        },
        hub: {
            container: 'space-y-6 pb-6 border-b',
            header: 'space-y-3',
            title: 'text-4xl font-bold tracking-tight',
            description: 'text-lg text-muted-foreground',
            iconSize: 'h-10 w-10',
        },
        compact: {
            container: 'space-y-2',
            header: 'space-y-1',
            title: 'text-2xl font-semibold tracking-tight',
            description: 'text-sm text-muted-foreground',
            iconSize: 'h-6 w-6',
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
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
                                <Icon className={cn(styles.iconSize, 'text-primary')} />
                            </div>
                        )}
                        <h1 className={styles.title}>{title}</h1>
                    </div>
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
