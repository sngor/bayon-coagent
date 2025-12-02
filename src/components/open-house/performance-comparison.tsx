'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target, Award } from 'lucide-react';
import { cn } from '@/lib/utils/common';

/**
 * Performance Comparison Component
 * 
 * Displays performance indicators comparing current session to historical averages
 * Validates Requirements: 11.4
 */

interface PerformanceMetric {
    label: string;
    current: number;
    average: number;
    unit?: string;
    format?: 'number' | 'percentage' | 'time';
}

interface PerformanceComparisonProps {
    metrics: PerformanceMetric[];
    className?: string;
}

export function PerformanceComparison({ metrics, className }: PerformanceComparisonProps) {
    const getComparisonStatus = (current: number, average: number): 'above' | 'below' | 'equal' => {
        const threshold = 0.05; // 5% threshold for "equal"
        const difference = (current - average) / average;

        if (Math.abs(difference) < threshold) return 'equal';
        return current > average ? 'above' : 'below';
    };

    const getComparisonIcon = (status: 'above' | 'below' | 'equal') => {
        switch (status) {
            case 'above':
                return <TrendingUp className="h-4 w-4" />;
            case 'below':
                return <TrendingDown className="h-4 w-4" />;
            case 'equal':
                return <Minus className="h-4 w-4" />;
        }
    };

    const getComparisonColor = (status: 'above' | 'below' | 'equal') => {
        switch (status) {
            case 'above':
                return 'text-green-600 bg-green-500/10 border-green-500/20';
            case 'below':
                return 'text-red-600 bg-red-500/10 border-red-500/20';
            case 'equal':
                return 'text-gray-600 bg-gray-500/10 border-gray-500/20';
        }
    };

    const formatValue = (value: number, format?: 'number' | 'percentage' | 'time', unit?: string): string => {
        switch (format) {
            case 'percentage':
                return `${Math.round(value)}%`;
            case 'time':
                const hours = Math.floor(value / 60);
                const minutes = Math.round(value % 60);
                return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            default:
                return unit ? `${value}${unit}` : value.toString();
        }
    };

    const getPercentageDifference = (current: number, average: number): string => {
        if (average === 0) return '—';
        const diff = ((current - average) / average) * 100;
        const sign = diff > 0 ? '+' : '';
        return `${sign}${Math.round(diff)}%`;
    };

    // Check if this is an exceptional performance
    const isExceptional = metrics.some(metric => {
        const status = getComparisonStatus(metric.current, metric.average);
        const diff = Math.abs((metric.current - metric.average) / metric.average);
        return status === 'above' && diff > 0.5; // 50% above average
    });

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Performance Comparison
                        </CardTitle>
                        <CardDescription>
                            Compared to your average open house
                        </CardDescription>
                    </div>
                    {isExceptional && (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                            <Award className="h-3 w-3 mr-1" />
                            Exceptional
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {metrics.map((metric, index) => {
                        const status = getComparisonStatus(metric.current, metric.average);
                        const percentDiff = getPercentageDifference(metric.current, metric.average);

                        return (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{metric.label}</span>
                                    <Badge
                                        variant="outline"
                                        className={cn('text-xs', getComparisonColor(status))}
                                    >
                                        <span className="flex items-center gap-1">
                                            {getComparisonIcon(status)}
                                            {percentDiff}
                                        </span>
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold">
                                                {formatValue(metric.current, metric.format, metric.unit)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                current
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 text-right">
                                        <div className="flex items-baseline justify-end gap-2">
                                            <span className="text-lg text-muted-foreground">
                                                {formatValue(metric.average, metric.format, metric.unit)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                average
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Visual comparison bar */}
                                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            'absolute top-0 left-0 h-full rounded-full transition-all duration-500',
                                            status === 'above' && 'bg-green-500',
                                            status === 'below' && 'bg-red-500',
                                            status === 'equal' && 'bg-gray-500'
                                        )}
                                        style={{
                                            width: `${Math.min((metric.current / (metric.average * 2)) * 100, 100)}%`
                                        }}
                                    />
                                    {/* Average marker */}
                                    <div
                                        className="absolute top-0 h-full w-0.5 bg-foreground/30"
                                        style={{ left: '50%' }}
                                    />
                                </div>

                                {index < metrics.length - 1 && (
                                    <div className="border-b" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Summary message */}
                <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground text-center">
                        {isExceptional ? (
                            <span className="text-yellow-700 font-medium">
                                🎉 This session is performing exceptionally well!
                            </span>
                        ) : (
                            'Performance metrics update in real-time'
                        )}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
