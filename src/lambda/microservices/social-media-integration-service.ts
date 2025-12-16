/**
 * Social Media Integration Service
 * 
 * Manages connections and interactions with multiple social media platforms
 * including Facebook, LinkedIn, Twitter, Instagram, and YouTube.
 * 
 * **Validates: Requirements 6.2**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ApiResponse, ServiceConfig } from './base-lambda-template';
import { EventSource } from '../utils/eventbridge-client';
import { z } from 'zod';

// Service configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'social-media-integration-service',
    version: '1.0.0',
    description: 'Multi-platform social media integration service',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: true,
};

// Zod schemas for request/response validation
const SocialMediaPlatformSchema = z.object({
    name: z.enum(['facebook', 'linkedin', 'twitter', 'instagram', 'youtube']),
    apiVersion: z.string().min(1),
    baseUrl: z.string().url(),
    authType: z.enum(['oauth2', 'api_key', 'bearer']),
    rateLimits: z.object({
        requestsPerHour: z.number().positive(),
        requestsPerDay: z.number().positive(),
    }),
    features: z.array(z.string()).min(1),
});

const ConnectPlatformSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    platform: SocialMediaPlatformSchema,
    credentials: z.object({
        accessToken: z.string().min(1, 'Access token is required'),
        refreshToken: z.string().optional(),
        expiresAt: z.string().optional(),
    }),
});

const DisconnectPlatformSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    platformId: z.string().min(1, 'Platform ID is required'),
});

const RefreshConnectionSchema = z.object({
    connectionId: z.string().min(1, 'Connection ID is required'),
});

const PublishContentSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    platforms: z.array(z.string()).min(1, 'At least one platform is required'),
    content: z.object({
        text: z.string().min(1, 'Content text is required'),
        media: z.array(z.object({
            type: z.enum(['image', 'video']),
            url: z.string().url(),
            alt: z.string().optional(),
        })).optional(),
        hashtags: z.array(z.string()).optional(),
        scheduledAt: z.string().optional(),
    }),
});

// Response types
interface PlatformConnection {
    platformId: string;
    userId: string;
    connectionId: string;
    status: 'active' | 'inactive' | 'expired' | 'error';
    credentials: {
        accessToken: string;
        refreshToken?: string;
        expiresAt?: string;
    };
    permissions: string[];
    connectedAt: string;
    lastUsed?: string;
    metadata?: Record<string, any>;
}

interface ConnectionManagementResult {
    totalConnections: number;
    activeConnections: number;
    platformBreakdown: Record<string, number>;
    healthStatus: 'healthy' | 'degraded' | 'critical';
    lastHealthCheck: string;
    connectionDetails: PlatformConnection[];
}

interface PublishResult {
    success: boolean;
    publishId: string;
    platformResults: Record<string, {
        success: boolean;
        postId?: string;
        error?: string;
        publishedAt?: string;
    }>;
    totalPlatforms: number;
    successfulPlatforms: number;
}

/**
 * Social Media Integration Service Handler
 */
class SocialMediaIntegrationServiceHandler extends BaseLambdaHandler {
    private connections: Map<string, PlatformConnection[]> = new Map();

    constructor() {
        super(SERVICE_CONFIG);
    }

    async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const { httpMethod, path } = event;

        try {
            // Route requests based on path and method
            if (httpMethod === 'POST' && path.includes('/connections/connect')) {
                return await this.connectPlatform(event);
            }

            if (httpMethod === 'DELETE' && path.includes('/connections/disconnect')) {
                return await this.disconnectPlatform(event);
            }

            if (httpMethod === 'POST' && path.includes('/connections/refresh')) {
                return await this.refreshConnection(event);
            }

            if (httpMethod === 'GET' && path.includes('/connections/status')) {
                return await this.getConnectionStatus(event);
            }

            if (httpMethod === 'POST' && path.includes('/content/publish')) {
                return await this.publishContent(event);
            }

            if (httpMethod === 'GET' && path.includes('/health')) {
                return this.createHealthCheckResponse();
            }

            return this.createErrorResponseData(
                'INVALID_ENDPOINT',
                `Endpoint ${httpMethod} ${path} not found`,
                404
            );

        } catch (error) {
            this.logger.error('Error handling request:', error);
            return this.createErrorResponseData(
                'INTERNAL_ERROR',
                'Internal server error occurred',
                500,
                { error: error instanceof Error ? error.message : String(error) }
            );
        }
    }

    /**
     * Connect to a social media platform
     */
    private async connectPlatform(event: APIGatewayProxyEvent): Promise<ApiResponse<PlatformConnection>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                ConnectPlatformSchema.parse(data)
            );

            const { userId, platform, credentials } = requestBody;

            // Validate platform credentials
            const isValidCredentials = await this.executeWithCircuitBreaker(
                'validate-platform-credentials',
                async () => this.validatePlatformCredentials(platform, credentials)
            );

            if (!isValidCredentials) {
                throw new Error('Invalid platform credentials');
            }

            // Create connection
            const connection: PlatformConnection = {
                platformId: platform.name,
                userId,
                connectionId: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                status: 'active',
                credentials: {
                    accessToken: credentials.accessToken,
                    refreshToken: credentials.refreshToken,
                    expiresAt: credentials.expiresAt,
                },
                permissions: platform.features,
                connectedAt: new Date().toISOString(),
                metadata: {
                    platformVersion: platform.apiVersion,
                    rateLimits: platform.rateLimits,
                    baseUrl: platform.baseUrl,
                },
            };

            // Store connection (in real implementation, use DynamoDB)
            const userConnections = this.connections.get(userId) || [];

            // Remove existing connection for the same platform
            const filteredConnections = userConnections.filter(c => c.platformId !== platform.name);
            filteredConnections.push(connection);
            this.connections.set(userId, filteredConnections);

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Platform Connected',
                {
                    userId,
                    platformId: platform.name,
                    connectionId: connection.connectionId,
                    permissions: connection.permissions,
                }
            );

            return this.createSuccessResponse(connection);

        } catch (error) {
            return this.createErrorResponseData(
                'PLATFORM_CONNECTION_FAILED',
                error instanceof Error ? error.message : 'Failed to connect platform',
                400
            );
        }
    }

    /**
     * Disconnect from a social media platform
     */
    private async disconnectPlatform(event: APIGatewayProxyEvent): Promise<ApiResponse<{ success: boolean }>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                DisconnectPlatformSchema.parse(data)
            );

            const { userId, platformId } = requestBody;

            // Remove connection
            const userConnections = this.connections.get(userId) || [];
            const filteredConnections = userConnections.filter(c => c.platformId !== platformId);

            if (filteredConnections.length === userConnections.length) {
                throw new Error('Platform connection not found');
            }

            this.connections.set(userId, filteredConnections);

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Platform Disconnected',
                {
                    userId,
                    platformId,
                }
            );

            return this.createSuccessResponse({ success: true });

        } catch (error) {
            return this.createErrorResponseData(
                'PLATFORM_DISCONNECTION_FAILED',
                error instanceof Error ? error.message : 'Failed to disconnect platform',
                400
            );
        }
    }

    /**
     * Refresh platform connection
     */
    private async refreshConnection(event: APIGatewayProxyEvent): Promise<ApiResponse<{ success: boolean; refreshedAt: string }>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                RefreshConnectionSchema.parse(data)
            );

            const { connectionId } = requestBody;

            // Find connection
            let targetConnection: PlatformConnection | null = null;
            let userId: string | null = null;

            for (const [uid, connections] of this.connections.entries()) {
                const connection = connections.find(c => c.connectionId === connectionId);
                if (connection) {
                    targetConnection = connection;
                    userId = uid;
                    break;
                }
            }

            if (!targetConnection || !userId) {
                throw new Error('Connection not found');
            }

            // Refresh connection credentials
            const refreshResult = await this.executeWithCircuitBreaker(
                'refresh-platform-connection',
                async () => this.performConnectionRefresh(targetConnection!)
            );

            if (!refreshResult.success) {
                targetConnection.status = 'error';
                throw new Error('Failed to refresh connection');
            }

            // Update connection
            targetConnection.status = 'active';
            targetConnection.lastUsed = new Date().toISOString();
            if (refreshResult.newCredentials) {
                targetConnection.credentials = refreshResult.newCredentials;
            }

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Connection Refreshed',
                {
                    userId,
                    connectionId,
                    platformId: targetConnection.platformId,
                }
            );

            return this.createSuccessResponse({
                success: true,
                refreshedAt: new Date().toISOString(),
            });

        } catch (error) {
            return this.createErrorResponseData(
                'CONNECTION_REFRESH_FAILED',
                error instanceof Error ? error.message : 'Failed to refresh connection',
                400
            );
        }
    }

    /**
     * Get connection status for a user
     */
    private async getConnectionStatus(event: APIGatewayProxyEvent): Promise<ApiResponse<ConnectionManagementResult>> {
        try {
            const userId = event.queryStringParameters?.userId;
            if (!userId) {
                throw new Error('User ID is required');
            }

            const userConnections = this.connections.get(userId) || [];
            const activeConnections = userConnections.filter(c => c.status === 'active');

            const platformBreakdown: Record<string, number> = {};
            userConnections.forEach(conn => {
                platformBreakdown[conn.platformId] = (platformBreakdown[conn.platformId] || 0) + 1;
            });

            const healthStatus = activeConnections.length === 0 ? 'critical' :
                activeConnections.length < userConnections.length * 0.8 ? 'degraded' : 'healthy';

            const result: ConnectionManagementResult = {
                totalConnections: userConnections.length,
                activeConnections: activeConnections.length,
                platformBreakdown,
                healthStatus,
                lastHealthCheck: new Date().toISOString(),
                connectionDetails: userConnections,
            };

            return this.createSuccessResponse(result);

        } catch (error) {
            return this.createErrorResponseData(
                'CONNECTION_STATUS_FAILED',
                error instanceof Error ? error.message : 'Failed to get connection status',
                400
            );
        }
    }

    /**
     * Publish content to multiple platforms
     */
    private async publishContent(event: APIGatewayProxyEvent): Promise<ApiResponse<PublishResult>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                PublishContentSchema.parse(data)
            );

            const { userId, platforms, content } = requestBody;

            // Get user connections
            const userConnections = this.connections.get(userId) || [];
            const activeConnections = userConnections.filter(c =>
                c.status === 'active' && platforms.includes(c.platformId)
            );

            if (activeConnections.length === 0) {
                throw new Error('No active connections found for specified platforms');
            }

            const publishId = `publish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const platformResults: Record<string, any> = {};
            let successfulPlatforms = 0;

            // Publish to each platform
            for (const connection of activeConnections) {
                try {
                    const publishResult = await this.executeWithCircuitBreaker(
                        `publish-to-${connection.platformId}`,
                        async () => this.publishToPlatform(connection, content)
                    );

                    platformResults[connection.platformId] = {
                        success: true,
                        postId: publishResult.postId,
                        publishedAt: new Date().toISOString(),
                    };

                    successfulPlatforms++;

                    // Update last used timestamp
                    connection.lastUsed = new Date().toISOString();

                } catch (error) {
                    platformResults[connection.platformId] = {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            }

            const result: PublishResult = {
                success: successfulPlatforms > 0,
                publishId,
                platformResults,
                totalPlatforms: platforms.length,
                successfulPlatforms,
            };

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Content Published',
                {
                    userId,
                    publishId,
                    platforms: platforms,
                    successfulPlatforms,
                    totalPlatforms: platforms.length,
                }
            );

            return this.createSuccessResponse(result);

        } catch (error) {
            return this.createErrorResponseData(
                'CONTENT_PUBLISH_FAILED',
                error instanceof Error ? error.message : 'Failed to publish content',
                400
            );
        }
    }

    // Helper methods
    private async validatePlatformCredentials(platform: any, credentials: any): Promise<boolean> {
        // In real implementation, validate credentials with platform API
        // For now, simulate validation
        return credentials.accessToken && credentials.accessToken.length > 10;
    }

    private async performConnectionRefresh(connection: PlatformConnection): Promise<{
        success: boolean;
        newCredentials?: any;
    }> {
        // In real implementation, refresh credentials with platform API
        // For now, simulate refresh with 90% success rate
        const success = Math.random() > 0.1;

        if (success && connection.credentials.refreshToken) {
            return {
                success: true,
                newCredentials: {
                    accessToken: `refreshed_token_${Date.now()}`,
                    refreshToken: connection.credentials.refreshToken,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                },
            };
        }

        return { success };
    }

    private async publishToPlatform(connection: PlatformConnection, content: any): Promise<{ postId: string }> {
        // In real implementation, make API calls to platform
        // For now, simulate publishing

        // Simulate platform-specific formatting
        let formattedContent = content.text;
        if (content.hashtags && content.hashtags.length > 0) {
            formattedContent += ' ' + content.hashtags.map((tag: string) => `#${tag}`).join(' ');
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Simulate occasional failures
        if (Math.random() < 0.05) { // 5% failure rate
            throw new Error(`Failed to publish to ${connection.platformId}`);
        }

        return {
            postId: `${connection.platformId}_post_${Date.now()}`,
        };
    }
}

// Export the Lambda handler
export const handler = new SocialMediaIntegrationServiceHandler().lambdaHandler.bind(
    new SocialMediaIntegrationServiceHandler()
);