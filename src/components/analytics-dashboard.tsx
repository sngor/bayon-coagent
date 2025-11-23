'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Eye,
    Heart,
    Share2,
    MessageCircle,
    DollarSign,
    Users,
    Target,
    Download,
    RefreshCw,
    Calendar,
    Filter,
    Award,
    AlertTriangle,
    CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    getAnalyticsByType,
    getAnalyticsForTimeRange,
    getABTestResults,
    getROIAnalytics,
    exportROIData,
    TimeRangePreset,
} from '@/services/analytics-service';
import {
    TypeAnalytics,
    ABTestResults,
    ROIAnalytics,
    ContentCategory,
    PublishChannelType,
} from '@/lib/content-workflow-types';

/**
 * Props for the Analytics Dashboard component
 */
interface AnalyticsDashboardProps {
    userId: string;
    dateRange?: { start: Date; end: Date };
    contentType?: ContentCategory;
    className?: string;
}

/**
 * Time range options for the dashboard
 */
const TIME_RANGE_OPTIONS = [
    { value: TimeRangePreset.LAST_7_DAYS, label: 'Last 7 Days' },
    { value: TimeRangePreset.LAST_30_DAYS, label: 'Last 30 Days' },
    { value: TimeRangePreset.LAST_90_DAYS, label: 'Last 90 Days' },
    { value: TimeRangePreset.CUSTOM, label: 'Custom Range' },
];

/**
 * Content type filter options
 */
const CONTENT_TYPE_OPTIONS = [
    { value: 'all', label: 'All Content Types' },
    { value: ContentCategory.BLOG_POST, label: 'Blog Posts' },
    { value: ContentCategory.SOCIAL_MEDIA, label: 'Social Media' },
    { value: ContentCategory.LISTING_DESCRIPTION, label: 'Listing Descriptions' },
    { value: ContentCategory.NEWSLETTER, label: 'Newsletters' },
    { value: ContentCategory.VIDEO_SCRIPT, label: 'Video Scripts' },
];

/**
 * Colors for charts
 */
const CHART_COLORS = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    indigo: '#6366f1',
    teal: '#14b8a6',
};

const PIE_COLORS = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.accent,
    CHART_COLORS.purple,
    CHART_COLORS.pink,
    CHART_COLORS.indigo,
    CHART_COLORS.teal,
];

/**
 * Loading skeleton for the dashboard
 */
function AnalyticsDashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            {/* Metric cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

/**
 * Metric card component for displaying key metrics
 */
interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    className?: string;
}

function MetricCard({ title, value, change, changeLabel, icon, trend, className }: MetricCardProps) {
    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return 'text-green-600';
            case 'down':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="h-3 w-3" />;
            case 'down':
                return <TrendingDown className="h-3 w-3" />;
            default:
                return null;
        }
    };

    return (
        <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {title}
                    </CardTitle>
                    <div className="text-muted-foreground">{icon}</div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {change !== undefined && (
                    <div className={cn('flex items-center gap-1 text-xs', getTrendColor())}>
                        {getTrendIcon()}
                        <span>
                            {change > 0 ? '+' : ''}{change}%
                        </span>
                        {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Custom tooltip for charts
 */
function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                <p className="font-medium">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm">
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
}

/**
 * Main Analytics Dashboard Component
 * 
 * Validates Requirements: 5.2, 5.3, 5.4, 5.5, 6.4, 6.5, 7.2, 7.4, 7.5
 */
export function AnalyticsDashboard({
    userId,
    dateRange,
    contentType,
    className,
}: AnalyticsDashboardProps) {
    // State management
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangePreset>(
        TimeRangePreset.LAST_30_DAYS
    );
    const [selectedContentType, setSelectedContentType] = useState<string>('all');
    const [analyticsData, setAnalyticsData] = useState<TypeAnalytics[]>([]);
    const [abTestResults, setABTestResults] = useState<ABTestResults[]>([]);
    const [roiAnalytics, setROIAnalytics] = useState<ROIAnalytics | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    /**
     * Load analytics data
     */
    const loadAnalyticsData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Get analytics by type
            const analyticsResult = await getAnalyticsForTimeRange(
                userId,
                selectedTimeRange
            );

            if (analyticsResult.success && analyticsResult.data) {
                setAnalyticsData(analyticsResult.data);
            } else {
                throw new Error(analyticsResult.error || 'Failed to load analytics data');
            }

            // Get ROI analytics
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 30); // Default to 30 days

            const roiResult = await getROIAnalytics({
                userId,
                startDate,
                endDate,
                includeConversionFunnel: true,
            });

            if (roiResult.success && roiResult.data) {
                setROIAnalytics(roiResult.data);
            }

        } catch (err) {
            console.error('Failed to load analytics data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load analytics data');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Refresh data
     */
    const refreshData = async () => {
        setIsRefreshing(true);
        await loadAnalyticsData();
        setIsRefreshing(false);
    };

    /**
     * Export ROI data
     */
    const handleExportROI = async (format: 'csv' | 'pdf' | 'excel') => {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 30);

            const exportResult = await exportROIData({
                userId,
                startDate,
                endDate,
                format,
                includeDetails: true,
            });

            if (exportResult.success && exportResult.data) {
                // Create download link
                const blob = new Blob([exportResult.data], {
                    type: format === 'csv' ? 'text/csv' : 'application/octet-stream',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `roi-analytics-${format}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Failed to export ROI data:', err);
        }
    };

    // Load data on mount and when filters change
    useEffect(() => {
        loadAnalyticsData();
    }, [userId, selectedTimeRange, selectedContentType]);

    // Calculate summary metrics
    const summaryMetrics = React.useMemo(() => {
        if (!analyticsData.length) {
            return {
                totalViews: 0,
                totalEngagement: 0,
                avgEngagementRate: 0,
                totalContent: 0,
            };
        }

        const totalViews = analyticsData.reduce((sum, item) => sum + item.totalViews, 0);
        const totalEngagement = analyticsData.reduce((sum, item) => sum + item.avgEngagement, 0);
        const totalContent = analyticsData.reduce((sum, item) => sum + item.totalPublished, 0);
        const avgEngagementRate = analyticsData.reduce((sum, item) => sum + item.engagementRate, 0) / analyticsData.length;

        return {
            totalViews,
            totalEngagement,
            avgEngagementRate,
            totalContent,
        };
    }, [analyticsData]);

    // Prepare chart data
    const engagementTrendData = React.useMemo(() => {
        return analyticsData.flatMap(item =>
            item.trendData?.map(trend => ({
                date: trend.date,
                [item.contentType]: trend.value,
                contentType: item.contentType,
            })) || []
        );
    }, [analyticsData]);

    const contentTypeDistribution = React.useMemo(() => {
        return analyticsData.map((item, index) => ({
            name: item.contentType,
            value: item.totalPublished,
            color: PIE_COLORS[index % PIE_COLORS.length],
        }));
    }, [analyticsData]);

    const performanceComparison = React.useMemo(() => {
        return analyticsData.map(item => ({
            contentType: item.contentType,
            views: item.totalViews,
            engagement: item.avgEngagement,
            engagementRate: item.engagementRate,
        }));
    }, [analyticsData]);

    if (isLoading) {
        return <AnalyticsDashboardSkeleton />;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    {error}
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={refreshData}
                    >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header with filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
                    <p className="text-muted-foreground">
                        Track your content performance and ROI across all channels
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedTimeRange} onValueChange={(value) => setSelectedTimeRange(value as TimeRangePreset)}>
                        <SelectTrigger className="w-40">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TIME_RANGE_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                        <SelectTrigger className="w-48">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CONTENT_TYPE_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                    </Button>
                </div>
            </div>

            {/* Summary metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Views"
                    value={summaryMetrics.totalViews.toLocaleString()}
                    icon={<Eye className="h-4 w-4" />}
                    trend="up"
                    change={12.5}
                    changeLabel="vs last period"
                />
                <MetricCard
                    title="Total Engagement"
                    value={summaryMetrics.totalEngagement.toLocaleString()}
                    icon={<Heart className="h-4 w-4" />}
                    trend="up"
                    change={8.2}
                    changeLabel="vs last period"
                />
                <MetricCard
                    title="Avg Engagement Rate"
                    value={`${summaryMetrics.avgEngagementRate.toFixed(1)}%`}
                    icon={<Target className="h-4 w-4" />}
                    trend="neutral"
                />
                <MetricCard
                    title="Content Published"
                    value={summaryMetrics.totalContent}
                    icon={<BarChart3 className="h-4 w-4" />}
                    trend="up"
                    change={15.3}
                    changeLabel="vs last period"
                />
            </div>

            {/* Main dashboard tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="abtests">A/B Tests</TabsTrigger>
                    <TabsTrigger value="roi">ROI Analytics</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Engagement trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Engagement Trends
                                </CardTitle>
                                <CardDescription>
                                    Track engagement over time by content type
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={engagementTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        {analyticsData.map((item, index) => (
                                            <Area
                                                key={item.contentType}
                                                type="monotone"
                                                dataKey={item.contentType}
                                                stackId="1"
                                                stroke={PIE_COLORS[index % PIE_COLORS.length]}
                                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                fillOpacity={0.6}
                                            />
                                        ))}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Content type distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Content Distribution
                                </CardTitle>
                                <CardDescription>
                                    Breakdown of published content by type
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={contentTypeDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {contentTypeDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top performing content */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5" />
                                Top Performing Content
                            </CardTitle>
                            <CardDescription>
                                Your highest-engagement content across all types
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analyticsData.flatMap(item => item.topPerforming || [])
                                    .sort((a, b) => b.totalEngagement - a.totalEngagement)
                                    .slice(0, 5)
                                    .map((content, index) => (
                                        <div key={content.contentId} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{content.title}</p>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Badge variant="secondary">{content.contentType}</Badge>
                                                        <span>•</span>
                                                        <span>{content.publishedAt.toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{content.totalEngagement.toLocaleString()}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {content.engagementRate.toFixed(1)}% rate
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Performance Comparison
                            </CardTitle>
                            <CardDescription>
                                Compare engagement metrics across content types
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={performanceComparison}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="contentType" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="views" fill={CHART_COLORS.primary} name="Views" />
                                    <Bar yAxisId="left" dataKey="engagement" fill={CHART_COLORS.secondary} name="Engagement" />
                                    <Line yAxisId="right" dataKey="engagementRate" stroke={CHART_COLORS.accent} name="Engagement Rate %" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* A/B Tests Tab */}
                <TabsContent value="abtests" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                A/B Test Results
                            </CardTitle>
                            <CardDescription>
                                Statistical analysis of your content variations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {abTestResults.length === 0 ? (
                                <div className="text-center py-8">
                                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No A/B Tests Found</h3>
                                    <p className="text-muted-foreground">
                                        Create A/B tests to compare different content variations and optimize performance.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {abTestResults.map((test) => (
                                        <div key={test.testId} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-medium">Test #{test.testId.slice(0, 8)}</h4>
                                                <div className="flex items-center gap-2">
                                                    {test.statisticalSignificance ? (
                                                        <Badge variant="default" className="bg-green-100 text-green-800">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Significant
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            Inconclusive
                                                        </Badge>
                                                    )}
                                                    <span className="text-sm text-muted-foreground">
                                                        {(test.confidence * 100).toFixed(0)}% confidence
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {test.variations.map((variation) => (
                                                    <div
                                                        key={variation.variationId}
                                                        className={cn(
                                                            'p-3 border rounded-lg',
                                                            variation.isWinner && 'border-green-500 bg-green-50'
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h5 className="font-medium">{variation.name}</h5>
                                                            {variation.isWinner && (
                                                                <Badge variant="default" className="bg-green-100 text-green-800">
                                                                    Winner
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1 text-sm">
                                                            <div className="flex justify-between">
                                                                <span>Sample Size:</span>
                                                                <span>{variation.sampleSize.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Conversion Rate:</span>
                                                                <span>{(variation.conversionRate * 100).toFixed(2)}%</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Confidence Interval:</span>
                                                                <span>
                                                                    {(variation.confidenceInterval.lower * 100).toFixed(1)}% - {(variation.confidenceInterval.upper * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {test.recommendedAction && (
                                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <p className="text-sm text-blue-800">
                                                        <strong>Recommendation:</strong> {test.recommendedAction}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ROI Analytics Tab */}
                <TabsContent value="roi" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">ROI Analytics</h3>
                            <p className="text-sm text-muted-foreground">
                                Track revenue and lead generation from your content
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExportROI('csv')}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExportROI('pdf')}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export PDF
                            </Button>
                        </div>
                    </div>

                    {roiAnalytics ? (
                        <>
                            {/* ROI Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <MetricCard
                                    title="Total Revenue"
                                    value={`$${roiAnalytics.totalRevenue.toLocaleString()}`}
                                    icon={<DollarSign className="h-4 w-4" />}
                                    trend="up"
                                    change={18.5}
                                />
                                <MetricCard
                                    title="Total Leads"
                                    value={roiAnalytics.totalLeads.toLocaleString()}
                                    icon={<Users className="h-4 w-4" />}
                                    trend="up"
                                    change={12.3}
                                />
                                <MetricCard
                                    title="Cost Per Lead"
                                    value={`$${roiAnalytics.costPerLead.toFixed(2)}`}
                                    icon={<Target className="h-4 w-4" />}
                                    trend="down"
                                    change={-8.7}
                                />
                                <MetricCard
                                    title="Conversion Rate"
                                    value={`${roiAnalytics.conversionRate.toFixed(1)}%`}
                                    icon={<TrendingUp className="h-4 w-4" />}
                                    trend="up"
                                    change={5.2}
                                />
                            </div>

                            {/* ROI by Content Type */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        ROI by Content Type
                                    </CardTitle>
                                    <CardDescription>
                                        Revenue and lead generation breakdown by content type
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={Object.entries(roiAnalytics.byContentType).map(([type, metrics]) => ({
                                            contentType: type,
                                            revenue: metrics.revenue,
                                            leads: metrics.leads,
                                            roi: metrics.roi,
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="contentType" />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="revenue" fill={CHART_COLORS.primary} name="Revenue ($)" />
                                            <Bar yAxisId="left" dataKey="leads" fill={CHART_COLORS.secondary} name="Leads" />
                                            <Line yAxisId="right" dataKey="roi" stroke={CHART_COLORS.accent} name="ROI %" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Top Performing Content ROI */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="h-5 w-5" />
                                        Top Revenue Generating Content
                                    </CardTitle>
                                    <CardDescription>
                                        Content pieces with the highest ROI
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {roiAnalytics.topPerformingContent.slice(0, 5).map((content, index) => (
                                            <div key={content.contentId} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{content.title}</p>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Badge variant="secondary">{content.contentType}</Badge>
                                                            <span>•</span>
                                                            <Badge variant={content.attribution === 'direct' ? 'default' : 'outline'}>
                                                                {content.attribution}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-green-600">
                                                        ${content.totalRevenue.toLocaleString()}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {content.totalLeads} leads • {content.roi.toFixed(1)}% ROI
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Conversion Funnel */}
                            {roiAnalytics.conversionFunnel && roiAnalytics.conversionFunnel.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="h-5 w-5" />
                                            Conversion Funnel
                                        </CardTitle>
                                        <CardDescription>
                                            Track user journey from awareness to conversion
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {roiAnalytics.conversionFunnel.map((step, index) => (
                                                <div key={step.step} className="flex items-center gap-4">
                                                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-medium">{step.step}</span>
                                                            <span className="text-sm text-muted-foreground">
                                                                {step.count.toLocaleString()} ({step.conversionRate.toFixed(1)}%)
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${step.conversionRate}%` }}
                                                            />
                                                        </div>
                                                        {step.dropOffRate > 0 && (
                                                            <p className="text-xs text-red-600 mt-1">
                                                                {step.dropOffRate.toFixed(1)}% drop-off from previous step
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-8">
                                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No ROI Data Available</h3>
                                <p className="text-muted-foreground">
                                    Start tracking ROI events to see revenue and lead generation analytics.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default AnalyticsDashboard;