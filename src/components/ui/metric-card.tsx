'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils/common';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Sparkline } from '@/components/ui/sparkline';

export interface MetricCardProps {
    value: number;
    label: string;
    icon?: React.ReactNode;
    decimals?: number;
    format?: 'number' | 'currency' | 'percentage';
    prefix?: string;
    suffix?: string;
    changePercent?: number;
    trendData?: number[];
    showSparkline?: boolean;
    showTrend?: boolean;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    className?: string;
}

export function MetricCard({
    value,
    label,
    icon,
    decimals = 0,
    format = 'number',
    prefix,
    suffix,
    changePercent,
    trendData,
    showSparkline = false,
    showTrend = false,
    variant = 'default',
    className,
}: MetricCardProps) {
    const isPositive = changePercent !== undefined && changePercent > 0;
    const isNegative = changePercent !== undefined && changePercent < 0;

    const variantClasses = {
        default: 'from-background to-background',
        primary: 'from-primary/5 to-background',
        success: 'from-green-500/5 to-background',
        warning: 'from-yellow-500/5 to-background',
        danger: 'from-red-500/5 to-background',
    };

    return (
        <Card className={cn('bg-gradient-to-br', variantClasses[variant], className)}>
            <CardContent className="p-4 md:p-6">
                <div className="space-y-2">
                    {/* Label and Icon */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs md:text-sm font-medium text-muted-foreground">{label}</p>
                        {icon && <div className="text-muted-foreground">{icon}</div>}
                    </div>

                    {/* Value */}
                    <div className="flex items-baseline gap-2">
                        <div className="text-xl md:text-2xl font-bold">
                            {prefix}
                            <AnimatedNumber
                                value={value}
                                decimals={decimals}
                                format={format}
                            />
                            {suffix}
                        </div>
                        {showTrend && changePercent !== undefined && (
                            <div
                                className={cn(
                                    'flex items-center gap-1 text-xs font-medium',
                                    isPositive && 'text-green-600 dark:text-green-400',
                                    isNegative && 'text-red-600 dark:text-red-400'
                                )}
                            >
                                {isPositive && <ArrowUp className="h-3 w-3" />}
                                {isNegative && <ArrowDown className="h-3 w-3" />}
                                <span>
                                    {isPositive && '+'}
                                    {changePercent.toFixed(1)}%
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Sparkline */}
                    {showSparkline && trendData && trendData.length > 0 && (
                        <div className="pt-2">
                            <Sparkline
                                data={trendData}
                                width={120}
                                height={30}
                                color={
                                    variant === 'success'
                                        ? 'rgb(34, 197, 94)'
                                        : variant === 'danger'
                                            ? 'rgb(239, 68, 68)'
                                            : 'rgb(59, 130, 246)'
                                }
                                showFill={true}
                                strokeWidth={2}
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
