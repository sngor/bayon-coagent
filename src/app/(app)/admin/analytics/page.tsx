'use client';

import { useEffect, useState } from 'react';
import { useAdminStickyHeader } from '@/hooks/use-admin-sticky-header';
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
    Users,
    TrendingUp,
    Activity,
    Zap,
    DollarSign,
    FileText,
    Calendar,
    BarChart3,
    Clock,
    UserPlus,
} from 'lucide-react';
import { getPlatformAnalytics } from '@/features/admin/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { PlatformMetrics } from '@/services/admin/analytics-service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// Date range presets
const DATE_RANGES = {
    '7d': { label: 'Last 7 Days', days: 7 },
    '30d': { label: 'Last 30 Days', days: 30 },
    '90d': { label: 'Last 90 Days', days: 90 },
    'ytd': { label: 'Year to Date', days: null },
    'all': { label: 'All Time', days: null },
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsDashboardPage() {
    const headerRef = useAdminStickyHeader({
        title: 'Team Analytics'
    });
    const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30d');
    const { toast } = useToast();

    useEffect(() => {
        loadAnalytics();
    }, [dateRange]);

    async function loadAnalytics() {
        setIsLoading(true);
        try {
            const { startDate, endDate } = getDateRange(dateRange);
            const result = await getPlatformAnalytics(
                startDate.toISOString(),
                endDate.toISOString()
            );

            if (result.success && result.data) {
                setMetrics(result.data);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to load analytics',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
            toast({
                title: 'Error',
                description: 'Failed to load analytics data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
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
        } else if (range === 'all') {
            startDate = new Date(2024, 0, 1); // Platform start date
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

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }

    function formatDuration(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    }

    // Prepare chart data
    const featureUsageData = metrics
        ? Object.entries(metrics.featureUsage).map(([name, count]) => ({
            name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            count,
        }))
        : [];

    const contentTypeData = metrics
        ? Object.entries(metrics.contentCreated.byType).map(([type, count]) => ({
            name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: count,
        }))
        : [];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div ref={headerRef} className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">Team Analytics</h1>
                    <p className="text-muted-foreground">
                        Monitor team usage, engagement, and performance metrics
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
                    <Button onClick={loadAnalytics} variant="outline" disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Active Users */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {isLoading ? '-' : formatNumber(metrics?.activeUsers || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total: {isLoading ? '-' : formatNumber(metrics?.totalUsers || 0)}
                            </p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* New Signups */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">New Signups</CardTitle>
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {isLoading ? '-' : formatNumber(metrics?.newSignups24h || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* Daily Active Users */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Daily Active</CardTitle>
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {isLoading ? '-' : formatNumber(metrics?.dailyActiveUsers || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                WAU: {isLoading ? '-' : formatNumber(metrics?.weeklyActiveUsers || 0)}
                            </p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* Avg Session Duration */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {isLoading ? '-' : formatDuration(metrics?.averageSessionDuration || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Per user</p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>

            {/* Content & AI Metrics */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Content Created */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Content Created</CardTitle>
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {isLoading ? '-' : formatNumber(metrics?.contentCreated.total || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Total pieces</p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* AI Requests */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
                            <div className="p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                                <Zap className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {isLoading ? '-' : formatNumber(metrics?.aiUsage.totalRequests || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {isLoading ? '-' : formatNumber(metrics?.aiUsage.totalTokens || 0)} tokens
                            </p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* AI Cost */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">AI Cost</CardTitle>
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {isLoading ? '-' : formatCurrency(metrics?.aiUsage.totalCost || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Total spend</p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Feature Usage Chart */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle>Feature Usage</CardTitle>
                                    <CardDescription>Most popular features and hubs</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            {isLoading ? (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    Loading chart...
                                </div>
                            ) : featureUsageData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={featureUsageData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            height={100}
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
                                        <Bar dataKey="count" fill="#0088FE" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    No feature usage data available
                                </div>
                            )}
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* Content Type Distribution */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle>Content Types</CardTitle>
                                    <CardDescription>Distribution by content type</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            {isLoading ? (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    Loading chart...
                                </div>
                            ) : contentTypeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={contentTypeData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) =>
                                                `${name}: ${(percent * 100).toFixed(0)}%`
                                            }
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {contentTypeData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    No content data available
                                </div>
                            )}
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>
        </div>
    );
}
