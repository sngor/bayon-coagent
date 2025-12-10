'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetricTrend } from '@/lib/types/billing-types';

interface BillingMetricCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    loading?: boolean;
    trend?: MetricTrend;
    className?: string;
    variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function BillingMetricCard({
    title,
    value,
    subtitle,
    icon,
    loading = false,
    trend,
    className,
    variant = 'default'
}: BillingMetricCardProps) {
    const cardVariants = {
        default: '',
        success: 'border-green-200 bg-green-50/50',
        warning: 'border-yellow-200 bg-yellow-50/50',
        danger: 'border-red-200 bg-red-50/50',
    };

    return (
        <Card className={cn(cardVariants[variant], className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {loading ? (
                        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                    ) : (
                        <span className={cn(
                            variant === 'success' && 'text-green-700',
                            variant === 'warning' && 'text-yellow-700',
                            variant === 'danger' && 'text-red-700'
                        )}>
                            {value}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                        {subtitle}
                    </p>
                    {trend && !loading && (
                        <div className={cn(
                            'flex items-center gap-1 text-xs font-medium',
                            trend.isPositive ? 'text-green-600' : 'text-red-600'
                        )}>
                            {trend.isPositive ? (
                                <TrendingUp className="h-3 w-3" />
                            ) : (
                                <TrendingDown className="h-3 w-3" />
                            )}
                            <span>
                                {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}