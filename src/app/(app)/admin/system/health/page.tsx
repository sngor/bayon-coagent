'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Database,
    HardDrive,
    Server,
    Zap,
    XCircle,
    TrendingUp,
    AlertCircle,
    DollarSign,
} from 'lucide-react';
import { getSystemHealthMetrics } from '@/features/admin/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { SystemHealthMetrics } from '@/services/admin/system-health-service';

// Status icon mapping
const StatusIcon = ({ status }: { status: 'healthy' | 'degraded' | 'down' }) => {
    switch (status) {
        case 'healthy':
            return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
        case 'degraded':
            return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
        case 'down':
            return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    }
};

// Severity badge mapping
const SeverityBadge = ({ severity }: { severity: 'info' | 'warning' | 'critical' }) => {
    const variants = {
        info: 'default',
        warning: 'secondary',
        critical: 'destructive',
    } as const;

    return (
        <Badge variant={variants[severity]} className="capitalize">
            {severity}
        </Badge>
    );
};

export default function SystemHealthPage() {
    const [metrics, setMetrics] = useState<SystemHealthMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadHealthMetrics();
        // Auto-refresh every 60 seconds
        const interval = setInterval(loadHealthMetrics, 60000);
        return () => clearInterval(interval);
    }, []);

    async function loadHealthMetrics() {
        try {
            const result = await getSystemHealthMetrics();

            if (result.success && result.data) {
                setMetrics(result.data);
                setLastUpdated(new Date());
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to load system health',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to load system health:', error);
            toast({
                title: 'Error',
                description: 'Failed to load system health data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    function formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toFixed(0);
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }

    function formatTimestamp(timestamp: number): string {
        return new Date(timestamp).toLocaleString();
    }

    function formatRelativeTime(timestamp: number): string {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
                    <p className="text-muted-foreground">
                        Monitor system performance, AWS services, and error logs
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <span className="text-sm text-muted-foreground">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                    <Button onClick={loadHealthMetrics} variant="outline" disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {/* Active Alerts */}
            {metrics && metrics.alerts.length > 0 && (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <CardTitle>Active Alerts</CardTitle>
                                <CardDescription>
                                    {metrics.alerts.length} alert{metrics.alerts.length !== 1 ? 's' : ''} requiring attention
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {metrics.alerts.map((alert, index) => (
                                <div
                                    key={index}
                                    className="flex items-start justify-between p-4 rounded-lg border bg-background"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <SeverityBadge severity={alert.severity} />
                                            <span className="text-sm text-muted-foreground">
                                                {formatRelativeTime(alert.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-sm">{alert.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* API Metrics */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {isLoading ? '-' : `${metrics?.apiMetrics.averageResponseTime.toFixed(0)}ms`}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Last 5 minutes</p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {isLoading ? '-' : `${metrics?.apiMetrics.errorRate.toFixed(2)}%`}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Last 5 minutes</p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Requests/Min</CardTitle>
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">
                                {isLoading ? '-' : formatNumber(metrics?.apiMetrics.requestsPerMinute || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Average rate</p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>

            {/* AWS Services Status */}
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                <Server className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <CardTitle>AWS Services</CardTitle>
                                <CardDescription>Status and metrics for AWS infrastructure</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="space-y-6">
                            {/* DynamoDB */}
                            <div className="flex items-start justify-between p-4 rounded-lg border bg-background/50">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                                        <Database className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold">DynamoDB</h4>
                                            {metrics && <StatusIcon status={metrics.awsServices.dynamodb.status} />}
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Throttled Requests</p>
                                                <p className="font-medium">
                                                    {isLoading ? '-' : metrics?.awsServices.dynamodb.throttledRequests}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Read Capacity</p>
                                                <p className="font-medium">
                                                    {isLoading ? '-' : metrics?.awsServices.dynamodb.readCapacity}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Write Capacity</p>
                                                <p className="font-medium">
                                                    {isLoading ? '-' : metrics?.awsServices.dynamodb.writeCapacity}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bedrock */}
                            <div className="flex items-start justify-between p-4 rounded-lg border bg-background/50">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                                        <Zap className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold">Bedrock (AI)</h4>
                                            {metrics && <StatusIcon status={metrics.awsServices.bedrock.status} />}
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Requests/Min</p>
                                                <p className="font-medium">
                                                    {isLoading ? '-' : formatNumber(metrics?.awsServices.bedrock.requestsPerMinute || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Tokens/Min</p>
                                                <p className="font-medium">
                                                    {isLoading ? '-' : formatNumber(metrics?.awsServices.bedrock.tokensPerMinute || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Cost/Hour</p>
                                                <p className="font-medium">
                                                    {isLoading ? '-' : formatCurrency(metrics?.awsServices.bedrock.costPerHour || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* S3 */}
                            <div className="flex items-start justify-between p-4 rounded-lg border bg-background/50">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                                        <HardDrive className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold">S3 Storage</h4>
                                            {metrics && <StatusIcon status={metrics.awsServices.s3.status} />}
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Requests/Min</p>
                                                <p className="font-medium">
                                                    {isLoading ? '-' : formatNumber(metrics?.awsServices.s3.requestsPerMinute || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Storage Used</p>
                                                <p className="font-medium">
                                                    {isLoading ? '-' : formatNumber(metrics?.awsServices.s3.storageUsed || 0)} GB
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Status</p>
                                                <p className="font-medium capitalize">
                                                    {isLoading ? '-' : metrics?.awsServices.s3.status}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </CardGradientMesh>
            </Card>

            {/* Error Logs */}
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <CardTitle>Recent Errors</CardTitle>
                                <CardDescription>
                                    Top errors grouped by type (last hour)
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading errors...</div>
                        ) : metrics && metrics.errors.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Error Type</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                        <TableHead className="text-right">Affected Users</TableHead>
                                        <TableHead className="text-right">Last Occurrence</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {metrics.errors.map((error, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">
                                                {error.errorType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="secondary">{error.count}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{error.affectedUsers}</TableCell>
                                            <TableCell className="text-right text-sm text-muted-foreground">
                                                {formatRelativeTime(error.lastOccurrence)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No errors in the last hour
                            </div>
                        )}
                    </CardContent>
                </CardGradientMesh>
            </Card>
        </div>
    );
}
