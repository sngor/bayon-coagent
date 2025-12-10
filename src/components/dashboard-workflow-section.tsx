'use client';

/**
 * Dashboard Workflow Section Component
 * 
 * Client component wrapper for the workflow widget on the dashboard.
 * Handles workflow actions and navigation.
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardWorkflowWidget } from '@/components/workflows/dashboard-workflow-widget';
import { WorkflowInstance } from '@/types/workflows';
import { toast } from '@/hooks/use-toast';
import {
    startWorkflow,
    resumeWorkflow,
    archiveWorkflow,
    restartWorkflow,
    detectStaleWorkflows,
} from '@/app/workflow-actions';
import { getStepUrl } from '@/lib/workflow-navigation-controller';
import { workflowPresetService } from '@/services/workflow-preset-service';

interface DashboardWorkflowSectionProps {
    userId: string;
    initialInstances: WorkflowInstance[];
}

export function DashboardWorkflowSection({
    userId,
    initialInstances,
}: DashboardWorkflowSectionProps) {
    const router = useRouter();
    const [instances, setInstances] = useState<WorkflowInstance[]>(initialInstances);
    const [isLoading, setIsLoading] = useState(false);

    // Detect and mark stale workflows on component mount
    // Requirements: 7.4, 7.5
    useEffect(() => {
        const checkStaleWorkflows = async () => {
            try {
                const result = await detectStaleWorkflows();

                if (result.message === 'success' && result.data) {
                    const { staleCount } = result.data;

                    // If workflows were marked as stale, refresh the instances
                    if (staleCount > 0) {
                        // The instances will be refreshed on next page load
                        // or we could fetch them again here
                        console.log(`Marked ${staleCount} workflows as stale`);
                    }
                }
            } catch (error) {
                // Silently fail - stale detection is not critical
                console.error('Failed to detect stale workflows:', error);
            }
        };

        checkStaleWorkflows();
    }, []);

    // Handle starting a new workflow
    const handleStartWorkflow = useCallback(async (presetId: string) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('presetId', presetId);

            const result = await startWorkflow(null, formData);

            if (result.message === 'success' && result.data) {
                toast({
                    title: 'Workflow Started',
                    description: 'Your workflow has been created successfully.',
                });

                // Navigate to first step
                const preset = workflowPresetService.getPresetById(presetId);
                if (preset && preset.steps.length > 0) {
                    const firstStep = preset.steps[0];
                    const url = getStepUrl(presetId, firstStep.id, preset, {
                        workflowInstanceId: result.data.id,
                    });
                    router.push(url);
                }
            } else {
                toast({
                    title: 'Failed to Start Workflow',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error starting workflow:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    // Handle resuming a workflow
    const handleResumeWorkflow = useCallback(async (instanceId: string) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('instanceId', instanceId);

            const result = await resumeWorkflow(null, formData);

            if (result.message === 'success' && result.data) {
                const instance = result.data;
                const preset = workflowPresetService.getPresetById(instance.presetId);

                if (preset) {
                    // Navigate to current step
                    const url = getStepUrl(instance.presetId, instance.currentStepId, preset, {
                        workflowInstanceId: instance.id,
                    });
                    router.push(url);
                }
            } else {
                toast({
                    title: 'Failed to Resume Workflow',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error resuming workflow:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    // Handle viewing workflow details
    const handleViewDetails = useCallback((presetId: string) => {
        // For now, just show a toast. In the future, this could open a modal.
        const preset = workflowPresetService.getPresetById(presetId);
        if (preset) {
            toast({
                title: preset.title,
                description: preset.description,
            });
        }
    }, []);

    // Handle restarting a workflow
    const handleRestartWorkflow = useCallback(async (instanceId: string) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('instanceId', instanceId);

            const result = await restartWorkflow(null, formData);

            if (result.message === 'success' && result.data) {
                toast({
                    title: 'Workflow Restarted',
                    description: 'A new workflow instance has been created.',
                });

                // Navigate to first step of new instance
                const instance = result.data;
                const preset = workflowPresetService.getPresetById(instance.presetId);

                if (preset && preset.steps.length > 0) {
                    const firstStep = preset.steps[0];
                    const url = getStepUrl(instance.presetId, firstStep.id, preset, {
                        workflowInstanceId: instance.id,
                    });
                    router.push(url);
                }

                // Refresh instances
                if (result.data) {
                    setInstances(prev => [...prev, result.data!]);
                }
            } else {
                toast({
                    title: 'Failed to Restart Workflow',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error restarting workflow:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    // Handle archiving a workflow
    const handleArchiveWorkflow = useCallback(async (instanceId: string) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('instanceId', instanceId);

            const result = await archiveWorkflow(null, formData);

            if (result.message === 'success') {
                toast({
                    title: 'Workflow Archived',
                    description: 'The workflow has been archived.',
                });

                // Remove from instances
                setInstances(prev => prev.filter(i => i.id !== instanceId));
            } else {
                toast({
                    title: 'Failed to Archive Workflow',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error archiving workflow:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <DashboardWorkflowWidget
            userId={userId}
            activeInstances={instances}
            onStartWorkflow={handleStartWorkflow}
            onResumeWorkflow={handleResumeWorkflow}
            onViewDetails={handleViewDetails}
            onRestartWorkflow={handleRestartWorkflow}
            onArchiveWorkflow={handleArchiveWorkflow}
        />
    );
}
