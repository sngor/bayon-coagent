'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, TrendingUp, TrendingDown, Minus, ArrowRight, Loader2 } from 'lucide-react';
import { useUser } from '@/aws/auth';
import { getAEOStats } from '@/app/aeo-actions';
import Link from 'next/link';

export function AEOWidget() {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<{
        currentScore: number | null;
        trend: 'up' | 'down' | 'stable';
        totalMentions: number;
        pendingRecommendations: number;
        completedRecommendations: number;
    } | null>(null);

    useEffect(() => {
        async function loadStats() {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                const result = await getAEOStats(user.id);
                if (result.success && result.data) {
                    setStats(result.data);
                }
            } catch (error) {
                console.error('Failed to load AEO stats:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadStats();
    }, [user?.id]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Visibility
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // No data yet - show CTA
    if (!stats || stats.currentScore === null) {
        return (
            <Card className="bg-gradient-to-br from-primary/5 to-purple-600/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Visibility
                    </CardTitle>
                    <CardDescription>
                        See how discoverable you are in AI search engines
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center py-4">
                        <div className="text-4xl font-bold text-muted-foreground mb-2">?</div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Run your first analysis to get your AI visibility score
                        </p>
                        <Button asChild variant="default" size="sm">
                            <Link href="/brand/audit/ai-visibility">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Get Your Score
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Work';
    };

    const getTrendIcon = () => {
        if (stats.trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
        if (stats.trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
        return <Minus className="h-4 w-4 text-gray-400" />;
    };

    const getTrendBadge = () => {
        if (stats.trend === 'up')
            return (
                <Badge variant="default" className="bg-green-100 text-green-800">
                    Improving
                </Badge>
            );
        if (stats.trend === 'down') return <Badge variant="destructive">Declining</Badge>;
        return <Badge variant="secondary">Stable</Badge>;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Visibility
                    </CardTitle>
                    {getTrendIcon()}
                </div>
                <CardDescription>Your AI discoverability score</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Score Display */}
                <div className="text-center">
                    <div className={`text-5xl font-bold ${getScoreColor(stats.currentScore)}`}>
                        {stats.currentScore}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                        out of 100 • {getScoreLabel(stats.currentScore)}
                    </div>
                    <div className="mt-2">{getTrendBadge()}</div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <Progress value={stats.currentScore} className="h-2" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-muted-foreground">Pending Tasks</div>
                        <div className="text-2xl font-bold">{stats.pendingRecommendations}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-muted-foreground">Completed</div>
                        <div className="text-2xl font-bold">{stats.completedRecommendations}</div>
                    </div>
                </div>

                {/* Action Button */}
                <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/brand/audit/ai-visibility">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
