/**
 * Offline Sync Manager for Mobile Enhancements
 * 
 * This module provides the core offline synchronization functionality including
 * queue operations, connectivity monitoring, and retry logic with exponential backoff.
 */

import { syncQueueStore } from './indexeddb-wrapper';
import { SyncQueueItem } from './indexeddb-schema';
import {
    detectDraftConflict,
    detectEditConflict,
    canAutoResolve,
    autoResolveConflict,
    ConflictData
} from './conflict-detection';
import { storeConflict, getConflictCount } from './conflict-storage';
import { connectivityMonitor, ConnectivityEvent } from './connectivity-monitor';
import { backgroundSyncManager, BackgroundSyncEvent } from './background-sync-manager';

export interface SyncOperation {
    id: string;
    type: 'photo' | 'voice' | 'content' | 'checkin' | 'edit' | 'meeting-prep' | 'market-stats' | 'comparison';
    data: any;
    timestamp: number;
    retryCount: number;
    status: 'pending' | 'syncing' | 'failed' | 'completed';
}

export interface ConnectivityStatus {
    isOnline: boolean;
    lastOnlineAt: number;
    lastOfflineAt: number;
}

export interface QueueStatus {
    pending: number;
    failed: number;
    completed: number;
    conflicts: number;
}

export type ConnectivityCallback = (isOnline: boolean) => void;
export type SyncProgressCallback = (operation: SyncOperation, progress: number) => void;

/**
 * Main offline sync manager class
 */
export class OfflineSyncManager {
    private connectivityCallbacks: Set<ConnectivityCallback> = new Set();
    private syncProgressCallbacks: Set<SyncProgressCallback> = new Set();
    private syncInProgress: boolean = false;
    private connectivityUnsubscribe?: () => void;
    private backgroundSyncUnsubscribe?: () => void;

    constructor() {
        this.initializeConnectivityMonitoring();
        this.initializeBackgroundSync();
    }

    /**
     * Initialize connectivity monitoring using the enhanced connectivity monitor
     */
    private initializeConnectivityMonitoring(): void {
        // Subscribe to connectivity events from the enhanced monitor
        this.connectivityUnsubscribe = connectivityMonitor.onConnectivityChange(
            this.handleConnectivityEvent.bind(this)
        );
    }

    /**
     * Initialize background sync integration
     */
    private initializeBackgroundSync(): void {
        // Subscribe to background sync events
        this.backgroundSyncUnsubscribe = backgroundSyncManager.onBackgroundSyncEvent(
            this.handleBackgroundSyncEvent.bind(this)
        );

        // Register background sync if supported
        if (backgroundSyncManager.isBackgroundSyncSupported()) {
            backgroundSyncManager.registerBackgroundSync().then(success => {
                if (success) {
                    console.log('Background sync registered successfully');
                } else {
                    console.warn('Failed to register background sync');
                }
            });
        }
    }

    /**
     * Handle connectivity events from the enhanced monitor
     */
    private handleConnectivityEvent(event: ConnectivityEvent): void {
        const isOnline = event.status.isOnline;

        console.log(`Connectivity event: ${event.type}`, event.status);

        // Notify legacy callbacks
        this.connectivityCallbacks.forEach(callback => {
            try {
                callback(isOnline);
            } catch (error) {
                console.error('Error in connectivity callback:', error);
            }
        });

        // Auto-sync when coming back online
        if (event.type === 'online' && !this.syncInProgress) {
            // Only sync if connection quality is good enough
            if (connectivityMonitor.isGoodEnoughForSync()) {
                // Try background sync first, fallback to regular sync
                if (backgroundSyncManager.isBackgroundSyncAvailable()) {
                    backgroundSyncManager.triggerBackgroundSync().then(success => {
                        if (!success) {
                            // Fallback to regular sync
                            this.syncPendingOperations().catch(error => {
                                console.error('Fallback sync failed:', error);
                            });
                        }
                    });
                } else {
                    this.syncPendingOperations().catch(error => {
                        console.error('Auto-sync failed after connectivity restoration:', error);
                    });
                }
            } else {
                console.log('Connection quality too poor for sync, waiting for better connection');
            }
        }
    }

    /**
     * Handle background sync events
     */
    private handleBackgroundSyncEvent(event: BackgroundSyncEvent): void {
        console.log('Background sync event:', event.type, event);

        // Notify sync progress callbacks
        if (event.type === 'sync-progress' && event.operationId && event.progress !== undefined) {
            // Create a mock operation for progress callback
            const mockOperation: SyncOperation = {
                id: event.operationId,
                type: 'content', // Use a valid type
                data: {},
                timestamp: event.timestamp,
                retryCount: 0,
                status: 'syncing' as const
            };

            this.syncProgressCallbacks.forEach(callback => {
                try {
                    callback(mockOperation, event.progress!);
                } catch (error) {
                    console.error('Error in sync progress callback:', error);
                }
            });
        }

        // Handle sync completion
        if (event.type === 'sync-completed') {
            console.log(`Background sync completed: ${event.operationsProcessed} operations processed, ${event.failures || 0} failures`);
        }

        // Handle sync failures
        if (event.type === 'sync-failed') {
            console.error('Background sync failed:', event.error);
        }

        // Handle notification clicks
        if (event.type === 'notification-click') {
            console.log('Notification clicked in background:', event.notificationData);
            // Handle notification navigation if needed
        }
    }

    /**
     * Queue an operation for sync
     */
    async queueOperation(
        operation: Omit<SyncOperation, 'id' | 'retryCount' | 'status'>
    ): Promise<string> {
        try {
            const id = await syncQueueStore.queueOperation(operation.type, operation.data);

            console.log(`Operation queued: ${operation.type} (${id})`);

            // If online, try to sync immediately
            if (connectivityMonitor.isOnline() && !this.syncInProgress) {
                // Try background sync first for better performance
                if (backgroundSyncManager.isBackgroundSyncAvailable()) {
                    const isPriority = ['photo', 'voice', 'checkin'].includes(operation.type);
                    backgroundSyncManager.queueOperationForBackgroundSync(operation, isPriority).then(success => {
                        if (!success) {
                            // Fallback to regular sync
                            this.syncPendingOperations().catch(error => {
                                console.error('Fallback sync failed:', error);
                            });
                        }
                    });
                } else {
                    this.syncPendingOperations().catch(error => {
                        console.error('Immediate sync failed:', error);
                    });
                }
            }

            return id;
        } catch (error) {
            console.error('Failed to queue operation:', error);
            throw error;
        }
    }

    /**
     * Sync all pending operations
     */
    async syncPendingOperations(): Promise<void> {
        if (!connectivityMonitor.isOnline()) {
            console.log('Cannot sync: offline');
            return;
        }

        if (this.syncInProgress) {
            console.log('Sync already in progress');
            return;
        }

        this.syncInProgress = true;

        try {
            const pendingOperations = await syncQueueStore.getPendingOperations();
            const failedOperations = await syncQueueStore.getFailedOperations();

            // Combine pending and failed operations that haven't exceeded retry limit
            const operationsToSync = [
                ...pendingOperations,
                ...failedOperations.filter(op => op.retryCount < 5)
            ];

            console.log(`Syncing ${operationsToSync.length} operations`);

            if (operationsToSync.length === 0) {
                return;
            }

            // Process operations in parallel with concurrency limit
            const concurrencyLimit = 3;
            const chunks = this.chunkArray(operationsToSync, concurrencyLimit);

            for (const chunk of chunks) {
                await Promise.allSettled(
                    chunk.map(operation => this.syncSingleOperation(operation))
                );
            }

            console.log('Sync completed');
        } catch (error) {
            console.error('Sync failed:', error);
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync a single operation with retry logic
     */
    private async syncSingleOperation(operation: SyncQueueItem): Promise<void> {
        const maxRetries = 5;
        let currentRetryCount = operation.retryCount;

        try {
            // Mark as syncing
            await syncQueueStore.updateOperationStatus(operation.id, 'syncing');

            // Notify progress callbacks
            this.syncProgressCallbacks.forEach(callback => {
                try {
                    callback(operation, 0.5); // 50% progress when starting sync
                } catch (error) {
                    console.error('Error in sync progress callback:', error);
                }
            });

            // Perform the actual sync based on operation type
            await this.performSync(operation);

            // Mark as completed
            await syncQueueStore.updateOperationStatus(operation.id, 'completed');

            // Notify progress callbacks
            this.syncProgressCallbacks.forEach(callback => {
                try {
                    callback(operation, 1.0); // 100% progress when completed
                } catch (error) {
                    console.error('Error in sync progress callback:', error);
                }
            });

            console.log(`Operation synced successfully: ${operation.type} (${operation.id})`);
        } catch (error) {
            console.error(`Failed to sync operation ${operation.id} (attempt ${currentRetryCount + 1}/${maxRetries}):`, error);

            // Increment retry count
            currentRetryCount += 1;

            // Determine if this is a permanent failure or temporary
            const isPermanentFailure = this.isPermanentFailure(error);

            if (isPermanentFailure || currentRetryCount >= maxRetries) {
                // Mark as permanently failed
                const errorMessage = isPermanentFailure
                    ? `Permanent failure: ${error instanceof Error ? error.message : 'Unknown error'}`
                    : `Max retries exceeded (${maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`;

                await syncQueueStore.updateOperationStatus(operation.id, 'failed', errorMessage);

                console.error(`Operation ${operation.id} permanently failed: ${errorMessage}`);
                throw error;
            }

            // Calculate retry delay with exponential backoff
            const retryDelay = this.calculateRetryDelay(currentRetryCount - 1);

            // Mark as failed with retry information
            await syncQueueStore.updateOperationStatus(
                operation.id,
                'failed',
                `${error instanceof Error ? error.message : 'Unknown error'} (retry ${currentRetryCount}/${maxRetries} in ${Math.round(retryDelay / 1000)}s)`
            );

            // Schedule retry
            console.log(`Scheduling retry for operation ${operation.id} in ${Math.round(retryDelay / 1000)}s`);

            setTimeout(async () => {
                try {
                    // Check if still online before retrying
                    if (!connectivityMonitor.isOnline()) {
                        console.log(`Skipping retry for operation ${operation.id}: offline`);
                        return;
                    }

                    // Get the latest operation state (retry count may have been updated)
                    const latestOperation = await syncQueueStore.get(operation.id);
                    if (!latestOperation || latestOperation.status === 'completed') {
                        console.log(`Skipping retry for operation ${operation.id}: already completed or not found`);
                        return;
                    }

                    // Retry the operation
                    await this.syncSingleOperation(latestOperation);
                } catch (retryError) {
                    console.error(`Retry failed for operation ${operation.id}:`, retryError);
                }
            }, retryDelay);

            throw error;
        }
    }

    /**
     * Perform the actual sync operation based on type
     */
    private async performSync(operation: SyncQueueItem): Promise<void> {
        // This is a placeholder - actual sync logic will be implemented
        // when server actions are created in later tasks

        switch (operation.type) {
            case 'photo':
                await this.syncPhotoOperation(operation);
                break;
            case 'voice':
                await this.syncVoiceOperation(operation);
                break;
            case 'content':
                await this.syncContentOperation(operation);
                break;
            case 'checkin':
                await this.syncCheckinOperation(operation);
                break;
            case 'edit':
                await this.syncEditOperation(operation);
                break;
            case 'meeting-prep':
                await this.syncMeetingPrepOperation(operation);
                break;
            case 'market-stats':
                await this.syncMarketStatsOperation(operation);
                break;
            case 'comparison':
                await this.syncComparisonOperation(operation);
                break;
            default:
                throw new Error(`Unknown operation type: ${operation.type}`);
        }
    }

    /**
     * Sync photo operation (placeholder)
     */
    private async syncPhotoOperation(operation: SyncQueueItem): Promise<void> {
        // TODO: Implement photo sync when photo upload actions are available
        console.log('Syncing photo operation:', operation.id);

        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For now, just log the operation
        console.log('Photo operation data:', operation.data);
    }

    /**
     * Sync voice operation (placeholder)
     */
    private async syncVoiceOperation(operation: SyncQueueItem): Promise<void> {
        // TODO: Implement voice sync when voice upload actions are available
        console.log('Syncing voice operation:', operation.id);

        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1500));

        // For now, just log the operation
        console.log('Voice operation data:', operation.data);
    }

    /**
     * Sync content operation with conflict detection
     */
    private async syncContentOperation(operation: SyncQueueItem): Promise<void> {
        console.log('Syncing content operation:', operation.id);

        try {
            // Import the sync action dynamically to avoid circular dependencies
            const { syncContentToDynamoDBAction } = await import('@/features/client-dashboards/actions/mobile-actions');

            // Prepare sync request
            const syncRequest = {
                id: operation.data.id,
                type: operation.data.type,
                title: operation.data.title,
                content: operation.data.content,
                metadata: operation.data.metadata,
                userId: operation.data.userId,
                operationType: operation.data.operationType || 'create',
                timestamp: operation.data.timestamp || operation.timestamp,
            };

            // Perform the sync
            const result = await syncContentToDynamoDBAction(syncRequest);

            if (!result.success) {
                if (result.conflictDetected) {
                    // Handle conflict
                    console.log('Conflict detected for content operation:', result.conflictId);

                    // For now, we'll throw an error to mark the operation as failed
                    // In a full implementation, we would store the conflict for user resolution
                    throw new Error(`Content sync conflict detected: ${result.error}`);
                } else {
                    throw new Error(result.error || 'Content sync failed');
                }
            }

            console.log('Content operation synced successfully:', operation.data.id);
        } catch (error) {
            console.error('Content sync failed:', error);
            throw error;
        }
    }

    /**
     * Sync checkin operation
     */
    private async syncCheckinOperation(operation: SyncQueueItem): Promise<void> {
        console.log('Syncing checkin operation:', operation.id);

        try {
            // Import the open house actions dynamically to avoid circular dependencies
            const {
                startOpenHouseSessionAction,
                addVisitorToSessionAction,
                endOpenHouseSessionAction
            } = await import('@/features/client-dashboards/actions/mobile-actions');

            // Handle different types of checkin operations
            switch (operation.data.operationType) {
                case 'start-session':
                    const startFormData = new FormData();
                    startFormData.append('propertyId', operation.data.propertyId);
                    startFormData.append('propertyAddress', operation.data.propertyAddress);

                    const startResult = await startOpenHouseSessionAction(null, startFormData);

                    if (!startResult.success) {
                        throw new Error(startResult.message || 'Failed to start open house session');
                    }

                    console.log('Open house session started successfully:', operation.data.sessionId);
                    break;

                case 'add-visitor':
                    const addResult = await addVisitorToSessionAction({
                        sessionId: operation.data.sessionId,
                        visitor: {
                            name: operation.data.visitor.name,
                            email: operation.data.visitor.email,
                            phone: operation.data.visitor.phone,
                            interestLevel: operation.data.visitor.interestLevel,
                            notes: operation.data.visitor.notes,
                        },
                        userId: operation.data.userId,
                    });

                    if (!addResult.success) {
                        throw new Error(addResult.error || 'Failed to add visitor to session');
                    }

                    console.log('Visitor added to session successfully:', operation.data.visitor.name);
                    break;

                case 'end-session':
                    const endResult = await endOpenHouseSessionAction(operation.data.sessionId);

                    if (!endResult.success) {
                        throw new Error(endResult.message || 'Failed to end open house session');
                    }

                    console.log('Open house session ended successfully:', operation.data.sessionId);
                    break;

                default:
                    throw new Error(`Unknown checkin operation type: ${operation.data.operationType}`);
            }
        } catch (error) {
            console.error('Checkin sync failed:', error);
            throw error;
        }
    }

    /**
     * Sync edit operation with conflict detection
     */
    private async syncEditOperation(operation: SyncQueueItem): Promise<void> {
        console.log('Syncing edit operation:', operation.id);

        try {
            // Import the sync action dynamically to avoid circular dependencies
            const { syncContentToDynamoDBAction } = await import('@/features/client-dashboards/actions/mobile-actions');

            // Prepare sync request for edit operation
            const syncRequest = {
                id: operation.data.id,
                type: operation.data.type,
                title: operation.data.title,
                content: operation.data.content,
                metadata: operation.data.metadata,
                userId: operation.data.userId,
                operationType: 'edit' as const,
                timestamp: operation.data.timestamp || operation.timestamp,
            };

            // Perform the sync
            const result = await syncContentToDynamoDBAction(syncRequest);

            if (!result.success) {
                if (result.conflictDetected) {
                    // Handle conflict
                    console.log('Conflict detected for edit operation:', result.conflictId);

                    // For now, we'll throw an error to mark the operation as failed
                    // In a full implementation, we would store the conflict for user resolution
                    throw new Error(`Edit sync conflict detected: ${result.error}`);
                } else {
                    throw new Error(result.error || 'Edit sync failed');
                }
            }

            console.log('Edit operation synced successfully:', operation.data.id);
        } catch (error) {
            console.error('Edit sync failed:', error);
            throw error;
        }
    }

    /**
     * Sync meeting prep operation
     */
    private async syncMeetingPrepOperation(operation: SyncQueueItem): Promise<void> {
        console.log('Syncing meeting prep operation:', operation.id);

        try {
            // Import the meeting prep actions dynamically to avoid circular dependencies
            const { generateMeetingPrepAction, saveMeetingPrepAction } = await import('@/features/client-dashboards/actions/mobile-actions');

            // Check if this is a generation request or a save request
            if (operation.data.operationType === 'generate') {
                // Generate meeting prep materials
                // Generate meeting prep materials
                const formData = new FormData();
                formData.append('clientName', operation.data.clientName);
                formData.append('clientEmail', operation.data.clientEmail);
                formData.append('meetingPurpose', operation.data.meetingPurpose);
                formData.append('propertyInterests', JSON.stringify(operation.data.propertyInterests || []));
                formData.append('budgetMin', (operation.data.budget?.min || 0).toString());
                formData.append('budgetMax', (operation.data.budget?.max || 0).toString());
                formData.append('notes', operation.data.notes || '');

                const result = await generateMeetingPrepAction(null, formData);

                if (!result.success || !result.data) {
                    throw new Error(result.message || 'Meeting prep generation failed');
                }

                // Store the generated materials in the operation data for potential save later
                operation.data.generatedMaterials = result.data;

                console.log('Meeting prep materials generated successfully:', operation.data.clientName);
            } else if (operation.data.operationType === 'save') {
                // Save meeting prep materials
                const saveRequest = {
                    prepId: operation.data.prepId || `prep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    clientInfo: {
                        clientName: operation.data.clientName,
                        clientEmail: operation.data.clientEmail,
                        meetingPurpose: operation.data.meetingPurpose,
                        propertyInterests: operation.data.propertyInterests || [],
                        budget: operation.data.budget || { min: 0, max: 0 },
                        notes: operation.data.notes || '',
                    },
                    materials: operation.data.materials,
                    userId: operation.data.userId,
                };

                const result = await saveMeetingPrepAction(saveRequest);

                if (!result.success) {
                    throw new Error(result.error || 'Meeting prep save failed');
                }

                console.log('Meeting prep materials saved successfully:', result.prepId);
            } else {
                throw new Error(`Unknown meeting prep operation type: ${operation.data.operationType}`);
            }
        } catch (error) {
            console.error('Meeting prep sync failed:', error);
            throw error;
        }
    }

    /**
     * Sync market stats operation (placeholder)
     */
    private async syncMarketStatsOperation(operation: SyncQueueItem): Promise<void> {
        // TODO: Implement market stats sync when market stats actions are available
        console.log('Syncing market stats operation:', operation.id);

        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1200));

        // For now, just log the operation
        console.log('Market stats operation data:', operation.data);
    }

    /**
     * Sync property comparison operation
     */
    private async syncComparisonOperation(operation: SyncQueueItem): Promise<void> {
        console.log('Syncing property comparison operation:', operation.id);

        try {
            // Import the sync action dynamically to avoid circular dependencies
            const { savePropertyComparisonAction } = await import('@/features/client-dashboards/actions/mobile-actions');

            // Prepare sync request
            const syncRequest = {
                id: operation.data.id,
                properties: operation.data.properties,
                notes: operation.data.notes,
                createdAt: operation.data.createdAt,
                userId: operation.data.userId,
            };

            // Perform the sync
            const result = await savePropertyComparisonAction(syncRequest);

            if (!result.success) {
                throw new Error(result.error || 'Property comparison sync failed');
            }

            console.log('Property comparison operation synced successfully:', operation.data.id);
        } catch (error) {
            console.error('Property comparison sync failed:', error);
            throw error;
        }
    }

    /**
     * Determine if an error represents a permanent failure
     */
    private isPermanentFailure(error: any): boolean {
        if (!error) return false;

        const errorMessage = error.message?.toLowerCase() || '';
        const errorStatus = error.status || error.statusCode;

        // HTTP status codes that indicate permanent failures
        const permanentStatusCodes = [400, 401, 403, 404, 409, 422, 451];
        if (permanentStatusCodes.includes(errorStatus)) {
            return true;
        }

        // Error messages that indicate permanent failures
        const permanentErrorPatterns = [
            'unauthorized',
            'forbidden',
            'not found',
            'invalid token',
            'expired token',
            'malformed request',
            'validation error',
            'schema error',
            'permission denied'
        ];

        return permanentErrorPatterns.some(pattern => errorMessage.includes(pattern));
    }

    /**
     * Calculate retry delay with exponential backoff
     */
    private calculateRetryDelay(retryCount: number): number {
        // Base delay of 1 second, exponentially increasing
        const baseDelay = 1000;
        const maxDelay = 60000; // Max 1 minute

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, then cap at 60s
        const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);

        // Add jitter (±30%) to prevent thundering herd problem
        const jitterRange = 0.3;
        const jitter = (Math.random() * 2 - 1) * jitterRange * delay;

        return Math.max(delay + jitter, 500); // Minimum 500ms delay
    }

    /**
     * Get current queue status including conflicts
     */
    async getQueueStatus(): Promise<QueueStatus> {
        const queueStatus = await syncQueueStore.getQueueStatus();
        const conflictCount = await getConflictCount();

        return {
            ...queueStatus,
            conflicts: conflictCount.unresolved
        };
    }

    /**
     * Get connectivity status
     */
    getConnectivityStatus(): ConnectivityStatus {
        const status = connectivityMonitor.getStatus();
        return {
            isOnline: status.isOnline,
            lastOnlineAt: status.lastOnlineAt,
            lastOfflineAt: status.lastOfflineAt,
        };
    }

    /**
     * Register callback for connectivity changes
     */
    onConnectivityChange(callback: ConnectivityCallback): () => void {
        this.connectivityCallbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.connectivityCallbacks.delete(callback);
        };
    }

    /**
     * Register callback for sync progress updates
     */
    onSyncProgress(callback: SyncProgressCallback): () => void {
        this.syncProgressCallbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.syncProgressCallbacks.delete(callback);
        };
    }

    /**
     * Force sync all pending operations (manual trigger)
     */
    async forceSyncPendingOperations(): Promise<void> {
        if (!connectivityMonitor.isOnline()) {
            throw new Error('Cannot sync while offline');
        }

        await this.syncPendingOperations();
    }

    /**
     * Get failed operations for manual review
     */
    async getFailedOperations(): Promise<SyncQueueItem[]> {
        return await syncQueueStore.getFailedOperations();
    }

    /**
     * Retry a specific failed operation
     */
    async retryFailedOperation(operationId: string): Promise<void> {
        const operation = await syncQueueStore.get(operationId);

        if (!operation) {
            throw new Error(`Operation not found: ${operationId}`);
        }

        if (operation.status !== 'failed') {
            throw new Error(`Operation is not in failed state: ${operation.status}`);
        }

        if (operation.retryCount >= 5) {
            throw new Error('Operation has exceeded maximum retry attempts');
        }

        await this.syncSingleOperation(operation);
    }

    /**
     * Clear completed operations older than specified hours
     */
    async cleanupCompletedOperations(olderThanHours: number = 24): Promise<void> {
        await syncQueueStore.cleanupCompletedOperations(olderThanHours);
    }

    /**
     * Utility function to chunk array for parallel processing
     */
    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Fetch remote content for conflict detection (placeholder)
     */
    private async fetchRemoteContent(contentId: string): Promise<any | null> {
        // TODO: Implement actual remote content fetching when server actions are available
        console.log('Fetching remote content for conflict detection:', contentId);

        // Simulate remote content that might conflict
        // In a real implementation, this would call a server action
        const simulateConflict = Math.random() < 0.3; // 30% chance of conflict for testing

        if (simulateConflict) {
            return {
                id: contentId,
                content: `Remote content modified at ${new Date().toISOString()}`,
                lastModified: Date.now() - Math.random() * 10000, // Random recent timestamp
                userId: 'remote-user'
            };
        }

        return null;
    }

    /**
     * Fetch remote draft for conflict detection (placeholder)
     */
    private async fetchRemoteDraft(draftId: string): Promise<any | null> {
        // TODO: Implement actual remote draft fetching when server actions are available
        console.log('Fetching remote draft for conflict detection:', draftId);

        // Simulate remote draft that might conflict
        // In a real implementation, this would call a server action
        const simulateConflict = Math.random() < 0.2; // 20% chance of conflict for testing

        if (simulateConflict) {
            return {
                id: draftId,
                content: {
                    title: 'Remote Draft Title',
                    body: `Remote draft content modified at ${new Date().toISOString()}`,
                    tags: ['remote', 'draft']
                },
                lastModified: Date.now() - Math.random() * 5000, // Random recent timestamp
                userId: 'remote-user'
            };
        }

        return null;
    }

    /**
     * Get unresolved conflicts count
     */
    async getUnresolvedConflictsCount(): Promise<number> {
        const conflictCount = await getConflictCount();
        return conflictCount.unresolved;
    }

    /**
     * Check if there are any unresolved conflicts
     */
    async hasUnresolvedConflicts(): Promise<boolean> {
        const count = await this.getUnresolvedConflictsCount();
        return count > 0;
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        // Unsubscribe from connectivity monitor
        if (this.connectivityUnsubscribe) {
            this.connectivityUnsubscribe();
            this.connectivityUnsubscribe = undefined;
        }

        // Unsubscribe from background sync manager
        if (this.backgroundSyncUnsubscribe) {
            this.backgroundSyncUnsubscribe();
            this.backgroundSyncUnsubscribe = undefined;
        }

        this.connectivityCallbacks.clear();
        this.syncProgressCallbacks.clear();
    }
}

// Export singleton instance
export const offlineSyncManager = new OfflineSyncManager();