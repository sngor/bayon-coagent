'use client';

/**
 * Billing Dashboard Page (SuperAdmin Only)
 *
 * Displays billing metrics, user billing information, payment failures,
 * and provides tools for trial extensions and billing data export.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DollarSign,
    Users,
    TrendingUp,
    AlertTriangle,
    Download,
    Search,
    RefreshCw,
    XCircle,
    Calendar,
} from 'lucide-react';
import {
    getBillingDashboardMetrics,
    getUserBillingInfo,
    getPaymentFailures,
    grantTrialExtension,
    exportBillingData,
    retryPayment,
    cancelSubscription,
} from '@/features/admin/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function BillingDashboardPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<any>(null);
    const [paymentFailures, setPaymentFailures] = useState<any[]>([]);
    const [searchUserId, setSearchUserId] = useState('');
    const [userBillingInfo, setUserBillingInfo] = useState<any>(null);
    const [loadingUserInfo, setLoadingUserInfo] = useState(false);
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    const [exportLoading, setExportLoading] = useState(false);

    // Trial extension dialog state
    const [trialDialogOpen, setTrialDialogOpen] = useState(false);
    const [trialUserId, setTrialUserId] = useState('');
    const [trialDays, setTrialDays] = useState('30');
    const [trialReason, setTrialReason] = useState('');
    const [trialLoading, setTrialLoading] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load metrics
            const metricsResult = await getBillingDashboardMetrics();
            if (metricsResult.success && metricsResult.data) {
                setMetrics(metricsResult.data);
            } else {
                toast({
                    title: 'Error',
                    description: metricsResult.error || 'Failed to load billing metrics',
                    variant: 'destructive',
                });
            }

            // Load payment failures
            const failuresResult = await getPaymentFailures();
            if (failuresResult.success && failuresResult.data) {
                setPaymentFailures(failuresResult.data);
            }
        } catch (error) {
            console.error('Error loading billing dashboard:', error);
            toast({
                title: 'Error',
                description: 'Failed to load billing dashboard',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearchUser = async () => {
        if (!searchUserId.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a user ID',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoadingUserInfo(true);
            const result = await getUserBillingInfo(searchUserId.trim());

            if (result.success && result.data) {
                setUserBillingInfo(result.data);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'User not found',
                    variant: 'destructive',
                });
                setUserBillingInfo(null);
            }
        } catch (error) {
            console.error('Error searching user:', error);
            toast({
                title: 'Error',
                description: 'Failed to search user',
                variant: 'destructive',
            });
        } finally {
            setLoadingUserInfo(false);
        }
    };

    const handleGrantTrialExtension = async () => {
        if (!trialUserId.trim() || !trialDays || !trialReason.trim()) {
            toast({
                title: 'Error',
                description: 'Please fill in all fields',
                variant: 'destructive',
            });
            return;
        }

        try {
            setTrialLoading(true);
            const result = await grantTrialExtension(
                trialUserId.trim(),
                parseInt(trialDays),
                trialReason.trim()
            );

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
                setTrialDialogOpen(false);
                setTrialUserId('');
                setTrialDays('30');
                setTrialReason('');

                // Refresh user info if it's the same user
                if (userBillingInfo && userBillingInfo.userId === trialUserId.trim()) {
                    handleSearchUser();
                }
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to grant trial extension',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error granting trial extension:', error);
            toast({
                title: 'Error',
                description: 'Failed to grant trial extension',
                variant: 'destructive',
            });
        } finally {
            setTrialLoading(false);
        }
    };

    const handleExportBillingData = async () => {
        if (!exportStartDate || !exportEndDate) {
            toast({
                title: 'Error',
                description: 'Please select both start and end dates',
                variant: 'destructive',
            });
            return;
        }

        try {
            setExportLoading(true);
            const result = await exportBillingData(exportStartDate, exportEndDate);

            if (result.success && result.data) {
                // Convert to CSV
                const csvContent = generateCSV(result.data);

                // Download CSV
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `billing-export-${exportStartDate}-to-${exportEndDate}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                toast({
                    title: 'Success',
                    description: 'Billing data exported successfully',
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to export billing data',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error exporting billing data:', error);
            toast({
                title: 'Error',
                description: 'Failed to export billing data',
                variant: 'destructive',
            });
        } finally {
            setExportLoading(false);
        }
    };

    const generateCSV = (data: any) => {
        const headers = [
            'Date',
            'User ID',
            'User Email',
            'User Name',
            'Transaction ID',
            'Type',
            'Amount',
            'Currency',
            'Status',
            'Description',
        ];

        const rows = data.transactions.map((t: any) => [
            t.date,
            t.userId,
            t.userEmail,
            t.userName,
            t.transactionId,
            t.type,
            t.amount,
            t.currency,
            t.status,
            t.description,
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row: any[]) =>
                row.map((cell) => `"${cell || ''}"`).join(',')
            ),
            '',
            'Summary',
            `Total Transactions,${data.summary.totalTransactions}`,
            `Total Revenue,${data.summary.totalRevenue}`,
            `Total Refunds,${data.summary.totalRefunds}`,
            `Net Revenue,${data.summary.netRevenue}`,
        ].join('\n');

        return csvContent;
    };

    const handleRetryPayment = async (invoiceId: string) => {
        try {
            const result = await retryPayment(invoiceId);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
                loadDashboardData();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to retry payment',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error retrying payment:', error);
            toast({
                title: 'Error',
                description: 'Failed to retry payment',
                variant: 'destructive',
            });
        }
    };

    const handleCancelSubscription = async (subscriptionId: string) => {
        if (!confirm('Are you sure you want to cancel this subscription?')) {
            return;
        }

        try {
            const result = await cancelSubscription(subscriptionId);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
                loadDashboardData();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to cancel subscription',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error canceling subscription:', error);
            toast({
                title: 'Error',
                description: 'Failed to cancel subscription',
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading billing dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold">Billing Management</h1>
                <p className="text-muted-foreground">
                    Manage subscriptions, payments, and billing data
                </p>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${metrics?.totalRevenue?.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground">All-time revenue</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">MRR</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${metrics?.monthlyRecurringRevenue?.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Monthly recurring revenue
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Subscriptions
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics?.activeSubscriptions || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {metrics?.trialSubscriptions || 0} on trial
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Payment Failures
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics?.paymentFailures || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Requires attention
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics?.churnRate?.toFixed(2) || '0.00'}%
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">ARPU</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${metrics?.averageRevenuePerUser?.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Average revenue per user
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">LTV</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${metrics?.lifetimeValue?.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Customer lifetime value
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="search" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="search">User Search</TabsTrigger>
                    <TabsTrigger value="failures">Payment Failures</TabsTrigger>
                    <TabsTrigger value="export">Export Data</TabsTrigger>
                </TabsList>

                {/* User Search Tab */}
                <TabsContent value="search" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Search User Billing Information</CardTitle>
                            <CardDescription>
                                Enter a user ID to view their billing details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter user ID"
                                    value={searchUserId}
                                    onChange={(e) => setSearchUserId(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearchUser();
                                        }
                                    }}
                                />
                                <Button onClick={handleSearchUser} disabled={loadingUserInfo}>
                                    <Search className="h-4 w-4 mr-2" />
                                    Search
                                </Button>
                            </div>

                            {userBillingInfo && (
                                <div className="space-y-4 border-t pt-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <Label className="text-sm font-medium">User</Label>
                                            <p className="text-sm text-muted-foreground">
                                                {userBillingInfo.name} ({userBillingInfo.email})
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">
                                                Subscription Status
                                            </Label>
                                            <p className="text-sm">
                                                <Badge
                                                    variant={
                                                        userBillingInfo.subscriptionStatus === 'active'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {userBillingInfo.subscriptionStatus || 'None'}
                                                </Badge>
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Plan</Label>
                                            <p className="text-sm text-muted-foreground">
                                                {userBillingInfo.subscriptionPlan || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Total Spent</Label>
                                            <p className="text-sm text-muted-foreground">
                                                ${userBillingInfo.totalSpent?.toFixed(2) || '0.00'}
                                            </p>
                                        </div>
                                        {userBillingInfo.currentPeriodEnd && (
                                            <div>
                                                <Label className="text-sm font-medium">
                                                    Current Period End
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(
                                                        userBillingInfo.currentPeriodEnd
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                        {userBillingInfo.trialEnd && (
                                            <div>
                                                <Label className="text-sm font-medium">Trial End</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(
                                                        userBillingInfo.trialEnd
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {userBillingInfo.paymentMethod && (
                                        <div>
                                            <Label className="text-sm font-medium">
                                                Payment Method
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {userBillingInfo.paymentMethod.brand?.toUpperCase()}{' '}
                                                ****{userBillingInfo.paymentMethod.last4} (Exp:{' '}
                                                {userBillingInfo.paymentMethod.expiryMonth}/
                                                {userBillingInfo.paymentMethod.expiryYear})
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Dialog
                                            open={trialDialogOpen}
                                            onOpenChange={setTrialDialogOpen}
                                        >
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setTrialUserId(userBillingInfo.userId)}
                                                >
                                                    <Calendar className="h-4 w-4 mr-2" />
                                                    Grant Trial Extension
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Grant Trial Extension</DialogTitle>
                                                    <DialogDescription>
                                                        Extend the trial period for this user
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label>User ID</Label>
                                                        <Input value={trialUserId} disabled />
                                                    </div>
                                                    <div>
                                                        <Label>Extension Days</Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max="365"
                                                            value={trialDays}
                                                            onChange={(e) => setTrialDays(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Reason</Label>
                                                        <Textarea
                                                            placeholder="Enter reason for extension..."
                                                            value={trialReason}
                                                            onChange={(e) => setTrialReason(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setTrialDialogOpen(false)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={handleGrantTrialExtension}
                                                        disabled={trialLoading}
                                                    >
                                                        {trialLoading ? 'Granting...' : 'Grant Extension'}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        {userBillingInfo.subscriptionId && (
                                            <Button
                                                variant="destructive"
                                                onClick={() =>
                                                    handleCancelSubscription(
                                                        userBillingInfo.subscriptionId
                                                    )
                                                }
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Cancel Subscription
                                            </Button>
                                        )}
                                    </div>

                                    {/* Payment History */}
                                    {userBillingInfo.paymentHistory &&
                                        userBillingInfo.paymentHistory.length > 0 && (
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">
                                                    Payment History
                                                </Label>
                                                <div className="border rounded-lg">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Date</TableHead>
                                                                <TableHead>Amount</TableHead>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead>Description</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {userBillingInfo.paymentHistory
                                                                .slice(0, 10)
                                                                .map((payment: any) => (
                                                                    <TableRow key={payment.id}>
                                                                        <TableCell>
                                                                            {new Date(
                                                                                payment.created * 1000
                                                                            ).toLocaleDateString()}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            ${payment.amount.toFixed(2)}{' '}
                                                                            {payment.currency.toUpperCase()}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge
                                                                                variant={
                                                                                    payment.status === 'paid'
                                                                                        ? 'default'
                                                                                        : 'secondary'
                                                                                }
                                                                            >
                                                                                {payment.status}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {payment.description || 'N/A'}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payment Failures Tab */}
                <TabsContent value="failures" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Failures</CardTitle>
                            <CardDescription>
                                Users with failed payment attempts
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {paymentFailures.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No payment failures found
                                </p>
                            ) : (
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Attempts</TableHead>
                                                <TableHead>Reason</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paymentFailures.map((failure) => (
                                                <TableRow key={failure.invoiceId}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{failure.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {failure.email}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        ${failure.amount.toFixed(2)}{' '}
                                                        {failure.currency.toUpperCase()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="destructive">
                                                            {failure.attemptCount} attempts
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-sm text-muted-foreground">
                                                            {failure.failureReason || 'Unknown'}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleRetryPayment(failure.invoiceId)
                                                                }
                                                            >
                                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                                Retry
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    handleCancelSubscription(
                                                                        failure.subscriptionId
                                                                    )
                                                                }
                                                            >
                                                                <XCircle className="h-3 w-3 mr-1" />
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Export Data Tab */}
                <TabsContent value="export" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Export Billing Data</CardTitle>
                            <CardDescription>
                                Download billing transactions for a date range
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={exportStartDate}
                                        onChange={(e) => setExportStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        value={exportEndDate}
                                        onChange={(e) => setExportEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleExportBillingData}
                                disabled={exportLoading}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {exportLoading ? 'Exporting...' : 'Export to CSV'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
