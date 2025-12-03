/**
 * React Hook for Offline Queue
 * 
 * Provides access to offline queue functionality in React components.
 * 
 * Requirements: 2.4, 2.5, 6.2, 6.3, 6.4
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    offlineQueue,
    type OperationType,
    type QueuedOperation,
    type SyncProgress,
    type SyncResult,
} from '@/lib/mobile/offline-queue';

export interface UseOfflineQueueReturn {
    queueSize: number;
    operations: QueuedOperation[];
    syncProgress: SyncProgress;
    isInitialized: boolean;
    enqueue: (type: OperationType, payload: any) => Promise<string>;
    syncAll: () => Promise<SyncResult[]>;
    retryFailed: () => Promise<SyncResult[]>;
    clearCompleted: () => Promise<void>;
    clearAll: () => Promise<void>;
}

export function useOfflineQueue(): UseOfflineQueueReturn {
    const [queueSize, setQueueSize] = useState(0);
    const [operations, setOperations] = useState<QueuedOperation[]>([]);
    const [syncProgress, setSyncProgress] = useState<SyncProgress>({
        total: 0,
        completed: 0,
        failed: 0,
        inProgress: 0,
    });
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize queue
    useEffect(() => {
        const init = async () => {
            try {
                await offlineQueue.init();
                setIsInitialized(true);
                await updateState();
            } catch (error) {
                console.error('[useOfflineQueue] Initialization failed:', error);
            }
        };

        init();
    }, []);

    // Update state
    const updateState = useCallback(async () => {
        try {
            const [size, ops, progress] = await Promise.all([
                offlineQueue.getQueueSize(),
                offlineQueue.getAllOperations(),
                offlineQueue.getSyncProgress(),
            ]);

            setQueueSize(size);
            setOperations(ops);
            setSyncProgress(progress);
        } catch (error) {
            console.error('[useOfflineQueue] Failed to update state:', error);
        }
    }, []);

    // Subscribe to sync progress
    useEffect(() => {
        if (!isInitialized) return;

        const unsubscribe = offlineQueue.onSyncProgress((progress) => {
            setSyncProgress(progress);
            updateState();
        });

        return unsubscribe;
    }, [isInitialized, updateState]);

    // Enqueue operation
    const enqueue = useCallback(
        async (type: OperationType, payload: any): Promise<string> => {
            const id = await offlineQueue.enqueue(type, payload);
            await updateState();
            return id;
        },
        [updateState]
    );

    // Sync all operations
    const syncAll = useCallback(async (): Promise<SyncResult[]> => {
        const results = await offlineQueue.syncAll();
        await updateState();
        return results;
    }, [updateState]);

    // Retry failed operations
    const retryFailed = useCallback(async (): Promise<SyncResult[]> => {
        const results = await offlineQueue.retryFailed();
        await updateState();
        return results;
    }, [updateState]);

    // Clear completed operations
    const clearCompleted = useCallback(async (): Promise<void> => {
        await offlineQueue.clearCompleted();
        await updateState();
    }, [updateState]);

    // Clear all operations
    const clearAll = useCallback(async (): Promise<void> => {
        await offlineQueue.clearAll();
        await updateState();
    }, [updateState]);

    return {
        queueSize,
        operations,
        syncProgress,
        isInitialized,
        enqueue,
        syncAll,
        retryFailed,
        clearCompleted,
        clearAll,
    };
}
