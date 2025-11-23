/**
 * IndexedDB Schema Configuration for Mobile Enhancements
 * 
 * This module provides the schema definition and initialization for the
 * offline-first mobile features including sync queue, cached content, and drafts.
 */

// Database configuration
export const DB_NAME = 'bayon-mobile';
export const DB_VERSION = 1;

// Store names
export const STORES = {
    SYNC_QUEUE: 'syncQueue',
    CACHED_CONTENT: 'cachedContent',
    DRAFTS: 'drafts',
} as const;

// Type definitions for store data
export interface SyncQueueItem {
    id: string; // Primary key
    type: 'photo' | 'voice' | 'content' | 'checkin' | 'edit' | 'meeting-prep' | 'market-stats' | 'comparison';
    data: any;
    timestamp: number;
    retryCount: number;
    status: 'pending' | 'syncing' | 'failed' | 'completed';
    error?: string;
}

export interface CachedContentItem {
    id: string; // Primary key
    type: 'market-stats' | 'property' | 'content' | 'meeting-materials';
    data: any;
    cachedAt: number;
    expiresAt: number;
    location?: string; // For location-based caching like market stats
}

export interface DraftItem {
    id: string; // Primary key
    type: 'blog' | 'social' | 'market-update' | 'notes' | 'listing-description' | 'meeting-prep';
    content: any;
    lastModified: number;
    synced: boolean;
    userId?: string; // For multi-user support
}

/**
 * Initialize IndexedDB with the required schema
 */
export function initializeIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            reject(new Error('IndexedDB is not supported in this environment'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create syncQueue store
            if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                const syncQueueStore = db.createObjectStore(STORES.SYNC_QUEUE, {
                    keyPath: 'id'
                });

                // Create indexes for efficient querying
                syncQueueStore.createIndex('type', 'type', { unique: false });
                syncQueueStore.createIndex('status', 'status', { unique: false });
                syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
                syncQueueStore.createIndex('type_status', ['type', 'status'], { unique: false });
            }

            // Create cachedContent store
            if (!db.objectStoreNames.contains(STORES.CACHED_CONTENT)) {
                const cachedContentStore = db.createObjectStore(STORES.CACHED_CONTENT, {
                    keyPath: 'id'
                });

                // Create indexes for efficient querying
                cachedContentStore.createIndex('type', 'type', { unique: false });
                cachedContentStore.createIndex('expiresAt', 'expiresAt', { unique: false });
                cachedContentStore.createIndex('location', 'location', { unique: false });
                cachedContentStore.createIndex('type_location', ['type', 'location'], { unique: false });
            }

            // Create drafts store
            if (!db.objectStoreNames.contains(STORES.DRAFTS)) {
                const draftsStore = db.createObjectStore(STORES.DRAFTS, {
                    keyPath: 'id'
                });

                // Create indexes for efficient querying
                draftsStore.createIndex('type', 'type', { unique: false });
                draftsStore.createIndex('synced', 'synced', { unique: false });
                draftsStore.createIndex('lastModified', 'lastModified', { unique: false });
                draftsStore.createIndex('userId', 'userId', { unique: false });
                draftsStore.createIndex('type_synced', ['type', 'synced'], { unique: false });
            }
        };
    });
}

/**
 * Get a database connection
 */
export async function getDatabase(): Promise<IDBDatabase> {
    return initializeIndexedDB();
}

/**
 * Close database connection
 */
export function closeDatabase(db: IDBDatabase): void {
    if (db && !db.objectStoreNames.contains('closed')) {
        db.close();
    }
}

/**
 * Delete the entire database (useful for testing or reset)
 */
export function deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            reject(new Error('IndexedDB is not supported in this environment'));
            return;
        }

        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

        deleteRequest.onerror = () => {
            reject(new Error(`Failed to delete database: ${deleteRequest.error?.message}`));
        };

        deleteRequest.onsuccess = () => {
            resolve();
        };

        deleteRequest.onblocked = () => {
            console.warn('Database deletion blocked. Close all connections and try again.');
        };
    });
}

/**
 * Check if IndexedDB is supported
 */
export function isIndexedDBSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Get storage quota information
 */
export async function getStorageQuota(): Promise<{ quota: number; usage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
            quota: estimate.quota || 0,
            usage: estimate.usage || 0,
        };
    }

    return { quota: 0, usage: 0 };
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
        return await navigator.storage.persist();
    }

    return false;
}

/**
 * Utility function to generate unique IDs
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Utility function to check if data has expired
 */
export function isExpired(expiresAt: number): boolean {
    return Date.now() > expiresAt;
}

/**
 * Utility function to create expiration timestamp
 */
export function createExpirationTimestamp(hoursFromNow: number): number {
    return Date.now() + (hoursFromNow * 60 * 60 * 1000);
}