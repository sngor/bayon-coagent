/**
 * Saga Pattern Implementation for Distributed Transactions
 * 
 * This module implements the saga pattern to maintain data consistency
 * across distributed microservices. It provides:
 * - Transaction coordination across multiple services
 * - Compensating transactions for rollback
 * - State management and persistence
 * - Error handling and recovery
 * 
 * Requirements: 7.2, 7.3
 */

import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { getAWSConfig } from '@/aws/config';

// Saga step definition
export interface SagaStep<TInput = any, TOutput = any> {
    name: string;
    action: (input: TInput, context: SagaContext) => Promise<TOutput>;
    compensation: (output: TOutput, context: SagaContext) => Promise<void>;
}

// Saga execution context
export interface SagaContext {
    sagaId: string;
    userId: string;
    metadata: Record<string, any>;
    traceId?: string;
}

// Saga execution state
export enum SagaState {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    COMPENSATING = 'COMPENSATING',
    FAILED = 'FAILED',
    COMPENSATED = 'COMPENSATED',
}

// Saga execution record
export interface SagaExecution {
    sagaId: string;
    userId: string;
    state: SagaState;
    currentStep: number;
    steps: Array<{
        name: string;
        status: 'pending' | 'completed' | 'failed' | 'compensated';
        output?: any;
        error?: string;
        startedAt?: string;
        completedAt?: string;
    }>;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    traceId?: string;
}

// Saga execution result
export interface SagaResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    compensated?: boolean;
    execution: SagaExecution;
}

/**
 * Saga Coordinator
 * 
 * Orchestrates distributed transactions across multiple services
 * with automatic compensation on failure.
 */
export class SagaCoordinator {
    private dynamoClient: DynamoDBClient;
    private tableName: string;

    constructor() {
        const config = getAWSConfig();
        this.dynamoClient = new DynamoDBClient(config);
        this.tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev';
    }

    /**
     * Execute a saga with automatic compensation on failure
     */
    async execute<TInput, TOutput>(
        steps: SagaStep[],
        initialInput: TInput,
        context: SagaContext
    ): Promise<SagaResult<TOutput>> {
        // Create saga execution record
        const execution = await this.createExecution(steps, context);

        try {
            // Update state to running
            await this.updateExecutionState(execution.sagaId, SagaState.RUNNING);

            // Execute steps sequentially
            let currentInput: any = initialInput;
            const completedSteps: Array<{ step: SagaStep; output: any }> = [];

            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];

                try {
                    // Update current step
                    await this.updateCurrentStep(execution.sagaId, i, 'running');

                    // Execute step action
                    const output = await step.action(currentInput, context);

                    // Record step completion
                    await this.updateCurrentStep(execution.sagaId, i, 'completed', output);
                    completedSteps.push({ step, output });

                    // Output becomes input for next step
                    currentInput = output;
                } catch (error) {
                    // Step failed - start compensation
                    await this.updateCurrentStep(
                        execution.sagaId,
                        i,
                        'failed',
                        undefined,
                        error instanceof Error ? error.message : String(error)
                    );

                    // Compensate completed steps in reverse order
                    const compensationResult = await this.compensate(
                        execution.sagaId,
                        completedSteps.reverse()
                    );

                    // Get final execution state
                    const finalExecution = await this.getExecution(execution.sagaId);

                    return {
                        success: false,
                        error: error instanceof Error ? error.message : String(error),
                        compensated: compensationResult,
                        execution: finalExecution!,
                    };
                }
            }

            // All steps completed successfully
            await this.updateExecutionState(execution.sagaId, SagaState.COMPLETED);
            const finalExecution = await this.getExecution(execution.sagaId);

            return {
                success: true,
                data: currentInput as TOutput,
                execution: finalExecution!,
            };
        } catch (error) {
            // Unexpected error during saga execution
            await this.updateExecutionState(execution.sagaId, SagaState.FAILED);
            const finalExecution = await this.getExecution(execution.sagaId);

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                execution: finalExecution!,
            };
        }
    }

    /**
     * Compensate completed steps in reverse order
     */
    private async compensate(
        sagaId: string,
        completedSteps: Array<{ step: SagaStep; output: any }>
    ): Promise<boolean> {
        await this.updateExecutionState(sagaId, SagaState.COMPENSATING);

        let allCompensated = true;

        for (const { step, output } of completedSteps) {
            try {
                // Get context for compensation
                const execution = await this.getExecution(sagaId);
                if (!execution) {
                    throw new Error('Execution not found');
                }

                const context: SagaContext = {
                    sagaId: execution.sagaId,
                    userId: execution.userId,
                    metadata: execution.metadata,
                    traceId: execution.traceId,
                };

                // Execute compensation
                await step.compensation(output, context);

                // Mark step as compensated
                await this.markStepCompensated(sagaId, step.name);
            } catch (error) {
                console.error(`Failed to compensate step ${step.name}:`, error);
                allCompensated = false;
            }
        }

        // Update final state
        await this.updateExecutionState(
            sagaId,
            allCompensated ? SagaState.COMPENSATED : SagaState.FAILED
        );

        return allCompensated;
    }

    /**
     * Create saga execution record in DynamoDB
     */
    private async createExecution(
        steps: SagaStep[],
        context: SagaContext
    ): Promise<SagaExecution> {
        const now = new Date().toISOString();
        const execution: SagaExecution = {
            sagaId: context.sagaId,
            userId: context.userId,
            state: SagaState.PENDING,
            currentStep: 0,
            steps: steps.map(step => ({
                name: step.name,
                status: 'pending' as const,
            })),
            metadata: context.metadata,
            createdAt: now,
            updatedAt: now,
            traceId: context.traceId,
        };

        await this.dynamoClient.send(
            new PutItemCommand({
                TableName: this.tableName,
                Item: marshall({
                    PK: `USER#${context.userId}`,
                    SK: `SAGA#${context.sagaId}`,
                    ...execution,
                }),
            })
        );

        return execution;
    }

    /**
     * Get saga execution from DynamoDB
     */
    private async getExecution(sagaId: string): Promise<SagaExecution | null> {
        // Extract userId from sagaId (format: userId-timestamp-random)
        const userId = sagaId.split('-')[0];

        const result = await this.dynamoClient.send(
            new GetItemCommand({
                TableName: this.tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: `SAGA#${sagaId}`,
                }),
            })
        );

        if (!result.Item) {
            return null;
        }

        const item = unmarshall(result.Item);
        return item as SagaExecution;
    }

    /**
     * Update saga execution state
     */
    private async updateExecutionState(
        sagaId: string,
        state: SagaState
    ): Promise<void> {
        const userId = sagaId.split('-')[0];

        await this.dynamoClient.send(
            new UpdateItemCommand({
                TableName: this.tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: `SAGA#${sagaId}`,
                }),
                UpdateExpression: 'SET #state = :state, #updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                    '#state': 'state',
                    '#updatedAt': 'updatedAt',
                },
                ExpressionAttributeValues: marshall({
                    ':state': state,
                    ':updatedAt': new Date().toISOString(),
                }),
            })
        );
    }

    /**
     * Update current step status
     */
    private async updateCurrentStep(
        sagaId: string,
        stepIndex: number,
        status: 'running' | 'completed' | 'failed',
        output?: any,
        error?: string
    ): Promise<void> {
        const userId = sagaId.split('-')[0];
        const now = new Date().toISOString();

        const updateData: any = {
            status,
            ...(status === 'running' && { startedAt: now }),
            ...(status === 'completed' && { completedAt: now, output }),
            ...(status === 'failed' && { completedAt: now, error }),
        };

        await this.dynamoClient.send(
            new UpdateItemCommand({
                TableName: this.tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: `SAGA#${sagaId}`,
                }),
                UpdateExpression: `SET steps[${stepIndex}] = :stepData, currentStep = :currentStep, updatedAt = :updatedAt`,
                ExpressionAttributeValues: marshall({
                    ':stepData': updateData,
                    ':currentStep': stepIndex,
                    ':updatedAt': now,
                }),
            })
        );
    }

    /**
     * Mark step as compensated
     */
    private async markStepCompensated(
        sagaId: string,
        stepName: string
    ): Promise<void> {
        const execution = await this.getExecution(sagaId);
        if (!execution) return;

        const stepIndex = execution.steps.findIndex(s => s.name === stepName);
        if (stepIndex === -1) return;

        const userId = sagaId.split('-')[0];

        await this.dynamoClient.send(
            new UpdateItemCommand({
                TableName: this.tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: `SAGA#${sagaId}`,
                }),
                UpdateExpression: `SET steps[${stepIndex}].#status = :status, updatedAt = :updatedAt`,
                ExpressionAttributeNames: {
                    '#status': 'status',
                },
                ExpressionAttributeValues: marshall({
                    ':status': 'compensated',
                    ':updatedAt': new Date().toISOString(),
                }),
            })
        );
    }

    /**
     * Generate unique saga ID
     */
    static generateSagaId(userId: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `${userId}-${timestamp}-${random}`;
    }
}

/**
 * Helper function to create a saga coordinator instance
 */
export function createSagaCoordinator(): SagaCoordinator {
    return new SagaCoordinator();
}
