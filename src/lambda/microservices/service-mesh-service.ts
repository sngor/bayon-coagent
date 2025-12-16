/**
 * Service Mesh Service
 * 
 * Provides service-to-service communication management including
 * load balancing, service discovery integration, and communication policies.
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from './base-lambda-template';
import { ServiceDiscoveryClient, ServiceRegistration } from './service-discovery';
import { CircuitBreakerRegistry } from '../utils/circuit-breaker';
import { retry } from '../utils/retry';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import * as AWSXRay from 'aws-xray-sdk-core';

// Service configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'service-mesh-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    description: 'Service mesh for service-to-service communication management',
    enableTracing: true,
    enableCircuitBreaker: true,
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

// Service communication policy
interface CommunicationPolicy {
    policyId: string;
    sourceService: string;
    targetService: string;
    allowedMethods: string[];
    loadBalancingStrategy: 'round-robin' | 'least-connections' | 'random' | 'weighted';
    timeout: number;
    retries: number;
    circuitBreaker: boolean;
    authentication: {
        required: boolean;
        type: 'none' | 'mutual-tls' | 'jwt' | 'api-key';
        config?: Record<string, any>;
    };
    rateLimit?: {
        requestsPerSecond: number;
        burstLimit: number;
    };
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

// Service communication request
interface ServiceCommunicationRequest {
    sourceService: string;
    targetService: string;
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
    retries?: number;
}

// Load balancer state
interface LoadBalancerState {
    targetService: string;
    strategy: string;
    lastSelectedIndex: number;
    connectionCounts: Record<string, number>;
    weights: Record<string, number>;
}

// Service communication metrics
interface CommunicationMetrics {
    sourceService: string;
    targetService: string;
    method: string;
    requestCount: number;
    successCount: number;
    errorCount: number;
    averageLatency: number;
    lastRequest: string;
}

/**
 * Service Mesh Service Handler
 */
class ServiceMeshServiceHandler extends BaseLambdaHandler {
    private docClient: DynamoDBDocumentClient;
    private serviceDiscovery: ServiceDiscoveryClient;
    private circuitBreakerRegistry: CircuitBreakerRegistry;
    private loadBalancerStates: Map<string, LoadBalancerState> = new Map();
    private metricsCache: Map<string, CommunicationMetrics> = new Map();

    constructor() {
        super(SERVICE_CONFIG);
        this.docClient = createDynamoClient();
        this.serviceDiscovery = ServiceDiscoveryClient.getInstance();
        this.circuitBreakerRegistry = new CircuitBreakerRegistry();
    }

    /**
     * Handle incoming API requests
     */
    public async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const { httpMethod, path, body, queryStringParameters } = event;
        const routeKey = `${httpMethod} ${path}`;

        this.logger.info('Processing service mesh request', {
            method: httpMethod,
            path,
            routeKey,
        });

        try {
            let response: ApiResponse;

            switch (routeKey) {
                case 'POST /policies':
                    response = await this.createCommunicationPolicy(body);
                    break;

                case 'GET /policies':
                    response = await this.listCommunicationPolicies(queryStringParameters || {});
                    break;

                case 'GET /policies/{id}':
                    response = await this.getCommunicationPolicy(event.pathParameters?.id);
                    break;

                case 'PUT /policies/{id}':
                    response = await this.updateCommunicationPolicy(event.pathParameters?.id, body);
                    break;

                case 'DELETE /policies/{id}':
                    response = await this.deleteCommunicationPolicy(event.pathParameters?.id);
                    break;

                case 'POST /communicate':
                    response = await this.handleServiceCommunication(body);
                    break;

                case 'GET /topology':
                    response = await this.getServiceTopology();
                    break;

                case 'GET /metrics':
                    response = await this.getCommunicationMetrics(queryStringParameters || {});
                    break;

                case 'GET /load-balancer/status':
                    response = await this.getLoadBalancerStatus();
                    break;

                case 'GET /health':
                    response = this.createHealthCheckResponse();
                    break;

                default:
                    response = this.createErrorResponseData('ROUTE_NOT_FOUND', 'Endpoint not found', 404);
            }

            return response;

        } catch (error) {
            this.logger.error('Service mesh request failed', error);
            return this.createErrorResponseData(
                'INTERNAL_ERROR',
                error instanceof Error ? error.message : 'Internal server error',
                500
            );
        }
    }

    /**
     * Create a communication policy
     */
    private async createCommunicationPolicy(body: string | null): Promise<ApiResponse> {
        if (!body) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Request body is required', 400);
        }

        try {
            const policyData = JSON.parse(body);

            if (!policyData.sourceService || !policyData.targetService) {
                return this.createErrorResponseData(
                    'VALIDATION_ERROR',
                    'sourceService and targetService are required',
                    400
                );
            }

            const policyId = `${policyData.sourceService}-to-${policyData.targetService}`;
            const now = new Date().toISOString();

            const policy: CommunicationPolicy = {
                policyId,
                sourceService: policyData.sourceService,
                targetService: policyData.targetService,
                allowedMethods: policyData.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE'],
                loadBalancingStrategy: policyData.loadBalancingStrategy || 'round-robin',
                timeout: policyData.timeout || 30000,
                retries: policyData.retries || 3,
                circuitBreaker: policyData.circuitBreaker !== false,
                authentication: policyData.authentication || { required: false, type: 'none' },
                rateLimit: policyData.rateLimit,
                metadata: policyData.metadata || {},
                createdAt: now,
                updatedAt: now,
            };

            // Store in DynamoDB
            await this.docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: `MESH_POLICY#${policyId}`,
                    SK: 'CONFIG',
                    EntityType: 'MESH_COMMUNICATION_POLICY',
                    GSI1PK: `SOURCE_SERVICE#${policy.sourceService}`,
                    GSI1SK: `TARGET_SERVICE#${policy.targetService}`,
                    ...policy,
                    TTL: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days TTL
                },
            }));

            this.logger.info('Communication policy created', {
                policyId,
                sourceService: policy.sourceService,
                targetService: policy.targetService,
            });

            return this.createSuccessResponse({
                policyId,
                message: 'Communication policy created successfully',
            }, 201);

        } catch (error) {
            this.logger.error('Failed to create communication policy', error);
            return this.createErrorResponseData(
                'CREATION_FAILED',
                error instanceof Error ? error.message : 'Policy creation failed',
                500
            );
        }
    }

    /**
     * List communication policies
     */
    private async listCommunicationPolicies(queryParams: Record<string, string>): Promise<ApiResponse> {
        try {
            const sourceService = queryParams.sourceService;
            const targetService = queryParams.targetService;
            let params: any;

            if (sourceService) {
                // Query by source service using GSI1
                params = {
                    TableName: TABLE_NAME,
                    IndexName: 'GSI1',
                    KeyConditionExpression: 'GSI1PK = :gsi1pk',
                    ExpressionAttributeValues: {
                        ':gsi1pk': `SOURCE_SERVICE#${sourceService}`,
                    },
                };

                if (targetService) {
                    params.KeyConditionExpression += ' AND GSI1SK = :gsi1sk';
                    params.ExpressionAttributeValues[':gsi1sk'] = `TARGET_SERVICE#${targetService}`;
                }
            } else {
                // Scan all policies
                params = {
                    TableName: TABLE_NAME,
                    FilterExpression: 'EntityType = :entityType',
                    ExpressionAttributeValues: {
                        ':entityType': 'MESH_COMMUNICATION_POLICY',
                    },
                };
            }

            const command = new QueryCommand(params);
            const result = await this.docClient.send(command);

            const policies = (result.Items || []) as CommunicationPolicy[];

            this.logger.info('Communication policies listed', {
                count: policies.length,
                sourceService,
                targetService,
            });

            return this.createSuccessResponse({
                policies,
                count: policies.length,
            });

        } catch (error) {
            this.logger.error('Failed to list communication policies', error);
            return this.createErrorResponseData(
                'LIST_FAILED',
                error instanceof Error ? error.message : 'Failed to list policies',
                500
            );
        }
    }

    /**
     * Get a specific communication policy
     */
    private async getCommunicationPolicy(policyId: string | undefined): Promise<ApiResponse> {
        if (!policyId) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Policy ID is required', 400);
        }

        try {
            const result = await this.docClient.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `MESH_POLICY#${policyId}`,
                    SK: 'CONFIG',
                },
            }));

            if (!result.Item) {
                return this.createErrorResponseData('NOT_FOUND', 'Communication policy not found', 404);
            }

            const policy = result.Item as CommunicationPolicy;

            this.logger.info('Communication policy retrieved', {
                policyId,
                sourceService: policy.sourceService,
                targetService: policy.targetService,
            });

            return this.createSuccessResponse(policy);

        } catch (error) {
            this.logger.error('Failed to get communication policy', error);
            return this.createErrorResponseData(
                'GET_FAILED',
                error instanceof Error ? error.message : 'Failed to get policy',
                500
            );
        }
    }

    /**
     * Update a communication policy
     */
    private async updateCommunicationPolicy(policyId: string | undefined, body: string | null): Promise<ApiResponse> {
        if (!policyId || !body) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Policy ID and request body are required', 400);
        }

        try {
            const updateData = JSON.parse(body);
            const now = new Date().toISOString();

            // Build update expression
            const updateExpressions: string[] = [];
            const expressionAttributeValues: Record<string, any> = {};

            if (updateData.allowedMethods) {
                updateExpressions.push('allowedMethods = :allowedMethods');
                expressionAttributeValues[':allowedMethods'] = updateData.allowedMethods;
            }

            if (updateData.loadBalancingStrategy) {
                updateExpressions.push('loadBalancingStrategy = :loadBalancingStrategy');
                expressionAttributeValues[':loadBalancingStrategy'] = updateData.loadBalancingStrategy;
            }

            if (updateData.timeout) {
                updateExpressions.push('#timeout = :timeout');
                expressionAttributeValues[':timeout'] = updateData.timeout;
            }

            if (updateData.retries) {
                updateExpressions.push('retries = :retries');
                expressionAttributeValues[':retries'] = updateData.retries;
            }

            if (updateData.authentication) {
                updateExpressions.push('authentication = :authentication');
                expressionAttributeValues[':authentication'] = updateData.authentication;
            }

            if (updateData.rateLimit) {
                updateExpressions.push('rateLimit = :rateLimit');
                expressionAttributeValues[':rateLimit'] = updateData.rateLimit;
            }

            updateExpressions.push('updatedAt = :updatedAt');
            expressionAttributeValues[':updatedAt'] = now;

            await this.docClient.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `MESH_POLICY#${policyId}`,
                    SK: 'CONFIG',
                },
                UpdateExpression: `SET ${updateExpressions.join(', ')}`,
                ExpressionAttributeValues: expressionAttributeValues,
                ExpressionAttributeNames: updateData.timeout ? { '#timeout': 'timeout' } : undefined,
            }));

            this.logger.info('Communication policy updated', {
                policyId,
                updateFields: Object.keys(updateData),
            });

            return this.createSuccessResponse({
                policyId,
                message: 'Communication policy updated successfully',
            });

        } catch (error) {
            this.logger.error('Failed to update communication policy', error);
            return this.createErrorResponseData(
                'UPDATE_FAILED',
                error instanceof Error ? error.message : 'Failed to update policy',
                500
            );
        }
    }

    /**
     * Delete a communication policy
     */
    private async deleteCommunicationPolicy(policyId: string | undefined): Promise<ApiResponse> {
        if (!policyId) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Policy ID is required', 400);
        }

        try {
            await this.docClient.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `MESH_POLICY#${policyId}`,
                    SK: 'CONFIG',
                },
                UpdateExpression: 'SET TTL = :ttl',
                ExpressionAttributeValues: {
                    ':ttl': Math.floor(Date.now() / 1000) + 60, // Delete in 1 minute
                },
            }));

            this.logger.info('Communication policy deleted', { policyId });

            return this.createSuccessResponse({
                policyId,
                message: 'Communication policy deleted successfully',
            });

        } catch (error) {
            this.logger.error('Failed to delete communication policy', error);
            return this.createErrorResponseData(
                'DELETE_FAILED',
                error instanceof Error ? error.message : 'Failed to delete policy',
                500
            );
        }
    }

    /**
     * Handle service-to-service communication
     */
    private async handleServiceCommunication(body: string | null): Promise<ApiResponse> {
        if (!body) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Request body is required', 400);
        }

        try {
            const request = JSON.parse(body) as ServiceCommunicationRequest;

            if (!request.sourceService || !request.targetService || !request.method || !request.path) {
                return this.createErrorResponseData(
                    'VALIDATION_ERROR',
                    'sourceService, targetService, method, and path are required',
                    400
                );
            }

            // Get communication policy
            const policyId = `${request.sourceService}-to-${request.targetService}`;
            const policy = await this.getCommunicationPolicyById(policyId);

            if (!policy) {
                return this.createErrorResponseData(
                    'POLICY_NOT_FOUND',
                    `No communication policy found for ${request.sourceService} to ${request.targetService}`,
                    403
                );
            }

            // Validate method is allowed
            if (!policy.allowedMethods.includes(request.method.toUpperCase())) {
                return this.createErrorResponseData(
                    'METHOD_NOT_ALLOWED',
                    `Method ${request.method} is not allowed by policy`,
                    405
                );
            }

            // Get target service instances
            const targetServices = await this.serviceDiscovery.getHealthyServices(request.targetService);

            if (targetServices.length === 0) {
                return this.createErrorResponseData(
                    'SERVICE_UNAVAILABLE',
                    `Target service ${request.targetService} is not available`,
                    503
                );
            }

            // Select target instance using load balancing
            const selectedService = this.selectTargetService(targetServices, policy.loadBalancingStrategy);

            // Execute request with circuit breaker if enabled
            const startTime = Date.now();
            let response: ApiResponse;

            if (policy.circuitBreaker) {
                const circuitBreakerKey = `${request.sourceService}-${request.targetService}-${request.method}`;
                response = await this.executeWithCircuitBreaker(
                    circuitBreakerKey,
                    () => this.executeServiceRequest(request, selectedService, policy)
                );
            } else {
                response = await this.executeServiceRequest(request, selectedService, policy);
            }

            // Update metrics
            const duration = Date.now() - startTime;
            await this.updateCommunicationMetrics(request, response.statusCode < 400, duration);

            this.logger.info('Service communication completed', {
                sourceService: request.sourceService,
                targetService: request.targetService,
                method: request.method,
                path: request.path,
                statusCode: response.statusCode,
                duration,
            });

            return response;

        } catch (error) {
            this.logger.error('Service communication failed', error);
            return this.createErrorResponseData(
                'COMMUNICATION_FAILED',
                error instanceof Error ? error.message : 'Service communication failed',
                500
            );
        }
    }

    /**
     * Get service topology
     */
    private async getServiceTopology(): Promise<ApiResponse> {
        try {
            // Get all communication policies
            const result = await this.docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                FilterExpression: 'EntityType = :entityType',
                ExpressionAttributeValues: {
                    ':entityType': 'MESH_COMMUNICATION_POLICY',
                },
            }));

            const policies = (result.Items || []) as CommunicationPolicy[];

            // Get all registered services
            const services = await this.serviceDiscovery.discoverServices();

            // Build topology
            const topology = {
                services: services.map(service => ({
                    serviceName: service.serviceName,
                    version: service.version,
                    status: service.status,
                    endpoints: service.endpoints.length,
                })),
                connections: policies.map(policy => ({
                    source: policy.sourceService,
                    target: policy.targetService,
                    allowedMethods: policy.allowedMethods,
                    loadBalancingStrategy: policy.loadBalancingStrategy,
                    circuitBreaker: policy.circuitBreaker,
                })),
                stats: {
                    totalServices: services.length,
                    healthyServices: services.filter(s => s.status === 'healthy').length,
                    totalConnections: policies.length,
                },
            };

            this.logger.info('Service topology retrieved', {
                totalServices: topology.stats.totalServices,
                totalConnections: topology.stats.totalConnections,
            });

            return this.createSuccessResponse(topology);

        } catch (error) {
            this.logger.error('Failed to get service topology', error);
            return this.createErrorResponseData(
                'TOPOLOGY_FAILED',
                error instanceof Error ? error.message : 'Failed to get service topology',
                500
            );
        }
    }

    /**
     * Get communication metrics
     */
    private async getCommunicationMetrics(queryParams: Record<string, string>): Promise<ApiResponse> {
        try {
            const sourceService = queryParams.sourceService;
            const targetService = queryParams.targetService;

            // Filter metrics based on query parameters
            let metrics = Array.from(this.metricsCache.values());

            if (sourceService) {
                metrics = metrics.filter(m => m.sourceService === sourceService);
            }

            if (targetService) {
                metrics = metrics.filter(m => m.targetService === targetService);
            }

            const summary = {
                totalRequests: metrics.reduce((sum, m) => sum + m.requestCount, 0),
                totalSuccesses: metrics.reduce((sum, m) => sum + m.successCount, 0),
                totalErrors: metrics.reduce((sum, m) => sum + m.errorCount, 0),
                averageLatency: metrics.length > 0
                    ? metrics.reduce((sum, m) => sum + m.averageLatency, 0) / metrics.length
                    : 0,
                metrics,
            };

            this.logger.info('Communication metrics retrieved', {
                totalRequests: summary.totalRequests,
                metricsCount: metrics.length,
            });

            return this.createSuccessResponse(summary);

        } catch (error) {
            this.logger.error('Failed to get communication metrics', error);
            return this.createErrorResponseData(
                'METRICS_FAILED',
                error instanceof Error ? error.message : 'Failed to get metrics',
                500
            );
        }
    }

    /**
     * Get load balancer status
     */
    private async getLoadBalancerStatus(): Promise<ApiResponse> {
        try {
            const status = {
                loadBalancers: Array.from(this.loadBalancerStates.values()),
                totalLoadBalancers: this.loadBalancerStates.size,
                strategies: {} as Record<string, number>,
            };

            // Count strategies
            for (const lb of status.loadBalancers) {
                status.strategies[lb.strategy] = (status.strategies[lb.strategy] || 0) + 1;
            }

            this.logger.info('Load balancer status retrieved', {
                totalLoadBalancers: status.totalLoadBalancers,
            });

            return this.createSuccessResponse(status);

        } catch (error) {
            this.logger.error('Failed to get load balancer status', error);
            return this.createErrorResponseData(
                'STATUS_FAILED',
                error instanceof Error ? error.message : 'Failed to get load balancer status',
                500
            );
        }
    }

    /**
     * Get communication policy by ID
     */
    private async getCommunicationPolicyById(policyId: string): Promise<CommunicationPolicy | null> {
        try {
            const result = await this.docClient.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `MESH_POLICY#${policyId}`,
                    SK: 'CONFIG',
                },
            }));

            return result.Item as CommunicationPolicy || null;

        } catch (error) {
            this.logger.error('Failed to get communication policy', error);
            return null;
        }
    }

    /**
     * Select target service using load balancing strategy
     */
    private selectTargetService(services: ServiceRegistration[], strategy: string): ServiceRegistration {
        const loadBalancerKey = `${services[0].serviceName}-${strategy}`;
        let loadBalancerState = this.loadBalancerStates.get(loadBalancerKey);

        if (!loadBalancerState) {
            loadBalancerState = {
                targetService: services[0].serviceName,
                strategy,
                lastSelectedIndex: 0,
                connectionCounts: {},
                weights: {},
            };
            this.loadBalancerStates.set(loadBalancerKey, loadBalancerState);
        }

        let selectedService: ServiceRegistration;

        switch (strategy) {
            case 'round-robin':
                loadBalancerState.lastSelectedIndex = (loadBalancerState.lastSelectedIndex + 1) % services.length;
                selectedService = services[loadBalancerState.lastSelectedIndex];
                break;

            case 'least-connections':
                // Select service with least connections
                selectedService = services.reduce((least, current) => {
                    const leastConnections = loadBalancerState!.connectionCounts[least.serviceId] || 0;
                    const currentConnections = loadBalancerState!.connectionCounts[current.serviceId] || 0;
                    return currentConnections < leastConnections ? current : least;
                });
                break;

            case 'random':
                selectedService = services[Math.floor(Math.random() * services.length)];
                break;

            case 'weighted':
                // Simple weighted selection (equal weights for now)
                selectedService = services[Math.floor(Math.random() * services.length)];
                break;

            default:
                selectedService = services[0];
        }

        // Update connection count
        loadBalancerState.connectionCounts[selectedService.serviceId] =
            (loadBalancerState.connectionCounts[selectedService.serviceId] || 0) + 1;

        return selectedService;
    }

    /**
     * Execute service request
     */
    private async executeServiceRequest(
        request: ServiceCommunicationRequest,
        targetService: ServiceRegistration,
        policy: CommunicationPolicy
    ): Promise<ApiResponse> {
        // In a real implementation, you would make an HTTP request to the target service
        // For this example, we'll simulate the service communication

        const endpoint = targetService.endpoints.find(ep => ep.type === 'rest');
        if (!endpoint) {
            throw new Error('No REST endpoint available for target service');
        }

        const targetUrl = `${endpoint.url}${request.path}`;

        this.logger.info('Executing service request', {
            targetUrl,
            method: request.method,
            sourceService: request.sourceService,
            targetService: request.targetService,
        });

        // Execute with retry
        const response = await retry(
            async () => {
                // Simulate HTTP request to target service
                // In production, use a proper HTTP client

                // Simulate processing time
                await new Promise(resolve => setTimeout(resolve, Math.random() * 200));

                // Simulate occasional failures for testing
                if (Math.random() < 0.05) {
                    throw new Error('Simulated service communication error');
                }

                return {
                    statusCode: 200,
                    data: {
                        message: 'Service communication successful',
                        sourceService: request.sourceService,
                        targetService: request.targetService,
                        method: request.method,
                        path: request.path,
                        targetServiceId: targetService.serviceId,
                        timestamp: new Date().toISOString(),
                    },
                };
            },
            {
                maxAttempts: request.retries || policy.retries,
                initialDelayMs: 100,
                onRetry: (error, attempt, delayMs) => {
                    this.logger.warn('Retrying service communication', {
                        sourceService: request.sourceService,
                        targetService: request.targetService,
                        attempt,
                        error: error.message,
                        delayMs,
                    });
                },
            }
        );

        return this.createSuccessResponse(response.data, response.statusCode);
    }

    /**
     * Update communication metrics
     */
    private async updateCommunicationMetrics(
        request: ServiceCommunicationRequest,
        success: boolean,
        duration: number
    ): Promise<void> {
        const metricsKey = `${request.sourceService}-${request.targetService}-${request.method}`;
        let metrics = this.metricsCache.get(metricsKey);

        if (!metrics) {
            metrics = {
                sourceService: request.sourceService,
                targetService: request.targetService,
                method: request.method,
                requestCount: 0,
                successCount: 0,
                errorCount: 0,
                averageLatency: 0,
                lastRequest: new Date().toISOString(),
            };
        }

        metrics.requestCount++;
        if (success) {
            metrics.successCount++;
        } else {
            metrics.errorCount++;
        }

        // Update average latency
        metrics.averageLatency = (metrics.averageLatency * (metrics.requestCount - 1) + duration) / metrics.requestCount;
        metrics.lastRequest = new Date().toISOString();

        this.metricsCache.set(metricsKey, metrics);

        // Clean up old metrics periodically
        if (this.metricsCache.size > 1000) {
            this.cleanupMetricsCache();
        }
    }

    /**
     * Clean up old metrics cache entries
     */
    private cleanupMetricsCache(): void {
        const now = Date.now();
        const cutoff = now - (60 * 60 * 1000); // 1 hour ago

        for (const [key, metrics] of this.metricsCache.entries()) {
            const lastRequestTime = new Date(metrics.lastRequest).getTime();
            if (lastRequestTime < cutoff) {
                this.metricsCache.delete(key);
            }
        }
    }
}

// Create handler instance
const handlerInstance = new ServiceMeshServiceHandler();

/**
 * Lambda handler entry point
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
    return handlerInstance.lambdaHandler(event, context);
};