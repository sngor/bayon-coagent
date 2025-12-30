'use client';

import { cn } from '@/lib/utils/common';

export interface SectionHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'compact' | 'minimal';
}

export function SectionHeader({
    title,
    description,
    actions,
    className,
    variant = 'default'
}: SectionHeaderProps) {
    const variants = {
        default: {
            container: 'space-y-3',
            header: 'flex items-start justify-between gap-4',
            content: 'flex items-start gap-3 min-w-0 flex-1',
            textWrapper: 'min-w-0 flex-1',
            title: 'font-headline text-lg md:text-xl font-semibold text-foreground',
            description: 'mt-1 text-sm md:text-base text-muted-foreground',
            actions: 'flex-shrink-0'
        },
        compact: {
            container: 'space-y-2',
            header: 'flex items-center justify-between gap-4',
            content: 'flex items-center gap-2 min-w-0 flex-1',
            textWrapper: 'min-w-0 flex-1',
            title: 'font-headline text-base font-medium text-foreground',
            description: 'text-xs text-muted-foreground',
            actions: 'flex-shrink-0'
        },
        minimal: {
            container: 'space-y-1',
            header: 'flex items-center justify-between gap-4',
            content: 'flex items-center gap-2 min-w-0 flex-1',
            textWrapper: 'min-w-0 flex-1',
            title: 'text-sm font-medium text-muted-foreground uppercase tracking-wide',
            description: 'text-xs text-muted-foreground',
            actions: 'flex-shrink-0'
        }
    };

    const styles = variants[variant];

    return (
        <div className={cn(styles.container, className)}>
            <div className={styles.header}>
                <div className={styles.content}>
                    <div className={styles.textWrapper}>
                        <h2 className={styles.title}>
                            {title}
                        </h2>
                        {description && (
                            <p className={styles.description}>
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className={styles.actions}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}