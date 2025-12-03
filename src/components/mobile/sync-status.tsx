/**
 * Sync Status Component
 * 
 * Displays sync progress and allows manual sync control.
 * 
 * Requirements: 2.5, 6.3, 6.4
 */

'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useOfflineQueue } from '@/hooks/use-offline-queue';
import { useConnectivity } from '@/hooks/use-connectivity';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export interface SyncStatusProps {
    className?: string;
}

export function SyncStatus({ className }: SyncStatusProps) {
    const { isOnline } = useConnectivity();
    const {
        queueSize,
        operations,
        syncProgress,
        syncAll,
        retryFailed,
        clearCompleted,
    } = useOfflineQueue();
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        if (!isOnline) {
            return;
        }

        setIsSyncing(true);
        try {
            await syncAll();
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRetryFailed = async () => {
        if (!isOnline) {
            return;
        }

        setIsSyncing(true);
        try {
            await retryFailed();
        } finally {
            setIsSyncing(false);
        }
    };

    const handleClearCompleted = async () => {
        await clearCompleted();
    };

    const pendingCount = operations.filter((op) => op.status === 'pending').length;
    const failedCount = operations.filter((op) => op.status === 'failed').length;
    const completedCount = operations.filter((op) => op.status === 'completed').length;

    const progressPercentage =
        syncProgress.total > 0
            ? ((syncProgress.completed + syncProgress.failed) / syncProgress.total) * 100
            : 0;

    if (queueSize === 0 && completedCount === 0 && failedCount === 0) {
        return null;
    }

    return (
        <Card className={cn('', className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <RefreshCw className={cn('h-5 w-5', isSyncing && 'animate-spin')} />
                    Sync Status
                </CardTitle>
                <CardDescription>
                    {isOnline
                        ? 'Your changes are being synced'
                        : "Changes will sync when you're back online"}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Progress bar */}
                {syncProgress.inProgress > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Syncing...</span>
                            <span className="font-medium">
                                {syncProgress.completed + syncProgress.failed} / {syncProgress.total}
                            </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                    </div>
                )}

                {/* Status counts */}
                <div className="grid grid-cols-3 gap-4">
                    {/* Pending */}
                    <div className="flex flex-col items-center gap-1 rounded-lg border p-3">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <span className="text-2xl font-bold">{pendingCount}</span>
                        <span className="text-xs text-muted-foreground">Pending</span>
                    </div>

                    {/* Completed */}
                    <div className="flex flex-col items-center gap-1 rounded-lg border p-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-2xl font-bold">{completedCount}</span>
                        <span className="text-xs text-muted-foreground">Completed</span>
                    </div>

                    {/* Failed */}
                    <div className="flex flex-col items-center gap-1 rounded-lg border p-3">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-2xl font-bold">{failedCount}</span>
                        <span className="text-xs text-muted-foreground">Failed</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    {pendingCount > 0 && (
                        <Button
                            onClick={handleSync}
                            disabled={!isOnline || isSyncing}
                            className="w-full"
                        >
                            <RefreshCw className={cn('mr-2 h-4 w-4', isSyncing && 'animate-spin')} />
                            {isSyncing ? 'Syncing...' : `Sync ${pendingCount} ${pendingCount === 1 ? 'Operation' : 'Operations'}`}
                        </Button>
                    )}

                    {failedCount > 0 && (
                        <Button
                            onClick={handleRetryFailed}
                            disabled={!isOnline || isSyncing}
                            variant="outline"
                            className="w-full"
                        >
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Retry {failedCount} Failed
                        </Button>
                    )}

                    {completedCount > 0 && (
                        <Button
                            onClick={handleClearCompleted}
                            variant="ghost"
                            size="sm"
                            className="w-full"
                        >
                            Clear Completed
                        </Button>
                    )}
                </div>

                {/* Offline warning */}
                {!isOnline && pendingCount > 0 && (
                    <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <p>
                            You're offline. Your changes are saved and will sync automatically when
                            you're back online.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
