'use client';

import React, { useState, useEffect } from 'react';
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

// Import our 3D components
import { Dashboard3DLayout, Grid3DLayout, Section3D } from '@/components/ui/3d-dashboard-layout';
import { Metric3DCard, RevenueMetric3DCard, EngagementMetric3DCard } from '@/components/ui/3d-metric-cards';
import { Chart3DIcon, Target3DIcon, AISparkle3DIcon } from '@/components/ui/3d-interactive-icons';

// Import analytics types and services
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
 * Enhanced Analytics Dashboard with 3D Interactive Elements
 */
interface EnhancedAnalyticsDashboardProps {
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
 * Enhanced colors for 3D charts
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
 * Enhanced 3D Chart Container
 */
const Chart3DContainer: React.FC<{
    children: React.ReactNode;
    title: string;
    description?: string;
    className?: string;
}> = ({ children, title, description, className }) => (
    <motion.div
        className={cn('relative', className)}
        initial={{ opacity: 0, y: 20, rotateX: -5 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={{
            scale: 1.02,
            rotateY: 1,
            transition: { type: "spring", stiffness: 300, damping: 30 }
        }}
        style={{ transformStyle: 'preserve-3d' }}
    >
        <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-gradient-to-br from-background via-background to-muted/20">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <motion.div
                        className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-purple-600/10"
                        animate={{
                            rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Chart3DIcon className="h-5 w-5 text-primary" animated />
                    </motion.div>
                    <div>
                        <CardTitle className="text-lg font-bold">{title}</CardTitle>
                        {description && (
                            <CardDescription className="text-sm">{description}</CardDescription>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="relative">
                {/* 3D depth effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-lg opacity-0"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                />
                <div className="relative z-10">
                    {children}
                </div>
            </CardContent>
        </Card>
    </motion.div>
);

/**
 * Enhanced Custom Tooltip with 3D styling
 */
function Enhanced3DTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <motion.div
                className="bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-2xl p-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.1)',
                }}
            >
                <p className="font-semibold text-foreground mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <motion.p
                        key={index}
                        style={{ color: entry.color }}
                        className="text-sm flex items-center gap-2"
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        {entry.name}: {entry.value}
                    </motion.p>
                ))}
            </motion.div>
        );
    }
    return null;
}

/**
 * Main Enhanced Analytics Dashboard Component
 */
export function EnhancedAnalyticsDashboard({
    userId,
    dateRange,
    contentType,
    className,
}: EnhancedAnalyticsDashboardProps) {
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

    if (error) {
        return (
            <Dashboard3DLayout>
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
            </Dashboard3DLayout>
        );
    }

    return (
        <Dashboard3DLayout
            className={cn('space-y-8', className)}
            enableParallax={true}
            staggerDelay={0.1}
            floatingElements={true}
        >
            {/* Header with filters */}
            <Section3D depth="shallow">
                <div className="flex flex-col sm:flex-row gap-6 justify-between items-start">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Analytics Dashboard
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Track your content performance and ROI across all channels
                        </p>
                    </motion.div>

                    <motion.div
                        className="flex gap-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <Select value={selectedTimeRange} onValueChange={(value) => setSelectedTimeRange(value as TimeRangePreset)}>
                            <SelectTrigger className="w-44 shadow-md hover:shadow-lg transition-shadow">
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
                            <SelectTrigger className="w-52 shadow-md hover:shadow-lg transition-shadow">
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
                            size="default"
                            onClick={refreshData}
                            disabled={isRefreshing}
                            className="shadow-md hover:shadow-lg transition-shadow"
                        >
                            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                        </Button>
                    </motion.div>
                </div>
            </Section3D>

            {/* Summary metric cards with 3D effects */}
            <Section3D depth="medium">
                <Grid3DLayout columns={4} gap="md">
                    <Metric3DCard
                        title="Total Views"
                        value={summaryMetrics.totalViews.toLocaleString()}
                        icon={Eye}
                        trend="up"
                        change={12.5}
                        changeLabel="vs last period"
                        animated
                        intensity="medium"
                        glowColor="#3b82f6"
                    />

                    <EngagementMetric3DCard
                        title="Total Engagement"
                        rate={summaryMetrics.totalEngagement}
                        previousRate={summaryMetrics.totalEngagement * 0.92}
                        icon={Heart}
                        animated
                        intensity="medium"
                    />

                    <EngagementMetric3DCard
                        title="Avg Engagement Rate"
                        rate={summaryMetrics.avgEngagementRate}
                        icon={Target}
                        animated
                        intensity="medium"
                    />

                    <Metric3DCard
                        title="Content Published"
                        value={summaryMetrics.totalContent}
                        icon={BarChart3}
                        trend="up"
                        change={15.3}
                        changeLabel="vs last period"
                        animated
                        intensity="medium"
                        glowColor="#10b981"
                        particleEffect={summaryMetrics.totalContent > 10}
                    />
                </Grid3DLayout>
            </Section3D>

            {/* Main dashboard tabs with 3D styling */}
            <Section3D depth="deep">
                <Tabs defaultValue="overview" className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50 backdrop-blur-sm">
                            <TabsTrigger value="overview" className="text-sm font-medium">Overview</TabsTrigger>
                            <TabsTrigger value="performance" className="text-sm font-medium">Performance</TabsTrigger>
                            <TabsTrigger value="abtests" className="text-sm font-medium">A/B Tests</TabsTrigger>
                            <TabsTrigger value="roi" className="text-sm font-medium">ROI Analytics</TabsTrigger>
                        </TabsList>
                    </motion.div>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-8">
                        <Grid3DLayout columns={2} gap="lg">
                            {/* Engagement trends with 3D styling */}
                            <Chart3DContainer
                                title="Engagement Trends"
                                description="Track engagement over time by content type"
                            >
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart data={engagementTrendData}>
                                        <defs>
                                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
                                                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="currentColor"
                                            fontSize={12}
                                            opacity={0.7}
                                        />
                                        <YAxis
                                            stroke="currentColor"
                                            fontSize={12}
                                            opacity={0.7}
                                        />
                                        <Tooltip content={<Enhanced3DTooltip />} />
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
                            </Chart3DContainer>

                            {/* Content type distribution with 3D styling */}
                            <Chart3DContainer
                                title="Content Distribution"
                                description="Breakdown of published content by type"
                            >
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={contentTypeDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {contentTypeDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<Enhanced3DTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Chart3DContainer>
                        </Grid3DLayout>

                        {/* Top performing content with 3D cards */}
                        <Chart3DContainer
                            title="Top Performing Content"
                            description="Your highest-engagement content across all types"
                        >
                            <div className="space-y-4">
                                {analyticsData.flatMap(item => item.topPerforming || [])
                                    .sort((a, b) => b.totalEngagement - a.totalEngagement)
                                    .slice(0, 5)
                                    .map((content, index) => (
                                        <motion.div
                                            key={content.contentId}
                                            className="flex items-center justify-between p-4 border rounded-xl bg-gradient-to-r from-muted/30 to-transparent hover:from-muted/50 hover:to-muted/20 transition-all duration-300"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: index * 0.1 }}
                                            whileHover={{
                                                scale: 1.02,
                                                x: 4,
                                                transition: { type: "spring", stiffness: 400, damping: 25 }
                                            }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <motion.div
                                                    className="flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-xl text-sm font-bold"
                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                >
                                                    {index + 1}
                                                </motion.div>
                                                <div>
                                                    <p className="font-semibold">{content.title}</p>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                                        <Badge variant="secondary">{content.contentType}</Badge>
                                                        <span>•</span>
                                                        <span>{content.publishedAt.toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">{content.totalEngagement.toLocaleString()}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {content.engagementRate.toFixed(1)}% rate
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                            </div>
                        </Chart3DContainer>
                    </TabsContent>

                    {/* Performance Tab */}
                    <TabsContent value="performance" className="space-y-8">
                        <Chart3DContainer
                            title="Performance Comparison"
                            description="Compare engagement metrics across content types"
                        >
                            <ResponsiveContainer width="100%" height={450}>
                                <BarChart data={analyticsData.map(item => ({
                                    contentType: item.contentType,
                                    views: item.totalViews,
                                    engagement: item.avgEngagement,
                                    engagementRate: item.engagementRate,
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                                    <XAxis dataKey="contentType" stroke="currentColor" fontSize={12} opacity={0.7} />
                                    <YAxis yAxisId="left" stroke="currentColor" fontSize={12} opacity={0.7} />
                                    <YAxis yAxisId="right" orientation="right" stroke="currentColor" fontSize={12} opacity={0.7} />
                                    <Tooltip content={<Enhanced3DTooltip />} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="views" fill={CHART_COLORS.primary} name="Views" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="left" dataKey="engagement" fill={CHART_COLORS.secondary} name="Engagement" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Chart3DContainer>
                    </TabsContent>

                    {/* A/B Tests Tab */}
                    <TabsContent value="abtests" className="space-y-8">
                        <Chart3DContainer
                            title="A/B Test Results"
                            description="Statistical analysis of your content variations"
                        >
                            {abTestResults.length === 0 ? (
                                <div className="text-center py-12">
                                    <Target3DIcon className="h-16 w-16 mx-auto text-muted-foreground mb-6" animated />
                                    <h3 className="text-xl font-semibold mb-3">No A/B Tests Found</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Create A/B tests to compare different content variations and optimize performance.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* A/B test results would be rendered here */}
                                </div>
                            )}
                        </Chart3DContainer>
                    </TabsContent>

                    {/* ROI Analytics Tab */}
                    <TabsContent value="roi" className="space-y-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-semibold">ROI Analytics</h3>
                                <p className="text-muted-foreground">
                                    Track revenue and lead generation from your content
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" size="sm" className="shadow-md hover:shadow-lg transition-shadow">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                </Button>
                                <Button variant="outline" size="sm" className="shadow-md hover:shadow-lg transition-shadow">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export PDF
                                </Button>
                            </div>
                        </div>

                        {roiAnalytics ? (
                            <Grid3DLayout columns={4} gap="md">
                                <RevenueMetric3DCard
                                    title="Total Revenue"
                                    revenue={roiAnalytics.totalRevenue}
                                    previousRevenue={roiAnalytics.totalRevenue * 0.85}
                                    icon={DollarSign}
                                    animated
                                    intensity="medium"
                                />

                                <Metric3DCard
                                    title="Total Leads"
                                    value={roiAnalytics.totalLeads.toLocaleString()}
                                    icon={Users}
                                    trend="up"
                                    change={12.3}
                                    animated
                                    intensity="medium"
                                    glowColor="#10b981"
                                />

                                <Metric3DCard
                                    title="Cost Per Lead"
                                    value={`$${roiAnalytics.costPerLead.toFixed(2)}`}
                                    icon={Target}
                                    trend="down"
                                    change={-8.7}
                                    animated
                                    intensity="medium"
                                    glowColor="#10b981"
                                />

                                <EngagementMetric3DCard
                                    title="Conversion Rate"
                                    rate={roiAnalytics.conversionRate}
                                    previousRate={roiAnalytics.conversionRate * 0.95}
                                    icon={TrendingUp}
                                    animated
                                    intensity="medium"
                                />
                            </Grid3DLayout>
                        ) : (
                            <Chart3DContainer
                                title="No ROI Data Available"
                                description="Start tracking ROI events to see revenue and lead generation analytics"
                            >
                                <div className="text-center py-12">
                                    <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
                                    <h3 className="text-xl font-semibold mb-3">No ROI Data Available</h3>
                                    <p className="text-muted-foreground">
                                        Start tracking ROI events to see revenue and lead generation analytics.
                                    </p>
                                </div>
                            </Chart3DContainer>
                        )}
                    </TabsContent>
                </Tabs>
            </Section3D>
        </Dashboard3DLayout>
    );
}

export default EnhancedAnalyticsDashboard;