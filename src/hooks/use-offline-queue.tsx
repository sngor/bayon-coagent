'use client';

/**
 * Offline Queue Hook
 * 
 * React hook for offline queue functionality:
 * - Queue operations
 * - Sync status
 * - Online/offline state
 * 
 * Requirements: 2.4, 2.5, 6.1, 6.2, 6.3, 6.4
 */

import { useState, useEffect, useCallback } from 'react';
import {
    offlineQueue,
    QueuedOperation,
    SyncProgress,
    OperationType
} from '@/lib/mobile/offline-queue';

export interface UseOfflineQueueReturn {
    isOnline: boolean;
    queue: QueuedOperation[];
    pendingCount: number;
    syncProgress: SyncProgress;
    isSyncing: boolean;
    addOperation: (type: OperationType, data: any) => Promise<string>;
    syncQueue: () => Promise<void>;
    clearCompleted: () => Promise<void>;
}

export function useOfflineQueue(): UseOfflineQueueReturn {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [queue, setQueue] = useState<QueuedOperation[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncProgress, setSyncProgress] = useState<SyncProgress>({
        total: 0,
        completed: 0,
        failed: 0,
        inProgress: 0,
    });
    const [isSyncing, setIsSyncing] = useState(false);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                await offlineQueue.init();
                const allOps = await offlineQueue.getAllOperations();
                const pending = await offlineQueue.getQueueSize();
                const progress = await offlineQueue.getSyncProgress();

                setQueue(allOps);
                setPendingCount(pending);
                setSyncProgress(progress);
            } catch (error) {
                console.error('[useOfflineQueue] Failed to load data:', error);
            }
        };

        loadData();
    }, []);

    // Listen for online/offline events
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Subscribe to sync progress updates
    useEffect(() => {
        const unsubscribe = offlineQueue.onSyncProgress((progress) => {
            setSyncProgress(progress);
            setIsSyncing(progress.inProgress > 0);
        });

        return unsubscribe;
    }, []);

    const addOperation = useCallback(async (type: OperationType, data: any) => {
        const id = await offlineQueue.enqueue(type, data);

        // Refresh queue
        const allOps = await offlineQueue.getAllOperations();
        const pending = await offlineQueue.getQueueSize();
        setQueue(allOps);
        setPendingCount(pending);

        return id;
    }, []);

    const syncQueue = useCallback(async () => {
        setIsSyncing(true);
        try {
            await offlineQueue.syncAll();

            // Refresh queue
            const allOps = await offlineQueue.getAllOperations();
            const pending = await offlineQueue.getQueueSize();
            const progress = await offlineQueue.getSyncProgress();

            setQueue(allOps);
            setPendingCount(pending);
            setSyncProgress(progress);
        } finally {
            setIsSyncing(false);
        }
    }, []);

    const clearCompleted = useCallback(async () => {
        await offlineQueue.clearCompleted();

        // Refresh queue
        const allOps = await offlineQueue.getAllOperations();
        const pending = await offlineQueue.getQueueSize();
        setQueue(allOps);
        setPendingCount(pending);
    }, []);

    return {
        isOnline,
        queue,
        pendingCount,
        syncProgress,
        isSyncing,
        addOperation,
        syncQueue,
        clearCompleted,
    };
}
