/**
 * Circuit Breaker Service
 * 
 * Provides fault tolerance and failure prevention for microservices
 * by implementing the circuit breaker pattern as a centralized service.
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from './base-lambda-template';
import { CircuitBreaker, CircuitBreakerRegistry, CircuitState, CircuitBreakerOptions } from '../utils/circuit-breaker';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import * as AWSXRay from 'aws-xray-sdk-core';

// Service configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'circuit-breaker-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    description: 'Circuit breaker service for fault tolerance and failure prevention',
    enableTracing: true,
    enableCircuitBreaker: false, // Don't use circuit breaker for the circuit breaker service itself
    enableRetry: true,
    healthCheckEnabled: true,
};

// Initialize DynamoDB client
function createDynamoClient(): DynamoDBDocumentClient {
    let dynamoClient: DynamoDBClient;
    try {
        dynamoClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({
            region: process.env.AWS_REGION || 'us-east-1',
        }));
    } catch (error) {
        dynamoClient = new DynamoDBClient({
            region: process.env.AWS_REGION || 'us-east-1',
        });
    }
    return DynamoDBDocumentClient.from(dynamoClient);
}

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent-development';

// Circuit breaker state interface for persistence
interface CircuitBreakerState {
    circuitId: string;
    serviceName: string;
    operationName: string;
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: string;
    nextAttemptTime: string;
    configuration: CircuitBreakerOptions;
    createdAt: string;
    updatedAt: string;
}

// Request interfaces
interface CreateCircuitBreakerRequest {
    serviceName: string;
    operationName: string;
    options?: CircuitBreakerOptions;
}

interface ExecuteWithCircuitBreakerRequest {
    circuitId: string;
    operation: 'execute' | 'check-state' | 'reset' | 'open';
}

interface CircuitBreakerExecutionResult {
    allowed: boolean;
    state: CircuitState;
    reason?: string;
    nextAttemptTime?: string;
}

/**
 * Circuit Breaker Service Handler
 */
class CircuitBreakerServiceHandler extends BaseLambdaHandler {
    private docClient: DynamoDBDocumentClient;
    private localRegistry: CircuitBreakerRegistry;

    constructor() {
        super(SERVICE_CONFIG);
        this.docClient = createDynamoClient();
        this.localRegistry = new CircuitBreakerRegistry();
    }

    /**
     * Handle incoming API requests
     */
    public async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const { httpMethod, path, body, queryStringParameters } = event;
        const routeKey = `${httpMethod} ${path}`;

        this.logger.info('Processing circuit breaker request', {
            method: httpMethod,
            path,
            routeKey,
        });

        try {
            let response: ApiResponse;

            switch (routeKey) {
                case 'POST /circuit-breakers':
                    response = await this.createCircuitBreaker(body);
                    break;

                case 'GET /circuit-breakers':
                    response = await this.listCircuitBreakers(queryStringParameters || {});
                    break;

                case 'GET /circuit-breakers/{id}':
                    response = await this.getCircuitBreaker(event.pathParameters?.id);
                    break;

                case 'POST /circuit-breakers/{id}/execute':
                    response = await this.executeWithCircuitBreaker(event.pathParameters?.id, body);
                    break;

                case 'POST /circuit-breakers/{id}/record-success':
                    response = await this.recordSuccess(event.pathParameters?.id);
                    break;

                case 'POST /circuit-breakers/{id}/record-failure':
                    response = await this.recordFailure(event.pathParameters?.id, body);
                    break;

                case 'POST /circuit-breakers/{id}/reset':
                    response = await this.resetCircuitBreaker(event.pathParameters?.id);
                    break;

                case 'POST /circuit-breakers/{id}/open':
                    response = await this.openCircuitBreaker(event.pathParameters?.id);
                    break;

                case 'GET /circuit-breakers/stats':
                    response = await this.getCircuitBreakerStats();
                    break;

                case 'GET /health':
                    response = this.createHealthCheckResponse();
                    break;

                default:
                    response = this.createErrorResponseData('ROUTE_NOT_FOUND', 'Endpoint not found', 404);
            }

            return response;

        } catch (error) {
            this.logger.error('Circuit breaker request failed', error);
            return this.createErrorResponseData(
                'INTERNAL_ERROR',
                error instanceof Error ? error.message : 'Internal server error',
                500
            );
        }
    }

    /**
     * Create a new circuit breaker
     */
    private async createCircuitBreaker(body: string | null): Promise<ApiResponse> {
        if (!body) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Request body is required', 400);
        }

        try {
            const request = JSON.parse(body) as CreateCircuitBreakerRequest;

            if (!request.serviceName || !request.operationName) {
                return this.createErrorResponseData(
                    'VALIDATION_ERROR',
                    'serviceName and operationName are required',
                    400
                );
            }

            const circuitId = `${request.serviceName}-${request.operationName}`;
            const now = new Date().toISOString();

            const circuitBreakerState: CircuitBreakerState = {
                circuitId,
                serviceName: request.serviceName,
                operationName: request.operationName,
                state: CircuitState.CLOSED,
                failureCount: 0,
                successCount: 0,
                lastFailureTime: '',
                nextAttemptTime: '',
                configuration: request.options || {},
                createdAt: now,
                updatedAt: now,
            };

            // Store in DynamoDB
            await this.docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: `CIRCUIT_BREAKER#${circuitId}`,
                    SK: 'STATE',
                    EntityType: 'CIRCUIT_BREAKER_STATE',
                    GSI1PK: `SERVICE#${request.serviceName}`,
                    GSI1SK: `OPERATION#${request.operationName}`,
                    ...circuitBreakerState,
                    TTL: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days TTL
                },
            }));

            // Create local circuit breaker instance
            this.localRegistry.getOrCreate(circuitId, request.options);

            this.logger.info('Circuit breaker created', {
                circuitId,
                serviceName: request.serviceName,
                operationName: request.operationName,
            });

            return this.createSuccessResponse({
                circuitId,
                serviceName: request.serviceName,
                operationName: request.operationName,
                state: CircuitState.CLOSED,
                message: 'Circuit breaker created successfully',
            }, 201);

        } catch (error) {
            this.logger.error('Failed to create circuit breaker', error);
            return this.createErrorResponseData(
                'CREATION_FAILED',
                error instanceof Error ? error.message : 'Circuit breaker creation failed',
                500
            );
        }
    }

    /**
     * List circuit breakers
     */
    private async listCircuitBreakers(queryParams: Record<string, string>): Promise<ApiResponse> {
        try {
            const serviceName = queryParams.serviceName;
            let params: any;

            if (serviceName) {
                // Query by service name using GSI1
                params = {
                    TableName: TABLE_NAME,
                    IndexName: 'GSI1',
                    KeyConditionExpression: 'GSI1PK = :gsi1pk',
                    ExpressionAttributeValues: {
                        ':gsi1pk': `SERVICE#${serviceName}`,
                    },
                };
            } else {
                // Scan all circuit breakers
                params = {
                    TableName: TABLE_NAME,
                    FilterExpression: 'EntityType = :entityType',
                    ExpressionAttributeValues: {
                        ':entityType': 'CIRCUIT_BREAKER_STATE',
                    },
                };
            }

            const command = serviceName ? new QueryCommand(params) : new QueryCommand(params);
            const result = await this.docClient.send(command);

            const circuitBreakers = (result.Items || []) as CircuitBreakerState[];

            this.logger.info('Circuit breakers listed', {
                count: circuitBreakers.length,
                serviceName,
            });

            return this.createSuccessResponse({
                circuitBreakers,
                count: circuitBreakers.length,
            });

        } catch (error) {
            this.logger.error('Failed to list circuit breakers', error);
            return this.createErrorResponseData(
                'LIST_FAILED',
                error instanceof Error ? error.message : 'Failed to list circuit breakers',
                500
            );
        }
    }

    /**
     * Get a specific circuit breaker
     */
    private async getCircuitBreaker(circuitId: string | undefined): Promise<ApiResponse> {
        if (!circuitId) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Circuit ID is required', 400);
        }

        try {
            const result = await this.docClient.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `CIRCUIT_BREAKER#${circuitId}`,
                    SK: 'STATE',
                },
            }));

            if (!result.Item) {
                return this.createErrorResponseData('NOT_FOUND', 'Circuit breaker not found', 404);
            }

            const circuitBreakerState = result.Item as CircuitBreakerState;

            this.logger.info('Circuit breaker retrieved', {
                circuitId,
                state: circuitBreakerState.state,
            });

            return this.createSuccessResponse(circuitBreakerState);

        } catch (error) {
            this.logger.error('Failed to get circuit breaker', error);
            return this.createErrorResponseData(
                'GET_FAILED',
                error instanceof Error ? error.message : 'Failed to get circuit breaker',
                500
            );
        }
    }

    /**
     * Execute operation with circuit breaker protection
     */
    private async executeWithCircuitBreaker(circuitId: string | undefined, body: string | null): Promise<ApiResponse> {
        if (!circuitId) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Circuit ID is required', 400);
        }

        try {
            // Get current circuit breaker state
            const circuitBreakerState = await this.getCircuitBreakerState(circuitId);
            if (!circuitBreakerState) {
                return this.createErrorResponseData('NOT_FOUND', 'Circuit breaker not found', 404);
            }

            // Get or create local circuit breaker
            const circuitBreaker = this.localRegistry.getOrCreate(circuitId, circuitBreakerState.configuration);

            // Sync state from database
            await this.syncCircuitBreakerState(circuitBreaker, circuitBreakerState);

            const result: CircuitBreakerExecutionResult = {
                allowed: false,
                state: circuitBreaker.getState(),
            };

            // Check if execution is allowed
            if (circuitBreaker.getState() === CircuitState.OPEN) {
                const stats = circuitBreaker.getStats();
                if (Date.now() < stats.nextAttemptTime) {
                    result.allowed = false;
                    result.reason = 'Circuit breaker is OPEN';
                    result.nextAttemptTime = new Date(stats.nextAttemptTime).toISOString();
                } else {
                    // Time to try recovery
                    result.allowed = true;
                    result.reason = 'Attempting recovery (HALF_OPEN)';
                }
            } else {
                result.allowed = true;
            }

            this.logger.info('Circuit breaker execution check', {
                circuitId,
                allowed: result.allowed,
                state: result.state,
                reason: result.reason,
            });

            return this.createSuccessResponse(result);

        } catch (error) {
            this.logger.error('Failed to execute with circuit breaker', error);
            return this.createErrorResponseData(
                'EXECUTION_FAILED',
                error instanceof Error ? error.message : 'Circuit breaker execution failed',
                500
            );
        }
    }

    /**
     * Record successful operation
     */
    private async recordSuccess(circuitId: string | undefined): Promise<ApiResponse> {
        if (!circuitId) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Circuit ID is required', 400);
        }

        try {
            const circuitBreakerState = await this.getCircuitBreakerState(circuitId);
            if (!circuitBreakerState) {
                return this.createErrorResponseData('NOT_FOUND', 'Circuit breaker not found', 404);
            }

            const circuitBreaker = this.localRegistry.getOrCreate(circuitId, circuitBreakerState.configuration);
            await this.syncCircuitBreakerState(circuitBreaker, circuitBreakerState);

            // Simulate success by executing a successful operation
            await circuitBreaker.execute(async () => Promise.resolve('success'));

            // Update state in database
            await this.updateCircuitBreakerState(circuitId, circuitBreaker);

            this.logger.info('Success recorded for circuit breaker', {
                circuitId,
                newState: circuitBreaker.getState(),
            });

            return this.createSuccessResponse({
                circuitId,
                state: circuitBreaker.getState(),
                stats: circuitBreaker.getStats(),
                message: 'Success recorded successfully',
            });

        } catch (error) {
            this.logger.error('Failed to record success', error);
            return this.createErrorResponseData(
                'RECORD_FAILED',
                error instanceof Error ? error.message : 'Failed to record success',
                500
            );
        }
    }

    /**
     * Record failed operation
     */
    private async recordFailure(circuitId: string | undefined, body: string | null): Promise<ApiResponse> {
        if (!circuitId) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Circuit ID is required', 400);
        }

        try {
            const errorMessage = body ? JSON.parse(body).error || 'Operation failed' : 'Operation failed';

            const circuitBreakerState = await this.getCircuitBreakerState(circuitId);
            if (!circuitBreakerState) {
                return this.createErrorResponseData('NOT_FOUND', 'Circuit breaker not found', 404);
            }

            const circuitBreaker = this.localRegistry.getOrCreate(circuitId, circuitBreakerState.configuration);
            await this.syncCircuitBreakerState(circuitBreaker, circuitBreakerState);

            // Simulate failure by executing a failing operation
            try {
                await circuitBreaker.execute(async () => {
                    throw new Error(errorMessage);
                });
            } catch (error) {
                // Expected to fail
            }

            // Update state in database
            await this.updateCircuitBreakerState(circuitId, circuitBreaker);

            this.logger.info('Failure recorded for circuit breaker', {
                circuitId,
                newState: circuitBreaker.getState(),
                error: errorMessage,
            });

            return this.createSuccessResponse({
                circuitId,
                state: circuitBreaker.getState(),
                stats: circuitBreaker.getStats(),
                message: 'Failure recorded successfully',
            });

        } catch (error) {
            this.logger.error('Failed to record failure', error);
            return this.createErrorResponseData(
                'RECORD_FAILED',
                error instanceof Error ? error.message : 'Failed to record failure',
                500
            );
        }
    }

    /**
     * Reset circuit breaker
     */
    private async resetCircuitBreaker(circuitId: string | undefined): Promise<ApiResponse> {
        if (!circuitId) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Circuit ID is required', 400);
        }

        try {
            const circuitBreakerState = await this.getCircuitBreakerState(circuitId);
            if (!circuitBreakerState) {
                return this.createErrorResponseData('NOT_FOUND', 'Circuit breaker not found', 404);
            }

            const circuitBreaker = this.localRegistry.getOrCreate(circuitId, circuitBreakerState.configuration);
            circuitBreaker.reset();

            // Update state in database
            await this.updateCircuitBreakerState(circuitId, circuitBreaker);

            this.logger.info('Circuit breaker reset', {
                circuitId,
                newState: circuitBreaker.getState(),
            });

            return this.createSuccessResponse({
                circuitId,
                state: circuitBreaker.getState(),
                stats: circuitBreaker.getStats(),
                message: 'Circuit breaker reset successfully',
            });

        } catch (error) {
            this.logger.error('Failed to reset circuit breaker', error);
            return this.createErrorResponseData(
                'RESET_FAILED',
                error instanceof Error ? error.message : 'Failed to reset circuit breaker',
                500
            );
        }
    }

    /**
     * Manually open circuit breaker
     */
    private async openCircuitBreaker(circuitId: string | undefined): Promise<ApiResponse> {
        if (!circuitId) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Circuit ID is required', 400);
        }

        try {
            const circuitBreakerState = await this.getCircuitBreakerState(circuitId);
            if (!circuitBreakerState) {
                return this.createErrorResponseData('NOT_FOUND', 'Circuit breaker not found', 404);
            }

            const circuitBreaker = this.localRegistry.getOrCreate(circuitId, circuitBreakerState.configuration);
            circuitBreaker.open();

            // Update state in database
            await this.updateCircuitBreakerState(circuitId, circuitBreaker);

            this.logger.info('Circuit breaker opened manually', {
                circuitId,
                newState: circuitBreaker.getState(),
            });

            return this.createSuccessResponse({
                circuitId,
                state: circuitBreaker.getState(),
                stats: circuitBreaker.getStats(),
                message: 'Circuit breaker opened successfully',
            });

        } catch (error) {
            this.logger.error('Failed to open circuit breaker', error);
            return this.createErrorResponseData(
                'OPEN_FAILED',
                error instanceof Error ? error.message : 'Failed to open circuit breaker',
                500
            );
        }
    }

    /**
     * Get circuit breaker statistics
     */
    private async getCircuitBreakerStats(): Promise<ApiResponse> {
        try {
            // Get all circuit breakers from database
            const result = await this.docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                FilterExpression: 'EntityType = :entityType',
                ExpressionAttributeValues: {
                    ':entityType': 'CIRCUIT_BREAKER_STATE',
                },
            }));

            const circuitBreakers = (result.Items || []) as CircuitBreakerState[];

            const stats = {
                totalCircuitBreakers: circuitBreakers.length,
                closedCircuitBreakers: circuitBreakers.filter(cb => cb.state === CircuitState.CLOSED).length,
                openCircuitBreakers: circuitBreakers.filter(cb => cb.state === CircuitState.OPEN).length,
                halfOpenCircuitBreakers: circuitBreakers.filter(cb => cb.state === CircuitState.HALF_OPEN).length,
                circuitBreakersByService: {} as Record<string, number>,
                circuitBreakers: circuitBreakers.map(cb => ({
                    circuitId: cb.circuitId,
                    serviceName: cb.serviceName,
                    operationName: cb.operationName,
                    state: cb.state,
                    failureCount: cb.failureCount,
                    lastFailureTime: cb.lastFailureTime,
                })),
            };

            // Count by service
            for (const cb of circuitBreakers) {
                stats.circuitBreakersByService[cb.serviceName] = (stats.circuitBreakersByService[cb.serviceName] || 0) + 1;
            }

            this.logger.info('Circuit breaker stats retrieved', {
                totalCircuitBreakers: stats.totalCircuitBreakers,
                openCircuitBreakers: stats.openCircuitBreakers,
            });

            return this.createSuccessResponse(stats);

        } catch (error) {
            this.logger.error('Failed to get circuit breaker stats', error);
            return this.createErrorResponseData(
                'STATS_FAILED',
                error instanceof Error ? error.message : 'Failed to get circuit breaker stats',
                500
            );
        }
    }

    /**
     * Get circuit breaker state from database
     */
    private async getCircuitBreakerState(circuitId: string): Promise<CircuitBreakerState | null> {
        const result = await this.docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `CIRCUIT_BREAKER#${circuitId}`,
                SK: 'STATE',
            },
        }));

        return result.Item as CircuitBreakerState || null;
    }

    /**
     * Sync local circuit breaker state with database state
     */
    private async syncCircuitBreakerState(circuitBreaker: CircuitBreaker, dbState: CircuitBreakerState): Promise<void> {
        // This is a simplified sync - in production you'd want more sophisticated state management
        const stats = circuitBreaker.getStats();

        if (stats.state !== dbState.state) {
            // Reset and apply database state
            circuitBreaker.reset();

            if (dbState.state === CircuitState.OPEN) {
                circuitBreaker.open();
            }
        }
    }

    /**
     * Update circuit breaker state in database
     */
    private async updateCircuitBreakerState(circuitId: string, circuitBreaker: CircuitBreaker): Promise<void> {
        const stats = circuitBreaker.getStats();
        const now = new Date().toISOString();

        await this.docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `CIRCUIT_BREAKER#${circuitId}`,
                SK: 'STATE',
            },
            UpdateExpression: 'SET #state = :state, failureCount = :failureCount, successCount = :successCount, nextAttemptTime = :nextAttemptTime, updatedAt = :updatedAt, TTL = :ttl',
            ExpressionAttributeNames: {
                '#state': 'state',
            },
            ExpressionAttributeValues: {
                ':state': stats.state,
                ':failureCount': stats.failureCount,
                ':successCount': stats.successCount,
                ':nextAttemptTime': new Date(stats.nextAttemptTime).toISOString(),
                ':updatedAt': now,
                ':ttl': Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // Extend TTL
            },
        }));
    }
}

// Create handler instance
const handlerInstance = new CircuitBreakerServiceHandler();

/**
 * Lambda handler entry point
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
    return handlerInstance.lambdaHandler(event, context);
};