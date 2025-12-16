/**
 * Workflow Engine Service
 * 
 * Manages multi-step workflows with state management and error handling.
 * Supports workflow execution, pause/resume, cancellation, and step tracking.
 * 
 * **Feature: microservices-architecture-enhancement**
 * **Validates: Requirements 10.1**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from './base-lambda-template';
import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Workflow types
interface WorkflowDefinition {
    workflowId: string;
    name: string;
    version: string;
    steps: WorkflowStep[];
    errorHandling: ErrorHandlingConfig;
    timeout: number;
    retryPolicy: RetryPolicy;
    createdAt: string;
    updatedAt: string;
}

interface WorkflowStep {
    stepId: string;
    name: string;
    type: 'service_call' | 'decision' | 'parallel' | 'wait' | 'human_task';
    config: Record<string, any>;
    nextSteps: string[];
    errorHandlers: string[];
    timeout?: number;
}

interface WorkflowExecution {
    executionId: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
    currentStep: string;
    stepHistory: StepExecution[];
    context: Record<string, any>;
    startedAt: string;
    updatedAt: string;
    completedAt?: string;
    error?: WorkflowError;
    userId: string;
}

interface StepExecution {
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startedAt: string;
    completedAt?: string;
    input: Record<string, any>;
    output?: Record<string, any>;
    error?: WorkflowError;
    retryCount: number;
}

interface WorkflowError {
    code: string;
    message: string;
    details?: Record<string, any>;
    recoverable: boolean;
}

interface ErrorHandlingConfig {
    onFailure: 'retry' | 'compensate' | 'abort' | 'continue';
    maxRetries: number;
    retryDelay: number;
    compensationSteps: string[];
}

interface RetryPolicy {
    maxAttempts: number;
    initialDelay: number;
    backoffMultiplier: number;
    maxDelay: number;
}

// Request/Response types
interface StartWorkflowRequest {
    workflowId: string;
    context?: Record<string, any>;
    userId: string;
}

interface ExecuteStepRequest {
    executionId: string;
    stepId: string;
    input: Record<string, any>;
    userId: string;
}

interface WorkflowControlRequest {
    executionId: string;
    userId: string;
}

interface CreateWorkflowRequest {
    definition: Omit<WorkflowDefinition, 'createdAt' | 'updatedAt'>;
    userId: string;
}

/**
 * Workflow Engine Service Handler
 */
class WorkflowEngineHandler extends BaseLambdaHandler {
    private dynamoClient: DynamoDBClient;
    private tableName: string;

    constructor() {
        const config: ServiceConfig = {
            serviceName: 'workflow-engine-service',
            version: '1.0.0',
            description: 'Manages multi-step workflows with state management and error handling',
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
            if (path === '/workflows' && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateCreateWorkflowRequest);
                return await this.createWorkflow(request);
            }

            if (path === '/workflows/start' && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateStartWorkflowRequest);
                return await this.startWorkflow(request);
            }

            if (path.startsWith('/workflows/') && path.endsWith('/execute') && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateExecuteStepRequest);
                return await this.executeStep(request);
            }

            if (path.startsWith('/workflows/') && path.endsWith('/pause') && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateWorkflowControlRequest);
                return await this.pauseWorkflow(request);
            }

            if (path.startsWith('/workflows/') && path.endsWith('/resume') && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateWorkflowControlRequest);
                return await this.resumeWorkflow(request);
            }

            if (path.startsWith('/workflows/') && path.endsWith('/cancel') && method === 'POST') {
                const request = this.validateRequestBody(event, this.validateWorkflowControlRequest);
                return await this.cancelWorkflow(request);
            }

            if (path.startsWith('/workflows/') && method === 'GET') {
                const executionId = path.split('/')[2];
                const userId = this.extractUserId(event);
                return await this.getWorkflowExecution(executionId, userId);
            }

            return this.createErrorResponseData('INVALID_ENDPOINT', 'Endpoint not found', 404);

        } catch (error) {
            this.logger.error('Workflow engine error:', error);
            return this.createErrorResponseData(
                'WORKFLOW_ENGINE_ERROR',
                error instanceof Error ? error.message : 'Unknown error',
                500
            );
        }
    }

    private async createWorkflow(request: CreateWorkflowRequest): Promise<ApiResponse> {
        const now = new Date().toISOString();
        const definition: WorkflowDefinition = {
            ...request.definition,
            createdAt: now,
            updatedAt: now,
        };

        // Validate workflow definition
        this.validateWorkflowDefinition(definition);

        // Store workflow definition
        const item = {
            PK: `USER#${request.userId}`,
            SK: `WORKFLOW_DEF#${definition.workflowId}`,
            Type: 'WorkflowDefinition',
            ...definition,
        };

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(item),
            ConditionExpression: 'attribute_not_exists(PK)',
        }));

        await this.publishServiceEvent('workflow-engine', 'WorkflowDefinitionCreated', {
            workflowId: definition.workflowId,
            userId: request.userId,
        });

        return this.createSuccessResponse(definition, 201);
    }

    private async startWorkflow(request: StartWorkflowRequest): Promise<ApiResponse> {
        // Get workflow definition
        const definition = await this.getWorkflowDefinition(request.workflowId, request.userId);
        if (!definition) {
            return this.createErrorResponseData('WORKFLOW_NOT_FOUND', 'Workflow definition not found', 404);
        }

        // Create execution
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const execution: WorkflowExecution = {
            executionId,
            workflowId: request.workflowId,
            status: 'running',
            currentStep: definition.steps[0]?.stepId || '',
            stepHistory: [],
            context: request.context || {},
            startedAt: now,
            updatedAt: now,
            userId: request.userId,
        };

        // Store execution
        const item = {
            PK: `USER#${request.userId}`,
            SK: `WORKFLOW_EXEC#${executionId}`,
            Type: 'WorkflowExecution',
            ...execution,
        };

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(item),
        }));

        await this.publishServiceEvent('workflow-engine', 'WorkflowStarted', {
            executionId,
            workflowId: request.workflowId,
            userId: request.userId,
        });

        return this.createSuccessResponse(execution, 201);
    }

    private async executeStep(request: ExecuteStepRequest): Promise<ApiResponse> {
        // Get execution
        const execution = await this.getWorkflowExecutionById(request.executionId, request.userId);
        if (!execution) {
            return this.createErrorResponseData('EXECUTION_NOT_FOUND', 'Workflow execution not found', 404);
        }

        if (execution.status !== 'running') {
            return this.createErrorResponseData('INVALID_STATUS', `Cannot execute step in status: ${execution.status}`, 400);
        }

        // Get workflow definition
        const definition = await this.getWorkflowDefinition(execution.workflowId, request.userId);
        if (!definition) {
            return this.createErrorResponseData('WORKFLOW_NOT_FOUND', 'Workflow definition not found', 404);
        }

        // Find step
        const step = definition.steps.find(s => s.stepId === request.stepId);
        if (!step) {
            return this.createErrorResponseData('STEP_NOT_FOUND', `Step not found: ${request.stepId}`, 404);
        }

        // Execute step
        const updatedExecution = await this.executeWorkflowStep(execution, step, request.input, definition);

        // Update execution in database
        await this.updateWorkflowExecution(updatedExecution);

        await this.publishServiceEvent('workflow-engine', 'StepExecuted', {
            executionId: request.executionId,
            stepId: request.stepId,
            status: updatedExecution.status,
            userId: request.userId,
        });

        return this.createSuccessResponse(updatedExecution);
    }

    private async pauseWorkflow(request: WorkflowControlRequest): Promise<ApiResponse> {
        const execution = await this.getWorkflowExecutionById(request.executionId, request.userId);
        if (!execution) {
            return this.createErrorResponseData('EXECUTION_NOT_FOUND', 'Workflow execution not found', 404);
        }

        if (execution.status !== 'running') {
            return this.createErrorResponseData('INVALID_STATUS', `Cannot pause workflow in status: ${execution.status}`, 400);
        }

        execution.status = 'paused';
        execution.updatedAt = new Date().toISOString();

        await this.updateWorkflowExecution(execution);

        await this.publishServiceEvent('workflow-engine', 'WorkflowPaused', {
            executionId: request.executionId,
            userId: request.userId,
        });

        return this.createSuccessResponse(execution);
    }

    private async resumeWorkflow(request: WorkflowControlRequest): Promise<ApiResponse> {
        const execution = await this.getWorkflowExecutionById(request.executionId, request.userId);
        if (!execution) {
            return this.createErrorResponseData('EXECUTION_NOT_FOUND', 'Workflow execution not found', 404);
        }

        if (execution.status !== 'paused') {
            return this.createErrorResponseData('INVALID_STATUS', `Cannot resume workflow in status: ${execution.status}`, 400);
        }

        execution.status = 'running';
        execution.updatedAt = new Date().toISOString();

        await this.updateWorkflowExecution(execution);

        await this.publishServiceEvent('workflow-engine', 'WorkflowResumed', {
            executionId: request.executionId,
            userId: request.userId,
        });

        return this.createSuccessResponse(execution);
    }

    private async cancelWorkflow(request: WorkflowControlRequest): Promise<ApiResponse> {
        const execution = await this.getWorkflowExecutionById(request.executionId, request.userId);
        if (!execution) {
            return this.createErrorResponseData('EXECUTION_NOT_FOUND', 'Workflow execution not found', 404);
        }

        if (execution.status === 'completed' || execution.status === 'cancelled') {
            return this.createErrorResponseData('INVALID_STATUS', `Cannot cancel workflow in status: ${execution.status}`, 400);
        }

        execution.status = 'cancelled';
        execution.updatedAt = new Date().toISOString();
        execution.completedAt = new Date().toISOString();

        await this.updateWorkflowExecution(execution);

        await this.publishServiceEvent('workflow-engine', 'WorkflowCancelled', {
            executionId: request.executionId,
            userId: request.userId,
        });

        return this.createSuccessResponse(execution);
    }

    private async getWorkflowExecution(executionId: string, userId: string): Promise<ApiResponse> {
        const execution = await this.getWorkflowExecutionById(executionId, userId);
        if (!execution) {
            return this.createErrorResponseData('EXECUTION_NOT_FOUND', 'Workflow execution not found', 404);
        }

        return this.createSuccessResponse(execution);
    }

    private async executeWorkflowStep(
        execution: WorkflowExecution,
        step: WorkflowStep,
        input: Record<string, any>,
        definition: WorkflowDefinition
    ): Promise<WorkflowExecution> {
        const now = new Date().toISOString();
        const stepExecution: StepExecution = {
            stepId: step.stepId,
            status: 'running',
            startedAt: now,
            input,
            retryCount: 0,
        };

        try {
            // Simulate step execution based on type
            const output = await this.simulateStepExecution(step, input, execution.context);

            stepExecution.status = 'completed';
            stepExecution.completedAt = new Date().toISOString();
            stepExecution.output = output;

            // Update execution context
            execution.context = { ...execution.context, ...output };

            // Determine next step
            if (step.nextSteps.length > 0) {
                execution.currentStep = step.nextSteps[0]; // Simple linear progression
            } else {
                execution.status = 'completed';
                execution.completedAt = new Date().toISOString();
            }

        } catch (error) {
            stepExecution.status = 'failed';
            stepExecution.completedAt = new Date().toISOString();
            stepExecution.error = {
                code: 'STEP_EXECUTION_FAILED',
                message: error instanceof Error ? error.message : 'Step execution failed',
                recoverable: true,
            };

            execution.status = 'failed';
            execution.error = stepExecution.error;
        }

        execution.stepHistory.push(stepExecution);
        execution.updatedAt = new Date().toISOString();

        return execution;
    }

    private async simulateStepExecution(
        step: WorkflowStep,
        input: Record<string, any>,
        context: Record<string, any>
    ): Promise<Record<string, any>> {
        // Simulate different step types
        switch (step.type) {
            case 'service_call':
                return { serviceResult: 'success', timestamp: new Date().toISOString() };
            case 'decision':
                return { decision: 'approve', reason: 'Automated approval' };
            case 'parallel':
                return { parallelResults: ['result1', 'result2'], completedTasks: 2 };
            case 'wait':
                return { waitCompleted: true, duration: 1000 };
            case 'human_task':
                return { humanTaskResult: 'completed', assignee: 'system' };
            default:
                return { result: 'completed' };
        }
    }

    private async getWorkflowDefinition(workflowId: string, userId: string): Promise<WorkflowDefinition | null> {
        try {
            const result = await this.dynamoClient.send(new GetItemCommand({
                TableName: this.tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: `WORKFLOW_DEF#${workflowId}`,
                }),
            }));

            if (!result.Item) {
                return null;
            }

            const item = unmarshall(result.Item);
            return item as WorkflowDefinition;
        } catch (error) {
            this.logger.error('Error getting workflow definition:', error);
            return null;
        }
    }

    private async getWorkflowExecutionById(executionId: string, userId: string): Promise<WorkflowExecution | null> {
        try {
            const result = await this.dynamoClient.send(new GetItemCommand({
                TableName: this.tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: `WORKFLOW_EXEC#${executionId}`,
                }),
            }));

            if (!result.Item) {
                return null;
            }

            const item = unmarshall(result.Item);
            return item as WorkflowExecution;
        } catch (error) {
            this.logger.error('Error getting workflow execution:', error);
            return null;
        }
    }

    private async updateWorkflowExecution(execution: WorkflowExecution): Promise<void> {
        const item = {
            PK: `USER#${execution.userId}`,
            SK: `WORKFLOW_EXEC#${execution.executionId}`,
            Type: 'WorkflowExecution',
            ...execution,
        };

        await this.dynamoClient.send(new PutItemCommand({
            TableName: this.tableName,
            Item: marshall(item),
        }));
    }

    private validateWorkflowDefinition(definition: WorkflowDefinition): void {
        if (!definition.workflowId || !definition.name || !definition.steps || definition.steps.length === 0) {
            throw new Error('Invalid workflow definition: missing required fields');
        }

        // Validate steps
        const stepIds = new Set<string>();
        for (const step of definition.steps) {
            if (!step.stepId || !step.name || !step.type) {
                throw new Error('Invalid step: missing required fields');
            }

            if (stepIds.has(step.stepId)) {
                throw new Error(`Duplicate step ID: ${step.stepId}`);
            }
            stepIds.add(step.stepId);
        }

        // Validate step references
        for (const step of definition.steps) {
            for (const nextStepId of step.nextSteps) {
                if (!stepIds.has(nextStepId)) {
                    throw new Error(`Invalid next step reference: ${nextStepId}`);
                }
            }
        }
    }

    // Validation functions
    private validateCreateWorkflowRequest(data: any): CreateWorkflowRequest {
        if (!data.definition || !data.userId) {
            throw new Error('Missing required fields: definition, userId');
        }
        return data as CreateWorkflowRequest;
    }

    private validateStartWorkflowRequest(data: any): StartWorkflowRequest {
        if (!data.workflowId || !data.userId) {
            throw new Error('Missing required fields: workflowId, userId');
        }
        return data as StartWorkflowRequest;
    }

    private validateExecuteStepRequest(data: any): ExecuteStepRequest {
        if (!data.executionId || !data.stepId || !data.userId) {
            throw new Error('Missing required fields: executionId, stepId, userId');
        }
        return data as ExecuteStepRequest;
    }

    private validateWorkflowControlRequest(data: any): WorkflowControlRequest {
        if (!data.executionId || !data.userId) {
            throw new Error('Missing required fields: executionId, userId');
        }
        return data as WorkflowControlRequest;
    }
}

// Export handler
export const handler = new WorkflowEngineHandler().lambdaHandler.bind(new WorkflowEngineHandler());

// Export types for testing
export {
    WorkflowDefinition,
    WorkflowExecution,
    WorkflowStep,
    StepExecution,
    WorkflowError,
    StartWorkflowRequest,
    ExecuteStepRequest,
    WorkflowControlRequest,
    CreateWorkflowRequest,
};