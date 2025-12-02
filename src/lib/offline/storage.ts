/**
 * Offline Storage for Open House Enhancement
 * 
 * This module provides IndexedDB storage utilities for offline operation queuing
 * specific to the open house feature. It extends the existing mobile storage
 * infrastructure to support check-ins, updates, deletes, and photo uploads.
 */

import {
    getDatabase,
    generateId,
    isIndexedDBSupported,
} from '../indexeddb-schema';

// Store names for open house operations
export const OPEN_HOUSE_STORE = 'openHouseOperations';
export const CONFLICT_LOG_STORE = 'conflictLogs';

// Database configuration for open house
export const OPEN_HOUSE_DB_NAME = 'bayon-open-house';
export const OPEN_HOUSE_DB_VERSION = 2; // Incremented for conflict log store

/**
 * Type definitions for open house offline operations
 */
export interface OpenHouseOperation {
    id: string; // Primary key
    type: 'checkIn' | 'updateVisitor' | 'deleteVisitor' | 'updateSession' | 'photoUpload' | 'addNote';
    entity: 'session' | 'visitor' | 'photo';
    sessionId: string;
    visitorId?: string;
    data: any;
    timestamp: number;
    status: 'pending' | 'syncing' | 'failed' | 'completed';
    retryCount: number;
    error?: string;
    userId: string;
    conflictResolved?: boolean;
    conflictStrategy?: 'last-write-wins';
}

/**
 * Conflict log entry for tracking sync conflicts
 */
export interface ConflictLog {
    id: string;
    operationId: string;
    sessionId: string;
    visitorId?: string;
    type: OpenHouseOperation['type'];
    localData: any;
    serverData: any;
    resolution: 'last-write-wins' | 'manual';
    resolvedData: any;
    timestamp: number;
    userId: string;
}

/**
 * Initialize the open house IndexedDB database
 */
export function initializeOpenHouseDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (!isIndexedDBSupported()) {
            reject(new Error('IndexedDB is not supported in this environment'));
            return;
        }

        const request = indexedDB.open(OPEN_HOUSE_DB_NAME, OPEN_HOUSE_DB_VERSION);

        request.onerror = () => {
            reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const oldVersion = event.oldVersion;

            // Create openHouseOperations store
            if (!db.objectStoreNames.contains(OPEN_HOUSE_STORE)) {
                const store = db.createObjectStore(OPEN_HOUSE_STORE, {
                    keyPath: 'id'
                });

                // Create indexes for efficient querying
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('sessionId', 'sessionId', { unique: false });
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('type_status', ['type', 'status'], { unique: false });
                store.createIndex('sessionId_status', ['sessionId', 'status'], { unique: false });
            }

            // Create conflictLogs store (version 2+)
            if (oldVersion < 2 && !db.objectStoreNames.contains(CONFLICT_LOG_STORE)) {
                const conflictStore = db.createObjectStore(CONFLICT_LOG_STORE, {
                    keyPath: 'id'
                });

                // Create indexes for conflict logs
                conflictStore.createIndex('operationId', 'operationId', { unique: false });
                conflictStore.createIndex('sessionId', 'sessionId', { unique: false });
                conflictStore.createIndex('timestamp', 'timestamp', { unique: false });
                conflictStore.createIndex('userId', 'userId', { unique: false });
                conflictStore.createIndex('resolution', 'resolution', { unique: false });
            }
        };
    });
}

/**
 * Get a database connection for open house operations
 */
export async function getOpenHouseDatabase(): Promise<IDBDatabase> {
    return initializeOpenHouseDB();
}

/**
 * Base class for open house IndexedDB operations
 */
class OpenHouseStore {
    private storeName = OPEN_HOUSE_STORE;

    protected async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        const db = await getOpenHouseDatabase();
        const transaction = db.transaction([this.storeName], mode);
        return transaction.objectStore(this.storeName);
    }

    protected promisifyRequest<R>(request: IDBRequest<R>): Promise<R> {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Queue an operation for offline sync
     */
    async queueOperation(
        type: OpenHouseOperation['type'],
        entity: OpenHouseOperation['entity'],
        sessionId: string,
        data: any,
        userId: string,
        visitorId?: string
    ): Promise<string> {
        const id = generateId();
        const operation: OpenHouseOperation = {
            id,
            type,
            entity,
            sessionId,
            visitorId,
            data,
            timestamp: Date.now(),
            status: 'pending',
            retryCount: 0,
            userId,
        };

        const store = await this.getStore('readwrite');
        await this.promisifyRequest(store.add(operation));
        return id;
    }

    /**
     * Get all pending operations in chronological order
     */
    async getPendingOperations(): Promise<OpenHouseOperation[]> {
        const store = await this.getStore('readonly');
        const index = store.index('status');
        const operations = await this.promisifyRequest(index.getAll('pending'));

        // Sort by timestamp to ensure chronological processing
        return operations.sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Get pending operations for a specific session
     */
    async getPendingOperationsBySession(sessionId: string): Promise<OpenHouseOperation[]> {
        const store = await this.getStore('readonly');
        const index = store.index('sessionId_status');
        const operations = await this.promisifyRequest(index.getAll([sessionId, 'pending']));

        // Sort by timestamp
        return operations.sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Get failed operations
     */
    async getFailedOperations(): Promise<OpenHouseOperation[]> {
        const store = await this.getStore('readonly');
        const index = store.index('status');
        return await this.promisifyRequest(index.getAll('failed'));
    }

    /**
     * Get a specific operation by ID
     */
    async getOperation(id: string): Promise<OpenHouseOperation | undefined> {
        const store = await this.getStore('readonly');
        return await this.promisifyRequest(store.get(id));
    }

    /**
     * Update operation status
     */
    async updateOperationStatus(
        id: string,
        status: OpenHouseOperation['status'],
        error?: string
    ): Promise<void> {
        const operation = await this.getOperation(id);
        if (operation) {
            operation.status = status;
            if (error) {
                operation.error = error;
            }
            if (status === 'failed') {
                operation.retryCount += 1;
            }

            const store = await this.getStore('readwrite');
            await this.promisifyRequest(store.put(operation));
        }
    }

    /**
     * Delete an operation
     */
    async deleteOperation(id: string): Promise<void> {
        const store = await this.getStore('readwrite');
        await this.promisifyRequest(store.delete(id));
    }

    /**
     * Get queue status statistics
     */
    async getQueueStatus(): Promise<{
        pending: number;
        failed: number;
        completed: number;
        total: number;
    }> {
        const store = await this.getStore('readonly');
        const index = store.index('status');

        const [pending, failed, completed, total] = await Promise.all([
            this.promisifyRequest(index.count('pending')),
            this.promisifyRequest(index.count('failed')),
            this.promisifyRequest(index.count('completed')),
            this.promisifyRequest(store.count()),
        ]);

        return { pending, failed, completed, total };
    }

    /**
     * Get the timestamp of the last successful sync
     */
    async getLastSyncTimestamp(): Promise<number | null> {
        const store = await this.getStore('readonly');
        const index = store.index('status');
        const completedOps = await this.promisifyRequest(index.getAll('completed'));

        if (completedOps.length === 0) {
            return null;
        }

        // Find the most recent completed operation
        const mostRecent = completedOps.reduce((latest, op) =>
            op.timestamp > latest.timestamp ? op : latest
        );

        return mostRecent.timestamp;
    }

    /**
     * Clean up completed operations older than specified hours
     */
    async cleanupCompletedOperations(olderThanHours: number = 24): Promise<void> {
        const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
        const store = await this.getStore('readwrite');
        const index = store.index('status');

        return new Promise<void>((resolve, reject) => {
            const deletePromises: Promise<void>[] = [];
            const request = index.openCursor('completed');

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor) {
                    const operation = cursor.value as OpenHouseOperation;
                    if (operation.timestamp < cutoffTime) {
                        deletePromises.push(this.promisifyRequest(cursor.delete()));
                    }
                    cursor.continue();
                } else {
                    // No more items, wait for all deletes to complete
                    Promise.all(deletePromises).then(() => resolve()).catch(reject);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all operations (useful for testing or reset)
     */
    async clearAll(): Promise<void> {
        const store = await this.getStore('readwrite');
        await this.promisifyRequest(store.clear());
    }

    /**
     * Get operations count by type
     */
    async getOperationCountByType(): Promise<Record<OpenHouseOperation['type'], number>> {
        const store = await this.getStore('readonly');
        const index = store.index('type');

        const types: OpenHouseOperation['type'][] = [
            'checkIn',
            'updateVisitor',
            'deleteVisitor',
            'updateSession',
            'photoUpload',
            'addNote'
        ];

        const counts = await Promise.all(
            types.map(type => this.promisifyRequest(index.count(type)))
        );

        return types.reduce((acc, type, idx) => {
            acc[type] = counts[idx];
            return acc;
        }, {} as Record<OpenHouseOperation['type'], number>);
    }

    /**
     * Mark operation as having a conflict resolved
     */
    async markConflictResolved(
        id: string,
        strategy: 'last-write-wins'
    ): Promise<void> {
        const operation = await this.getOperation(id);
        if (operation) {
            operation.conflictResolved = true;
            operation.conflictStrategy = strategy;

            const store = await this.getStore('readwrite');
            await this.promisifyRequest(store.put(operation));
        }
    }
}

/**
 * Conflict log management class
 */
class ConflictLogStore {
    private storeName = CONFLICT_LOG_STORE;

    protected async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        const db = await getOpenHouseDatabase();
        const transaction = db.transaction([this.storeName], mode);
        return transaction.objectStore(this.storeName);
    }

    protected promisifyRequest<R>(request: IDBRequest<R>): Promise<R> {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Log a conflict
     */
    async logConflict(
        operationId: string,
        sessionId: string,
        type: OpenHouseOperation['type'],
        localData: any,
        serverData: any,
        resolution: ConflictLog['resolution'],
        resolvedData: any,
        userId: string,
        visitorId?: string
    ): Promise<string> {
        const id = generateId();
        const conflictLog: ConflictLog = {
            id,
            operationId,
            sessionId,
            visitorId,
            type,
            localData,
            serverData,
            resolution,
            resolvedData,
            timestamp: Date.now(),
            userId,
        };

        const store = await this.getStore('readwrite');
        await this.promisifyRequest(store.add(conflictLog));
        return id;
    }

    /**
     * Get all conflict logs
     */
    async getAllConflicts(): Promise<ConflictLog[]> {
        const store = await this.getStore('readonly');
        const conflicts = await this.promisifyRequest(store.getAll());

        // Sort by timestamp descending (most recent first)
        return conflicts.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Get conflicts for a specific session
     */
    async getConflictsBySession(sessionId: string): Promise<ConflictLog[]> {
        const store = await this.getStore('readonly');
        const index = store.index('sessionId');
        const conflicts = await this.promisifyRequest(index.getAll(sessionId));

        return conflicts.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Get conflicts for a specific operation
     */
    async getConflictsByOperation(operationId: string): Promise<ConflictLog[]> {
        const store = await this.getStore('readonly');
        const index = store.index('operationId');
        return await this.promisifyRequest(index.getAll(operationId));
    }

    /**
     * Get conflict count
     */
    async getConflictCount(): Promise<number> {
        const store = await this.getStore('readonly');
        return await this.promisifyRequest(store.count());
    }

    /**
     * Get conflicts by resolution strategy
     */
    async getConflictsByResolution(resolution: ConflictLog['resolution']): Promise<ConflictLog[]> {
        const store = await this.getStore('readonly');
        const index = store.index('resolution');
        return await this.promisifyRequest(index.getAll(resolution));
    }

    /**
     * Delete a conflict log
     */
    async deleteConflict(id: string): Promise<void> {
        const store = await this.getStore('readwrite');
        await this.promisifyRequest(store.delete(id));
    }

    /**
     * Clean up old conflict logs
     */
    async cleanupOldConflicts(olderThanHours: number = 168): Promise<void> {
        const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
        const store = await this.getStore('readwrite');

        return new Promise<void>((resolve, reject) => {
            const deletePromises: Promise<void>[] = [];
            const request = store.openCursor();

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor) {
                    const conflict = cursor.value as ConflictLog;
                    if (conflict.timestamp < cutoffTime) {
                        deletePromises.push(this.promisifyRequest(cursor.delete()));
                    }
                    cursor.continue();
                } else {
                    Promise.all(deletePromises).then(() => resolve()).catch(reject);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all conflict logs
     */
    async clearAll(): Promise<void> {
        const store = await this.getStore('readwrite');
        await this.promisifyRequest(store.clear());
    }
}

// Export singleton instances
export const openHouseStore = new OpenHouseStore();
export const conflictLogStore = new ConflictLogStore();

/**
 * Initialize open house storage and perform cleanup
 */
export async function initializeOpenHouseStorage(): Promise<void> {
    try {
        // Initialize the database
        await getOpenHouseDatabase();

        // Perform cleanup of old completed operations
        await openHouseStore.cleanupCompletedOperations();

        console.log('Open house storage initialized successfully');
    } catch (error) {
        console.error('Failed to initialize open house storage:', error);
        throw error;
    }
}

/**
 * Get comprehensive storage statistics
 */
export async function getOpenHouseStorageStats(): Promise<{
    queueStatus: {
        pending: number;
        failed: number;
        completed: number;
        total: number;
    };
    operationsByType: Record<OpenHouseOperation['type'], number>;
    lastSyncTimestamp: number | null;
    conflictCount: number;
}> {
    const [queueStatus, operationsByType, lastSyncTimestamp, conflictCount] = await Promise.all([
        openHouseStore.getQueueStatus(),
        openHouseStore.getOperationCountByType(),
        openHouseStore.getLastSyncTimestamp(),
        conflictLogStore.getConflictCount(),
    ]);

    return {
        queueStatus,
        operationsByType,
        lastSyncTimestamp,
        conflictCount,
    };
}

/**
 * Delete the open house database (useful for testing or reset)
 */
export function deleteOpenHouseDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!isIndexedDBSupported()) {
            reject(new Error('IndexedDB is not supported in this environment'));
            return;
        }

        const deleteRequest = indexedDB.deleteDatabase(OPEN_HOUSE_DB_NAME);

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
