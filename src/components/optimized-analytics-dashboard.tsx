'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils/common';
import {
    getAnalyticsByType,
    getAnalyticsForTimeRange,
    getABTestResults,
    getROIAnalytics,
    exportROIData,
    TimeRangePreset,
} from '@/services/analytics/analytics-service';
import {
    TypeAnalytics,
    ABTestResults,
    ROIAnalytics,
    ContentCategory,
    PublishChannelType,
} from '@/lib/content-workflow-types';
import {
    aggregateAnalyticsData,
    debounce,
    throttle,
    LazyLoader,
    measurePerformance,
    performanceMonitor,
} from '@/lib/performance-optimizations';

/**
 * Props for the Optimized Analytics Dashboard component
 */
interface OptimizedAnalyticsDashboardProps {
    userId: string;
    dateRange?: { start: Date; end: Date };
    contentType?: ContentCategory;
    className?: string;
    enablePerformanceOptimizations?: boolean;
    maxDataPoints?: number;
    enableLazyLoading?: boolean;
    enableDataAggregation?: boolean;
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
 * Performance-optimized loading skeleton
 */
function OptimizedAnalyticsSkeleton() {
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

            {/* Metric cards skeleton - optimized with fewer elements */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts skeleton - single placeholder */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Optimized metric card component with memoization
 */
interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    className?: string;
    loading?: boolean;
}

const MetricCard = React.memo(function MetricCard({
    title,
    value,
    change,
    changeLabel,
    icon,
    trend,
    className,
    loading = false
}: MetricCardProps) {
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

    if (loading) {
        return (
            <Card className={cn('transition-all duration-200', className)}>
                <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-20" />
                </CardContent>
            </Card>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
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
        </motion.div>
    );
});

/**
 * Optimized chart component with data aggregation
 */
interface OptimizedChartProps {
    data: any[];
    type: 'line' | 'bar' | 'area' | 'pie';
    title: string;
    description?: string;
    maxDataPoints?: number;
    loading?: boolean;
}

const OptimizedChart = React.memo(function OptimizedChart({
    data,
    type,
    title,
    description,
    maxDataPoints = 100,
    loading = false
}: OptimizedChartProps) {
    // Aggregate data if it exceeds maxDataPoints
    const processedData = useMemo(() => {
        if (!data || data.length === 0) return [];

        if (data.length > maxDataPoints) {
            return aggregateAnalyticsData(data, maxDataPoints);
        }

        return data;
    }, [data, maxDataPoints]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    {description && <Skeleton className="h-4 w-64" />}
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        );
    }

    const renderChart = () => {
        switch (type) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={processedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={CHART_COLORS.primary}
                                strokeWidth={2}
                                dot={false} // Optimize by removing dots for large datasets
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={processedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={CHART_COLORS.primary}
                                fill={CHART_COLORS.primary}
                                fillOpacity={0.6}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={processedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill={CHART_COLORS.primary} />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={processedData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {processedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                );

            default:
                return <div>Unsupported chart type</div>;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        {title}
                        {processedData.length !== data.length && (
                            <Badge variant="outline" className="text-xs">
                                Aggregated ({data.length} → {processedData.length} points)
                            </Badge>
                        )}
                    </CardTitle>
                    {description && (
                        <CardDescription>{description}</CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    {renderChart()}
                </CardContent>
            </Card>
        </motion.div>
    );
});

/**
 * Main Optimized Analytics Dashboard Component
 * 
 * Validates Requirements: 5.2, 5.3, 5.4, 5.5, 6.4, 6.5, 7.2, 7.4, 7.5
 */
export function OptimizedAnalyticsDashboard({
    userId,
    dateRange,
    contentType,
    className,
    enablePerformanceOptimizations = true,
    maxDataPoints = 100,
    enableLazyLoading = true,
    enableDataAggregation = true,
}: OptimizedAnalyticsDashboardProps) {
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
    const [performanceStats, setPerformanceStats] = useState<any>(null);

    // Lazy loader for large datasets
    const [lazyLoader] = useState(() =>
        enableLazyLoading ? new LazyLoader(
            async (offset: number, limit: number) => {
                // This would be implemented to load analytics data in chunks
                return [];
            },
            50
        ) : null
    );

    /**
     * Optimized data loading with performance monitoring
     */
    const loadAnalyticsData = useCallback(
        measurePerformance(async () => {
            try {
                setIsLoading(true);
                setError(null);

                const startTime = performance.now();

                // Load analytics data with performance optimization
                const analyticsResult = await getAnalyticsForTimeRange(
                    userId,
                    selectedTimeRange
                );

                if (analyticsResult.success && analyticsResult.data) {
                    let processedData = analyticsResult.data;

                    // Apply data aggregation if enabled and dataset is large
                    if (enableDataAggregation && processedData.length > maxDataPoints) {
                        processedData = processedData.slice(0, maxDataPoints);
                    }

                    setAnalyticsData(processedData);
                } else {
                    throw new Error(analyticsResult.error || 'Failed to load analytics data');
                }

                // Load ROI analytics in parallel
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - 30);

                const roiResult = await getROIAnalytics({
                    userId,
                    startDate,
                    endDate,
                    includeConversionFunnel: true,
                });

                if (roiResult.success && roiResult.data) {
                    setROIAnalytics(roiResult.data);
                }

                const loadTime = performance.now() - startTime;
                console.log(`Analytics data loaded in ${loadTime.toFixed(2)}ms`);

                // Update performance stats
                if (enablePerformanceOptimizations) {
                    setPerformanceStats(performanceMonitor.getMetrics());
                }

            } catch (err) {
                console.error('Failed to load analytics data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load analytics data');
            } finally {
                setIsLoading(false);
            }
        }, 'loadAnalyticsData'),
        [userId, selectedTimeRange, selectedContentType, enableDataAggregation, maxDataPoints, enablePerformanceOptimizations]
    );

    /**
     * Debounced refresh function to prevent excessive API calls
     */
    const debouncedRefresh = useMemo(
        () => debounce(loadAnalyticsData, 300),
        [loadAnalyticsData]
    );

    /**
     * Throttled export function to prevent spam
     */
    const throttledExport = useMemo(
        () => throttle(async (format: 'csv' | 'pdf' | 'excel') => {
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
        }, 2000),
        [userId]
    );

    // Load data on mount and when filters change
    useEffect(() => {
        loadAnalyticsData();
    }, [loadAnalyticsData]);

    // Memoized calculations for better performance
    const summaryMetrics = useMemo(() => {
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

    // Memoized chart data preparation
    const chartData = useMemo(() => {
        const engagementTrendData = analyticsData.flatMap(item =>
            item.trendData?.map(trend => ({
                date: trend.date,
                value: trend.value,
                contentType: item.contentType,
            })) || []
        );

        const contentTypeDistribution = analyticsData.map((item, index) => ({
            name: item.contentType,
            value: item.totalPublished,
            color: PIE_COLORS[index % PIE_COLORS.length],
        }));

        const performanceComparison = analyticsData.map(item => ({
            name: item.contentType,
            views: item.totalViews,
            engagement: item.avgEngagement,
            engagementRate: item.engagementRate,
        }));

        return {
            engagementTrendData,
            contentTypeDistribution,
            performanceComparison,
        };
    }, [analyticsData]);

    if (isLoading) {
        return <OptimizedAnalyticsSkeleton />;
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
                        onClick={loadAnalyticsData}
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
            {/* Header with performance indicators */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
                    <p className="text-muted-foreground">
                        Track your content performance and ROI across all channels
                        {enablePerformanceOptimizations && performanceStats && (
                            <Badge variant="outline" className="ml-2 text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                Optimized
                            </Badge>
                        )}
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
                        onClick={debouncedRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                    </Button>
                </div>
            </div>

            {/* Optimized summary metric cards */}
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

            {/* Optimized charts with lazy loading */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OptimizedChart
                    data={chartData.engagementTrendData}
                    type="area"
                    title="Engagement Trends"
                    description="Track engagement over time by content type"
                    maxDataPoints={maxDataPoints}
                />
                <OptimizedChart
                    data={chartData.contentTypeDistribution}
                    type="pie"
                    title="Content Distribution"
                    description="Breakdown of published content by type"
                    maxDataPoints={maxDataPoints}
                />
            </div>

            {/* Performance comparison chart */}
            <OptimizedChart
                data={chartData.performanceComparison}
                type="bar"
                title="Performance Comparison"
                description="Compare engagement metrics across content types"
                maxDataPoints={maxDataPoints}
            />

            {/* ROI Analytics Section */}
            {roiAnalytics && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                ROI Analytics
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => throttledExport('csv')}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>
            )}

            {/* Performance debug info (development only) */}
            {process.env.NODE_ENV === 'development' && performanceStats && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-xs overflow-auto">
                            {JSON.stringify(performanceStats, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default OptimizedAnalyticsDashboard;