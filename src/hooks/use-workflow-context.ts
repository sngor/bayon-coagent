/**
 * Hook for accessing workflow context data in hub pages
 * 
 * Provides utilities for:
 * - Detecting if page is in workflow mode
 * - Accessing context data from previous steps
 * - Pre-populating forms with workflow context
 * - Completing workflow steps with context data
 * 
 * Requirements: 4.3, 4.4, 4.5
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { useWorkflowOptional } from '@/contexts/workflow-context';
import { useMemo, useCallback } from 'react';

/**
 * Workflow context hook return type
 */
export interface UseWorkflowContextReturn {
    /** Whether the page is in workflow mode */
    isInWorkflowMode: boolean;
    /** Current workflow instance ID */
    workflowInstanceId: string | null;
    /** Current workflow step ID */
    workflowStepId: string | null;
    /** All context data from previous steps */
    contextData: Record<string, any>;
    /** Get context value by key */
    getContext: <T = any>(key: string, defaultValue?: T) => T;
    /** Check if a context key exists */
    hasContext: (key: string) => boolean;
    /** Get context for a specific step */
    getStepContext: (stepId: string) => Record<string, any> | null;
    /** Whether workflow is loaded */
    isWorkflowLoaded: boolean;
    /** Current step definition */
    currentStep: any | null;
    /** Workflow preset */
    preset: any | null;
}

/**
 * Hook to access workflow context data in hub pages
 * 
 * This hook provides utilities for detecting workflow mode and accessing
 * context data from previous workflow steps for form pre-population.
 * 
 * @example
 * ```tsx
 * function MyHubPage() {
 *   const {
 *     isInWorkflowMode,
 *     getContext,
 *     hasContext,
 *   } = useWorkflowContext();
 * 
 *   // Pre-populate form with workflow context
 *   const initialData = useMemo(() => {
 *     if (isInWorkflowMode && hasContext('propertyDetails')) {
 *       return getContext('propertyDetails');
 *     }
 *     return {};
 *   }, [isInWorkflowMode, hasContext, getContext]);
 * 
 *   return <MyForm initialData={initialData} />;
 * }
 * ```
 */
export function useWorkflowContext(): UseWorkflowContextReturn {
    const searchParams = useSearchParams();
    const workflow = useWorkflowOptional();

    // Extract workflow parameters from URL
    const workflowInstanceId = searchParams.get('workflowInstanceId');
    const workflowStepId = searchParams.get('workflowStepId');
    const isInWorkflowMode = Boolean(workflowInstanceId && workflowStepId);

    // Get context data from workflow
    const contextData = useMemo(() => {
        if (!workflow?.instance) {
            return {};
        }
        return workflow.instance.contextData || {};
    }, [workflow?.instance]);

    /**
     * Get a context value by key with optional default
     */
    const getContext = useCallback(
        <T = any>(key: string, defaultValue?: T): T => {
            if (!workflow?.instance) {
                return defaultValue as T;
            }

            const value = workflow.instance.contextData?.[key];
            return value !== undefined ? value : (defaultValue as T);
        },
        [workflow?.instance]
    );

    /**
     * Check if a context key exists
     */
    const hasContext = useCallback(
        (key: string): boolean => {
            if (!workflow?.instance) {
                return false;
            }
            return key in (workflow.instance.contextData || {});
        },
        [workflow?.instance]
    );

    /**
     * Get context data for a specific step
     * 
     * This looks for context data that was output by a specific step.
     * Useful for accessing data from a particular previous step.
     */
    const getStepContext = useCallback(
        (stepId: string): Record<string, any> | null => {
            if (!workflow?.instance || !workflow?.preset) {
                return null;
            }

            // Find the step definition
            const step = workflow.preset.steps.find(s => s.id === stepId);
            if (!step || !step.contextOutputs) {
                return null;
            }

            // Extract context data for this step's outputs
            const stepContext: Record<string, any> = {};
            for (const outputKey of step.contextOutputs) {
                if (outputKey in workflow.instance.contextData) {
                    stepContext[outputKey] = workflow.instance.contextData[outputKey];
                }
            }

            return Object.keys(stepContext).length > 0 ? stepContext : null;
        },
        [workflow?.instance, workflow?.preset]
    );

    return {
        isInWorkflowMode,
        workflowInstanceId,
        workflowStepId,
        contextData,
        getContext,
        hasContext,
        getStepContext,
        isWorkflowLoaded: workflow?.isLoaded || false,
        currentStep: workflow?.currentStep || null,
        preset: workflow?.preset || null,
    };
}

/**
 * Hook to get context inputs for the current workflow step
 * 
 * Returns an object with all context data that the current step expects as input.
 * This is useful for pre-populating forms with data from previous steps.
 * 
 * @example
 * ```tsx
 * function MyHubPage() {
 *   const contextInputs = useWorkflowStepInputs();
 * 
 *   // contextInputs will contain all data from previous steps
 *   // that this step expects as input
 *   return <MyForm initialData={contextInputs} />;
 * }
 * ```
 */
export function useWorkflowStepInputs(): Record<string, any> {
    const workflow = useWorkflowOptional();

    return useMemo(() => {
        if (!workflow?.instance || !workflow?.currentStep) {
            return {};
        }

        const currentStep = workflow.currentStep;
        if (!currentStep.contextInputs || currentStep.contextInputs.length === 0) {
            return {};
        }

        // Extract context data for this step's inputs
        const inputs: Record<string, any> = {};
        for (const inputKey of currentStep.contextInputs) {
            if (inputKey in workflow.instance.contextData) {
                inputs[inputKey] = workflow.instance.contextData[inputKey];
            }
        }

        return inputs;
    }, [workflow?.instance, workflow?.currentStep]);
}

/**
 * Hook to check if the current page matches a workflow step route
 * 
 * This is useful for conditionally rendering workflow-specific UI elements
 * only when the page is the active step in a workflow.
 * 
 * @param hubRoute - The hub route to check (e.g., '/brand/profile')
 * @returns Whether the current page is the active workflow step
 */
export function useIsWorkflowStep(hubRoute: string): boolean {
    const workflow = useWorkflowOptional();
    const searchParams = useSearchParams();

    const workflowStepId = searchParams.get('workflowStepId');

    return useMemo(() => {
        if (!workflow?.instance || !workflow?.currentStep || !workflowStepId) {
            return false;
        }

        // Check if current step matches the provided hub route
        return (
            workflow.currentStep.id === workflowStepId &&
            workflow.currentStep.hubRoute === hubRoute
        );
    }, [workflow?.instance, workflow?.currentStep, workflowStepId, hubRoute]);
}

