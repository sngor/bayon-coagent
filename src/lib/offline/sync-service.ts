/**
 * Sync Service for Open House Offline Operations
 * 
 * This module provides the sync service that processes queued offline operations
 * when connectivity is restored. It handles retries, conflict resolution, and
 * ensures operations are processed in chronological order.
 */

import { openHouseStore, OpenHouseOperation, conflictLogStore } from './storage';
import { connectivityMonitor } from './connectivity';

/**
 * Sync result for a single operation
 */
export interface SyncResult {
    operationId: string;
    success: boolean;
    error?: string;
    timestamp: number;
    conflictDetected?: boolean;
    conflictResolution?: 'last-write-wins';
}

/**
 * Sync service configuration
 */
export interface SyncServiceConfig {
    maxRetries: number;
    retryDelayMs: number;
    batchSize: number;
    autoSync: boolean;
}

/**
 * Default sync service configuration
 */
const DEFAULT_CONFIG: SyncServiceConfig = {
    maxRetries: 3,
    retryDelayMs: 1000,
    batchSize: 10,
    autoSync: true,
};

/**
 * Sync service class
 */
class OpenHouseSyncService {
    private config: SyncServiceConfig;
    private isSyncing = false;
    private syncListeners: Set<(results: SyncResult[]) => void> = new Set();
    private isInitialized = false;

    constructor(config: Partial<SyncServiceConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Initialize the sync service
     */
    initialize(): void {
        if (this.isInitialized) {
            return;
        }

        // Set up auto-sync when connectivity is restored
        if (this.config.autoSync) {
            connectivityMonitor.addListener((status) => {
                if (status === 'online') {
                    console.log('Connectivity restored, starting auto-sync...');
                    this.syncPendingOperations().catch(error => {
                        console.error('Auto-sync failed:', error);
                    });
                }
            });
        }

        this.isInitialized = true;
    }

    /**
     * Sync all pending operations
     */
    async syncPendingOperations(): Promise<SyncResult[]> {
        // Check if already syncing
        if (this.isSyncing) {
            console.log('Sync already in progress, skipping...');
            return [];
        }

        // Check connectivity
        if (!connectivityMonitor.isOnline()) {
            console.log('Cannot sync: offline');
            return [];
        }

        this.isSyncing = true;
        const results: SyncResult[] = [];

        try {
            // Get all pending operations in chronological order
            const operations = await openHouseStore.getPendingOperations();

            if (operations.length === 0) {
                console.log('No pending operations to sync');
                return results;
            }

            console.log(`Syncing ${operations.length} pending operations...`);

            // Process operations in batches
            for (let i = 0; i < operations.length; i += this.config.batchSize) {
                const batch = operations.slice(i, i + this.config.batchSize);
                const batchResults = await this.processBatch(batch);
                results.push(...batchResults);
            }

            // Notify listeners
            this.notifySyncListeners(results);

            console.log(`Sync completed: ${results.filter(r => r.success).length}/${results.length} successful`);

            return results;
        } catch (error) {
            console.error('Sync failed:', error);
            throw error;
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Process a batch of operations
     */
    private async processBatch(operations: OpenHouseOperation[]): Promise<SyncResult[]> {
        const results: SyncResult[] = [];

        for (const operation of operations) {
            const result = await this.processOperation(operation);
            results.push(result);

            // Small delay between operations to avoid overwhelming the server
            await this.delay(100);
        }

        return results;
    }

    /**
     * Process a single operation
     */
    private async processOperation(operation: OpenHouseOperation): Promise<SyncResult> {
        try {
            // Update status to syncing
            await openHouseStore.updateOperationStatus(operation.id, 'syncing');

            // Check for conflicts and resolve using last-write-wins
            const conflictResult = await this.detectAndResolveConflict(operation);

            // Execute the operation based on type
            await this.executeOperation(operation);

            // Mark as completed
            await openHouseStore.updateOperationStatus(operation.id, 'completed');

            // Mark conflict as resolved if detected
            if (conflictResult.conflictDetected) {
                await openHouseStore.markConflictResolved(operation.id, 'last-write-wins');
            }

            return {
                operationId: operation.id,
                success: true,
                timestamp: operation.timestamp,
                conflictDetected: conflictResult.conflictDetected,
                conflictResolution: conflictResult.conflictDetected ? 'last-write-wins' : undefined,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Check if we should retry
            if (operation.retryCount < this.config.maxRetries) {
                // Mark as pending for retry
                await openHouseStore.updateOperationStatus(operation.id, 'pending', errorMessage);

                console.log(`Operation ${operation.id} failed, will retry (${operation.retryCount + 1}/${this.config.maxRetries})`);
            } else {
                // Max retries reached, mark as failed
                await openHouseStore.updateOperationStatus(operation.id, 'failed', errorMessage);

                console.error(`Operation ${operation.id} failed after ${this.config.maxRetries} retries:`, errorMessage);
            }

            return {
                operationId: operation.id,
                success: false,
                error: errorMessage,
                timestamp: operation.timestamp,
            };
        }
    }

    /**
     * Detect and resolve conflicts using last-write-wins strategy
     */
    private async detectAndResolveConflict(operation: OpenHouseOperation): Promise<{
        conflictDetected: boolean;
        serverData?: any;
    }> {
        try {
            // Only check for conflicts on update operations
            if (operation.type !== 'updateVisitor' && operation.type !== 'updateSession') {
                return { conflictDetected: false };
            }

            // Fetch current server data
            const serverData = await this.fetchServerData(operation);

            if (!serverData) {
                // No server data exists, no conflict
                return { conflictDetected: false };
            }

            // Check if server data has been modified since operation was queued
            const serverTimestamp = serverData.updatedAt ? new Date(serverData.updatedAt).getTime() : 0;
            const operationTimestamp = operation.timestamp;

            if (serverTimestamp > operationTimestamp) {
                // Conflict detected: server data is newer than local operation
                console.log(`Conflict detected for operation ${operation.id}: server timestamp ${serverTimestamp} > operation timestamp ${operationTimestamp}`);

                // Apply last-write-wins: use the operation data (local wins because it's the "last write")
                // Log the conflict for agent review
                await conflictLogStore.logConflict(
                    operation.id,
                    operation.sessionId,
                    operation.type,
                    operation.data,
                    serverData,
                    'last-write-wins',
                    operation.data, // Resolved data is the local data
                    operation.userId,
                    operation.visitorId
                );

                return {
                    conflictDetected: true,
                    serverData,
                };
            }

            return { conflictDetected: false };
        } catch (error) {
            console.error('Error detecting conflict:', error);
            // If we can't detect conflicts, proceed with the operation
            return { conflictDetected: false };
        }
    }

    /**
     * Fetch current server data for conflict detection
     */
    private async fetchServerData(operation: OpenHouseOperation): Promise<any | null> {
        try {
            const actions = await import('@/app/actions');

            switch (operation.type) {
                case 'updateVisitor':
                    if (!operation.visitorId) {
                        return null;
                    }
                    // Fetch visitor data
                    if ('getVisitor' in actions && typeof (actions as any).getVisitor === 'function') {
                        const result = await (actions as any).getVisitor(operation.sessionId, operation.visitorId);
                        return result.success ? result.data : null;
                    }
                    return null;

                case 'updateSession':
                    // Fetch session data
                    if ('getOpenHouseSession' in actions && typeof (actions as any).getOpenHouseSession === 'function') {
                        const result = await (actions as any).getOpenHouseSession(operation.sessionId);
                        return result.success ? result.data : null;
                    }
                    return null;

                default:
                    return null;
            }
        } catch (error) {
            console.error('Error fetching server data:', error);
            return null;
        }
    }

    /**
     * Execute an operation by calling the appropriate server action
     */
    private async executeOperation(operation: OpenHouseOperation): Promise<void> {
        // Import server actions dynamically to avoid circular dependencies
        // Note: These actions will be implemented as part of the open house feature
        const actions = await import('@/app/actions');

        switch (operation.type) {
            case 'checkIn':
                if ('checkInVisitor' in actions && typeof (actions as any).checkInVisitor === 'function') {
                    await (actions as any).checkInVisitor(operation.sessionId, operation.data);
                } else {
                    throw new Error('checkInVisitor action not implemented');
                }
                break;

            case 'updateVisitor':
                if (!operation.visitorId) {
                    throw new Error('Visitor ID is required for update operation');
                }
                if ('updateVisitor' in actions && typeof (actions as any).updateVisitor === 'function') {
                    await (actions as any).updateVisitor(operation.sessionId, operation.visitorId, operation.data);
                } else {
                    throw new Error('updateVisitor action not implemented');
                }
                break;

            case 'deleteVisitor':
                if (!operation.visitorId) {
                    throw new Error('Visitor ID is required for delete operation');
                }
                if ('deleteVisitor' in actions && typeof (actions as any).deleteVisitor === 'function') {
                    await (actions as any).deleteVisitor(operation.sessionId, operation.visitorId);
                } else {
                    throw new Error('deleteVisitor action not implemented');
                }
                break;

            case 'updateSession':
                if ('updateOpenHouseSession' in actions && typeof (actions as any).updateOpenHouseSession === 'function') {
                    await (actions as any).updateOpenHouseSession(operation.sessionId, operation.data);
                } else {
                    throw new Error('updateOpenHouseSession action not implemented');
                }
                break;

            case 'photoUpload':
                if ('uploadSessionPhoto' in actions && typeof (actions as any).uploadSessionPhoto === 'function') {
                    await (actions as any).uploadSessionPhoto(operation.sessionId, operation.data);
                } else {
                    throw new Error('uploadSessionPhoto action not implemented');
                }
                break;

            case 'addNote':
                if (!operation.visitorId) {
                    throw new Error('Visitor ID is required for add note operation');
                }
                // Add note is part of updateVisitor
                if ('updateVisitor' in actions && typeof (actions as any).updateVisitor === 'function') {
                    await (actions as any).updateVisitor(operation.sessionId, operation.visitorId, {
                        notes: operation.data.notes,
                    });
                } else {
                    throw new Error('updateVisitor action not implemented');
                }
                break;

            default:
                throw new Error(`Unknown operation type: ${(operation as any).type}`);
        }
    }

    /**
     * Sync operations for a specific session
     */
    async syncSessionOperations(sessionId: string): Promise<SyncResult[]> {
        if (!connectivityMonitor.isOnline()) {
            console.log('Cannot sync: offline');
            return [];
        }

        const operations = await openHouseStore.getPendingOperationsBySession(sessionId);

        if (operations.length === 0) {
            return [];
        }

        console.log(`Syncing ${operations.length} operations for session ${sessionId}...`);

        const results: SyncResult[] = [];
        for (const operation of operations) {
            const result = await this.processOperation(operation);
            results.push(result);
        }

        this.notifySyncListeners(results);

        return results;
    }

    /**
     * Retry failed operations
     */
    async retryFailedOperations(): Promise<SyncResult[]> {
        if (!connectivityMonitor.isOnline()) {
            console.log('Cannot retry: offline');
            return [];
        }

        const failedOperations = await openHouseStore.getFailedOperations();

        if (failedOperations.length === 0) {
            console.log('No failed operations to retry');
            return [];
        }

        console.log(`Retrying ${failedOperations.length} failed operations...`);

        // Reset failed operations to pending
        for (const operation of failedOperations) {
            await openHouseStore.updateOperationStatus(operation.id, 'pending');
        }

        // Sync them
        return this.syncPendingOperations();
    }

    /**
     * Add a sync listener
     */
    addSyncListener(listener: (results: SyncResult[]) => void): () => void {
        this.syncListeners.add(listener);
        return () => {
            this.syncListeners.delete(listener);
        };
    }

    /**
     * Notify sync listeners
     */
    private notifySyncListeners(results: SyncResult[]): void {
        this.syncListeners.forEach(listener => {
            try {
                listener(results);
            } catch (error) {
                console.error('Error in sync listener:', error);
            }
        });
    }

    /**
     * Check if currently syncing
     */
    isSyncInProgress(): boolean {
        return this.isSyncing;
    }

    /**
     * Get sync status
     */
    async getSyncStatus(): Promise<{
        isSyncing: boolean;
        pendingCount: number;
        failedCount: number;
        lastSyncTimestamp: number | null;
        conflictCount: number;
    }> {
        const queueStatus = await openHouseStore.getQueueStatus();
        const lastSyncTimestamp = await openHouseStore.getLastSyncTimestamp();
        const conflictCount = await conflictLogStore.getConflictCount();

        return {
            isSyncing: this.isSyncing,
            pendingCount: queueStatus.pending,
            failedCount: queueStatus.failed,
            lastSyncTimestamp,
            conflictCount,
        };
    }

    /**
     * Get conflict logs
     */
    async getConflictLogs(): Promise<any[]> {
        return await conflictLogStore.getAllConflicts();
    }

    /**
     * Get conflicts for a specific session
     */
    async getSessionConflicts(sessionId: string): Promise<any[]> {
        return await conflictLogStore.getConflictsBySession(sessionId);
    }

    /**
     * Utility function to delay execution
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clean up resources
     */
    cleanup(): void {
        this.syncListeners.clear();
        this.isInitialized = false;
    }
}

// Export singleton instance
export const openHouseSyncService = new OpenHouseSyncService();

/**
 * Initialize the sync service
 */
export function initializeSyncService(config?: Partial<SyncServiceConfig>): void {
    if (config) {
        // Create new instance with custom config
        const customService = new OpenHouseSyncService(config);
        customService.initialize();
    } else {
        // Use default singleton
        openHouseSyncService.initialize();
    }
}

/**
 * Queue an offline operation
 * This is a convenience function that checks connectivity and either
 * executes immediately or queues for later sync
 */
export async function queueOfflineOperation(
    type: OpenHouseOperation['type'],
    entity: OpenHouseOperation['entity'],
    sessionId: string,
    data: any,
    userId: string,
    visitorId?: string
): Promise<{ queued: boolean; operationId?: string }> {
    // If online, we don't need to queue (the caller should execute directly)
    if (connectivityMonitor.isOnline()) {
        return { queued: false };
    }

    // Queue the operation
    const operationId = await openHouseStore.queueOperation(
        type,
        entity,
        sessionId,
        data,
        userId,
        visitorId
    );

    console.log(`Operation queued for offline sync: ${operationId}`);

    return { queued: true, operationId };
}
