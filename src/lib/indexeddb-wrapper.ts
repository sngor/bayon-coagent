/**
 * IndexedDB Wrapper for Mobile Enhancements
 * 
 * This module provides a high-level API for interacting with the IndexedDB stores
 * defined in the mobile enhancements schema.
 */

import {
    getDatabase,
    STORES,
    SyncQueueItem,
    CachedContentItem,
    DraftItem,
    generateId,
    isExpired,
    createExpirationTimestamp,
} from './indexeddb-schema';

/**
 * Base class for IndexedDB operations
 */
class IndexedDBStore<T> {
    constructor(private storeName: string) { }

    protected async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        const db = await getDatabase();
        const transaction = db.transaction([this.storeName], mode);
        return transaction.objectStore(this.storeName);
    }

    protected promisifyRequest<R>(request: IDBRequest<R>): Promise<R> {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async add(item: T): Promise<void> {
        const store = await this.getStore('readwrite');
        await this.promisifyRequest(store.add(item));
    }

    async put(item: T): Promise<void> {
        const store = await this.getStore('readwrite');
        await this.promisifyRequest(store.put(item));
    }

    async get(id: string): Promise<T | undefined> {
        const store = await this.getStore('readonly');
        return await this.promisifyRequest(store.get(id));
    }

    async delete(id: string): Promise<void> {
        const store = await this.getStore('readwrite');
        await this.promisifyRequest(store.delete(id));
    }

    async clear(): Promise<void> {
        const store = await this.getStore('readwrite');
        await this.promisifyRequest(store.clear());
    }

    async getAll(): Promise<T[]> {
        const store = await this.getStore('readonly');
        return await this.promisifyRequest(store.getAll());
    }

    async count(): Promise<number> {
        const store = await this.getStore('readonly');
        return await this.promisifyRequest(store.count());
    }
}

/**
 * Sync Queue Store Operations
 */
export class SyncQueueStore extends IndexedDBStore<SyncQueueItem> {
    constructor() {
        super(STORES.SYNC_QUEUE);
    }

    async queueOperation(
        type: SyncQueueItem['type'],
        data: any
    ): Promise<string> {
        const id = generateId();
        const item: SyncQueueItem = {
            id,
            type,
            data,
            timestamp: Date.now(),
            retryCount: 0,
            status: 'pending',
        };

        await this.add(item);
        return id;
    }

    async getPendingOperations(): Promise<SyncQueueItem[]> {
        const store = await this.getStore('readonly');
        const index = store.index('status');
        return await this.promisifyRequest(index.getAll('pending'));
    }

    async getFailedOperations(): Promise<SyncQueueItem[]> {
        const store = await this.getStore('readonly');
        const index = store.index('status');
        return await this.promisifyRequest(index.getAll('failed'));
    }

    async getOperationsByType(type: SyncQueueItem['type']): Promise<SyncQueueItem[]> {
        const store = await this.getStore('readonly');
        const index = store.index('type');
        return await this.promisifyRequest(index.getAll(type));
    }

    async updateOperationStatus(
        id: string,
        status: SyncQueueItem['status'],
        error?: string
    ): Promise<void> {
        const item = await this.get(id);
        if (item) {
            item.status = status;
            if (error) {
                item.error = error;
            }
            if (status === 'failed') {
                item.retryCount += 1;
            }
            await this.put(item);
        }
    }

    async getQueueStatus(): Promise<{ pending: number; failed: number; completed: number }> {
        const store = await this.getStore('readonly');
        const index = store.index('status');

        const [pending, failed, completed] = await Promise.all([
            this.promisifyRequest(index.count('pending')),
            this.promisifyRequest(index.count('failed')),
            this.promisifyRequest(index.count('completed')),
        ]);

        return { pending, failed, completed };
    }

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
                    const item = cursor.value as SyncQueueItem;
                    if (item.timestamp < cutoffTime) {
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
}

/**
 * Cached Content Store Operations
 */
export class CachedContentStore extends IndexedDBStore<CachedContentItem> {
    constructor() {
        super(STORES.CACHED_CONTENT);
    }

    async cacheContent(
        type: CachedContentItem['type'],
        data: any,
        expirationHours: number = 24,
        location?: string
    ): Promise<string> {
        const id = generateId();
        const item: CachedContentItem = {
            id,
            type,
            data,
            cachedAt: Date.now(),
            expiresAt: createExpirationTimestamp(expirationHours),
            location,
        };

        await this.put(item);
        return id;
    }

    async getCachedContent(id: string): Promise<CachedContentItem | undefined> {
        const item = await this.get(id);
        if (item && !isExpired(item.expiresAt)) {
            return item;
        }

        // Clean up expired item
        if (item) {
            await this.delete(id);
        }

        return undefined;
    }

    async getCachedContentByType(type: CachedContentItem['type']): Promise<CachedContentItem[]> {
        const store = await this.getStore('readonly');
        const index = store.index('type');
        const items = await this.promisifyRequest(index.getAll(type));

        // Filter out expired items and clean them up
        const validItems: CachedContentItem[] = [];
        const expiredIds: string[] = [];

        for (const item of items) {
            if (isExpired(item.expiresAt)) {
                expiredIds.push(item.id);
            } else {
                validItems.push(item);
            }
        }

        // Clean up expired items
        if (expiredIds.length > 0) {
            await Promise.all(expiredIds.map(id => this.delete(id)));
        }

        return validItems;
    }

    async getCachedContentByLocation(
        type: CachedContentItem['type'],
        location: string
    ): Promise<CachedContentItem | undefined> {
        const store = await this.getStore('readonly');
        const index = store.index('type_location');
        const items = await this.promisifyRequest(index.getAll([type, location]));

        // Find the most recent non-expired item
        const validItems = items.filter(item => !isExpired(item.expiresAt));

        if (validItems.length === 0) {
            // Clean up expired items
            const expiredIds = items.filter(item => isExpired(item.expiresAt)).map(item => item.id);
            await Promise.all(expiredIds.map(id => this.delete(id)));
            return undefined;
        }

        // Return the most recently cached item
        return validItems.sort((a, b) => b.cachedAt - a.cachedAt)[0];
    }

    async cleanupExpiredContent(): Promise<void> {
        const store = await this.getStore('readwrite');
        const index = store.index('expiresAt');

        return new Promise<void>((resolve, reject) => {
            const deletePromises: Promise<void>[] = [];
            const request = index.openCursor();

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor) {
                    const item = cursor.value as CachedContentItem;
                    if (isExpired(item.expiresAt)) {
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
}

/**
 * Drafts Store Operations
 */
export class DraftsStore extends IndexedDBStore<DraftItem> {
    constructor() {
        super(STORES.DRAFTS);
    }

    async saveDraft(
        type: DraftItem['type'],
        content: any,
        userId?: string
    ): Promise<string> {
        const id = generateId();
        const item: DraftItem = {
            id,
            type,
            content,
            lastModified: Date.now(),
            synced: false,
            userId,
        };

        await this.put(item);
        return id;
    }

    async updateDraft(id: string, content: any): Promise<void> {
        const item = await this.get(id);
        if (item) {
            item.content = content;
            item.lastModified = Date.now();
            item.synced = false;
            await this.put(item);
        }
    }

    async markDraftAsSynced(id: string): Promise<void> {
        const item = await this.get(id);
        if (item) {
            item.synced = true;
            await this.put(item);
        }
    }

    async getUnsyncedDrafts(): Promise<DraftItem[]> {
        const store = await this.getStore('readonly');
        const index = store.index('synced');
        return await this.promisifyRequest(index.getAll(IDBKeyRange.only(false)));
    }

    async getDraftsByType(type: DraftItem['type']): Promise<DraftItem[]> {
        const store = await this.getStore('readonly');
        const index = store.index('type');
        return await this.promisifyRequest(index.getAll(type));
    }

    async getDraftsByUser(userId: string): Promise<DraftItem[]> {
        const store = await this.getStore('readonly');
        const index = store.index('userId');
        return await this.promisifyRequest(index.getAll(userId));
    }

    async getRecentDrafts(limit: number = 10): Promise<DraftItem[]> {
        const store = await this.getStore('readonly');
        const index = store.index('lastModified');

        return new Promise<DraftItem[]>((resolve, reject) => {
            const drafts: DraftItem[] = [];
            let count = 0;
            const request = index.openCursor(null, 'prev');

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor && count < limit) {
                    drafts.push(cursor.value);
                    count++;
                    cursor.continue();
                } else {
                    // No more items or reached limit
                    resolve(drafts);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async cleanupSyncedDrafts(olderThanDays: number = 7): Promise<void> {
        const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
        const store = await this.getStore('readwrite');
        const index = store.index('synced');

        return new Promise<void>((resolve, reject) => {
            const deletePromises: Promise<void>[] = [];
            const request = index.openCursor(IDBKeyRange.only(true));

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor) {
                    const item = cursor.value as DraftItem;
                    if (item.lastModified < cutoffTime) {
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
}

// Export singleton instances
export const syncQueueStore = new SyncQueueStore();
export const cachedContentStore = new CachedContentStore();
export const draftsStore = new DraftsStore();

/**
 * Initialize all stores and perform cleanup
 */
export async function initializeMobileStorage(): Promise<void> {
    try {
        // Initialize the database
        await getDatabase();

        // Perform cleanup operations
        await Promise.all([
            syncQueueStore.cleanupCompletedOperations(),
            cachedContentStore.cleanupExpiredContent(),
            draftsStore.cleanupSyncedDrafts(),
        ]);

        console.log('Mobile storage initialized successfully');
    } catch (error) {
        console.error('Failed to initialize mobile storage:', error);
        throw error;
    }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
    syncQueue: { pending: number; failed: number; completed: number };
    cachedContent: number;
    drafts: { total: number; unsynced: number };
}> {
    const [syncQueueStatus, cachedContentCount, draftsCount, unsyncedDraftsCount] = await Promise.all([
        syncQueueStore.getQueueStatus(),
        cachedContentStore.count(),
        draftsStore.count(),
        draftsStore.getUnsyncedDrafts().then(drafts => drafts.length),
    ]);

    return {
        syncQueue: syncQueueStatus,
        cachedContent: cachedContentCount,
        drafts: {
            total: draftsCount,
            unsynced: unsyncedDraftsCount,
        },
    };
}