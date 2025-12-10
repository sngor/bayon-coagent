'use server';

import { z } from 'zod';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getWorkflowInstanceService } from '@/lib/workflow-instance-service';
import { workflowPresetService } from '@/services/workflow-preset-service';
import {
    WorkflowInstance,
    WorkflowStatus,
    InstanceFilter,
} from '@/types/workflows';
import { transitionToStep } from '@/lib/workflow-state-manager';
import {
    classifyError,
    withRetry,
    formatErrorForLogging,
    WorkflowErrorType,
} from '@/lib/workflow-error-handler';
import { logger } from '@/aws/logging/logger';
import {
    detectAndMarkStaleWorkflows,
    StaleDetectionResult,
} from '@/lib/workflow-stale-detection';

/**
 * Action result type
 */
type ActionResult<T = any> = {
    message: string;
    data?: T;
    errors: Record<string, string[]>;
    errorType?: WorkflowErrorType;
};

/**
 * Maps errors to user-friendly messages with enhanced error handling
 * 
 * Requirements: 12.5, 14.5
 */
const handleError = (error: any, operation: string, context?: Record<string, any>): ActionResult => {
    const classified = classifyError(error);
    const isDev = process.env.NODE_ENV === 'development';

    // Log error with context
    const logContext = formatErrorForLogging(error, {
        operation,
        ...context,
    });

    logger.error(`Workflow action error: ${operation}`, error, logContext);

    // Build error message
    let message = classified.message;
    if (isDev && classified.originalError.message !== classified.message) {
        message += ` (Original: ${classified.originalError.message})`;
    }

    return {
        message,
        errors: {
            [classified.type.toLowerCase()]: [classified.message],
        },
        errorType: classified.type,
    };
};

/**
 * Validation schemas
 */
const startWorkflowSchema = z.object({
    presetId: z.string().min(1, 'Workflow preset ID is required'),
});

const resumeWorkflowSchema = z.object({
    instanceId: z.string().min(1, 'Workflow instance ID is required'),
});

const completeWorkflowStepSchema = z.object({
    instanceId: z.string().min(1, 'Workflow instance ID is required'),
    stepId: z.string().min(1, 'Step ID is required'),
    contextData: z.record(z.any()).optional(),
});

const skipWorkflowStepSchema = z.object({
    instanceId: z.string().min(1, 'Workflow instance ID is required'),
    stepId: z.string().min(1, 'Step ID is required'),
});

const navigateToWorkflowStepSchema = z.object({
    instanceId: z.string().min(1, 'Workflow instance ID is required'),
    stepId: z.string().min(1, 'Step ID is required'),
});

const archiveWorkflowSchema = z.object({
    instanceId: z.string().min(1, 'Workflow instance ID is required'),
});

const restartWorkflowSchema = z.object({
    instanceId: z.string().min(1, 'Workflow instance ID is required'),
});

/**
 * Starts a new workflow instance from a preset
 * 
 * Requirements: 1.3, 1.4, 12.5
 * 
 * @param prevState - Previous form state (for form actions)
 * @param formData - Form data containing presetId
 * @returns Action result with created workflow instance
 */
export async function startWorkflow(
    prevState: any,
    formData: FormData
): Promise<ActionResult<WorkflowInstance>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to start workflows'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Parse and validate input
        const validatedFields = startWorkflowSchema.safeParse({
            presetId: formData.get('presetId'),
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                errors: validatedFields.error.flatten().fieldErrors,
                errorType: WorkflowErrorType.VALIDATION,
            };
        }

        const { presetId } = validatedFields.data;

        // Get workflow preset
        const preset = workflowPresetService.getPresetById(presetId);
        if (!preset) {
            return {
                message: `Workflow preset "${presetId}" not found`,
                errors: { presetId: ['Preset not found'] },
                errorType: WorkflowErrorType.NOT_FOUND,
            };
        }

        // Create workflow instance with retry logic for network/database failures
        const service = getWorkflowInstanceService();
        const instance = await withRetry(
            () => service.createInstance(user.id, preset),
            { maxAttempts: 3 }
        );

        return {
            message: 'success',
            data: instance,
            errors: {},
        };
    } catch (error) {
        return handleError(error, 'startWorkflow', {
            presetId: formData.get('presetId'),
            userId: (await getCurrentUserServer())?.id,
        });
    }
}

/**
 * Resumes an existing workflow instance
 * 
 * Requirements: 7.3, 12.5
 * 
 * @param prevState - Previous form state (for form actions)
 * @param formData - Form data containing instanceId
 * @returns Action result with workflow instance
 */
export async function resumeWorkflow(
    prevState: any,
    formData: FormData
): Promise<ActionResult<WorkflowInstance>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to resume workflows'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Parse and validate input
        const validatedFields = resumeWorkflowSchema.safeParse({
            instanceId: formData.get('instanceId'),
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                errors: validatedFields.error.flatten().fieldErrors,
                errorType: WorkflowErrorType.VALIDATION,
            };
        }

        const { instanceId } = validatedFields.data;

        // Get workflow instance with retry
        const service = getWorkflowInstanceService();
        const instance = await withRetry(
            () => service.getInstance(user.id, instanceId),
            { maxAttempts: 2 }
        );

        if (!instance) {
            return {
                message: 'Workflow instance not found',
                errors: { instanceId: ['Instance not found'] },
                errorType: WorkflowErrorType.NOT_FOUND,
            };
        }

        // Verify user owns this instance
        if (instance.userId !== user.id) {
            return {
                message: 'Unauthorized access to workflow',
                errors: { auth: ['You do not have permission to access this workflow'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Update last active timestamp with retry
        await withRetry(
            () => service.updateInstanceState(user.id, instanceId, {
                lastActiveAt: new Date().toISOString(),
            }),
            { maxAttempts: 3 }
        );

        // Fetch updated instance
        const updatedInstance = await withRetry(
            () => service.getInstance(user.id, instanceId),
            { maxAttempts: 2 }
        );

        return {
            message: 'success',
            data: updatedInstance!,
            errors: {},
        };
    } catch (error) {
        return handleError(error, 'resumeWorkflow', {
            instanceId: formData.get('instanceId'),
            userId: (await getCurrentUserServer())?.id,
        });
    }
}

/**
 * Completes a workflow step and advances to the next step
 * 
 * Requirements: 2.2, 12.5, 14.5
 * 
 * @param prevState - Previous form state (for form actions)
 * @param formData - Form data containing instanceId, stepId, and optional contextData
 * @returns Action result with updated workflow instance
 */
export async function completeWorkflowStep(
    prevState: any,
    formData: FormData
): Promise<ActionResult<WorkflowInstance>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to complete workflow steps'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Parse and validate input
        const contextDataStr = formData.get('contextData');
        const contextData = contextDataStr ? JSON.parse(contextDataStr as string) : undefined;

        const validatedFields = completeWorkflowStepSchema.safeParse({
            instanceId: formData.get('instanceId'),
            stepId: formData.get('stepId'),
            contextData,
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                errors: validatedFields.error.flatten().fieldErrors,
                errorType: WorkflowErrorType.VALIDATION,
            };
        }

        const { instanceId, stepId, contextData: validatedContextData } = validatedFields.data;

        // Get workflow instance with retry
        const service = getWorkflowInstanceService();
        const instance = await withRetry(
            () => service.getInstance(user.id, instanceId),
            { maxAttempts: 2 }
        );

        if (!instance) {
            return {
                message: 'Workflow instance not found',
                errors: { instanceId: ['Instance not found'] },
                errorType: WorkflowErrorType.NOT_FOUND,
            };
        }

        // Verify user owns this instance
        if (instance.userId !== user.id) {
            return {
                message: 'Unauthorized access to workflow',
                errors: { auth: ['You do not have permission to access this workflow'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Get workflow preset
        const preset = workflowPresetService.getPresetById(instance.presetId);
        if (!preset) {
            return {
                message: `Workflow preset "${instance.presetId}" not found`,
                errors: { presetId: ['Preset not found'] },
                errorType: WorkflowErrorType.NOT_FOUND,
            };
        }

        // Complete the step with retry logic
        await withRetry(
            () => service.completeStep(user.id, instanceId, stepId, preset, validatedContextData),
            { maxAttempts: 3 }
        );

        // Fetch updated instance
        const updatedInstance = await withRetry(
            () => service.getInstance(user.id, instanceId),
            { maxAttempts: 2 }
        );

        return {
            message: 'success',
            data: updatedInstance!,
            errors: {},
        };
    } catch (error) {
        return handleError(error, 'completeWorkflowStep', {
            instanceId: formData.get('instanceId'),
            stepId: formData.get('stepId'),
            userId: (await getCurrentUserServer())?.id,
        });
    }
}

/**
 * Skips an optional workflow step and advances to the next step
 * 
 * Requirements: 9.3, 12.5
 * 
 * @param prevState - Previous form state (for form actions)
 * @param formData - Form data containing instanceId and stepId
 * @returns Action result with updated workflow instance
 */
export async function skipWorkflowStep(
    prevState: any,
    formData: FormData
): Promise<ActionResult<WorkflowInstance>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to skip workflow steps'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Parse and validate input
        const validatedFields = skipWorkflowStepSchema.safeParse({
            instanceId: formData.get('instanceId'),
            stepId: formData.get('stepId'),
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                errors: validatedFields.error.flatten().fieldErrors,
                errorType: WorkflowErrorType.VALIDATION,
            };
        }

        const { instanceId, stepId } = validatedFields.data;

        // Get workflow instance with retry
        const service = getWorkflowInstanceService();
        const instance = await withRetry(
            () => service.getInstance(user.id, instanceId),
            { maxAttempts: 2 }
        );

        if (!instance) {
            return {
                message: 'Workflow instance not found',
                errors: { instanceId: ['Instance not found'] },
                errorType: WorkflowErrorType.NOT_FOUND,
            };
        }

        // Verify user owns this instance
        if (instance.userId !== user.id) {
            return {
                message: 'Unauthorized access to workflow',
                errors: { auth: ['You do not have permission to access this workflow'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Get workflow preset
        const preset = workflowPresetService.getPresetById(instance.presetId);
        if (!preset) {
            return {
                message: `Workflow preset "${instance.presetId}" not found`,
                errors: { presetId: ['Preset not found'] },
                errorType: WorkflowErrorType.NOT_FOUND,
            };
        }

        // Skip the step with retry logic
        await withRetry(
            () => service.skipStep(user.id, instanceId, stepId, preset),
            { maxAttempts: 3 }
        );

        // Fetch updated instance
        const updatedInstance = await withRetry(
            () => service.getInstance(user.id, instanceId),
            { maxAttempts: 2 }
        );

        return {
            message: 'success',
            data: updatedInstance!,
            errors: {},
        };
    } catch (error) {
        return handleError(error, 'skipWorkflowStep', {
            instanceId: formData.get('instanceId'),
            stepId: formData.get('stepId'),
            userId: (await getCurrentUserServer())?.id,
        });
    }
}

/**
 * Navigates to a specific workflow step
 * 
 * Requirements: 14.1, 14.5, 12.5
 * 
 * @param prevState - Previous form state (for form actions)
 * @param formData - Form data containing instanceId and stepId
 * @returns Action result with updated workflow instance
 */
export async function navigateToWorkflowStep(
    prevState: any,
    formData: FormData
): Promise<ActionResult<WorkflowInstance>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to navigate workflow steps'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Parse and validate input
        const validatedFields = navigateToWorkflowStepSchema.safeParse({
            instanceId: formData.get('instanceId'),
            stepId: formData.get('stepId'),
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                errors: validatedFields.error.flatten().fieldErrors,
                errorType: WorkflowErrorType.VALIDATION,
            };
        }

        const { instanceId, stepId } = validatedFields.data;

        // Get workflow instance with retry
        const service = getWorkflowInstanceService();
        const instance = await withRetry(
            () => service.getInstance(user.id, instanceId),
            { maxAttempts: 2 }
        );

        if (!instance) {
            return {
                message: 'Workflow instance not found',
                errors: { instanceId: ['Instance not found'] },
                errorType: WorkflowErrorType.NOT_FOUND,
            };
        }

        // Verify user owns this instance
        if (instance.userId !== user.id) {
            return {
                message: 'Unauthorized access to workflow',
                errors: { auth: ['You do not have permission to access this workflow'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Get workflow preset
        const preset = workflowPresetService.getPresetById(instance.presetId);
        if (!preset) {
            return {
                message: `Workflow preset "${instance.presetId}" not found`,
                errors: { presetId: ['Preset not found'] },
                errorType: WorkflowErrorType.NOT_FOUND,
            };
        }

        // Transition to the step (validates navigation is allowed)
        // This will throw an error if navigation is not allowed
        const newState = transitionToStep(instance, stepId, preset);

        // Update instance with new state with retry logic
        await withRetry(
            () => service.updateInstanceState(user.id, instanceId, {
                currentStepId: newState.currentStepId,
                lastActiveAt: newState.lastActiveAt,
            }),
            { maxAttempts: 3 }
        );

        // Fetch updated instance
        const updatedInstance = await withRetry(
            () => service.getInstance(user.id, instanceId),
            { maxAttempts: 2 }
        );

        return {
            message: 'success',
            data: updatedInstance!,
            errors: {},
        };
    } catch (error) {
        return handleError(error, 'navigateToWorkflowStep', {
            instanceId: formData.get('instanceId'),
            stepId: formData.get('stepId'),
            userId: (await getCurrentUserServer())?.id,
        });
    }
}

/**
 * Archives a workflow instance
 * 
 * Requirements: 7.5, 12.5
 * 
 * @param prevState - Previous form state (for form actions)
 * @param formData - Form data containing instanceId
 * @returns Action result
 */
export async function archiveWorkflow(
    prevState: any,
    formData: FormData
): Promise<ActionResult<void>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to archive workflows'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Parse and validate input
        const validatedFields = archiveWorkflowSchema.safeParse({
            instanceId: formData.get('instanceId'),
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                errors: validatedFields.error.flatten().fieldErrors,
                errorType: WorkflowErrorType.VALIDATION,
            };
        }

        const { instanceId } = validatedFields.data;

        // Get workflow instance with retry
        const service = getWorkflowInstanceService();
        const instance = await withRetry(
            () => service.getInstance(user.id, instanceId),
            { maxAttempts: 2 }
        );

        if (!instance) {
            return {
                message: 'Workflow instance not found',
                errors: { instanceId: ['Instance not found'] },
                errorType: WorkflowErrorType.NOT_FOUND,
            };
        }

        // Verify user owns this instance
        if (instance.userId !== user.id) {
            return {
                message: 'Unauthorized access to workflow',
                errors: { auth: ['You do not have permission to access this workflow'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Archive the instance with retry
        await withRetry(
            () => service.archiveInstance(user.id, instanceId),
            { maxAttempts: 3 }
        );

        return {
            message: 'success',
            errors: {},
        };
    } catch (error) {
        return handleError(error, 'archiveWorkflow', {
            instanceId: formData.get('instanceId'),
            userId: (await getCurrentUserServer())?.id,
        });
    }
}

/**
 * Restarts a completed workflow by creating a new instance
 * 
 * Requirements: 10.2, 12.5
 * 
 * @param prevState - Previous form state (for form actions)
 * @param formData - Form data containing instanceId
 * @returns Action result with new workflow instance
 */
export async function restartWorkflow(
    prevState: any,
    formData: FormData
): Promise<ActionResult<WorkflowInstance>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to restart workflows'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Parse and validate input
        const validatedFields = restartWorkflowSchema.safeParse({
            instanceId: formData.get('instanceId'),
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                errors: validatedFields.error.flatten().fieldErrors,
                errorType: WorkflowErrorType.VALIDATION,
            };
        }

        const { instanceId } = validatedFields.data;

        // Get workflow instance with retry
        const service = getWorkflowInstanceService();
        const instance = await withRetry(
            () => service.getInstance(user.id, instanceId),
            { maxAttempts: 2 }
        );

        if (!instance) {
            return {
                message: 'Workflow instance not found',
                errors: { instanceId: ['Instance not found'] },
                errorType: WorkflowErrorType.NOT_FOUND,
            };
        }

        // Verify user owns this instance
        if (instance.userId !== user.id) {
            return {
                message: 'Unauthorized access to workflow',
                errors: { auth: ['You do not have permission to access this workflow'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Get workflow preset
        const preset = workflowPresetService.getPresetById(instance.presetId);
        if (!preset) {
            return {
                message: `Workflow preset "${instance.presetId}" not found`,
                errors: { presetId: ['Preset not found'] },
                errorType: WorkflowErrorType.NOT_FOUND,
            };
        }

        // Create a new instance (fresh state, no context data carried over) with retry
        const newInstance = await withRetry(
            () => service.createInstance(user.id, preset),
            { maxAttempts: 3 }
        );

        return {
            message: 'success',
            data: newInstance,
            errors: {},
        };
    } catch (error) {
        return handleError(error, 'restartWorkflow', {
            instanceId: formData.get('instanceId'),
            userId: (await getCurrentUserServer())?.id,
        });
    }
}

/**
 * Gets all workflow instances for the current user
 * 
 * Requirements: 1.3, 7.3, 12.5
 * 
 * @param filter - Optional filter for workflow instances
 * @returns Action result with workflow instances
 */
export async function getUserWorkflowInstances(
    filter?: InstanceFilter
): Promise<ActionResult<WorkflowInstance[]>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                data: [],
                errors: { auth: ['You must be logged in to view workflows'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Get workflow instances with retry
        const service = getWorkflowInstanceService();
        const instances = await withRetry(
            () => service.getUserInstances(user.id, filter),
            { maxAttempts: 2 }
        );

        return {
            message: 'success',
            data: instances,
            errors: {},
        };
    } catch (error) {
        return {
            ...handleError(error, 'getUserWorkflowInstances', {
                userId: (await getCurrentUserServer())?.id,
                filter,
            }),
            data: [],
        };
    }
}

/**
 * Detects and marks stale workflows for the current user
 * 
 * Workflows that have been inactive for more than 30 days are marked as stale.
 * This can be called on dashboard load or as a scheduled job.
 * 
 * Requirements: 7.4, 7.5, 12.5
 * 
 * @returns Action result with stale detection statistics
 */
export async function detectStaleWorkflows(): Promise<ActionResult<StaleDetectionResult>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to detect stale workflows'] },
                errorType: WorkflowErrorType.UNAUTHORIZED,
            };
        }

        // Detect and mark stale workflows with retry logic
        const result = await withRetry(
            () => detectAndMarkStaleWorkflows(user.id),
            { maxAttempts: 3 }
        );

        // Log the detection result
        logger.info('Stale workflow detection completed', {
            userId: user.id,
            staleCount: result.staleCount,
            totalActive: result.totalActive,
        });

        return {
            message: 'success',
            data: result,
            errors: {},
        };
    } catch (error) {
        return handleError(error, 'detectStaleWorkflows', {
            userId: (await getCurrentUserServer())?.id,
        });
    }
}
