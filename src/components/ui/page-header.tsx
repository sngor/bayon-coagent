'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    actions?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'hub' | 'compact';
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    actions,
    className,
    variant = 'default'
}: PageHeaderProps) {
    const variants = {
        default: {
            container: 'space-y-4',
            header: 'flex items-start justify-between gap-4',
            content: 'flex items-start gap-4 min-w-0 flex-1',
            iconWrapper: 'flex-shrink-0 mt-1',
            icon: 'h-8 w-8 text-primary',
            textWrapper: 'min-w-0 flex-1',
            title: 'font-headline text-3xl md:text-4xl font-bold text-foreground',
            description: 'mt-2 text-lg text-muted-foreground',
            actions: 'flex-shrink-0'
        },
        hub: {
            container: 'space-y-6',
            header: 'flex items-start justify-between gap-4',
            content: 'flex items-start gap-4 min-w-0 flex-1',
            iconWrapper: 'flex-shrink-0 mt-1',
            icon: 'h-8 w-8 text-primary',
            textWrapper: 'min-w-0 flex-1',
            title: 'font-headline text-3xl md:text-4xl font-bold text-foreground',
            description: 'mt-2 text-lg text-muted-foreground',
            actions: 'flex-shrink-0'
        },
        compact: {
            container: 'space-y-2',
            header: 'flex items-center justify-between gap-4',
            content: 'flex items-center gap-3 min-w-0 flex-1',
            iconWrapper: 'flex-shrink-0',
            icon: 'h-6 w-6 text-primary',
            textWrapper: 'min-w-0 flex-1',
            title: 'font-headline text-xl md:text-2xl font-semibold text-foreground',
            description: 'text-sm text-muted-foreground',
            actions: 'flex-shrink-0'
        }
    };

    const styles = variants[variant];

    return (
        <header className={cn(styles.container, className)}>
            <div className={styles.header}>
                <div className={styles.content}>
                    {Icon && (
                        <div className={styles.iconWrapper} aria-hidden="true">
                            <Icon className={styles.icon} />
                        </div>
                    )}
                    <div className={styles.textWrapper}>
                        <h1 className={styles.title}>
                            {title}
                        </h1>
                        {description && (
                            <p className={styles.description}>
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className={styles.actions} role="group" aria-label="Page actions">
                        {actions}
                    </div>
                )}
            </div>
        </header>
    );
}