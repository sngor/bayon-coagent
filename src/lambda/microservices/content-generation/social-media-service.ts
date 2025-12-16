/**
 * Social Media Content Generation Microservice
 * 
 * Independent Lambda service for generating social media posts using AI
 * Implements Requirements 2.2: Create social media content generation microservice
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from '../base-lambda-template';
import { ServiceDiscoveryClient } from '../service-discovery';
import { generateSocialMediaPost } from '../../../aws/bedrock/flows/generate-social-media-post';
import { z } from 'zod';

// Input validation schema
const SocialMediaGenerationRequestSchema = z.object({
    topic: z.string().min(1, 'Topic is required'),
    tone: z.string().default('professional'),
    platforms: z.array(z.enum(['linkedin', 'twitter', 'facebook', 'googleBusiness', 'instagram'])).optional(),
    numberOfVariations: z.number().min(1).max(5).default(1),
    includeHashtags: z.boolean().optional(),
    includeEmojis: z.boolean().optional(),
    callToAction: z.string().optional(),
});

type SocialMediaGenerationRequest = z.infer<typeof SocialMediaGenerationRequestSchema>;

interface SocialMediaGenerationResponse {
    variations: Array<{
        linkedin?: string;
        twitter?: string;
        facebook?: string;
        googleBusiness?: string;
        instagram?: string;
    }>;
    generatedAt: string;
    platforms: string[];
    variationsCount: number;
}

/**
 * Social Media Service Handler
 */
class SocialMediaServiceHandler extends BaseLambdaHandler {
    private serviceDiscovery: ServiceDiscoveryClient;

    constructor() {
        const config: ServiceConfig = {
            serviceName: 'social-media-service',
            version: '1.0.0',
            description: 'AI-powered social media content generation microservice',
            enableTracing: true,
            enableCircuitBreaker: true,
            enableRetry: true,
            healthCheckEnabled: true,
        };

        super(config);
        this.serviceDiscovery = ServiceDiscoveryClient.getInstance();
        this.registerService();
    }

    /**
     * Register this service with service discovery
     */
    private async registerService(): Promise<void> {
        try {
            await this.serviceDiscovery.registerService({
                serviceId: `${this.config.serviceName}-${Date.now()}`,
                serviceName: this.config.serviceName,
                version: this.config.version,
                endpoints: [
                    {
                        type: 'rest',
                        url: process.env.SERVICE_ENDPOINT || 'https://api.bayoncoagent.app/v1/content/social',
                        methods: ['POST'],
                        authentication: {
                            type: 'cognito',
                            required: true,
                        },
                        rateLimit: {
                            requestsPerSecond: 10,
                            burstLimit: 20,
                        },
                    },
                ],
                healthCheckUrl: '/health',
                metadata: {
                    description: this.config.description,
                    capabilities: ['social-media-generation', 'multi-platform', 'ai-content'],
                    supportedPlatforms: ['linkedin', 'twitter', 'facebook', 'googleBusiness', 'instagram'],
                    maxConcurrency: 15,
                    averageProcessingTime: '15s',
                },
                status: 'healthy',
                tags: ['content-generation', 'ai', 'social-media', 'multi-platform'],
            });

            this.logger.info('Social media service registered successfully');
        } catch (error) {
            this.logger.error('Failed to register service:', error);
        }
    }

    /**
     * Handle incoming requests
     */
    async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const { httpMethod, path } = event;

        // Route requests
        switch (`${httpMethod} ${path}`) {
            case 'POST /generate':
                return this.generateSocialMediaContent(event);
            case 'GET /platforms':
                return this.getSupportedPlatforms();
            case 'GET /health':
                return this.healthCheck();
            default:
                return this.createErrorResponseData('ENDPOINT_NOT_FOUND', 'Endpoint not found', 404);
        }
    }

    /**
     * Generate social media content for multiple platforms
     */
    private async generateSocialMediaContent(event: APIGatewayProxyEvent): Promise<ApiResponse<SocialMediaGenerationResponse>> {
        try {
            // Extract user ID for authorization
            const userId = this.extractUserId(event);

            // Validate request body
            const request = this.validateRequestBody(event, (data) =>
                SocialMediaGenerationRequestSchema.parse(data)
            );

            const platforms = request.platforms || ['linkedin', 'twitter', 'facebook', 'googleBusiness'];

            this.logger.info('Generating social media content', {
                userId,
                topic: request.topic,
                tone: request.tone,
                platforms,
                variations: request.numberOfVariations,
            });

            // Execute social media generation with circuit breaker and retry
            const result = await this.executeWithCircuitBreaker(
                'social-media-generation',
                async () => {
                    return await this.executeWithRetry(
                        async () => await generateSocialMediaPost({
                            topic: request.topic,
                            tone: request.tone,
                            platforms,
                            numberOfVariations: request.numberOfVariations,
                        }),
                        3 // max retries
                    );
                }
            );

            const response: SocialMediaGenerationResponse = {
                variations: result.variations,
                generatedAt: new Date().toISOString(),
                platforms,
                variationsCount: result.variations.length,
            };

            // Publish service event
            await this.publishServiceEvent(
                'bayon.coagent.content',
                'Social Media Content Generated',
                {
                    userId,
                    topic: request.topic,
                    platforms,
                    variationsCount: result.variations.length,
                }
            );

            // Update service heartbeat
            await this.updateServiceHeartbeat('healthy');

            return this.createSuccessResponse(response, 200);

        } catch (error) {
            this.logger.error('Social media generation failed:', error);

            // Update service heartbeat as unhealthy
            await this.updateServiceHeartbeat('unhealthy');

            const errorMessage = error instanceof Error ? error.message : 'Social media generation failed';
            return this.createErrorResponseData('SOCIAL_MEDIA_GENERATION_FAILED', errorMessage, 500, {
                originalError: error instanceof Error ? error.stack : String(error),
            });
        }
    }

    /**
     * Get supported platforms
     */
    private getSupportedPlatforms(): ApiResponse<{ platforms: string[] }> {
        const platforms = ['linkedin', 'twitter', 'facebook', 'googleBusiness', 'instagram'];
        return this.createSuccessResponse({ platforms }, 200);
    }

    /**
     * Health check endpoint
     */
    private healthCheck(): ApiResponse {
        return this.createHealthCheckResponse();
    }

    /**
     * Update service heartbeat
     */
    private async updateServiceHeartbeat(status: 'healthy' | 'unhealthy' | 'unknown'): Promise<void> {
        try {
            await this.serviceDiscovery.updateHeartbeat(
                this.config.serviceName,
                this.config.version,
                `${this.config.serviceName}-${Date.now()}`,
                status
            );
        } catch (error) {
            this.logger.warn('Failed to update service heartbeat:', error);
        }
    }
}

// Create handler instance
const handler = new SocialMediaServiceHandler();

// Export Lambda handler
export const lambdaHandler = handler.lambdaHandler.bind(handler);

// For testing
export { SocialMediaServiceHandler };