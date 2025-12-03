'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, Cloud, CloudOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/common';
import { offlineQueue, type SyncProgress, type QueuedOperation } from '@/lib/mobile/offline-queue';

// ============================================================================
// Offline Status Indicator
// ============================================================================

export interface OfflineStatusProps {
    className?: string;
    showQueueCount?: boolean;
}

export function OfflineStatus({ className, showQueueCount = true }: OfflineStatusProps) {
    const [isOnline, setIsOnline] = useState(true);
    const [queueSize, setQueueSize] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        // Initialize
        setIsOnline(navigator.onLine);

        // Update queue size
        const updateQueueSize = async () => {
            const size = await offlineQueue.getQueueSize();
            setQueueSize(size);
        };

        updateQueueSize();

        // Listen for online/offline events
        const handleOnline = () => {
            setIsOnline(true);
            // Trigger sync when coming online
            syncQueue();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        // Listen for queue changes
        const handleQueueChange = () => {
            updateQueueSize();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('queue-updated', handleQueueChange);

        // Poll queue size periodically
        const interval = setInterval(updateQueueSize, 5000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('queue-updated', handleQueueChange);
            clearInterval(interval);
        };
    }, []);

    const syncQueue = async () => {
        setIsSyncing(true);
        try {
            await offlineQueue.syncAll();
            const size = await offlineQueue.getQueueSize();
            setQueueSize(size);
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    if (isOnline && queueSize === 0) {
        return null; // Don't show indicator when online and no queue
    }

    return (
        <div
            className={cn(
                'fixed top-4 right-4 z-40 animate-in slide-in-from-top-5',
                className
            )}
        >
            <Badge
                variant={isOnline ? 'default' : 'destructive'}
                className={cn(
                    'flex items-center gap-2 px-3 py-2 shadow-lg',
                    isSyncing && 'animate-pulse'
                )}
            >
                {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isOnline ? (
                    <Wifi className="h-4 w-4" />
                ) : (
                    <WifiOff className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                    {isSyncing
                        ? 'Syncing...'
                        : isOnline
                            ? 'Online'
                            : 'Offline'}
                </span>
                {showQueueCount && queueSize > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1">
                        {queueSize}
                    </Badge>
                )}
            </Badge>
        </div>
    );
}

// ============================================================================
// Queue Status Display
// ============================================================================

export interface QueueStatusProps {
    className?: string;
}

export function QueueStatus({ className }: QueueStatusProps) {
    const [progress, setProgress] = useState<SyncProgress>({
        total: 0,
        completed: 0,
        failed: 0,
        inProgress: 0,
    });
    const [operations, setOperations] = useState<QueuedOperation[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        updateStatus();

        // Listen for sync progress updates
        const unsubscribe = offlineQueue.onSyncProgress((newProgress) => {
            setProgress(newProgress);
        });

        // Poll for updates
        const interval = setInterval(updateStatus, 3000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const updateStatus = async () => {
        const newProgress = await offlineQueue.getSyncProgress();
        setProgress(newProgress);

        const allOps = await offlineQueue.getAllOperations();
        setOperations(allOps);
    };

    const handleSyncAll = async () => {
        setIsSyncing(true);
        try {
            await offlineQueue.syncAll();
            await updateStatus();
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRetryFailed = async () => {
        setIsSyncing(true);
        try {
            await offlineQueue.retryFailed();
            await updateStatus();
        } catch (error) {
            console.error('Retry failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleClearCompleted = async () => {
        await offlineQueue.clearCompleted();
        await updateStatus();
    };

    const pendingCount = progress.total - progress.completed - progress.failed;
    const progressPercentage =
        progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

    return (
        <Card className={cn('w-full', className)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Sync Queue</CardTitle>
                        <CardDescription>
                            {pendingCount > 0
                                ? `${pendingCount} operation${pendingCount !== 1 ? 's' : ''} pending`
                                : 'All operations synced'}
                        </CardDescription>
                    </div>
                    {navigator.onLine && pendingCount > 0 && (
                        <Button
                            size="sm"
                            onClick={handleSyncAll}
                            disabled={isSyncing}
                        >
                            {isSyncing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <Cloud className="mr-2 h-4 w-4" />
                                    Sync Now
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Progress Bar */}
                {progress.total > 0 && (
                    <div className="space-y-2">
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                                {progress.completed} of {progress.total} completed
                            </span>
                            <span>{Math.round(progressPercentage)}%</span>
                        </div>
                    </div>
                )}

                {/* Status Summary */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-border bg-card p-3 text-center">
                        <div className="text-2xl font-bold">{pendingCount}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {progress.completed}
                        </div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3 text-center">
                        <div className="text-2xl font-bold text-destructive">
                            {progress.failed}
                        </div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                </div>

                {/* Operations List */}
                {operations.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Recent Operations</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {operations.slice(0, 10).map((op) => (
                                <div
                                    key={op.id}
                                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        {op.status === 'completed' ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        ) : op.status === 'failed' ? (
                                            <XCircle className="h-4 w-4 text-destructive" />
                                        ) : op.status === 'syncing' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CloudOff className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <div>
                                            <div className="text-sm font-medium">
                                                {op.type.replace(/-/g, ' ')}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(op.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={
                                            op.status === 'completed'
                                                ? 'default'
                                                : op.status === 'failed'
                                                    ? 'destructive'
                                                    : 'secondary'
                                        }
                                    >
                                        {op.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                {(progress.failed > 0 || progress.completed > 0) && (
                    <div className="flex gap-2">
                        {progress.failed > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRetryFailed}
                                disabled={isSyncing}
                                className="flex-1"
                            >
                                Retry Failed
                            </Button>
                        )}
                        {progress.completed > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleClearCompleted}
                                className="flex-1"
                            >
                                Clear Completed
                            </Button>
                        )}
                    </div>
                )}

                {/* Offline Notice */}
                {!navigator.onLine && (
                    <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <WifiOff className="h-4 w-4" />
                            <span>
                                You're offline. Operations will sync automatically when you're back
                                online.
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
