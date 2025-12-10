/**
 * Workflow Progress Tracker Example
 * 
 * Example usage of the WorkflowProgressTracker component.
 * This demonstrates how to integrate the progress tracker into a workflow page.
 */

'use client';

import React, { useState } from 'react';
import { WorkflowProgressTracker } from './workflow-progress-tracker';
import { WorkflowInstance, WorkflowPreset, WorkflowStatus } from '@/types/workflows';
import { workflowPresetService } from '@/services/workflow-preset-service';

/**
 * Example component showing WorkflowProgressTracker usage
 */
export function WorkflowProgressTrackerExample() {
    // Get a sample workflow preset (Launch Your Brand)
    const preset = workflowPresetService.getPresetById('launch-your-brand');

    if (!preset) {
        return <div>Workflow preset not found</div>;
    }

    // Create a sample workflow instance
    const [instance, setInstance] = useState<WorkflowInstance>({
        id: 'example-instance-1',
        userId: 'user-123',
        presetId: preset.id,
        status: WorkflowStatus.ACTIVE,
        currentStepId: preset.steps[0].id,
        completedSteps: [],
        skippedSteps: [],
        contextData: {},
        startedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
    });

    // Handle navigation to a step
    const handleNavigateToStep = (stepId: string) => {
        console.log('Navigate to step:', stepId);
        setInstance((prev) => ({
            ...prev,
            currentStepId: stepId,
            lastActiveAt: new Date().toISOString(),
        }));
    };

    // Handle skipping a step
    const handleSkipStep = () => {
        console.log('Skip step:', instance.currentStepId);

        // Find next step
        const currentIndex = preset.steps.findIndex(s => s.id === instance.currentStepId);
        const nextStep = preset.steps[currentIndex + 1];

        if (nextStep) {
            setInstance((prev) => ({
                ...prev,
                currentStepId: nextStep.id,
                skippedSteps: [...prev.skippedSteps, prev.currentStepId],
                lastActiveAt: new Date().toISOString(),
            }));
        }
    };

    // Handle completing a step
    const handleCompleteStep = (data?: any) => {
        console.log('Complete step:', instance.currentStepId, data);

        // Find next step
        const currentIndex = preset.steps.findIndex(s => s.id === instance.currentStepId);
        const nextStep = preset.steps[currentIndex + 1];

        if (nextStep) {
            setInstance((prev) => ({
                ...prev,
                currentStepId: nextStep.id,
                completedSteps: [...prev.completedSteps, prev.currentStepId],
                contextData: { ...prev.contextData, ...data },
                lastActiveAt: new Date().toISOString(),
            }));
        } else {
            // Workflow complete
            setInstance((prev) => ({
                ...prev,
                status: WorkflowStatus.COMPLETED,
                completedSteps: [...prev.completedSteps, prev.currentStepId],
                completedAt: new Date().toISOString(),
            }));
        }
    };

    return (
        <div className="container max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Workflow Progress Tracker Example</h1>

            {/* Vertical layout (default) */}
            <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4">Vertical Layout (Desktop)</h2>
                <div className="border rounded-lg p-6 bg-card">
                    <WorkflowProgressTracker
                        instance={instance}
                        preset={preset}
                        currentStepId={instance.currentStepId}
                        onNavigateToStep={handleNavigateToStep}
                        onSkipStep={handleSkipStep}
                        onCompleteStep={handleCompleteStep}
                        horizontal={false}
                        showHelp={true}
                    />
                </div>
            </div>

            {/* Horizontal layout (mobile) */}
            <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4">Horizontal Layout (Mobile)</h2>
                <div className="border rounded-lg p-6 bg-card">
                    <WorkflowProgressTracker
                        instance={instance}
                        preset={preset}
                        currentStepId={instance.currentStepId}
                        onNavigateToStep={handleNavigateToStep}
                        onSkipStep={handleSkipStep}
                        onCompleteStep={handleCompleteStep}
                        horizontal={true}
                        showHelp={true}
                    />
                </div>
            </div>

            {/* Without help text */}
            <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4">Without Help Text</h2>
                <div className="border rounded-lg p-6 bg-card">
                    <WorkflowProgressTracker
                        instance={instance}
                        preset={preset}
                        currentStepId={instance.currentStepId}
                        onNavigateToStep={handleNavigateToStep}
                        onSkipStep={handleSkipStep}
                        onCompleteStep={handleCompleteStep}
                        horizontal={false}
                        showHelp={false}
                    />
                </div>
            </div>

            {/* Debug info */}
            <div className="border rounded-lg p-6 bg-muted">
                <h3 className="font-semibold mb-2">Current State</h3>
                <pre className="text-xs overflow-auto">
                    {JSON.stringify(instance, null, 2)}
                </pre>
            </div>
        </div>
    );
}
