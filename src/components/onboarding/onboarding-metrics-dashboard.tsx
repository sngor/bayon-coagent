'use client';

/**
 * Onboarding Metrics Dashboard Component
 * 
 * Displays comprehensive onboarding metrics including:
 * - Start rate, completion rate, abandonment rate
 * - Step-by-step funnel visualization
 * - Error rates and alarm statuses
 * - Trends and performance indicators
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Users,
    Clock,
    Target,
    Activity
} from 'lucide-react';
import type { OnboardingFlowType } from '@/types/onboarding';

interface MetricValue {
    value: number;
    unit: string;
    timestamp: Date;
    trend?: 'increasing' | 'decreasing' | 'stable';
    previousValue?: number;
}

interface OnboardingMetrics {
    startRate: MetricValue;
    completionRate: MetricValue;
    abandonmentRate: MetricValue;
    averageTimeToComplete: MetricValue;
    stepCompletionRates: Record<string, MetricValue>;
    skipRates: Record<string, MetricValue>;
    resumeRate: MetricValue;
    errorRate: MetricValue;
}

interface FunnelStep {
    stepId: string;
    stepName: string;
    entered: number;
    completed: number;
    skipped: number;
    abandoned: number;
    completionRate: number;
    averageTime: number;
}

interface FunnelData {
    flowType: OnboardingFlowType;
    steps: FunnelStep[];
    overallConversion: number;
    dropoffPoints: Array<{
        stepId: string;
        dropoffRate: number;
    }>;
}

interface AlarmStatus {
    alarmName: string;
    state: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
    reason: string;
    timestamp: Date;
    threshold: number;
    currentValue?: number;
}

interface DashboardData {
    metrics: OnboardingMetrics;
    funnel?: FunnelData;
    alarms?: AlarmStatus[];
    timeRange: {
        start: string;
        end: string;
    };
}

export function OnboardingMetricsDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFlow, setSelectedFlow] = useState<OnboardingFlowType>('user');

    useEffect(() => {
        fetchMetrics();
        // Refresh every 5 minutes
        const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [selectedFlow]);

    async function fetchMetrics() {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/onboarding/metrics?flowType=${selectedFlow}&includeFunnel=true&includeAlarms=true`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch metrics');
            }

            const data = await response.json();
            setData(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading metrics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Onboarding Metrics</h2>
                    <p className="text-sm text-muted-foreground">
                        Monitor onboarding performance and user flow
                    </p>
                </div>
                <Tabs value={selectedFlow} onValueChange={(v) => setSelectedFlow(v as OnboardingFlowType)}>
                    <TabsList>
                        <TabsTrigger value="user">User Flow</TabsTrigger>
                        <TabsTrigger value="admin">Admin Flow</TabsTrigger>
                        <TabsTrigger value="both">Both</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Alarms */}
            {data.alarms && data.alarms.length > 0 && (
                <div className="space-y-2">
                    {data.alarms.map((alarm) => (
                        <Alert
                            key={alarm.alarmName}
                            variant={alarm.state === 'ALARM' ? 'destructive' : 'default'}
                        >
                            {alarm.state === 'OK' ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : alarm.state === 'ALARM' ? (
                                <XCircle className="h-4 w-4" />
                            ) : (
                                <AlertTriangle className="h-4 w-4" />
                            )}
                            <AlertTitle>{alarm.alarmName}</AlertTitle>
                            <AlertDescription>{alarm.reason}</AlertDescription>
                        </Alert>
                    ))}
                </div>
            )}

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Start Rate"
                    value={data.metrics.startRate.value}
                    unit={data.metrics.startRate.unit}
                    icon={Users}
                    trend={data.metrics.startRate.trend}
                />
                <MetricCard
                    title="Completion Rate"
                    value={data.metrics.completionRate.value}
                    unit={data.metrics.completionRate.unit}
                    icon={Target}
                    trend={data.metrics.completionRate.trend}
                    status={getCompletionRateStatus(data.metrics.completionRate.value)}
                />
                <MetricCard
                    title="Abandonment Rate"
                    value={data.metrics.abandonmentRate.value}
                    unit={data.metrics.abandonmentRate.unit}
                    icon={XCircle}
                    trend={data.metrics.abandonmentRate.trend}
                    status={getAbandonmentRateStatus(data.metrics.abandonmentRate.value)}
                />
                <MetricCard
                    title="Avg. Time"
                    value={formatDuration(data.metrics.averageTimeToComplete.value)}
                    unit=""
                    icon={Clock}
                    trend={data.metrics.averageTimeToComplete.trend}
                />
            </div>

            {/* Funnel Visualization */}
            {data.funnel && (
                <Card>
                    <CardHeader>
                        <CardTitle>Onboarding Funnel</CardTitle>
                        <CardDescription>
                            Step-by-step conversion rates (Overall: {data.funnel.overallConversion.toFixed(1)}%)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.funnel.steps.map((step, index) => (
                                <FunnelStepCard key={step.stepId} step={step} index={index} />
                            ))}
                        </div>

                        {/* Dropoff Points */}
                        {data.funnel.dropoffPoints.length > 0 && (
                            <div className="mt-6 pt-6 border-t">
                                <h4 className="text-sm font-semibold mb-3">Highest Dropoff Points</h4>
                                <div className="space-y-2">
                                    {data.funnel.dropoffPoints.slice(0, 3).map((point) => (
                                        <div key={point.stepId} className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{point.stepId}</span>
                                            <Badge variant="destructive">
                                                {point.dropoffRate.toFixed(1)}% dropoff
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Additional Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Error Rate</CardTitle>
                        <CardDescription>Onboarding errors and issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">
                                {data.metrics.errorRate.value.toFixed(1)}%
                            </div>
                            <Badge variant={data.metrics.errorRate.value > 5 ? 'destructive' : 'default'}>
                                {data.metrics.errorRate.value > 5 ? 'High' : 'Normal'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Resume Rate</CardTitle>
                        <CardDescription>Users who resumed after abandoning</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">
                                {data.metrics.resumeRate.value.toFixed(1)}%
                            </div>
                            <TrendIndicator trend={data.metrics.resumeRate.trend} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({
    title,
    value,
    unit,
    icon: Icon,
    trend,
    status,
}: {
    title: string;
    value: number | string;
    unit: string;
    icon: any;
    trend?: 'increasing' | 'decreasing' | 'stable';
    status?: 'good' | 'warning' | 'bad';
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-bold">
                            {typeof value === 'number' ? value.toFixed(0) : value}
                            {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {status && <StatusBadge status={status} />}
                        {trend && <TrendIndicator trend={trend} />}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function FunnelStepCard({ step, index }: { step: FunnelStep; index: number }) {
    const maxWidth = 100;
    const width = step.completionRate;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <span className="font-medium">{index + 1}. {step.stepName}</span>
                    <Badge variant="outline">{step.completionRate.toFixed(1)}%</Badge>
                </div>
                <div className="text-muted-foreground">
                    {step.completed} / {step.entered} users
                </div>
            </div>
            <div className="relative h-8 bg-muted rounded-md overflow-hidden">
                <div
                    className="absolute inset-y-0 left-0 bg-primary transition-all"
                    style={{ width: `${width}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-xs">
                    <span className="font-medium">Completed: {step.completed}</span>
                    {step.skipped > 0 && (
                        <span className="text-muted-foreground">Skipped: {step.skipped}</span>
                    )}
                </div>
            </div>
            <div className="text-xs text-muted-foreground">
                Avg. time: {formatDuration(step.averageTime)}
            </div>
        </div>
    );
}

function TrendIndicator({ trend }: { trend?: 'increasing' | 'decreasing' | 'stable' }) {
    if (!trend) return null;

    if (trend === 'increasing') {
        return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend === 'decreasing') {
        return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
}

function StatusBadge({ status }: { status: 'good' | 'warning' | 'bad' }) {
    const variants = {
        good: 'default',
        warning: 'secondary',
        bad: 'destructive',
    } as const;

    const labels = {
        good: 'Good',
        warning: 'Warning',
        bad: 'Poor',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

function getCompletionRateStatus(rate: number): 'good' | 'warning' | 'bad' {
    if (rate >= 70) return 'good';
    if (rate >= 50) return 'warning';
    return 'bad';
}

function getAbandonmentRateStatus(rate: number): 'good' | 'warning' | 'bad' {
    if (rate <= 20) return 'good';
    if (rate <= 40) return 'warning';
    return 'bad';
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
}
