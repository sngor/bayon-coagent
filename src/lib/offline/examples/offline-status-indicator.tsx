/**
 * Example: Offline Status Indicator Component
 * 
 * This component demonstrates how to use the offline sync hooks
 * to display connectivity status and sync information to users.
 */

'use client';

import { useOfflineSync } from '../use-offline-sync';
import { formatDistanceToNow } from 'date-fns';

export function OfflineStatusIndicator() {
    const {
        isOnline,
        isSyncing,
        pendingCount,
        failedCount,
        lastSyncTimestamp,
        sync,
        retryFailed,
    } = useOfflineSync();

    // Don't show anything if online and no pending operations
    if (isOnline && pendingCount === 0 && failedCount === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
                {/* Connectivity Status */}
                <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium">
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>

                {/* Offline Message */}
                {!isOnline && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        You are offline. Changes will sync when connection is restored.
                    </p>
                )}

                {/* Syncing Status */}
                {isSyncing && (
                    <div className="flex items-center gap-2 mb-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                        <span className="text-sm text-blue-600 dark:text-blue-400">
                            Syncing operations...
                        </span>
                    </div>
                )}

                {/* Pending Operations */}
                {pendingCount > 0 && (
                    <div className="mb-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            {pendingCount} operation{pendingCount !== 1 ? 's' : ''} pending sync
                        </p>
                    </div>
                )}

                {/* Failed Operations */}
                {failedCount > 0 && (
                    <div className="mb-3">
                        <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                            {failedCount} operation{failedCount !== 1 ? 's' : ''} failed
                        </p>
                        <button
                            onClick={retryFailed}
                            disabled={!isOnline || isSyncing}
                            className="text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-3 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Retry Failed
                        </button>
                    </div>
                )}

                {/* Last Sync Time */}
                {lastSyncTimestamp && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Last synced {formatDistanceToNow(lastSyncTimestamp, { addSuffix: true })}
                    </p>
                )}

                {/* Manual Sync Button */}
                {isOnline && pendingCount > 0 && (
                    <button
                        onClick={sync}
                        disabled={isSyncing}
                        className="w-full text-sm bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                )}
            </div>
        </div>
    );
}
