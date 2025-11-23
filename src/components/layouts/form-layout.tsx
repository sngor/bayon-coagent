'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ActionBar } from '@/components/ui/action-bar';

export interface FormLayoutProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'card' | 'minimal';
    spacing?: 'default' | 'compact' | 'spacious';
}

export function FormLayout({
    title,
    description,
    children,
    actions,
    className,
    variant = 'card',
    spacing = 'default'
}: FormLayoutProps) {
    const spacingClasses = {
        compact: 'space-y-4',
        default: 'space-y-6',
        spacious: 'space-y-8'
    };

    if (variant === 'minimal') {
        return (
            <div className={cn(spacingClasses[spacing], className)}>
                {children}
                {actions && (
                    <ActionBar className="pt-4 border-t">
                        {actions}
                    </ActionBar>
                )}
            </div>
        );
    }

    if (variant === 'default') {
        return (
            <div className={cn(spacingClasses[spacing], className)}>
                {(title || description) && (
                    <div className="space-y-2">
                        {title && (
                            <h2 className="text-2xl font-semibold font-headline">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                )}
                <div className={spacingClasses[spacing]}>
                    {children}
                </div>
                {actions && (
                    <ActionBar className="pt-6 border-t">
                        {actions}
                    </ActionBar>
                )}
            </div>
        );
    }

    // Card variant (default)
    return (
        <Card className={className}>
            {(title || description) && (
                <CardHeader>
                    {title && <CardTitle className="font-headline">{title}</CardTitle>}
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
            )}
            <CardContent className={cn('space-y-6', spacingClasses[spacing])}>
                {children}
            </CardContent>
            {actions && (
                <CardFooter className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        <span className="text-destructive">*</span> Required fields
                    </div>
                    <ActionBar>
                        {actions}
                    </ActionBar>
                </CardFooter>
            )}
        </Card>
    );
}