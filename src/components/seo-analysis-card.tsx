'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { SEOAnalysis, SEORecommendation } from '@/lib/types/common';

interface SEOAnalysisCardProps {
    analysis: SEOAnalysis;
    scoreHistory?: Array<{ analyzedAt: string; score: number }>;
    showRecommendations?: boolean;
    className?: string;
}

/**
 * SEOAnalysisCard Component
 * 
 * Displays SEO score with visual indicator, shows recommendations
 * with priority badges, and displays score history.
 * 
 * Requirements: 5.3, 10.1
 */
export function SEOAnalysisCard({
    analysis,
    scoreHistory = [],
    showRecommendations = true,
    className = '',
}: SEOAnalysisCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Needs Work';
        return 'Poor';
    };

    const getScoreTrend = () => {
        if (!analysis.previousScore) return null;

        const diff = analysis.score - analysis.previousScore;

        if (diff > 0) {
            return (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    <span>+{diff} from last analysis</span>
                </div>
            );
        } else if (diff < 0) {
            return (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                    <TrendingDown className="h-4 w-4" />
                    <span>{diff} from last analysis</span>
                </div>
            );
        } else {
            return (
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Minus className="h-4 w-4" />
                    <span>No change</span>
                </div>
            );
        }
    };

    const getPriorityIcon = (priority: SEORecommendation['priority']) => {
        switch (priority) {
            case 'high':
                return <AlertCircle className="h-4 w-4 text-red-600" />;
            case 'medium':
                return <Info className="h-4 w-4 text-yellow-600" />;
            case 'low':
                return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
        }
    };

    const getPriorityBadgeVariant = (priority: SEORecommendation['priority']): 'default' | 'secondary' | 'destructive' => {
        switch (priority) {
            case 'high':
                return 'destructive';
            case 'medium':
                return 'secondary';
            case 'low':
                return 'default';
        }
    };

    // Group recommendations by priority
    const groupedRecommendations = {
        high: analysis.recommendations.filter(r => r.priority === 'high'),
        medium: analysis.recommendations.filter(r => r.priority === 'medium'),
        low: analysis.recommendations.filter(r => r.priority === 'low'),
    };

    // Prepare chart data
    const chartData = scoreHistory.map(entry => ({
        date: new Date(entry.analyzedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: entry.score,
    }));

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>SEO Analysis</CardTitle>
                        <CardDescription>
                            Analyzed on {new Date(analysis.analyzedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                        {analysis.contentType}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Score Display */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className={`text-5xl font-bold ${getScoreColor(analysis.score)}`}>
                                {analysis.score}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                {getScoreLabel(analysis.score)}
                            </div>
                        </div>
                        <div className="text-right">
                            {getScoreTrend()}
                        </div>
                    </div>

                    <Progress value={analysis.score} className="h-2" />
                </div>

                {/* Score History Chart */}
                {chartData.length > 1 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Score History</h4>
                        <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                    />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {showRecommendations && analysis.recommendations.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">Recommendations</h4>

                        {/* High Priority */}
                        {groupedRecommendations.high.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    High Priority ({groupedRecommendations.high.length})
                                </div>
                                {groupedRecommendations.high.map((rec, index) => (
                                    <div
                                        key={`high-${index}`}
                                        className="p-3 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900"
                                    >
                                        <div className="flex items-start gap-2">
                                            {getPriorityIcon(rec.priority)}
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm">{rec.message}</p>
                                                {rec.currentValue && rec.suggestedValue && (
                                                    <div className="text-xs text-muted-foreground">
                                                        <span className="font-medium">Current:</span> {rec.currentValue} →{' '}
                                                        <span className="font-medium">Suggested:</span> {rec.suggestedValue}
                                                    </div>
                                                )}
                                            </div>
                                            <Badge variant={getPriorityBadgeVariant(rec.priority)} className="text-xs">
                                                {rec.category}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Medium Priority */}
                        {groupedRecommendations.medium.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-yellow-600">
                                    <Info className="h-4 w-4" />
                                    Medium Priority ({groupedRecommendations.medium.length})
                                </div>
                                {groupedRecommendations.medium.map((rec, index) => (
                                    <div
                                        key={`medium-${index}`}
                                        className="p-3 rounded-lg border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-900"
                                    >
                                        <div className="flex items-start gap-2">
                                            {getPriorityIcon(rec.priority)}
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm">{rec.message}</p>
                                                {rec.currentValue && rec.suggestedValue && (
                                                    <div className="text-xs text-muted-foreground">
                                                        <span className="font-medium">Current:</span> {rec.currentValue} →{' '}
                                                        <span className="font-medium">Suggested:</span> {rec.suggestedValue}
                                                    </div>
                                                )}
                                            </div>
                                            <Badge variant={getPriorityBadgeVariant(rec.priority)} className="text-xs">
                                                {rec.category}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Low Priority */}
                        {groupedRecommendations.low.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Low Priority ({groupedRecommendations.low.length})
                                </div>
                                {groupedRecommendations.low.map((rec, index) => (
                                    <div
                                        key={`low-${index}`}
                                        className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900"
                                    >
                                        <div className="flex items-start gap-2">
                                            {getPriorityIcon(rec.priority)}
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm">{rec.message}</p>
                                                {rec.currentValue && rec.suggestedValue && (
                                                    <div className="text-xs text-muted-foreground">
                                                        <span className="font-medium">Current:</span> {rec.currentValue} →{' '}
                                                        <span className="font-medium">Suggested:</span> {rec.suggestedValue}
                                                    </div>
                                                )}
                                            </div>
                                            <Badge variant={getPriorityBadgeVariant(rec.priority)} className="text-xs">
                                                {rec.category}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {showRecommendations && analysis.recommendations.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-4">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        No recommendations - your content is well optimized!
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
