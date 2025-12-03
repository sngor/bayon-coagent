'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    RefreshCw,
    Download,
    MessageSquare,
    Sparkles,
} from 'lucide-react';
import type { AIVisibilityScore, AIMention } from '@/lib/types/common/common';
import { cn } from '@/lib/utils/common';

interface AIVisibilityDashboardProps {
    userId: string;
    score: AIVisibilityScore | null;
    recentMentions: AIMention[];
    onRefresh?: () => Promise<void>;
    onExport?: () => Promise<void>;
}

const SENTIMENT_COLORS = {
    positive: '#22c55e', // green
    neutral: '#94a3b8', // slate
    negative: '#ef4444', // red
};

const PLATFORM_COLORS = {
    chatgpt: '#10a37f',
    perplexity: '#6366f1',
    claude: '#8b5cf6',
    gemini: '#3b82f6',
};

export function AIVisibilityDashboard({
    userId,
    score,
    recentMentions,
    onRefresh,
    onExport,
}: AIVisibilityDashboardProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleRefresh = async () => {
        if (!onRefresh) return;
        setIsRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleExport = async () => {
        if (!onExport) return;
        setIsExporting(true);
        try {
            await onExport();
        } finally {
            setIsExporting(false);
        }
    };

    // Prepare sentiment distribution data for pie chart
    const sentimentData = score
        ? [
            {
                name: 'Positive',
                value: score.sentimentDistribution.positive,
                color: SENTIMENT_COLORS.positive,
            },
            {
                name: 'Neutral',
                value: score.sentimentDistribution.neutral,
                color: SENTIMENT_COLORS.neutral,
            },
            {
                name: 'Negative',
                value: score.sentimentDistribution.negative,
                color: SENTIMENT_COLORS.negative,
            },
        ].filter((item) => item.value > 0)
        : [];

    // Prepare platform breakdown data
    const platformData = score
        ? [
            { name: 'ChatGPT', value: score.platformBreakdown.chatgpt, color: PLATFORM_COLORS.chatgpt },
            { name: 'Perplexity', value: score.platformBreakdown.perplexity, color: PLATFORM_COLORS.perplexity },
            { name: 'Claude', value: score.platformBreakdown.claude, color: PLATFORM_COLORS.claude },
            { name: 'Gemini', value: score.platformBreakdown.gemini, color: PLATFORM_COLORS.gemini },
        ].filter((item) => item.value > 0)
        : [];

    const getTrendIcon = () => {
        if (!score) return null;
        switch (score.trend) {
            case 'up':
                return <TrendingUp className="h-5 w-5 text-green-600" />;
            case 'down':
                return <TrendingDown className="h-5 w-5 text-red-600" />;
            case 'stable':
                return <Minus className="h-5 w-5 text-slate-600" />;
        }
    };

    const getTrendColor = () => {
        if (!score) return 'text-slate-600';
        switch (score.trend) {
            case 'up':
                return 'text-green-600';
            case 'down':
                return 'text-red-600';
            case 'stable':
                return 'text-slate-600';
        }
    };

    if (!score) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        AI Visibility Dashboard
                    </CardTitle>
                    <CardDescription>
                        Track your presence in AI-powered search results
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                            No visibility data available yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Start monitoring to see how often you appear in AI search results
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="h-6 w-6" />
                        AI Visibility Dashboard
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track your presence in AI-powered search results
                    </p>
                </div>
                <div className="flex gap-2">
                    {onRefresh && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                            Refresh
                        </Button>
                    )}
                    {onExport && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Score Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Visibility Score</CardTitle>
                    <CardDescription>
                        Your overall AI visibility from {new Date(score.periodStart).toLocaleDateString()} to{' '}
                        {new Date(score.periodEnd).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-5xl font-bold">{score.score}</div>
                            <div className="text-sm text-muted-foreground mt-1">out of 100</div>
                        </div>
                        <div className="flex items-center gap-2">
                            {getTrendIcon()}
                            <div className="text-right">
                                <div className={cn('text-2xl font-semibold', getTrendColor())}>
                                    {score.trendPercentage > 0 ? '+' : ''}
                                    {score.trendPercentage.toFixed(1)}%
                                </div>
                                <div className="text-xs text-muted-foreground">vs previous period</div>
                            </div>
                        </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-lg font-semibold">{score.breakdown.mentionFrequency}</div>
                            <div className="text-xs text-muted-foreground">Mention Frequency</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-lg font-semibold">{score.breakdown.sentimentScore}</div>
                            <div className="text-xs text-muted-foreground">Sentiment Score</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-lg font-semibold">{score.breakdown.prominenceScore}</div>
                            <div className="text-xs text-muted-foreground">Prominence Score</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-lg font-semibold">{score.breakdown.platformDiversity}</div>
                            <div className="text-xs text-muted-foreground">Platform Diversity</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Platform Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Platform Breakdown</CardTitle>
                        <CardDescription>Mentions across AI platforms</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {platformData.length > 0 ? (
                            <>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={platformData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }) => `${name}: ${value}`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {platformData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    {platformData.map((platform) => (
                                        <div key={platform.name} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                            <span className="text-sm font-medium">{platform.name}</span>
                                            <Badge variant="secondary">{platform.value}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No platform data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sentiment Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sentiment Distribution</CardTitle>
                        <CardDescription>How AI platforms mention you</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sentimentData.length > 0 ? (
                            <>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={sentimentData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }) => `${name}: ${value}`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {sentimentData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-3">
                                    <div className="text-center p-2 bg-muted/50 rounded">
                                        <div className="text-lg font-bold text-green-600">
                                            {score.sentimentDistribution.positive}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Positive</div>
                                    </div>
                                    <div className="text-center p-2 bg-muted/50 rounded">
                                        <div className="text-lg font-bold text-slate-600">
                                            {score.sentimentDistribution.neutral}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Neutral</div>
                                    </div>
                                    <div className="text-center p-2 bg-muted/50 rounded">
                                        <div className="text-lg font-bold text-red-600">
                                            {score.sentimentDistribution.negative}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Negative</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No sentiment data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Mentions Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Mentions</CardTitle>
                    <CardDescription>
                        {recentMentions.length} mention{recentMentions.length !== 1 ? 's' : ''} in the last 30 days
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {recentMentions.length > 0 ? (
                        <div className="space-y-3">
                            {recentMentions.slice(0, 5).map((mention) => (
                                <div
                                    key={mention.id}
                                    className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="text-xs">
                                                {mention.platform}
                                            </Badge>
                                            <Badge
                                                variant={
                                                    mention.sentiment === 'positive'
                                                        ? 'default'
                                                        : mention.sentiment === 'negative'
                                                            ? 'destructive'
                                                            : 'secondary'
                                                }
                                                className="text-xs"
                                            >
                                                {mention.sentiment}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {mention.snippet}
                                        </p>
                                    </div>
                                    <div className="text-xs text-muted-foreground ml-4">
                                        {new Date(mention.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No recent mentions found
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
