'use client';

import { cn } from '@/lib/utils/common';
import { LucideIcon } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export interface CardHeaderStandardProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    actions?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'large' | 'compact';
}

export function CardHeaderStandard({
    title,
    description,
    icon: Icon,
    actions,
    className,
    variant = 'default'
}: CardHeaderStandardProps) {
    const variants = {
        default: {
            header: 'pb-6',
            content: 'flex items-start justify-between gap-4',
            titleSection: 'flex items-start gap-3 min-w-0 flex-1',
            iconWrapper: 'flex-shrink-0 mt-0.5',
            icon: 'h-5 w-5 text-primary',
            textWrapper: 'min-w-0 flex-1',
            title: 'font-headline text-xl font-semibold',
            description: 'mt-1 text-sm text-muted-foreground',
            actions: 'flex-shrink-0'
        },
        large: {
            header: 'pb-8',
            content: 'flex items-start justify-between gap-4',
            titleSection: 'flex items-start gap-4 min-w-0 flex-1',
            iconWrapper: 'flex-shrink-0 mt-1',
            icon: 'h-6 w-6 text-primary',
            textWrapper: 'min-w-0 flex-1',
            title: 'font-headline text-2xl font-bold',
            description: 'mt-2 text-base text-muted-foreground',
            actions: 'flex-shrink-0'
        },
        compact: {
            header: 'pb-4',
            content: 'flex items-center justify-between gap-4',
            titleSection: 'flex items-center gap-2 min-w-0 flex-1',
            iconWrapper: 'flex-shrink-0',
            icon: 'h-4 w-4 text-primary',
            textWrapper: 'min-w-0 flex-1',
            title: 'font-headline text-lg font-medium',
            description: 'text-xs text-muted-foreground',
            actions: 'flex-shrink-0'
        }
    };

    const styles = variants[variant];

    return (
        <CardHeader className={cn(styles.header, className)}>
            <div className={styles.content}>
                <div className={styles.titleSection}>
                    {Icon && (
                        <div className={styles.iconWrapper} aria-hidden="true">
                            <Icon className={styles.icon} />
                        </div>
                    )}
                    <div className={styles.textWrapper}>
                        <CardTitle className={styles.title}>
                            {title}
                        </CardTitle>
                        {description && (
                            <CardDescription className={styles.description}>
                                {description}
                            </CardDescription>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className={styles.actions}>
                        {actions}
                    </div>
                )}
            </div>
        </CardHeader>
    );
}