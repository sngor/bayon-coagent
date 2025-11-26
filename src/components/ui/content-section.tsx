'use client';

import { cn } from '@/lib/utils';
import { SectionHeader, SectionHeaderProps } from './section-header';

export interface ContentSectionProps {
    title?: string;
    description?: string;
    icon?: SectionHeaderProps['icon'];
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    variant?: 'default' | 'card' | 'bordered' | 'minimal';
    spacing?: 'default' | 'compact' | 'spacious';
    headerVariant?: SectionHeaderProps['variant'];
}

export function ContentSection({
    title,
    description,
    icon,
    actions,
    children,
    className,
    headerClassName,
    contentClassName,
    variant = 'default',
    spacing = 'default',
    headerVariant = 'default'
}: ContentSectionProps) {
    const hasHeader = title || description || actions;

    const variants = {
        default: 'space-y-6',
        card: 'rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-6',
        bordered: 'border-l-4 border-primary/20 pl-6 space-y-6',
        minimal: 'space-y-4'
    };

    const spacingClasses = {
        compact: hasHeader ? 'space-y-4' : '',
        default: hasHeader ? 'space-y-6' : '',
        spacious: hasHeader ? 'space-y-8' : ''
    };

    const contentSpacing = {
        compact: 'space-y-3',
        default: 'space-y-4',
        spacious: 'space-y-6'
    };

    return (
        <section className={cn(
            variants[variant],
            spacingClasses[spacing],
            className
        )}>
            {hasHeader && (
                <SectionHeader
                    title={title!}
                    description={description}
                    icon={icon}
                    actions={actions}
                    variant={headerVariant}
                    className={headerClassName}
                />
            )}
            <div className={cn(
                contentSpacing[spacing],
                contentClassName
            )}>
                {children}
            </div>
        </section>
    );
}