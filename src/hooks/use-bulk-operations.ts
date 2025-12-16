import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface BulkOperation<T> {
    type: 'delete' | 'update' | 'export';
    items: T[];
    data?: Partial<T>;
}

interface UseBulkOperationsOptions<T> {
    onSuccess?: (operation: BulkOperation<T>) => void;
    onError?: (error: Error, operation: BulkOperation<T>) => void;
}

export function useBulkOperations<T extends { id: string }>(
    options: UseBulkOperationsOptions<T> = {}
) {
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const selectItem = useCallback((id: string) => {
        setSelectedItems(prev => new Set([...prev, id]));
    }, []);

    const deselectItem = useCallback((id: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    }, []);

    const toggleItem = useCallback((id: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const selectAll = useCallback((items: T[]) => {
        setSelectedItems(new Set(items.map(item => item.id)));
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedItems(new Set());
    }, []);

    const executeBulkOperation = useCallback(async (
        operation: BulkOperation<T>,
        executor: (operation: BulkOperation<T>) => Promise<void>
    ) => {
        if (operation.items.length === 0) {
            toast({
                title: "No items selected",
                description: "Please select items to perform bulk operation",
                variant: "destructive"
            });
            return false;
        }

        const confirmMessage = `Are you sure you want to ${operation.type} ${operation.items.length} item(s)?`;
        if (!confirm(confirmMessage)) {
            return false;
        }

        setIsProcessing(true);
        try {
            await executor(operation);

            toast({
                title: "Bulk operation completed",
                description: `Successfully ${operation.type}d ${operation.items.length} item(s)`
            });

            clearSelection();
            options.onSuccess?.(operation);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Bulk operation failed';
            toast({
                title: "Bulk operation failed",
                description: errorMessage,
                variant: "destructive"
            });

            options.onError?.(error as Error, operation);
            return false;
        } finally {
            setIsProcessing(false);
        }
    }, [toast, clearSelection, options]);

    const bulkDelete = useCallback(async (
        items: T[],
        deleteFn: (items: T[]) => Promise<void>
    ) => {
        return executeBulkOperation(
            { type: 'delete', items },
            async (operation) => await deleteFn(operation.items)
        );
    }, [executeBulkOperation]);

    const bulkUpdate = useCallback(async (
        items: T[],
        updateData: Partial<T>,
        updateFn: (items: T[], data: Partial<T>) => Promise<void>
    ) => {
        return executeBulkOperation(
            { type: 'update', items, data: updateData },
            async (operation) => await updateFn(operation.items, operation.data!)
        );
    }, [executeBulkOperation]);

    const bulkExport = useCallback(async (
        items: T[],
        exportFn: (items: T[]) => Promise<void>
    ) => {
        return executeBulkOperation(
            { type: 'export', items },
            async (operation) => await exportFn(operation.items)
        );
    }, [executeBulkOperation]);

    return {
        selectedItems,
        selectedCount: selectedItems.size,
        isProcessing,
        selectItem,
        deselectItem,
        toggleItem,
        selectAll,
        clearSelection,
        bulkDelete,
        bulkUpdate,
        bulkExport,
        hasSelection: selectedItems.size > 0
    };
}