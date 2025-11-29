'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IntelligentEmptyState } from '@/components/ui/intelligent-empty-state';
import { StandardSkeleton } from '@/components/standard/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
    BarChart3,
    Eye,
    FileText,
    Download,
    MessageSquare,
    TrendingUp,
    Users,
    Calendar,
    Clock,
    Home,
} from 'lucide-react';
import { listDashboards, getDashboardAnalytics, type ClientDashboard, type DashboardAnalytics } from '@/features/client-dashboards/actions/client-dashboard-actions';
import { formatDistanceToNow, subDays, isAfter } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// Date range options
const DATE_RANGES = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' },
];

// Chart colors
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

// Helper function to format dates
function formatDate(timestamp: number): string {
    try {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
        return 'Unknown';
    }
}

// Helper function to filter data by date range
function filterByDateRange(timestamp: number, dateRange: string): boolean {
    if (dateRange === 'all') return true;
    const days = parseInt(dateRange);
    const cutoffDate = subDays(new Date(), days);
    return isAfter(new Date(timestamp), cutoffDate);
}

// Aggregate analytics type
type AggregateAnalytics = {
    totalDashboards: number;
    totalViews: number;
    avgTimeSpent: number;
    totalDocumentDownloads: number;
    totalContactRequests: number;
    mostViewedProperties: Array<{ propertyId: string; views: number }>;
    dashboardAnalytics: Array<{
        dashboard: ClientDashboard;
        analytics: DashboardAnalytics;
    }>;
};

export default function ClientDashboardAnalyticsPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const [dashboards, setDashboards] = useState<ClientDashboard[] | null>(null);
    const [analyticsData, setAnalyticsData] = useState<Map<string, DashboardAnalytics>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30');
    const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);

    // Fetch dashboards and their analytics
    useEffect(() => {
        if (!user) {
            setDashboards([]);
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch all dashboards
                const dashboardsResult = await listDashboards();
                if (dashboardsResult.data) {
                    setDashboards(dashboardsResult.data);

                    // Fetch analytics for each dashboard
                    const analyticsMap = new Map<string, DashboardAnalytics>();
                    await Promise.all(
                        dashboardsResult.data.map(async (dashboard) => {
                            try {
                                const analyticsResult = await getDashboardAnalytics(dashboard.id);
                                if (analyticsResult.data) {
                                    analyticsMap.set(dashboard.id, analyticsResult.data);
                                }
                            } catch (error) {
                                console.error(`Failed to fetch analytics for dashboard ${dashboard.id}:`, error);
                            }
                        })
                    );
                    setAnalyticsData(analyticsMap);
                } else {
                    setDashboards([]);
                    if (dashboardsResult.errors) {
                        console.error('Failed to fetch dashboards:', dashboardsResult.errors);
                        toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: dashboardsResult.message || 'Failed to load analytics',
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching analytics:', error);
                setDashboards([]);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load analytics',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Calculate aggregate analytics
    const aggregateAnalytics = useMemo((): AggregateAnalytics => {
        if (!dashboards || dashboards.length === 0) {
            return {
                totalDashboards: 0,
                totalViews: 0,
                avgTimeSpent: 0,
                totalDocumentDownloads: 0,
                totalContactRequests: 0,
                mostViewedProperties: [],
                dashboardAnalytics: [],
            };
        }

        let totalViews = 0;
        let totalDocumentDownloads = 0;
        let totalContactRequests = 0;
        const propertyViewCounts = new Map<string, number>();
        const dashboardAnalyticsList: Array<{ dashboard: ClientDashboard; analytics: DashboardAnalytics }> = [];

        dashboards.forEach((dashboard) => {
            const analytics = analyticsData.get(dashboard.id);
            if (analytics) {
                // Filter by date range
                const filteredViews = dateRange === 'all' ? analytics.views :
                    (analytics.lastViewedAt && filterByDateRange(analytics.lastViewedAt, dateRange) ? analytics.views : 0);

                const filteredPropertyViews = analytics.propertyViews.filter(pv =>
                    filterByDateRange(pv.viewedAt, dateRange)
                );

                const filteredDocumentDownloads = analytics.documentDownloads.filter(dd =>
                    filterByDateRange(dd.downloadedAt, dateRange)
                );

                const filteredContactRequests = analytics.contactRequests.filter(cr =>
                    filterByDateRange(cr.requestedAt, dateRange)
                );

                totalViews += filteredViews;
                totalDocumentDownloads += filteredDocumentDownloads.length;
                totalContactRequests += filteredContactRequests.length;

                // Count property views
                filteredPropertyViews.forEach((pv) => {
                    const count = propertyViewCounts.get(pv.propertyId) || 0;
                    propertyViewCounts.set(pv.propertyId, count + 1);
                });

                dashboardAnalyticsList.push({
                    dashboard,
                    analytics: {
                        ...analytics,
                        views: filteredViews,
                        propertyViews: filteredPropertyViews,
                        documentDownloads: filteredDocumentDownloads,
                        contactRequests: filteredContactRequests,
                    },
                });
            }
        });

        // Get top 5 most viewed properties
        const mostViewedProperties = Array.from(propertyViewCounts.entries())
            .map(([propertyId, views]) => ({ propertyId, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        return {
            totalDashboards: dashboards.length,
            totalViews,
            avgTimeSpent: 0, // Placeholder - would need to track time spent
            totalDocumentDownloads,
            totalContactRequests,
            mostViewedProperties,
            dashboardAnalytics: dashboardAnalyticsList,
        };
    }, [dashboards, analyticsData, dateRange]);

    // Get selected dashboard analytics
    const selectedDashboardData = useMemo(() => {
        if (!selectedDashboard) return null;
        return aggregateAnalytics.dashboardAnalytics.find(
            (da) => da.dashboard.id === selectedDashboard
        );
    }, [selectedDashboard, aggregateAnalytics]);

    // Prepare chart data
    const dashboardViewsChartData = useMemo(() => {
        return aggregateAnalytics.dashboardAnalytics
            .sort((a, b) => b.analytics.views - a.analytics.views)
            .slice(0, 10)
            .map((da) => ({
                name: da.dashboard.clientInfo.name,
                views: da.analytics.views,
            }));
    }, [aggregateAnalytics]);

    const activityChartData = useMemo(() => {
        return [
            { name: 'Views', value: aggregateAnalytics.totalViews },
            { name: 'Downloads', value: aggregateAnalytics.totalDocumentDownloads },
            { name: 'Contacts', value: aggregateAnalytics.totalContactRequests },
        ];
    }, [aggregateAnalytics]);

    const isLoadingState = isUserLoading || isLoading;

    if (isLoadingState) {
        return <StandardSkeleton variant="card" count={6} />;
    }

    if (!user) {
        return (
            <IntelligentEmptyState
                icon={Users}
                title="Authentication Required"
                description="Please log in to view analytics"
                actions={[
                    {
                        label: 'Go to Login',
                        onClick: () => router.push('/login'),
                    },
                ]}
            />
        );
    }

    if (!dashboards || dashboards.length === 0) {
        return (
            <IntelligentEmptyState
                icon={BarChart3}
                title="No Dashboards Yet"
                description="Create your first client dashboard to start tracking analytics"
                actions={[
                    {
                        label: 'Create Dashboard',
                        onClick: () => router.push('/client-dashboards'),
                    },
                ]}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with date range filter */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Analytics Overview</h2>
                    <p className="text-muted-foreground">
                        Track engagement and activity across all client dashboards
                    </p>
                </div>
                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                        {DATE_RANGES.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                                {range.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Aggregate Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Dashboards</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{aggregateAnalytics.totalDashboards}</div>
                        <p className="text-xs text-muted-foreground">Active client dashboards</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{aggregateAnalytics.totalViews}</div>
                        <p className="text-xs text-muted-foreground">Dashboard views</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Document Downloads</CardTitle>
                        <Download className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{aggregateAnalytics.totalDocumentDownloads}</div>
                        <p className="text-xs text-muted-foreground">Files downloaded</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Contact Requests</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{aggregateAnalytics.totalContactRequests}</div>
                        <p className="text-xs text-muted-foreground">Client inquiries</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Dashboard Views Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dashboard Views</CardTitle>
                        <CardDescription>Top 10 most viewed dashboards</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dashboardViewsChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dashboardViewsChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="views" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                No view data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Distribution Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Activity Distribution</CardTitle>
                        <CardDescription>Breakdown of client interactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activityChartData.some(d => d.value > 0) ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={activityChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {activityChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                No activity data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Most Viewed Properties */}
            {aggregateAnalytics.mostViewedProperties.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Most Viewed Properties</CardTitle>
                        <CardDescription>Properties with the most client interest</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {aggregateAnalytics.mostViewedProperties.map((property, index) => (
                                <div key={property.propertyId} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium">Property {property.propertyId.substring(0, 8)}</div>
                                            <div className="text-sm text-muted-foreground">{property.views} views</div>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">{property.views} views</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Dashboard-Specific Analytics */}
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard-Specific Analytics</CardTitle>
                    <CardDescription>View detailed analytics for individual dashboards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select value={selectedDashboard || ''} onValueChange={setSelectedDashboard}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a dashboard" />
                        </SelectTrigger>
                        <SelectContent>
                            {aggregateAnalytics.dashboardAnalytics.map((da) => (
                                <SelectItem key={da.dashboard.id} value={da.dashboard.id}>
                                    {da.dashboard.clientInfo.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {selectedDashboardData && (
                        <div className="space-y-4 pt-4">
                            {/* Dashboard Info */}
                            <div className="flex items-start justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <h3 className="font-semibold">{selectedDashboardData.dashboard.clientInfo.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedDashboardData.dashboard.clientInfo.email}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/client-dashboards/${selectedDashboardData.dashboard.id}`)}
                                >
                                    View Dashboard
                                </Button>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <Eye className="h-4 w-4" />
                                        View Count
                                    </div>
                                    <div className="text-2xl font-bold">{selectedDashboardData.analytics.views}</div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <Home className="h-4 w-4" />
                                        Properties Viewed
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {selectedDashboardData.analytics.propertyViews.length}
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <Download className="h-4 w-4" />
                                        Documents Downloaded
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {selectedDashboardData.analytics.documentDownloads.length}
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <MessageSquare className="h-4 w-4" />
                                        Contact Requests
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {selectedDashboardData.analytics.contactRequests.length}
                                    </div>
                                </div>
                            </div>

                            {/* Last Accessed */}
                            {selectedDashboardData.analytics.lastViewedAt && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 border rounded-lg">
                                    <Clock className="h-4 w-4" />
                                    Last accessed {formatDate(selectedDashboardData.analytics.lastViewedAt)}
                                </div>
                            )}

                            {/* Recent Activity */}
                            {(selectedDashboardData.analytics.propertyViews.length > 0 ||
                                selectedDashboardData.analytics.documentDownloads.length > 0 ||
                                selectedDashboardData.analytics.contactRequests.length > 0) && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Recent Activity</h4>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                            {/* Property Views */}
                                            {selectedDashboardData.analytics.propertyViews
                                                .slice(0, 5)
                                                .map((pv, index) => (
                                                    <div
                                                        key={`pv-${index}`}
                                                        className="flex items-center gap-3 p-3 border rounded-lg"
                                                    >
                                                        <Home className="h-4 w-4 text-muted-foreground" />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium">
                                                                Viewed property {pv.propertyId.substring(0, 8)}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {formatDate(pv.viewedAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                            {/* Document Downloads */}
                                            {selectedDashboardData.analytics.documentDownloads
                                                .slice(0, 5)
                                                .map((dd, index) => (
                                                    <div
                                                        key={`dd-${index}`}
                                                        className="flex items-center gap-3 p-3 border rounded-lg"
                                                    >
                                                        <Download className="h-4 w-4 text-muted-foreground" />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium">
                                                                Downloaded document {dd.documentId.substring(0, 8)}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {formatDate(dd.downloadedAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                            {/* Contact Requests */}
                                            {selectedDashboardData.analytics.contactRequests
                                                .slice(0, 5)
                                                .map((cr, index) => (
                                                    <div
                                                        key={`cr-${index}`}
                                                        className="flex items-center gap-3 p-3 border rounded-lg"
                                                    >
                                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium">
                                                                {cr.type.replace('_', ' ')}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground line-clamp-1">
                                                                {cr.message}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {formatDate(cr.requestedAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
