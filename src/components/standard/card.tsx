'use client';

import { cn } from '@/lib/utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export interface StandardCardProps {
    title?: React.ReactNode;
    description?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    variant?: 'default' | 'interactive' | 'elevated' | 'flat';
    padding?: 'default' | 'compact' | 'spacious';
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    footerClassName?: string;
}

const variantClasses = {
    default: '',
    interactive: 'card-interactive cursor-pointer',
    elevated: 'shadow-lg',
    flat: 'border-0 shadow-none',
};

const paddingClasses = {
    compact: 'p-4',
    default: 'p-6',
    spacious: 'p-8',
};

export function StandardCard({
    title,
    description,
    children,
    actions,
    variant = 'default',
    padding = 'default',
    className,
    headerClassName,
    contentClassName,
    footerClassName,
}: StandardCardProps) {
    const hasHeader = title || description || actions;
    const hasFooter = actions && !title && !description;

    return (
        <Card className={cn(variantClasses[variant], className)}>
            {hasHeader && (
                <CardHeader className={cn(
                    'flex flex-row items-start justify-between gap-4',
                    paddingClasses[padding],
                    headerClassName
                )}>
                    <div className="flex-1 min-w-0">
                        {title && (
                            <CardTitle className="text-heading-2">
                                {title}
                            </CardTitle>
                        )}
                        {description && (
                            <CardDescription className="mt-2 text-base">
                                {description}
                            </CardDescription>
                        )}
                    </div>
                    {actions && (
                        <div className="flex-shrink-0 flex items-center gap-2">
                            {actions}
                        </div>
                    )}
                </CardHeader>
            )}

            <CardContent className={cn(
                paddingClasses[padding],
                hasHeader && 'pt-0',
                contentClassName
            )}>
                {children}
            </CardContent>

            {hasFooter && (
                <CardFooter className={cn(
                    paddingClasses[padding],
                    'pt-0',
                    footerClassName
                )}>
                    {actions}
                </CardFooter>
            )}
        </Card>
    );
}
