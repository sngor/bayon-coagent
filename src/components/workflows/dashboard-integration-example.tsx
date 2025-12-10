/**
 * Dashboard Integration Example
 * 
 * This file demonstrates how to integrate the DashboardWorkflowWidget
 * into the dashboard page.
 * 
 * DO NOT USE THIS FILE DIRECTLY - it's just an example.
 * Copy the relevant parts into your dashboard page.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardWorkflowWidget } from './dashboard-workflow-widget';
import { WorkflowInstance } from '@/types/workflows';
import { useUser } from '@/aws/auth';
import { toast } from '@/hooks/use-toast';
import {
    startWorkflow,
    resumeWorkflow,
    restartWorkflow,
    archiveWorkflow,
} from '@/app/workflow-actions';

/**
 * Example integration of DashboardWorkflowWidget
 */
export function DashboardWorkflowsSection() {
    const { user } = useUser();
    const router = useRouter();
    const [activeInstances, setActiveInstances] = useState<WorkflowInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPresetForDetails, setSelectedPresetForDetails] = useState<string | null>(null);

    // Fetch active workflow instances
    useEffect(() => {
        if (!user) return;

        const fetchInstances = async () => {
            try {
                setIsLoading(true);
                // TODO: Implement server action to fetch user's workflow instances
                // const response = await getUserWorkflowInstances(user.id);
                // setActiveInstances(response.data || []);

                // For now, set empty array
                setActiveInstances([]);
            } catch (error) {
                console.error('Failed to fetch workflow instances:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load workflows',
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchInstances();
    }, [user]);

    // Handle starting a new workflow
    const handleStartWorkflow = async (presetId: string) => {
        if (!user) return;

        try {
            const formData = new FormData();
            formData.append('presetId', presetId);

            const result = await startWorkflow(null, formData);

            if (result.data) {
                toast({
                    title: 'Workflow Started',
                    description: result.message || 'Your workflow has been created successfully',
                });

                // Navigate to the first step
                const instance = result.data;
                // TODO: Get the first step's route from the preset
                // router.push(`${firstStepRoute}?workflowId=${instance.id}&stepId=${instance.currentStepId}`);

                // For now, just refresh the instances
                setActiveInstances(prev => [...prev, instance]);
            } else {
                toast({
                    title: 'Error',
                    description: result.message || 'Failed to start workflow',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to start workflow:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        }
    };

    // Handle resuming a workflow
    const handleResumeWorkflow = async (instanceId: string) => {
        if (!user) return;

        try {
            const formData = new FormData();
            formData.append('instanceId', instanceId);

            const result = await resumeWorkflow(null, formData);

            if (result.data) {
                const instance = result.data;

                // TODO: Get the current step's route from the preset
                // router.push(`${currentStepRoute}?workflowId=${instance.id}&stepId=${instance.currentStepId}`);

                toast({
                    title: 'Workflow Resumed',
                    description: result.message || 'Continuing where you left off',
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.message || 'Failed to resume workflow',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to resume workflow:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        }
    };

    // Handle viewing workflow details
    const handleViewDetails = (presetId: string) => {
        // TODO: Open workflow detail modal
        setSelectedPresetForDetails(presetId);
        console.log('View details for preset:', presetId);
    };

    // Handle restarting a completed workflow
    const handleRestartWorkflow = async (instanceId: string) => {
        if (!user) return;

        try {
            const formData = new FormData();
            formData.append('instanceId', instanceId);

            const result = await restartWorkflow(null, formData);

            if (result.data) {
                toast({
                    title: 'Workflow Restarted',
                    description: result.message || 'A new workflow instance has been created',
                });

                // Navigate to the first step
                const instance = result.data;
                // TODO: Get the first step's route from the preset
                // router.push(`${firstStepRoute}?workflowId=${instance.id}&stepId=${instance.currentStepId}`);

                // Update instances
                setActiveInstances(prev => [...prev, instance]);
            } else {
                toast({
                    title: 'Error',
                    description: result.message || 'Failed to restart workflow',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to restart workflow:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        }
    };

    // Handle archiving a stale workflow
    const handleArchiveWorkflow = async (instanceId: string) => {
        if (!user) return;

        try {
            const formData = new FormData();
            formData.append('instanceId', instanceId);

            const result = await archiveWorkflow(null, formData);

            // Check if there are no errors (successful operation)
            if (Object.keys(result.errors).length === 0) {
                toast({
                    title: 'Workflow Archived',
                    description: result.message || 'The workflow has been archived',
                });

                // Remove from active instances
                setActiveInstances(prev => prev.filter(i => i.id !== instanceId));
            } else {
                toast({
                    title: 'Error',
                    description: result.message || 'Failed to archive workflow',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to archive workflow:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        }
    };

    if (!user) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-muted rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <DashboardWorkflowWidget
                userId={user.id}
                activeInstances={activeInstances}
                onStartWorkflow={handleStartWorkflow}
                onResumeWorkflow={handleResumeWorkflow}
                onViewDetails={handleViewDetails}
                onRestartWorkflow={handleRestartWorkflow}
                onArchiveWorkflow={handleArchiveWorkflow}
            />

            {/* TODO: Add WorkflowDetailModal here */}
            {/* {selectedPresetForDetails && (
                <WorkflowDetailModal
                    presetId={selectedPresetForDetails}
                    onClose={() => setSelectedPresetForDetails(null)}
                    onStart={handleStartWorkflow}
                />
            )} */}
        </div>
    );
}

/**
 * Integration Instructions:
 * 
 * 1. Add this section to your dashboard page:
 * 
 *    import { DashboardWorkflowsSection } from '@/components/workflows/dashboard-integration-example';
 * 
 *    // In your dashboard page component:
 *    <DashboardWorkflowsSection />
 * 
 * 2. Or integrate directly:
 * 
 *    import { DashboardWorkflowWidget } from '@/components/workflows';
 *    
 *    // Fetch instances and implement handlers as shown above
 *    <DashboardWorkflowWidget
 *      userId={user.id}
 *      activeInstances={activeInstances}
 *      onStartWorkflow={handleStartWorkflow}
 *      onResumeWorkflow={handleResumeWorkflow}
 *      onViewDetails={handleViewDetails}
 *      onRestartWorkflow={handleRestartWorkflow}
 *      onArchiveWorkflow={handleArchiveWorkflow}
 *    />
 * 
 * 3. Implement server action to fetch user's workflow instances:
 * 
 *    // In src/app/workflow-actions.ts or similar
 *    export async function getUserWorkflowInstances(userId: string) {
 *      const repository = new WorkflowInstanceRepository();
 *      const instances = await repository.getUserWorkflowInstances(userId);
 *      return { success: true, data: instances };
 *    }
 * 
 * 4. Add navigation logic to route to workflow steps:
 * 
 *    - Get the preset for the instance
 *    - Get the current step definition
 *    - Navigate to the step's hubRoute with workflow query params
 *    - Example: router.push(`/brand/profile?workflowId=${instanceId}&stepId=${stepId}`)
 */
