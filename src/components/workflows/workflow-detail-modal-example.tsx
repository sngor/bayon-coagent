'use client';

/**
 * Workflow Detail Modal Integration Example
 * 
 * This file demonstrates how to integrate the WorkflowDetailModal
 * with the DashboardWorkflowWidget component.
 * 
 * Usage:
 * 1. Import this component in your dashboard page
 * 2. Pass user ID and handle workflow actions
 * 3. The modal will automatically open when clicking on workflow cards
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardWorkflowWidget } from './dashboard-workflow-widget';
import { WorkflowDetailModal, IntegrationStatus } from './workflow-detail-modal';
import { WorkflowInstance, WorkflowPreset } from '@/types/workflows';
import { ALL_WORKFLOW_PRESETS } from '@/lib/workflow-presets';
import { getWorkflowInstanceService } from '@/lib/workflow-instance-service';
import { toast } from '@/hooks/use-toast';

interface WorkflowDetailModalExampleProps {
    /** User ID */
    userId: string;
    /** Initial workflow instances (optional) */
    initialInstances?: WorkflowInstance[];
}

export function WorkflowDetailModalExample({
    userId,
    initialInstances = [],
}: WorkflowDetailModalExampleProps) {
    const router = useRouter();
    const [instances, setInstances] = useState<WorkflowInstance[]>(initialInstances);
    const [isLoading, setIsLoading] = useState(false);

    // Modal state
    const [selectedPreset, setSelectedPreset] = useState<WorkflowPreset | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Integration statuses (example - replace with actual integration checks)
    const [integrationStatuses, setIntegrationStatuses] = useState<IntegrationStatus[]>([
        {
            id: 'google-business-profile',
            name: 'Google Business Profile',
            isConnected: false, // Replace with actual check
        },
    ]);

    // Load workflow instances
    const loadInstances = useCallback(async () => {
        if (!userId) return;

        try {
            setIsLoading(true);
            const service = getWorkflowInstanceService();
            const userInstances = await service.getUserInstances(userId);
            setInstances(userInstances);
        } catch (error) {
            console.error('Failed to load workflow instances:', error);
            toast({
                title: 'Error',
                description: 'Failed to load your workflows. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Load instances on mount
    useEffect(() => {
        loadInstances();
    }, [loadInstances]);

    // Handle view workflow details
    const handleViewDetails = useCallback((presetId: string) => {
        const preset = ALL_WORKFLOW_PRESETS.find(p => p.id === presetId);
        if (preset) {
            setSelectedPreset(preset);
            setIsModalOpen(true);
        }
    }, []);

    // Handle start workflow
    const handleStartWorkflow = useCallback(async (presetId: string) => {
        if (!userId) {
            toast({
                title: 'Error',
                description: 'You must be logged in to start a workflow.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsLoading(true);

            // Find the preset
            const preset = ALL_WORKFLOW_PRESETS.find(p => p.id === presetId);
            if (!preset) {
                throw new Error('Workflow preset not found');
            }

            // Create workflow instance
            const service = getWorkflowInstanceService();
            const instance = await service.createInstance(userId, preset);

            // Reload instances
            await loadInstances();

            // Navigate to first step
            const firstStep = preset.steps[0];
            if (firstStep) {
                const url = `${firstStep.hubRoute}?workflowId=${instance.id}&stepId=${firstStep.id}`;
                router.push(url);
            }

            toast({
                title: 'Workflow Started!',
                description: `You've started the "${preset.title}" workflow.`,
            });
        } catch (error) {
            console.error('Failed to start workflow:', error);
            toast({
                title: 'Error',
                description: 'Failed to start workflow. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [userId, router, loadInstances]);

    // Handle resume workflow
    const handleResumeWorkflow = useCallback(async (instanceId: string) => {
        try {
            const service = getWorkflowInstanceService();
            const instance = await service.getInstance(userId, instanceId);

            if (!instance) {
                throw new Error('Workflow instance not found');
            }

            // Find the preset
            const preset = ALL_WORKFLOW_PRESETS.find(p => p.id === instance.presetId);
            if (!preset) {
                throw new Error('Workflow preset not found');
            }

            // Find current step
            const currentStep = preset.steps.find(s => s.id === instance.currentStepId);
            if (!currentStep) {
                throw new Error('Current step not found');
            }

            // Navigate to current step
            const url = `${currentStep.hubRoute}?workflowId=${instance.id}&stepId=${currentStep.id}`;
            router.push(url);

            toast({
                title: 'Workflow Resumed',
                description: `Continuing "${preset.title}" workflow.`,
            });
        } catch (error) {
            console.error('Failed to resume workflow:', error);
            toast({
                title: 'Error',
                description: 'Failed to resume workflow. Please try again.',
                variant: 'destructive',
            });
        }
    }, [userId, router]);

    // Handle restart workflow
    const handleRestartWorkflow = useCallback(async (instanceId: string) => {
        try {
            const service = getWorkflowInstanceService();
            const instance = await service.getInstance(userId, instanceId);

            if (!instance) {
                throw new Error('Workflow instance not found');
            }

            // Start a new instance of the same preset
            await handleStartWorkflow(instance.presetId);
        } catch (error) {
            console.error('Failed to restart workflow:', error);
            toast({
                title: 'Error',
                description: 'Failed to restart workflow. Please try again.',
                variant: 'destructive',
            });
        }
    }, [userId, handleStartWorkflow]);

    // Handle archive workflow
    const handleArchiveWorkflow = useCallback(async (instanceId: string) => {
        try {
            const service = getWorkflowInstanceService();
            await service.archiveInstance(userId, instanceId);

            // Reload instances
            await loadInstances();

            toast({
                title: 'Workflow Archived',
                description: 'The workflow has been archived.',
            });
        } catch (error) {
            console.error('Failed to archive workflow:', error);
            toast({
                title: 'Error',
                description: 'Failed to archive workflow. Please try again.',
                variant: 'destructive',
            });
        }
    }, [userId, loadInstances]);

    return (
        <>
            <DashboardWorkflowWidget
                userId={userId}
                activeInstances={instances}
                onStartWorkflow={handleStartWorkflow}
                onResumeWorkflow={handleResumeWorkflow}
                onViewDetails={handleViewDetails}
                onRestartWorkflow={handleRestartWorkflow}
                onArchiveWorkflow={handleArchiveWorkflow}
            />

            <WorkflowDetailModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                preset={selectedPreset}
                onStartWorkflow={handleStartWorkflow}
                integrationStatuses={integrationStatuses}
            />
        </>
    );
}

/**
 * Example: How to check integration status
 * 
 * Replace this with your actual integration checking logic
 */
async function checkIntegrationStatus(
    userId: string,
    integrationId: string
): Promise<boolean> {
    try {
        // Example: Check OAuth connection
        // const { getOAuthConnectionManager } = await import('@/integrations/oauth/connection-manager');
        // const manager = getOAuthConnectionManager();
        // const connection = await manager.getConnection(userId, integrationId);
        // return connection !== null && connection.accessToken !== undefined;

        // For now, return false
        return false;
    } catch (error) {
        console.error(`Failed to check integration status for ${integrationId}:`, error);
        return false;
    }
}

/**
 * Example: How to load integration statuses
 */
export async function loadIntegrationStatuses(
    userId: string,
    requiredIntegrations: string[]
): Promise<IntegrationStatus[]> {
    const statuses: IntegrationStatus[] = [];

    for (const integrationId of requiredIntegrations) {
        const isConnected = await checkIntegrationStatus(userId, integrationId);

        // Map integration IDs to display names
        const displayNames: Record<string, string> = {
            'google-business-profile': 'Google Business Profile',
            'facebook': 'Facebook',
            'instagram': 'Instagram',
            'twitter': 'Twitter / X',
        };

        statuses.push({
            id: integrationId,
            name: displayNames[integrationId] || integrationId,
            isConnected,
        });
    }

    return statuses;
}
