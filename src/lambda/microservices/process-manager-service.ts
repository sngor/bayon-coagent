/**
 * Process Manager Service
 * 
 * Manages long-running processes with tracking, monitoring, and timeout handling.
 * Provides process lifecycle management and status monitoring capabilities.
 * 
 * **Feature: microservices-architecture-enhancement**
 * **Validates: Requirements 10.3**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from './base-lambda-template';
import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Process types
interface ProcessDefinition {
    processId: string;
    name: string;
    description: string;
    type: 'workflow' | 'saga' | 'batch' | 'streaming' | 'scheduled';
    config: ProcessConfig;
    timeout: number;
    retryPolicy: ProcessRetryPolicy;
    createdAt: string;
    updatedAt: string;
    userId: string;
}

interface ProcessConfig {
    maxConcurrency?: number;
    checkpointInterval?: number;
    heartbeatInterval?: number;
    progressReporting?: boolean;
    autoRestart?: boolean;
    dependencies?: string[];
}

interface ProcessRetryPolicy {
    maxAttempts: number;
    initialDelay: number;
    backoffMultiplier: number;
    maxDelay: number;
}

interface ProcessExecution {
    executionId: string;
    processId: string;
    status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled' | 'timeout';
    progress: ProcessProgress;
    checkpoints: ProcessCheckpoint[];
    heartbeats: ProcessHeartbeat[];
    startedAt: string;
    updatedAt: string;
    completedAt?: string;
    error?: ProcessError;
    context: Record<string, any>;
    userId: string;
}

interface ProcessProgress {
    totalSteps: number;
    completedSteps: number;
    currentStep: string;
    percentage: number;
    estimatedTimeRemaining?: number;
    throughput?: number;
}

interface ProcessCheckpoint {
    checkpointId: string;
    timestamp: string;
    step: string;
    state: Record<string, any>;
    progress: ProcessProgress;
}

interface ProcessHeartbeat {
    timestamp: string;
    status: string;
    progress: ProcessProgress;
    metrics?: Record<string, number>;
}

interface ProcessError {
    code: string;
    message: string;
    details?: Record<string, any>;
    recoverable: boolean;
    retryCount: number;
}

// Request/Response types
interface CreateProcessRequest {
    definition: Omit<ProcessDefinition, 'createdAt' | 'updatedAt' | 'userId'>;
    userId: string;
}

interface StartProcessRequest {
    processId: string;
    context: Record<string, any>;
    userId: string;
}

interface ProcessControlRequest {
    executionId: string;
    userId: string;
}

interface UpdateProgressRequest {
    executionId: string;
    progress: Partial<ProcessProgress>;
    userId: string;
}

interface CreateCheckpointRequest {
    executionId: string;
    step: string;
    state: Record<string, any>;
    userId: string;
}

/**
 * Process Manager Service Handler
 */
class ProcessManagerHandler extends BaseLambdaHandler {
    private dynamoClient: DynamoDBClient;
    private tableName: string;

    constructor() {
        const config: ServiceConfig = {
            serviceName: 'process-manager-service',
            version: '1.0.0',
            description: 'Manages long-running processes with tracking, monitoring, and timeout handling',
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
            if (path === '/processes' && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateCreateProcessRequest);
                return await this.createProcess(request);
            }

            if (path === '/processes/start' && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateStartProcessRequest);
                return await this.startProcess(request);
            }

            if (path.startsWith('/processes/executions/') && path.endsWith('/pause') && method === 'POST') {
                const executionId = path.split('/')[3];
                const request: ProcessControlRequest = { executionId, userId: this.extractUserId(event) };
                return await this.pauseProcess(request);
            }

            if (path.startsWith('/processes/executions/') && path.endsWith('/resume') && method === 'POST') {
                const executionId = path.split('/')[3];
                const request: ProcessControlRequest = { executionId, userId: this.extractUserId(event) };
                return await this.resumeProcess(request);
            }

            if (path.startsWith('/processes/executions/') && path.endsWith('/cancel') && method === 'POST') {
                const executionId = path.split('/')[3];
                const request: ProcessControlRequest = { executionId, userId: this.extractUserId(event) };
                return await this.cancelProcess(request);
            }

            if (path.startsWith('/processes/executions/') && path.endsWith('/progress') && method === 'PUT') {
                const executionId = path.split('/')[3];
                const request = this.validateRequestBody(event, this.validateUpdateProgressRequest);
                request.executionId = executionId;
                return await this.updateProgress(request);
            }

            if (path.startsWith('/processes/executions/') && path.endsWith('/checkpoint') && method === 'POST') {
                const executionId = path.split('/')[3];
                const request = this.validateRequestBody(event, this.validateCreateCheckpointRequest);
                request.executionId = executionId;
                return await this.createCheckpoint(request);
            }

            if (path.startsWith('/processes/executions/') && path.endsWith('/heartbeat') && method === 'POST') {
                const executionId = path.split('/')[3];
                const userId = this.extractUserId(event);
                return await this.recordHeartbeat(executionId, userId);
            }

            if (path.startsWith('/processes/executions/') && method === 'GET') {
                const executionId = path.split('/')[3];
                const userId = this.extractUserId(event);
                return await this.getProcessExecution(executionId, userId);
            }

            if (path === '/processes/executions' && method === 'GET') {
                const userId = this.extractUserId(event);
                const status = event.queryStringParameters?.status;
                return await this.listProcessExecutions(userId, status);
            }

            return this.createErrorResponseData('INVALID_ENDPOINT', 'Endpoint not found', 404);

        } catch (error) {
            this.logger.error('Process manager error:', error);
            return this.createErrorResponseData(
                'PROCESS_MANAGER_ERROR',
                error instanceof Error ? error.message : 'Unknown error',
                500
            );
        }
    }

    private async createProcess(request: CreateProcessRequest): Promise<ApiResponse> {
        const now = new Date().toISOString();
        const definition: ProcessDefinition = {
            ...request.definition,
            userId: request.userId,
            createdAt: now,
            updatedAt: now,
        };

        // Validate process definition
        this.validateProcessDefinition(definition);

        // Store process definition
        const item = {
            PK: `USER#${request.userId}`,
            SK: `PROCESS_DEF#${definition.processId}`,
            Type: 'ProcessDefinition',
            ...definition,
        };

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(item),
            ConditionExpression: 'attribute_not_exists(PK)',
        }));

        await this.publishServiceEvent('process-manager', 'ProcessDefinitionCreated', {
            processId: definition.processId,
            userId: request.userId,
        });

        return this.createSuccessResponse(definition, 201);
    }

    private async startProcess(request: StartProcessRequest): Promise<ApiResponse> {
        // Get process definition
        const definition = await this.getProcessDefinitionById(request.processId, request.userId);
        if (!definition) {
            return this.createErrorResponseData('PROCESS_NOT_FOUND', 'Process definition not found', 404);
        }

        // Create execution
        const executionId = `proc_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const execution: ProcessExecution = {
            executionId,
            processId: request.processId,
            status: 'running',
            progress: {
                totalSteps: 100, // Default, should be updated by the process
                completedSteps: 0,
                currentStep: 'initialization',
                percentage: 0,
            },
            checkpoints: [],
            heartbeats: [],
            startedAt: now,
            updatedAt: now,
            context: request.context,
            userId: request.userId,
        };

        // Store execution
        await this.storeProcessExecution(execution);

        // Record initial heartbeat
        await this.recordHeartbeat(executionId, request.userId);

        await this.publishServiceEvent('process-manager', 'ProcessStarted', {
            executionId,
            processId: request.processId,
            userId: request.userId,
        });

        return this.createSuccessResponse(execution, 201);
    }

    private async pauseProcess(request: ProcessControlRequest): Promise<ApiResponse> {
        const execution = await this.getProcessExecutionById(request.executionId, request.userId);
        if (!execution) {
            return this.createErrorResponseData('EXECUTION_NOT_FOUND', 'Process execution not found', 404);
        }

        if (execution.status !== 'running') {
            return this.createErrorResponseData('INVALID_STATUS', `Cannot pause process in status: ${execution.status}`, 400);
        }

        execution.status = 'paused';
        execution.updatedAt = new Date().toISOString();

        await this.updateProcessExecution(execution);

        await this.publishServiceEvent('process-manager', 'ProcessPaused', {
            executionId: request.executionId,
            userId: request.userId,
        });

        return this.createSuccessResponse(execution);
    }

    private async resumeProcess(request: ProcessControlRequest): Promise<ApiResponse> {
        const execution = await this.getProcessExecutionById(request.executionId, request.userId);
        if (!execution) {
            return this.createErrorResponseData('EXECUTION_NOT_FOUND', 'Process execution not found', 404);
        }

        if (execution.status !== 'paused') {
            return this.createErrorResponseData('INVALID_STATUS', `Cannot resume process in status: ${execution.status}`, 400);
        }

        execution.status = 'running';
        execution.updatedAt = new Date().toISOString();

        await this.updateProcessExecution(execution);

        await this.publishServiceEvent('process-manager', 'ProcessResumed', {
            executionId: request.executionId,
            userId: request.userId,
        });

        return this.createSuccessResponse(execution);
    }

    private async cancelProcess(request: ProcessControlRequest): Promise<ApiResponse> {
        const execution = await this.getProcessExecutionById(request.executionId, request.userId);
        if (!execution) {
            return this.createErrorResponseData('EXECUTION_NOT_FOUND', 'Process execution not found', 404);
        }

        if (execution.status === 'completed' || execution.status === 'cancelled') {
            return this.createErrorResponseData('INVALID_STATUS', `Cannot cancel process in status: ${execution.status}`, 400);
        }

        execution.status = 'cancelled';
        execution.updatedAt = new Date().toISOString();
        execution.completedAt = new Date().toISOString();

        await this.updateProcessExecution(execution);

        await this.publishServiceEvent('process-manager', 'ProcessCancelled', {
            executionId: request.executionId,
            userId: request.userId,
        });

        return this.createSuccessResponse(execution);
    }

    private async updateProgress(request: UpdateProgressRequest): Promise<ApiResponse> {
        const execution = await this.getProcessExecutionById(request.executionId, request.userId);
        if (!execution) {
            return this.createErrorResponseData('EXECUTION_NOT_FOUND', 'Process execution not found', 404);
        }

        // Update progress
        execution.progress = {
            ...execution.progress,
            ...request.progress,
        };

        // Recalculate percentage if steps are provided
        if (request.progress.completedSteps !== undefined || request.progress.totalSteps !== undefined) {
            execution.progress.percentage = Math.round(
                (execution.progress.completedSteps / execution.progress.totalSteps) * 100
            );
        }

        // Check if process is completed
        if (execution.progress.percentage >= 100 && execution.status === 'running') {
            execution.status = 'completed';
            execution.completedAt = new Date().toISOString();
        }

        execution.updatedAt = new Date().toISOString();

        await this.updateProcessExecution(execution);

        await this.publishServiceEvent('process-manager', 'ProcessProgressUpdated', {
            executionId: request.executionId,
            progress: execution.progress,
            userId: request.userId,
        });

        return this.createSuccessResponse(execution.progress);
    }

    private async createCheckpoint(request: CreateCheckpointRequest): Promise<ApiResponse> {
        const execution = await this.getProcessExecutionById(request.executionId, request.userId);
        if (!execution) {
            return this.createErrorResponseData('EXECUTION_NOT_FOUND', 'Process execution not found', 404);
        }

        const checkpoint: ProcessCheckpoint = {
            checkpointId: `cp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            timestamp: new Date().toISOString(),
            step: request.step,
            state: request.state,
            progress: { ...execution.progress },
        };

        execution.checkpoints.push(checkpoint);
        execution.updatedAt = new Date().toISOString();

        await this.updateProcessExecution(execution);

        await this.publishServiceEvent('process-manager', 'ProcessCheckpointCreated', {
            executionId: request.executionId,
            checkpointId: checkpoint.checkpointId,
            userId: request.userId,
        });

        return this.createSuccessResponse(checkpoint, 201);
    }

    private async recordHeartbeat(executionId: string, userId: string): Promise<ApiResponse> {
        const execution = await this.getProcessExecutionById(executionId, userId);
        if (!execution) {
            return this.createErrorResponseData('EXECUTION_NOT_FOUND', 'Process execution not found', 404);
        }

        const heartbeat: ProcessHeartbeat = {
            timestamp: new Date().toISOString(),
            status: execution.status,
            progress: { ...execution.progress },
            metrics: {
                memoryUsage: process.memoryUsage().heapUsed,
                uptime: process.uptime(),
            },
        };

        execution.heartbeats.push(heartbeat);

        // Keep only last 10 heartbeats to avoid excessive storage
        if (execution.heartbeats.length > 10) {
            execution.heartbeats = execution.heartbeats.slice(-10);
        }

        execution.updatedAt = new Date().toISOString();

        await this.updateProcessExecution(execution);

        return this.createSuccessResponse(heartbeat);
    }

    private async getProcessExecution(executionId: string, userId: string): Promise<ApiResponse> {
        const execution = await this.getProcessExecutionById(executionId, userId);
        if (!execution) {
            return this.createErrorResponseData('EXECUTION_NOT_FOUND', 'Process execution not found', 404);
        }

        return this.createSuccessResponse(execution);
    }

    private async listProcessExecutions(userId: string, status?: string): Promise<ApiResponse> {
        try {
            const result = await this.dynamoClient.send(new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: marshall({
                    ':pk': `USER#${userId}`,
                    ':sk': 'PROCESS_EXEC#',
                }),
            }));

            if (!result.Items) {
                return this.createSuccessResponse({ executions: [], count: 0 });
            }

            let executions = result.Items.map(item => unmarshall(item) as ProcessExecution);

            // Filter by status if provided
            if (status) {
                executions = executions.filter(exec => exec.status === status);
            }

            // Sort by start time (newest first)
            executions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

            return this.createSuccessResponse({
                executions,
                count: executions.length,
            });

        } catch (error) {
            this.logger.error('Error listing process executions:', error);
            return this.createErrorResponseData('LIST_EXECUTIONS_FAILED', 'Failed to list process executions', 500);
        }
    }

    private async getProcessDefinitionById(processId: string, userId: string): Promise<ProcessDefinition | null> {
        try {
            const result = await this.dynamoClient.send(new GetItemCommand({
                TableName: this.tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: `PROCESS_DEF#${processId}`,
                }),
            }));

            if (!result.Item) {
                return null;
            }

            const item = unmarshall(result.Item);
            return item as ProcessDefinition;
        } catch (error) {
            this.logger.error('Error getting process definition:', error);
            return null;
        }
    }

    private async getProcessExecutionById(executionId: string, userId: string): Promise<ProcessExecution | null> {
        try {
            const result = await this.dynamoClient.send(new GetItemCommand({
                TableName: this.tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: `PROCESS_EXEC#${executionId}`,
                }),
            }));

            if (!result.Item) {
                return null;
            }

            const item = unmarshall(result.Item);
            return item as ProcessExecution;
        } catch (error) {
            this.logger.error('Error getting process execution:', error);
            return null;
        }
    }

    private async storeProcessExecution(execution: ProcessExecution): Promise<void> {
        const item = {
            PK: `USER#${execution.userId}`,
            SK: `PROCESS_EXEC#${execution.executionId}`,
            Type: 'ProcessExecution',
            ...execution,
        };

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(item),
        }));
    }

    private async updateProcessExecution(execution: ProcessExecution): Promise<void> {
        await this.storeProcessExecution(execution);
    }

    private validateProcessDefinition(definition: ProcessDefinition): void {
        if (!definition.processId || !definition.name || !definition.type) {
            throw new Error('Invalid process definition: missing required fields');
        }

        const validTypes = ['workflow', 'saga', 'batch', 'streaming', 'scheduled'];
        if (!validTypes.includes(definition.type)) {
            throw new Error(`Invalid process type: ${definition.type}`);
        }

        if (definition.timeout <= 0) {
            throw new Error(`Invalid timeout: ${definition.timeout}`);
        }

        if (definition.retryPolicy.maxAttempts < 0) {
            throw new Error(`Invalid retry policy: maxAttempts must be >= 0`);
        }
    }

    // Validation functions
    private validateCreateProcessRequest(data: any): CreateProcessRequest {
        if (!data.definition || !data.userId) {
            throw new Error('Missing required fields: definition, userId');
        }
        return data as CreateProcessRequest;
    }

    private validateStartProcessRequest(data: any): StartProcessRequest {
        if (!data.processId || !data.context || !data.userId) {
            throw new Error('Missing required fields: processId, context, userId');
        }
        return data as StartProcessRequest;
    }

    private validateUpdateProgressRequest(data: any): UpdateProgressRequest {
        if (!data.progress || !data.userId) {
            throw new Error('Missing required fields: progress, userId');
        }
        return data as UpdateProgressRequest;
    }

    private validateCreateCheckpointRequest(data: any): CreateCheckpointRequest {
        if (!data.step || !data.state || !data.userId) {
            throw new Error('Missing required fields: step, state, userId');
        }
        return data as CreateCheckpointRequest;
    }
}

// Export handler
export const handler = new ProcessManagerHandler().lambdaHandler.bind(new ProcessManagerHandler());

// Export types for testing
export {
    ProcessDefinition,
    ProcessExecution,
    ProcessProgress,
    ProcessCheckpoint,
    ProcessHeartbeat,
    CreateProcessRequest,
    StartProcessRequest,
    ProcessControlRequest,
    UpdateProgressRequest,
    CreateCheckpointRequest,
};