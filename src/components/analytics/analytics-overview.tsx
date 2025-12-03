'use client';

/**
 * Analytics Overview Component
 * 
 * Main analytics dashboard that combines performance, cost, and ROI metrics
 * with real-time updates and report generation capabilities.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AnimatedTabs as Tabs,
    AnimatedTabsContent as TabsContent,
    AnimatedTabsList as TabsList,
    AnimatedTabsTrigger as TabsTrigger,
} from '@/components/ui/animated-tabs';
import {
    RefreshCw,
    Download,
    Calendar,
    TrendingUp,
    DollarSign,
    Target,
    Activity,
    AlertCircle,
} from 'lucide-react';
import { PerformanceDashboard } from './performance-dashboard';
import { CostDashboard } from './cost-dashboard';
import { ROIDashboard } from './roi-dashboard';
import type {
    PerformanceAnalytics,
    CostBreakdown,
    ROIReport,
    Anomaly,
    CostAlert,
    CostOptimization,
    ReportType,
} from '@/aws/bedrock/analytics/types';

interface AnalyticsOverviewProps {
    /** User ID for user-specific analytics (optional for admin view) */
    userId?: string;
    /** Whether this is an admin view */
    isAdmin?: boolean;
    /** Callbacks for data fetching */
    onFetchPerformance?: (timeframe: string) => Promise<PerformanceAnalytics>;
    onFetchCosts?: (timeframe: string) => Promise<CostBreakdown>;
    onFetchROI?: (timeframe: string) => Promise<ROIReport>;
    onFetchAnomalies?: (timeframe: string) => Promise<Anomaly[]>;
    onFetchAlerts?: (timeframe: string) => Promise<CostAlert[]>;
    onFetchOptimizations?: () => Promise<CostOptimization[]>;
    onGenerateReport?: (type: ReportType, timeframe: string) => Promise<void>;
}

export function AnalyticsOverview({
    userId,
    isAdmin = false,
    onFetchPerformance,
    onFetchCosts,
    onFetchROI,
    onFetchAnomalies,
    onFetchAlerts,
    onFetchOptimizations,
    onGenerateReport,
}: AnalyticsOverviewProps) {
    const [timeframe, setTimeframe] = useState('7d');
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [autoRefresh, setAutoRefresh] = useState(false);

    // State for analytics data
    const [performanceData, setPerformanceData] = useState<PerformanceAnalytics>({
        totalTasks: 0,
        avgExecutionTime: 0,
        totalTokens: 0,
        totalCost: 0,
        successRate: 0,
        avgSatisfaction: 0,
        avgQualityScore: 0,
        byStrand: {},
        byTaskType: {},
        timeSeries: [],
    });

    const [costData, setCostData] = useState<CostBreakdown>({
        total: 0,
        breakdown: {},
        period: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
        },
        topDrivers: [],
    });

    const [roiData, setRoiData] = useState<ROIReport>({
        id: '',
        title: 'ROI Report',
        period: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
        },
        totalInvestment: 0,
        totalReturn: 0,
        overallROI: 0,
        byContentType: {},
        byStrand: {},
        topPerformers: [],
        bottomPerformers: [],
        insights: [],
        recommendations: [],
        generatedAt: new Date().toISOString(),
    });

    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [alerts, setAlerts] = useState<CostAlert[]>([]);
    const [optimizations, setOptimizations] = useState<CostOptimization[]>([]);

    // Fetch all data
    const fetchAllData = async () => {
        setLoading(true);
        try {
            const promises = [];

            if (onFetchPerformance) {
                promises.push(
                    onFetchPerformance(timeframe).then(data => setPerformanceData(data))
                );
            }

            if (onFetchCosts) {
                promises.push(onFetchCosts(timeframe).then(data => setCostData(data)));
            }

            if (onFetchROI) {
                promises.push(onFetchROI(timeframe).then(data => setRoiData(data)));
            }

            if (onFetchAnomalies) {
                promises.push(onFetchAnomalies(timeframe).then(data => setAnomalies(data)));
            }

            if (onFetchAlerts) {
                promises.push(onFetchAlerts(timeframe).then(data => setAlerts(data)));
            }

            if (onFetchOptimizations) {
                promises.push(onFetchOptimizations().then(data => setOptimizations(data)));
            }

            await Promise.all(promises);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error fetching analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchAllData();
    }, [timeframe]);

    // Auto-refresh
    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(fetchAllData, 30000); // 30 seconds
            return () => clearInterval(interval);
        }
    }, [autoRefresh, timeframe]);

    const handleGenerateReport = async (type: ReportType) => {
        if (onGenerateReport) {
            setLoading(true);
            try {
                await onGenerateReport(type, timeframe);
            } catch (error) {
                console.error('Error generating report:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const criticalIssues = anomalies.filter(a => a.severity === 'critical').length +
        alerts.filter(a => a.severity === 'high').length;

    return (
        <div className="space-y-6">
            {/* Header with Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">
                        {isAdmin ? 'System Analytics' : 'My Analytics'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={timeframe} onValueChange={setTimeframe}>
                        <SelectTrigger className="w-40">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAllData}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>

                    <Button
                        variant={autoRefresh ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        <Activity className="h-4 w-4 mr-2" />
                        {autoRefresh ? 'Live' : 'Auto'}
                    </Button>
                </div>
            </div>

            {/* Status Banner */}
            {criticalIssues > 0 && (
                <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <div>
                                <div className="font-medium text-red-600">
                                    {criticalIssues} Critical Issues Detected
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Review the Performance and Cost tabs for details
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {performanceData.totalTasks.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {timeframe === '24h' ? 'Today' : `Last ${timeframe}`}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${costData.total.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            AI operations cost
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall ROI</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${roiData.overallROI > 100
                                ? 'text-green-600'
                                : roiData.overallROI > 0
                                    ? 'text-blue-600'
                                    : 'text-red-600'
                            }`}>
                            {roiData.overallROI.toFixed(0)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Return on investment
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(performanceData.successRate * 100).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Task completion rate
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Analytics Tabs */}
            <Tabs defaultValue="performance" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="performance">
                        Performance
                        {anomalies.length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {anomalies.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="costs">
                        Costs
                        {alerts.length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {alerts.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="roi">ROI</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="performance">
                    <PerformanceDashboard
                        analytics={performanceData}
                        anomalies={anomalies}
                        loading={loading}
                        refreshInterval={autoRefresh ? 30000 : 0}
                        onRefresh={fetchAllData}
                    />
                </TabsContent>

                <TabsContent value="costs">
                    <CostDashboard
                        breakdown={costData}
                        alerts={alerts}
                        optimizations={optimizations}
                        loading={loading}
                    />
                </TabsContent>

                <TabsContent value="roi">
                    <ROIDashboard report={roiData} loading={loading} />
                </TabsContent>

                <TabsContent value="reports">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generate Reports</CardTitle>
                            <CardDescription>
                                Create detailed analytics reports for the selected time period
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Button
                                    variant="outline"
                                    className="h-auto flex-col items-start p-4"
                                    onClick={() => handleGenerateReport('daily-summary')}
                                    disabled={loading}
                                >
                                    <div className="font-medium mb-1">Daily Summary</div>
                                    <div className="text-sm text-muted-foreground text-left">
                                        Performance metrics for the past 24 hours
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto flex-col items-start p-4"
                                    onClick={() => handleGenerateReport('weekly-summary')}
                                    disabled={loading}
                                >
                                    <div className="font-medium mb-1">Weekly Summary</div>
                                    <div className="text-sm text-muted-foreground text-left">
                                        Performance metrics for the past 7 days
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto flex-col items-start p-4"
                                    onClick={() => handleGenerateReport('cost-analysis')}
                                    disabled={loading}
                                >
                                    <div className="font-medium mb-1">Cost Analysis</div>
                                    <div className="text-sm text-muted-foreground text-left">
                                        Detailed cost breakdown by dimension
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto flex-col items-start p-4"
                                    onClick={() => handleGenerateReport('quality-trends')}
                                    disabled={loading}
                                >
                                    <div className="font-medium mb-1">Quality Trends</div>
                                    <div className="text-sm text-muted-foreground text-left">
                                        Output quality analysis over time
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto flex-col items-start p-4"
                                    onClick={() => handleGenerateReport('bottleneck-analysis')}
                                    disabled={loading}
                                >
                                    <div className="font-medium mb-1">Bottleneck Analysis</div>
                                    <div className="text-sm text-muted-foreground text-left">
                                        Identify performance bottlenecks
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto flex-col items-start p-4"
                                    onClick={() => handleGenerateReport('user-satisfaction')}
                                    disabled={loading}
                                >
                                    <div className="font-medium mb-1">User Satisfaction</div>
                                    <div className="text-sm text-muted-foreground text-left">
                                        Analysis of user satisfaction scores
                                    </div>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
