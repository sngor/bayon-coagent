'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, DollarSign, Activity, RefreshCw } from 'lucide-react';

export function AnalyticsClient() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalUsers: 0,
        activeUsers: 0,
        revenue: 0,
        apiCalls: 0
    });

    useEffect(() => {
        // Mock data loading
        setTimeout(() => {
            setMetrics({
                totalUsers: 1250,
                activeUsers: 892,
                revenue: 125000,
                apiCalls: 45000
            });
            setLoading(false);
        }, 1000);
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                    <p className="text-muted-foreground">Monitor platform performance and user engagement</p>
                </div>
                <Button>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading analytics data...</div>
            ) : (
                <>
                    {/* Metrics Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="text-3xl font-bold text-blue-600">
                                    {formatNumber(metrics.totalUsers)}
                                </div>
                                <p className="text-xs text-blue-600 mt-1">+12% from last month</p>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                                <Activity className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="text-3xl font-bold text-green-600">
                                    {formatNumber(metrics.activeUsers)}
                                </div>
                                <p className="text-xs text-green-600 mt-1">+8% from last month</p>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="text-3xl font-bold text-purple-600">
                                    {formatCurrency(metrics.revenue)}
                                </div>
                                <p className="text-xs text-purple-600 mt-1">+15% from last month</p>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                                <BarChart3 className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="text-3xl font-bold text-orange-600">
                                    {formatNumber(metrics.apiCalls)}
                                </div>
                                <p className="text-xs text-orange-600 mt-1">+22% from last month</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Analytics Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Analytics Overview</CardTitle>
                            <CardDescription>Detailed analytics and performance metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
                                    <BarChart3 className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                                <p className="text-muted-foreground mb-4">
                                    Detailed analytics features are being implemented. This includes user behavior tracking,
                                    performance monitoring, and business intelligence dashboards.
                                </p>
                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                    Coming Soon
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}