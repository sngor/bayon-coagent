'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/common';

/**
 * SectionContainer - Consistent section wrapper with optional header and footer
 *
 * @example
 * <SectionContainer
 *   title="Recent Activity"
 *   description="Your latest actions"
 *   headerAction={<Button variant="ghost">View All</Button>}
 *   variant="elevated"
 * >
 *   {/* Content */}
 * </SectionContainer >
 *
 * @requirements 8.1
    */
export interface SectionContainerProps {
    title?: string;
    description?: string;
    headerAction?: React.ReactNode;
    footer?: React.ReactNode;
    variant?: 'default' | 'elevated' | 'bordered';
    children: React.ReactNode;
    className?: string;
}

export function SectionContainer({
    title,
    description,
    headerAction,
    footer,
    variant = 'default',
    children,
    className,
}: SectionContainerProps) {
    const variantStyles = {
        default: 'bg-card',
        elevated: 'bg-card shadow-md',
        bordered: 'bg-card border border-border',
    };

    const hasHeader = title || description || headerAction;

    return (
        <div
            className={cn(
                'rounded-lg overflow-hidden',
                variantStyles[variant],
                className
            )}
        >
            {hasHeader && (
                <div className="px-6 py-4 border-b border-border">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            {title && (
                                <h2 className="text-lg font-semibold tracking-tight">
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p className="text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                        {headerAction && (
                            <div className="flex-shrink-0">
                                {headerAction}
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
            {footer && (
                <div className="px-6 py-4 border-t border-border bg-muted/50">
                    {footer}
                </div>
            )}
        </div>
    );
}
