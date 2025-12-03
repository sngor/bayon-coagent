'use client';

/**
 * Performance Dashboard Component
 * 
 * Displays real-time performance metrics for strand executions including
 * execution time, success rate, quality scores, and anomaly detection.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Activity,
    Clock,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Zap,
    Target,
} from 'lucide-react';
import type {
    PerformanceAnalytics,
    Anomaly,
    PerformanceMetrics,
} from '@/aws/bedrock/analytics/types';

interface PerformanceDashboardProps {
    /** Analytics data to display */
    analytics: PerformanceAnalytics;
    /** Detected anomalies */
    anomalies?: Anomaly[];
    /** Whether data is loading */
    loading?: boolean;
    /** Refresh interval in ms (0 = no auto-refresh) */
    refreshInterval?: number;
    /** Callback when refresh is triggered */
    onRefresh?: () => void;
}

export function PerformanceDashboard({
    analytics,
    anomalies = [],
    loading = false,
    refreshInterval = 0,
    onRefresh,
}: PerformanceDashboardProps) {
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        if (refreshInterval > 0 && onRefresh) {
            const interval = setInterval(() => {
                onRefresh();
                setLastUpdate(new Date());
            }, refreshInterval);

            return () => clearInterval(interval);
        }
    }, [refreshInterval, onRefresh]);

    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    const highAnomalies = anomalies.filter(a => a.severity === 'high');

    return (
        <div className="space-y-6">
            {/* Header with Status */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Performance Dashboard</h2>
                    <p className="text-sm text-muted-foreground">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                    </p>
                </div>
                {anomalies.length > 0 && (
                    <Badge variant="destructive" className="gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        {anomalies.length} Anomalies Detected
                    </Badge>
                )}
            </div>

            {/* Key Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Tasks */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : analytics.totalTasks.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Executed in selected period
                        </p>
                    </CardContent>
                </Card>

                {/* Avg Execution Time */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : `${(analytics.avgExecutionTime / 1000).toFixed(2)}s`}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            {analytics.avgExecutionTime < 3000 ? (
                                <>
                                    <TrendingDown className="h-3 w-3 text-green-600" />
                                    <span className="text-xs text-green-600">Excellent</span>
                                </>
                            ) : analytics.avgExecutionTime < 5000 ? (
                                <>
                                    <CheckCircle className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs text-blue-600">Good</span>
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="h-3 w-3 text-orange-600" />
                                    <span className="text-xs text-orange-600">Needs attention</span>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Success Rate */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : `${(analytics.successRate * 100).toFixed(1)}%`}
                        </div>
                        <Progress
                            value={analytics.successRate * 100}
                            className="mt-2 h-2"
                        />
                    </CardContent>
                </Card>

                {/* Quality Score */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : analytics.avgQualityScore.toFixed(0)}
                        </div>
                        <Progress
                            value={analytics.avgQualityScore}
                            className="mt-2 h-2"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Anomalies Alert */}
            {anomalies.length > 0 && (
                <Card className="border-orange-200 dark:border-orange-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-5 w-5" />
                            Active Anomalies
                        </CardTitle>
                        <CardDescription>
                            {criticalAnomalies.length > 0 && (
                                <span className="text-red-600 font-medium">
                                    {criticalAnomalies.length} critical,{' '}
                                </span>
                            )}
                            {highAnomalies.length > 0 && (
                                <span className="text-orange-600 font-medium">
                                    {highAnomalies.length} high priority
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {anomalies.slice(0, 5).map((anomaly) => (
                                <div
                                    key={anomaly.id}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                                >
                                    <AlertTriangle
                                        className={`h-5 w-5 mt-0.5 ${anomaly.severity === 'critical'
                                                ? 'text-red-600'
                                                : anomaly.severity === 'high'
                                                    ? 'text-orange-600'
                                                    : 'text-yellow-600'
                                            }`}
                                    />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    anomaly.severity === 'critical'
                                                        ? 'destructive'
                                                        : 'secondary'
                                                }
                                            >
                                                {anomaly.severity}
                                            </Badge>
                                            <span className="text-sm font-medium">
                                                {anomaly.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {anomaly.description}
                                        </p>
                                        <div className="text-xs text-muted-foreground">
                                            Component: {anomaly.affectedComponent}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {anomalies.length > 5 && (
                                <p className="text-sm text-muted-foreground text-center">
                                    +{anomalies.length - 5} more anomalies
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Performance by Strand */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance by Strand</CardTitle>
                    <CardDescription>
                        Execution metrics grouped by strand type
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(analytics.byStrand).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No strand data available
                            </p>
                        ) : (
                            Object.entries(analytics.byStrand).map(([strandId, metrics]) => (
                                <StrandMetricRow
                                    key={strandId}
                                    strandId={strandId}
                                    metrics={metrics}
                                />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Performance by Task Type */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance by Task Type</CardTitle>
                    <CardDescription>
                        Execution metrics grouped by task category
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(analytics.byTaskType).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No task data available
                            </p>
                        ) : (
                            Object.entries(analytics.byTaskType).map(([taskType, metrics]) => (
                                <TaskMetricRow
                                    key={taskType}
                                    taskType={taskType}
                                    metrics={metrics}
                                />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Strand metric row component
 */
function StrandMetricRow({
    strandId,
    metrics,
}: {
    strandId: string;
    metrics: PerformanceMetrics;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{strandId}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                        <div className="text-muted-foreground">Exec Time</div>
                        <div className="font-medium">
                            {(metrics.executionTime / 1000).toFixed(2)}s
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-muted-foreground">Quality</div>
                        <div className="font-medium">{metrics.qualityScore.toFixed(0)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-muted-foreground">Success</div>
                        <div className="font-medium">
                            {(metrics.successRate * 100).toFixed(0)}%
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <Progress value={(metrics.executionTime / 10000) * 100} className="h-1" />
                <Progress value={metrics.qualityScore} className="h-1" />
                <Progress value={metrics.successRate * 100} className="h-1" />
            </div>
        </div>
    );
}

/**
 * Task metric row component
 */
function TaskMetricRow({
    taskType,
    metrics,
}: {
    taskType: string;
    metrics: PerformanceMetrics;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">{taskType}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                        <div className="text-muted-foreground">Tokens</div>
                        <div className="font-medium">
                            {metrics.tokenUsage.toLocaleString()}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-muted-foreground">Cost</div>
                        <div className="font-medium">${metrics.cost.toFixed(3)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-muted-foreground">Satisfaction</div>
                        <div className="font-medium">{metrics.userSatisfaction.toFixed(1)}/5</div>
                    </div>
                </div>
            </div>
            <Progress value={(metrics.userSatisfaction / 5) * 100} className="h-1" />
        </div>
    );
}
