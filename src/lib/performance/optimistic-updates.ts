/**
 * Optimistic UI Updates
 * 
 * Provides utilities for optimistic UI updates to improve perceived performance.
 * Updates the UI immediately while the actual operation is in progress.
 * 
 * Requirements: 7.1
 */

import { useState, useCallback } from 'react';

export interface OptimisticState<T> {
    data: T;
    isOptimistic: boolean;
    error: Error | null;
}

/**
 * Hook for managing optimistic updates
 * 
 * @param initialData Initial data state
 * @returns State and update functions
 */
export function useOptimisticUpdate<T>(initialData: T) {
    const [state, setState] = useState<OptimisticState<T>>({
        data: initialData,
        isOptimistic: false,
        error: null,
    });

    /**
     * Perform an optimistic update
     * Updates the UI immediately, then performs the actual operation
     * Rolls back on error
     */
    const optimisticUpdate = useCallback(
        async (
            optimisticData: T,
            actualUpdate: () => Promise<T>
        ): Promise<T> => {
            // Store previous state for rollback
            const previousData = state.data;

            // Apply optimistic update immediately
            setState({
                data: optimisticData,
                isOptimistic: true,
                error: null,
            });

            try {
                // Perform actual update
                const result = await actualUpdate();

                // Update with actual result
                setState({
                    data: result,
                    isOptimistic: false,
                    error: null,
                });

                return result;
            } catch (error) {
                // Rollback on error
                setState({
                    data: previousData,
                    isOptimistic: false,
                    error: error as Error,
                });

                throw error;
            }
        },
        [state.data]
    );

    /**
     * Update data without optimistic behavior
     */
    const setData = useCallback((data: T) => {
        setState({
            data,
            isOptimistic: false,
            error: null,
        });
    }, []);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setState((prev) => ({
            ...prev,
            error: null,
        }));
    }, []);

    return {
        data: state.data,
        isOptimistic: state.isOptimistic,
        error: state.error,
        optimisticUpdate,
        setData,
        clearError,
    };
}

/**
 * Optimistic list operations
 * Provides common list operations with optimistic updates
 */
export function useOptimisticList<T extends { id: string }>(initialList: T[]) {
    const { data, isOptimistic, error, optimisticUpdate, setData, clearError } =
        useOptimisticUpdate<T[]>(initialList);

    /**
     * Add item optimistically
     */
    const addItem = useCallback(
        async (item: T, actualAdd: () => Promise<T>): Promise<T> => {
            const optimisticList = [...data, item];
            return optimisticUpdate(optimisticList, async () => {
                const result = await actualAdd();
                return [...data, result];
            });
        },
        [data, optimisticUpdate]
    );

    /**
     * Update item optimistically
     */
    const updateItem = useCallback(
        async (
            id: string,
            updates: Partial<T>,
            actualUpdate: () => Promise<T>
        ): Promise<T> => {
            const optimisticList = data.map((item) =>
                item.id === id ? { ...item, ...updates } : item
            );
            return optimisticUpdate(optimisticList, async () => {
                const result = await actualUpdate();
                return data.map((item) => (item.id === id ? result : item));
            });
        },
        [data, optimisticUpdate]
    );

    /**
     * Remove item optimistically
     */
    const removeItem = useCallback(
        async (id: string, actualRemove: () => Promise<void>): Promise<void> => {
            const optimisticList = data.filter((item) => item.id !== id);
            await optimisticUpdate(optimisticList, async () => {
                await actualRemove();
                return data.filter((item) => item.id !== id);
            });
        },
        [data, optimisticUpdate]
    );

    return {
        items: data,
        isOptimistic,
        error,
        addItem,
        updateItem,
        removeItem,
        setItems: setData,
        clearError,
    };
}

/**
 * Optimistic state machine for step-based flows
 * Useful for onboarding flows with multiple steps
 */
export function useOptimisticSteps(totalSteps: number, initialStep: number = 0) {
    const { data, isOptimistic, error, optimisticUpdate, setData, clearError } =
        useOptimisticUpdate<number>(initialStep);

    /**
     * Move to next step optimistically
     */
    const nextStep = useCallback(
        async (actualNext: () => Promise<number>): Promise<number> => {
            const nextStepNumber = Math.min(data + 1, totalSteps);
            return optimisticUpdate(nextStepNumber, actualNext);
        },
        [data, totalSteps, optimisticUpdate]
    );

    /**
     * Move to previous step optimistically
     */
    const previousStep = useCallback(
        async (actualPrevious: () => Promise<number>): Promise<number> => {
            const prevStepNumber = Math.max(data - 1, 0);
            return optimisticUpdate(prevStepNumber, actualPrevious);
        },
        [data, optimisticUpdate]
    );

    /**
     * Jump to specific step optimistically
     */
    const goToStep = useCallback(
        async (step: number, actualGo: () => Promise<number>): Promise<number> => {
            const targetStep = Math.max(0, Math.min(step, totalSteps));
            return optimisticUpdate(targetStep, actualGo);
        },
        [totalSteps, optimisticUpdate]
    );

    return {
        currentStep: data,
        isOptimistic,
        error,
        nextStep,
        previousStep,
        goToStep,
        setStep: setData,
        clearError,
    };
}
