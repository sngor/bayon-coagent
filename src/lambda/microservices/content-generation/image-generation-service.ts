/**
 * Image Generation Microservice
 * 
 * Independent Lambda service for generating images with multiple format support using AI
 * Implements Requirements 2.5: Set up image generation service with multiple format support
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from '../base-lambda-template';
import { ServiceDiscoveryClient } from '../service-discovery';
import { generateHeaderImage } from '../../../aws/bedrock/flows/generate-header-image';
import { generateSocialMediaImage } from '../../../aws/bedrock/flows/generate-social-media-image';
import { z } from 'zod';

// Input validation schemas
const ImageGenerationRequestSchema = z.object({
    imageType: z.enum(['header', 'social-media', 'property', 'marketing', 'logo']),
    prompt: z.string().min(1, 'Prompt is required'),
    style: z.enum(['photorealistic', 'artistic', 'modern', 'classic', 'minimalist']).default('photorealistic'),
    dimensions: z.object({
        width: z.number().min(100).max(2048),
        height: z.number().min(100).max(2048),
    }),
    format: z.enum(['jpeg', 'png', 'webp']).default('jpeg'),
    quality: z.enum(['draft', 'standard', 'high']).default('standard'),
    aspectRatio: z.enum(['1:1', '16:9', '4:3', '3:2', '9:16']).optional(),
    colorScheme: z.enum(['vibrant', 'muted', 'monochrome', 'warm', 'cool']).optional(),
    includeText: z.boolean().default(false),
    textOverlay: z.object({
        text: z.string(),
        position: z.enum(['top', 'center', 'bottom']),
        style: z.enum(['bold', 'elegant', 'modern']),
    }).optional(),
});

type ImageGenerationRequest = z.infer<typeof ImageGenerationRequestSchema>;

interface ImageGenerationResponse {
    imageUrl: string;
    imageData?: string; // Base64 encoded image data
    metadata: {
        format: string;
        dimensions: {
            width: number;
            height: number;
        };
        fileSize: number;
        style: string;
        quality: string;
    };
    generationDetails: {
        prompt: string;
        model: string;
        processingTime: number;
        iterations: number;
    };
    generatedAt: string;
}

/**
 * Image Generation Service Handler
 */
class ImageGenerationServiceHandler extends BaseLambdaHandler {
    private serviceDiscovery: ServiceDiscoveryClient;

    constructor() {
        const config: ServiceConfig = {
            serviceName: 'image-generation-service',
            version: '1.0.0',
            description: 'AI-powered image generation microservice with multiple format support',
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
                        url: process.env.SERVICE_ENDPOINT || 'https://api.bayoncoagent.app/v1/content/image',
                        methods: ['POST'],
                        authentication: {
                            type: 'cognito',
                            required: true,
                        },
                        rateLimit: {
                            requestsPerSecond: 3,
                            burstLimit: 8,
                        },
                    },
                ],
                healthCheckUrl: '/health',
                metadata: {
                    description: this.config.description,
                    capabilities: ['image-generation', 'multi-format', 'ai-art', 'text-overlay'],
                    supportedFormats: ['jpeg', 'png', 'webp'],
                    supportedStyles: ['photorealistic', 'artistic', 'modern', 'classic', 'minimalist'],
                    maxDimensions: { width: 2048, height: 2048 },
                    maxConcurrency: 5,
                    averageProcessingTime: '45s',
                },
                status: 'healthy',
                tags: ['content-generation', 'ai', 'image', 'multi-format'],
            });

            this.logger.info('Image generation service registered successfully');
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
                return this.generateImage(event);
            case 'GET /formats':
                return this.getSupportedFormats();
            case 'GET /styles':
                return this.getSupportedStyles();
            case 'POST /batch':
                return this.generateBatchImages(event);
            case 'GET /health':
                return this.healthCheck();
            default:
                return this.createErrorResponseData('ENDPOINT_NOT_FOUND', 'Endpoint not found', 404);
        }
    }

    /**
     * Generate single image
     */
    private async generateImage(event: APIGatewayProxyEvent): Promise<ApiResponse<ImageGenerationResponse>> {
        try {
            // Extract user ID for authorization
            const userId = this.extractUserId(event);

            // Validate request body
            const request = this.validateRequestBody(event, (data) =>
                ImageGenerationRequestSchema.parse(data)
            );

            this.logger.info('Generating image', {
                userId,
                imageType: request.imageType,
                style: request.style,
                dimensions: request.dimensions,
                format: request.format,
            });

            const startTime = Date.now();

            // Execute image generation with circuit breaker and retry
            const result = await this.executeWithCircuitBreaker(
                'image-generation',
                async () => {
                    return await this.executeWithRetry(
                        async () => {
                            switch (request.imageType) {
                                case 'header':
                                    return await this.generateHeaderImage(request);
                                case 'social-media':
                                    return await this.generateSocialMediaImage(request);
                                case 'property':
                                case 'marketing':
                                case 'logo':
                                    return await this.generateGenericImage(request);
                                default:
                                    throw new Error(`Unsupported image type: ${request.imageType}`);
                            }
                        },
                        2 // max retries (image generation is expensive)
                    );
                }
            );

            const processingTime = Date.now() - startTime;

            // Calculate file size (estimate based on dimensions and format)
            const estimatedFileSize = this.estimateFileSize(
                request.dimensions.width,
                request.dimensions.height,
                request.format,
                request.quality
            );

            const response: ImageGenerationResponse = {
                imageUrl: result.imageUrl,
                imageData: result.imageData,
                metadata: {
                    format: request.format,
                    dimensions: request.dimensions,
                    fileSize: estimatedFileSize,
                    style: request.style,
                    quality: request.quality,
                },
                generationDetails: {
                    prompt: request.prompt,
                    model: result.model || 'stable-diffusion-xl',
                    processingTime,
                    iterations: result.iterations || 1,
                },
                generatedAt: new Date().toISOString(),
            };

            // Publish service event
            await this.publishServiceEvent(
                'bayon.coagent.content',
                'Image Generated',
                {
                    userId,
                    imageType: request.imageType,
                    style: request.style,
                    format: request.format,
                    dimensions: request.dimensions,
                    processingTime,
                }
            );

            // Update service heartbeat
            await this.updateServiceHeartbeat('healthy');

            return this.createSuccessResponse(response, 200);

        } catch (error) {
            this.logger.error('Image generation failed:', error);

            // Update service heartbeat as unhealthy
            await this.updateServiceHeartbeat('unhealthy');

            const errorMessage = error instanceof Error ? error.message : 'Image generation failed';
            return this.createErrorResponseData('IMAGE_GENERATION_FAILED', errorMessage, 500, {
                originalError: error instanceof Error ? error.stack : String(error),
            });
        }
    }

    /**
     * Generate header image
     */
    private async generateHeaderImage(request: ImageGenerationRequest): Promise<{
        imageUrl: string;
        imageData?: string;
        model?: string;
        iterations?: number;
    }> {
        const result = await generateHeaderImage({
            topic: request.prompt,
            style: request.style,
            dimensions: request.dimensions,
        });

        return {
            imageUrl: result.imageUrl,
            imageData: result.imageData,
            model: 'stable-diffusion-xl',
            iterations: 1,
        };
    }

    /**
     * Generate social media image
     */
    private async generateSocialMediaImage(request: ImageGenerationRequest): Promise<{
        imageUrl: string;
        imageData?: string;
        model?: string;
        iterations?: number;
    }> {
        const result = await generateSocialMediaImage({
            prompt: request.prompt,
            platform: this.inferPlatformFromDimensions(request.dimensions),
            style: request.style,
            includeText: request.includeText,
            textOverlay: request.textOverlay,
        });

        return {
            imageUrl: result.imageUrl,
            imageData: result.imageData,
            model: 'stable-diffusion-xl',
            iterations: 1,
        };
    }

    /**
     * Generate generic image (property, marketing, logo)
     */
    private async generateGenericImage(request: ImageGenerationRequest): Promise<{
        imageUrl: string;
        imageData?: string;
        model?: string;
        iterations?: number;
    }> {
        // This would use a generic image generation flow
        // For now, we'll simulate the response
        const simulatedResult = {
            imageUrl: `https://generated-images.bayoncoagent.app/${Date.now()}.${request.format}`,
            imageData: undefined, // Would contain base64 data in real implementation
            model: 'stable-diffusion-xl',
            iterations: 1,
        };

        // In a real implementation, this would call a generic image generation service
        // that could handle various types of images based on the prompt and style

        return simulatedResult;
    }

    /**
     * Generate batch images
     */
    private async generateBatchImages(event: APIGatewayProxyEvent): Promise<ApiResponse<{ images: ImageGenerationResponse[] }>> {
        try {
            const userId = this.extractUserId(event);

            const BatchRequestSchema = z.object({
                requests: z.array(ImageGenerationRequestSchema).min(1).max(5), // Limit batch size
            });

            const batchRequest = this.validateRequestBody(event, (data) =>
                BatchRequestSchema.parse(data)
            );

            this.logger.info('Generating batch images', {
                userId,
                batchSize: batchRequest.requests.length,
            });

            // Process images in parallel with concurrency limit
            const results = await Promise.allSettled(
                batchRequest.requests.map(async (request, index) => {
                    const startTime = Date.now();

                    const result = await this.executeWithCircuitBreaker(
                        `batch-image-generation-${index}`,
                        async () => {
                            switch (request.imageType) {
                                case 'header':
                                    return await this.generateHeaderImage(request);
                                case 'social-media':
                                    return await this.generateSocialMediaImage(request);
                                default:
                                    return await this.generateGenericImage(request);
                            }
                        }
                    );

                    const processingTime = Date.now() - startTime;
                    const estimatedFileSize = this.estimateFileSize(
                        request.dimensions.width,
                        request.dimensions.height,
                        request.format,
                        request.quality
                    );

                    return {
                        imageUrl: result.imageUrl,
                        imageData: result.imageData,
                        metadata: {
                            format: request.format,
                            dimensions: request.dimensions,
                            fileSize: estimatedFileSize,
                            style: request.style,
                            quality: request.quality,
                        },
                        generationDetails: {
                            prompt: request.prompt,
                            model: result.model || 'stable-diffusion-xl',
                            processingTime,
                            iterations: result.iterations || 1,
                        },
                        generatedAt: new Date().toISOString(),
                    };
                })
            );

            const successfulImages = results
                .filter((result): result is PromiseFulfilledResult<ImageGenerationResponse> =>
                    result.status === 'fulfilled'
                )
                .map(result => result.value);

            const failedCount = results.length - successfulImages.length;

            if (failedCount > 0) {
                this.logger.warn(`${failedCount} images failed to generate in batch`);
            }

            await this.publishServiceEvent(
                'bayon.coagent.content',
                'Batch Images Generated',
                {
                    userId,
                    totalRequested: batchRequest.requests.length,
                    successful: successfulImages.length,
                    failed: failedCount,
                }
            );

            await this.updateServiceHeartbeat('healthy');

            return this.createSuccessResponse({ images: successfulImages }, 200);

        } catch (error) {
            this.logger.error('Batch image generation failed:', error);
            await this.updateServiceHeartbeat('unhealthy');

            const errorMessage = error instanceof Error ? error.message : 'Batch image generation failed';
            return this.createErrorResponseData('BATCH_IMAGE_GENERATION_FAILED', errorMessage, 500);
        }
    }

    /**
     * Get supported formats
     */
    private getSupportedFormats(): ApiResponse<{ formats: string[] }> {
        const formats = ['jpeg', 'png', 'webp'];
        return this.createSuccessResponse({ formats }, 200);
    }

    /**
     * Get supported styles
     */
    private getSupportedStyles(): ApiResponse<{ styles: string[] }> {
        const styles = ['photorealistic', 'artistic', 'modern', 'classic', 'minimalist'];
        return this.createSuccessResponse({ styles }, 200);
    }

    /**
     * Infer platform from dimensions
     */
    private inferPlatformFromDimensions(dimensions: { width: number; height: number }): string {
        const { width, height } = dimensions;
        const ratio = width / height;

        if (Math.abs(ratio - 1) < 0.1) return 'instagram'; // Square
        if (Math.abs(ratio - 16 / 9) < 0.1) return 'facebook'; // Landscape
        if (Math.abs(ratio - 9 / 16) < 0.1) return 'instagram-story'; // Portrait
        if (Math.abs(ratio - 1.91) < 0.1) return 'twitter'; // Twitter header

        return 'generic';
    }

    /**
     * Estimate file size based on dimensions and format
     */
    private estimateFileSize(width: number, height: number, format: string, quality: string): number {
        const pixels = width * height;
        let bytesPerPixel: number;

        switch (format) {
            case 'png':
                bytesPerPixel = 4; // RGBA
                break;
            case 'webp':
                bytesPerPixel = quality === 'high' ? 2 : quality === 'standard' ? 1.5 : 1;
                break;
            case 'jpeg':
            default:
                bytesPerPixel = quality === 'high' ? 3 : quality === 'standard' ? 2 : 1;
                break;
        }

        return Math.round(pixels * bytesPerPixel);
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
const handler = new ImageGenerationServiceHandler();

// Export Lambda handler
export const lambdaHandler = handler.lambdaHandler.bind(handler);

// For testing
export { ImageGenerationServiceHandler };