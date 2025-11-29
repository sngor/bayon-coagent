'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/common';

interface FormSectionProps {
    title: string;
    description?: string;
    children: ReactNode;
    icon?: ReactNode;
    className?: string;
    headerActions?: ReactNode;
}

/**
 * Standardized form section with consistent styling
 */
export function FormSection({
    title,
    description,
    children,
    icon,
    className,
    headerActions,
}: FormSectionProps) {
    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3 flex-1">
                    {icon && (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {icon}
                        </div>
                    )}
                    <div className="flex-1">
                        <CardTitle className="font-headline">{title}</CardTitle>
                        {description && <CardDescription className="mt-1.5">{description}</CardDescription>}
                    </div>
                </div>
                {headerActions && <div className="flex-shrink-0">{headerActions}</div>}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

interface FormSectionGroupProps {
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

/**
 * Group multiple form sections with optional title
 */
export function FormSectionGroup({ title, description, children, className }: FormSectionGroupProps) {
    return (
        <div className={cn('space-y-6', className)}>
            {(title || description) && (
                <div className="space-y-2">
                    {title && <h2 className="text-2xl font-headline font-semibold tracking-tight">{title}</h2>}
                    {description && <p className="text-muted-foreground">{description}</p>}
                    <Separator className="mt-4" />
                </div>
            )}
            <div className="space-y-6">{children}</div>
        </div>
    );
}
