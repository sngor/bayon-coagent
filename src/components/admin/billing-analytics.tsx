'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Calendar,
    RefreshCw,
    Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
    revenueGrowth: {
        current: number;
        previous: number;
        percentage: number;
    };
    subscriptionTrends: {
        newSubscriptions: number;
        canceledSubscriptions: number;
        netGrowth: number;
    };
    paymentMetrics: {
        successRate: number;
        averageTransactionValue: number;
        totalTransactions: number;
    };
    customerSegments: Array<{
        segment: string;
        count: number;
        revenue: number;
        percentage: number;
    }>;
    monthlyData: Array<{
        month: string;
        revenue: number;
        subscriptions: number;
        churn: number;
    }>;
}

export function BillingAnalytics() {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const { toast } = useToast();

    const loadAnalytics = async () => {
        try {
            setLoading(true);

            const response = await fetch(`/api/admin/billing/analytics?timeRange=${timeRange}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setAnalyticsData(data.data);
            } else {
                throw new Error(data.error || 'Failed to load analytics');
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load analytics data. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [timeRange]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatPercentage = (value: number) => {
        return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-10 w-32 bg-muted animate-pulse rounded" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
                                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No analytics data available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Billing Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                        Comprehensive insights into revenue and subscription metrics
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="1y">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={loadAnalytics}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(analyticsData.revenueGrowth.current)}
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                            {analyticsData.revenueGrowth.percentage > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={analyticsData.revenueGrowth.percentage > 0 ? 'text-green-500' : 'text-red-500'}>
                                {formatPercentage(analyticsData.revenueGrowth.percentage)}
                            </span>
                            <span className="text-muted-foreground">vs previous period</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Subscription Growth</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            +{analyticsData.subscriptionTrends.netGrowth}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {analyticsData.subscriptionTrends.newSubscriptions} new, {analyticsData.subscriptionTrends.canceledSubscriptions} canceled
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {analyticsData.paymentMetrics.successRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {analyticsData.paymentMetrics.totalTransactions} total transactions
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Customer Segments */}
            <Card>
                <CardHeader>
                    <CardTitle>Customer Segments</CardTitle>
                    <CardDescription>Revenue breakdown by customer type</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analyticsData.customerSegments.map((segment) => (
                            <div key={segment.segment} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                    <div>
                                        <p className="font-medium">{segment.segment}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {segment.count} customers
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{formatCurrency(segment.revenue)}</p>
                                    <Badge variant="secondary" className="text-xs">
                                        {segment.percentage}%
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Trends</CardTitle>
                    <CardDescription>Revenue and subscription trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analyticsData.monthlyData.map((month) => (
                            <div key={month.month} className="grid grid-cols-4 gap-4 py-2 border-b last:border-b-0">
                                <div>
                                    <p className="font-medium">{month.month}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{formatCurrency(month.revenue)}</p>
                                    <p className="text-xs text-muted-foreground">Revenue</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{month.subscriptions}</p>
                                    <p className="text-xs text-muted-foreground">Subscriptions</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{month.churn}%</p>
                                    <p className="text-xs text-muted-foreground">Churn Rate</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}