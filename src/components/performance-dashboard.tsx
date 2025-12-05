'use client';

/**
 * Performance Dashboard Component
 * 
 * Displays Core Web Vitals metrics in a visual dashboard.
 * Useful for monitoring and debugging performance.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    getCurrentMetrics,
    formatMetricValue,
    getMetricColor,
    getMetricBgColor,
    type WebVitalMetric,
    WEB_VITALS_THRESHOLDS,
} from '@/lib/web-vitals';
import { Activity, Gauge, Zap, Eye, Clock, MousePointer } from 'lucide-react';

const METRIC_ICONS = {
    LCP: Eye,
    FID: MousePointer,
    CLS: Activity,
    FCP: Zap,
    TTFB: Clock,
    INP: Gauge,
};

const METRIC_DESCRIPTIONS = {
    LCP: 'Largest Contentful Paint - Loading performance',
    FID: 'First Input Delay - Interactivity',
    CLS: 'Cumulative Layout Shift - Visual stability',
    FCP: 'First Contentful Paint - Perceived load speed',
    TTFB: 'Time to First Byte - Server response time',
    INP: 'Interaction to Next Paint - Responsiveness',
};

export function PerformanceDashboard() {
    const [metrics, setMetrics] = useState<WebVitalMetric[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadMetrics() {
            try {
                const currentMetrics = await getCurrentMetrics();
                setMetrics(currentMetrics);
            } catch (error) {
                console.error('Failed to load metrics:', error);
            } finally {
                setLoading(false);
            }
        }

        loadMetrics();

        // Refresh metrics every 10 seconds
        const interval = setInterval(loadMetrics, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Core Web Vitals</CardTitle>
                    <CardDescription>Loading performance metrics...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Core Web Vitals</CardTitle>
                <CardDescription>
                    Real-time performance metrics for the current page
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metrics.map((metric) => {
                        const Icon = METRIC_ICONS[metric.name];
                        const threshold = WEB_VITALS_THRESHOLDS[metric.name];

                        return (
                            <div
                                key={metric.id}
                                className={`p-4 rounded-lg border ${getMetricBgColor(metric.rating)}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-5 w-5" />
                                        <h3 className="font-semibold">{metric.name}</h3>
                                    </div>
                                    <Badge
                                        variant={
                                            metric.rating === 'good'
                                                ? 'default'
                                                : metric.rating === 'needs-improvement'
                                                    ? 'secondary'
                                                    : 'destructive'
                                        }
                                    >
                                        {metric.rating}
                                    </Badge>
                                </div>

                                <div className={`text-2xl font-bold mb-1 ${getMetricColor(metric.rating)}`}>
                                    {formatMetricValue(metric.name, metric.value)}
                                </div>

                                <p className="text-sm text-muted-foreground mb-2">
                                    {METRIC_DESCRIPTIONS[metric.name]}
                                </p>

                                <div className="text-xs text-muted-foreground">
                                    <div>Good: ≤ {formatMetricValue(metric.name, threshold.good)}</div>
                                    <div>
                                        Needs improvement: ≤{' '}
                                        {formatMetricValue(metric.name, threshold.needsImprovement)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">About Core Web Vitals</h4>
                    <p className="text-sm text-muted-foreground">
                        Core Web Vitals are a set of metrics that measure real-world user experience.
                        They are part of Google's page experience signals used in search ranking.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
