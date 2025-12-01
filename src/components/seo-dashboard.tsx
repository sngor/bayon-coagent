'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { SEOAnalysis } from '@/lib/types/common';

interface SEODashboardProps {
    userId: string;
    analyses?: SEOAnalysis[];
    isLoading?: boolean;
}

interface DashboardStats {
    averageScore: number;
    topPerforming: SEOAnalysis[];
    underperforming: SEOAnalysis[];
    totalContent: number;
}

/**
 * SEODashboard Component
 * 
 * Displays average SEO score across all content and shows
 * top-performing and underperforming content.
 * 
 * Requirements: 10.3, 10.5
 */
export function SEODashboard({ userId, analyses = [], isLoading = false }: SEODashboardProps) {
    const [stats, setStats] = useState<DashboardStats>({
        averageScore: 0,
        topPerforming: [],
        underperforming: [],
        totalContent: 0,
    });

    useEffect(() => {
        if (analyses.length === 0) {
            setStats({
                averageScore: 0,
                topPerforming: [],
                underperforming: [],
                totalContent: 0,
            });
            return;
        }

        // Get the latest analysis for each unique contentId
        const latestAnalysesByContent = new Map<string, SEOAnalysis>();

        for (const analysis of analyses) {
            const existing = latestAnalysesByContent.get(analysis.contentId);

            if (!existing ||
                new Date(analysis.analyzedAt).getTime() > new Date(existing.analyzedAt).getTime()) {
                latestAnalysesByContent.set(analysis.contentId, analysis);
            }
        }

        const latestAnalyses = Array.from(latestAnalysesByContent.values());

        // Calculate average score
        const totalScore = latestAnalyses.reduce((sum, analysis) => sum + analysis.score, 0);
        const averageScore = latestAnalyses.length > 0
            ? Math.round(totalScore / latestAnalyses.length)
            : 0;

        // Get top-performing content (score >= 80)
        const topPerforming = latestAnalyses
            .filter(analysis => analysis.score >= 80)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        // Get underperforming content (score < 60)
        const underperforming = latestAnalyses
            .filter(analysis => analysis.score < 60)
            .sort((a, b) => a.score - b.score)
            .slice(0, 5);

        setStats({
            averageScore,
            topPerforming,
            underperforming,
            totalContent: latestAnalyses.length,
        });
    }, [analyses]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-32 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
        if (score >= 80) return 'default';
        if (score >= 60) return 'secondary';
        return 'destructive';
    };

    return (
        <div className="space-y-6">
            {/* Average Score Card */}
            <Card>
                <CardHeader>
                    <CardTitle>SEO Performance Overview</CardTitle>
                    <CardDescription>
                        Average SEO score across {stats.totalContent} content {stats.totalContent === 1 ? 'item' : 'items'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center">
                        <div className="text-center">
                            <div className={`text-6xl font-bold ${getScoreColor(stats.averageScore)}`}>
                                {stats.averageScore}
                            </div>
                            <div className="text-sm text-muted-foreground mt-2">
                                Average SEO Score
                            </div>
                        </div>
                    </div>

                    {stats.totalContent === 0 && (
                        <div className="text-center text-muted-foreground mt-4">
                            No content analyzed yet. Create and analyze content to see your SEO performance.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Top Performing Content */}
            {stats.topPerforming.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <CardTitle>Top Performing Content</CardTitle>
                        </div>
                        <CardDescription>
                            Content with SEO scores of 80 or higher
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.topPerforming.map((analysis) => (
                                <div
                                    key={analysis.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">
                                            Content ID: {analysis.contentId}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {analysis.contentType} • Analyzed {new Date(analysis.analyzedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 ml-4">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        <Badge variant={getScoreBadgeVariant(analysis.score)}>
                                            {analysis.score}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Underperforming Content */}
            {stats.underperforming.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <CardTitle>Needs Improvement</CardTitle>
                        </div>
                        <CardDescription>
                            Content with SEO scores below 60 that need optimization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.underperforming.map((analysis) => (
                                <div
                                    key={analysis.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">
                                            Content ID: {analysis.contentId}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {analysis.contentType} • Analyzed {new Date(analysis.analyzedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 ml-4">
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                        <Badge variant={getScoreBadgeVariant(analysis.score)}>
                                            {analysis.score}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
