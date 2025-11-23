'use client';

/**
 * Sync Status UI Component for Mobile Enhancements
 * 
 * This component displays the current sync status including pending operations,
 * sync progress, and allows users to continue working during sync operations.
 */

import { useEffect, useState, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Clock, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { offlineSyncManager, SyncOperation, ConnectivityStatus, QueueStatus } from '@/lib/offline-sync-manager';
import { useConflictCount } from '@/hooks/use-conflicts';
import { cn } from '@/lib/utils';

interface SyncStatusProps {
    className?: string;
    compact?: boolean;
    showDetails?: boolean;
    onConflictsClick?: () => void;
}

interface SyncProgress {
    operation: SyncOperation;
    progress: number;
}

export function SyncStatus({ className, compact = false, showDetails = false, onConflictsClick }: SyncStatusProps) {
    const [connectivityStatus, setConnectivityStatus] = useState<ConnectivityStatus>(
        offlineSyncManager.getConnectivityStatus()
    );
    const [queueStatus, setQueueStatus] = useState<QueueStatus>({ pending: 0, failed: 0, completed: 0, conflicts: 0 });
    const [syncProgress, setSyncProgress] = useState<SyncProgress[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
    const [isManualSyncing, setIsManualSyncing] = useState(false);

    // Use conflict count hook
    const { conflictCount } = useConflictCount();

    // Update queue status
    const updateQueueStatus = useCallback(async () => {
        try {
            const status = await offlineSyncManager.getQueueStatus();
            setQueueStatus(status);
        } catch (error) {
            console.error('Failed to get queue status:', error);
        }
    }, []);

    // Handle connectivity changes
    const handleConnectivityChange = useCallback((isOnline: boolean) => {
        setConnectivityStatus(offlineSyncManager.getConnectivityStatus());
        updateQueueStatus();

        if (isOnline) {
            setLastSyncTime(Date.now());
        }
    }, [updateQueueStatus]);

    // Handle sync progress updates
    const handleSyncProgress = useCallback((operation: SyncOperation, progress: number) => {
        setSyncProgress(prev => {
            const existing = prev.find(p => p.operation.id === operation.id);
            if (existing) {
                return prev.map(p =>
                    p.operation.id === operation.id
                        ? { ...p, progress }
                        : p
                );
            } else {
                return [...prev, { operation, progress }];
            }
        });

        // Remove completed operations after a delay
        if (progress >= 1.0) {
            setTimeout(() => {
                setSyncProgress(prev => prev.filter(p => p.operation.id !== operation.id));
                updateQueueStatus();
            }, 2000);
        }
    }, [updateQueueStatus]);

    // Manual sync trigger
    const handleManualSync = useCallback(async () => {
        if (!connectivityStatus.isOnline || isManualSyncing) {
            return;
        }

        setIsManualSyncing(true);
        try {
            await offlineSyncManager.forceSyncPendingOperations();
            setLastSyncTime(Date.now());
        } catch (error) {
            console.error('Manual sync failed:', error);
        } finally {
            setIsManualSyncing(false);
        }
    }, [connectivityStatus.isOnline, isManualSyncing]);

    // Setup event listeners
    useEffect(() => {
        const unsubscribeConnectivity = offlineSyncManager.onConnectivityChange(handleConnectivityChange);
        const unsubscribeSyncProgress = offlineSyncManager.onSyncProgress(handleSyncProgress);

        // Initial status update
        updateQueueStatus();

        // Periodic status updates
        const interval = setInterval(updateQueueStatus, 10000); // Every 10 seconds

        return () => {
            unsubscribeConnectivity();
            unsubscribeSyncProgress();
            clearInterval(interval);
        };
    }, [handleConnectivityChange, handleSyncProgress, updateQueueStatus]);

    // Calculate total pending items
    const totalPending = queueStatus.pending + queueStatus.failed;
    const hasActivity = totalPending > 0 || syncProgress.length > 0;

    // Format last sync time
    const formatLastSyncTime = (timestamp: number | null) => {
        if (!timestamp) return 'Never';

        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    };

    // Compact view for minimal space usage
    if (compact) {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                {/* Connectivity indicator */}
                <div className="flex items-center gap-1">
                    {connectivityStatus.isOnline ? (
                        <Wifi className="h-4 w-4 text-green-600" />
                    ) : (
                        <WifiOff className="h-4 w-4 text-red-600" />
                    )}
                </div>

                {/* Pending count badge */}
                {totalPending > 0 && (
                    <Badge variant="secondary" className="text-xs">
                        {totalPending}
                    </Badge>
                )}

                {/* Conflicts badge */}
                {conflictCount.unresolved > 0 && (
                    <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {conflictCount.unresolved}
                    </Badge>
                )}

                {/* Sync progress indicator */}
                {syncProgress.length > 0 && (
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                )}
            </div>
        );
    }

    return (
        <Card className={cn('w-full', className)}>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                    <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {/* Connectivity status */}
                                <div className="flex items-center gap-2">
                                    {connectivityStatus.isOnline ? (
                                        <>
                                            <Wifi className="h-5 w-5 text-green-600" />
                                            <span className="text-sm font-medium text-green-600">Online</span>
                                        </>
                                    ) : (
                                        <>
                                            <WifiOff className="h-5 w-5 text-red-600" />
                                            <span className="text-sm font-medium text-red-600">Offline</span>
                                        </>
                                    )}
                                </div>

                                {/* Status indicators */}
                                <div className="flex items-center gap-2">
                                    {queueStatus.pending > 0 && (
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {queueStatus.pending} pending
                                        </Badge>
                                    )}

                                    {queueStatus.failed > 0 && (
                                        <Badge variant="destructive" className="flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {queueStatus.failed} failed
                                        </Badge>
                                    )}

                                    {conflictCount.unresolved > 0 && (
                                        <Badge
                                            variant="destructive"
                                            className="flex items-center gap-1 cursor-pointer hover:bg-destructive/90"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onConflictsClick?.();
                                            }}
                                        >
                                            <AlertTriangle className="h-3 w-3" />
                                            {conflictCount.unresolved} conflict{conflictCount.unresolved > 1 ? 's' : ''}
                                        </Badge>
                                    )}

                                    {syncProgress.length > 0 && (
                                        <Badge variant="default" className="flex items-center gap-1">
                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                            Syncing
                                        </Badge>
                                    )}

                                    {totalPending === 0 && syncProgress.length === 0 && conflictCount.unresolved === 0 && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            Up to date
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Manual sync button */}
                            {connectivityStatus.isOnline && totalPending > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleManualSync();
                                    }}
                                    disabled={isManualSyncing}
                                    className="h-8 px-2"
                                >
                                    <RefreshCw className={cn('h-4 w-4', isManualSyncing && 'animate-spin')} />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </CollapsibleTrigger>

                {showDetails && (
                    <CollapsibleContent>
                        <CardContent className="pt-0 pb-4 px-4">
                            <div className="space-y-4">
                                {/* Sync progress details */}
                                {syncProgress.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-headline text-sm font-medium">Syncing Operations</h4>
                                        {syncProgress.map(({ operation, progress }) => (
                                            <div key={operation.id} className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="capitalize">{operation.type}</span>
                                                    <span>{Math.round(progress * 100)}%</span>
                                                </div>
                                                <Progress value={progress * 100} className="h-1" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Queue status details */}
                                {hasActivity && (
                                    <div className="space-y-2">
                                        <h4 className="font-headline text-sm font-medium">Queue Status</h4>
                                        <div className="grid grid-cols-4 gap-2 text-xs">
                                            <div className="text-center p-2 bg-muted rounded">
                                                <div className="font-medium">{queueStatus.pending}</div>
                                                <div className="text-muted-foreground">Pending</div>
                                            </div>
                                            <div className="text-center p-2 bg-muted rounded">
                                                <div className="font-medium">{queueStatus.failed}</div>
                                                <div className="text-muted-foreground">Failed</div>
                                            </div>
                                            <div className="text-center p-2 bg-muted rounded">
                                                <div className="font-medium">{conflictCount.unresolved}</div>
                                                <div className="text-muted-foreground">Conflicts</div>
                                            </div>
                                            <div className="text-center p-2 bg-muted rounded">
                                                <div className="font-medium">{queueStatus.completed}</div>
                                                <div className="text-muted-foreground">Completed</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Last sync time */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Last sync: {formatLastSyncTime(lastSyncTime)}</span>
                                    {connectivityStatus.isOnline && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleManualSync}
                                            disabled={isManualSyncing}
                                            className="h-6 px-2 text-xs"
                                        >
                                            {isManualSyncing ? 'Syncing...' : 'Sync now'}
                                        </Button>
                                    )}
                                </div>

                                {/* Offline message */}
                                {!connectivityStatus.isOnline && (
                                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                        You're working offline. Changes will sync when connection is restored.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                )}
            </Collapsible>
        </Card>
    );
}

/**
 * Floating sync status indicator for minimal UI impact
 */
export function FloatingSyncStatus({ className }: { className?: string }) {
    const [connectivityStatus, setConnectivityStatus] = useState<ConnectivityStatus>(
        offlineSyncManager.getConnectivityStatus()
    );
    const [queueStatus, setQueueStatus] = useState<QueueStatus>({ pending: 0, failed: 0, completed: 0 });
    const [syncProgress, setSyncProgress] = useState<SyncProgress[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    // Update queue status
    const updateQueueStatus = useCallback(async () => {
        try {
            const status = await offlineSyncManager.getQueueStatus();
            setQueueStatus(status);

            // Show indicator if there's activity
            const hasActivity = status.pending > 0 || status.failed > 0 || syncProgress.length > 0;
            setIsVisible(hasActivity || !connectivityStatus.isOnline);
        } catch (error) {
            console.error('Failed to get queue status:', error);
        }
    }, [connectivityStatus.isOnline, syncProgress.length]);

    // Handle connectivity changes
    const handleConnectivityChange = useCallback((isOnline: boolean) => {
        setConnectivityStatus(offlineSyncManager.getConnectivityStatus());
        updateQueueStatus();
    }, [updateQueueStatus]);

    // Handle sync progress updates
    const handleSyncProgress = useCallback((operation: SyncOperation, progress: number) => {
        setSyncProgress(prev => {
            const existing = prev.find(p => p.operation.id === operation.id);
            if (existing) {
                return prev.map(p =>
                    p.operation.id === operation.id
                        ? { ...p, progress }
                        : p
                );
            } else {
                return [...prev, { operation, progress }];
            }
        });

        // Remove completed operations after a delay
        if (progress >= 1.0) {
            setTimeout(() => {
                setSyncProgress(prev => prev.filter(p => p.operation.id !== operation.id));
                updateQueueStatus();
            }, 2000);
        }
    }, [updateQueueStatus]);

    // Setup event listeners
    useEffect(() => {
        const unsubscribeConnectivity = offlineSyncManager.onConnectivityChange(handleConnectivityChange);
        const unsubscribeSyncProgress = offlineSyncManager.onSyncProgress(handleSyncProgress);

        // Initial status update
        updateQueueStatus();

        return () => {
            unsubscribeConnectivity();
            unsubscribeSyncProgress();
        };
    }, [handleConnectivityChange, handleSyncProgress, updateQueueStatus]);

    if (!isVisible) {
        return null;
    }

    const totalPending = queueStatus.pending + queueStatus.failed;

    return (
        <div className={cn(
            'fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-2',
            'flex items-center gap-2 min-w-[120px]',
            className
        )}>
            {/* Connectivity indicator */}
            {connectivityStatus.isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
            ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
            )}

            {/* Status text */}
            <div className="text-xs">
                {!connectivityStatus.isOnline && 'Offline'}
                {connectivityStatus.isOnline && syncProgress.length > 0 && 'Syncing...'}
                {connectivityStatus.isOnline && syncProgress.length === 0 && totalPending > 0 && `${totalPending} pending`}
                {connectivityStatus.isOnline && syncProgress.length === 0 && totalPending === 0 && 'Up to date'}
            </div>

            {/* Sync indicator */}
            {syncProgress.length > 0 && (
                <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
            )}

            {/* Dismiss button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-5 w-5 p-0 hover:bg-muted"
            >
                <X className="h-3 w-3" />
            </Button>
        </div>
    );
}