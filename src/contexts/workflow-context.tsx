/**
 * Workflow Context Provider
 * 
 * Provides React Context for workflow state management with:
 * - Current workflow instance and step
 * - Actions for step completion, skipping, and navigation
 * - Auto-save with debouncing (30 seconds)
 * - Local storage backup for offline resilience
 * 
 * Requirements: 2.2, 2.3, 7.1, 12.1, 12.2
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import {
    WorkflowInstance,
    WorkflowPreset,
    WorkflowStepDefinition,
    WorkflowState,
} from '@/types/workflows';
import {
    getCurrentStep,
    getNextStep,
    markStepComplete,
    markStepSkipped,
    transitionToStep,
    calculateProgress,
    calculateRemainingTime,
} from '@/lib/workflow-state-manager';
import { getWorkflowInstanceService } from '@/lib/workflow-instance-service';

// ============================================================================
// Types
// ============================================================================

/**
 * Workflow context state
 */
interface WorkflowContextState {
    /** Current workflow instance */
    instance: WorkflowInstance | null;
    /** Workflow preset definition */
    preset: WorkflowPreset | null;
    /** Current step definition */
    currentStep: WorkflowStepDefinition | null;
    /** Next step definition */
    nextStep: WorkflowStepDefinition | null;
    /** Progress percentage (0-100) */
    progress: number;
    /** Estimated time remaining in minutes */
    remainingTime: number;
    /** Whether auto-save is in progress */
    isSaving: boolean;
    /** Last save error if any */
    saveError: Error | null;
    /** Whether the workflow is loaded */
    isLoaded: boolean;
}

/**
 * Workflow context actions
 */
interface WorkflowContextActions {
    /** Complete the current step and advance */
    completeStep: (data?: Record<string, any>) => Promise<void>;
    /** Skip the current step (if optional) */
    skipStep: () => Promise<void>;
    /** Navigate to a specific step */
    navigateToStep: (stepId: string) => Promise<void>;
    /** Manually trigger save */
    save: () => Promise<void>;
    /** Load a workflow instance */
    loadWorkflow: (instance: WorkflowInstance, preset: WorkflowPreset) => void;
    /** Clear the current workflow */
    clearWorkflow: () => void;
}

/**
 * Combined workflow context value
 */
type WorkflowContextValue = WorkflowContextState & WorkflowContextActions;

// ============================================================================
// Reducer
// ============================================================================

/**
 * Workflow reducer action types
 */
type WorkflowAction =
    | { type: 'LOAD_WORKFLOW'; payload: { instance: WorkflowInstance; preset: WorkflowPreset } }
    | { type: 'UPDATE_INSTANCE'; payload: Partial<WorkflowInstance> }
    | { type: 'SET_SAVING'; payload: boolean }
    | { type: 'SET_SAVE_ERROR'; payload: Error | null }
    | { type: 'CLEAR_WORKFLOW' };

/**
 * Initial state
 */
const initialState: WorkflowContextState = {
    instance: null,
    preset: null,
    currentStep: null,
    nextStep: null,
    progress: 0,
    remainingTime: 0,
    isSaving: false,
    saveError: null,
    isLoaded: false,
};

/**
 * Workflow reducer
 */
function workflowReducer(
    state: WorkflowContextState,
    action: WorkflowAction
): WorkflowContextState {
    switch (action.type) {
        case 'LOAD_WORKFLOW': {
            const { instance, preset } = action.payload;
            const currentStep = getCurrentStep(instance, preset);
            const nextStep = getNextStep(instance, preset);
            const progress = calculateProgress(instance, preset);
            const remainingTime = calculateRemainingTime(instance, preset);

            return {
                ...state,
                instance,
                preset,
                currentStep,
                nextStep,
                progress,
                remainingTime,
                isLoaded: true,
                saveError: null,
            };
        }

        case 'UPDATE_INSTANCE': {
            if (!state.instance || !state.preset) {
                return state;
            }

            const updatedInstance = {
                ...state.instance,
                ...action.payload,
            };

            const currentStep = getCurrentStep(updatedInstance, state.preset);
            const nextStep = getNextStep(updatedInstance, state.preset);
            const progress = calculateProgress(updatedInstance, state.preset);
            const remainingTime = calculateRemainingTime(updatedInstance, state.preset);

            return {
                ...state,
                instance: updatedInstance,
                currentStep,
                nextStep,
                progress,
                remainingTime,
            };
        }

        case 'SET_SAVING': {
            return {
                ...state,
                isSaving: action.payload,
            };
        }

        case 'SET_SAVE_ERROR': {
            return {
                ...state,
                saveError: action.payload,
                isSaving: false,
            };
        }

        case 'CLEAR_WORKFLOW': {
            return initialState;
        }

        default:
            return state;
    }
}

// ============================================================================
// Context
// ============================================================================

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

/**
 * Props for WorkflowProvider
 */
interface WorkflowProviderProps {
    children: React.ReactNode;
    /** Auto-save debounce delay in milliseconds (default: 30000 = 30 seconds) */
    autoSaveDelay?: number;
    /** Whether to enable local storage backup (default: true) */
    enableLocalStorage?: boolean;
}

/**
 * Local storage key for workflow backup
 */
const LOCAL_STORAGE_KEY = 'workflow-backup';

/**
 * Workflow Context Provider
 */
export function WorkflowProvider({
    children,
    autoSaveDelay = 30000,
    enableLocalStorage = true,
}: WorkflowProviderProps) {
    const [state, dispatch] = useReducer(workflowReducer, initialState);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pendingSaveRef = useRef<boolean>(false);
    const serviceRef = useRef(getWorkflowInstanceService());

    // ========================================================================
    // Local Storage Backup
    // ========================================================================

    /**
     * Save workflow state to local storage
     */
    const saveToLocalStorage = useCallback(() => {
        if (!enableLocalStorage || !state.instance) {
            return;
        }

        try {
            const backup = {
                instance: state.instance,
                timestamp: new Date().toISOString(),
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(backup));
        } catch (error) {
            console.error('Failed to save workflow to local storage:', error);
        }
    }, [enableLocalStorage, state.instance]);

    /**
     * Load workflow state from local storage
     */
    const loadFromLocalStorage = useCallback((): WorkflowInstance | null => {
        if (!enableLocalStorage) {
            return null;
        }

        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!stored) {
                return null;
            }

            const backup = JSON.parse(stored);
            return backup.instance;
        } catch (error) {
            console.error('Failed to load workflow from local storage:', error);
            return null;
        }
    }, [enableLocalStorage]);

    /**
     * Clear workflow backup from local storage
     */
    const clearLocalStorage = useCallback(() => {
        if (!enableLocalStorage) {
            return;
        }

        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear workflow from local storage:', error);
        }
    }, [enableLocalStorage]);

    // ========================================================================
    // Auto-Save
    // ========================================================================

    /**
     * Save workflow instance to database
     */
    const saveToDatabase = useCallback(async () => {
        if (!state.instance) {
            return;
        }

        dispatch({ type: 'SET_SAVING', payload: true });
        pendingSaveRef.current = false;

        try {
            await serviceRef.current.updateInstanceState(
                state.instance.userId,
                state.instance.id,
                {
                    currentStepId: state.instance.currentStepId,
                    completedSteps: state.instance.completedSteps,
                    skippedSteps: state.instance.skippedSteps,
                    contextData: state.instance.contextData,
                    status: state.instance.status,
                }
            );

            dispatch({ type: 'SET_SAVE_ERROR', payload: null });
        } catch (error) {
            console.error('Failed to save workflow:', error);
            dispatch({ type: 'SET_SAVE_ERROR', payload: error as Error });
        } finally {
            dispatch({ type: 'SET_SAVING', payload: false });
        }
    }, [state.instance]);

    /**
     * Schedule auto-save with debouncing
     */
    const scheduleAutoSave = useCallback(() => {
        // Clear existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        // Mark that we have a pending save
        pendingSaveRef.current = true;

        // Schedule new save
        autoSaveTimerRef.current = setTimeout(() => {
            saveToDatabase();
        }, autoSaveDelay);
    }, [autoSaveDelay, saveToDatabase]);

    /**
     * Manual save (bypasses debouncing)
     */
    const save = useCallback(async () => {
        // Clear any pending auto-save
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }

        await saveToDatabase();
    }, [saveToDatabase]);

    // ========================================================================
    // Workflow Actions
    // ========================================================================

    /**
     * Load a workflow instance
     */
    const loadWorkflow = useCallback(
        (instance: WorkflowInstance, preset: WorkflowPreset) => {
            dispatch({
                type: 'LOAD_WORKFLOW',
                payload: { instance, preset },
            });

            // Save to local storage immediately
            saveToLocalStorage();
        },
        [saveToLocalStorage]
    );

    /**
     * Complete the current step
     */
    const completeStep = useCallback(
        async (data?: Record<string, any>) => {
            if (!state.instance || !state.preset) {
                throw new Error('No workflow loaded');
            }

            // Calculate new state using state manager
            const newState = markStepComplete(
                state.instance,
                state.instance.currentStepId,
                state.preset,
                data
            );

            // Update local state
            dispatch({
                type: 'UPDATE_INSTANCE',
                payload: newState,
            });

            // Save to local storage immediately
            saveToLocalStorage();

            // Schedule auto-save to database
            scheduleAutoSave();
        },
        [state.instance, state.preset, saveToLocalStorage, scheduleAutoSave]
    );

    /**
     * Skip the current step
     */
    const skipStep = useCallback(async () => {
        if (!state.instance || !state.preset) {
            throw new Error('No workflow loaded');
        }

        // Calculate new state using state manager (validates step is optional)
        const newState = markStepSkipped(
            state.instance,
            state.instance.currentStepId,
            state.preset
        );

        // Update local state
        dispatch({
            type: 'UPDATE_INSTANCE',
            payload: newState,
        });

        // Save to local storage immediately
        saveToLocalStorage();

        // Schedule auto-save to database
        scheduleAutoSave();
    }, [state.instance, state.preset, saveToLocalStorage, scheduleAutoSave]);

    /**
     * Navigate to a specific step
     */
    const navigateToStep = useCallback(
        async (stepId: string) => {
            if (!state.instance || !state.preset) {
                throw new Error('No workflow loaded');
            }

            // Calculate new state using state manager (validates navigation is allowed)
            const newState = transitionToStep(state.instance, stepId, state.preset);

            // Update local state
            dispatch({
                type: 'UPDATE_INSTANCE',
                payload: newState,
            });

            // Save to local storage immediately
            saveToLocalStorage();

            // Schedule auto-save to database
            scheduleAutoSave();
        },
        [state.instance, state.preset, saveToLocalStorage, scheduleAutoSave]
    );

    /**
     * Clear the current workflow
     */
    const clearWorkflow = useCallback(() => {
        // Clear any pending auto-save
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }

        // Clear local storage
        clearLocalStorage();

        // Clear state
        dispatch({ type: 'CLEAR_WORKFLOW' });
    }, [clearLocalStorage]);

    // ========================================================================
    // Effects
    // ========================================================================

    /**
     * Save to local storage whenever instance changes
     */
    useEffect(() => {
        if (state.instance) {
            saveToLocalStorage();
        }
    }, [state.instance, saveToLocalStorage]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            // Save any pending changes before unmounting
            if (pendingSaveRef.current && state.instance) {
                // Use synchronous save if possible, or queue it
                saveToDatabase();
            }

            // Clear timer
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [state.instance, saveToDatabase]);

    /**
     * Handle page visibility changes (save when page becomes hidden)
     */
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && pendingSaveRef.current) {
                // Save immediately when page becomes hidden
                saveToDatabase();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [saveToDatabase]);

    /**
     * Handle beforeunload (save before page unload)
     */
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (pendingSaveRef.current) {
                // Save to local storage (synchronous)
                saveToLocalStorage();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [saveToLocalStorage]);

    // ========================================================================
    // Context Value
    // ========================================================================

    const contextValue: WorkflowContextValue = {
        // State
        ...state,

        // Actions
        completeStep,
        skipStep,
        navigateToStep,
        save,
        loadWorkflow,
        clearWorkflow,
    };

    return (
        <WorkflowContext.Provider value={contextValue}>
            {children}
        </WorkflowContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access workflow context
 * 
 * @throws Error if used outside WorkflowProvider
 */
export function useWorkflow(): WorkflowContextValue {
    const context = useContext(WorkflowContext);

    if (!context) {
        throw new Error('useWorkflow must be used within a WorkflowProvider');
    }

    return context;
}

/**
 * Hook to check if workflow context is available
 */
export function useWorkflowOptional(): WorkflowContextValue | null {
    return useContext(WorkflowContext);
}
