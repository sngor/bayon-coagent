'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Users, Receipt, TrendingUp, RefreshCw, AlertTriangle, CreditCard, Calendar } from 'lucide-react';
import { getBillingDashboardMetrics, getPaymentFailures } from '@/features/admin/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface BillingMetrics {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    canceledSubscriptions: number;
    pastDueSubscriptions: number;
    paymentFailures: number;
    churnRate: number;
    averageRevenuePerUser: number;
    lifetimeValue: number;
}

interface PaymentFailure {
    userId: string;
    email: string;
    name: string;
    subscriptionId: string;
    invoiceId: string;
    amount: number;
    currency: string;
    attemptCount: number;
    nextPaymentAttempt?: number;
    failureReason?: string;
    failureCode?: string;
    created: number;
}

export function BillingClient() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
    const [paymentFailures, setPaymentFailures] = useState<PaymentFailure[]>([]);
    const { toast } = useToast();

    const loadBillingData = async () => {
        try {
            const [metricsResult, failuresResult] = await Promise.all([
                getBillingDashboardMetrics(),
                getPaymentFailures()
            ]);

            if (metricsResult.success && metricsResult.data) {
                setMetrics(metricsResult.data);
            } else {
                toast({
                    title: "Error loading metrics",
                    description: metricsResult.error || "Failed to load billing metrics",
                    variant: "destructive"
                });
            }

            if (failuresResult.success && failuresResult.data) {
                setPaymentFailures(failuresResult.data);
            } else {
                console.warn("Failed to load payment failures:", failuresResult.error);
            }
        } catch (error) {
            console.error('Error loading billing data:', error);
            toast({
                title: "Error",
                description: "Failed to load billing data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadBillingData();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadBillingData();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-headline text-3xl font-bold">Billing Management</h1>
                        <p className="text-muted-foreground">Monitor revenue, subscriptions, and billing metrics</p>
                    </div>
                </div>
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading billing data...</p>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-headline text-3xl font-bold">Billing Management</h1>
                        <p className="text-muted-foreground">Monitor revenue, subscriptions, and billing metrics</p>
                    </div>
                    <Button onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Retry
                    </Button>
                </div>
                <Card>
                    <CardContent className="text-center py-12">
                        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Unable to Load Billing Data</h3>
                        <p className="text-muted-foreground mb-4">
                            There was an error loading billing metrics. This might be due to Stripe configuration issues.
                        </p>
                        <Button onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Billing Management</h1>
                    <p className="text-muted-foreground">Monitor revenue, subscriptions, and billing metrics</p>
                </div>
                <Button onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh Data
                </Button>
            </div>

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
                        <p className="text-xs text-green-600 mt-1">All-time revenue</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-blue-600">
                            {formatCurrency(metrics.monthlyRecurringRevenue)}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">Current MRR</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-purple-600">{metrics.activeSubscriptions}</div>
                        <p className="text-xs text-purple-600 mt-1">Paying customers</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-orange-600">{metrics.churnRate.toFixed(1)}%</div>
                        <p className="text-xs text-orange-600 mt-1">Customer churn</p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Trial Subscriptions</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.trialSubscriptions}</div>
                        <p className="text-xs text-muted-foreground">Users on trial</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Past Due</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{metrics.pastDueSubscriptions}</div>
                        <p className="text-xs text-muted-foreground">Payment issues</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Revenue Per User</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics.averageRevenuePerUser)}</div>
                        <p className="text-xs text-muted-foreground">Monthly ARPU</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Customer Lifetime Value</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics.lifetimeValue)}</div>
                        <p className="text-xs text-muted-foreground">Estimated LTV</p>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Failures */}
            {paymentFailures.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Payment Failures ({paymentFailures.length})
                        </CardTitle>
                        <CardDescription>Recent payment failures requiring attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Attempts</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Next Attempt</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paymentFailures.slice(0, 10).map((failure) => (
                                    <TableRow key={failure.invoiceId}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{failure.name}</div>
                                                <div className="text-sm text-muted-foreground">{failure.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(failure.amount / 100)}</TableCell>
                                        <TableCell>
                                            <Badge variant={failure.attemptCount > 2 ? "destructive" : "secondary"}>
                                                {failure.attemptCount}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {failure.failureReason || failure.failureCode || 'Unknown'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{formatDate(failure.created)}</TableCell>
                                        <TableCell>
                                            {failure.nextPaymentAttempt ? (
                                                <span className="text-sm">
                                                    {formatDistanceToNow(new Date(failure.nextPaymentAttempt * 1000), { addSuffix: true })}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">No retry scheduled</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Subscription Status Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Subscription Status Overview</CardTitle>
                    <CardDescription>Breakdown of subscription statuses</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                                <CreditCard className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">{metrics.activeSubscriptions}</div>
                                <div className="text-sm text-muted-foreground">Active</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{metrics.trialSubscriptions}</div>
                                <div className="text-sm text-muted-foreground">Trial</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-yellow-600">{metrics.pastDueSubscriptions}</div>
                                <div className="text-sm text-muted-foreground">Past Due</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-red-600">{metrics.canceledSubscriptions}</div>
                                <div className="text-sm text-muted-foreground">Canceled</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}