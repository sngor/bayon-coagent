'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, Zap, Database } from 'lucide-react';
import { performanceMonitor } from '@/lib/performance';
// import { cache } from '@/lib/cache';
import { analytics } from '@/lib/analytics';
import { useState, useEffect } from 'react';

export function DashboardPerformanceSection() {
    const [stats, setStats] = useState({
        totalOperations: 0,
        averageTime: 0,
        successRate: 0,
        cacheHitRate: 0
    });

    useEffect(() => {
        const updateStats = () => {
            const aiMetrics = analytics.getAIUsageMetrics();
            // const cacheStats = cache.getStats();
            const cacheStats = { size: 0, totalHits: 0, averageAge: 0 };

            // Calculate cache hit rate
            const cacheHitRate = cacheStats.totalHits > 0
                ? Math.round((cacheStats.totalHits / (cacheStats.totalHits + aiMetrics.totalGenerations)) * 100)
                : 0;

            setStats({
                totalOperations: aiMetrics.totalGenerations,
                averageTime: Math.round(aiMetrics.averageGenerationTime / 1000),
                successRate: Math.round(100 - aiMetrics.errorRate),
                cacheHitRate
            });
        };

        updateStats();
        const interval = setInterval(updateStats, 10000); // Update every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
        if (value >= thresholds.good) return 'text-green-600';
        if (value >= thresholds.warning) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-blue-500/5 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-3xl" />
            <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    AI Performance
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                        <div className="text-xl font-bold text-blue-600">
                            {stats.totalOperations}
                        </div>
                        <div className="text-xs text-muted-foreground">Operations</div>
                    </div>

                    <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                        <div className={`text-xl font-bold ${getStatusColor(stats.successRate, { good: 95, warning: 85 })}`}>
                            {stats.successRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>

                    <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                        <div className={`text-xl font-bold ${getStatusColor(100 - stats.averageTime, { good: 85, warning: 70 })}`}>
                            {stats.averageTime}s
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Time</div>
                    </div>

                    <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                        <div className={`text-xl font-bold ${getStatusColor(stats.cacheHitRate, { good: 30, warning: 15 })}`}>
                            {stats.cacheHitRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">Cache Hits</div>
                    </div>
                </div>

                {/* Performance Insights */}
                <div className="mt-4 p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Performance Insights</span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                        {stats.cacheHitRate > 20 && (
                            <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-green-500" />
                                <span>Cache is saving ~{Math.round(stats.cacheHitRate * stats.averageTime / 100)}s per hit</span>
                            </div>
                        )}
                        {stats.successRate >= 95 && (
                            <div className="flex items-center gap-1">
                                <Activity className="h-3 w-3 text-green-500" />
                                <span>Excellent reliability - {stats.successRate}% success rate</span>
                            </div>
                        )}
                        {stats.averageTime <= 5 && (
                            <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-green-500" />
                                <span>Fast response times - averaging {stats.averageTime}s</span>
                            </div>
                        )}
                        {/* {cache.getStats().size > 0 && ( */}
                        {false && (
                            <div className="flex items-center gap-1">
                                <Database className="h-3 w-3 text-blue-500" />
                                <span>{/* {cache.getStats().size} */}0 items cached for faster access</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}