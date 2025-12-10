/**
 * Hub Layout with Workflow Integration
 * 
 * Wraps HubLayout to add workflow context detection and progress tracking.
 * Detects workflow query parameters, loads workflow instance, displays progress tracker,
 * and provides step completion callbacks.
 * 
 * Requirements: 2.1, 2.2, 4.3, 4.4, 4.5
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { HubLayout } from './hub-layout';
import { HubLayoutProps } from './types';
import { WorkflowProgressTracker } from '@/components/workflows/workflow-progress-tracker';
import { useWorkflow } from '@/contexts/workflow-context';
import { workflowPresetService } from '@/services/workflow-preset-service';
import { getWorkflowInstanceService } from '@/lib/workflow-instance-service';
import { WorkflowInstance, WorkflowPreset } from '@/types/workflows';
import { useUser } from '@/aws/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Props for HubLayoutWithWorkflow
 */
export interface HubLayoutWithWorkflowProps extends HubLayoutProps {
    /** Callback when workflow step is completed */
    onWorkflowStepComplete?: (stepId: string, data?: Record<string, any>) => void;
    /** Callback to get context data for pre-population */
    getWorkflowContext?: () => Record<string, any>;
}

/**
 * Hub Layout with Workflow Integration
 * 
 * Automatically detects workflow mode via query parameters and integrates
 * workflow progress tracking and context management.
 */
export function HubLayoutWithWorkflow({
    children,
    onWorkflowStepComplete,
    getWorkflowContext,
    ...hubLayoutProps
}: HubLayoutWithWorkflowProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useUser();
    const workflow = useWorkflow();

    // Workflow detection state
    const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false);
    const [workflowError, setWorkflowError] = useState<string | null>(null);
    const [preset, setPreset] = useState<WorkflowPreset | null>(null);

    // Extract workflow parameters from URL
    const workflowInstanceId = searchParams.get('workflowInstanceId');
    const workflowStepId = searchParams.get('workflowStepId');
    const isInWorkflowMode = Boolean(workflowInstanceId && workflowStepId);

    /**
     * Load workflow instance and preset
     */
    const loadWorkflowData = useCallback(async () => {
        if (!workflowInstanceId || !user?.id) {
            return;
        }

        setIsLoadingWorkflow(true);
        setWorkflowError(null);

        try {
            // Get workflow instance
            const service = getWorkflowInstanceService();
            const instance = await service.getInstance(user.id, workflowInstanceId);

            if (!instance) {
                setWorkflowError('Workflow not found');
                return;
            }

            // Get workflow preset
            const workflowPreset = workflowPresetService.getPresetById(instance.presetId);

            if (!workflowPreset) {
                setWorkflowError('Workflow configuration not found');
                return;
            }

            // Load into workflow context
            workflow.loadWorkflow(instance, workflowPreset);
            setPreset(workflowPreset);
        } catch (error) {
            console.error('Failed to load workflow:', error);
            setWorkflowError('Failed to load workflow. Please try again.');
        } finally {
            setIsLoadingWorkflow(false);
        }
    }, [workflowInstanceId, user?.id, workflow]);

    /**
     * Load workflow on mount or when parameters change
     */
    useEffect(() => {
        if (isInWorkflowMode && !workflow.isLoaded) {
            loadWorkflowData();
        }
    }, [isInWorkflowMode, workflow.isLoaded, loadWorkflowData]);

    /**
     * Handle step completion
     */
    const handleCompleteStep = useCallback(async () => {
        if (!workflow.instance || !workflowStepId) {
            return;
        }

        try {
            // Get context data from the page if callback provided
            const contextData = getWorkflowContext?.();

            // Complete the step
            await workflow.completeStep(contextData);

            // Notify parent component
            onWorkflowStepComplete?.(workflowStepId, contextData);

            // Navigate to next step if available
            if (workflow.nextStep) {
                const nextStepRoute = workflow.nextStep.hubRoute;
                const nextUrl = `${nextStepRoute}?workflowInstanceId=${workflow.instance.id}&workflowStepId=${workflow.nextStep.id}`;
                router.push(nextUrl);
            } else {
                // Workflow complete - navigate to completion page
                router.push(`/dashboard?workflowCompleted=${workflow.instance.id}`);
            }
        } catch (error) {
            console.error('Failed to complete workflow step:', error);
            setWorkflowError('Failed to complete step. Please try again.');
        }
    }, [
        workflow,
        workflowStepId,
        getWorkflowContext,
        onWorkflowStepComplete,
        router,
    ]);

    /**
     * Handle step skip
     */
    const handleSkipStep = useCallback(async () => {
        if (!workflow.instance || !workflowStepId) {
            return;
        }

        try {
            // Skip the step
            await workflow.skipStep();

            // Navigate to next step if available
            if (workflow.nextStep) {
                const nextStepRoute = workflow.nextStep.hubRoute;
                const nextUrl = `${nextStepRoute}?workflowInstanceId=${workflow.instance.id}&workflowStepId=${workflow.nextStep.id}`;
                router.push(nextUrl);
            } else {
                // Workflow complete - navigate to completion page
                router.push(`/dashboard?workflowCompleted=${workflow.instance.id}`);
            }
        } catch (error) {
            console.error('Failed to skip workflow step:', error);
            setWorkflowError('Failed to skip step. Please try again.');
        }
    }, [workflow, workflowStepId, router]);

    /**
     * Handle step navigation
     */
    const handleNavigateToStep = useCallback(
        async (stepId: string) => {
            if (!workflow.instance || !preset) {
                return;
            }

            try {
                // Navigate to the step
                await workflow.navigateToStep(stepId);

                // Find the step definition
                const step = preset.steps.find(s => s.id === stepId);
                if (!step) {
                    return;
                }

                // Navigate to the step's hub route
                const stepUrl = `${step.hubRoute}?workflowInstanceId=${workflow.instance.id}&workflowStepId=${stepId}`;
                router.push(stepUrl);
            } catch (error) {
                console.error('Failed to navigate to workflow step:', error);
                setWorkflowError('Cannot navigate to this step yet.');
            }
        },
        [workflow, preset, router]
    );

    /**
     * Render workflow progress tracker
     */
    const renderProgressTracker = () => {
        if (!isInWorkflowMode || !workflow.instance || !preset) {
            return null;
        }

        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6"
                >
                    <WorkflowProgressTracker
                        instance={workflow.instance}
                        preset={preset}
                        currentStepId={workflowStepId || workflow.instance.currentStepId}
                        onNavigateToStep={handleNavigateToStep}
                        onSkipStep={handleSkipStep}
                        onCompleteStep={handleCompleteStep}
                        showHelp={true}
                    />
                </motion.div>
            </AnimatePresence>
        );
    };

    /**
     * Render loading state
     */
    if (isInWorkflowMode && isLoadingWorkflow) {
        return (
            <HubLayout {...hubLayoutProps}>
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading workflow...</span>
                    </div>
                </div>
            </HubLayout>
        );
    }

    /**
     * Render error state
     */
    if (isInWorkflowMode && workflowError) {
        return (
            <HubLayout {...hubLayoutProps}>
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{workflowError}</AlertDescription>
                </Alert>
                {children}
            </HubLayout>
        );
    }

    /**
     * Render normal layout with optional workflow tracker
     */
    return (
        <HubLayout {...hubLayoutProps}>
            {renderProgressTracker()}
            {children}
        </HubLayout>
    );
}

