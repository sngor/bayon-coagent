'use client';

/**
 * Offline Status Indicator Component
 * 
 * A prominent, always-visible indicator that displays when the user is offline.
 * Shows connectivity status and provides quick access to sync information.
 * 
 * This component is designed to be placed at the top of pages or in a fixed
 * position to ensure users are always aware of their offline status.
 * 
 * Validates Requirements 8.1, 8.5
 */

import { useOfflineSync } from '@/lib/offline/use-offline-sync';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import {
    CloudOff,
    Cloud,
    RefreshCw,
    AlertTriangle,
    WifiOff,
    CheckCircle2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface OfflineStatusIndicatorProps {
    /**
     * Position of the indicator
     * @default 'fixed-top'
     */
    position?: 'fixed-top' | 'fixed-bottom' | 'inline';

    /**
     * Whether to show when online with no pending operations
     * @default false
     */
    showWhenOnline?: boolean;

    /**
     * Custom className
     */
    className?: string;
}

export function OfflineStatusIndicator({
    position = 'fixed-top',
    showWhenOnline = false,
    className,
}: OfflineStatusIndicatorProps) {
    const {
        isOnline,
        isSyncing,
        pendingCount,
        failedCount,
        lastSyncTimestamp,
        sync,
        retryFailed,
    } = useOfflineSync();

    // Don't show if online and no pending/failed operations (unless showWhenOnline is true)
    if (!showWhenOnline && isOnline && pendingCount === 0 && failedCount === 0) {
        return null;
    }

    const positionClasses = {
        'fixed-top': 'fixed top-0 left-0 right-0 z-50',
        'fixed-bottom': 'fixed bottom-0 left-0 right-0 z-50',
        'inline': 'relative',
    };

    // Offline state
    if (!isOnline) {
        return (
            <div className={cn(positionClasses[position], className)}>
                <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
                    <WifiOff className="h-4 w-4" />
                    <AlertTitle className="flex items-center gap-2">
                        You're Offline
                        {pendingCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {pendingCount} pending
                            </Badge>
                        )}
                    </AlertTitle>
                    <AlertDescription>
                        Your changes are being saved locally and will sync automatically when your connection is restored.
                        {lastSyncTimestamp && (
                            <span className="block mt-1 text-xs opacity-80">
                                Last synced {formatDistanceToNow(lastSyncTimestamp, { addSuffix: true })}
                            </span>
                        )}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Syncing state
    if (isSyncing) {
        return (
            <div className={cn(positionClasses[position], className)}>
                <Alert className="rounded-none border-x-0 border-t-0 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-900 dark:text-blue-100">
                        Syncing Operations
                    </AlertTitle>
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                        Syncing {pendingCount} operation{pendingCount !== 1 ? 's' : ''} with the server...
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Failed operations state
    if (failedCount > 0) {
        return (
            <div className={cn(positionClasses[position], className)}>
                <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex items-center gap-2">
                        Sync Failed
                        <Badge variant="secondary" className="ml-2">
                            {failedCount} failed
                        </Badge>
                    </AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>
                            Some operations couldn't be synced. Please check your connection and try again.
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={retryFailed}
                            className="ml-4 shrink-0"
                        >
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Pending operations state (online but not syncing)
    if (pendingCount > 0) {
        return (
            <div className={cn(positionClasses[position], className)}>
                <Alert className="rounded-none border-x-0 border-t-0 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                    <Cloud className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertTitle className="text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                        Pending Sync
                        <Badge variant="secondary" className="ml-2">
                            {pendingCount} pending
                        </Badge>
                    </AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-300 flex items-center justify-between">
                        <span>
                            You have {pendingCount} operation{pendingCount !== 1 ? 's' : ''} waiting to sync.
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={sync}
                            className="ml-4 shrink-0"
                        >
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Sync Now
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // All synced state (only shown if showWhenOnline is true)
    if (showWhenOnline) {
        return (
            <div className={cn(positionClasses[position], className)}>
                <Alert className="rounded-none border-x-0 border-t-0 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-900 dark:text-green-100">
                        All Synced
                    </AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">
                        All operations are synced with the server.
                        {lastSyncTimestamp && (
                            <span className="block mt-1 text-xs opacity-80">
                                Last synced {formatDistanceToNow(lastSyncTimestamp, { addSuffix: true })}
                            </span>
                        )}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return null;
}

/**
 * Compact Offline Badge
 * 
 * A small badge that can be placed inline to show offline status
 */
export function OfflineBadge() {
    const { isOnline, pendingCount } = useOfflineSync();

    if (isOnline && pendingCount === 0) {
        return null;
    }

    return (
        <Badge
            variant={isOnline ? 'secondary' : 'destructive'}
            className="gap-1"
        >
            {isOnline ? (
                <>
                    <Cloud className="h-3 w-3" />
                    {pendingCount} pending
                </>
            ) : (
                <>
                    <CloudOff className="h-3 w-3" />
                    Offline
                </>
            )}
        </Badge>
    );
}

/**
 * Inline Offline Message
 * 
 * A simple text message that can be placed inline to inform users about offline mode
 */
export function OfflineMessage() {
    const { isOnline, pendingCount } = useOfflineSync();

    if (isOnline && pendingCount === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isOnline ? (
                <>
                    <Cloud className="h-4 w-4" />
                    <span>
                        {pendingCount} operation{pendingCount !== 1 ? 's' : ''} pending sync
                    </span>
                </>
            ) : (
                <>
                    <CloudOff className="h-4 w-4 text-orange-500" />
                    <span className="text-orange-600 dark:text-orange-400">
                        You're offline - changes will sync when connection is restored
                    </span>
                </>
            )}
        </div>
    );
}
