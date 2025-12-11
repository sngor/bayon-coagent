'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Receipt, TrendingUp, RefreshCw } from 'lucide-react';

export function BillingClient() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        activeSubscriptions: 0,
        churnRate: 0,
        averageRevenue: 0
    });

    useEffect(() => {
        // Mock data loading
        setTimeout(() => {
            setMetrics({
                totalRevenue: 125000,
                activeSubscriptions: 1250,
                churnRate: 2.5,
                averageRevenue: 100
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

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Billing Management</h1>
                    <p className="text-muted-foreground">Monitor revenue, subscriptions, and billing metrics</p>
                </div>
                <Button>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading billing data...</div>
            ) : (
                <>
                    {/* Metrics Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="text-3xl font-bold text-green-600">
                                    {formatCurrency(metrics.totalRevenue)}
                                </div>
                                <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                                <Users className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="text-3xl font-bold text-blue-600">{metrics.activeSubscriptions}</div>
                                <p className="text-xs text-blue-600 mt-1">+5% from last month</p>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                                <TrendingUp className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="text-3xl font-bold text-orange-600">{metrics.churnRate}%</div>
                                <p className="text-xs text-orange-600 mt-1">-0.5% from last month</p>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Average Revenue</CardTitle>
                                <Receipt className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="text-3xl font-bold text-purple-600">
                                    {formatCurrency(metrics.averageRevenue)}
                                </div>
                                <p className="text-xs text-purple-600 mt-1">per user per month</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Billing Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Billing Overview</CardTitle>
                            <CardDescription>Recent billing activity and subscription management</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
                                    <Receipt className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Billing Dashboard</h3>
                                <p className="text-muted-foreground mb-4">
                                    Detailed billing features are being implemented. This includes subscription management,
                                    payment processing, and revenue analytics.
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