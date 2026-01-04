/**
 * Unified Brand Dashboard Component
 * 
 * Integrates AI visibility metrics with existing brand analytics
 * to provide a comprehensive view of brand performance.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
    TrendingUp,
    TrendingDown,
    Target,
    Award,
    Globe,
    Bot,
    Users,
    Star,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    BarChart3,
    Eye
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/common';
import { aiVisibilityAnalytics } from '@/lib/ai-visibility/analytics-integration';
import { trackBrandIntegration } from '@/lib/ai-visibility/enhanced-analytics-tracking';
import type { UnifiedBrandMetrics, AIVisibilityMetrics } from '@/lib/ai-visibility/analytics-integration';
import { useUser } from '@/aws/auth';
import { toast } from '@/hooks/use-toast';

interface UnifiedBrandDashboardProps {
    /** Whether to show detailed metrics */
    showDetails?: boolean;
    /** Custom class name */
    className?: string;
}

export function UnifiedBrandDashboard({ 
    showDetails = true, 
    className 
}: UnifiedBrandDashboardProps) {
    const { user } = useUser();
    const [metrics, setMetrics] = useState<UnifiedBrandMetrics | null>(null);
    const [aiVisibilityData, setAIVisibilityData] = useState<AIVisibilityMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }

        loadBrandMetrics();
    }, [user?.id]);

    const loadBrandMetrics = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Load unified brand metrics
            const unifiedMetrics = await aiVisibilityAnalytics.getUnifiedBrandMetrics(user!.id);
            setMetrics(unifiedMetrics);

            // Load AI visibility data separately for detailed display
            const aiData = await aiVisibilityAnalytics.getAIVisibilityAnalyticsData(user!.id);
            setAIVisibilityData(aiData);

            // Track dashboard view
            if (unifiedMetrics) {
                trackBrandIntegration.unifiedDashboardViewed(
                    user!.id,
                    unifiedMetrics.brandScore,
                    unifiedMetrics.aiVisibilityScore,
                    unifiedMetrics.profileHealth
                );
            }

        } catch (error) {
            console.error('Failed to load brand metrics:', error);
            setError('Failed to load brand analytics data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshMetrics = async () => {
        toast({
            title: 'Refreshing Analytics',
            description: 'Updating your brand performance metrics...',
        });

        await loadBrandMetrics();

        toast({
            title: 'Analytics Updated',
            description: 'Your brand metrics have been refreshed.',
        });
    };

    if (isLoading) {
        return (
            <div className={cn("space-y-6", className)}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 bg-muted rounded w-3/4"></div>
                                    <div className="h-8 bg-muted rounded w-1/2"></div>
                                    <div className="h-2 bg-muted rounded"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <Card className={className}>
                <CardContent className="p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">{error || 'No brand metrics available'}</p>
                    <Button variant="outline" onClick={loadBrandMetrics} className="mt-4">
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
            case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
            default: return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-orange-600';
        return 'text-red-600';
    };

    const getScoreBadgeVariant = (score: number) => {
        if (score >= 80) return 'default';
        if (score >= 60) return 'secondary';
        return 'destructive';
    };

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header with Refresh Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold font-headline">Brand Performance Dashboard</h2>
                    <p className="text-muted-foreground">
                        Unified view of your brand health and AI visibility
                    </p>
                </div>
                <Button variant="outline" onClick={handleRefreshMetrics}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Refresh Data
                </Button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Overall Brand Score */}
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-600/5" />
                    <CardHeader className="relative pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Brand Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="flex items-center gap-2">
                            <div className={cn("text-3xl font-bold", getScoreColor(metrics.brandScore))}>
                                {metrics.brandScore}
                            </div>
                            {getTrendIcon(metrics.trendDirection)}
                        </div>
                        <Progress value={metrics.brandScore} className="mt-2 h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                            Overall brand health
                        </p>
                    </CardContent>
                </Card>

                {/* AI Visibility Score */}
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20" />
                    <CardHeader className="relative pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            AI Visibility
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="flex items-center gap-2">
                            <div className={cn("text-3xl font-bold", getScoreColor(metrics.aiVisibilityScore))}>
                                {metrics.aiVisibilityScore}
                            </div>
                            <Badge variant={getScoreBadgeVariant(metrics.aiVisibilityScore)} className="text-xs">
                                {aiVisibilityData?.improvementTrend || 'stable'}
                            </Badge>
                        </div>
                        <Progress value={metrics.aiVisibilityScore} className="mt-2 h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                            AI search discoverability
                        </p>
                    </CardContent>
                </Card>

                {/* Profile Health */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Profile Health
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={cn("text-3xl font-bold", getScoreColor(metrics.profileHealth))}>
                                {metrics.profileHealth}
                            </div>
                            {metrics.profileHealth >= 90 && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        <Progress value={metrics.profileHealth} className="mt-2 h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                            Profile completeness & quality
                        </p>
                    </CardContent>
                </Card>

                {/* Online Presence */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Online Presence
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={cn("text-3xl font-bold", getScoreColor(metrics.onlinePresence))}>
                                {metrics.onlinePresence}
                            </div>
                            <Badge variant="outline" className="text-xs">
                                Rank #{metrics.competitivePosition}
                            </Badge>
                        </div>
                        <Progress value={metrics.onlinePresence} className="mt-2 h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                            Cross-platform consistency
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* AI Visibility Platform Breakdown */}
            {showDetails && aiVisibilityData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            AI Platform Performance
                        </CardTitle>
                        <CardDescription>
                            Your visibility across different AI search platforms
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">SEO</span>
                                    <span className="font-medium">{aiVisibilityData.platformScores.seo}/100</span>
                                </div>
                                <Progress value={aiVisibilityData.platformScores.seo} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">AEO</span>
                                    <span className="font-medium">{aiVisibilityData.platformScores.aeo}/100</span>
                                </div>
                                <Progress value={aiVisibilityData.platformScores.aeo} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">AIO</span>
                                    <span className="font-medium">{aiVisibilityData.platformScores.aio}/100</span>
                                </div>
                                <Progress value={aiVisibilityData.platformScores.aio} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">GEO</span>
                                    <span className="font-medium">{aiVisibilityData.platformScores.geo}/100</span>
                                </div>
                                <Progress value={aiVisibilityData.platformScores.geo} className="h-2" />
                            </div>
                        </div>

                        {/* AI Mentions Summary */}
                        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">Recent AI Mentions</h4>
                                <Badge variant="outline">{aiVisibilityData.mentionCount} mentions</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="text-center">
                                    <div className="text-green-600 font-medium">
                                        {Math.round(aiVisibilityData.sentimentDistribution.positive * 100)}%
                                    </div>
                                    <div className="text-muted-foreground">Positive</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-muted-foreground font-medium">
                                        {Math.round(aiVisibilityData.sentimentDistribution.neutral * 100)}%
                                    </div>
                                    <div className="text-muted-foreground">Neutral</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-red-600 font-medium">
                                        {Math.round(aiVisibilityData.sentimentDistribution.negative * 100)}%
                                    </div>
                                    <div className="text-muted-foreground">Negative</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Key Insights */}
            {showDetails && metrics.keyInsights.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Key Insights
                        </CardTitle>
                        <CardDescription>
                            Actionable insights to improve your brand performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {metrics.keyInsights.map((insight, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                    </div>
                                    <span className="text-sm">{insight}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Top Recommendations */}
            {showDetails && metrics.actionableRecommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Priority Actions
                        </CardTitle>
                        <CardDescription>
                            Top recommendations to boost your brand performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {metrics.actionableRecommendations.slice(0, 3).map((recommendation) => (
                                <div key={recommendation.id} className="p-4 border rounded-lg space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <h4 className="font-medium">{recommendation.title}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {recommendation.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge 
                                                variant={recommendation.priority === 'high' ? 'destructive' : 
                                                        recommendation.priority === 'medium' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {recommendation.priority}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                +{recommendation.estimatedImpact} pts
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6 pt-4 border-t">
                            <Link href="/brand/audit/ai-visibility">
                                <Button variant="outline" className="w-full">
                                    View All Recommendations
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                        Common tasks to improve your brand performance
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <Link href="/brand/profile">
                            <Button variant="outline" className="w-full justify-start">
                                <Award className="mr-2 h-4 w-4" />
                                Update Profile
                            </Button>
                        </Link>
                        <Link href="/brand/audit">
                            <Button variant="outline" className="w-full justify-start">
                                <Globe className="mr-2 h-4 w-4" />
                                Run NAP Audit
                            </Button>
                        </Link>
                        <Link href="/brand/audit/ai-visibility">
                            <Button variant="outline" className="w-full justify-start">
                                <Bot className="mr-2 h-4 w-4" />
                                AI Visibility
                            </Button>
                        </Link>
                        <Link href="/brand/testimonials">
                            <Button variant="outline" className="w-full justify-start">
                                <Star className="mr-2 h-4 w-4" />
                                Manage Reviews
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}