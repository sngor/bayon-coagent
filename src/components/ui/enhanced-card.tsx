'use client';

import React from 'react';
import { cn } from '@/lib/utils/common';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface EnhancedCardProps {
    title?: string;
    description?: string;
    icon?: React.ElementType;
    badge?: string | number;
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'elevated' | 'interactive' | 'feature' | 'metric' | 'ai';
    size?: 'sm' | 'md' | 'lg';
    gradient?: boolean;
    onClick?: () => void;
}

export function EnhancedCard({
    title,
    description,
    icon: Icon,
    badge,
    badgeVariant = 'secondary',
    actions,
    children,
    className,
    variant = 'default',
    size = 'md',
    gradient = false,
    onClick,
}: EnhancedCardProps) {
    const isInteractive = onClick || variant === 'interactive';

    const cardVariants = {
        default: 'border bg-card text-card-foreground shadow-sm',
        elevated: 'border bg-card text-card-foreground shadow-md hover:shadow-lg transition-shadow',
        interactive: 'border bg-card text-card-foreground shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer',
        feature: 'border-2 bg-gradient-to-br from-card via-card to-muted/30 text-card-foreground shadow-lg hover:shadow-xl transition-all duration-300',
        metric: 'border bg-gradient-to-br from-primary/5 via-card to-purple-500/5 text-card-foreground shadow-md',
        ai: 'border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-purple-500/5 text-card-foreground shadow-lg hover:shadow-xl hover:border-primary/30 transition-all duration-300'
    };

    const sizeVariants = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    return (
        <Card
            className={cn(
                'relative overflow-hidden rounded-2xl',
                cardVariants[variant],
                isInteractive && 'hover:scale-[1.02] transition-transform duration-300',
                gradient && 'bg-gradient-to-br from-card via-card to-muted/20',
                className
            )}
            onClick={onClick}
        >
            {/* Background effects for enhanced variants */}
            {(variant === 'feature' || variant === 'ai') && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-3xl opacity-50" />
            )}

            {/* Header */}
            {(title || description || Icon || badge || actions) && (
                <CardHeader className={cn('relative z-10', sizeVariants[size], 'pb-4')}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            {Icon && (
                                <div className={cn(
                                    'flex-shrink-0 rounded-xl flex items-center justify-center',
                                    variant === 'ai' ? 'w-12 h-12 bg-gradient-to-br from-primary to-purple-600' : 'w-10 h-10 bg-primary/10',
                                    variant === 'metric' && 'bg-gradient-to-br from-primary/20 to-purple-600/20'
                                )}>
                                    <Icon className={cn(
                                        variant === 'ai' ? 'w-6 h-6 text-white' : 'w-5 h-5 text-primary'
                                    )} />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                {title && (
                                    <div className="flex items-center gap-2 mb-1">
                                        <CardTitle className={cn(
                                            'font-headline',
                                            size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-lg'
                                        )}>
                                            {title}
                                        </CardTitle>
                                        {badge && (
                                            <Badge variant={badgeVariant} className="text-xs">
                                                {badge}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                                {description && (
                                    <CardDescription className={cn(
                                        size === 'lg' ? 'text-base' : 'text-sm'
                                    )}>
                                        {description}
                                    </CardDescription>
                                )}
                            </div>
                        </div>
                        {actions && (
                            <div className="flex-shrink-0">
                                {actions}
                            </div>
                        )}
                    </div>
                </CardHeader>
            )}

            {/* Content */}
            <CardContent className={cn(
                'relative z-10',
                sizeVariants[size],
                (title || description || Icon || badge || actions) ? 'pt-0' : ''
            )}>
                {children}
            </CardContent>
        </Card>
    );
}

// Specialized card variants for common use cases
export function MetricCard({
    title,
    value,
    change,
    changeType = 'neutral',
    icon: Icon,
    className,
    ...props
}: {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon?: React.ElementType;
    className?: string;
} & Omit<EnhancedCardProps, 'title' | 'children' | 'variant'>) {
    const changeColors = {
        positive: 'text-green-600 dark:text-green-400',
        negative: 'text-red-600 dark:text-red-400',
        neutral: 'text-muted-foreground'
    };

    return (
        <EnhancedCard
            title={title}
            icon={Icon}
            variant="metric"
            className={className}
            {...props}
        >
            <div className="space-y-2">
                <div className="text-3xl font-bold font-headline">
                    {value}
                </div>
                {change && (
                    <div className={cn('text-sm font-medium', changeColors[changeType])}>
                        {change}
                    </div>
                )}
            </div>
        </EnhancedCard>
    );
}

export function FeatureCard({
    title,
    description,
    icon: Icon,
    href,
    onClick,
    className,
    children,
    ...props
}: {
    title: string;
    description?: string;
    icon?: React.ElementType;
    href?: string;
    onClick?: () => void;
    className?: string;
    children?: React.ReactNode;
} & Omit<EnhancedCardProps, 'title' | 'description' | 'icon' | 'children' | 'variant' | 'onClick'>) {
    return (
        <EnhancedCard
            title={title}
            description={description}
            icon={Icon}
            variant="feature"
            onClick={onClick}
            className={className}
            {...props}
        >
            {children}
            {href && (
                <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                        Get Started
                    </Button>
                </div>
            )}
        </EnhancedCard>
    );
}

export function AICard({
    title,
    description,
    icon: Icon,
    processing = false,
    className,
    children,
    ...props
}: {
    title: string;
    description?: string;
    icon?: React.ElementType;
    processing?: boolean;
    className?: string;
    children: React.ReactNode;
} & Omit<EnhancedCardProps, 'title' | 'description' | 'icon' | 'children' | 'variant'>) {
    return (
        <EnhancedCard
            title={title}
            description={description}
            icon={Icon}
            variant="ai"
            badge={processing ? "Processing..." : "AI Powered"}
            badgeVariant={processing ? "default" : "secondary"}
            className={cn(
                processing && "animate-pulse",
                className
            )}
            {...props}
        >
            {children}
        </EnhancedCard>
    );
}