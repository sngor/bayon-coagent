/**
 * Blog Generation Microservice
 * 
 * Independent Lambda service for generating blog posts using AI
 * Implements Requirements 2.1: Extract blog post generation into independent Lambda service
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from '../base-lambda-template';
import { ServiceDiscoveryClient } from '../service-discovery';
import { generateBlogPost } from '../../../aws/bedrock/flows/generate-blog-post';
import { z } from 'zod';

// Input validation schema
const BlogGenerationRequestSchema = z.object({
    topic: z.string().min(1, 'Topic is required'),
    tone: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    includeWebSearch: z.boolean().optional(),
    searchDepth: z.enum(['basic', 'advanced']).optional(),
});

type BlogGenerationRequest = z.infer<typeof BlogGenerationRequestSchema>;

interface BlogGenerationResponse {
    blogPost: string;
    headerImage: string | null;
    sources?: Array<{ title: string; url: string; snippet?: string }>;
    wordCount: number;
    generatedAt: string;
}

/**
 * Blog Generation Service Handler
 */
class BlogGenerationServiceHandler extends BaseLambdaHandler {
    private serviceDiscovery: ServiceDiscoveryClient;

    constructor() {
        const config: ServiceConfig = {
            serviceName: 'blog-generation-service',
            version: '1.0.0',
            description: 'AI-powered blog post generation microservice',
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
                        url: process.env.SERVICE_ENDPOINT || 'https://api.bayoncoagent.app/v1/content/blog',
                        methods: ['POST'],
                        authentication: {
                            type: 'cognito',
                            required: true,
                        },
                    },
                ],
                healthCheckUrl: '/health',
                metadata: {
                    description: this.config.description,
                    capabilities: ['blog-generation', 'ai-content', 'web-search'],
                    maxConcurrency: 10,
                    averageProcessingTime: '30s',
                },
                status: 'healthy',
                tags: ['content-generation', 'ai', 'blog'],
            });

            this.logger.info('Blog generation service registered successfully');
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
                return this.generateBlogPost(event);
            case 'GET /health':
                return this.healthCheck();
            default:
                return this.createErrorResponseData('ENDPOINT_NOT_FOUND', 'Endpoint not found', 404);
        }
    }

    /**
     * Generate blog post
     */
    private async generateBlogPost(event: APIGatewayProxyEvent): Promise<ApiResponse<BlogGenerationResponse>> {
        try {
            // Extract user ID for authorization
            const userId = this.extractUserId(event);

            // Validate request body
            const request = this.validateRequestBody(event, (data) =>
                BlogGenerationRequestSchema.parse(data)
            );

            this.logger.info('Generating blog post', {
                userId,
                topic: request.topic,
                tone: request.tone,
                length: request.length,
            });

            // Execute blog generation with circuit breaker and retry
            const result = await this.executeWithCircuitBreaker(
                'blog-generation',
                async () => {
                    return await this.executeWithRetry(
                        async () => await generateBlogPost({
                            topic: request.topic,
                            includeWebSearch: request.includeWebSearch ?? true,
                            searchDepth: request.searchDepth ?? 'basic',
                        }),
                        3 // max retries
                    );
                }
            );

            // Count words in the generated blog post
            const wordCount = result.blogPost.split(/\s+/).length;

            const response: BlogGenerationResponse = {
                blogPost: result.blogPost,
                headerImage: result.headerImage,
                sources: result.sources,
                wordCount,
                generatedAt: new Date().toISOString(),
            };

            // Publish service event
            await this.publishServiceEvent(
                'bayon.coagent.content',
                'Blog Post Generated',
                {
                    userId,
                    topic: request.topic,
                    wordCount,
                    sourcesCount: result.sources?.length || 0,
                }
            );

            // Update service heartbeat
            await this.updateServiceHeartbeat('healthy');

            return this.createSuccessResponse(response, 200);

        } catch (error) {
            this.logger.error('Blog generation failed:', error);

            // Update service heartbeat as unhealthy
            await this.updateServiceHeartbeat('unhealthy');

            const errorMessage = error instanceof Error ? error.message : 'Blog generation failed';
            return this.createErrorResponseData('BLOG_GENERATION_FAILED', errorMessage, 500, {
                originalError: error instanceof Error ? error.stack : String(error),
            });
        }
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
const handler = new BlogGenerationServiceHandler();

// Export Lambda handler
export const lambdaHandler = handler.lambdaHandler.bind(handler);

// For testing
export { BlogGenerationServiceHandler };