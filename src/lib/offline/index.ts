/**
 * Offline Support Module for Open House Enhancement
 * 
 * This module provides comprehensive offline support including:
 * - IndexedDB storage for queued operations
 * - Connectivity monitoring
 * - Automatic sync service
 * - React hooks for easy integration
 */

// Storage
export {
    openHouseStore,
    conflictLogStore,
    initializeOpenHouseStorage,
    getOpenHouseStorageStats,
    deleteOpenHouseDatabase,
    OPEN_HOUSE_STORE,
    CONFLICT_LOG_STORE,
    OPEN_HOUSE_DB_NAME,
    OPEN_HOUSE_DB_VERSION,
} from './storage';

export type { OpenHouseOperation, ConflictLog } from './storage';

// Connectivity
export {
    connectivityMonitor,
} from './connectivity';

export type { ConnectivityStatus, ConnectivityListener } from './connectivity';

// Sync Service
export {
    openHouseSyncService,
    initializeSyncService,
    queueOfflineOperation,
} from './sync-service';

export type { SyncResult, SyncServiceConfig } from './sync-service';

// React Hooks
export {
    useOfflineSync,
    useConnectivity,
    useQueueStatus,
} from './use-offline-sync';

export type { OfflineSyncState } from './use-offline-sync';
