'use client';

/**
 * Workflow Error Handling Integration Example
 * 
 * This file demonstrates how to integrate all error handling features
 * in a complete workflow component.
 * 
 * Requirements: 12.5, 14.5
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkflowErrorBoundary } from './workflow-error-boundary';
import { useWorkflowActionHandler } from '@/hooks/use-workflow-action-handler';
import {
    startWorkflow,
    completeWorkflowStep,
    skipWorkflowStep,
    navigateToWorkflowStep,
} from '@/app/workflow-actions';
import { Button } from '@/components/ui/button';
import { WorkflowInstance } from '@/types/workflows';

/**
 * Example: Complete Workflow Page with Error Handling
 */
export function WorkflowPageExample() {
    const router = useRouter();

    return (
        <WorkflowErrorBoundary
            onRestart={() => {
                // Clear any local state and restart
                router.push('/dashboard');
            }}
            onReturnToDashboard={() => {
                router.push('/dashboard');
            }}
        >
            <WorkflowContent />
        </WorkflowErrorBoundary>
    );
}

/**
 * Example: Workflow Content Component
 */
function WorkflowContent() {
    const [instance, setInstance] = useState<WorkflowInstance | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="space-y-6">
            <h1>Workflow Example</h1>

            {!instance ? (
                <StartWorkflowExample onStart={setInstance} />
            ) : (
                <>
                    <WorkflowProgressExample instance={instance} />
                    <CompleteStepExample
                        instance={instance}
                        onUpdate={setInstance}
                    />
                    <SkipStepExample
                        instance={instance}
                        onUpdate={setInstance}
                    />
                    <NavigateStepExample
                        instance={instance}
                        onUpdate={setInstance}
                    />
                </>
            )}
        </div>
    );
}

/**
 * Example: Starting a Workflow with Error Handling
 */
function StartWorkflowExample({
    onStart,
}: {
    onStart: (instance: WorkflowInstance) => void;
}) {
    const { handleActionResult } = useWorkflowActionHandler();
    const [isLoading, setIsLoading] = useState(false);

    const handleStartWorkflow = async (presetId: string) => {
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('presetId', presetId);

            const result = await startWorkflow(null, formData);

            handleActionResult(result, {
                successMessage: 'Workflow started successfully!',
                onSuccess: (instance) => {
                    onStart(instance as WorkflowInstance);
                },
                onError: (error) => {
                    console.error('Failed to start workflow:', error);
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h2>Start a Workflow</h2>
            <div className="flex gap-2">
                <Button
                    onClick={() => handleStartWorkflow('launch-your-brand')}
                    disabled={isLoading}
                >
                    Launch Your Brand
                </Button>
                <Button
                    onClick={() => handleStartWorkflow('market-update-post')}
                    disabled={isLoading}
                >
                    Market Update Post
                </Button>
            </div>
        </div>
    );
}

/**
 * Example: Completing a Step with Error Handling
 */
function CompleteStepExample({
    instance,
    onUpdate,
}: {
    instance: WorkflowInstance;
    onUpdate: (instance: WorkflowInstance) => void;
}) {
    const { handleActionResult } = useWorkflowActionHandler();
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    const handleComplete = async () => {
        const data = new FormData();
        data.append('instanceId', instance.id);
        data.append('stepId', instance.currentStepId);
        data.append('contextData', JSON.stringify(formData));

        const result = await completeWorkflowStep(null, data);

        handleActionResult(result, {
            successMessage: 'Step completed successfully!',
            onSuccess: (updatedInstance) => {
                onUpdate(updatedInstance);
                setFormData({});
                setFieldErrors({});
            },
            onError: (error) => {
                // Display field-level validation errors
                setFieldErrors(error.errors);
            },
            // Don't show toast for validation errors
            showErrorToast: Object.keys(fieldErrors).length === 0,
        });
    };

    return (
        <div className="space-y-4">
            <h2>Complete Current Step</h2>
            <div className="space-y-2">
                <input
                    type="text"
                    placeholder="Enter data..."
                    value={formData.data || ''}
                    onChange={(e) =>
                        setFormData({ ...formData, data: e.target.value })
                    }
                    className="border rounded px-3 py-2"
                />
                {fieldErrors.data && (
                    <p className="text-sm text-destructive">
                        {fieldErrors.data[0]}
                    </p>
                )}
            </div>
            <Button onClick={handleComplete}>Complete Step</Button>
        </div>
    );
}

/**
 * Example: Skipping a Step with Error Handling
 */
function SkipStepExample({
    instance,
    onUpdate,
}: {
    instance: WorkflowInstance;
    onUpdate: (instance: WorkflowInstance) => void;
}) {
    const { executeAction } = useWorkflowActionHandler();

    const handleSkip = async () => {
        await executeAction(
            async () => {
                const formData = new FormData();
                formData.append('instanceId', instance.id);
                formData.append('stepId', instance.currentStepId);
                return skipWorkflowStep(null, formData);
            },
            {
                successMessage: 'Step skipped!',
                onSuccess: (updatedInstance) => {
                    onUpdate(updatedInstance as WorkflowInstance);
                },
            }
        );
    };

    return (
        <div className="space-y-4">
            <h2>Skip Current Step</h2>
            <Button onClick={handleSkip} variant="outline">
                Skip Step
            </Button>
        </div>
    );
}

/**
 * Example: Navigating to a Step with Error Handling
 */
function NavigateStepExample({
    instance,
    onUpdate,
}: {
    instance: WorkflowInstance;
    onUpdate: (instance: WorkflowInstance) => void;
}) {
    const { handleActionResult } = useWorkflowActionHandler();

    const handleNavigate = async (stepId: string) => {
        const formData = new FormData();
        formData.append('instanceId', instance.id);
        formData.append('stepId', stepId);

        const result = await navigateToWorkflowStep(null, formData);

        handleActionResult(result, {
            successMessage: 'Navigated to step!',
            onSuccess: (updatedInstance) => {
                onUpdate(updatedInstance);
            },
            onError: (error) => {
                // Handle navigation errors (e.g., can't navigate to incomplete step)
                console.error('Navigation error:', error);
            },
        });
    };

    return (
        <div className="space-y-4">
            <h2>Navigate to Step</h2>
            <div className="flex gap-2">
                {instance.completedSteps.map((stepId) => (
                    <Button
                        key={stepId}
                        onClick={() => handleNavigate(stepId)}
                        variant="outline"
                        size="sm"
                    >
                        {stepId}
                    </Button>
                ))}
            </div>
        </div>
    );
}

/**
 * Example: Workflow Progress Display
 */
function WorkflowProgressExample({ instance }: { instance: WorkflowInstance }) {
    const totalSteps = 4; // This would come from the preset
    const completedCount = instance.completedSteps.length + instance.skippedSteps.length;
    const progress = (completedCount / totalSteps) * 100;

    return (
        <div className="space-y-2">
            <h2>Workflow Progress</h2>
            <div className="space-y-1">
                <div className="flex justify-between text-sm">
                    <span>Current Step: {instance.currentStepId}</span>
                    <span>{Math.round(progress)}% Complete</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="text-xs text-muted-foreground">
                    Completed: {instance.completedSteps.length} | Skipped:{' '}
                    {instance.skippedSteps.length}
                </div>
            </div>
        </div>
    );
}

/**
 * Example: Custom Error Boundary Fallback
 */
export function WorkflowPageWithCustomFallback() {
    const router = useRouter();

    return (
        <WorkflowErrorBoundary
            fallback={(error, errorInfo) => (
                <div className="flex items-center justify-center min-h-screen p-6">
                    <div className="max-w-md space-y-4 text-center">
                        <h1 className="text-2xl font-bold text-destructive">
                            Custom Error UI
                        </h1>
                        <p className="text-muted-foreground">
                            Something went wrong with your workflow.
                        </p>
                        <div className="flex gap-2 justify-center">
                            <Button onClick={() => router.push('/dashboard')}>
                                Go to Dashboard
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                            >
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        >
            <WorkflowContent />
        </WorkflowErrorBoundary>
    );
}

/**
 * Example: Handling Specific Error Types
 */
export function WorkflowWithSpecificErrorHandling() {
    const { handleActionResult } = useWorkflowActionHandler();
    const [isOffline, setIsOffline] = useState(false);

    const handleAction = async () => {
        const formData = new FormData();
        // ... setup formData

        const result = await startWorkflow(null, formData);

        handleActionResult(result, {
            onError: (error) => {
                // Handle specific error types
                if (error.errorType === 'NETWORK') {
                    setIsOffline(true);
                    // Queue for retry when online
                } else if (error.errorType === 'CONCURRENT_UPDATE') {
                    // Refresh workflow and retry
                    window.location.reload();
                }
            },
        });
    };

    return (
        <div>
            {isOffline && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                        You appear to be offline. Your changes will be saved when
                        you reconnect.
                    </p>
                </div>
            )}
            <Button onClick={handleAction}>Perform Action</Button>
        </div>
    );
}
