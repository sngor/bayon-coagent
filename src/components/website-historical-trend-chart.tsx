'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { WebsiteAnalysisResult } from '@/ai/schemas/website-analysis-schemas';
import { cn } from '@/lib/utils/common';

interface WebsiteHistoricalTrendChartProps {
    history: WebsiteAnalysisResult[];
}

/**
 * Historical Trend Chart Component
 * 
 * Displays a line chart showing website optimization score over time.
 * Shows the last 5 analyses with trend indicators.
 * 
 * Requirements: 7.3, 7.4
 */
export function WebsiteHistoricalTrendChart({ history }: WebsiteHistoricalTrendChartProps) {
    // Calculate trend and prepare chart data
    const { chartData, trend, latestScore, oldestScore, change, changePercent } = useMemo(() => {
        if (history.length === 0) {
            return {
                chartData: [],
                trend: 'stable' as const,
                latestScore: 0,
                oldestScore: 0,
                change: 0,
                changePercent: '0',
            };
        }

        // Sort by timestamp (newest first) and take last 5
        const sorted = [...history]
            .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
            .slice(0, 5);

        // Prepare chart data (reverse to show oldest first on chart)
        const data = [...sorted].reverse().map((entry) => ({
            date: new Date(entry.analyzedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            }),
            score: entry.overallScore,
            fullDate: new Date(entry.analyzedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }),
            time: new Date(entry.analyzedAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
            }),
        }));

        // Calculate trend
        const latest = sorted[0].overallScore;
        const oldest = sorted[sorted.length - 1].overallScore;
        const scoreDiff = latest - oldest;
        const percent = oldest > 0 ? ((scoreDiff / oldest) * 100).toFixed(1) : '0';

        // Calculate average change for trend determination
        let totalChange = 0;
        const scores = sorted.map((a) => a.overallScore);
        for (let i = 0; i < scores.length - 1; i++) {
            totalChange += scores[i] - scores[i + 1];
        }
        const avgChange = totalChange / (scores.length - 1);

        // Determine trend
        let trendDirection: 'improving' | 'declining' | 'stable';
        if (avgChange > 2) {
            trendDirection = 'improving';
        } else if (avgChange < -2) {
            trendDirection = 'declining';
        } else {
            trendDirection = 'stable';
        }

        return {
            chartData: data,
            trend: trendDirection,
            latestScore: latest,
            oldestScore: oldest,
            change: scoreDiff,
            changePercent: percent,
        };
    }, [history]);

    // Empty state
    if (history.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Score History</CardTitle>
                    <CardDescription>Track your website optimization over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        No history yet. Run multiple analyses to see your progress.
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Single analysis state
    if (history.length === 1) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Score History</CardTitle>
                    <CardDescription>Track your website optimization over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="text-4xl font-bold text-primary mb-2">{latestScore}</div>
                        <p className="text-muted-foreground">
                            Run another analysis to see your trend
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Get trend icon and color
    const getTrendIcon = () => {
        switch (trend) {
            case 'improving':
                return <TrendingUp className="h-5 w-5" />;
            case 'declining':
                return <TrendingDown className="h-5 w-5" />;
            case 'stable':
                return <Minus className="h-5 w-5" />;
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'improving':
                return 'text-green-600 dark:text-green-400';
            case 'declining':
                return 'text-red-600 dark:text-red-400';
            case 'stable':
                return 'text-yellow-600 dark:text-yellow-400';
        }
    };

    const getTrendBadgeVariant = () => {
        switch (trend) {
            case 'improving':
                return 'default';
            case 'declining':
                return 'destructive';
            case 'stable':
                return 'secondary';
        }
    };

    const getTrendLabel = () => {
        switch (trend) {
            case 'improving':
                return 'Improving';
            case 'declining':
                return 'Declining';
            case 'stable':
                return 'Stable';
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Score History</CardTitle>
                        <CardDescription>
                            Showing last {Math.min(history.length, 5)} {history.length === 1 ? 'analysis' : 'analyses'}
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-primary">{latestScore}</div>
                        <div className={cn('text-sm font-semibold flex items-center gap-1 justify-end', getTrendColor())}>
                            {getTrendIcon()}
                            <span>
                                {change >= 0 ? '+' : ''}{change} ({change >= 0 ? '+' : ''}{changePercent}%)
                            </span>
                        </div>
                    </div>
                </div>
                <div className="pt-2">
                    <Badge
                        variant={getTrendBadgeVariant()}
                        className={cn(
                            'font-medium',
                            trend === 'improving' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                            trend === 'declining' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                            trend === 'stable' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        )}
                    >
                        {getTrendIcon()}
                        <span className="ml-1">{getTrendLabel()} Trend</span>
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                            domain={[0, 100]}
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                                            <p className="text-sm font-semibold">{data.fullDate}</p>
                                            <p className="text-xs text-muted-foreground mb-2">{data.time}</p>
                                            <p className="text-sm">
                                                Score: <span className="font-bold text-primary">{payload[0].value}</span>
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            dot={{ fill: 'hsl(var(--primary))', r: 5 }}
                            activeDot={{ r: 7 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
