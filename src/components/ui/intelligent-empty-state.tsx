import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateAction {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    icon?: LucideIcon;
}

interface IntelligentEmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    actions?: EmptyStateAction[];
    className?: string;
    variant?: 'default' | 'minimal' | 'card';
}

export function IntelligentEmptyState({
    icon: Icon,
    title,
    description,
    actions = [],
    className,
    variant = 'default',
}: IntelligentEmptyStateProps) {
    const content = (
        <div className={cn('flex flex-col items-center justify-center text-center', className)}>
            {Icon && (
                <div className="mb-4 rounded-full bg-muted p-4">
                    <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
            )}
            <h3 className="mb-2 text-lg font-semibold">{title}</h3>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">{description}</p>
            {actions.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {actions.map((action, index) => {
                        const ActionIcon = action.icon;
                        return (
                            <Button
                                key={index}
                                variant={action.variant || 'default'}
                                onClick={action.onClick}
                            >
                                {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
                                {action.label}
                            </Button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    if (variant === 'card') {
        return (
            <Card>
                <CardContent className="py-12">{content}</CardContent>
            </Card>
        );
    }

    if (variant === 'minimal') {
        return <div className="py-8">{content}</div>;
    }

    return <div className="py-12">{content}</div>;
}
