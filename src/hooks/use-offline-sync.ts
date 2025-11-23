/**
 * React Hook for Offline Sync Manager
 * 
 * This hook provides React components with easy access to the offline sync
 * functionality including connectivity status, queue operations, and sync progress.
 */

import { useEffect, useState, useCallback } from 'react';
import {
    offlineSyncManager,
    SyncOperation,
    ConnectivityStatus,
    QueueStatus
} from '@/lib/offline-sync-manager';

interface SyncProgress {
    operation: SyncOperation;
    progress: number;
}

interface UseOfflineSyncReturn {
    // Connectivity
    connectivityStatus: ConnectivityStatus;
    isOnline: boolean;

    // Queue status
    queueStatus: QueueStatus;
    totalPending: number;

    // Sync progress
    syncProgress: SyncProgress[];
    isSyncing: boolean;

    // Actions
    queueOperation: (operation: Omit<SyncOperation, 'id' | 'retryCount' | 'status'>) => Promise<string>;
    forceSyncPendingOperations: () => Promise<void>;
    retryFailedOperation: (operationId: string) => Promise<void>;

    // Utilities
    refreshStatus: () => Promise<void>;
}

/**
 * Hook for offline sync operations
 */
export function useOfflineSync(): UseOfflineSyncReturn {
    const [connectivityStatus, setConnectivityStatus] = useState<ConnectivityStatus>(
        offlineSyncManager.getConnectivityStatus()
    );
    const [queueStatus, setQueueStatus] = useState<QueueStatus>({
        pending: 0,
        failed: 0,
        completed: 0
    });
    const [syncProgress, setSyncProgress] = useState<SyncProgress[]>([]);

    // Update queue status
    const refreshStatus = useCallback(async () => {
        try {
            const status = await offlineSyncManager.getQueueStatus();
            setQueueStatus(status);
            setConnectivityStatus(offlineSyncManager.getConnectivityStatus());
        } catch (error) {
            console.error('Failed to refresh sync status:', error);
        }
    }, []);

    // Handle connectivity changes
    const handleConnectivityChange = useCallback((isOnline: boolean) => {
        setConnectivityStatus(offlineSyncManager.getConnectivityStatus());
        refreshStatus();
    }, [refreshStatus]);

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
                refreshStatus();
            }, 2000);
        }
    }, [refreshStatus]);

    // Queue operation wrapper
    const queueOperation = useCallback(async (
        operation: Omit<SyncOperation, 'id' | 'retryCount' | 'status'>
    ) => {
        const id = await offlineSyncManager.queueOperation(operation);
        await refreshStatus();
        return id;
    }, [refreshStatus]);

    // Force sync wrapper
    const forceSyncPendingOperations = useCallback(async () => {
        await offlineSyncManager.forceSyncPendingOperations();
        await refreshStatus();
    }, [refreshStatus]);

    // Retry failed operation wrapper
    const retryFailedOperation = useCallback(async (operationId: string) => {
        await offlineSyncManager.retryFailedOperation(operationId);
        await refreshStatus();
    }, [refreshStatus]);

    // Setup event listeners
    useEffect(() => {
        const unsubscribeConnectivity = offlineSyncManager.onConnectivityChange(handleConnectivityChange);
        const unsubscribeSyncProgress = offlineSyncManager.onSyncProgress(handleSyncProgress);

        // Initial status update
        refreshStatus();

        // Periodic status updates
        const interval = setInterval(refreshStatus, 30000); // Every 30 seconds

        return () => {
            unsubscribeConnectivity();
            unsubscribeSyncProgress();
            clearInterval(interval);
        };
    }, [handleConnectivityChange, handleSyncProgress, refreshStatus]);

    // Computed values
    const totalPending = queueStatus.pending + queueStatus.failed;
    const isSyncing = syncProgress.length > 0;
    const isOnline = connectivityStatus.isOnline;

    return {
        // Connectivity
        connectivityStatus,
        isOnline,

        // Queue status
        queueStatus,
        totalPending,

        // Sync progress
        syncProgress,
        isSyncing,

        // Actions
        queueOperation,
        forceSyncPendingOperations,
        retryFailedOperation,

        // Utilities
        refreshStatus,
    };
}

/**
 * Hook for connectivity status only
 */
export function useConnectivityStatus() {
    const [connectivityStatus, setConnectivityStatus] = useState<ConnectivityStatus>(
        offlineSyncManager.getConnectivityStatus()
    );

    useEffect(() => {
        const unsubscribe = offlineSyncManager.onConnectivityChange(() => {
            setConnectivityStatus(offlineSyncManager.getConnectivityStatus());
        });

        return unsubscribe;
    }, []);

    return {
        connectivityStatus,
        isOnline: connectivityStatus.isOnline,
        lastOnlineAt: connectivityStatus.lastOnlineAt,
        lastOfflineAt: connectivityStatus.lastOfflineAt,
    };
}

/**
 * Hook for sync queue status only
 */
export function useSyncQueueStatus() {
    const [queueStatus, setQueueStatus] = useState<QueueStatus>({
        pending: 0,
        failed: 0,
        completed: 0
    });

    const refreshStatus = useCallback(async () => {
        try {
            const status = await offlineSyncManager.getQueueStatus();
            setQueueStatus(status);
        } catch (error) {
            console.error('Failed to refresh queue status:', error);
        }
    }, []);

    useEffect(() => {
        refreshStatus();

        // Refresh on connectivity changes
        const unsubscribe = offlineSyncManager.onConnectivityChange(() => {
            refreshStatus();
        });

        // Periodic updates
        const interval = setInterval(refreshStatus, 30000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [refreshStatus]);

    return {
        queueStatus,
        totalPending: queueStatus.pending + queueStatus.failed,
        refreshStatus,
    };
}