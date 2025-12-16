/**
 * Saga Coordinator Service
 * 
 * Implements saga pattern for managing distributed transactions with compensation handling.
 * Coordinates multi-service transactions and handles rollback scenarios.
 * 
 * **Feature: microservices-architecture-enhancement**
 * **Validates: Requirements 10.4**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from './base-lambda-template';
import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Saga types
interface SagaDefinition {
    sagaId: string;
    name: string;
    description: string;
    transactions: SagaTransaction[];
    compensations: SagaCompensation[];
    timeout: number;
    createdAt: string;
    updatedAt: string;
    userId: string;
}

interface SagaTransaction {
    transactionId: string;
    serviceName: string;
    operation: string;
    input: Record<string, any>;
    compensationId?: string;
    timeout: number;
    retryPolicy?: TransactionRetryPolicy;
}

interface SagaCompensation {
    compensationId: string;
    serviceName: string;
    operation: string;
    input: Record<string, any>;
    timeout: number;
}

interface TransactionRetryPolicy {
    maxAttempts: number;
    initialDelay: number;
    backoffMultiplier: number;
}

interface SagaExecution {
    executionId: string;
    sagaId: string;
    status: 'running' | 'completed' | 'compensating' | 'compensated' | 'failed';
    transactions: SagaTransactionExecution[];
    compensations: SagaCompensationExecution[];
    startedAt: string;
    completedAt?: string;
    error?: SagaError;
    context: Record<string, any>;
    userId: string;
}

interface SagaTransactionExecution {
    transactionId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'compensated';
    startedAt: string;
    completedAt?: string;
    result?: Record<string, any>;
    error?: SagaError;
    retryCount: number;
}

interface SagaCompensationExecution {
    compensationId: string;
    transactionId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt: string;
    completedAt?: string;
    result?: Record<string, any>;
    error?: SagaError;
}

interface SagaError {
    code: string;
    message: string;
    details?: Record<string, any>;
    recoverable: boolean;
}

// Request/Response types
interface CreateSagaRequest {
    definition: Omit<SagaDefinition, 'createdAt' | 'updatedAt' | 'userId'>;
    userId: string;
}

interface StartSagaRequest {
    sagaId: string;
    context: Record<string, any>;
    userId: string;
}

interface SagaStatusRequest {
    executionId: string;
    userId: string;
}

/**
 * Saga Coordinator Service Handler
 */
class SagaCoordinatorHandler extends BaseLambdaHandler {
    private dynamoClient: DynamoDBClient;
    private tableName: string;

    constructor() {
        const config: ServiceConfig = {
            serviceName: 'saga-coordinator-service',
            version: '1.0.0',
            description: 'Implements saga pattern for managing distributed transactions with compensation handling',
            enableTracing: true,
            enableCircuitBreaker: true,
            enableRetry: true,
        };

        super(config);

        this.dynamoClient = new DynamoDBClient({
            region: process.env.AWS_REGION || 'us-east-1',
            ...(process.env.USE_LOCAL_AWS === 'true' && {
                endpoint: 'http://localhost:4566',
                credentials: {
                    accessKeyId: 'test',
                    secretAccessKey: 'test',
                },
            }),
        });

        this.tableName = process.env.DYNAMODB_TABLE || 'bayon-coagent-dev';
    }

    async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const path = event.path;
        const method = event.httpMethod;

        try {
            // Health check
            if (path === '/health' && method === 'GET') {
                return this.createHealthCheckResponse();
            }

            // Route requests
            if (path === '/sagas' && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateCreateSagaRequest);
                return await this.createSaga(request);
            }

            if (path === '/sagas/start' && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateStartSagaRequest);
                return await this.startSaga(request);
            }

            if (path.startsWith('/sagas/executions/') && method === 'GET') {
                const executionId = path.split('/')[3];
                const userId = this.extractUserId(event);
                return await this.getSagaExecution(executionId, userId);
            }

            if (path.startsWith('/sagas/executions/') && path.endsWith('/status') && method === 'GET') {
                const executionId = path.split('/')[3];
                const userId = this.extractUserId(event);
                return await this.getSagaStatus(executionId, userId);
            }

            if (path.startsWith('/sagas/') && method === 'GET') {
                const sagaId = path.split('/')[2];
                const userId = this.extractUserId(event);
                return await this.getSagaDefinition(sagaId, userId);
            }

            return this.createErrorResponseData('INVALID_ENDPOINT', 'Endpoint not found', 404);

        } catch (error) {
            this.logger.error('Saga coordinator error:', error);
            return this.createErrorResponseData(
                'SAGA_COORDINATOR_ERROR',
                error instanceof Error ? error.message : 'Unknown error',
                500
            );
        }
    }

    private async createSaga(request: CreateSagaRequest): Promise<ApiResponse> {
        const now = new Date().toISOString();
        const definition: SagaDefinition = {
            ...request.definition,
            userId: request.userId,
            createdAt: now,
            updatedAt: now,
        };

        // Validate saga definition
        this.validateSagaDefinition(definition);

        // Store saga definition
        const item = {
            PK: `USER#${request.userId}`,
            SK: `SAGA_DEF#${definition.sagaId}`,
            Type: 'SagaDefinition',
            ...definition,
        };

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(item),
            ConditionExpression: 'attribute_not_exists(PK)',
        }));

        await this.publishServiceEvent('saga-coordinator', 'SagaDefinitionCreated', {
            sagaId: definition.sagaId,
            userId: request.userId,
        });

        return this.createSuccessResponse(definition, 201);
    }

    private async startSaga(request: StartSagaRequest): Promise<ApiResponse> {
        // Get saga definition
        const definition = await this.getSagaDefinitionById(request.sagaId, request.userId);
        if (!definition) {
            return this.createErrorResponseData('SAGA_NOT_FOUND', 'Saga definition not found', 404);
        }

        // Create execution
        const executionId = `saga_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const execution: SagaExecution = {
            executionId,
            sagaId: request.sagaId,
            status: 'running',
            transactions: definition.transactions.map(t => ({
                transactionId: t.transactionId,
                status: 'pending',
                startedAt: now,
                retryCount: 0,
            })),
            compensations: [],
            startedAt: now,
            context: request.context,
            userId: request.userId,
        };

        // Store execution
        await this.storeSagaExecution(execution);

        // Start executing transactions
        await this.executeTransactions(execution, definition);

        await this.publishServiceEvent('saga-coordinator', 'SagaStarted', {
            executionId,
            sagaId: request.sagaId,
            userId: request.userId,
        });

        return this.createSuccessResponse(execution, 201);
    }

    private async getSagaExecution(executionId: string, userId: string): Promise<ApiResponse> {
        const execution = await this.getSagaExecutionById(executionId, userId);
        if (!execution) {
            return this.createErrorResponseData('EXECUTION_NOT_FOUND', 'Saga execution not found', 404);
        }

        return this.createSuccessResponse(execution);
    }

    private async getSagaStatus(executionId: string, userId: string): Promise<ApiResponse> {
        const execution = await this.getSagaExecutionById(executionId, userId);
        if (!execution) {
            return this.createErrorResponseData('EXECUTION_NOT_FOUND', 'Saga execution not found', 404);
        }

        return this.createSuccessResponse({
            executionId,
            status: execution.status,
            startedAt: execution.startedAt,
            completedAt: execution.completedAt,
            transactionCount: execution.transactions.length,
            completedTransactions: execution.transactions.filter(t => t.status === 'completed').length,
            compensationCount: execution.compensations.length,
        });
    }

    private async getSagaDefinition(sagaId: string, userId: string): Promise<ApiResponse> {
        const definition = await this.getSagaDefinitionById(sagaId, userId);
        if (!definition) {
            return this.createErrorResponseData('SAGA_NOT_FOUND', 'Saga definition not found', 404);
        }

        return this.createSuccessResponse(definition);
    }

    private async executeTransactions(execution: SagaExecution, definition: SagaDefinition): Promise<void> {
        try {
            // Execute transactions sequentially
            for (const transaction of execution.transactions) {
                if (transaction.status !== 'pending') continue;

                const transactionDef = definition.transactions.find(t => t.transactionId === transaction.transactionId);
                if (!transactionDef) continue;

                // Execute transaction
                transaction.status = 'running';
                await this.updateSagaExecution(execution);

                const success = await this.executeTransaction(transactionDef, execution.context);

                if (success) {
                    transaction.status = 'completed';
                    transaction.completedAt = new Date().toISOString();
                    transaction.result = { success: true, transactionId: transaction.transactionId };
                } else {
                    transaction.status = 'failed';
                    transaction.completedAt = new Date().toISOString();
                    transaction.error = {
                        code: 'TRANSACTION_FAILED',
                        message: `Transaction ${transaction.transactionId} failed`,
                        recoverable: false,
                    };

                    // Start compensation
                    execution.status = 'compensating';
                    await this.startCompensation(execution, definition);
                    return;
                }
            }

            // All transactions completed successfully
            execution.status = 'completed';
            execution.completedAt = new Date().toISOString();
            await this.updateSagaExecution(execution);

            await this.publishServiceEvent('saga-coordinator', 'SagaCompleted', {
                executionId: execution.executionId,
                sagaId: execution.sagaId,
                userId: execution.userId,
            });

        } catch (error) {
            execution.status = 'failed';
            execution.error = {
                code: 'SAGA_EXECUTION_FAILED',
                message: error instanceof Error ? error.message : 'Saga execution failed',
                recoverable: false,
            };
            execution.completedAt = new Date().toISOString();
            await this.updateSagaExecution(execution);

            await this.publishServiceEvent('saga-coordinator', 'SagaFailed', {
                executionId: execution.executionId,
                sagaId: execution.sagaId,
                error: execution.error,
                userId: execution.userId,
            });
        }
    }

    private async startCompensation(execution: SagaExecution, definition: SagaDefinition): Promise<void> {
        try {
            // Find completed transactions that need compensation (in reverse order)
            const completedTransactions = execution.transactions
                .filter(t => t.status === 'completed')
                .reverse();

            for (const transaction of completedTransactions) {
                const transactionDef = definition.transactions.find(t => t.transactionId === transaction.transactionId);
                if (transactionDef?.compensationId) {
                    const compensationDef = definition.compensations.find(c => c.compensationId === transactionDef.compensationId);
                    if (compensationDef) {
                        const compensation: SagaCompensationExecution = {
                            compensationId: compensationDef.compensationId,
                            transactionId: transaction.transactionId,
                            status: 'running',
                            startedAt: new Date().toISOString(),
                        };

                        execution.compensations.push(compensation);

                        const success = await this.executeCompensation(compensationDef, execution.context);

                        if (success) {
                            compensation.status = 'completed';
                            compensation.completedAt = new Date().toISOString();
                            compensation.result = { compensated: true, transactionId: transaction.transactionId };
                            transaction.status = 'compensated';
                        } else {
                            compensation.status = 'failed';
                            compensation.completedAt = new Date().toISOString();
                            compensation.error = {
                                code: 'COMPENSATION_FAILED',
                                message: `Compensation for ${transaction.transactionId} failed`,
                                recoverable: false,
                            };
                            execution.status = 'failed';
                            execution.error = compensation.error;
                            execution.completedAt = new Date().toISOString();
                            await this.updateSagaExecution(execution);
                            return;
                        }
                    }
                }
            }

            // All compensations completed successfully
            execution.status = 'compensated';
            execution.completedAt = new Date().toISOString();
            await this.updateSagaExecution(execution);

            await this.publishServiceEvent('saga-coordinator', 'SagaCompensated', {
                executionId: execution.executionId,
                sagaId: execution.sagaId,
                userId: execution.userId,
            });

        } catch (error) {
            execution.status = 'failed';
            execution.error = {
                code: 'COMPENSATION_FAILED',
                message: error instanceof Error ? error.message : 'Compensation failed',
                recoverable: false,
            };
            execution.completedAt = new Date().toISOString();
            await this.updateSagaExecution(execution);

            await this.publishServiceEvent('saga-coordinator', 'SagaCompensationFailed', {
                executionId: execution.executionId,
                sagaId: execution.sagaId,
                error: execution.error,
                userId: execution.userId,
            });
        }
    }

    private async executeTransaction(transaction: SagaTransaction, context: Record<string, any>): Promise<boolean> {
        // Simulate transaction execution
        // In a real implementation, this would call the actual service
        this.logger.info(`Executing transaction: ${transaction.serviceName}.${transaction.operation}`);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 10));

        // Simulate success/failure (95% success rate)
        return Math.random() > 0.05;
    }

    private async executeCompensation(compensation: SagaCompensation, context: Record<string, any>): Promise<boolean> {
        // Simulate compensation execution
        // In a real implementation, this would call the actual service
        this.logger.info(`Executing compensation: ${compensation.serviceName}.${compensation.operation}`);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 5));

        // Compensations have higher success rate (98%)
        return Math.random() > 0.02;
    }

    private async getSagaDefinitionById(sagaId: string, userId: string): Promise<SagaDefinition | null> {
        try {
            const result = await this.dynamoClient.send(new GetItemCommand({
                TableName: this.tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: `SAGA_DEF#${sagaId}`,
                }),
            }));

            if (!result.Item) {
                return null;
            }

            const item = unmarshall(result.Item);
            return item as SagaDefinition;
        } catch (error) {
            this.logger.error('Error getting saga definition:', error);
            return null;
        }
    }

    private async getSagaExecutionById(executionId: string, userId: string): Promise<SagaExecution | null> {
        try {
            const result = await this.dynamoClient.send(new GetItemCommand({
                TableName: this.tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: `SAGA_EXEC#${executionId}`,
                }),
            }));

            if (!result.Item) {
                return null;
            }

            const item = unmarshall(result.Item);
            return item as SagaExecution;
        } catch (error) {
            this.logger.error('Error getting saga execution:', error);
            return null;
        }
    }

    private async storeSagaExecution(execution: SagaExecution): Promise<void> {
        const item = {
            PK: `USER#${execution.userId}`,
            SK: `SAGA_EXEC#${execution.executionId}`,
            Type: 'SagaExecution',
            ...execution,
        };

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(item),
        }));
    }

    private async updateSagaExecution(execution: SagaExecution): Promise<void> {
        await this.storeSagaExecution(execution);
    }

    private validateSagaDefinition(definition: SagaDefinition): void {
        if (!definition.sagaId || !definition.name || !definition.transactions || definition.transactions.length === 0) {
            throw new Error('Invalid saga definition: missing required fields');
        }

        if (definition.transactions.length < 2) {
            throw new Error('Saga must have at least 2 transactions');
        }

        // Validate transactions
        const transactionIds = new Set<string>();
        for (const transaction of definition.transactions) {
            if (!transaction.transactionId || !transaction.serviceName || !transaction.operation) {
                throw new Error('Invalid transaction: missing required fields');
            }

            if (transactionIds.has(transaction.transactionId)) {
                throw new Error(`Duplicate transaction ID: ${transaction.transactionId}`);
            }
            transactionIds.add(transaction.transactionId);

            if (transaction.timeout <= 0) {
                throw new Error(`Invalid transaction timeout: ${transaction.timeout}`);
            }
        }

        // Validate compensations
        const compensationIds = new Set<string>();
        for (const compensation of definition.compensations) {
            if (!compensation.compensationId || !compensation.serviceName || !compensation.operation) {
                throw new Error('Invalid compensation: missing required fields');
            }

            if (compensationIds.has(compensation.compensationId)) {
                throw new Error(`Duplicate compensation ID: ${compensation.compensationId}`);
            }
            compensationIds.add(compensation.compensationId);
        }

        // Validate compensation references
        for (const transaction of definition.transactions) {
            if (transaction.compensationId && !compensationIds.has(transaction.compensationId)) {
                throw new Error(`Invalid compensation reference: ${transaction.compensationId}`);
            }
        }

        if (definition.timeout <= 0) {
            throw new Error(`Invalid saga timeout: ${definition.timeout}`);
        }
    }

    // Validation functions
    private validateCreateSagaRequest(data: any): CreateSagaRequest {
        if (!data.definition || !data.userId) {
            throw new Error('Missing required fields: definition, userId');
        }
        return data as CreateSagaRequest;
    }

    private validateStartSagaRequest(data: any): StartSagaRequest {
        if (!data.sagaId || !data.context || !data.userId) {
            throw new Error('Missing required fields: sagaId, context, userId');
        }
        return data as StartSagaRequest;
    }

    private validateSagaStatusRequest(data: any): SagaStatusRequest {
        if (!data.executionId || !data.userId) {
            throw new Error('Missing required fields: executionId, userId');
        }
        return data as SagaStatusRequest;
    }
}

// Export handler
export const handler = new SagaCoordinatorHandler().lambdaHandler.bind(new SagaCoordinatorHandler());

// Export types for testing
export {
    SagaDefinition,
    SagaTransaction,
    SagaCompensation,
    SagaExecution,
    SagaTransactionExecution,
    SagaCompensationExecution,
    CreateSagaRequest,
    StartSagaRequest,
    SagaStatusRequest,
};