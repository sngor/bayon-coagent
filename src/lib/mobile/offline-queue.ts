/**
 * Offline Queue Service
 * 
 * Manages queued operations when offline and syncs them when connectivity returns.
 * Uses IndexedDB for persistent storage.
 * 
 * Requirements: 2.4, 2.5, 6.1, 6.2, 6.3, 6.4
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export interface QueuedOperation {
    id: string;
    type: OperationType;
    payload: any;
    timestamp: number;
    retryCount: number;
    maxRetries: number;
    status: OperationStatus;
    error?: string;
    userId?: string;
}

export type OperationType =
    | 'capture-photo'
    | 'capture-voice'
    | 'capture-text'
    | 'quick-action'
    | 'voice-note'
    | 'property-share'
    | 'check-in'
    | 'content-create'
    | 'content-update'
    | 'content-delete';

export type OperationStatus = 'pending' | 'syncing' | 'completed' | 'failed';

export interface SyncResult {
    success: boolean;
    operationId: string;
    error?: string;
}

export interface SyncProgress {
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
}

export interface ConflictResolution {
    strategy: 'last-write-wins' | 'manual';
    localVersion: any;
    serverVersion: any;
    resolved: any;
}

// ============================================================================
// IndexedDB Setup
// ============================================================================

const DB_NAME = 'bayon-offline-queue';
const DB_VERSION = 1;
const STORE_NAME = 'operations';

class IndexedDBManager {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('status', 'status', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('userId', 'userId', { unique: false });
                }
            };
        });
    }

    async add(operation: QueuedOperation): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(operation);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async update(operation: QueuedOperation): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(operation);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async get(id: string): Promise<QueuedOperation | undefined> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(): Promise<QueuedOperation[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getByStatus(status: OperationStatus): Promise<QueuedOperation[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('status');
            const request = index.getAll(status);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(id: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear(): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// ============================================================================
// Offline Queue Service
// ============================================================================

export class OfflineQueueService {
    private static instance: OfflineQueueService;
    private dbManager: IndexedDBManager;
    private syncInProgress = false;
    private listeners: Set<(progress: SyncProgress) => void> = new Set();

    private constructor() {
        this.dbManager = new IndexedDBManager();
    }

    static getInstance(): OfflineQueueService {
        if (!OfflineQueueService.instance) {
            OfflineQueueService.instance = new OfflineQueueService();
        }
        return OfflineQueueService.instance;
    }

    /**
     * Initialize the service
     */
    async init(): Promise<void> {
        await this.dbManager.init();
    }

    /**
     * Add operation to queue
     */
    async enqueue(
        type: OperationType,
        payload: any,
        options: { maxRetries?: number; userId?: string } = {}
    ): Promise<string> {
        const operation: QueuedOperation = {
            id: uuidv4(),
            type,
            payload,
            timestamp: Date.now(),
            retryCount: 0,
            maxRetries: options.maxRetries ?? 3,
            status: 'pending',
            userId: options.userId,
        };

        await this.dbManager.add(operation);
        return operation.id;
    }

    /**
     * Get operation by ID
     */
    async getOperation(id: string): Promise<QueuedOperation | undefined> {
        return this.dbManager.get(id);
    }

    /**
     * Get all operations
     */
    async getAllOperations(): Promise<QueuedOperation[]> {
        return this.dbManager.getAll();
    }

    /**
     * Get pending operations
     */
    async getPendingOperations(): Promise<QueuedOperation[]> {
        return this.dbManager.getByStatus('pending');
    }

    /**
     * Get queue size
     */
    async getQueueSize(): Promise<number> {
        const pending = await this.getPendingOperations();
        return pending.length;
    }

    /**
     * Get sync progress
     */
    async getSyncProgress(): Promise<SyncProgress> {
        const all = await this.getAllOperations();
        return {
            total: all.length,
            completed: all.filter((op) => op.status === 'completed').length,
            failed: all.filter((op) => op.status === 'failed').length,
            inProgress: all.filter((op) => op.status === 'syncing').length,
        };
    }

    /**
     * Sync all pending operations
     */
    async syncAll(): Promise<SyncResult[]> {
        if (this.syncInProgress) {
            console.log('[OfflineQueue] Sync already in progress');
            return [];
        }

        this.syncInProgress = true;
        const results: SyncResult[] = [];

        try {
            const pending = await this.getPendingOperations();
            console.log(`[OfflineQueue] Syncing ${pending.length} operations`);

            // Sort by timestamp (oldest first)
            pending.sort((a, b) => a.timestamp - b.timestamp);

            for (const operation of pending) {
                const result = await this.syncOperation(operation);
                results.push(result);

                // Notify listeners of progress
                const progress = await this.getSyncProgress();
                this.notifyListeners(progress);
            }

            return results;
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync single operation
     */
    private async syncOperation(operation: QueuedOperation): Promise<SyncResult> {
        try {
            // Update status to syncing
            operation.status = 'syncing';
            await this.dbManager.update(operation);

            // Execute the operation based on type
            await this.executeOperation(operation);

            // Mark as completed
            operation.status = 'completed';
            await this.dbManager.update(operation);

            // Clean up completed operation after a delay
            setTimeout(() => {
                this.dbManager.delete(operation.id);
            }, 5000);

            return {
                success: true,
                operationId: operation.id,
            };
        } catch (error) {
            console.error('[OfflineQueue] Sync failed:', error);

            operation.retryCount++;
            operation.error = error instanceof Error ? error.message : 'Unknown error';

            if (operation.retryCount >= operation.maxRetries) {
                operation.status = 'failed';
            } else {
                operation.status = 'pending';
            }

            await this.dbManager.update(operation);

            return {
                success: false,
                operationId: operation.id,
                error: operation.error,
            };
        }
    }

    /**
     * Execute operation based on type
     */
    private async executeOperation(operation: QueuedOperation): Promise<void> {
        const { type, payload } = operation;

        switch (type) {
            case 'capture-photo':
                await this.executeCapturePhoto(payload);
                break;
            case 'capture-voice':
                await this.executeCaptureVoice(payload);
                break;
            case 'capture-text':
                await this.executeCaptureText(payload);
                break;
            case 'quick-action':
                await this.executeQuickAction(payload);
                break;
            case 'voice-note':
                await this.executeVoiceNote(payload);
                break;
            case 'property-share':
                await this.executePropertyShare(payload);
                break;
            case 'check-in':
                await this.executeCheckIn(payload);
                break;
            case 'content-create':
                await this.executeContentCreate(payload);
                break;
            case 'content-update':
                await this.executeContentUpdate(payload);
                break;
            case 'content-delete':
                await this.executeContentDelete(payload);
                break;
            default:
                throw new Error(`Unknown operation type: ${type}`);
        }
    }

    // ============================================================================
    // Operation Executors
    // ============================================================================

    private async executeCapturePhoto(payload: any): Promise<void> {
        const response = await fetch('/api/mobile/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'photo', ...payload }),
        });

        if (!response.ok) {
            throw new Error(`Failed to sync photo capture: ${response.statusText}`);
        }
    }

    private async executeCaptureVoice(payload: any): Promise<void> {
        const response = await fetch('/api/mobile/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'voice', ...payload }),
        });

        if (!response.ok) {
            throw new Error(`Failed to sync voice capture: ${response.statusText}`);
        }
    }

    private async executeCaptureText(payload: any): Promise<void> {
        const response = await fetch('/api/mobile/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'text', ...payload }),
        });

        if (!response.ok) {
            throw new Error(`Failed to sync text capture: ${response.statusText}`);
        }
    }

    private async executeQuickAction(payload: any): Promise<void> {
        const response = await fetch('/api/mobile/quick-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Failed to sync quick action: ${response.statusText}`);
        }
    }

    private async executeVoiceNote(payload: any): Promise<void> {
        const response = await fetch('/api/mobile/voice-note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Failed to sync voice note: ${response.statusText}`);
        }
    }

    private async executePropertyShare(payload: any): Promise<void> {
        const response = await fetch('/api/mobile/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Failed to sync property share: ${response.statusText}`);
        }
    }

    private async executeCheckIn(payload: any): Promise<void> {
        const response = await fetch('/api/mobile/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Failed to sync check-in: ${response.statusText}`);
        }
    }

    private async executeContentCreate(payload: any): Promise<void> {
        const response = await fetch('/api/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Failed to create content: ${response.statusText}`);
        }
    }

    private async executeContentUpdate(payload: any): Promise<void> {
        const response = await fetch(`/api/content/${payload.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            // Check for conflict (409)
            if (response.status === 409) {
                await this.handleConflict(payload);
                return;
            }
            throw new Error(`Failed to update content: ${response.statusText}`);
        }
    }

    private async executeContentDelete(payload: any): Promise<void> {
        const response = await fetch(`/api/content/${payload.id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete content: ${response.statusText}`);
        }
    }

    /**
     * Handle sync conflict with last-write-wins strategy
     */
    private async handleConflict(payload: any): Promise<void> {
        console.log('[OfflineQueue] Conflict detected, applying last-write-wins');

        // Fetch current server version
        const response = await fetch(`/api/content/${payload.id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch server version');
        }

        const serverVersion = await response.json();

        // Apply last-write-wins: use local version (most recent)
        const resolution: ConflictResolution = {
            strategy: 'last-write-wins',
            localVersion: payload,
            serverVersion,
            resolved: payload, // Local version wins
        };

        // Force update with resolved version
        const updateResponse = await fetch(`/api/content/${payload.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Conflict-Resolution': 'last-write-wins',
            },
            body: JSON.stringify(resolution.resolved),
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to resolve conflict');
        }

        // Notify user of conflict resolution
        this.notifyConflict(resolution);
    }

    /**
     * Notify user of conflict resolution
     */
    private notifyConflict(resolution: ConflictResolution): void {
        // Send notification to user
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Sync Conflict Resolved', {
                body: 'Your changes were applied using last-write-wins strategy',
                icon: '/icon-192x192.svg',
            });
        }

        // Also dispatch custom event for UI to handle
        window.dispatchEvent(
            new CustomEvent('sync-conflict', {
                detail: resolution,
            })
        );
    }

    /**
     * Retry failed operations
     */
    async retryFailed(): Promise<SyncResult[]> {
        const failed = await this.dbManager.getByStatus('failed');
        const results: SyncResult[] = [];

        for (const operation of failed) {
            // Reset status and retry count
            operation.status = 'pending';
            operation.retryCount = 0;
            operation.error = undefined;
            await this.dbManager.update(operation);

            const result = await this.syncOperation(operation);
            results.push(result);
        }

        return results;
    }

    /**
     * Clear completed operations
     */
    async clearCompleted(): Promise<void> {
        const completed = await this.dbManager.getByStatus('completed');
        for (const operation of completed) {
            await this.dbManager.delete(operation.id);
        }
    }

    /**
     * Clear all operations
     */
    async clearAll(): Promise<void> {
        await this.dbManager.clear();
    }

    /**
     * Subscribe to sync progress updates
     */
    onSyncProgress(callback: (progress: SyncProgress) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(progress: SyncProgress): void {
        this.listeners.forEach((callback) => callback(progress));
    }
}

// Export singleton instance
export const offlineQueue = OfflineQueueService.getInstance();
