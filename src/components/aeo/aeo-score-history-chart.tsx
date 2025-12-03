'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AEOHistoryEntry } from '@/lib/types/aeo-types';

interface AEOScoreHistoryChartProps {
    history: AEOHistoryEntry[];
}

export function AEOScoreHistoryChart({ history }: AEOScoreHistoryChartProps) {
    if (history.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Score History</CardTitle>
                    <CardDescription>Track your AI visibility over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        No history yet. Run multiple analyses to see your progress.
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Prepare data for chart (reverse to show oldest first)
    const chartData = [...history].reverse().map((entry) => ({
        date: new Date(entry.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        }),
        score: entry.score,
        fullDate: new Date(entry.timestamp).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        }),
    }));

    // Calculate statistics
    const latestScore = history[0].score;
    const oldestScore = history[history.length - 1].score;
    const change = latestScore - oldestScore;
    const changePercent = oldestScore > 0 ? ((change / oldestScore) * 100).toFixed(1) : '0';

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Score History</CardTitle>
                        <CardDescription>Track your AI visibility over time</CardDescription>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{latestScore}</div>
                        <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change >= 0 ? '+' : ''}{change} ({change >= 0 ? '+' : ''}{changePercent}%)
                        </div>
                    </div>
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
                                    return (
                                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                                            <p className="text-sm font-semibold">{payload[0].payload.fullDate}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Score: <span className="font-bold text-foreground">{payload[0].value}</span>
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
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
