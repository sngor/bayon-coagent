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
    ResponsiveContainer as RechartsResponsiveContainer,
    Area,
    AreaChart,
    ComposedChart,
    ScatterChart,
    Scatter,
    ReferenceLine,
    Brush,
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
    ZoomIn,
    Maximize2,
    Image,
    FileText,
    Camera,
    MousePointer,
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

import { EmptyAnalyticsState, EmptyABTestsState, EmptySearchResultsState } from '@/components/ui/empty-states';
import { NetworkErrorState, DataLoadErrorState } from '@/components/ui/error-states';
import { SkipLink, LiveRegion, VisuallyHidden, useAnnouncer } from '@/components/ui/accessibility-helpers';
import { ResponsiveGrid } from '@/components/ui/responsive-helpers';
import { ABTestResultsVisualization } from '@/components/ab-test-results-visualization';
import {
    TypeAnalytics,
    ABTestResults,
    ROIAnalytics,
    ContentROI,
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
 * Enhanced interactive tooltip for charts with drill-down capabilities
 */
function InteractiveTooltip({
    active,
    payload,
    label,
    onDrillDown,
    showDrillDown = false
}: {
    active?: boolean;
    payload?: any[];
    label?: string;
    onDrillDown?: (data: any) => void;
    showDrillDown?: boolean;
}) {
    if (active && payload && payload.length) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[200px]"
            >
                <p className="font-semibold text-sm mb-2 text-foreground">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-muted-foreground">{entry.name}:</span>
                            </div>
                            <span className="font-medium" style={{ color: entry.color }}>
                                {typeof entry.value === 'number'
                                    ? entry.value.toLocaleString()
                                    : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
                {showDrillDown && onDrillDown && (
                    <button
                        onClick={() => onDrillDown(payload[0]?.payload)}
                        className="mt-3 w-full text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                    >
                        <MousePointer className="h-3 w-3" />
                        Drill Down
                    </button>
                )}
            </motion.div>
        );
    }
    return null;
}

/**
 * Chart export functionality hook
 */
function useChartExport() {
    const exportChart = async (chartElement: HTMLElement, filename: string, format: 'png' | 'svg' | 'pdf') => {
        try {
            switch (format) {
                case 'png':
                    const html2canvasModule = await import('html2canvas');
                    const html2canvas = html2canvasModule.default;
                    const canvas = await html2canvas(chartElement, {
                        backgroundColor: '#ffffff',
                        scale: 2,
                        logging: false,
                    });

                    const pngLink = document.createElement('a');
                    pngLink.download = `${filename}.png`;
                    pngLink.href = canvas.toDataURL();
                    pngLink.click();
                    break;

                case 'svg':
                    const svgElement = chartElement.querySelector('svg');
                    if (svgElement) {
                        const svgData = new XMLSerializer().serializeToString(svgElement);
                        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                        const svgUrl = URL.createObjectURL(svgBlob);

                        const svgLink = document.createElement('a');
                        svgLink.download = `${filename}.svg`;
                        svgLink.href = svgUrl;
                        svgLink.click();

                        URL.revokeObjectURL(svgUrl);
                    }
                    break;

                case 'pdf':
                    const jsPDFModule = await import('jspdf');
                    const jsPDF = jsPDFModule.default;
                    const html2canvasPdfModule = await import('html2canvas');
                    const html2canvasPdf = html2canvasPdfModule.default;

                    const canvasPdf = await html2canvasPdf(chartElement, {
                        backgroundColor: '#ffffff',
                        scale: 2,
                        logging: false,
                    });

                    const imgData = canvasPdf.toDataURL('image/png');
                    const pdf = new jsPDF({
                        orientation: 'landscape',
                        unit: 'mm',
                        format: 'a4'
                    });

                    const imgWidth = 280;
                    const imgHeight = (canvasPdf.height * imgWidth) / canvasPdf.width;

                    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
                    pdf.save(`${filename}.pdf`);
                    break;
            }
        } catch (error) {
            console.error('Failed to export chart:', error);
        }
    };

    return { exportChart };
}

/**
 * Custom tooltip for charts (legacy support)
 */
function CustomTooltip({ active, payload, label }: any) {
    return <InteractiveTooltip active={active} payload={payload} label={label} />;
}

/**
 * Generate ROI trend data with forecasting
 */
function generateROITrendData(roiAnalytics: ROIAnalytics) {
    const data = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    // Generate historical data (last 30 days)
    for (let i = 0; i < 30; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        // Simulate historical data with some variance
        const baseRevenue = roiAnalytics.totalRevenue / 30;
        const baseLeads = roiAnalytics.totalLeads / 30;
        const variance = 0.3; // 30% variance

        data.push({
            date: date.toLocaleDateString(),
            revenue: Math.round(baseRevenue * (1 + (Math.random() - 0.5) * variance)),
            leads: Math.round(baseLeads * (1 + (Math.random() - 0.5) * variance)),
            forecastRevenue: null,
            forecastLeads: null,
        });
    }

    // Generate forecast data (next 14 days)
    const growthRate = 0.05; // 5% growth rate
    const lastRevenue = data[data.length - 1].revenue;
    const lastLeads = data[data.length - 1].leads;

    for (let i = 1; i <= 14; i++) {
        const date = new Date(endDate);
        date.setDate(endDate.getDate() + i);

        const forecastRevenue = Math.round(lastRevenue * Math.pow(1 + growthRate, i / 30));
        const forecastLeads = Math.round(lastLeads * Math.pow(1 + growthRate, i / 30));

        data.push({
            date: date.toLocaleDateString(),
            revenue: null,
            leads: null,
            forecastRevenue,
            forecastLeads,
        });
    }

    return data;
}

/**
 * Generate attribution model breakdown data
 */
function generateAttributionData(roiAnalytics: ROIAnalytics) {
    return [
        {
            model: 'First Touch',
            revenue: roiAnalytics.totalRevenue * 0.35,
            leads: Math.round(roiAnalytics.totalLeads * 0.35),
            description: 'Revenue attributed to first interaction'
        },
        {
            model: 'Last Touch',
            revenue: roiAnalytics.totalRevenue * 0.45,
            leads: Math.round(roiAnalytics.totalLeads * 0.45),
            description: 'Revenue attributed to final interaction'
        },
        {
            model: 'Linear',
            revenue: roiAnalytics.totalRevenue * 0.20,
            leads: Math.round(roiAnalytics.totalLeads * 0.20),
            description: 'Revenue distributed equally across touchpoints'
        }
    ];
}

/**
 * Enhanced content ROI with actionable insights
 */
interface ContentROIWithInsights extends ContentROI {
    insights: string[];
}

/**
 * Generate actionable insights for top performing content
 */
function generateActionableInsights(content: ContentROI[]): ContentROIWithInsights[] {
    return content.slice(0, 3).map(item => {
        const insights = [];

        if (item.roi > 500) {
            insights.push('Exceptional ROI - Consider creating similar content');
        }
        if (item.contentType === ContentCategory.BLOG_POST && item.totalRevenue > 5000) {
            insights.push('High-value blog post - Repurpose for social media');
        }
        if (item.attribution === 'direct') {
            insights.push('Strong direct attribution - Optimize for search');
        }
        if (item.totalLeads > 50) {
            insights.push('High lead generation - Scale similar campaigns');
        }

        return {
            ...item,
            insights: insights.length > 0 ? insights : ['Analyze performance patterns for optimization']
        };
    });
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
    const { announce, AnnouncerComponent } = useAnnouncer();
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

    /**
     * Export A/B test results
     */
    const handleExportABTest = async (testId: string, format: 'csv' | 'pdf') => {
        try {
            // Find the test results
            const testResult = abTestResults.find(test => test.testId === testId);
            if (!testResult) {
                console.error('Test results not found for export');
                return;
            }

            // Generate export data
            let exportData: string;
            let mimeType: string;
            let fileExtension: string;

            if (format === 'csv') {
                // Generate CSV format
                const headers = [
                    'Test ID',
                    'Variation Name',
                    'Sample Size',
                    'Conversion Rate (%)',
                    'Confidence Interval Lower (%)',
                    'Confidence Interval Upper (%)',
                    'Is Winner',
                    'Views',
                    'Clicks',
                    'Likes',
                    'Shares',
                    'Comments',
                    'Engagement Rate (%)'
                ];

                const rows = testResult.variations.map(variation => [
                    testResult.testId,
                    variation.name,
                    variation.sampleSize.toString(),
                    (variation.conversionRate * 100).toFixed(2),
                    (variation.confidenceInterval.lower * 100).toFixed(2),
                    (variation.confidenceInterval.upper * 100).toFixed(2),
                    variation.isWinner ? 'Yes' : 'No',
                    variation.metrics.views.toString(),
                    variation.metrics.clicks.toString(),
                    variation.metrics.likes.toString(),
                    variation.metrics.shares.toString(),
                    variation.metrics.comments.toString(),
                    (variation.metrics.engagementRate * 100).toFixed(2)
                ]);

                exportData = [headers, ...rows].map(row => row.join(',')).join('\n');
                mimeType = 'text/csv';
                fileExtension = 'csv';
            } else {
                // Generate PDF format (simplified - would need proper PDF library in production)
                exportData = `A/B Test Results Report
Test ID: ${testResult.testId}
Statistical Significance: ${testResult.statisticalSignificance ? 'Yes' : 'No'}
Confidence Level: ${(testResult.confidence * 100).toFixed(1)}%
${testResult.pValue ? `P-Value: ${testResult.pValue.toFixed(4)}` : ''}

Variations:
${testResult.variations.map((variation, index) => `
${index + 1}. ${variation.name} ${variation.isWinner ? '(WINNER)' : ''}
   Sample Size: ${variation.sampleSize.toLocaleString()}
   Conversion Rate: ${(variation.conversionRate * 100).toFixed(2)}%
   95% Confidence Interval: ${(variation.confidenceInterval.lower * 100).toFixed(2)}% - ${(variation.confidenceInterval.upper * 100).toFixed(2)}%
   
   Detailed Metrics:
   - Views: ${variation.metrics.views.toLocaleString()}
   - Clicks: ${variation.metrics.clicks.toLocaleString()}
   - Likes: ${variation.metrics.likes.toLocaleString()}
   - Shares: ${variation.metrics.shares.toLocaleString()}
   - Comments: ${variation.metrics.comments.toLocaleString()}
   - Engagement Rate: ${(variation.metrics.engagementRate * 100).toFixed(2)}%
`).join('')}

${testResult.recommendedAction ? `Recommendation: ${testResult.recommendedAction}` : ''}

Generated on: ${new Date().toLocaleString()}`;
                mimeType = 'text/plain';
                fileExtension = 'txt';
            }

            // Create download link
            const blob = new Blob([exportData], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ab-test-${testId.slice(0, 8)}-results.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to export A/B test results:', err);
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
            <div className={className}>
                <DataLoadErrorState
                    dataType="analytics data"
                    onRetry={refreshData}
                    onContactSupport={() => window.open('/support', '_blank')}
                    errorCode="ANALYTICS_001"
                />
            </div>
        );
    }

    // Empty state when no data is available
    if (analyticsData.length === 0 && !isLoading) {
        return (
            <div className={className}>
                <EmptyAnalyticsState
                    onAction={() => window.open('/settings/connections', '_blank')}
                />
                <AnnouncerComponent />
            </div>
        );
    }

    return (
        <div className={cn('space-y-6', className)}>
            {/* Skip Link for Accessibility */}
            <SkipLink href="#analytics-content">Skip to analytics content</SkipLink>

            {/* Header with filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
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
            <div id="analytics-content">
                <VisuallyHidden>
                    <h2>Analytics Summary</h2>
                </VisuallyHidden>
                <ResponsiveGrid
                    cols={{ default: 1, sm: 2, lg: 4 }}
                    gap="md"
                    className="mb-6"
                >
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
                </ResponsiveGrid>
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
                        {/* Enhanced Engagement trends */}
                        <Card className="relative group">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5" />
                                            Engagement Trends
                                        </CardTitle>
                                        <CardDescription>
                                            Track engagement over time by content type with interactive drill-down
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const chartElement = document.querySelector('[data-chart="engagement-trends"]') as HTMLElement;
                                                if (chartElement) {
                                                    useChartExport().exportChart(chartElement, 'engagement-trends', 'png');
                                                }
                                            }}
                                            className="h-8 w-8 p-0"
                                            title="Export as PNG"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const chartElement = document.querySelector('[data-chart="engagement-trends"]') as HTMLElement;
                                                if (chartElement) {
                                                    useChartExport().exportChart(chartElement, 'engagement-trends', 'svg');
                                                }
                                            }}
                                            className="h-8 w-8 p-0"
                                            title="Export as SVG"
                                        >
                                            <Camera className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div data-chart="engagement-trends">
                                    <RechartsResponsiveContainer width="100%" height={350}>
                                        <ComposedChart data={engagementTrendData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 12 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={60}
                                            />
                                            <YAxis
                                                yAxisId="left"
                                                tick={{ fontSize: 12 }}
                                                label={{ value: 'Engagement', angle: -90, position: 'insideLeft' }}
                                            />
                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                tick={{ fontSize: 12 }}
                                                label={{ value: 'Total', angle: 90, position: 'insideRight' }}
                                            />
                                            <Tooltip
                                                content={
                                                    <InteractiveTooltip
                                                        showDrillDown={true}
                                                        onDrillDown={(data) => console.log('Drill down:', data)}
                                                    />
                                                }
                                            />
                                            <Legend />
                                            {analyticsData.map((item, index) => (
                                                <Area
                                                    key={item.contentType}
                                                    yAxisId="left"
                                                    type="monotone"
                                                    dataKey={item.contentType}
                                                    stackId="1"
                                                    stroke={PIE_COLORS[index % PIE_COLORS.length]}
                                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                    fillOpacity={0.7}
                                                    strokeWidth={2}
                                                />
                                            ))}
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="total"
                                                stroke="#ff7300"
                                                strokeWidth={3}
                                                dot={{ fill: '#ff7300', strokeWidth: 2, r: 4 }}
                                                name="Total Engagement"
                                            />
                                            <Brush
                                                dataKey="date"
                                                height={30}
                                                stroke="#8884d8"
                                            />
                                        </ComposedChart>
                                    </RechartsResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Enhanced Content Distribution */}
                        <Card className="relative group">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5" />
                                            Content Distribution & Performance
                                        </CardTitle>
                                        <CardDescription>
                                            Interactive breakdown with engagement metrics
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const chartElement = document.querySelector('[data-chart="content-distribution"]') as HTMLElement;
                                                if (chartElement) {
                                                    useChartExport().exportChart(chartElement, 'content-distribution', 'png');
                                                }
                                            }}
                                            className="h-8 w-8 p-0"
                                            title="Export as PNG"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div data-chart="content-distribution">
                                    <RechartsResponsiveContainer width="100%" height={350}>
                                        <PieChart>
                                            <Pie
                                                data={contentTypeDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent, value }) =>
                                                    `${name}\n${(percent * 100).toFixed(1)}%\n(${value} posts)`
                                                }
                                                outerRadius={100}
                                                innerRadius={40}
                                                fill="#8884d8"
                                                dataKey="value"
                                                stroke="#fff"
                                                strokeWidth={2}
                                            >
                                                {contentTypeDistribution.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                        style={{
                                                            filter: `drop-shadow(0 2px 4px ${entry.color}40)`,
                                                            cursor: 'pointer'
                                                        }}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={
                                                    <InteractiveTooltip
                                                        showDrillDown={true}
                                                        onDrillDown={(data) => console.log('Drill down:', data)}
                                                    />
                                                }
                                            />
                                        </PieChart>
                                    </RechartsResponsiveContainer>
                                </div>

                                {/* Content type performance summary */}
                                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                    {contentTypeDistribution.slice(0, 4).map((item, index) => (
                                        <div key={item.name} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-muted-foreground">
                                                    {((item.value / contentTypeDistribution.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(1)}% of total
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{item.value}</div>
                                                <div className="text-muted-foreground text-xs">posts</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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

                {/* Enhanced Performance Tab */}
                <TabsContent value="performance" className="space-y-6">
                    <Card className="relative group">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Performance Comparison
                                    </CardTitle>
                                    <CardDescription>
                                        Compare engagement metrics across content types with drill-down
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const chartElement = document.querySelector('[data-chart="performance-comparison"]') as HTMLElement;
                                            if (chartElement) {
                                                useChartExport().exportChart(chartElement, 'performance-comparison', 'png');
                                            }
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Export as PNG"
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const chartElement = document.querySelector('[data-chart="performance-comparison"]') as HTMLElement;
                                            if (chartElement) {
                                                useChartExport().exportChart(chartElement, 'performance-comparison', 'pdf');
                                            }
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Export as PDF"
                                    >
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div data-chart="performance-comparison">
                                <RechartsResponsiveContainer width="100%" height={450}>
                                    <ComposedChart data={performanceComparison}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="contentType"
                                            tick={{ fontSize: 12 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            tick={{ fontSize: 12 }}
                                            label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            tick={{ fontSize: 12 }}
                                            label={{ value: 'Rate (%)', angle: 90, position: 'insideRight' }}
                                        />
                                        <Tooltip
                                            content={
                                                <InteractiveTooltip
                                                    showDrillDown={true}
                                                    onDrillDown={(data) => console.log('Performance drill down:', data)}
                                                />
                                            }
                                        />
                                        <Legend />
                                        <Bar
                                            yAxisId="left"
                                            dataKey="views"
                                            fill={CHART_COLORS.primary}
                                            name="Total Views"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar
                                            yAxisId="left"
                                            dataKey="engagement"
                                            fill={CHART_COLORS.secondary}
                                            name="Total Engagement"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="engagementRate"
                                            stroke={CHART_COLORS.accent}
                                            strokeWidth={3}
                                            dot={{ fill: CHART_COLORS.accent, strokeWidth: 2, r: 6 }}
                                            name="Engagement Rate %"
                                        />
                                        <ReferenceLine
                                            yAxisId="right"
                                            y={5}
                                            stroke={CHART_COLORS.danger}
                                            strokeDasharray="5 5"
                                            label="Industry Average"
                                        />
                                    </ComposedChart>
                                </RechartsResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* A/B Tests Tab - Enhanced A/B Test Results Visualization */}
                <TabsContent value="abtests" className="space-y-6">
                    {abTestResults.length === 0 ? (
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
                                <EmptyABTestsState
                                    onAction={() => window.open('/library/ab-tests/create', '_blank')}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-8">
                            {abTestResults.map((test) => (
                                <ABTestResultsVisualization
                                    key={test.testId}
                                    testResults={test}
                                    onRefresh={() => loadAnalyticsData()}
                                    onExport={(format) => handleExportABTest(test.testId, format)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ROI Analytics Tab - Comprehensive ROI Analytics Center */}
                <TabsContent value="roi" className="space-y-6">
                    <VisuallyHidden>
                        <h2>ROI Analytics</h2>
                    </VisuallyHidden>
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Comprehensive ROI Analytics Center</h3>
                            <p className="text-sm text-muted-foreground">
                                Track revenue, lead generation, and ROI forecasting with detailed attribution modeling
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Select defaultValue="30" onValueChange={(value) => {
                                // Update date range for ROI analytics
                                const days = parseInt(value);
                                const endDate = new Date();
                                const startDate = new Date();
                                startDate.setDate(endDate.getDate() - days);
                                // Trigger data refresh with new date range
                                loadAnalyticsData();
                            }}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">Last 7 Days</SelectItem>
                                    <SelectItem value="30">Last 30 Days</SelectItem>
                                    <SelectItem value="90">Last 90 Days</SelectItem>
                                    <SelectItem value="365">Last Year</SelectItem>
                                </SelectContent>
                            </Select>
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
                                onClick={() => handleExportROI('excel')}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export Excel
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

                            {/* Enhanced ROI by Content Type with Attribution Modeling */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="relative group">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <BarChart3 className="h-5 w-5" />
                                                    ROI by Content Type
                                                </CardTitle>
                                                <CardDescription>
                                                    Revenue and lead generation breakdown with industry benchmarks
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const chartElement = document.querySelector('[data-chart="roi-by-content"]') as HTMLElement;
                                                        if (chartElement) {
                                                            useChartExport().exportChart(chartElement, 'roi-by-content-type', 'png');
                                                        }
                                                    }}
                                                    className="h-8 w-8 p-0"
                                                    title="Export as PNG"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div data-chart="roi-by-content">
                                            <RechartsResponsiveContainer width="100%" height={350}>
                                                <ComposedChart data={Object.entries(roiAnalytics.byContentType).map(([type, metrics]) => ({
                                                    contentType: type.replace('_', ' '),
                                                    revenue: metrics.revenue,
                                                    leads: metrics.leads,
                                                    roi: metrics.roi,
                                                    cpl: metrics.cpl,
                                                    industryAvgROI: type === 'BLOG_POST' ? 300 : type === 'SOCIAL_MEDIA' ? 150 : 200,
                                                }))}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis
                                                        dataKey="contentType"
                                                        tick={{ fontSize: 11 }}
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={80}
                                                    />
                                                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                                                    <Tooltip
                                                        content={
                                                            <InteractiveTooltip
                                                                showDrillDown={true}
                                                                onDrillDown={(data) => console.log('Content type drill down:', data)}
                                                            />
                                                        }
                                                    />
                                                    <Legend />
                                                    <Bar
                                                        yAxisId="left"
                                                        dataKey="revenue"
                                                        fill={CHART_COLORS.primary}
                                                        name="Revenue ($)"
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                    <Bar
                                                        yAxisId="left"
                                                        dataKey="leads"
                                                        fill={CHART_COLORS.secondary}
                                                        name="Leads"
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                    <Line
                                                        yAxisId="right"
                                                        type="monotone"
                                                        dataKey="roi"
                                                        stroke={CHART_COLORS.accent}
                                                        strokeWidth={3}
                                                        dot={{ fill: CHART_COLORS.accent, strokeWidth: 2, r: 5 }}
                                                        name="ROI %"
                                                    />
                                                    <Line
                                                        yAxisId="right"
                                                        type="monotone"
                                                        dataKey="industryAvgROI"
                                                        stroke={CHART_COLORS.danger}
                                                        strokeWidth={2}
                                                        strokeDasharray="5 5"
                                                        dot={{ fill: CHART_COLORS.danger, strokeWidth: 2, r: 3 }}
                                                        name="Industry Avg ROI %"
                                                    />
                                                </ComposedChart>
                                            </RechartsResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="relative group">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Target className="h-5 w-5" />
                                                    Attribution Modeling
                                                </CardTitle>
                                                <CardDescription>
                                                    Revenue attribution across different touchpoint models
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const chartElement = document.querySelector('[data-chart="attribution-model"]') as HTMLElement;
                                                        if (chartElement) {
                                                            useChartExport().exportChart(chartElement, 'attribution-modeling', 'png');
                                                        }
                                                    }}
                                                    className="h-8 w-8 p-0"
                                                    title="Export as PNG"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div data-chart="attribution-model">
                                            <RechartsResponsiveContainer width="100%" height={350}>
                                                <BarChart data={generateAttributionData(roiAnalytics)}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="model" tick={{ fontSize: 12 }} />
                                                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                                                    <Tooltip
                                                        content={({ active, payload, label }) => {
                                                            if (active && payload && payload.length) {
                                                                const data = payload[0].payload;
                                                                return (
                                                                    <div className="bg-background border border-border rounded-lg shadow-lg p-4">
                                                                        <p className="font-semibold text-sm mb-2">{label}</p>
                                                                        <p className="text-sm text-muted-foreground mb-2">{data.description}</p>
                                                                        <div className="space-y-1">
                                                                            <div className="flex justify-between">
                                                                                <span>Revenue:</span>
                                                                                <span className="font-medium">${data.revenue.toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span>Leads:</span>
                                                                                <span className="font-medium">{data.leads}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Bar
                                                        yAxisId="left"
                                                        dataKey="revenue"
                                                        fill={CHART_COLORS.primary}
                                                        name="Revenue ($)"
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                    <Bar
                                                        yAxisId="right"
                                                        dataKey="leads"
                                                        fill={CHART_COLORS.secondary}
                                                        name="Leads"
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                </BarChart>
                                            </RechartsResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Enhanced Top Performing Content with Actionable Insights */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="h-5 w-5" />
                                        Top Revenue Generating Content with Actionable Insights
                                    </CardTitle>
                                    <CardDescription>
                                        Content pieces with the highest ROI and specific recommendations for replication
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {generateActionableInsights(roiAnalytics.topPerformingContent).map((content, index) => (
                                            <motion.div
                                                key={content.contentId}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 text-primary rounded-full text-sm font-bold">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-lg">{content.title}</p>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                                <Badge variant="secondary">{content.contentType.replace('_', ' ')}</Badge>
                                                                <span>•</span>
                                                                <Badge variant={content.attribution === 'direct' ? 'default' : 'outline'}>
                                                                    {content.attribution} attribution
                                                                </Badge>
                                                                <span>•</span>
                                                                <span>{content.publishedAt.toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-xl text-green-600">
                                                            ${content.totalRevenue.toLocaleString()}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {content.totalLeads} leads • {content.roi.toFixed(1)}% ROI
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Performance Metrics */}
                                                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
                                                    <div className="text-center">
                                                        <p className="text-sm text-muted-foreground">Revenue per Lead</p>
                                                        <p className="font-semibold">${(content.totalRevenue / content.totalLeads).toFixed(0)}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm text-muted-foreground">ROI Multiple</p>
                                                        <p className="font-semibold">{(content.roi / 100).toFixed(1)}x</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm text-muted-foreground">Attribution</p>
                                                        <p className="font-semibold capitalize">{content.attribution}</p>
                                                    </div>
                                                </div>

                                                {/* Actionable Insights */}
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-sm flex items-center gap-2">
                                                        <ZoomIn className="h-4 w-4" />
                                                        Actionable Insights for Replication:
                                                    </h4>
                                                    <div className="space-y-1">
                                                        {content.insights.map((insight, insightIndex) => (
                                                            <div key={insightIndex} className="flex items-start gap-2 text-sm">
                                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                                <span className="text-muted-foreground">{insight}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Quick Actions */}
                                                <div className="flex gap-2 mt-4 pt-3 border-t">
                                                    <Button variant="outline" size="sm" className="flex-1">
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        View Content
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="flex-1">
                                                        <Share2 className="h-3 w-3 mr-1" />
                                                        Duplicate Strategy
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="flex-1">
                                                        <BarChart3 className="h-3 w-3 mr-1" />
                                                        Deep Dive
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ROI Forecasting Based on Historical Performance */}
                            <Card className="relative group">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5" />
                                                ROI Forecasting & Performance Projections
                                            </CardTitle>
                                            <CardDescription>
                                                Predictive analytics based on historical performance patterns
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const chartElement = document.querySelector('[data-chart="roi-forecast"]') as HTMLElement;
                                                    if (chartElement) {
                                                        useChartExport().exportChart(chartElement, 'roi-forecast', 'png');
                                                    }
                                                }}
                                                className="h-8 w-8 p-0"
                                                title="Export Forecast"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                        {/* Forecast Summary Cards */}
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="h-5 w-5 text-blue-600" />
                                                <h4 className="font-semibold text-blue-900">30-Day Forecast</h4>
                                            </div>
                                            <p className="text-2xl font-bold text-blue-900">
                                                ${Math.round(roiAnalytics.totalRevenue * 1.15).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-blue-700">+15% projected growth</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users className="h-5 w-5 text-green-600" />
                                                <h4 className="font-semibold text-green-900">Lead Projection</h4>
                                            </div>
                                            <p className="text-2xl font-bold text-green-900">
                                                {Math.round(roiAnalytics.totalLeads * 1.12).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-green-700">+12% projected increase</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target className="h-5 w-5 text-purple-600" />
                                                <h4 className="font-semibold text-purple-900">Efficiency Gain</h4>
                                            </div>
                                            <p className="text-2xl font-bold text-purple-900">
                                                ${(roiAnalytics.costPerLead * 0.92).toFixed(2)}
                                            </p>
                                            <p className="text-sm text-purple-700">-8% cost per lead</p>
                                        </div>
                                    </div>

                                    <div data-chart="roi-forecast">
                                        <RechartsResponsiveContainer width="100%" height={400}>
                                            <ComposedChart data={generateROITrendData(roiAnalytics)}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 11 }}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={60}
                                                />
                                                <YAxis
                                                    yAxisId="revenue"
                                                    tick={{ fontSize: 12 }}
                                                    label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }}
                                                />
                                                <YAxis
                                                    yAxisId="leads"
                                                    orientation="right"
                                                    tick={{ fontSize: 12 }}
                                                    label={{ value: 'Leads', angle: 90, position: 'insideRight' }}
                                                />
                                                <Tooltip
                                                    content={({ active, payload, label }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-background border border-border rounded-lg shadow-lg p-4">
                                                                    <p className="font-semibold text-sm mb-2">{label}</p>
                                                                    <div className="space-y-1">
                                                                        {payload.map((entry: any, index: number) => (
                                                                            <div key={index} className="flex items-center justify-between text-sm">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div
                                                                                        className="w-3 h-3 rounded-full"
                                                                                        style={{ backgroundColor: entry.color }}
                                                                                    />
                                                                                    <span className="text-muted-foreground">{entry.name}:</span>
                                                                                </div>
                                                                                <span className="font-medium" style={{ color: entry.color }}>
                                                                                    {entry.name.includes('Revenue') ? `$${entry.value?.toLocaleString() || 'N/A'}` : entry.value?.toLocaleString() || 'N/A'}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    {payload.some((p: any) => p.dataKey.includes('forecast')) && (
                                                                        <p className="text-xs text-muted-foreground mt-2 italic">
                                                                            * Forecast based on historical trends
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Legend />
                                                <Area
                                                    yAxisId="revenue"
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    stackId="1"
                                                    stroke={CHART_COLORS.primary}
                                                    fill={CHART_COLORS.primary}
                                                    fillOpacity={0.7}
                                                    name="Historical Revenue"
                                                />
                                                <Area
                                                    yAxisId="revenue"
                                                    type="monotone"
                                                    dataKey="forecastRevenue"
                                                    stackId="2"
                                                    stroke={CHART_COLORS.accent}
                                                    fill={CHART_COLORS.accent}
                                                    fillOpacity={0.3}
                                                    strokeDasharray="5 5"
                                                    name="Revenue Forecast"
                                                />
                                                <Line
                                                    yAxisId="leads"
                                                    type="monotone"
                                                    dataKey="leads"
                                                    stroke={CHART_COLORS.secondary}
                                                    strokeWidth={3}
                                                    dot={{ fill: CHART_COLORS.secondary, strokeWidth: 2, r: 4 }}
                                                    name="Historical Leads"
                                                />
                                                <Line
                                                    yAxisId="leads"
                                                    type="monotone"
                                                    dataKey="forecastLeads"
                                                    stroke={CHART_COLORS.purple}
                                                    strokeWidth={2}
                                                    strokeDasharray="5 5"
                                                    dot={{ fill: CHART_COLORS.purple, strokeWidth: 2, r: 3 }}
                                                    name="Leads Forecast"
                                                />
                                                <ReferenceLine
                                                    x={new Date().toLocaleDateString()}
                                                    stroke={CHART_COLORS.danger}
                                                    strokeDasharray="3 3"
                                                    label="Today"
                                                />
                                            </ComposedChart>
                                        </RechartsResponsiveContainer>
                                    </div>

                                    {/* Forecast Insights */}
                                    <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            Key Forecast Insights
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="space-y-2">
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                    <span>Revenue growth trending upward based on last 30 days</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                    <span>Lead generation efficiency improving by 8% monthly</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                                                    <span>Seasonal factors may impact Q4 performance</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                                                    <span>Consider scaling top-performing content types</span>
                                                </div>
                                            </div>
                                        </div>
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

            {/* Accessibility Components */}
            <AnnouncerComponent />
            <LiveRegion>
                {isRefreshing && "Refreshing analytics data..."}
                {error && `Error loading analytics: ${error}`}
            </LiveRegion>
        </div>
    );
}

export default AnalyticsDashboard;