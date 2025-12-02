/**
 * React Hook for Offline Sync Management
 * 
 * This hook provides an easy way to integrate offline sync functionality
 * into React components for the open house feature.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { connectivityMonitor, ConnectivityStatus } from './connectivity';
import { openHouseSyncService, SyncResult } from './sync-service';
import { openHouseStore, getOpenHouseStorageStats } from './storage';

/**
 * Offline sync state
 */
export interface OfflineSyncState {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    failedCount: number;
    lastSyncTimestamp: number | null;
    connectivityStatus: ConnectivityStatus;
    conflictCount: number;
}

/**
 * Hook for managing offline sync
 */
export function useOfflineSync() {
    const [state, setState] = useState<OfflineSyncState>({
        isOnline: true,
        isSyncing: false,
        pendingCount: 0,
        failedCount: 0,
        lastSyncTimestamp: null,
        connectivityStatus: 'online',
        conflictCount: 0,
    });

    const [lastSyncResults, setLastSyncResults] = useState<SyncResult[]>([]);

    /**
     * Update sync state
     */
    const updateState = useCallback(async () => {
        const syncStatus = await openHouseSyncService.getSyncStatus();
        const connectivityStatus = connectivityMonitor.getStatus();

        setState({
            isOnline: connectivityStatus === 'online',
            isSyncing: syncStatus.isSyncing,
            pendingCount: syncStatus.pendingCount,
            failedCount: syncStatus.failedCount,
            lastSyncTimestamp: syncStatus.lastSyncTimestamp,
            connectivityStatus,
            conflictCount: syncStatus.conflictCount,
        });
    }, []);

    /**
     * Manually trigger sync
     */
    const sync = useCallback(async () => {
        try {
            const results = await openHouseSyncService.syncPendingOperations();
            setLastSyncResults(results);
            await updateState();
            return results;
        } catch (error) {
            console.error('Sync failed:', error);
            throw error;
        }
    }, [updateState]);

    /**
     * Retry failed operations
     */
    const retryFailed = useCallback(async () => {
        try {
            const results = await openHouseSyncService.retryFailedOperations();
            setLastSyncResults(results);
            await updateState();
            return results;
        } catch (error) {
            console.error('Retry failed:', error);
            throw error;
        }
    }, [updateState]);

    /**
     * Sync operations for a specific session
     */
    const syncSession = useCallback(async (sessionId: string) => {
        try {
            const results = await openHouseSyncService.syncSessionOperations(sessionId);
            setLastSyncResults(results);
            await updateState();
            return results;
        } catch (error) {
            console.error('Session sync failed:', error);
            throw error;
        }
    }, [updateState]);

    /**
     * Get detailed storage statistics
     */
    const getStats = useCallback(async () => {
        return await getOpenHouseStorageStats();
    }, []);

    /**
     * Get conflict logs
     */
    const getConflicts = useCallback(async () => {
        return await openHouseSyncService.getConflictLogs();
    }, []);

    /**
     * Get conflicts for a specific session
     */
    const getSessionConflicts = useCallback(async (sessionId: string) => {
        return await openHouseSyncService.getSessionConflicts(sessionId);
    }, []);

    // Initialize and set up listeners
    useEffect(() => {
        // Initialize services
        connectivityMonitor.initialize();
        openHouseSyncService.initialize();

        // Initial state update
        updateState();

        // Listen for connectivity changes
        const unsubscribeConnectivity = connectivityMonitor.addListener(() => {
            updateState();
        });

        // Listen for sync completion
        const unsubscribeSync = openHouseSyncService.addSyncListener((results) => {
            setLastSyncResults(results);
            updateState();
        });

        // Poll for state updates every 5 seconds
        const pollInterval = setInterval(updateState, 5000);

        // Cleanup
        return () => {
            unsubscribeConnectivity();
            unsubscribeSync();
            clearInterval(pollInterval);
        };
    }, [updateState]);

    return {
        ...state,
        lastSyncResults,
        sync,
        retryFailed,
        syncSession,
        getStats,
        getConflicts,
        getSessionConflicts,
    };
}

/**
 * Hook for connectivity status only
 */
export function useConnectivity() {
    const [status, setStatus] = useState<ConnectivityStatus>('unknown');

    useEffect(() => {
        connectivityMonitor.initialize();
        setStatus(connectivityMonitor.getStatus());

        const unsubscribe = connectivityMonitor.addListener(setStatus);

        return unsubscribe;
    }, []);

    return {
        status,
        isOnline: status === 'online',
        isOffline: status === 'offline',
    };
}

/**
 * Hook for queue status only
 */
export function useQueueStatus() {
    const [queueStatus, setQueueStatus] = useState({
        pending: 0,
        failed: 0,
        completed: 0,
        total: 0,
    });

    const refresh = useCallback(async () => {
        const status = await openHouseStore.getQueueStatus();
        setQueueStatus(status);
    }, []);

    useEffect(() => {
        refresh();

        // Poll every 5 seconds
        const interval = setInterval(refresh, 5000);

        return () => clearInterval(interval);
    }, [refresh]);

    return {
        ...queueStatus,
        refresh,
    };
}
