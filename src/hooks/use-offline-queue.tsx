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
    SyncProgress
} from '@/lib/mobile/offline-queue';

export interface UseOfflineQueueReturn {
    isOnline: boolean;
    queue: QueuedOperation[];
    pendingCount: number;
    syncProgress: SyncProgress;
    isSyncing: boolean;
    addOperation: (type: string, action: string, data: any) => Promise<string>;
    syncQueue: () => Promise<void>;
    retryOperation: (operationId: string) => Promise<void>;
    removeOperation: (operationId: string) => Promise<void>;
    clearCompleted: () => Promise<void>;
}

export function useOfflineQueue(): UseOfflineQueueReturn {
    const [isOnline, setIsOnline] = useState(true);
    const [queue, setQueue] = useState<QueuedOperation[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        // Initialize state
        setIsOnline(offlineQueue.isDeviceOnline());
        setQueue(offlineQueue.getQueue());
        setIsSyncing(offlineQueue.isSyncInProgress());

        // Listen for events
        const handleOnline = () => {
            setIsOnline(true);
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        const handleQueueUpdated = (e: Event) => {
            const customEvent = e as CustomEvent;
            setQueue(customEvent.detail.queue);
        };

        const handleSyncStarted = () => {
            setIsSyncing(true);
        };

        const handleSyncCompleted = () => {
            setIsSyncing(false);
            setQueue(offlineQueue.getQueue());
        };

        window.addEventListener('offline-queue:online', handleOnline);
        window.addEventListener('offline-queue:offline', handleOffline);
        window.addEventListener('offline-queue:updated', handleQueueUpdated);
        window.addEventListener('offline-queue:sync-started', handleSyncStarted);
        window.addEventListener('offline-queue:sync-completed', handleSyncCompleted);

        return () => {
            window.removeEventListener('offline-queue:online', handleOnline);
            window.removeEventListener('offline-queue:offline', handleOffline);
            window.removeEventListener('offline-queue:updated', handleQueueUpdated);
            window.removeEventListener('offline-queue:sync-started', handleSyncStarted);
            window.removeEventListener('offline-queue:sync-completed', handleSyncCompleted);
        };
    }, []);

    const addOperation = useCallback(async (type: string, action: string, data: any) => {
        return await offlineQueue.addOperation(type, action, data);
    }, []);

    const syncQueue = useCallback(async () => {
        await offlineQueue.syncQueue();
    }, []);

    const retryOperation = useCallback(async (operationId: string) => {
        await offlineQueue.retryOperation(operationId);
    }, []);

    const removeOperation = useCallback(async (operationId: string) => {
        await offlineQueue.removeOperation(operationId);
    }, []);

    const clearCompleted = useCallback(async () => {
        await offlineQueue.clearCompleted();
    }, []);

    return {
        isOnline,
        queue,
        pendingCount: offlineQueue.getPendingCount(),
        syncProgress: offlineQueue.getSyncProgress(),
        isSyncing,
        addOperation,
        syncQueue,
        retryOperation,
        removeOperation,
        clearCompleted,
    };
}
