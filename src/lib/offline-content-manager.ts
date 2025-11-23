/**
 * Offline Content Manager for Mobile Enhancements
 * 
 * This module provides comprehensive offline content management including
 * creation, editing, conflict resolution, and synchronization with DynamoDB.
 */

import { draftsStore, syncQueueStore, cachedContentStore } from './indexeddb-wrapper';
import { DraftItem, SyncQueueItem, generateId } from './indexeddb-schema';
import { offlineSyncManager } from './offline-sync-manager';

export interface ContentDraft {
    id: string;
    type: 'blog' | 'social' | 'market-update' | 'notes' | 'listing-description' | 'meeting-prep';
    title: string;
    content: any;
    metadata?: {
        tags?: string[];
        category?: string;
        targetAudience?: string;
        platform?: string;
        listingId?: string;
        clientId?: string;
    };
    createdAt: number;
    lastModified: number;
    synced: boolean;
    userId?: string;
    syncStatus: 'local' | 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
    conflictId?: string;
    originalContent?: any; // For conflict resolution
}

export interface ContentCreationRequest {
    type: ContentDraft['type'];
    title: string;
    content: any;
    metadata?: ContentDraft['metadata'];
    userId?: string;
}

export interface ContentEditRequest {
    id: string;
    title?: string;
    content?: any;
    metadata?: ContentDraft['metadata'];
}

export interface OfflineIndicatorData {
    isOffline: boolean;
    pendingSyncCount: number;
    failedSyncCount: number;
    conflictCount: number;
    lastSyncAt?: number;
    nextSyncAttempt?: number;
}

export interface ContentSyncResult {
    success: boolean;
    contentId: string;
    syncedAt: number;
    error?: string;
    conflictDetected?: boolean;
    conflictId?: string;
}

/**
 * Main offline content manager class
 */
export class OfflineContentManager {
    private connectivityCallback?: () => void;
    private syncProgressCallback?: (progress: { completed: number; total: number }) => void;

    constructor() {
        this.initializeConnectivityMonitoring();
    }

    /**
     * Initialize connectivity monitoring
     */
    private initializeConnectivityMonitoring(): void {
        this.connectivityCallback = offlineSyncManager.onConnectivityChange((isOnline) => {
            if (isOnline) {
                // Auto-sync content when coming back online
                this.syncAllPendingContent().catch(error => {
                    console.error('Auto-sync failed after connectivity restoration:', error);
                });
            }
        });
    }

    /**
     * Create new content offline
     */
    async createContent(request: ContentCreationRequest): Promise<ContentDraft> {
        try {
            const now = Date.now();
            const contentId = generateId();

            const draft: ContentDraft = {
                id: contentId,
                type: request.type,
                title: request.title,
                content: request.content,
                metadata: request.metadata,
                createdAt: now,
                lastModified: now,
                synced: false,
                userId: request.userId,
                syncStatus: 'local',
            };

            // Store in IndexedDB drafts store
            const draftItem: DraftItem = {
                id: contentId,
                type: request.type,
                content: {
                    title: request.title,
                    content: request.content,
                    metadata: request.metadata,
                    createdAt: now,
                    lastModified: now,
                },
                lastModified: now,
                synced: false,
                userId: request.userId,
            };

            await draftsStore.put(draftItem);

            // Queue for sync if online
            const connectivityStatus = offlineSyncManager.getConnectivityStatus();
            if (connectivityStatus.isOnline) {
                await this.queueContentForSync(draft);
                draft.syncStatus = 'pending';
            }

            console.log(`Content created offline: ${draft.type} - ${draft.title} (${draft.id})`);

            return draft;
        } catch (error) {
            console.error('Failed to create content offline:', error);
            throw error;
        }
    }

    /**
     * Edit existing content offline
     */
    async editContent(request: ContentEditRequest): Promise<ContentDraft> {
        try {
            const existingDraft = await draftsStore.get(request.id);

            if (!existingDraft) {
                throw new Error(`Content not found: ${request.id}`);
            }

            const now = Date.now();

            // Update the draft
            const updatedContent = {
                ...existingDraft.content,
                title: request.title ?? existingDraft.content.title,
                content: request.content ?? existingDraft.content.content,
                metadata: request.metadata ?? existingDraft.content.metadata,
                lastModified: now,
            };

            const updatedDraft: DraftItem = {
                ...existingDraft,
                content: updatedContent,
                lastModified: now,
                synced: false,
            };

            await draftsStore.put(updatedDraft);

            // Create content draft response
            const draft: ContentDraft = {
                id: updatedDraft.id,
                type: updatedDraft.type,
                title: updatedContent.title,
                content: updatedContent.content,
                metadata: updatedContent.metadata,
                createdAt: updatedContent.createdAt,
                lastModified: now,
                synced: false,
                userId: updatedDraft.userId,
                syncStatus: 'local',
            };

            // Queue for sync if online
            const connectivityStatus = offlineSyncManager.getConnectivityStatus();
            if (connectivityStatus.isOnline) {
                await this.queueContentForSync(draft, 'edit');
                draft.syncStatus = 'pending';
            }

            console.log(`Content edited offline: ${draft.type} - ${draft.title} (${draft.id})`);

            return draft;
        } catch (error) {
            console.error('Failed to edit content offline:', error);
            throw error;
        }
    }

    /**
     * Get all offline content drafts
     */
    async getAllDrafts(userId?: string): Promise<ContentDraft[]> {
        try {
            let drafts: DraftItem[];

            if (userId) {
                drafts = await draftsStore.getDraftsByUser(userId);
            } else {
                drafts = await draftsStore.getAll();
            }

            // Convert to ContentDraft format
            const contentDrafts: ContentDraft[] = drafts.map(draft => ({
                id: draft.id,
                type: draft.type,
                title: draft.content.title || 'Untitled',
                content: draft.content.content,
                metadata: draft.content.metadata,
                createdAt: draft.content.createdAt || draft.lastModified,
                lastModified: draft.lastModified,
                synced: draft.synced,
                userId: draft.userId,
                syncStatus: draft.synced ? 'synced' : 'local',
            }));

            // Update sync status based on queue status
            await this.updateDraftSyncStatus(contentDrafts);

            return contentDrafts.sort((a, b) => b.lastModified - a.lastModified);
        } catch (error) {
            console.error('Failed to get drafts:', error);
            throw error;
        }
    }

    /**
     * Get drafts by type
     */
    async getDraftsByType(type: ContentDraft['type'], userId?: string): Promise<ContentDraft[]> {
        try {
            const allDrafts = await this.getAllDrafts(userId);
            return allDrafts.filter(draft => draft.type === type);
        } catch (error) {
            console.error('Failed to get drafts by type:', error);
            throw error;
        }
    }

    /**
     * Get recent drafts
     */
    async getRecentDrafts(limit: number = 10, userId?: string): Promise<ContentDraft[]> {
        try {
            const allDrafts = await this.getAllDrafts(userId);
            return allDrafts.slice(0, limit);
        } catch (error) {
            console.error('Failed to get recent drafts:', error);
            throw error;
        }
    }

    /**
     * Get unsynced drafts
     */
    async getUnsyncedDrafts(userId?: string): Promise<ContentDraft[]> {
        try {
            const allDrafts = await this.getAllDrafts(userId);
            return allDrafts.filter(draft => !draft.synced);
        } catch (error) {
            console.error('Failed to get unsynced drafts:', error);
            throw error;
        }
    }

    /**
     * Delete content draft
     */
    async deleteDraft(contentId: string): Promise<void> {
        try {
            await draftsStore.delete(contentId);
            console.log(`Draft deleted: ${contentId}`);
        } catch (error) {
            console.error('Failed to delete draft:', error);
            throw error;
        }
    }

    /**
     * Queue content for sync
     */
    private async queueContentForSync(
        draft: ContentDraft,
        operationType: 'content' | 'edit' = 'content'
    ): Promise<string> {
        const syncData = {
            id: draft.id,
            type: draft.type,
            title: draft.title,
            content: draft.content,
            metadata: draft.metadata,
            userId: draft.userId,
            operationType,
            timestamp: Date.now(),
        };

        return await offlineSyncManager.queueOperation({
            type: operationType,
            data: syncData,
            timestamp: Date.now(),
        });
    }

    /**
     * Sync all pending content
     */
    async syncAllPendingContent(): Promise<ContentSyncResult[]> {
        try {
            const unsyncedDrafts = await this.getUnsyncedDrafts();
            const results: ContentSyncResult[] = [];

            console.log(`Syncing ${unsyncedDrafts.length} pending content items`);

            for (const draft of unsyncedDrafts) {
                try {
                    const result = await this.syncSingleContent(draft);
                    results.push(result);
                } catch (error) {
                    console.error(`Failed to sync content ${draft.id}:`, error);
                    results.push({
                        success: false,
                        contentId: draft.id,
                        syncedAt: Date.now(),
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('Failed to sync pending content:', error);
            throw error;
        }
    }

    /**
     * Sync single content item
     */
    private async syncSingleContent(draft: ContentDraft): Promise<ContentSyncResult> {
        try {
            // Queue the content for sync through the sync manager
            await this.queueContentForSync(draft);

            // Mark as synced in local storage
            await draftsStore.markDraftAsSynced(draft.id);

            return {
                success: true,
                contentId: draft.id,
                syncedAt: Date.now(),
            };
        } catch (error) {
            console.error(`Failed to sync content ${draft.id}:`, error);
            return {
                success: false,
                contentId: draft.id,
                syncedAt: Date.now(),
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Update draft sync status based on queue status
     */
    private async updateDraftSyncStatus(drafts: ContentDraft[]): Promise<void> {
        try {
            const queueStatus = await offlineSyncManager.getQueueStatus();
            const pendingOperations = await syncQueueStore.getPendingOperations();
            const failedOperations = await syncQueueStore.getFailedOperations();

            // Create maps for quick lookup
            const pendingMap = new Map(
                pendingOperations
                    .filter(op => op.type === 'content' || op.type === 'edit')
                    .map(op => [op.data?.id, op])
            );

            const failedMap = new Map(
                failedOperations
                    .filter(op => op.type === 'content' || op.type === 'edit')
                    .map(op => [op.data?.id, op])
            );

            // Update draft sync status
            for (const draft of drafts) {
                if (draft.synced) {
                    draft.syncStatus = 'synced';
                } else if (pendingMap.has(draft.id)) {
                    const operation = pendingMap.get(draft.id);
                    draft.syncStatus = operation?.status === 'syncing' ? 'syncing' : 'pending';
                } else if (failedMap.has(draft.id)) {
                    draft.syncStatus = 'failed';
                } else {
                    draft.syncStatus = 'local';
                }
            }
        } catch (error) {
            console.error('Failed to update draft sync status:', error);
        }
    }

    /**
     * Get offline indicator data
     */
    async getOfflineIndicatorData(): Promise<OfflineIndicatorData> {
        try {
            const connectivityStatus = offlineSyncManager.getConnectivityStatus();
            const queueStatus = await offlineSyncManager.getQueueStatus();
            const unsyncedDrafts = await this.getUnsyncedDrafts();

            return {
                isOffline: !connectivityStatus.isOnline,
                pendingSyncCount: queueStatus.pending + unsyncedDrafts.length,
                failedSyncCount: queueStatus.failed,
                conflictCount: queueStatus.conflicts,
                lastSyncAt: connectivityStatus.lastOnlineAt,
            };
        } catch (error) {
            console.error('Failed to get offline indicator data:', error);
            return {
                isOffline: true,
                pendingSyncCount: 0,
                failedSyncCount: 0,
                conflictCount: 0,
            };
        }
    }

    /**
     * Force sync all content (manual trigger)
     */
    async forceSyncAllContent(): Promise<ContentSyncResult[]> {
        const connectivityStatus = offlineSyncManager.getConnectivityStatus();

        if (!connectivityStatus.isOnline) {
            throw new Error('Cannot sync while offline');
        }

        return await this.syncAllPendingContent();
    }

    /**
     * Get content by ID
     */
    async getContentById(contentId: string): Promise<ContentDraft | null> {
        try {
            const draftItem = await draftsStore.get(contentId);

            if (!draftItem) {
                return null;
            }

            const draft: ContentDraft = {
                id: draftItem.id,
                type: draftItem.type,
                title: draftItem.content.title || 'Untitled',
                content: draftItem.content.content,
                metadata: draftItem.content.metadata,
                createdAt: draftItem.content.createdAt || draftItem.lastModified,
                lastModified: draftItem.lastModified,
                synced: draftItem.synced,
                userId: draftItem.userId,
                syncStatus: draftItem.synced ? 'synced' : 'local',
            };

            // Update sync status
            await this.updateDraftSyncStatus([draft]);

            return draft;
        } catch (error) {
            console.error('Failed to get content by ID:', error);
            return null;
        }
    }

    /**
     * Check if content exists
     */
    async contentExists(contentId: string): Promise<boolean> {
        try {
            const content = await this.getContentById(contentId);
            return content !== null;
        } catch (error) {
            console.error('Failed to check if content exists:', error);
            return false;
        }
    }

    /**
     * Get storage statistics
     */
    async getStorageStats(): Promise<{
        totalDrafts: number;
        unsyncedDrafts: number;
        draftsByType: Record<string, number>;
        storageUsed: number;
    }> {
        try {
            const allDrafts = await this.getAllDrafts();
            const unsyncedDrafts = allDrafts.filter(draft => !draft.synced);

            const draftsByType: Record<string, number> = {};
            for (const draft of allDrafts) {
                draftsByType[draft.type] = (draftsByType[draft.type] || 0) + 1;
            }

            // Estimate storage usage (rough calculation)
            const storageUsed = allDrafts.reduce((total, draft) => {
                const contentSize = JSON.stringify(draft.content).length;
                const metadataSize = JSON.stringify(draft.metadata || {}).length;
                return total + contentSize + metadataSize + 200; // 200 bytes for overhead
            }, 0);

            return {
                totalDrafts: allDrafts.length,
                unsyncedDrafts: unsyncedDrafts.length,
                draftsByType,
                storageUsed,
            };
        } catch (error) {
            console.error('Failed to get storage stats:', error);
            return {
                totalDrafts: 0,
                unsyncedDrafts: 0,
                draftsByType: {},
                storageUsed: 0,
            };
        }
    }

    /**
     * Cleanup old synced drafts
     */
    async cleanupOldDrafts(olderThanDays: number = 7): Promise<number> {
        try {
            const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
            const allDrafts = await this.getAllDrafts();

            const draftsToDelete = allDrafts.filter(draft =>
                draft.synced && draft.lastModified < cutoffTime
            );

            for (const draft of draftsToDelete) {
                await this.deleteDraft(draft.id);
            }

            console.log(`Cleaned up ${draftsToDelete.length} old synced drafts`);
            return draftsToDelete.length;
        } catch (error) {
            console.error('Failed to cleanup old drafts:', error);
            return 0;
        }
    }

    /**
     * Register sync progress callback
     */
    onSyncProgress(callback: (progress: { completed: number; total: number }) => void): () => void {
        this.syncProgressCallback = callback;

        // Return unsubscribe function
        return () => {
            this.syncProgressCallback = undefined;
        };
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        if (this.connectivityCallback) {
            this.connectivityCallback();
        }
        this.syncProgressCallback = undefined;
    }
}

// Export singleton instance
export const offlineContentManager = new OfflineContentManager();

/**
 * Utility functions for content management
 */

/**
 * Generate content preview text
 */
export function generateContentPreview(content: any, maxLength: number = 150): string {
    if (typeof content === 'string') {
        return content.length > maxLength
            ? content.substring(0, maxLength) + '...'
            : content;
    }

    if (typeof content === 'object' && content !== null) {
        // Try to extract text from common content structures
        const text = content.body || content.text || content.description || JSON.stringify(content);
        return typeof text === 'string'
            ? (text.length > maxLength ? text.substring(0, maxLength) + '...' : text)
            : 'Content preview not available';
    }

    return 'Content preview not available';
}

/**
 * Format content type for display
 */
export function formatContentType(type: ContentDraft['type']): string {
    const typeMap: Record<ContentDraft['type'], string> = {
        'blog': 'Blog Post',
        'social': 'Social Media',
        'market-update': 'Market Update',
        'notes': 'Notes',
        'listing-description': 'Listing Description',
        'meeting-prep': 'Meeting Prep',
    };

    return typeMap[type] || type;
}

/**
 * Get content type icon
 */
export function getContentTypeIcon(type: ContentDraft['type']): string {
    const iconMap: Record<ContentDraft['type'], string> = {
        'blog': '📝',
        'social': '📱',
        'market-update': '📊',
        'notes': '📋',
        'listing-description': '🏠',
        'meeting-prep': '🤝',
    };

    return iconMap[type] || '📄';
}

/**
 * Validate content draft
 */
export function validateContentDraft(draft: Partial<ContentDraft>): string[] {
    const errors: string[] = [];

    if (!draft.title || draft.title.trim().length === 0) {
        errors.push('Title is required');
    }

    if (!draft.type) {
        errors.push('Content type is required');
    }

    if (!draft.content) {
        errors.push('Content is required');
    }

    if (draft.title && draft.title.length > 200) {
        errors.push('Title must be less than 200 characters');
    }

    return errors;
}