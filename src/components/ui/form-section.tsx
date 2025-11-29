'use client';

import { cn } from '@/lib/utils/common';
import { LucideIcon } from 'lucide-react';
import { SectionHeader } from './section-header';

export interface FormSectionProps {
    title?: string;
    description?: string;
    icon?: LucideIcon;
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'card' | 'bordered';
    required?: boolean;
}

export function FormSection({
    title,
    description,
    icon,
    children,
    className,
    variant = 'default',
    required = false
}: FormSectionProps) {
    const variants = {
        default: 'space-y-6',
        card: 'rounded-lg border bg-card p-6 space-y-6',
        bordered: 'border-l-4 border-primary/20 pl-6 space-y-6'
    };

    const hasHeader = title || description;

    return (
        <div className={cn(variants[variant], className)}>
            {hasHeader && (
                <SectionHeader
                    title={title!}
                    description={description}
                    icon={icon}
                    variant="default"
                />
            )}
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}