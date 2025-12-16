/**
 * Listing Description Optimization Microservice
 * 
 * Independent Lambda service for generating optimized listing descriptions using AI
 * Implements Requirements 2.3: Implement listing description optimization service
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from '../base-lambda-template';
import { ServiceDiscoveryClient } from '../service-discovery';
import { generateFromData, generateFromPhotos } from '../../../aws/bedrock/flows/listing-description-flow';
import { z } from 'zod';

// Input validation schemas
const ListingDataSchema = z.object({
    mlsNumber: z.string().optional(),
    address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
    }),
    price: z.number().positive(),
    bedrooms: z.number().min(0),
    bathrooms: z.number().min(0),
    squareFeet: z.number().positive(),
    propertyType: z.string(),
    features: z.array(z.string()),
    description: z.string().optional(),
});

const PhotoDataSchema = z.object({
    url: z.string(),
    data: z.string(), // Base64 encoded
    format: z.enum(['jpeg', 'png', 'webp']),
    caption: z.string().optional(),
    order: z.number(),
});

const ListingDescriptionRequestSchema = z.object({
    type: z.enum(['data-only', 'with-photos']),
    listingData: ListingDataSchema,
    photos: z.array(PhotoDataSchema).optional(),
    buyerPersona: z.string().optional(),
    writingStyle: z.enum(['Professional', 'Casual', 'Luxury', 'Balanced']).default('Balanced'),
});

type ListingDescriptionRequest = z.infer<typeof ListingDescriptionRequestSchema>;

interface ListingDescriptionResponse {
    description: string;
    wordCount: number;
    optimizationScore: number;
    keyFeatures: string[];
    generatedAt: string;
    processingMethod: 'data-only' | 'with-photos';
}

/**
 * Listing Description Service Handler
 */
class ListingDescriptionServiceHandler extends BaseLambdaHandler {
    private serviceDiscovery: ServiceDiscoveryClient;

    constructor() {
        const config: ServiceConfig = {
            serviceName: 'listing-description-service',
            version: '1.0.0',
            description: 'AI-powered listing description optimization microservice',
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
                        url: process.env.SERVICE_ENDPOINT || 'https://api.bayoncoagent.app/v1/content/listing',
                        methods: ['POST'],
                        authentication: {
                            type: 'cognito',
                            required: true,
                        },
                        rateLimit: {
                            requestsPerSecond: 5,
                            burstLimit: 10,
                        },
                    },
                ],
                healthCheckUrl: '/health',
                metadata: {
                    description: this.config.description,
                    capabilities: ['listing-description', 'ai-optimization', 'photo-analysis', 'vision-ai'],
                    supportedFormats: ['jpeg', 'png', 'webp'],
                    maxPhotos: 5,
                    maxConcurrency: 8,
                    averageProcessingTime: '25s',
                },
                status: 'healthy',
                tags: ['content-generation', 'ai', 'listing', 'optimization', 'vision'],
            });

            this.logger.info('Listing description service registered successfully');
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
                return this.generateListingDescription(event);
            case 'POST /optimize':
                return this.optimizeExistingDescription(event);
            case 'GET /health':
                return this.healthCheck();
            default:
                return this.createErrorResponseData('ENDPOINT_NOT_FOUND', 'Endpoint not found', 404);
        }
    }

    /**
     * Generate optimized listing description
     */
    private async generateListingDescription(event: APIGatewayProxyEvent): Promise<ApiResponse<ListingDescriptionResponse>> {
        try {
            // Extract user ID for authorization
            const userId = this.extractUserId(event);

            // Validate request body
            const request = this.validateRequestBody(event, (data) =>
                ListingDescriptionRequestSchema.parse(data)
            );

            this.logger.info('Generating listing description', {
                userId,
                type: request.type,
                propertyType: request.listingData.propertyType,
                hasPhotos: request.photos && request.photos.length > 0,
                photosCount: request.photos?.length || 0,
            });

            // Execute listing description generation with circuit breaker and retry
            const result = await this.executeWithCircuitBreaker(
                'listing-description-generation',
                async () => {
                    return await this.executeWithRetry(
                        async () => {
                            if (request.type === 'with-photos' && request.photos && request.photos.length > 0) {
                                // Generate from photos
                                return await generateFromPhotos({
                                    photos: request.photos,
                                    listingData: request.listingData,
                                });
                            } else {
                                // Generate from data only
                                return await generateFromData({
                                    mlsNumber: request.listingData.mlsNumber || `TEMP-${Date.now()}`,
                                    address: request.listingData.address,
                                    price: request.listingData.price,
                                    bedrooms: request.listingData.bedrooms,
                                    bathrooms: request.listingData.bathrooms,
                                    squareFeet: request.listingData.squareFeet,
                                    propertyType: request.listingData.propertyType,
                                    features: request.listingData.features,
                                    description: request.listingData.description,
                                });
                            }
                        },
                        3 // max retries
                    );
                }
            );

            // Calculate optimization score based on various factors
            const optimizationScore = this.calculateOptimizationScore(
                result.description,
                request.listingData.features,
                result.wordCount
            );

            // Extract key features mentioned in the description
            const keyFeatures = this.extractKeyFeatures(result.description, request.listingData.features);

            const response: ListingDescriptionResponse = {
                description: result.description,
                wordCount: result.wordCount,
                optimizationScore,
                keyFeatures,
                generatedAt: new Date().toISOString(),
                processingMethod: request.type,
            };

            // Publish service event
            await this.publishServiceEvent(
                'bayon.coagent.content',
                'Listing Description Generated',
                {
                    userId,
                    propertyType: request.listingData.propertyType,
                    wordCount: result.wordCount,
                    optimizationScore,
                    processingMethod: request.type,
                    photosUsed: request.photos?.length || 0,
                }
            );

            // Update service heartbeat
            await this.updateServiceHeartbeat('healthy');

            return this.createSuccessResponse(response, 200);

        } catch (error) {
            this.logger.error('Listing description generation failed:', error);

            // Update service heartbeat as unhealthy
            await this.updateServiceHeartbeat('unhealthy');

            const errorMessage = error instanceof Error ? error.message : 'Listing description generation failed';
            return this.createErrorResponseData('LISTING_DESCRIPTION_GENERATION_FAILED', errorMessage, 500, {
                originalError: error instanceof Error ? error.stack : String(error),
            });
        }
    }

    /**
     * Optimize existing listing description
     */
    private async optimizeExistingDescription(event: APIGatewayProxyEvent): Promise<ApiResponse<ListingDescriptionResponse>> {
        try {
            const userId = this.extractUserId(event);

            const OptimizeRequestSchema = z.object({
                existingDescription: z.string().min(1, 'Existing description is required'),
                listingData: ListingDataSchema,
                targetWordCount: z.number().min(150).max(300).optional(),
            });

            const request = this.validateRequestBody(event, (data) =>
                OptimizeRequestSchema.parse(data)
            );

            this.logger.info('Optimizing existing listing description', {
                userId,
                existingLength: request.existingDescription.length,
                targetWordCount: request.targetWordCount,
            });

            // For optimization, we'll regenerate with the existing description as context
            const result = await this.executeWithCircuitBreaker(
                'listing-description-optimization',
                async () => {
                    return await this.executeWithRetry(
                        async () => await generateFromData({
                            mlsNumber: request.listingData.mlsNumber || `TEMP-${Date.now()}`,
                            address: request.listingData.address,
                            price: request.listingData.price,
                            bedrooms: request.listingData.bedrooms,
                            bathrooms: request.listingData.bathrooms,
                            squareFeet: request.listingData.squareFeet,
                            propertyType: request.listingData.propertyType,
                            features: request.listingData.features,
                            description: request.existingDescription, // Use existing as context
                        }),
                        3
                    );
                }
            );

            const optimizationScore = this.calculateOptimizationScore(
                result.description,
                request.listingData.features,
                result.wordCount
            );

            const keyFeatures = this.extractKeyFeatures(result.description, request.listingData.features);

            const response: ListingDescriptionResponse = {
                description: result.description,
                wordCount: result.wordCount,
                optimizationScore,
                keyFeatures,
                generatedAt: new Date().toISOString(),
                processingMethod: 'data-only',
            };

            await this.publishServiceEvent(
                'bayon.coagent.content',
                'Listing Description Optimized',
                {
                    userId,
                    originalWordCount: request.existingDescription.split(/\s+/).length,
                    optimizedWordCount: result.wordCount,
                    optimizationScore,
                }
            );

            await this.updateServiceHeartbeat('healthy');

            return this.createSuccessResponse(response, 200);

        } catch (error) {
            this.logger.error('Listing description optimization failed:', error);
            await this.updateServiceHeartbeat('unhealthy');

            const errorMessage = error instanceof Error ? error.message : 'Listing description optimization failed';
            return this.createErrorResponseData('LISTING_DESCRIPTION_OPTIMIZATION_FAILED', errorMessage, 500);
        }
    }

    /**
     * Calculate optimization score based on various factors
     */
    private calculateOptimizationScore(description: string, features: string[], wordCount: number): number {
        let score = 0;

        // Word count score (optimal range: 150-300 words)
        if (wordCount >= 150 && wordCount <= 300) {
            score += 30;
        } else if (wordCount >= 100 && wordCount < 150) {
            score += 20;
        } else if (wordCount > 300 && wordCount <= 400) {
            score += 20;
        } else {
            score += 10;
        }

        // Feature inclusion score
        const featuresIncluded = features.filter(feature =>
            description.toLowerCase().includes(feature.toLowerCase())
        ).length;
        const featureScore = Math.min((featuresIncluded / features.length) * 40, 40);
        score += featureScore;

        // Readability score (simple heuristic)
        const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgWordsPerSentence = wordCount / sentences.length;
        if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
            score += 20;
        } else {
            score += 10;
        }

        // Engagement score (presence of engaging words)
        const engagingWords = ['stunning', 'beautiful', 'spacious', 'modern', 'updated', 'charming', 'elegant', 'luxurious'];
        const engagingWordsFound = engagingWords.filter(word =>
            description.toLowerCase().includes(word)
        ).length;
        score += Math.min(engagingWordsFound * 2, 10);

        return Math.min(Math.round(score), 100);
    }

    /**
     * Extract key features mentioned in the description
     */
    private extractKeyFeatures(description: string, availableFeatures: string[]): string[] {
        const lowerDescription = description.toLowerCase();
        return availableFeatures.filter(feature =>
            lowerDescription.includes(feature.toLowerCase())
        );
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
const handler = new ListingDescriptionServiceHandler();

// Export Lambda handler
export const lambdaHandler = handler.lambdaHandler.bind(handler);

// For testing
export { ListingDescriptionServiceHandler };