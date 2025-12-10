/**
 * Workflow Context Usage Examples
 * 
 * This file demonstrates how to use the WorkflowContext in various scenarios.
 */

'use client';

import React, { useEffect } from 'react';
import { WorkflowProvider, useWorkflow } from './workflow-context';
import { WorkflowInstance, WorkflowPreset } from '@/types/workflows';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ============================================================================
// Example 1: Basic Workflow Display
// ============================================================================

/**
 * Component that displays current workflow progress
 */
function WorkflowProgressDisplay() {
    const {
        instance,
        preset,
        currentStep,
        nextStep,
        progress,
        remainingTime,
        isSaving,
        saveError,
    } = useWorkflow();

    if (!instance || !preset) {
        return <div>No workflow loaded</div>;
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold">{preset.title}</h2>
                <p className="text-muted-foreground">{preset.description}</p>
            </div>

            <div>
                <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{progress}%</span>
                </div>
                <Progress value={progress} />
            </div>

            {currentStep && (
                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold">{currentStep.title}</h3>
                    <p className="text-sm text-muted-foreground">
                        {currentStep.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Estimated time: {currentStep.estimatedMinutes} minutes
                    </p>
                </div>
            )}

            <div className="flex items-center gap-2 text-sm">
                <span>Time remaining: {remainingTime} minutes</span>
                {isSaving && <span className="text-muted-foreground">(Saving...)</span>}
            </div>

            {saveError && (
                <Alert variant="destructive">
                    <AlertDescription>
                        Failed to save: {saveError.message}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

// ============================================================================
// Example 2: Step Navigation Controls
// ============================================================================

/**
 * Component with step completion and navigation controls
 */
function WorkflowControls() {
    const {
        instance,
        preset,
        currentStep,
        nextStep,
        completeStep,
        skipStep,
        navigateToStep,
    } = useWorkflow();

    if (!instance || !preset || !currentStep) {
        return null;
    }

    const handleComplete = async () => {
        try {
            // You can pass context data when completing a step
            await completeStep({
                completedAt: new Date().toISOString(),
                // Add any other context data here
            });
        } catch (error) {
            console.error('Failed to complete step:', error);
        }
    };

    const handleSkip = async () => {
        try {
            await skipStep();
        } catch (error) {
            console.error('Failed to skip step:', error);
        }
    };

    const handleNavigateBack = async () => {
        // Navigate to a previous completed step
        const completedSteps = instance.completedSteps;
        if (completedSteps.length > 0) {
            const lastCompletedStep = completedSteps[completedSteps.length - 1];
            try {
                await navigateToStep(lastCompletedStep);
            } catch (error) {
                console.error('Failed to navigate:', error);
            }
        }
    };

    return (
        <div className="flex gap-2">
            <Button onClick={handleComplete}>
                Complete Step
            </Button>

            {currentStep.isOptional && (
                <Button variant="outline" onClick={handleSkip}>
                    Skip Step
                </Button>
            )}

            {instance.completedSteps.length > 0 && (
                <Button variant="ghost" onClick={handleNavigateBack}>
                    Go Back
                </Button>
            )}
        </div>
    );
}

// ============================================================================
// Example 3: Loading a Workflow
// ============================================================================

/**
 * Component that loads a workflow on mount
 */
function WorkflowLoader({
    instance,
    preset,
    children,
}: {
    instance: WorkflowInstance;
    preset: WorkflowPreset;
    children?: React.ReactNode;
}) {
    const { loadWorkflow, isLoaded } = useWorkflow();

    useEffect(() => {
        if (!isLoaded) {
            loadWorkflow(instance, preset);
        }
    }, [instance, preset, loadWorkflow, isLoaded]);

    if (!isLoaded) {
        return <div>Loading workflow...</div>;
    }

    return (
        <div className="space-y-6">
            {children || (
                <>
                    <WorkflowProgressDisplay />
                    <WorkflowControls />
                </>
            )}
        </div>
    );
}

// ============================================================================
// Example 4: Complete Page with Provider
// ============================================================================

/**
 * Example page that uses WorkflowProvider
 */
export function WorkflowPage({
    instance,
    preset,
}: {
    instance: WorkflowInstance;
    preset: WorkflowPreset;
}) {
    return (
        <WorkflowProvider
            autoSaveDelay={30000} // 30 seconds
            enableLocalStorage={true}
        >
            <div className="container mx-auto py-8">
                <WorkflowLoader instance={instance} preset={preset} />
            </div>
        </WorkflowProvider>
    );
}

// ============================================================================
// Example 5: Manual Save
// ============================================================================

/**
 * Component with manual save button
 */
function ManualSaveButton() {
    const { save, isSaving } = useWorkflow();

    const handleSave = async () => {
        try {
            await save();
        } catch (error) {
            console.error('Failed to save:', error);
        }
    };

    return (
        <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="outline"
        >
            {isSaving ? 'Saving...' : 'Save Now'}
        </Button>
    );
}

// ============================================================================
// Example 6: Step List with Navigation
// ============================================================================

/**
 * Component that displays all steps with navigation
 */
function WorkflowStepList() {
    const { instance, preset, currentStep, navigateToStep } = useWorkflow();

    if (!instance || !preset) {
        return null;
    }

    return (
        <div className="space-y-2">
            {preset.steps.map((step, index) => {
                const isCompleted = instance.completedSteps.includes(step.id);
                const isSkipped = instance.skippedSteps.includes(step.id);
                const isCurrent = currentStep?.id === step.id;
                const canNavigate = isCompleted || isSkipped || isCurrent;

                return (
                    <button
                        key={step.id}
                        onClick={() => canNavigate && navigateToStep(step.id)}
                        disabled={!canNavigate}
                        className={`
                            w-full text-left p-4 rounded-lg border
                            ${isCurrent ? 'border-primary bg-primary/5' : ''}
                            ${isCompleted ? 'border-green-500 bg-green-50' : ''}
                            ${isSkipped ? 'border-gray-300 bg-gray-50' : ''}
                            ${!canNavigate ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent'}
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center">
                                {isCompleted && '✓'}
                                {isSkipped && '⊘'}
                                {!isCompleted && !isSkipped && index + 1}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">{step.title}</div>
                                <div className="text-sm text-muted-foreground">
                                    {step.description}
                                </div>
                            </div>
                            {step.isOptional && (
                                <span className="text-xs text-muted-foreground">
                                    Optional
                                </span>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// ============================================================================
// Example 7: Context Data Display
// ============================================================================

/**
 * Component that displays context data from previous steps
 */
function WorkflowContextData() {
    const { instance } = useWorkflow();

    if (!instance || Object.keys(instance.contextData).length === 0) {
        return <div>No context data available</div>;
    }

    return (
        <div className="space-y-2">
            <h3 className="font-semibold">Context Data</h3>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                {JSON.stringify(instance.contextData, null, 2)}
            </pre>
        </div>
    );
}

// ============================================================================
// Example 8: Workflow Cleanup
// ============================================================================

/**
 * Component with workflow cleanup button
 */
function WorkflowCleanup() {
    const { clearWorkflow } = useWorkflow();

    const handleClear = () => {
        if (confirm('Are you sure you want to clear this workflow?')) {
            clearWorkflow();
        }
    };

    return (
        <Button variant="destructive" onClick={handleClear}>
            Clear Workflow
        </Button>
    );
}

// ============================================================================
// Example 9: Complete Workflow Dashboard
// ============================================================================

/**
 * Complete workflow dashboard with all features
 */
export function WorkflowDashboard({
    instance,
    preset,
}: {
    instance: WorkflowInstance;
    preset: WorkflowPreset;
}) {
    return (
        <WorkflowProvider>
            <WorkflowLoader instance={instance} preset={preset}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-6">
                        <WorkflowProgressDisplay />
                        <WorkflowControls />
                        <WorkflowContextData />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <WorkflowStepList />
                        <div className="flex gap-2">
                            <ManualSaveButton />
                            <WorkflowCleanup />
                        </div>
                    </div>
                </div>
            </WorkflowLoader>
        </WorkflowProvider>
    );
}
