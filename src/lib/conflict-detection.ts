/**
 * Conflict Detection System for Mobile Enhancements
 * 
 * This module provides conflict detection logic for offline sync operations.
 * It compares timestamps and content hashes to identify conflicting changes
 * and stores both versions for user review.
 */

import { DraftItem } from './indexeddb-schema';

export interface ConflictData {
    id: string;
    type: 'content' | 'draft' | 'edit';
    localVersion: ConflictVersion;
    remoteVersion: ConflictVersion;
    conflictType: 'timestamp' | 'content' | 'both';
    detectedAt: number;
    resolved: boolean;
}

export interface ConflictVersion {
    id: string;
    content: any;
    timestamp: number;
    contentHash: string;
    source: 'local' | 'remote';
    metadata?: {
        userId?: string;
        deviceId?: string;
        lastModifiedBy?: string;
    };
}

export interface ConflictResolution {
    conflictId: string;
    resolution: 'use-local' | 'use-remote' | 'merge' | 'manual';
    resolvedContent?: any;
    resolvedAt: number;
    resolvedBy?: string;
}

/**
 * Generate a simple hash for content comparison
 */
export function generateContentHash(content: any): string {
    const contentString = typeof content === 'string'
        ? content
        : JSON.stringify(content, Object.keys(content).sort());

    // Simple hash function (djb2)
    let hash = 5381;
    for (let i = 0; i < contentString.length; i++) {
        hash = ((hash << 5) + hash) + contentString.charCodeAt(i);
    }

    return Math.abs(hash).toString(36);
}

/**
 * Compare two versions and detect conflicts
 */
export function detectConflict(
    localVersion: Omit<ConflictVersion, 'contentHash' | 'source'>,
    remoteVersion: Omit<ConflictVersion, 'contentHash' | 'source'>
): ConflictData | null {
    // Generate content hashes
    const localHash = generateContentHash(localVersion.content);
    const remoteHash = generateContentHash(remoteVersion.content);

    // If content is identical, no conflict
    if (localHash === remoteHash) {
        return null;
    }

    // Determine conflict type
    let conflictType: ConflictData['conflictType'] = 'content';

    // Check for timestamp conflicts (both versions modified around the same time)
    const timeDifference = Math.abs(localVersion.timestamp - remoteVersion.timestamp);
    const conflictThreshold = 5 * 60 * 1000; // 5 minutes

    if (timeDifference < conflictThreshold) {
        conflictType = 'both';
    } else if (localVersion.timestamp > remoteVersion.timestamp) {
        // Local is newer but content differs - potential conflict
        conflictType = 'timestamp';
    }

    // Create conflict data
    const conflict: ConflictData = {
        id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'content', // Default type, can be overridden
        localVersion: {
            ...localVersion,
            contentHash: localHash,
            source: 'local'
        },
        remoteVersion: {
            ...remoteVersion,
            contentHash: remoteHash,
            source: 'remote'
        },
        conflictType,
        detectedAt: Date.now(),
        resolved: false
    };

    return conflict;
}

/**
 * Detect conflicts for draft items specifically
 */
export function detectDraftConflict(
    localDraft: DraftItem,
    remoteDraft: any
): ConflictData | null {
    const localVersion: Omit<ConflictVersion, 'contentHash' | 'source'> = {
        id: localDraft.id,
        content: localDraft.content,
        timestamp: localDraft.lastModified,
        metadata: {
            userId: localDraft.userId
        }
    };

    const remoteVersion: Omit<ConflictVersion, 'contentHash' | 'source'> = {
        id: remoteDraft.id || localDraft.id,
        content: remoteDraft.content || remoteDraft,
        timestamp: remoteDraft.lastModified || remoteDraft.updatedAt || Date.now(),
        metadata: {
            userId: remoteDraft.userId,
            lastModifiedBy: remoteDraft.lastModifiedBy
        }
    };

    const conflict = detectConflict(localVersion, remoteVersion);

    if (conflict) {
        conflict.type = 'draft';
    }

    return conflict;
}

/**
 * Detect conflicts for content edits
 */
export function detectEditConflict(
    localEdit: any,
    remoteContent: any
): ConflictData | null {
    const localVersion: Omit<ConflictVersion, 'contentHash' | 'source'> = {
        id: localEdit.id,
        content: localEdit.content,
        timestamp: localEdit.timestamp || localEdit.lastModified || Date.now(),
        metadata: {
            userId: localEdit.userId,
            deviceId: localEdit.deviceId
        }
    };

    const remoteVersion: Omit<ConflictVersion, 'contentHash' | 'source'> = {
        id: remoteContent.id || localEdit.id,
        content: remoteContent.content || remoteContent,
        timestamp: remoteContent.updatedAt || remoteContent.lastModified || Date.now(),
        metadata: {
            userId: remoteContent.userId,
            lastModifiedBy: remoteContent.lastModifiedBy
        }
    };

    const conflict = detectConflict(localVersion, remoteVersion);

    if (conflict) {
        conflict.type = 'edit';
    }

    return conflict;
}

/**
 * Determine if a conflict can be auto-resolved
 */
export function canAutoResolve(conflict: ConflictData): boolean {
    // Auto-resolve if one version is significantly newer (more than 1 hour)
    const timeDifference = Math.abs(
        conflict.localVersion.timestamp - conflict.remoteVersion.timestamp
    );
    const autoResolveThreshold = 60 * 60 * 1000; // 1 hour

    if (timeDifference > autoResolveThreshold) {
        return true;
    }

    // Auto-resolve if content is very similar (minor changes)
    const similarity = calculateContentSimilarity(
        conflict.localVersion.content,
        conflict.remoteVersion.content
    );

    // If content is 95% similar, consider auto-resolving
    return similarity > 0.95;
}

/**
 * Auto-resolve a conflict by choosing the newer version
 */
export function autoResolveConflict(conflict: ConflictData): ConflictResolution {
    const useLocal = conflict.localVersion.timestamp > conflict.remoteVersion.timestamp;

    return {
        conflictId: conflict.id,
        resolution: useLocal ? 'use-local' : 'use-remote',
        resolvedContent: useLocal
            ? conflict.localVersion.content
            : conflict.remoteVersion.content,
        resolvedAt: Date.now(),
        resolvedBy: 'auto-resolver'
    };
}

/**
 * Calculate content similarity (simple implementation)
 */
function calculateContentSimilarity(content1: any, content2: any): number {
    const str1 = typeof content1 === 'string' ? content1 : JSON.stringify(content1);
    const str2 = typeof content2 === 'string' ? content2 : JSON.stringify(content2);

    if (str1 === str2) return 1.0;

    // Simple character-based similarity
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;

    let matches = 0;
    const minLength = Math.min(str1.length, str2.length);

    for (let i = 0; i < minLength; i++) {
        if (str1[i] === str2[i]) {
            matches++;
        }
    }

    return matches / maxLength;
}

/**
 * Create a conflict resolution
 */
export function createResolution(
    conflictId: string,
    resolution: ConflictResolution['resolution'],
    resolvedContent?: any,
    resolvedBy?: string
): ConflictResolution {
    return {
        conflictId,
        resolution,
        resolvedContent,
        resolvedAt: Date.now(),
        resolvedBy
    };
}

/**
 * Validate conflict data
 */
export function validateConflict(conflict: ConflictData): boolean {
    if (!conflict.id || !conflict.localVersion || !conflict.remoteVersion) {
        return false;
    }

    if (!conflict.localVersion.contentHash || !conflict.remoteVersion.contentHash) {
        return false;
    }

    if (conflict.detectedAt <= 0) {
        return false;
    }

    return true;
}

/**
 * Merge two content versions (simple implementation)
 */
export function mergeContent(
    localContent: any,
    remoteContent: any,
    mergeStrategy: 'prefer-local' | 'prefer-remote' | 'combine' = 'prefer-local'
): any {
    // Handle string content
    if (typeof localContent === 'string' && typeof remoteContent === 'string') {
        switch (mergeStrategy) {
            case 'prefer-local':
                return localContent;
            case 'prefer-remote':
                return remoteContent;
            case 'combine':
                return `${localContent}\n\n--- MERGED ---\n\n${remoteContent}`;
            default:
                return localContent;
        }
    }

    // Handle object content
    if (typeof localContent === 'object' && typeof remoteContent === 'object') {
        switch (mergeStrategy) {
            case 'prefer-local':
                return { ...remoteContent, ...localContent };
            case 'prefer-remote':
                return { ...localContent, ...remoteContent };
            case 'combine':
                return {
                    ...remoteContent,
                    ...localContent,
                    _merged: true,
                    _mergedAt: Date.now()
                };
            default:
                return { ...remoteContent, ...localContent };
        }
    }

    // Default to local content
    return localContent;
}

/**
 * Get conflict summary for display
 */
export function getConflictSummary(conflict: ConflictData): string {
    const timeDiff = Math.abs(
        conflict.localVersion.timestamp - conflict.remoteVersion.timestamp
    );
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    let summary = `Conflict detected: ${conflict.conflictType}`;

    if (hours > 0) {
        summary += ` (${hours}h ${minutes}m apart)`;
    } else if (minutes > 0) {
        summary += ` (${minutes}m apart)`;
    } else {
        summary += ` (simultaneous changes)`;
    }

    return summary;
}