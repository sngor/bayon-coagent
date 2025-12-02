'use client';

/**
 * Sync Progress Indicator Component
 * 
 * Displays detailed sync progress with visual feedback including:
 * - Progress bar for sync operations
 * - Individual operation status
 * - Success/failure indicators
 * - Estimated time remaining
 * 
 * Validates Requirements 8.1, 8.5
 */

import { useOfflineSync } from '@/lib/offline/use-offline-sync';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface SyncProgressIndicatorProps {
    /**
     * Whether to show detailed operation list
     * @default false
     */
    showDetails?: boolean;

    /**
     * Custom className
     */
    className?: string;
}

export function SyncProgressIndicator({
    showDetails = false,
    className,
}: SyncProgressIndicatorProps) {
    const {
        isSyncing,
        pendingCount,
        failedCount,
        lastSyncResults,
    } = useOfflineSync();

    const [progress, setProgress] = useState(0);
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

    // Calculate progress based on sync results
    useEffect(() => {
        if (!isSyncing) {
            setProgress(0);
            setEstimatedTimeRemaining(null);
            return;
        }

        const totalOperations = pendingCount + lastSyncResults.length;
        const completedOperations = lastSyncResults.length;

        if (totalOperations > 0) {
            const progressPercent = (completedOperations / totalOperations) * 100;
            setProgress(progressPercent);

            // Estimate time remaining (assuming ~500ms per operation)
            const remainingOps = totalOperations - completedOperations;
            const estimatedMs = remainingOps * 500;
            setEstimatedTimeRemaining(estimatedMs);
        }
    }, [isSyncing, pendingCount, lastSyncResults]);

    // Don't show if not syncing and no recent results
    if (!isSyncing && lastSyncResults.length === 0) {
        return null;
    }

    const successCount = lastSyncResults.filter(r => r.success).length;
    const failureCount = lastSyncResults.filter(r => !r.success).length;

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        {isSyncing ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                Syncing Operations
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                Sync Complete
                            </>
                        )}
                    </CardTitle>
                    {isSyncing && (
                        <Badge variant="secondary">
                            {pendingCount} remaining
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    {isSyncing ? (
                        <>
                            Syncing your offline operations with the server
                            {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
                                <span className="block mt-1">
                                    Estimated time: {Math.ceil(estimatedTimeRemaining / 1000)}s
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            {successCount} operation{successCount !== 1 ? 's' : ''} synced successfully
                            {failureCount > 0 && `, ${failureCount} failed`}
                        </>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress Bar */}
                {isSyncing && (
                    <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{Math.round(progress)}% complete</span>
                            <span>
                                {lastSyncResults.length} of {pendingCount + lastSyncResults.length}
                            </span>
                        </div>
                    </div>
                )}

                {/* Summary Stats */}
                {!isSyncing && lastSyncResults.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted">
                            <span className="text-2xl font-bold">{lastSyncResults.length}</span>
                            <span className="text-xs text-muted-foreground">Total</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {successCount}
                            </span>
                            <span className="text-xs text-muted-foreground">Success</span>
                        </div>
                        {failureCount > 0 && (
                            <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {failureCount}
                                </span>
                                <span className="text-xs text-muted-foreground">Failed</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Detailed Operation List */}
                {showDetails && lastSyncResults.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Recent Operations</h4>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {lastSyncResults.slice(0, 10).map((result, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
                                >
                                    <div className="flex items-center gap-2">
                                        {result.success ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                        )}
                                        <span className="truncate">
                                            {result.operationType || 'Operation'}
                                        </span>
                                    </div>
                                    <Badge
                                        variant={result.success ? 'default' : 'destructive'}
                                        className="shrink-0"
                                    >
                                        {result.success ? 'Synced' : 'Failed'}
                                    </Badge>
                                </div>
                            ))}
                            {lastSyncResults.length > 10 && (
                                <p className="text-xs text-muted-foreground text-center pt-2">
                                    +{lastSyncResults.length - 10} more operations
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Pending Operations Indicator */}
                {isSyncing && pendingCount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-md p-3">
                        <Clock className="h-4 w-4" />
                        <span>
                            {pendingCount} operation{pendingCount !== 1 ? 's' : ''} waiting to sync
                        </span>
                    </div>
                )}

                {/* Failed Operations Warning */}
                {failedCount > 0 && !isSyncing && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
                        <XCircle className="h-4 w-4" />
                        <span>
                            {failedCount} operation{failedCount !== 1 ? 's' : ''} failed to sync.
                            Check your connection and try again.
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Minimal Sync Progress Bar
 * 
 * A compact progress bar that can be placed inline
 */
export function SyncProgressBar() {
    const { isSyncing, pendingCount, lastSyncResults } = useOfflineSync();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isSyncing) {
            setProgress(0);
            return;
        }

        const totalOperations = pendingCount + lastSyncResults.length;
        const completedOperations = lastSyncResults.length;

        if (totalOperations > 0) {
            const progressPercent = (completedOperations / totalOperations) * 100;
            setProgress(progressPercent);
        }
    }, [isSyncing, pendingCount, lastSyncResults]);

    if (!isSyncing) {
        return null;
    }

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Syncing...
                </span>
                <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1" />
        </div>
    );
}
