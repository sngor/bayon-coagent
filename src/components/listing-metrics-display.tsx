/**
 * Listing Metrics Display Component
 * 
 * Displays performance metrics for a listing with time period selection.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, Share2, MessageSquare, TrendingUp, Facebook, Instagram, Linkedin } from 'lucide-react';
import { getAggregatedMetrics } from '@/app/performance-metrics-actions';
import { AggregatedMetrics, TimePeriod } from '@/lib/performance-metrics-types';

interface ListingMetricsDisplayProps {
    userId: string;
    listingId: string;
    className?: string;
}

export function ListingMetricsDisplay({
    userId,
    listingId,
    className,
}: ListingMetricsDisplayProps) {
    const [period, setPeriod] = useState<TimePeriod>('weekly');
    const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadMetrics();
    }, [userId, listingId, period]);

    const loadMetrics = async () => {
        setLoading(true);
        setError(null);

        const result = await getAggregatedMetrics(userId, listingId, period);

        if (result.error) {
            setError(result.error);
        } else {
            setMetrics(result.metrics);
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Loading metrics...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription className="text-destructive">{error}</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!metrics) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>No metrics available</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'facebook':
                return <Facebook className="h-4 w-4" />;
            case 'instagram':
                return <Instagram className="h-4 w-4" />;
            case 'linkedin':
                return <Linkedin className="h-4 w-4" />;
            default:
                return null;
        }
    };

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Performance Metrics</CardTitle>
                        <CardDescription>
                            {metrics.startDate} to {metrics.endDate}
                        </CardDescription>
                    </div>
                    <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
                        <TabsList>
                            <TabsTrigger value="daily">Today</TabsTrigger>
                            <TabsTrigger value="weekly">7 Days</TabsTrigger>
                            <TabsTrigger value="monthly">30 Days</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Overall Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-3 p-4 border rounded-lg">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Views</p>
                                <p className="text-2xl font-bold">{metrics.totalViews}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border rounded-lg">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                <Share2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Shares</p>
                                <p className="text-2xl font-bold">{metrics.totalShares}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border rounded-lg">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Inquiries</p>
                                <p className="text-2xl font-bold">{metrics.totalInquiries}</p>
                            </div>
                        </div>
                    </div>

                    {/* Platform Breakdown */}
                    {Object.keys(metrics.byPlatform).length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                By Platform
                            </h3>
                            <div className="space-y-3">
                                {Object.entries(metrics.byPlatform).map(([platform, platformMetrics]) => (
                                    <div
                                        key={platform}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            {getPlatformIcon(platform)}
                                            <span className="font-medium capitalize">{platform}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Eye className="h-3 w-3 text-muted-foreground" />
                                                <span>{platformMetrics.views}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Share2 className="h-3 w-3 text-muted-foreground" />
                                                <span>{platformMetrics.shares}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                                <span>{platformMetrics.inquiries}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Daily Breakdown (for weekly/monthly views) */}
                    {period !== 'daily' && metrics.dailyBreakdown && metrics.dailyBreakdown.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium mb-3">Daily Breakdown</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {metrics.dailyBreakdown
                                    .filter((day) => day.views > 0 || day.shares > 0 || day.inquiries > 0)
                                    .map((day) => (
                                        <div
                                            key={day.date}
                                            className="flex items-center justify-between p-2 text-sm border-b last:border-b-0"
                                        >
                                            <span className="text-muted-foreground">{day.date}</span>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="secondary" className="gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    {day.views}
                                                </Badge>
                                                <Badge variant="secondary" className="gap-1">
                                                    <Share2 className="h-3 w-3" />
                                                    {day.shares}
                                                </Badge>
                                                <Badge variant="secondary" className="gap-1">
                                                    <MessageSquare className="h-3 w-3" />
                                                    {day.inquiries}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
