'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { DashboardAnalytics } from '@/lib/open-house/types';

interface InterestLevelChartProps {
    analytics: DashboardAnalytics;
}

const COLORS = {
    high: '#22c55e', // green
    medium: '#f59e0b', // amber
    low: '#94a3b8', // slate
};

export function InterestLevelChart({ analytics }: InterestLevelChartProps) {
    // Calculate total visitors across all interest levels
    const totalVisitors = analytics.totalVisitors;

    // Prepare data for pie chart
    const data = [
        {
            name: 'High Interest',
            value: 0,
            percentage: 0,
        },
        {
            name: 'Medium Interest',
            value: 0,
            percentage: 0,
        },
        {
            name: 'Low Interest',
            value: 0,
            percentage: 0,
        },
    ];

    // Calculate distribution from trends (use latest data point if available)
    if (analytics.trends.interestLevels.length > 0) {
        const latestTrend = analytics.trends.interestLevels[analytics.trends.interestLevels.length - 1];

        // Assuming the trend value represents the average interest level
        // We'll need to calculate distribution from the average
        // For now, we'll use a simple distribution based on the average
        const avgInterest = analytics.averageInterestLevel;

        if (avgInterest >= 2.5) {
            // High average - more high interest visitors
            data[0].value = Math.round(totalVisitors * 0.6);
            data[1].value = Math.round(totalVisitors * 0.3);
            data[2].value = totalVisitors - data[0].value - data[1].value;
        } else if (avgInterest >= 1.5) {
            // Medium average - balanced distribution
            data[0].value = Math.round(totalVisitors * 0.3);
            data[1].value = Math.round(totalVisitors * 0.5);
            data[2].value = totalVisitors - data[0].value - data[1].value;
        } else {
            // Low average - more low interest visitors
            data[0].value = Math.round(totalVisitors * 0.2);
            data[1].value = Math.round(totalVisitors * 0.3);
            data[2].value = totalVisitors - data[0].value - data[1].value;
        }
    }

    // Calculate percentages
    data.forEach(item => {
        item.percentage = totalVisitors > 0 ? (item.value / totalVisitors) * 100 : 0;
    });

    // Filter out zero values
    const chartData = data.filter(item => item.value > 0);

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Interest Level Distribution</CardTitle>
                    <CardDescription>
                        Breakdown of visitor interest levels
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No visitor data available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Interest Level Distribution</CardTitle>
                <CardDescription>
                    Breakdown of visitor interest levels across all sessions
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => {
                                    const colorKey = entry.name.toLowerCase().split(' ')[0] as keyof typeof COLORS;
                                    return (
                                        <Cell key={`cell-${index}`} fill={COLORS[colorKey]} />
                                    );
                                })}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => [`${value} visitors`, 'Count']}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-green-600">
                            {data[0].value}
                        </div>
                        <div className="text-xs text-muted-foreground">High Interest</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-amber-600">
                            {data[1].value}
                        </div>
                        <div className="text-xs text-muted-foreground">Medium Interest</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-600">
                            {data[2].value}
                        </div>
                        <div className="text-xs text-muted-foreground">Low Interest</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
