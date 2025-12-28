'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/common';

export interface UsageLimit {
    feature: string;
    used: number;
    limit: number;
    period: 'daily' | 'weekly' | 'monthly';
    resetDate?: Date;
}

export interface UsageTrackingProps {
    limits: UsageLimit[];
    className?: string;
}

export function UsageTracking({ limits, className }: UsageTrackingProps) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Usage Tracking</CardTitle>
                <CardDescription>Monitor your feature usage and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {limits.map((limit, index) => {
                    const percentage = (limit.used / limit.limit) * 100;
                    const isNearLimit = percentage >= 80;
                    const isAtLimit = percentage >= 100;

                    return (
                        <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{limit.feature}</span>
                                    {isAtLimit && (
                                        <Badge variant="destructive" className="text-xs">Limit Reached</Badge>
                                    )}
                                    {isNearLimit && !isAtLimit && (
                                        <Badge variant="outline" className="text-xs text-amber-600">Near Limit</Badge>
                                    )}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {limit.used} / {limit.limit}
                                </span>
                            </div>
                            <Progress
                                value={Math.min(percentage, 100)}
                                className={cn(
                                    'h-2',
                                    isAtLimit && '[&>div]:bg-destructive',
                                    isNearLimit && !isAtLimit && '[&>div]:bg-amber-500'
                                )}
                            />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="capitalize">{limit.period} limit</span>
                                {limit.resetDate && (
                                    <span>Resets {limit.resetDate.toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

export interface UsageStatsProps {
    stats: {
        label: string;
        value: number;
        previousValue?: number;
        format?: 'number' | 'percentage';
    }[];
    className?: string;
}

export function UsageStats({ stats, className }: UsageStatsProps) {
    return (
        <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
            {stats.map((stat, index) => {
                const change = stat.previousValue !== undefined
                    ? ((stat.value - stat.previousValue) / stat.previousValue) * 100
                    : null;

                const isPositive = change !== null && change > 0;
                const isNegative = change !== null && change < 0;

                return (
                    <Card key={index}>
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold">
                                        {stat.format === 'percentage' ? `${stat.value}%` : stat.value.toLocaleString()}
                                    </p>
                                    {change !== null && (
                                        <div className={cn(
                                            'flex items-center gap-1 text-xs font-medium',
                                            isPositive && 'text-green-600 dark:text-green-400',
                                            isNegative && 'text-red-600 dark:text-red-400',
                                            !isPositive && !isNegative && 'text-muted-foreground'
                                        )}>
                                            {isPositive && <TrendingUp className="h-3 w-3" />}
                                            {isNegative && <TrendingDown className="h-3 w-3" />}
                                            {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
                                            <span>{Math.abs(change).toFixed(1)}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
