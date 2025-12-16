/**
 * Service Discovery and Registry Implementation
 * 
 * Provides dynamic service registration and lookup capabilities for microservices
 * using DynamoDB as the service registry backend.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import * as AWSXRay from 'aws-xray-sdk-core';

// Initialize DynamoDB client with X-Ray tracing
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

// Service registration interface
export interface ServiceRegistration {
    serviceId: string;
    serviceName: string;
    version: string;
    endpoints: ServiceEndpoint[];
    healthCheckUrl: string;
    metadata: Record<string, any>;
    registeredAt: string;
    lastHeartbeat: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    tags?: string[];
}

// Service endpoint interface
export interface ServiceEndpoint {
    type: 'rest' | 'graphql' | 'grpc' | 'websocket';
    url: string;
    methods: string[];
    authentication: AuthenticationConfig;
    rateLimit?: RateLimitConfig;
}

// Authentication configuration
export interface AuthenticationConfig {
    type: 'none' | 'api-key' | 'jwt' | 'iam' | 'cognito';
    required: boolean;
    config?: Record<string, any>;
}

// Rate limit configuration
export interface RateLimitConfig {
    requestsPerSecond: number;
    burstLimit: number;
}

// Service discovery query interface
export interface ServiceQuery {
    serviceName?: string;
    version?: string;
    status?: 'healthy' | 'unhealthy' | 'unknown';
    tags?: string[];
    metadata?: Record<string, any>;
}

/**
 * Service Discovery and Registry Client
 */
export class ServiceDiscoveryClient {
    private static instance: ServiceDiscoveryClient;
    private docClient: DynamoDBDocumentClient;

    private constructor() {
        this.docClient = createDynamoClient();
    }

    public static getInstance(): ServiceDiscoveryClient {
        if (!ServiceDiscoveryClient.instance) {
            ServiceDiscoveryClient.instance = new ServiceDiscoveryClient();
        }
        return ServiceDiscoveryClient.instance;
    }

    /**
     * For testing purposes - inject a mock client
     */
    public setDocClient(client: DynamoDBDocumentClient): void {
        this.docClient = client;
    }

    /**
     * Register a service in the registry
     */
    public async registerService(registration: Omit<ServiceRegistration, 'registeredAt' | 'lastHeartbeat'>): Promise<void> {
        const now = new Date().toISOString();
        const serviceRegistration: ServiceRegistration = {
            ...registration,
            registeredAt: now,
            lastHeartbeat: now,
        };

        const params = {
            TableName: TABLE_NAME,
            Item: {
                PK: `SERVICE#${registration.serviceName}`,
                SK: `VERSION#${registration.version}#${registration.serviceId}`,
                EntityType: 'SERVICE_REGISTRATION',
                GSI1PK: `SERVICE_STATUS#${registration.status}`,
                GSI1SK: `SERVICE#${registration.serviceName}#${registration.version}`,
                ...serviceRegistration,
                TTL: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours TTL
            },
        };

        try {
            await this.docClient.send(new PutCommand(params));
            console.log(`Service registered: ${registration.serviceName} v${registration.version} (${registration.serviceId})`);
        } catch (error) {
            console.error('Failed to register service:', error);
            throw new Error(`Service registration failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update service heartbeat
     */
    public async updateHeartbeat(serviceName: string, version: string, serviceId: string, status: 'healthy' | 'unhealthy' | 'unknown' = 'healthy'): Promise<void> {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                PK: `SERVICE#${serviceName}`,
                SK: `VERSION#${version}#${serviceId}`,
            },
            UpdateExpression: 'SET lastHeartbeat = :heartbeat, #status = :status, GSI1PK = :gsi1pk, TTL = :ttl',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':heartbeat': new Date().toISOString(),
                ':status': status,
                ':gsi1pk': `SERVICE_STATUS#${status}`,
                ':ttl': Math.floor(Date.now() / 1000) + (24 * 60 * 60), // Extend TTL
            },
        };

        try {
            await this.docClient.send(new UpdateCommand(params));
        } catch (error) {
            console.error('Failed to update service heartbeat:', error);
            throw new Error(`Heartbeat update failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Discover services by query
     */
    public async discoverServices(query: ServiceQuery = {}): Promise<ServiceRegistration[]> {
        let params: any;

        if (query.serviceName) {
            // Query by service name
            params = {
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk',
                ExpressionAttributeValues: {
                    ':pk': `SERVICE#${query.serviceName}`,
                },
            };

            if (query.version) {
                params.KeyConditionExpression += ' AND begins_with(SK, :sk)';
                params.ExpressionAttributeValues[':sk'] = `VERSION#${query.version}`;
            }
        } else if (query.status) {
            // Query by status using GSI1
            params = {
                TableName: TABLE_NAME,
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :gsi1pk',
                ExpressionAttributeValues: {
                    ':gsi1pk': `SERVICE_STATUS#${query.status}`,
                },
            };
        } else {
            // Scan all services (use sparingly)
            params = {
                TableName: TABLE_NAME,
                FilterExpression: 'EntityType = :entityType',
                ExpressionAttributeValues: {
                    ':entityType': 'SERVICE_REGISTRATION',
                },
            };
        }

        try {
            const command = query.serviceName || query.status ? new QueryCommand(params) : new ScanCommand(params);
            const result = await this.docClient.send(command);

            let services = (result.Items || []) as ServiceRegistration[];

            // Apply additional filters
            if (query.tags && query.tags.length > 0) {
                services = services.filter(service =>
                    service.tags && query.tags!.some(tag => service.tags!.includes(tag))
                );
            }

            if (query.metadata) {
                services = services.filter(service => {
                    return Object.entries(query.metadata!).every(([key, value]) =>
                        service.metadata[key] === value
                    );
                });
            }

            return services;
        } catch (error) {
            console.error('Failed to discover services:', error);
            throw new Error(`Service discovery failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get a specific service registration
     */
    public async getService(serviceName: string, version: string, serviceId: string): Promise<ServiceRegistration | null> {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                PK: `SERVICE#${serviceName}`,
                SK: `VERSION#${version}#${serviceId}`,
            },
        };

        try {
            const result = await this.docClient.send(new GetCommand(params));
            return result.Item as ServiceRegistration || null;
        } catch (error) {
            console.error('Failed to get service:', error);
            throw new Error(`Service lookup failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Unregister a service
     */
    public async unregisterService(serviceName: string, version: string, serviceId: string): Promise<void> {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                PK: `SERVICE#${serviceName}`,
                SK: `VERSION#${version}#${serviceId}`,
            },
        };

        try {
            await this.docClient.send(new DeleteCommand(params));
            console.log(`Service unregistered: ${serviceName} v${version} (${serviceId})`);
        } catch (error) {
            console.error('Failed to unregister service:', error);
            throw new Error(`Service unregistration failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get healthy services for a given service name
     */
    public async getHealthyServices(serviceName: string, version?: string): Promise<ServiceRegistration[]> {
        const query: ServiceQuery = {
            serviceName,
            status: 'healthy',
        };

        if (version) {
            query.version = version;
        }

        return this.discoverServices(query);
    }

    /**
     * Get service endpoint URL for load balancing
     */
    public async getServiceEndpoint(serviceName: string, endpointType: 'rest' | 'graphql' | 'grpc' | 'websocket' = 'rest'): Promise<string | null> {
        const healthyServices = await this.getHealthyServices(serviceName);

        if (healthyServices.length === 0) {
            return null;
        }

        // Simple round-robin selection (in production, use more sophisticated load balancing)
        const selectedService = healthyServices[Math.floor(Math.random() * healthyServices.length)];

        const endpoint = selectedService.endpoints.find(ep => ep.type === endpointType);
        return endpoint?.url || null;
    }

    /**
     * Check service health and update status
     */
    public async checkServiceHealth(serviceName: string, version: string, serviceId: string): Promise<boolean> {
        try {
            const service = await this.getService(serviceName, version, serviceId);
            if (!service) {
                return false;
            }

            // Perform health check (this is a simplified version)
            // In production, you would make an HTTP request to the health check URL
            const healthCheckUrl = service.healthCheckUrl;

            // For now, just check if the service has sent a heartbeat recently (within 5 minutes)
            const lastHeartbeat = new Date(service.lastHeartbeat);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const isHealthy = lastHeartbeat > fiveMinutesAgo;

            // Update service status
            await this.updateHeartbeat(serviceName, version, serviceId, isHealthy ? 'healthy' : 'unhealthy');

            return isHealthy;
        } catch (error) {
            console.error('Health check failed:', error);
            await this.updateHeartbeat(serviceName, version, serviceId, 'unhealthy');
            return false;
        }
    }

    /**
     * Cleanup stale service registrations
     */
    public async cleanupStaleServices(maxAgeMinutes: number = 30): Promise<number> {
        const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
        let cleanedCount = 0;

        try {
            // Get all services
            const allServices = await this.discoverServices();

            for (const service of allServices) {
                const lastHeartbeat = new Date(service.lastHeartbeat);

                if (lastHeartbeat < cutoffTime) {
                    await this.unregisterService(service.serviceName, service.version, service.serviceId);
                    cleanedCount++;
                }
            }

            console.log(`Cleaned up ${cleanedCount} stale service registrations`);
            return cleanedCount;
        } catch (error) {
            console.error('Failed to cleanup stale services:', error);
            throw new Error(`Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get service registry statistics
     */
    public async getRegistryStats(): Promise<{
        totalServices: number;
        healthyServices: number;
        unhealthyServices: number;
        unknownServices: number;
        servicesByName: Record<string, number>;
    }> {
        try {
            const allServices = await this.discoverServices();

            const stats = {
                totalServices: allServices.length,
                healthyServices: allServices.filter(s => s.status === 'healthy').length,
                unhealthyServices: allServices.filter(s => s.status === 'unhealthy').length,
                unknownServices: allServices.filter(s => s.status === 'unknown').length,
                servicesByName: {} as Record<string, number>,
            };

            // Count services by name
            for (const service of allServices) {
                stats.servicesByName[service.serviceName] = (stats.servicesByName[service.serviceName] || 0) + 1;
            }

            return stats;
        } catch (error) {
            console.error('Failed to get registry stats:', error);
            throw new Error(`Stats retrieval failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

/**
 * Service Discovery Lambda Handler
 * Provides REST API endpoints for service discovery operations
 */
export class ServiceDiscoveryHandler {
    private discoveryClient: ServiceDiscoveryClient;

    constructor() {
        this.discoveryClient = ServiceDiscoveryClient.getInstance();
    }

    /**
     * Handle service discovery API requests
     */
    public async handleRequest(event: any): Promise<any> {
        const { httpMethod, path, body } = event;

        try {
            switch (`${httpMethod} ${path}`) {
                case 'POST /services':
                    return this.registerService(JSON.parse(body || '{}'));

                case 'GET /services':
                    return this.discoverServices(event.queryStringParameters || {});

                case 'PUT /services/heartbeat':
                    return this.updateHeartbeat(JSON.parse(body || '{}'));

                case 'DELETE /services':
                    return this.unregisterService(event.queryStringParameters || {});

                case 'GET /services/stats':
                    return this.getStats();

                case 'GET /health':
                    return this.healthCheck();

                default:
                    return {
                        statusCode: 404,
                        body: JSON.stringify({ error: 'Endpoint not found' }),
                    };
            }
        } catch (error) {
            console.error('Service discovery request failed:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: 'Internal server error',
                    message: error instanceof Error ? error.message : String(error),
                }),
            };
        }
    }

    private async registerService(registration: any) {
        await this.discoveryClient.registerService(registration);
        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Service registered successfully' }),
        };
    }

    private async discoverServices(queryParams: any) {
        const services = await this.discoveryClient.discoverServices(queryParams);
        return {
            statusCode: 200,
            body: JSON.stringify({ services }),
        };
    }

    private async updateHeartbeat(params: any) {
        const { serviceName, version, serviceId, status } = params;
        await this.discoveryClient.updateHeartbeat(serviceName, version, serviceId, status);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Heartbeat updated successfully' }),
        };
    }

    private async unregisterService(queryParams: any) {
        const { serviceName, version, serviceId } = queryParams;
        await this.discoveryClient.unregisterService(serviceName, version, serviceId);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Service unregistered successfully' }),
        };
    }

    private async getStats() {
        const stats = await this.discoveryClient.getRegistryStats();
        return {
            statusCode: 200,
            body: JSON.stringify({ stats }),
        };
    }

    private healthCheck() {
        return {
            statusCode: 200,
            body: JSON.stringify({
                status: 'healthy',
                service: 'service-discovery',
                timestamp: new Date().toISOString(),
            }),
        };
    }
}

// Export singleton instance
export const serviceDiscovery = ServiceDiscoveryClient.getInstance();