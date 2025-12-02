'use client';

/**
 * Compact Sync Status Indicator
 * 
 * A compact indicator showing:
 * - Online/offline status
 * - Pending operations count
 * - Sync progress
 * 
 * Can be placed in headers or navigation bars
 * Validates Requirements 8.5
 */

import { useOfflineSync } from '@/lib/offline/use-offline-sync';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Cloud,
    CloudOff,
    RefreshCw,
    AlertTriangle,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function SyncStatusIndicator() {
    const {
        isOnline,
        isSyncing,
        pendingCount,
        failedCount,
        lastSyncTimestamp,
        conflictCount,
        sync,
    } = useOfflineSync();

    const hasIssues = failedCount > 0 || conflictCount > 0;
    const showBadge = pendingCount > 0 || hasIssues;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="relative"
                >
                    {isOnline ? (
                        <Cloud className="h-4 w-4" />
                    ) : (
                        <CloudOff className="h-4 w-4 text-orange-500" />
                    )}
                    {showBadge && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                            {pendingCount}
                        </span>
                    )}
                    {isSyncing && (
                        <RefreshCw className="absolute -bottom-1 -right-1 h-3 w-3 animate-spin text-primary" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Sync Status</h4>
                        <Badge variant={isOnline ? 'default' : 'secondary'}>
                            {isOnline ? 'Online' : 'Offline'}
                        </Badge>
                    </div>

                    {/* Status Items */}
                    <div className="space-y-2">
                        {/* Pending Operations */}
                        {pendingCount > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>Pending</span>
                                </div>
                                <Badge variant="secondary">{pendingCount}</Badge>
                            </div>
                        )}

                        {/* Failed Operations */}
                        {failedCount > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                    <span>Failed</span>
                                </div>
                                <Badge variant="destructive">{failedCount}</Badge>
                            </div>
                        )}

                        {/* Conflicts */}
                        {conflictCount > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                    <span>Conflicts</span>
                                </div>
                                <Badge variant="outline" className="bg-yellow-50">
                                    {conflictCount}
                                </Badge>
                            </div>
                        )}

                        {/* Last Sync */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                <span>Last Sync</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {lastSyncTimestamp
                                    ? formatDistanceToNow(lastSyncTimestamp, { addSuffix: true })
                                    : 'Never'}
                            </span>
                        </div>
                    </div>

                    {/* Sync Status Message */}
                    {isSyncing && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-md p-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Syncing operations...</span>
                        </div>
                    )}

                    {!isOnline && (
                        <div className="text-xs text-muted-foreground bg-orange-50 dark:bg-orange-950/20 rounded-md p-2">
                            You're offline. Operations will sync automatically when connection is restored.
                        </div>
                    )}

                    {/* Sync Button */}
                    {isOnline && pendingCount > 0 && !isSyncing && (
                        <Button
                            onClick={() => sync()}
                            size="sm"
                            className="w-full"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sync Now
                        </Button>
                    )}

                    {/* All Clear Message */}
                    {isOnline && pendingCount === 0 && failedCount === 0 && !isSyncing && (
                        <div className="text-xs text-muted-foreground text-center bg-green-50 dark:bg-green-950/20 rounded-md p-2">
                            ✓ All operations synced
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
