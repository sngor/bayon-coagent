/**
 * Optimistic UI hook for Reimagine edits
 * 
 * Provides optimistic updates for better UX during edit operations.
 * Shows immediate feedback while the actual operation is processing.
 * 
 * Requirements: Performance considerations
 */

import { useState, useCallback, useTransition } from 'react';

export interface OptimisticEdit {
  editId: string;
  imageId: string;
  editType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  error?: string;
  createdAt: string;
}

export function useOptimisticEdit() {
  const [optimisticEdits, setOptimisticEdits] = useState<Map<string, OptimisticEdit>>(
    new Map()
  );
  const [isPending, startTransition] = useTransition();

  /**
   * Adds an optimistic edit that will be shown immediately
   * 
   * @param edit - Optimistic edit data
   */
  const addOptimisticEdit = useCallback((edit: OptimisticEdit) => {
    startTransition(() => {
      setOptimisticEdits((prev) => {
        const next = new Map(prev);
        next.set(edit.editId, edit);
        return next;
      });
    });
  }, []);

  /**
   * Updates an optimistic edit with new data
   * 
   * @param editId - Edit ID to update
   * @param updates - Partial edit data to merge
   */
  const updateOptimisticEdit = useCallback(
    (editId: string, updates: Partial<OptimisticEdit>) => {
      startTransition(() => {
        setOptimisticEdits((prev) => {
          const next = new Map(prev);
          const existing = next.get(editId);
          if (existing) {
            next.set(editId, { ...existing, ...updates });
          }
          return next;
        });
      });
    },
    []
  );

  /**
   * Removes an optimistic edit
   * 
   * @param editId - Edit ID to remove
   */
  const removeOptimisticEdit = useCallback((editId: string) => {
    startTransition(() => {
      setOptimisticEdits((prev) => {
        const next = new Map(prev);
        next.delete(editId);
        return next;
      });
    });
  }, []);

  /**
   * Clears all optimistic edits
   */
  const clearOptimisticEdits = useCallback(() => {
    startTransition(() => {
      setOptimisticEdits(new Map());
    });
  }, []);

  /**
   * Gets an optimistic edit by ID
   * 
   * @param editId - Edit ID
   * @returns Optimistic edit or undefined
   */
  const getOptimisticEdit = useCallback(
    (editId: string): OptimisticEdit | undefined => {
      return optimisticEdits.get(editId);
    },
    [optimisticEdits]
  );

  /**
   * Gets all optimistic edits as an array
   * 
   * @returns Array of optimistic edits
   */
  const getAllOptimisticEdits = useCallback((): OptimisticEdit[] => {
    return Array.from(optimisticEdits.values());
  }, [optimisticEdits]);

  return {
    optimisticEdits: getAllOptimisticEdits(),
    isPending,
    addOptimisticEdit,
    updateOptimisticEdit,
    removeOptimisticEdit,
    clearOptimisticEdits,
    getOptimisticEdit,
  };
}
