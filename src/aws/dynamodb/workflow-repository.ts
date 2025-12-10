/**
 * Workflow Instance Repository
 * 
 * Provides CRUD operations for workflow instances in DynamoDB.
 * Handles workflow instance lifecycle management with status filtering.
 */

import { DynamoDBRepository } from './repository';
import { getWorkflowInstanceKeys } from './keys';
import {
    WorkflowInstance,
    WorkflowStatus,
    InstanceFilter,
} from '@/types/workflows';
import { DynamoDBItem, QueryOptions } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Repository for workflow instance operations
 */
export class WorkflowInstanceRepository {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    /**
     * Creates a new workflow instance
     * @param userId User ID
     * @param presetId Workflow preset ID
     * @param initialStepId ID of the first step
     * @returns The created workflow instance
     */
    async createWorkflowInstance(
        userId: string,
        presetId: string,
        initialStepId: string
    ): Promise<WorkflowInstance> {
        const instanceId = uuidv4();
        const now = new Date().toISOString();

        const instance: WorkflowInstance = {
            id: instanceId,
            userId,
            presetId,
            status: WorkflowStatus.ACTIVE,
            currentStepId: initialStepId,
            completedSteps: [],
            skippedSteps: [],
            contextData: {},
            startedAt: now,
            lastActiveAt: now,
        };

        const keys = getWorkflowInstanceKeys(
            userId,
            instanceId,
            instance.status,
            instance.lastActiveAt
        );

        await this.repository.create(
            keys.PK,
            keys.SK,
            'WorkflowInstance',
            instance,
            {
                GSI1PK: keys.GSI1PK,
                GSI1SK: keys.GSI1SK,
            }
        );

        return instance;
    }

    /**
     * Gets a workflow instance by ID
     * @param userId User ID
     * @param instanceId Workflow instance ID
     * @returns The workflow instance or null if not found
     */
    async getWorkflowInstance(
        userId: string,
        instanceId: string
    ): Promise<WorkflowInstance | null> {
        const keys = getWorkflowInstanceKeys(userId, instanceId);
        return this.repository.get<WorkflowInstance>(keys.PK, keys.SK);
    }

    /**
     * Gets all workflow instances for a user with optional filtering
     * @param userId User ID
     * @param filter Optional filter criteria
     * @returns Array of workflow instances
     */
    async getUserWorkflowInstances(
        userId: string,
        filter?: InstanceFilter
    ): Promise<WorkflowInstance[]> {
        // If filtering by status, use GSI1 for efficient querying
        if (filter?.status) {
            return this.queryByStatus(userId, filter.status, filter);
        }

        // Otherwise, query all workflow instances for the user
        const pk = `USER#${userId}`;
        const skPrefix = 'WORKFLOW#';

        const queryOptions: QueryOptions = {
            limit: filter?.limit,
            scanIndexForward: false, // Most recent first
        };

        // Add filter expression for presetId if provided
        if (filter?.presetId) {
            queryOptions.filterExpression = '#data.#presetId = :presetId';
            queryOptions.expressionAttributeNames = {
                '#data': 'Data',
                '#presetId': 'presetId',
            };
            queryOptions.expressionAttributeValues = {
                ':presetId': filter.presetId,
            };
        }

        const result = await this.repository.query<WorkflowInstance>(
            pk,
            skPrefix,
            queryOptions
        );

        return result.items;
    }

    /**
     * Queries workflow instances by status using GSI1
     * @param userId User ID
     * @param status Workflow status
     * @param filter Optional additional filters
     * @returns Array of workflow instances
     */
    private async queryByStatus(
        userId: string,
        status: WorkflowStatus,
        filter?: InstanceFilter
    ): Promise<WorkflowInstance[]> {
        const queryOptions: QueryOptions = {
            indexName: 'GSI1',
            limit: filter?.limit,
            scanIndexForward: false, // Most recent first
        };

        // Build key condition for GSI1
        const gsi1pk = `USER#${userId}`;
        const gsi1skPrefix = `STATUS#${status}#`;

        // Add filter expression for presetId if provided
        if (filter?.presetId) {
            queryOptions.filterExpression = '#data.#presetId = :presetId';
            queryOptions.expressionAttributeNames = {
                '#data': 'Data',
                '#presetId': 'presetId',
            };
            queryOptions.expressionAttributeValues = {
                ':presetId': filter.presetId,
            };
        }

        const result = await this.repository.query<WorkflowInstance>(
            gsi1pk,
            gsi1skPrefix,
            queryOptions
        );

        return result.items;
    }

    /**
     * Updates a workflow instance
     * @param userId User ID
     * @param instanceId Workflow instance ID
     * @param updates Partial workflow instance data to update
     */
    async updateWorkflowInstance(
        userId: string,
        instanceId: string,
        updates: Partial<WorkflowInstance>
    ): Promise<void> {
        const keys = getWorkflowInstanceKeys(userId, instanceId);

        // Update lastActiveAt timestamp
        const updatesWithTimestamp = {
            ...updates,
            lastActiveAt: new Date().toISOString(),
        };

        await this.repository.update(keys.PK, keys.SK, updatesWithTimestamp);

        // If status or lastActiveAt changed, we need to update GSI1 keys
        // This requires a full item update since we can't update GSI keys directly
        if (updates.status || updates.lastActiveAt) {
            const currentInstance = await this.getWorkflowInstance(userId, instanceId);
            if (currentInstance) {
                const newKeys = getWorkflowInstanceKeys(
                    userId,
                    instanceId,
                    updates.status || currentInstance.status,
                    updatesWithTimestamp.lastActiveAt
                );

                // Delete old item and create new one with updated GSI keys
                await this.repository.delete(keys.PK, keys.SK);
                await this.repository.create(
                    newKeys.PK,
                    newKeys.SK,
                    'WorkflowInstance',
                    { ...currentInstance, ...updatesWithTimestamp },
                    {
                        GSI1PK: newKeys.GSI1PK,
                        GSI1SK: newKeys.GSI1SK,
                    }
                );
            }
        }
    }

    /**
     * Deletes a workflow instance
     * @param userId User ID
     * @param instanceId Workflow instance ID
     */
    async deleteWorkflowInstance(
        userId: string,
        instanceId: string
    ): Promise<void> {
        const keys = getWorkflowInstanceKeys(userId, instanceId);
        await this.repository.delete(keys.PK, keys.SK);
    }

    /**
     * Marks a step as completed and updates the workflow state
     * @param userId User ID
     * @param instanceId Workflow instance ID
     * @param stepId Step ID to mark as completed
     * @param contextData Optional context data from the step
     */
    async completeStep(
        userId: string,
        instanceId: string,
        stepId: string,
        contextData?: Record<string, any>
    ): Promise<void> {
        const instance = await this.getWorkflowInstance(userId, instanceId);
        if (!instance) {
            throw new Error('Workflow instance not found');
        }

        // Add step to completed steps if not already there
        const completedSteps = instance.completedSteps.includes(stepId)
            ? instance.completedSteps
            : [...instance.completedSteps, stepId];

        // Merge context data
        const updatedContextData = contextData
            ? { ...instance.contextData, ...contextData }
            : instance.contextData;

        await this.updateWorkflowInstance(userId, instanceId, {
            completedSteps,
            contextData: updatedContextData,
        });
    }

    /**
     * Marks a step as skipped and updates the workflow state
     * @param userId User ID
     * @param instanceId Workflow instance ID
     * @param stepId Step ID to mark as skipped
     */
    async skipStep(
        userId: string,
        instanceId: string,
        stepId: string
    ): Promise<void> {
        const instance = await this.getWorkflowInstance(userId, instanceId);
        if (!instance) {
            throw new Error('Workflow instance not found');
        }

        // Add step to skipped steps if not already there
        const skippedSteps = instance.skippedSteps.includes(stepId)
            ? instance.skippedSteps
            : [...instance.skippedSteps, stepId];

        await this.updateWorkflowInstance(userId, instanceId, {
            skippedSteps,
        });
    }

    /**
     * Marks a workflow as completed
     * @param userId User ID
     * @param instanceId Workflow instance ID
     * @param actualMinutes Actual time taken to complete
     */
    async completeWorkflow(
        userId: string,
        instanceId: string,
        actualMinutes?: number
    ): Promise<void> {
        const completedAt = new Date().toISOString();

        // Calculate actual minutes if not provided
        let calculatedMinutes = actualMinutes;
        if (!calculatedMinutes) {
            const instance = await this.getWorkflowInstance(userId, instanceId);
            if (instance) {
                const startTime = new Date(instance.startedAt).getTime();
                const endTime = new Date(completedAt).getTime();
                calculatedMinutes = Math.round((endTime - startTime) / 60000); // Convert ms to minutes
            }
        }

        await this.updateWorkflowInstance(userId, instanceId, {
            status: WorkflowStatus.COMPLETED,
            completedAt,
            actualMinutes: calculatedMinutes,
        });
    }

    /**
     * Archives a workflow instance
     * @param userId User ID
     * @param instanceId Workflow instance ID
     */
    async archiveWorkflow(userId: string, instanceId: string): Promise<void> {
        await this.updateWorkflowInstance(userId, instanceId, {
            status: WorkflowStatus.ARCHIVED,
        });
    }

    /**
     * Marks stale workflows (inactive for more than 30 days)
     * @param userId User ID
     * @returns Number of workflows marked as stale
     */
    async markStaleWorkflows(userId: string): Promise<number> {
        const activeInstances = await this.getUserWorkflowInstances(userId, {
            status: WorkflowStatus.ACTIVE,
        });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

        let staleCount = 0;

        for (const instance of activeInstances) {
            if (instance.lastActiveAt < thirtyDaysAgoISO) {
                await this.updateWorkflowInstance(userId, instance.id, {
                    status: WorkflowStatus.STALE,
                });
                staleCount++;
            }
        }

        return staleCount;
    }
}

/**
 * Gets a singleton instance of the workflow repository
 */
let repositoryInstance: WorkflowInstanceRepository | null = null;

export function getWorkflowRepository(): WorkflowInstanceRepository {
    if (!repositoryInstance) {
        repositoryInstance = new WorkflowInstanceRepository();
    }
    return repositoryInstance;
}
