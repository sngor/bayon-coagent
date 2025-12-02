'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DashboardAnalytics } from '@/lib/open-house/types';

interface TimelineChartProps {
    analytics: DashboardAnalytics;
}

export function TimelineChart({ analytics }: TimelineChartProps) {
    // Prepare data for line chart from visitor count trends
    const chartData = analytics.trends.visitorCounts.map(point => ({
        date: new Date(point.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        }),
        visitors: point.value,
        fullDate: point.date,
    }));

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Visitor Timeline</CardTitle>
                    <CardDescription>
                        Track visitor trends over time
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No timeline data available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Calculate trend direction
    const firstValue = chartData[0]?.visitors || 0;
    const lastValue = chartData[chartData.length - 1]?.visitors || 0;
    const trendPercentage = firstValue > 0
        ? ((lastValue - firstValue) / firstValue) * 100
        : 0;
    const trendDirection = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'stable';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Visitor Timeline</CardTitle>
                <CardDescription>
                    Track visitor trends over time
                    {trendDirection !== 'stable' && (
                        <span className={`ml-2 ${trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {trendDirection === 'up' ? '↑' : '↓'} {Math.abs(trendPercentage).toFixed(1)}%
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                className="text-xs"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis
                                className="text-xs"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="visitors"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                                activeDot={{ r: 6 }}
                                name="Visitors"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4 text-center border-t pt-4">
                    <div>
                        <div className="text-sm text-muted-foreground">First Period</div>
                        <div className="text-xl font-bold">{firstValue}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Latest Period</div>
                        <div className="text-xl font-bold">{lastValue}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Change</div>
                        <div className={`text-xl font-bold ${trendDirection === 'up' ? 'text-green-600' :
                                trendDirection === 'down' ? 'text-red-600' :
                                    'text-muted-foreground'
                            }`}>
                            {trendDirection === 'up' ? '+' : ''}{trendPercentage.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
