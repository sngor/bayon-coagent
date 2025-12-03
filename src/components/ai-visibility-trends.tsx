'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import type { AIVisibilityScore, AIMention } from '@/lib/types/common/common';
import { cn } from '@/lib/utils/common';

interface AIVisibilityTrendsProps {
    userId: string;
    scores: AIVisibilityScore[];
    mentions: AIMention[];
    timeRange?: '30d' | '90d' | '180d';
}

type TimeRange = '30d' | '90d' | '180d';
type Platform = 'all' | 'chatgpt' | 'perplexity' | 'claude' | 'gemini';

const PLATFORM_COLORS = {
    chatgpt: '#10a37f',
    perplexity: '#6366f1',
    claude: '#8b5cf6',
    gemini: '#3b82f6',
};

const SENTIMENT_COLORS = {
    positive: '#22c55e',
    neutral: '#94a3b8',
    negative: '#ef4444',
};

export function AIVisibilityTrends({
    userId,
    scores,
    mentions,
    timeRange: initialTimeRange = '30d',
}: AIVisibilityTrendsProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
    const [platformFilter, setPlatformFilter] = useState<Platform>('all');

    // Calculate date range based on selected time range
    const dateRange = useMemo(() => {
        const now = new Date();
        const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 180;
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days);
        return { startDate, endDate: now };
    }, [timeRange]);

    // Filter scores by date range
    const filteredScores = useMemo(() => {
        return scores.filter(score => {
            const scoreDate = new Date(score.calculatedAt);
            return scoreDate >= dateRange.startDate && scoreDate <= dateRange.endDate;
        }).sort((a, b) => new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime());
    }, [scores, dateRange]);

    // Filter mentions by date range and platform
    const filteredMentions = useMemo(() => {
        return mentions.filter(mention => {
            const mentionDate = new Date(mention.timestamp);
            const inDateRange = mentionDate >= dateRange.startDate && mentionDate <= dateRange.endDate;
            const matchesPlatform = platformFilter === 'all' || mention.platform === platformFilter;
            return inDateRange && matchesPlatform;
        });
    }, [mentions, dateRange, platformFilter]);

    // Prepare visibility score trend data
    const visibilityTrendData = useMemo(() => {
        return filteredScores.map(score => ({
            date: new Date(score.calculatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            }),
            score: score.score,
            timestamp: new Date(score.calculatedAt).getTime(),
        }));
    }, [filteredScores]);

    // Prepare mention count trend data
    const mentionCountTrendData = useMemo(() => {
        // Group mentions by date
        const mentionsByDate = new Map<string, number>();

        filteredMentions.forEach(mention => {
            const date = new Date(mention.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });
            mentionsByDate.set(date, (mentionsByDate.get(date) || 0) + 1);
        });

        // Convert to array and sort by timestamp
        const data = Array.from(mentionsByDate.entries()).map(([date, count]) => {
            // Parse the date back to get timestamp for sorting
            const parsedDate = new Date(date + ', ' + new Date().getFullYear());
            return {
                date,
                count,
                timestamp: parsedDate.getTime(),
            };
        });

        return data.sort((a, b) => a.timestamp - b.timestamp);
    }, [filteredMentions]);

    // Prepare sentiment trend data
    const sentimentTrendData = useMemo(() => {
        // Group mentions by date and sentiment
        const sentimentByDate = new Map<string, { positive: number; neutral: number; negative: number }>();

        filteredMentions.forEach(mention => {
            const date = new Date(mention.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });

            if (!sentimentByDate.has(date)) {
                sentimentByDate.set(date, { positive: 0, neutral: 0, negative: 0 });
            }

            const sentiments = sentimentByDate.get(date)!;
            sentiments[mention.sentiment]++;
        });

        // Convert to array and sort by timestamp
        const data = Array.from(sentimentByDate.entries()).map(([date, sentiments]) => {
            const parsedDate = new Date(date + ', ' + new Date().getFullYear());
            return {
                date,
                positive: sentiments.positive,
                neutral: sentiments.neutral,
                negative: sentiments.negative,
                timestamp: parsedDate.getTime(),
            };
        });

        return data.sort((a, b) => a.timestamp - b.timestamp);
    }, [filteredMentions]);

    const hasData = filteredScores.length > 0 || filteredMentions.length > 0;

    if (!hasData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        AI Visibility Trends
                    </CardTitle>
                    <CardDescription>
                        Track your AI visibility over time
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-2">
                            No trend data available yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Historical data will appear here as monitoring continues
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Filters */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <TrendingUp className="h-6 w-6" />
                        AI Visibility Trends
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track your AI visibility over time
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {/* Time Range Selector */}
                    <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="180d">Last 180 days</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Platform Filter */}
                    <Select value={platformFilter} onValueChange={(value) => setPlatformFilter(value as Platform)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Platform" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All platforms</SelectItem>
                            <SelectItem value="chatgpt">ChatGPT</SelectItem>
                            <SelectItem value="perplexity">Perplexity</SelectItem>
                            <SelectItem value="claude">Claude</SelectItem>
                            <SelectItem value="gemini">Gemini</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Visibility Score Trend */}
            {visibilityTrendData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Visibility Score Over Time</CardTitle>
                        <CardDescription>
                            Your AI visibility score trend for the selected period
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={visibilityTrendData}>
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
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '6px',
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={{ fill: 'hsl(var(--primary))' }}
                                        name="Visibility Score"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Mention Count Trend */}
            {mentionCountTrendData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Mention Count Trend</CardTitle>
                        <CardDescription>
                            Number of mentions over time
                            {platformFilter !== 'all' && ` (${platformFilter})`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={mentionCountTrendData}>
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
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6' }}
                                        name="Mentions"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Sentiment Trend */}
            {sentimentTrendData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Sentiment Trend</CardTitle>
                        <CardDescription>
                            Distribution of sentiment over time
                            {platformFilter !== 'all' && ` (${platformFilter})`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sentimentTrendData}>
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
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="positive"
                                        stroke={SENTIMENT_COLORS.positive}
                                        strokeWidth={2}
                                        dot={{ fill: SENTIMENT_COLORS.positive }}
                                        name="Positive"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="neutral"
                                        stroke={SENTIMENT_COLORS.neutral}
                                        strokeWidth={2}
                                        dot={{ fill: SENTIMENT_COLORS.neutral }}
                                        name="Neutral"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="negative"
                                        stroke={SENTIMENT_COLORS.negative}
                                        strokeWidth={2}
                                        dot={{ fill: SENTIMENT_COLORS.negative }}
                                        name="Negative"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>Period Summary</CardTitle>
                    <CardDescription>
                        Key metrics for the selected time range
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold">
                                {filteredMentions.length}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Total Mentions
                            </div>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {filteredMentions.filter(m => m.sentiment === 'positive').length}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Positive
                            </div>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-600">
                                {filteredMentions.filter(m => m.sentiment === 'neutral').length}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Neutral
                            </div>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">
                                {filteredMentions.filter(m => m.sentiment === 'negative').length}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Negative
                            </div>
                        </div>
                    </div>

                    {platformFilter === 'all' && filteredMentions.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-lg font-semibold">
                                    {filteredMentions.filter(m => m.platform === 'chatgpt').length}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    ChatGPT
                                </div>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-lg font-semibold">
                                    {filteredMentions.filter(m => m.platform === 'perplexity').length}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Perplexity
                                </div>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-lg font-semibold">
                                    {filteredMentions.filter(m => m.platform === 'claude').length}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Claude
                                </div>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-lg font-semibold">
                                    {filteredMentions.filter(m => m.platform === 'gemini').length}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Gemini
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
