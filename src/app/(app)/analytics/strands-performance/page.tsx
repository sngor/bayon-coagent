'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Activity,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle,
    AlertTriangle,
    Users,
    Zap,
    Brain,
    BarChart3,
    RefreshCw,
    Download,
    Settings
} from 'lucide-react';

interface PerformanceMetrics {
    avgResponseTime: number;
    avgQualityScore: number;
    avgSuccessRate: number;
    totalTokenUsage: number;
    avgUserSatisfaction: number;
    totalUsage: number;
    servicesMonitored: number;
}

interface ServiceMetrics {
    serviceType: string;
    metrics: {
        responseTime: { avg: number; p95: number; p99: number };
        qualityScore: { avg: number; min: number; max: number };
        successRate: number;
        tokenUsage: { avg: number; total: number };
        userSatisfaction: number;
        usageCount: number;
    };
    trends: {
        responseTime: 'improving' | 'stable' | 'declining';
        qualityScore: 'improving' | 'stable' | 'declining';
        successRate: 'improving' | 'stable' | 'declining';
        userSatisfaction: 'improving' | 'stable' | 'declining';
    };
}

interface AnalyticsData {
    timeRange: string;
    summary: PerformanceMetrics;
    services: Record<string, ServiceMetrics>;
    trends: {
        overall: 'improving' | 'stable' | 'declining' | 'no-data';
        improving: string[];
        declining: string[];
        stable: string[];
        insights: string[];
    };
    recommendations: string[];
}

export default function StrandsPerformanceAnalytics() {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [timeRange, setTimeRange] = useState('24h');
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Mock data for demonstration
    const mockAnalyticsData: AnalyticsData = {
        timeRange: '24h',
        summary: {
            avgResponseTime: 42000,
            avgQualityScore: 87.3,
            avgSuccessRate: 96.8,
            totalTokenUsage: 145000,
            avgUserSatisfaction: 4.4,
            totalUsage: 342,
            servicesMonitored: 7,
        },
        services: {
            'research-agent': {
                serviceType: 'research-agent',
                metrics: {
                    responseTime: { avg: 48000, p95: 62000, p99: 78000 },
                    qualityScore: { avg: 85.2, min: 78.0, max: 92.0 },
                    successRate: 97.2,
                    tokenUsage: { avg: 9200, total: 28000 },
                    userSatisfaction: 4.3,
                    usageCount: 67,
                },
                trends: {
                    responseTime: 'improving',
                    qualityScore: 'stable',
                    successRate: 'improving',
                    userSatisfaction: 'improving',
                },
            },
            'content-studio': {
                serviceType: 'content-studio',
                metrics: {
                    responseTime: { avg: 38000, p95: 49000, p99: 61000 },
                    qualityScore: { avg: 89.1, min: 82.0, max: 95.0 },
                    successRate: 98.1,
                    tokenUsage: { avg: 6800, total: 34000 },
                    userSatisfaction: 4.5,
                    usageCount: 89,
                },
                trends: {
                    responseTime: 'stable',
                    qualityScore: 'improving',
                    successRate: 'stable',
                    userSatisfaction: 'improving',
                },
            },
            'listing-description': {
                serviceType: 'listing-description',
                metrics: {
                    responseTime: { avg: 28000, p95: 36000, p99: 44000 },
                    qualityScore: { avg: 91.4, min: 85.0, max: 97.0 },
                    successRate: 98.9,
                    tokenUsage: { avg: 5200, total: 21000 },
                    userSatisfaction: 4.6,
                    usageCount: 54,
                },
                trends: {
                    responseTime: 'improving',
                    qualityScore: 'improving',
                    successRate: 'stable',
                    userSatisfaction: 'stable',
                },
            },
            'market-intelligence': {
                serviceType: 'market-intelligence',
                metrics: {
                    responseTime: { avg: 62000, p95: 81000, p99: 98000 },
                    qualityScore: { avg: 84.7, min: 76.0, max: 91.0 },
                    successRate: 95.3,
                    tokenUsage: { avg: 11500, total: 23000 },
                    userSatisfaction: 4.2,
                    usageCount: 43,
                },
                trends: {
                    responseTime: 'stable',
                    qualityScore: 'improving',
                    successRate: 'declining',
                    userSatisfaction: 'stable',
                },
            },
            'brand-strategy': {
                serviceType: 'brand-strategy',
                metrics: {
                    responseTime: { avg: 75000, p95: 98000, p99: 120000 },
                    qualityScore: { avg: 86.8, min: 79.0, max: 93.0 },
                    successRate: 96.1,
                    tokenUsage: { avg: 12800, total: 19000 },
                    userSatisfaction: 4.3,
                    usageCount: 31,
                },
                trends: {
                    responseTime: 'improving',
                    qualityScore: 'stable',
                    successRate: 'stable',
                    userSatisfaction: 'improving',
                },
            },
            'image-analysis': {
                serviceType: 'image-analysis',
                metrics: {
                    responseTime: { avg: 35000, p95: 45000, p99: 56000 },
                    qualityScore: { avg: 88.9, min: 81.0, max: 94.0 },
                    successRate: 97.8,
                    tokenUsage: { avg: 6100, total: 12000 },
                    userSatisfaction: 4.4,
                    usageCount: 28,
                },
                trends: {
                    responseTime: 'stable',
                    qualityScore: 'improving',
                    successRate: 'improving',
                    userSatisfaction: 'stable',
                },
            },
            'agent-orchestration': {
                serviceType: 'agent-orchestration',
                metrics: {
                    responseTime: { avg: 210000, p95: 273000, p99: 336000 },
                    qualityScore: { avg: 90.2, min: 84.0, max: 96.0 },
                    successRate: 94.7,
                    tokenUsage: { avg: 28000, total: 56000 },
                    userSatisfaction: 4.5,
                    usageCount: 18,
                },
                trends: {
                    responseTime: 'improving',
                    qualityScore: 'improving',
                    successRate: 'stable',
                    userSatisfaction: 'improving',
                },
            },
        },
        trends: {
            overall: 'improving',
            improving: ['research-agent', 'content-studio', 'listing-description', 'brand-strategy'],
            declining: ['market-intelligence'],
            stable: ['image-analysis', 'agent-orchestration'],
            insights: [
                '4 services showing improvement over 24h',
                '1 service needs attention',
                'Overall system performance trending upward',
                'User satisfaction above 4.0 across all services'
            ],
        },
        recommendations: [
            'Monitor market-intelligence service - success rate declining',
            'Optimize agent-orchestration response time - currently 3.5 minutes',
            'Consider caching for frequently requested content types',
            'User satisfaction excellent - maintain current quality standards',
            'Token usage within acceptable limits - no optimization needed',
        ],
    };

    useEffect(() => {
        loadAnalytics();
    }, [timeRange]);

    const loadAnalytics = async () => {
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setAnalyticsData(mockAnalyticsData);
            setLastUpdated(new Date());
            setIsLoading(false);
        }, 1000);
    };

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving':
                return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'declining':
                return <TrendingDown className="h-4 w-4 text-red-500" />;
            default:
                return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
        if (value >= thresholds.good) return 'text-green-600';
        if (value >= thresholds.warning) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Loading performance analytics...</p>
                </div>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-yellow-600" />
                    <p className="text-gray-600">Unable to load analytics data</p>
                    <Button onClick={loadAnalytics} className="mt-4">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-blue-600" />
                        Strands Performance Analytics
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Real-time monitoring and insights for all AI agents
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1h">Last Hour</SelectItem>
                            <SelectItem value="24h">Last 24h</SelectItem>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={loadAnalytics} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>

                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                                <p className={`text-2xl font-bold ${getStatusColor(analyticsData.summary.avgResponseTime, { good: 30000, warning: 60000 })}`}>
                                    {formatDuration(analyticsData.summary.avgResponseTime)}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                                <p className={`text-2xl font-bold ${getStatusColor(analyticsData.summary.avgSuccessRate, { good: 95, warning: 90 })}`}>
                                    {analyticsData.summary.avgSuccessRate.toFixed(1)}%
                                </p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Quality Score</p>
                                <p className={`text-2xl font-bold ${getStatusColor(analyticsData.summary.avgQualityScore, { good: 85, warning: 75 })}`}>
                                    {analyticsData.summary.avgQualityScore.toFixed(1)}%
                                </p>
                            </div>
                            <Zap className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">User Satisfaction</p>
                                <p className={`text-2xl font-bold ${getStatusColor(analyticsData.summary.avgUserSatisfaction, { good: 4.0, warning: 3.5 })}`}>
                                    {analyticsData.summary.avgUserSatisfaction.toFixed(1)}/5
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Analytics */}
            <Tabs defaultValue="services" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="services">Service Performance</TabsTrigger>
                    <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                </TabsList>

                <TabsContent value="services" className="space-y-4">
                    <div className="grid gap-4">
                        {Object.values(analyticsData.services).map((service) => (
                            <Card key={service.serviceType}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Brain className="h-5 w-5 text-blue-600" />
                                            <CardTitle className="capitalize">
                                                {service.serviceType.replace('-', ' ')}
                                            </CardTitle>
                                        </div>
                                        <Badge variant={service.metrics.successRate > 95 ? 'default' : 'secondary'}>
                                            {service.metrics.usageCount} uses
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Response Time</span>
                                                {getTrendIcon(service.trends.responseTime)}
                                            </div>
                                            <p className="text-lg font-semibold">
                                                {formatDuration(service.metrics.responseTime.avg)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                P95: {formatDuration(service.metrics.responseTime.p95)}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Quality Score</span>
                                                {getTrendIcon(service.trends.qualityScore)}
                                            </div>
                                            <p className="text-lg font-semibold">
                                                {service.metrics.qualityScore.avg.toFixed(1)}%
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Range: {service.metrics.qualityScore.min}-{service.metrics.qualityScore.max}%
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Success Rate</span>
                                                {getTrendIcon(service.trends.successRate)}
                                            </div>
                                            <p className="text-lg font-semibold">
                                                {service.metrics.successRate.toFixed(1)}%
                                            </p>
                                            <Progress
                                                value={service.metrics.successRate}
                                                className="h-2"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Satisfaction</span>
                                                {getTrendIcon(service.trends.userSatisfaction)}
                                            </div>
                                            <p className="text-lg font-semibold">
                                                {service.metrics.userSatisfaction.toFixed(1)}/5
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Tokens: {service.metrics.tokenUsage.avg.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="trends" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    Performance Trends
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant={analyticsData.trends.overall === 'improving' ? 'default' : 'secondary'}>
                                            {analyticsData.trends.overall.toUpperCase()}
                                        </Badge>
                                        <span className="text-sm text-gray-600">Overall Trend</span>
                                    </div>
                                </div>

                                {analyticsData.trends.improving.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-green-600 mb-2">Improving Services</p>
                                        <div className="space-y-1">
                                            {analyticsData.trends.improving.map((service) => (
                                                <div key={service} className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                                    <span className="text-sm capitalize">{service.replace('-', ' ')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {analyticsData.trends.declining.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-red-600 mb-2">Needs Attention</p>
                                        <div className="space-y-1">
                                            {analyticsData.trends.declining.map((service) => (
                                                <div key={service} className="flex items-center gap-2">
                                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                                    <span className="text-sm capitalize">{service.replace('-', ' ')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Brain className="h-5 w-5 text-blue-600" />
                                    Key Insights
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {analyticsData.trends.insights.map((insight, index) => (
                                        <div key={index} className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm text-gray-700">{insight}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-orange-600" />
                                Performance Recommendations
                            </CardTitle>
                            <CardDescription>
                                AI-generated recommendations to optimize system performance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analyticsData.recommendations.map((recommendation, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-700">{recommendation}</p>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            Apply
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleString()} •
                Monitoring {analyticsData.summary.servicesMonitored} AI agents •
                {analyticsData.summary.totalUsage.toLocaleString()} total operations
            </div>
        </div>
    );
}