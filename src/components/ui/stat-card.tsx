'use client';

import { cn } from '@/lib/utils/common';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from './card';
import { CardGradientMesh } from './gradient-mesh';

export interface StatCardProps {
    title: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: {
        value: number;
        label?: string;
        direction?: 'up' | 'down' | 'neutral';
    };
    description?: string;
    className?: string;
    variant?: 'default' | 'compact' | 'detailed';
    format?: 'number' | 'currency' | 'percentage';
}

export function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    description,
    className,
    variant = 'default',
    format = 'number'
}: StatCardProps) {
    const formatValue = (val: string | number) => {
        if (typeof val === 'string') return val;

        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(val);
            case 'percentage':
                return `${val}%`;
            default:
                return new Intl.NumberFormat('en-US').format(val);
        }
    };

    const getTrendColor = (direction?: 'up' | 'down' | 'neutral') => {
        switch (direction) {
            case 'up':
                return 'text-success';
            case 'down':
                return 'text-destructive';
            default:
                return 'text-muted-foreground';
        }
    };

    const getTrendIcon = (direction?: 'up' | 'down' | 'neutral') => {
        switch (direction) {
            case 'up':
                return TrendingUp;
            case 'down':
                return TrendingDown;
            default:
                return null;
        }
    };

    const variants = {
        default: {
            container: 'p-6',
            header: 'flex items-center justify-between mb-4',
            title: 'text-sm font-medium text-muted-foreground',
            value: 'text-2xl md:text-3xl font-bold font-headline',
            trend: 'flex items-center gap-1 text-sm',
            description: 'text-xs text-muted-foreground mt-2'
        },
        compact: {
            container: 'p-4',
            header: 'flex items-center justify-between mb-2',
            title: 'text-xs font-medium text-muted-foreground',
            value: 'text-lg md:text-xl font-semibold font-headline',
            trend: 'flex items-center gap-1 text-xs',
            description: 'text-xs text-muted-foreground mt-1'
        },
        detailed: {
            container: 'p-6',
            header: 'flex items-center justify-between mb-6',
            title: 'text-base font-medium text-muted-foreground',
            value: 'text-3xl md:text-4xl font-bold font-headline',
            trend: 'flex items-center gap-2 text-sm',
            description: 'text-sm text-muted-foreground mt-3'
        }
    };

    const styles = variants[variant];
    const TrendIcon = getTrendIcon(trend?.direction);

    return (
        <Card className={cn('transition-all duration-200 hover:shadow-md overflow-hidden bg-background/50 border-primary/20', className)}>
            <CardGradientMesh>
                <CardContent className={cn(styles.container, "relative z-10")}>
                    <div className={styles.header}>
                        <h3 className={styles.title}>{title}</h3>
                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    </div>

                    <div className="space-y-2">
                        <div className={styles.value}>
                            {formatValue(value)}
                        </div>

                        {trend && (
                            <div className={cn(styles.trend, getTrendColor(trend.direction))}>
                                {TrendIcon && <TrendIcon className="h-3 w-3" />}
                                <span className="font-medium">
                                    {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                                    {Math.abs(trend.value)}%
                                </span>
                                {trend.label && (
                                    <span className="text-muted-foreground">
                                        {trend.label}
                                    </span>
                                )}
                            </div>
                        )}

                        {description && (
                            <p className={styles.description}>
                                {description}
                            </p>
                        )}
                    </div>
                </CardContent>
            </CardGradientMesh>
        </Card>
    );
}