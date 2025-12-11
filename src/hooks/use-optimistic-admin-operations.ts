import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OptimisticOperation<T> {
    type: 'create' | 'update' | 'delete';
    item: T;
    originalItems: T[];
}

export function useOptimisticAdminOperations<T extends { id: string }>(
    items: T[],
    setItems: React.Dispatch<React.SetStateAction<T[]>>
) {
    const [pendingOperations, setPendingOperations] = useState<OptimisticOperation<T>[]>([]);
    const { toast } = useToast();

    const executeOptimistic = useCallback(async <R>(
        operation: () => Promise<R>,
        optimisticUpdate: () => void,
        rollback: () => void,
        successMessage?: string
    ): Promise<R | null> => {
        try {
            // Apply optimistic update
            optimisticUpdate();

            // Execute actual operation
            const result = await operation();

            if (successMessage) {
                toast({ title: "Success", description: successMessage });
            }

            return result;
        } catch (error) {
            // Rollback on error
            rollback();

            const errorMessage = error instanceof Error ? error.message : 'Operation failed';
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });

            return null;
        }
    }, [toast]);

    const optimisticCreate = useCallback(async (
        newItem: T,
        createFn: () => Promise<T>
    ) => {
        const originalItems = items;

        return executeOptimistic(
            createFn,
            () => setItems(prev => [...prev, newItem]),
            () => setItems(originalItems),
            `${newItem.constructor.name || 'Item'} created successfully`
        );
    }, [items, setItems, executeOptimistic]);

    const optimisticUpdate = useCallback(async (
        updatedItem: T,
        updateFn: () => Promise<T>
    ) => {
        const originalItems = items;

        return executeOptimistic(
            updateFn,
            () => setItems(prev => prev.map(item =>
                item.id === updatedItem.id ? updatedItem : item
            )),
            () => setItems(originalItems),
            `Item updated successfully`
        );
    }, [items, setItems, executeOptimistic]);

    const optimisticDelete = useCallback(async (
        itemToDelete: T,
        deleteFn: () => Promise<void>
    ) => {
        const originalItems = items;

        return executeOptimistic(
            deleteFn,
            () => setItems(prev => prev.filter(item => item.id !== itemToDelete.id)),
            () => setItems(originalItems),
            `Item deleted successfully`
        );
    }, [items, setItems, executeOptimistic]);

    return {
        optimisticCreate,
        optimisticUpdate,
        optimisticDelete,
        hasPendingOperations: pendingOperations.length > 0
    };
}