'use client';

/**
 * Sync Status Display Component
 * 
 * Displays the current sync status including:
 * - Pending operations count
 * - Last successful sync timestamp
 * - Conflict count
 * - Failed operations count
 * 
 * Validates Requirements 8.5
 */

import { useOfflineSync } from '@/lib/offline/use-offline-sync';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Cloud,
    CloudOff,
    RefreshCw,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export function SyncStatusDisplay() {
    const {
        isOnline,
        isSyncing,
        pendingCount,
        failedCount,
        lastSyncTimestamp,
        conflictCount,
        sync,
        retryFailed,
    } = useOfflineSync();

    const [isManualSyncing, setIsManualSyncing] = useState(false);

    const handleManualSync = async () => {
        setIsManualSyncing(true);
        try {
            const results = await sync();
            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;

            toast({
                title: 'Sync Complete',
                description: `${successCount} operations synced successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
                variant: successCount > 0 ? 'default' : 'destructive',
            });
        } catch (error) {
            toast({
                title: 'Sync Failed',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive',
            });
        } finally {
            setIsManualSyncing(false);
        }
    };

    const handleRetryFailed = async () => {
        try {
            const results = await retryFailed();
            const successCount = results.filter(r => r.success).length;

            toast({
                title: 'Retry Complete',
                description: `${successCount} operations retried successfully`,
            });
        } catch (error) {
            toast({
                title: 'Retry Failed',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive',
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isOnline ? (
                            <Cloud className="h-5 w-5 text-green-500" />
                        ) : (
                            <CloudOff className="h-5 w-5 text-orange-500" />
                        )}
                        <CardTitle>Sync Status</CardTitle>
                    </div>
                    <Badge variant={isOnline ? 'default' : 'secondary'}>
                        {isOnline ? 'Online' : 'Offline'}
                    </Badge>
                </div>
                <CardDescription>
                    {isOnline
                        ? 'Connected and syncing automatically'
                        : 'Offline - operations will sync when connection is restored'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Pending Operations */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Pending Operations</span>
                    </div>
                    <Badge variant={pendingCount > 0 ? 'secondary' : 'outline'}>
                        {pendingCount}
                    </Badge>
                </div>

                {/* Failed Operations */}
                {failedCount > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span className="text-sm font-medium">Failed Operations</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="destructive">{failedCount}</Badge>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRetryFailed}
                                disabled={!isOnline}
                            >
                                Retry
                            </Button>
                        </div>
                    </div>
                )}

                {/* Conflicts */}
                {conflictCount > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">Conflicts Resolved</span>
                        </div>
                        <Badge variant="outline" className="bg-yellow-50">
                            {conflictCount}
                        </Badge>
                    </div>
                )}

                {/* Last Sync */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Last Sync</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {lastSyncTimestamp
                            ? formatDistanceToNow(lastSyncTimestamp, { addSuffix: true })
                            : 'Never'}
                    </span>
                </div>

                {/* Sync Status Indicator */}
                {isSyncing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Syncing operations...</span>
                    </div>
                )}

                {/* Manual Sync Button */}
                {isOnline && pendingCount > 0 && !isSyncing && (
                    <Button
                        onClick={handleManualSync}
                        disabled={isManualSyncing}
                        className="w-full"
                        size="sm"
                    >
                        {isManualSyncing ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Syncing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Sync Now
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
