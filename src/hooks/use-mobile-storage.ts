/**
 * React Hook for Mobile Storage (IndexedDB)
 * 
 * This hook provides React components with easy access to the mobile storage
 * functionality including sync queue, cached content, and drafts.
 */

import { useEffect, useState, useCallback } from 'react';
import {
    syncQueueStore,
    cachedContentStore,
    draftsStore,
    initializeMobileStorage,
    getStorageStats,
} from '@/lib/indexeddb-wrapper';
import {
    SyncQueueItem,
    CachedContentItem,
    DraftItem,
    isIndexedDBSupported,
} from '@/lib/indexeddb-schema';

interface StorageStats {
    syncQueue: { pending: number; failed: number; completed: number };
    cachedContent: number;
    drafts: { total: number; unsynced: number };
}

interface UseMobileStorageReturn {
    // Initialization
    isSupported: boolean;
    isInitialized: boolean;
    initError: Error | null;

    // Storage stats
    stats: StorageStats | null;
    refreshStats: () => Promise<void>;

    // Sync Queue operations
    queueOperation: (type: SyncQueueItem['type'], data: any) => Promise<string>;
    getPendingOperations: () => Promise<SyncQueueItem[]>;
    getFailedOperations: () => Promise<SyncQueueItem[]>;
    updateOperationStatus: (id: string, status: SyncQueueItem['status'], error?: string) => Promise<void>;

    // Cached Content operations
    cacheContent: (
        type: CachedContentItem['type'],
        data: any,
        expirationHours?: number,
        location?: string
    ) => Promise<string>;
    getCachedContent: (id: string) => Promise<CachedContentItem | undefined>;
    getCachedContentByType: (type: CachedContentItem['type']) => Promise<CachedContentItem[]>;
    getCachedContentByLocation: (
        type: CachedContentItem['type'],
        location: string
    ) => Promise<CachedContentItem | undefined>;

    // Drafts operations
    saveDraft: (type: DraftItem['type'], content: any, userId?: string) => Promise<string>;
    updateDraft: (id: string, content: any) => Promise<void>;
    markDraftAsSynced: (id: string) => Promise<void>;
    getUnsyncedDrafts: () => Promise<DraftItem[]>;
    getDraftsByType: (type: DraftItem['type']) => Promise<DraftItem[]>;
    getRecentDrafts: (limit?: number) => Promise<DraftItem[]>;
    deleteDraft: (id: string) => Promise<void>;
}

/**
 * Hook for mobile storage operations
 */
export function useMobileStorage(): UseMobileStorageReturn {
    const [isInitialized, setIsInitialized] = useState(false);
    const [initError, setInitError] = useState<Error | null>(null);
    const [stats, setStats] = useState<StorageStats | null>(null);

    const isSupported = isIndexedDBSupported();

    // Initialize storage on mount
    useEffect(() => {
        if (!isSupported) {
            setInitError(new Error('IndexedDB is not supported in this browser'));
            return;
        }

        const initialize = async () => {
            try {
                await initializeMobileStorage();
                setIsInitialized(true);
                setInitError(null);

                // Load initial stats
                const initialStats = await getStorageStats();
                setStats(initialStats);
            } catch (error) {
                setInitError(error as Error);
                setIsInitialized(false);
            }
        };

        initialize();
    }, [isSupported]);

    // Refresh storage statistics
    const refreshStats = useCallback(async () => {
        if (!isInitialized) return;

        try {
            const newStats = await getStorageStats();
            setStats(newStats);
        } catch (error) {
            console.error('Failed to refresh storage stats:', error);
        }
    }, [isInitialized]);

    // Sync Queue operations
    const queueOperation = useCallback(async (type: SyncQueueItem['type'], data: any) => {
        const id = await syncQueueStore.queueOperation(type, data);
        await refreshStats();
        return id;
    }, [refreshStats]);

    const getPendingOperations = useCallback(async () => {
        return await syncQueueStore.getPendingOperations();
    }, []);

    const getFailedOperations = useCallback(async () => {
        return await syncQueueStore.getFailedOperations();
    }, []);

    const updateOperationStatus = useCallback(async (
        id: string,
        status: SyncQueueItem['status'],
        error?: string
    ) => {
        await syncQueueStore.updateOperationStatus(id, status, error);
        await refreshStats();
    }, [refreshStats]);

    // Cached Content operations
    const cacheContent = useCallback(async (
        type: CachedContentItem['type'],
        data: any,
        expirationHours: number = 24,
        location?: string
    ) => {
        const id = await cachedContentStore.cacheContent(type, data, expirationHours, location);
        await refreshStats();
        return id;
    }, [refreshStats]);

    const getCachedContent = useCallback(async (id: string) => {
        return await cachedContentStore.getCachedContent(id);
    }, []);

    const getCachedContentByType = useCallback(async (type: CachedContentItem['type']) => {
        return await cachedContentStore.getCachedContentByType(type);
    }, []);

    const getCachedContentByLocation = useCallback(async (
        type: CachedContentItem['type'],
        location: string
    ) => {
        return await cachedContentStore.getCachedContentByLocation(type, location);
    }, []);

    // Drafts operations
    const saveDraft = useCallback(async (
        type: DraftItem['type'],
        content: any,
        userId?: string
    ) => {
        const id = await draftsStore.saveDraft(type, content, userId);
        await refreshStats();
        return id;
    }, [refreshStats]);

    const updateDraft = useCallback(async (id: string, content: any) => {
        await draftsStore.updateDraft(id, content);
        await refreshStats();
    }, [refreshStats]);

    const markDraftAsSynced = useCallback(async (id: string) => {
        await draftsStore.markDraftAsSynced(id);
        await refreshStats();
    }, [refreshStats]);

    const getUnsyncedDrafts = useCallback(async () => {
        return await draftsStore.getUnsyncedDrafts();
    }, []);

    const getDraftsByType = useCallback(async (type: DraftItem['type']) => {
        return await draftsStore.getDraftsByType(type);
    }, []);

    const getRecentDrafts = useCallback(async (limit?: number) => {
        return await draftsStore.getRecentDrafts(limit);
    }, []);

    const deleteDraft = useCallback(async (id: string) => {
        await draftsStore.delete(id);
        await refreshStats();
    }, [refreshStats]);

    return {
        // Initialization
        isSupported,
        isInitialized,
        initError,

        // Storage stats
        stats,
        refreshStats,

        // Sync Queue operations
        queueOperation,
        getPendingOperations,
        getFailedOperations,
        updateOperationStatus,

        // Cached Content operations
        cacheContent,
        getCachedContent,
        getCachedContentByType,
        getCachedContentByLocation,

        // Drafts operations
        saveDraft,
        updateDraft,
        markDraftAsSynced,
        getUnsyncedDrafts,
        getDraftsByType,
        getRecentDrafts,
        deleteDraft,
    };
}

/**
 * Hook for sync queue operations specifically
 */
export function useSyncQueue() {
    const {
        queueOperation,
        getPendingOperations,
        getFailedOperations,
        updateOperationStatus,
        stats,
        refreshStats,
    } = useMobileStorage();

    return {
        queueOperation,
        getPendingOperations,
        getFailedOperations,
        updateOperationStatus,
        queueStats: stats?.syncQueue,
        refreshStats,
    };
}

/**
 * Hook for cached content operations specifically
 */
export function useCachedContent() {
    const {
        cacheContent,
        getCachedContent,
        getCachedContentByType,
        getCachedContentByLocation,
        stats,
        refreshStats,
    } = useMobileStorage();

    return {
        cacheContent,
        getCachedContent,
        getCachedContentByType,
        getCachedContentByLocation,
        cachedCount: stats?.cachedContent,
        refreshStats,
    };
}

/**
 * Hook for drafts operations specifically
 */
export function useDrafts() {
    const {
        saveDraft,
        updateDraft,
        markDraftAsSynced,
        getUnsyncedDrafts,
        getDraftsByType,
        getRecentDrafts,
        deleteDraft,
        stats,
        refreshStats,
    } = useMobileStorage();

    return {
        saveDraft,
        updateDraft,
        markDraftAsSynced,
        getUnsyncedDrafts,
        getDraftsByType,
        getRecentDrafts,
        deleteDraft,
        draftsStats: stats?.drafts,
        refreshStats,
    };
}