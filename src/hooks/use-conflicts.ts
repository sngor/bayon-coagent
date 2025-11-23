/**
 * React Hook for Conflict Management
 * 
 * This hook provides a React interface for managing sync conflicts,
 * including loading conflicts, tracking counts, and handling resolutions.
 */

import { useState, useEffect, useCallback } from 'react';
import { ConflictData, ConflictResolution } from '@/lib/conflict-detection';
import {
    getUnresolvedConflicts,
    getResolvedConflicts,
    getConflictCount,
    resolveConflict,
    deleteConflict,
    StoredConflict
} from '@/lib/conflict-storage';

export interface UseConflictsReturn {
    // State
    unresolvedConflicts: ConflictData[];
    resolvedConflicts: StoredConflict[];
    conflictCount: { unresolved: number; resolved: number };
    isLoading: boolean;
    error: string | null;

    // Actions
    refreshConflicts: () => Promise<void>;
    resolveConflictById: (conflictId: string, resolution: ConflictResolution) => Promise<void>;
    deleteConflictById: (conflictId: string) => Promise<void>;
    clearError: () => void;
}

export function useConflicts(): UseConflictsReturn {
    const [unresolvedConflicts, setUnresolvedConflicts] = useState<ConflictData[]>([]);
    const [resolvedConflicts, setResolvedConflicts] = useState<StoredConflict[]>([]);
    const [conflictCount, setConflictCount] = useState({ unresolved: 0, resolved: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshConflicts = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [unresolved, resolved, count] = await Promise.all([
                getUnresolvedConflicts(),
                getResolvedConflicts(),
                getConflictCount()
            ]);

            setUnresolvedConflicts(unresolved);
            setResolvedConflicts(resolved);
            setConflictCount(count);
        } catch (err) {
            console.error('Failed to refresh conflicts:', err);
            setError(err instanceof Error ? err.message : 'Failed to load conflicts');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resolveConflictById = useCallback(async (
        conflictId: string,
        resolution: ConflictResolution
    ) => {
        try {
            await resolveConflict(conflictId, resolution);
            await refreshConflicts();
        } catch (err) {
            console.error('Failed to resolve conflict:', err);
            setError(err instanceof Error ? err.message : 'Failed to resolve conflict');
            throw err;
        }
    }, [refreshConflicts]);

    const deleteConflictById = useCallback(async (conflictId: string) => {
        try {
            await deleteConflict(conflictId);
            await refreshConflicts();
        } catch (err) {
            console.error('Failed to delete conflict:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete conflict');
            throw err;
        }
    }, [refreshConflicts]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Load conflicts on mount
    useEffect(() => {
        refreshConflicts();
    }, [refreshConflicts]);

    return {
        unresolvedConflicts,
        resolvedConflicts,
        conflictCount,
        isLoading,
        error,
        refreshConflicts,
        resolveConflictById,
        deleteConflictById,
        clearError
    };
}

/**
 * Hook for tracking conflict count only (lightweight)
 */
export function useConflictCount() {
    const [conflictCount, setConflictCount] = useState({ unresolved: 0, resolved: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const refreshCount = useCallback(async () => {
        try {
            setIsLoading(true);
            const count = await getConflictCount();
            setConflictCount(count);
        } catch (err) {
            console.error('Failed to get conflict count:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshCount();

        // Set up periodic refresh every 30 seconds
        const interval = setInterval(refreshCount, 30000);

        return () => clearInterval(interval);
    }, [refreshCount]);

    return {
        conflictCount,
        isLoading,
        refreshCount
    };
}

/**
 * Hook for a specific conflict
 */
export function useConflict(conflictId: string | null) {
    const [conflict, setConflict] = useState<ConflictData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadConflict = useCallback(async (id: string) => {
        try {
            setIsLoading(true);
            setError(null);

            // Find conflict in unresolved conflicts
            const unresolvedConflicts = await getUnresolvedConflicts();
            const foundConflict = unresolvedConflicts.find(c => c.id === id);

            setConflict(foundConflict || null);
        } catch (err) {
            console.error('Failed to load conflict:', err);
            setError(err instanceof Error ? err.message : 'Failed to load conflict');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (conflictId) {
            loadConflict(conflictId);
        } else {
            setConflict(null);
            setError(null);
        }
    }, [conflictId, loadConflict]);

    return {
        conflict,
        isLoading,
        error,
        reload: () => conflictId && loadConflict(conflictId)
    };
}