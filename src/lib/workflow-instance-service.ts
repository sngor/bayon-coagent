/**
 * Workflow Instance Service
 * 
 * High-level service for managing workflow instance lifecycle.
 * Provides business logic layer on top of the repository with:
 * - Auto-save functionality
 * - Retry logic for save failures
 * - State management integration
 * - Time tracking
 * 
 * Requirements: 1.3, 1.4, 2.2, 2.3, 7.1, 7.3, 8.4, 9.3, 12.5
 */

import { getWorkflowRepository, WorkflowInstanceRepository } from '@/aws/dynamodb/workflow-repository';
import {
    WorkflowInstance,
    WorkflowStatus,
    InstanceFilter,
    WorkflowPreset,
} from '@/types/workflows';
import {
    markStepComplete,
    markStepSkipped,
    isWorkflowComplete,
} from './workflow-state-manager';
import { updateCompletionTimeCache } from './workflow-completion-analytics';
import { getWorkflowAnalyticsService } from './workflow-analytics';

/**
 * Options for retry logic
 */
interface RetryOptions {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 2000,
};

/**
 * Service class for workflow instance operations
 */
export class WorkflowInstanceService {
    private repository: WorkflowInstanceRepository;
    private retryOptions: Required<RetryOptions>;

    constructor(retryOptions?: RetryOptions) {
        this.repository = getWorkflowRepository();
        this.retryOptions = {
            ...DEFAULT_RETRY_OPTIONS,
            ...retryOptions,
        };
    }

    /**
     * Creates a new workflow instance with initial state
     * 
     * @param userId User ID
     * @param preset Workflow preset definition
     * @returns The created workflow instance
     * @throws Error if creation fails after retries
     */
    async createInstance(
        userId: string,
        preset: WorkflowPreset
    ): Promise<WorkflowInstance> {
        // Get the first step from the preset
        if (preset.steps.length === 0) {
            throw new Error(`Workflow preset "${preset.id}" has no steps`);
        }

        const initialStepId = preset.steps[0].id;

        // Create instance with retry logic
        const instance = await this.withRetry(async () => {
            return this.repository.createWorkflowInstance(
                userId,
                preset.id,
                initialStepId
            );
        });

        // Track workflow start event
        const analytics = getWorkflowAnalyticsService();
        analytics.trackWorkflowStart(userId, instance, preset);

        // Track first step start
        analytics.trackStepStart(userId, instance, preset, initialStepId);

        return instance;
    }

    /**
     * Gets a workflow instance by ID
     * 
     * @param userId User ID
     * @param instanceId Workflow instance ID
     * @returns The workflow instance or null if not found
     */
    async getInstance(
        userId: string,
        instanceId: string
    ): Promise<WorkflowInstance | null> {
        return this.repository.getWorkflowInstance(userId, instanceId);
    }

    /**
     * Gets all workflow instances for a user with optional filtering
     * 
     * @param userId User ID
     * @param filter Optional filter criteria
     * @returns Array of workflow instances
     */
    async getUserInstances(
        userId: string,
        filter?: InstanceFilter
    ): Promise<WorkflowInstance[]> {
        return this.repository.getUserWorkflowInstances(userId, filter);
    }

    /**
     * Updates workflow instance state with auto-save and retry logic
     * 
     * @param userId User ID
     * @param instanceId Workflow instance ID
     * @param updates Partial workflow instance data to update
     * @throws Error if update fails after retries
     */
    async updateInstanceState(
        userId: string,
        instanceId: string,
        updates: Partial<WorkflowInstance>
    ): Promise<void> {
        return this.withRetry(async () => {
            await this.repository.updateWorkflowInstance(
                userId,
                instanceId,
                updates
            );
        });
    }

    /**
     * Completes a workflow step and advances to the next step
     * 
     * @param userId User ID
     * @param instanceId Workflow instance ID
     * @param stepId Step ID to complete
     * @param preset Workflow preset definition
     * @param data Optional context data from the step
     * @throws Error if step completion fails
     */
    async completeStep(
        userId: string,
        instanceId: string,
        stepId: string,
        preset: WorkflowPreset,
        data?: Record<string, any>
    ): Promise<void> {
        // Get current instance
        const instance = await this.getInstance(userId, instanceId);
        if (!instance) {
            throw new Error('Workflow instance not found');
        }

        // Track step completion event
        const analytics = getWorkflowAnalyticsService();
        analytics.trackStepCompletion(userId, instance, preset, stepId, data);

        // Use state manager to calculate new state
        const newState = markStepComplete(instance, stepId, preset, data);

        // Update instance with new state
        await this.updateInstanceState(userId, instanceId, {
            currentStepId: newState.currentStepId,
            completedSteps: newState.completedSteps,
            skippedSteps: newState.skippedSteps,
            contextData: newState.contextData,
            lastActiveAt: newState.lastActiveAt,
        });

        // Check if workflow is now complete
        const updatedInstance = await this.getInstance(userId, instanceId);
        if (updatedInstance && isWorkflowComplete(updatedInstance, preset)) {
            await this.completeWorkflow(userId, instanceId);
        } else if (updatedInstance) {
            // Track next step start
            analytics.trackStepStart(userId, updatedInstance, preset, newState.currentStepId);
        }
    }

    /**
     * Skips an optional workflow step and advances to the next step
     * 
     * @param userId User ID
     * @param instanceId Workflow instance ID
     * @param stepId Step ID to skip
     * @param preset Workflow preset definition
     * @throws Error if step is not optional or skip fails
     */
    async skipStep(
        userId: string,
        instanceId: string,
        stepId: string,
        preset: WorkflowPreset
    ): Promise<void> {
        // Get current instance
        const instance = await this.getInstance(userId, instanceId);
        if (!instance) {
            throw new Error('Workflow instance not found');
        }

        // Track step skip event
        const analytics = getWorkflowAnalyticsService();
        analytics.trackStepSkip(userId, instance, preset, stepId);

        // Use state manager to calculate new state (validates step is optional)
        const newState = markStepSkipped(instance, stepId, preset);

        // Update instance with new state
        await this.updateInstanceState(userId, instanceId, {
            currentStepId: newState.currentStepId,
            completedSteps: newState.completedSteps,
            skippedSteps: newState.skippedSteps,
            contextData: newState.contextData,
            lastActiveAt: newState.lastActiveAt,
        });

        // Check if workflow is now complete
        const updatedInstance = await this.getInstance(userId, instanceId);
        if (updatedInstance && isWorkflowComplete(updatedInstance, preset)) {
            await this.completeWorkflow(userId, instanceId);
        } else if (updatedInstance) {
            // Track next step start
            analytics.trackStepStart(userId, updatedInstance, preset, newState.currentStepId);
        }
    }

    /**
     * Marks a workflow as complete with time recording
     * 
     * @param userId User ID
     * @param instanceId Workflow instance ID
     * @param actualMinutes Optional actual time taken (calculated if not provided)
     * @throws Error if completion fails
     */
    async completeWorkflow(
        userId: string,
        instanceId: string,
        actualMinutes?: number
    ): Promise<void> {
        const completedAt = new Date().toISOString();

        // Get instance to access presetId for cache update
        const instance = await this.getInstance(userId, instanceId);
        if (!instance) {
            throw new Error('Workflow instance not found');
        }

        // Calculate actual minutes if not provided
        let calculatedMinutes = actualMinutes;
        if (!calculatedMinutes) {
            const startTime = new Date(instance.startedAt).getTime();
            const endTime = new Date(completedAt).getTime();
            calculatedMinutes = Math.round((endTime - startTime) / 60000); // Convert ms to minutes
        }

        await this.updateInstanceState(userId, instanceId, {
            status: WorkflowStatus.COMPLETED,
            completedAt,
            actualMinutes: calculatedMinutes,
        });

        // Update completion time cache for analytics
        if (calculatedMinutes && calculatedMinutes > 0) {
            await updateCompletionTimeCache(instance.presetId, calculatedMinutes);
        }

        // Track workflow completion event
        // Need to get preset for tracking
        const { workflowPresetService } = await import('@/services/workflow-preset-service');
        const preset = workflowPresetService.getPresetById(instance.presetId);
        if (preset && calculatedMinutes) {
            const analytics = getWorkflowAnalyticsService();
            analytics.trackWorkflowCompletion(userId, instance, preset, calculatedMinutes);
        }
    }

    /**
     * Archives a workflow instance
     * 
     * @param userId User ID
     * @param instanceId Workflow instance ID
     * @throws Error if archiving fails
     */
    async archiveInstance(
        userId: string,
        instanceId: string
    ): Promise<void> {
        await this.updateInstanceState(userId, instanceId, {
            status: WorkflowStatus.ARCHIVED,
        });
    }

    /**
     * Executes an operation with exponential backoff retry logic
     * 
     * @param operation The async operation to execute
     * @returns The result of the operation
     * @throws Error if all retries fail
     */
    private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
        let lastError: Error | null = null;
        let delay = this.retryOptions.initialDelayMs;

        for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;

                // Don't retry on last attempt
                if (attempt === this.retryOptions.maxRetries) {
                    break;
                }

                // Check if error is retryable
                if (!this.isRetryableError(error)) {
                    throw error;
                }

                // Wait before retrying with exponential backoff
                await this.sleep(delay);
                delay = Math.min(delay * 2, this.retryOptions.maxDelayMs);
            }
        }

        // All retries failed
        throw new Error(
            `Operation failed after ${this.retryOptions.maxRetries} retries: ${lastError?.message}`
        );
    }

    /**
     * Determines if an error is retryable
     * 
     * @param error The error to check
     * @returns True if the error is retryable
     */
    private isRetryableError(error: unknown): boolean {
        if (!error || typeof error !== 'object') {
            return false;
        }

        const err = error as any;

        // Retry on network errors
        if (err.code === 'NetworkingError' || err.code === 'TimeoutError') {
            return true;
        }

        // Retry on throttling errors
        if (
            err.code === 'ProvisionedThroughputExceededException' ||
            err.code === 'ThrottlingException' ||
            err.code === 'RequestLimitExceeded'
        ) {
            return true;
        }

        // Retry on service unavailable
        if (err.code === 'ServiceUnavailable' || err.statusCode === 503) {
            return true;
        }

        // Don't retry on validation errors or not found errors
        if (
            err.code === 'ValidationException' ||
            err.code === 'ResourceNotFoundException' ||
            err.statusCode === 404
        ) {
            return false;
        }

        // Default to not retrying
        return false;
    }

    /**
     * Sleeps for the specified duration
     * 
     * @param ms Duration in milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Gets a singleton instance of the workflow instance service
 */
let serviceInstance: WorkflowInstanceService | null = null;

export function getWorkflowInstanceService(): WorkflowInstanceService {
    if (!serviceInstance) {
        serviceInstance = new WorkflowInstanceService();
    }
    return serviceInstance;
}

