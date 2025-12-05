'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
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
    TrendingUp,
    TrendingDown,
    Minus,
    Users,
    FileText,
    Activity,
    Download,
    Calendar,
    BarChart3,
    PieChart as PieChartIcon,
    Lightbulb,
} from 'lucide-react';
import {
    getEngagementReport,
    exportEngagementReportPDF,
} from '@/features/admin/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { EngagementReport } from '@/services/admin/engagement-reporting-service';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    Area,
    AreaChart,
} from 'recharts';

// Date range presets
const DATE_RANGES = {
    '7d': { label: 'Last 7 Days', days: 7 },
    '30d': { label: 'Last 30 Days', days: 30 },
    '90d': { label: 'Last 90 Days', days: 90 },
    'ytd': { label: 'Year to Date', days: null },
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function EngagementReportsPage() {
    const [report, setReport] = useState<EngagementReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [dateRange, setDateRange] = useState('30d');
    const { toast } = useToast();

    useEffect(() => {
        loadReport();
    }, [dateRange]);

    async function loadReport() {
        setIsLoading(true);
        try {
            const { startDate, endDate } = getDateRange(dateRange);
            const result = await getEngagementReport(
                startDate.toISOString(),
                endDate.toISOString()
            );

            if (result.success && result.data) {
                setReport(result.data);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to load engagement report',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to load engagement report:', error);
            toast({
                title: 'Error',
                description: 'Failed to load engagement report',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleExportPDF() {
        if (!report) return;

        setIsExporting(true);
        try {
            const { startDate, endDate } = getDateRange(dateRange);
            const result = await exportEngagementReportPDF(
                startDate.toISOString(),
                endDate.toISOString()
            );

            if (result.success && result.data) {
                // Create a download link for the PDF
                const blob = new Blob(
                    [Buffer.from(result.data, 'base64')],
                    { type: 'application/pdf' }
                );
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `engagement-report-${report.dateRange.startDate}-to-${report.dateRange.endDate}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                toast({
                    title: 'Success',
                    description: 'Report exported successfully',
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to export report',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to export report:', error);
            toast({
                title: 'Error',
                description: 'Failed to export report',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    }

    function getDateRange(range: string): { startDate: Date; endDate: Date } {
        const endDate = new Date();
        let startDate = new Date();

        const rangeConfig = DATE_RANGES[range as keyof typeof DATE_RANGES];
        if (rangeConfig.days) {
            startDate.setDate(endDate.getDate() - rangeConfig.days);
        } else if (range === 'ytd') {
            startDate = new Date(endDate.getFullYear(), 0, 1);
        }

        return { startDate, endDate };
    }

    function formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    function getTrendIcon(trend: 'increasing' | 'decreasing' | 'stable') {
        switch (trend) {
            case 'increasing':
                return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
            case 'decreasing':
                return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
            default:
                return <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
        }
    }

    function getTrendBadgeVariant(trend: 'increasing' | 'decreasing' | 'stable') {
        switch (trend) {
            case 'increasing':
                return 'default';
            case 'decreasing':
                return 'destructive';
            default:
                return 'secondary';
        }
    }

    // Prepare chart data
    const featureAdoptionChartData = report?.featureAdoption.slice(0, 10).map(feature => ({
        name: feature.featureName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        adoptionRate: feature.adoptionRate,
        activeUsers: feature.activeUsers,
    })) || [];

    const retentionChartData = report?.cohortRetention.map(cohort => ({
        cohort: cohort.cohortDate,
        'Day 1': cohort.retention.day1,
        'Day 7': cohort.retention.day7,
        'Day 14': cohort.retention.day14,
        'Day 30': cohort.retention.day30,
    })) || [];

    const contentByDateData = report?.contentStats.contentByDate || [];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Engagement Reports</h2>
                    <p className="text-muted-foreground">
                        Analyze feature adoption, user retention, and content creation trends
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={loadReport} variant="outline" disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Refresh'}
                    </Button>
                    <Button
                        onClick={handleExportPDF}
                        disabled={isExporting || !report}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        {isExporting ? 'Exporting...' : 'Export PDF'}
                    </Button>
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Users */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {isLoading ? '-' : formatNumber(report?.summary.totalUsers || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Active: {isLoading ? '-' : formatNumber(report?.summary.activeUsers || 0)}
                            </p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* Engagement Rate */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {isLoading ? '-' : `${report?.summary.engagementRate.toFixed(1) || 0}%`}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Of total users
                            </p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* Avg Content Per User */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Avg Content/User</CardTitle>
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {isLoading ? '-' : report?.summary.averageContentPerUser.toFixed(1) || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total: {isLoading ? '-' : formatNumber(report?.contentStats.totalContent || 0)}
                            </p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* Features Tracked */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Features Tracked</CardTitle>
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                                <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {isLoading ? '-' : report?.featureAdoption.length || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Active features
                            </p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>

            {/* Key Insights */}
            {report && report.insights.length > 0 && (
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                                    <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <CardTitle>Key Insights</CardTitle>
                                    <CardDescription>
                                        Automated insights from your engagement data
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <ul className="space-y-2">
                                {report.insights.map((insight, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span className="text-sm">{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            )}

            {/* Feature Adoption Chart */}
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle>Feature Adoption Over Time</CardTitle>
                                <CardDescription>
                                    Adoption rates for top features
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {isLoading ? (
                            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                                Loading chart...
                            </div>
                        ) : featureAdoptionChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={featureAdoptionChartData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        height={120}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        label={{ value: 'Adoption Rate (%)', angle: -90, position: 'insideLeft' }}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Bar dataKey="adoptionRate" fill="#0088FE" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                                No feature adoption data available
                            </div>
                        )}
                    </CardContent>
                </CardGradientMesh>
            </Card>

            {/* Feature Adoption Table */}
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <CardTitle>Feature Adoption Details</CardTitle>
                        <CardDescription>
                            Detailed breakdown of feature usage and trends
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Loading feature data...
                            </div>
                        ) : report && report.featureAdoption.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4 font-medium">Feature</th>
                                            <th className="text-right py-3 px-4 font-medium">Active Users</th>
                                            <th className="text-right py-3 px-4 font-medium">Adoption Rate</th>
                                            <th className="text-right py-3 px-4 font-medium">Usage Count</th>
                                            <th className="text-center py-3 px-4 font-medium">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.featureAdoption.map((feature, index) => (
                                            <tr key={index} className="border-b last:border-0">
                                                <td className="py-3 px-4">
                                                    {feature.featureName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </td>
                                                <td className="text-right py-3 px-4">
                                                    {formatNumber(feature.activeUsers)}
                                                </td>
                                                <td className="text-right py-3 px-4">
                                                    {feature.adoptionRate.toFixed(1)}%
                                                </td>
                                                <td className="text-right py-3 px-4">
                                                    {formatNumber(feature.usageCount)}
                                                </td>
                                                <td className="text-center py-3 px-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {getTrendIcon(feature.trend)}
                                                        <Badge variant={getTrendBadgeVariant(feature.trend)}>
                                                            {feature.changePercentage > 0 ? '+' : ''}
                                                            {feature.changePercentage.toFixed(0)}%
                                                        </Badge>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No feature adoption data available
                            </div>
                        )}
                    </CardContent>
                </CardGradientMesh>
            </Card>

            {/* Cohort Retention Analysis */}
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <CardTitle>Cohort Retention Analysis</CardTitle>
                                <CardDescription>
                                    User retention by signup cohort
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {isLoading ? (
                            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                                Loading chart...
                            </div>
                        ) : retentionChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={retentionChartData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis
                                        dataKey="cohort"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        label={{ value: 'Retention (%)', angle: -90, position: 'insideLeft' }}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="Day 1" stroke="#0088FE" strokeWidth={2} />
                                    <Line type="monotone" dataKey="Day 7" stroke="#00C49F" strokeWidth={2} />
                                    <Line type="monotone" dataKey="Day 14" stroke="#FFBB28" strokeWidth={2} />
                                    <Line type="monotone" dataKey="Day 30" stroke="#FF8042" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                                No cohort retention data available
                            </div>
                        )}
                    </CardContent>
                </CardGradientMesh>
            </Card>

            {/* Content Creation Statistics */}
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <CardTitle>Content Creation Over Time</CardTitle>
                                <CardDescription>
                                    Daily content creation trends
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {isLoading ? (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                Loading chart...
                            </div>
                        ) : contentByDateData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={contentByDateData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#8884d8"
                                        fill="#8884d8"
                                        fillOpacity={0.6}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No content creation data available
                            </div>
                        )}
                    </CardContent>
                </CardGradientMesh>
            </Card>

            {/* Top Content Types & Top Creators */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Top Content Types */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <CardTitle>Top Content Types</CardTitle>
                            <CardDescription>Most popular content formats</CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            {isLoading ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Loading...
                                </div>
                            ) : report && report.contentStats.topContentTypes.length > 0 ? (
                                <div className="space-y-3">
                                    {report.contentStats.topContentTypes.map((type, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                <span className="text-sm font-medium">
                                                    {type.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-muted-foreground">
                                                    {formatNumber(type.count)}
                                                </span>
                                                <Badge variant="secondary">
                                                    {type.percentage}%
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No content type data available
                                </div>
                            )}
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* Top Creators */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <CardTitle>Top Content Creators</CardTitle>
                            <CardDescription>Most active users</CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            {isLoading ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Loading...
                                </div>
                            ) : report && report.contentStats.topCreators.length > 0 ? (
                                <div className="space-y-3">
                                    {report.contentStats.topCreators.map((creator, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                                    #{index + 1}
                                                </div>
                                                <span className="text-sm font-medium">
                                                    {creator.userName}
                                                </span>
                                            </div>
                                            <Badge variant="secondary">
                                                {formatNumber(creator.contentCount)} pieces
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No creator data available
                                </div>
                            )}
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>
        </div>
    );
}
