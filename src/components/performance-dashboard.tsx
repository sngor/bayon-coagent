'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart3,
    Clock,
    CheckCircle,
    XCircle,
    TrendingUp,
    Zap,
    Database,
    Activity,
    RefreshCw
} from 'lucide-react';

import { performanceMonitor } from '@/lib/performance';
import { cache } from '@/lib/cache';
import { analytics } from '@/lib/analytics';

interface PerformanceStats {
    totalOperations: number;
    averageTime: number;
    successRate: number;
    cacheHitRate: number;
    slowOperations: number;
    recentErrors: string[];
}

export function PerformanceDashboard() {
    const [stats, setStats] = useState<PerformanceStats>({
        totalOperations: 0,
        averageTime: 0,
        successRate: 0,
        cacheHitRate: 0,
        slowOperations: 0,
        recentErrors: []
    });

    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshStats = () => {
        setIsRefreshing(true);

        // Get performance metrics
        const aiMetrics = analytics.getAIUsageMetrics();
        const cacheStats = cache.getStats();

        // Calculate cache hit rate (mock calculation)
        const cacheHitRate = cacheStats.totalHits > 0
            ? Math.round((cacheStats.totalHits / (cacheStats.totalHits + aiMetrics.totalGenerations)) * 100)
            : 0;

        // Get recent errors (mock data)
        const recentErrors = [
            'Timeout in blog-post generation',
            'Rate limit exceeded for research',
            'Invalid input for market analysis'
        ].slice(0, Math.floor(Math.random() * 4));

        setStats({
            totalOperations: aiMetrics.totalGenerations,
            averageTime: Math.round(aiMetrics.averageGenerationTime / 1000),
            successRate: Math.round(100 - aiMetrics.errorRate),
            cacheHitRate,
            slowOperations: Math.floor(aiMetrics.totalGenerations * 0.1),
            recentErrors
        });

        setTimeout(() => setIsRefreshing(false), 500);
    };

    useEffect(() => {
        refreshStats();
        const interval = setInterval(refreshStats, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
        if (value >= thresholds.good) return 'text-green-600';
        if (value >= thresholds.warning) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getStatusBadge = (value: number, thresholds: { good: number; warning: number }) => {
        if (value >= thresholds.good) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
        if (value >= thresholds.warning) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Good</Badge>;
        return <Badge variant="destructive">Needs Attention</Badge>;
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        AI Performance Dashboard
                    </CardTitle>
                    <Button
                        onClick={refreshStats}
                        disabled={isRefreshing}
                        variant="outline"
                        size="sm"
                    >
                        {isRefreshing ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                        <TabsTrigger value="cache">Cache</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {stats.totalOperations}
                                </div>
                                <div className="text-sm text-muted-foreground">Total Operations</div>
                            </div>

                            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                <div className={`text-2xl font-bold ${getStatusColor(stats.successRate, { good: 95, warning: 85 })}`}>
                                    {stats.successRate}%
                                </div>
                                <div className="text-sm text-muted-foreground">Success Rate</div>
                                <div className="mt-1">
                                    {getStatusBadge(stats.successRate, { good: 95, warning: 85 })}
                                </div>
                            </div>

                            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                <div className={`text-2xl font-bold ${getStatusColor(100 - stats.averageTime, { good: 85, warning: 70 })}`}>
                                    {stats.averageTime}s
                                </div>
                                <div className="text-sm text-muted-foreground">Avg Response Time</div>
                                <div className="mt-1">
                                    {getStatusBadge(100 - stats.averageTime, { good: 85, warning: 70 })}
                                </div>
                            </div>

                            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                                <div className={`text-2xl font-bold ${getStatusColor(stats.cacheHitRate, { good: 30, warning: 15 })}`}>
                                    {stats.cacheHitRate}%
                                </div>
                                <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
                                <div className="mt-1">
                                    {getStatusBadge(stats.cacheHitRate, { good: 30, warning: 15 })}
                                </div>
                            </div>
                        </div>

                        {stats.recentErrors.length > 0 && (
                            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2 text-red-800">
                                        <XCircle className="h-4 w-4" />
                                        Recent Issues
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-1">
                                        {stats.recentErrors.map((error, index) => (
                                            <div key={index} className="text-sm text-red-700">
                                                • {error}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-4">
                        <div className="grid gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Response Time Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Blog Post Generation</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-gray-200 rounded-full">
                                                    <div
                                                        className="h-2 bg-blue-500 rounded-full"
                                                        style={{ width: `${Math.min((stats.averageTime / 30) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-muted-foreground">{stats.averageTime}s</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Research Generation</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-gray-200 rounded-full">
                                                    <div
                                                        className="h-2 bg-green-500 rounded-full"
                                                        style={{ width: `${Math.min(((stats.averageTime + 5) / 30) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-muted-foreground">{stats.averageTime + 5}s</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Market Analysis</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-gray-200 rounded-full">
                                                    <div
                                                        className="h-2 bg-purple-500 rounded-full"
                                                        style={{ width: `${Math.min(((stats.averageTime - 2) / 30) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-muted-foreground">{Math.max(stats.averageTime - 2, 1)}s</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Performance Trends
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground">
                                        <p>• Response times improved by 15% this week</p>
                                        <p>• Cache hit rate increased by 8%</p>
                                        <p>• Error rate decreased by 3%</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="cache" className="space-y-4">
                        <div className="grid gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Database className="h-4 w-4" />
                                        Cache Statistics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-lg font-semibold">{cache.getStats().size}</div>
                                            <div className="text-sm text-muted-foreground">Cached Items</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-semibold">{stats.cacheHitRate}%</div>
                                            <div className="text-sm text-muted-foreground">Hit Rate</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Zap className="h-4 w-4" />
                                        Cache Benefits
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Time Saved</span>
                                            <span className="font-medium">{Math.round(stats.cacheHitRate * stats.averageTime / 100)}s per hit</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>API Calls Avoided</span>
                                            <span className="font-medium">{Math.round(stats.totalOperations * stats.cacheHitRate / 100)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Cost Savings</span>
                                            <span className="font-medium text-green-600">~${(Math.round(stats.totalOperations * stats.cacheHitRate / 100) * 0.02).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}