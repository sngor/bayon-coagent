/**
 * Conflict Storage System for Mobile Enhancements
 * 
 * This module provides storage and management for sync conflicts,
 * allowing conflicts to be stored, retrieved, and resolved.
 */

import { getDatabase, STORES, generateId } from './indexeddb-schema';
import { ConflictData, ConflictResolution } from './conflict-detection';

// Extend the stores to include conflicts
const CONFLICT_STORE = 'conflicts';

export interface StoredConflict extends ConflictData {
    resolution?: ConflictResolution;
}

/**
 * Initialize conflict storage (extend existing IndexedDB)
 */
export async function initializeConflictStorage(): Promise<void> {
    // This will be handled by extending the main IndexedDB schema
    // For now, we'll use the existing database and add conflicts to a separate store
    console.log('Conflict storage initialized');
}

/**
 * Store a conflict for user review
 */
export async function storeConflict(conflict: ConflictData): Promise<void> {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.DRAFTS], 'readwrite');
        const store = transaction.objectStore(STORES.DRAFTS);

        // Store conflict as a special draft item
        const conflictItem = {
            id: `conflict-${conflict.id}`,
            type: 'conflict' as any,
            content: conflict,
            lastModified: conflict.detectedAt,
            synced: false,
            userId: conflict.localVersion.metadata?.userId
        };

        const request = store.put(conflictItem);

        request.onsuccess = () => {
            console.log('Conflict stored:', conflict.id);
            resolve();
        };

        request.onerror = () => {
            console.error('Failed to store conflict:', request.error);
            reject(new Error(`Failed to store conflict: ${request.error?.message}`));
        };
    });
}

/**
 * Get all unresolved conflicts
 */
export async function getUnresolvedConflicts(): Promise<ConflictData[]> {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.DRAFTS], 'readonly');
        const store = transaction.objectStore(STORES.DRAFTS);
        const index = store.index('type');
        const request = index.getAll('conflict' as any);

        request.onsuccess = () => {
            const conflicts = request.result
                .map(item => item.content as ConflictData)
                .filter(conflict => !conflict.resolved);

            resolve(conflicts);
        };

        request.onerror = () => {
            console.error('Failed to get conflicts:', request.error);
            reject(new Error(`Failed to get conflicts: ${request.error?.message}`));
        };
    });
}

/**
 * Get a specific conflict by ID
 */
export async function getConflict(conflictId: string): Promise<ConflictData | null> {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.DRAFTS], 'readonly');
        const store = transaction.objectStore(STORES.DRAFTS);
        const request = store.get(`conflict-${conflictId}`);

        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result.content as ConflictData);
            } else {
                resolve(null);
            }
        };

        request.onerror = () => {
            console.error('Failed to get conflict:', request.error);
            reject(new Error(`Failed to get conflict: ${request.error?.message}`));
        };
    });
}

/**
 * Resolve a conflict with the given resolution
 */
export async function resolveConflict(
    conflictId: string,
    resolution: ConflictResolution
): Promise<void> {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.DRAFTS], 'readwrite');
        const store = transaction.objectStore(STORES.DRAFTS);
        const getRequest = store.get(`conflict-${conflictId}`);

        getRequest.onsuccess = () => {
            const conflictItem = getRequest.result;

            if (!conflictItem) {
                reject(new Error(`Conflict not found: ${conflictId}`));
                return;
            }

            // Update conflict with resolution
            const conflict = conflictItem.content as ConflictData;
            conflict.resolved = true;

            // Store the resolution
            const resolvedConflict: StoredConflict = {
                ...conflict,
                resolution
            };

            conflictItem.content = resolvedConflict;
            conflictItem.lastModified = Date.now();

            const putRequest = store.put(conflictItem);

            putRequest.onsuccess = () => {
                console.log('Conflict resolved:', conflictId);
                resolve();
            };

            putRequest.onerror = () => {
                console.error('Failed to resolve conflict:', putRequest.error);
                reject(new Error(`Failed to resolve conflict: ${putRequest.error?.message}`));
            };
        };

        getRequest.onerror = () => {
            console.error('Failed to get conflict for resolution:', getRequest.error);
            reject(new Error(`Failed to get conflict: ${getRequest.error?.message}`));
        };
    });
}

/**
 * Get all resolved conflicts (for history/audit)
 */
export async function getResolvedConflicts(): Promise<StoredConflict[]> {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.DRAFTS], 'readonly');
        const store = transaction.objectStore(STORES.DRAFTS);
        const index = store.index('type');
        const request = index.getAll('conflict' as any);

        request.onsuccess = () => {
            const conflicts = request.result
                .map(item => item.content as StoredConflict)
                .filter(conflict => conflict.resolved);

            resolve(conflicts);
        };

        request.onerror = () => {
            console.error('Failed to get resolved conflicts:', request.error);
            reject(new Error(`Failed to get resolved conflicts: ${request.error?.message}`));
        };
    });
}

/**
 * Delete a resolved conflict (cleanup)
 */
export async function deleteConflict(conflictId: string): Promise<void> {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.DRAFTS], 'readwrite');
        const store = transaction.objectStore(STORES.DRAFTS);
        const request = store.delete(`conflict-${conflictId}`);

        request.onsuccess = () => {
            console.log('Conflict deleted:', conflictId);
            resolve();
        };

        request.onerror = () => {
            console.error('Failed to delete conflict:', request.error);
            reject(new Error(`Failed to delete conflict: ${request.error?.message}`));
        };
    });
}

/**
 * Get conflict count for status display
 */
export async function getConflictCount(): Promise<{ unresolved: number; resolved: number }> {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.DRAFTS], 'readonly');
        const store = transaction.objectStore(STORES.DRAFTS);
        const index = store.index('type');
        const request = index.getAll('conflict' as any);

        request.onsuccess = () => {
            const conflicts = request.result.map(item => item.content as ConflictData);
            const unresolved = conflicts.filter(c => !c.resolved).length;
            const resolved = conflicts.filter(c => c.resolved).length;

            resolve({ unresolved, resolved });
        };

        request.onerror = () => {
            console.error('Failed to get conflict count:', request.error);
            reject(new Error(`Failed to get conflict count: ${request.error?.message}`));
        };
    });
}

/**
 * Clean up old resolved conflicts
 */
export async function cleanupResolvedConflicts(olderThanHours: number = 168): Promise<void> {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    const resolvedConflicts = await getResolvedConflicts();

    const oldConflicts = resolvedConflicts.filter(
        conflict => conflict.resolution && conflict.resolution.resolvedAt < cutoffTime
    );

    for (const conflict of oldConflicts) {
        await deleteConflict(conflict.id);
    }

    console.log(`Cleaned up ${oldConflicts.length} old resolved conflicts`);
}

/**
 * Export conflict data for debugging/analysis
 */
export async function exportConflictData(): Promise<StoredConflict[]> {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.DRAFTS], 'readonly');
        const store = transaction.objectStore(STORES.DRAFTS);
        const index = store.index('type');
        const request = index.getAll('conflict' as any);

        request.onsuccess = () => {
            const conflicts = request.result.map(item => item.content as StoredConflict);
            resolve(conflicts);
        };

        request.onerror = () => {
            console.error('Failed to export conflict data:', request.error);
            reject(new Error(`Failed to export conflict data: ${request.error?.message}`));
        };
    });
}