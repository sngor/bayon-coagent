'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { WebhookDeliveryLog } from '@/lib/open-house/types';
import {
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Eye,
    AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface WebhookDeliveryLogProps {
    logs: WebhookDeliveryLog[];
    onRetry: (deliveryId: string) => Promise<void>;
}

export function WebhookDeliveryLogComponent({
    logs,
    onRetry,
}: WebhookDeliveryLogProps) {
    const { toast } = useToast();
    const [selectedLog, setSelectedLog] = useState<WebhookDeliveryLog | null>(null);
    const [retryingId, setRetryingId] = useState<string | null>(null);

    const handleRetry = async (deliveryId: string) => {
        setRetryingId(deliveryId);
        try {
            await onRetry(deliveryId);
            toast({
                title: 'Success',
                description: 'Webhook delivery retried successfully',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to retry webhook delivery',
                variant: 'destructive',
            });
        } finally {
            setRetryingId(null);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-600" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
            success: 'default',
            failed: 'destructive',
            pending: 'secondary',
        };

        return (
            <Badge variant={variants[status] || 'secondary'} className="flex items-center gap-1 w-fit">
                {getStatusIcon(status)}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const formatEventName = (event: string) => {
        return event
            .split('.')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    if (logs.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Delivery Logs</CardTitle>
                    <CardDescription>
                        No webhook deliveries yet
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Webhook deliveries will appear here once events are triggered</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Delivery Logs</CardTitle>
                    <CardDescription>
                        Recent webhook delivery attempts (showing last 50)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Attempts</TableHead>
                                    <TableHead>Last Attempt</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.deliveryId}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {formatEventName(log.event)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(log.status)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span>{log.attempts}</span>
                                                {log.attempts > 1 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        / 3
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {formatDistanceToNow(new Date(log.lastAttemptAt), {
                                                    addSuffix: true,
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedLog(log)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {log.status === 'failed' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleRetry(log.deliveryId)}
                                                        disabled={retryingId === log.deliveryId}
                                                    >
                                                        <RefreshCw
                                                            className={`h-4 w-4 ${retryingId === log.deliveryId ? 'animate-spin' : ''
                                                                }`}
                                                        />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Delivery Details</DialogTitle>
                        <DialogDescription>
                            Webhook delivery information and payload
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Event
                                    </div>
                                    <div className="text-sm">
                                        {formatEventName(selectedLog.event)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Status
                                    </div>
                                    <div className="mt-1">
                                        {getStatusBadge(selectedLog.status)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Attempts
                                    </div>
                                    <div className="text-sm">
                                        {selectedLog.attempts} / 3
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Last Attempt
                                    </div>
                                    <div className="text-sm">
                                        {new Date(selectedLog.lastAttemptAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {selectedLog.error && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-2">
                                        Error Message
                                    </div>
                                    <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm font-mono">
                                        {selectedLog.error}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2">
                                    Payload
                                </div>
                                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                                    {JSON.stringify(selectedLog.payload, null, 2)}
                                </pre>
                            </div>

                            {selectedLog.status === 'failed' && (
                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => {
                                            handleRetry(selectedLog.deliveryId);
                                            setSelectedLog(null);
                                        }}
                                        disabled={retryingId === selectedLog.deliveryId}
                                    >
                                        <RefreshCw
                                            className={`h-4 w-4 mr-2 ${retryingId === selectedLog.deliveryId ? 'animate-spin' : ''
                                                }`}
                                        />
                                        Retry Delivery
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
