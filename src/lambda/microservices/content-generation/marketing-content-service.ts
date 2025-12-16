/**
 * Marketing Content Personalization Microservice
 * 
 * Independent Lambda service for generating personalized marketing content using AI
 * Implements Requirements 2.4: Build marketing content personalization service
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from '../base-lambda-template';
import { ServiceDiscoveryClient } from '../service-discovery';
import { generateMarketingPlan } from '../../../aws/bedrock/flows/generate-marketing-plan';
import { generateAgentBio } from '../../../aws/bedrock/flows/generate-agent-bio';
import { z } from 'zod';

// Input validation schemas
const AgentProfileSchema = z.object({
    name: z.string().min(1, 'Agent name is required'),
    experience: z.number().min(0, 'Experience must be non-negative'),
    specialties: z.array(z.string()),
    location: z.object({
        city: z.string(),
        state: z.string(),
        market: z.string().optional(),
    }),
    achievements: z.array(z.string()).optional(),
    personalBrand: z.object({
        tone: z.enum(['Professional', 'Friendly', 'Authoritative', 'Approachable']),
        values: z.array(z.string()),
        uniqueSellingPoints: z.array(z.string()),
    }),
    targetAudience: z.object({
        demographics: z.array(z.string()),
        buyerTypes: z.array(z.string()),
        priceRanges: z.array(z.string()),
    }),
});

const MarketingContentRequestSchema = z.object({
    contentType: z.enum(['bio', 'marketing-plan', 'email-campaign', 'newsletter', 'client-testimonial-request']),
    agentProfile: AgentProfileSchema,
    customization: z.object({
        length: z.enum(['short', 'medium', 'long']).optional(),
        tone: z.enum(['Professional', 'Friendly', 'Authoritative', 'Approachable']).optional(),
        focusAreas: z.array(z.string()).optional(),
        callToAction: z.string().optional(),
    }).optional(),
    context: z.object({
        campaign: z.string().optional(),
        season: z.string().optional(),
        marketConditions: z.string().optional(),
        targetGoal: z.string().optional(),
    }).optional(),
});

type MarketingContentRequest = z.infer<typeof MarketingContentRequestSchema>;

interface MarketingContentResponse {
    content: string;
    contentType: string;
    personalizationScore: number;
    keyPersonalizationElements: string[];
    suggestedDistributionChannels: string[];
    generatedAt: string;
    agentProfile: {
        name: string;
        specialties: string[];
        location: string;
    };
}

/**
 * Marketing Content Service Handler
 */
class MarketingContentServiceHandler extends BaseLambdaHandler {
    private serviceDiscovery: ServiceDiscoveryClient;

    constructor() {
        const config: ServiceConfig = {
            serviceName: 'marketing-content-service',
            version: '1.0.0',
            description: 'AI-powered marketing content personalization microservice',
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
                        url: process.env.SERVICE_ENDPOINT || 'https://api.bayoncoagent.app/v1/content/marketing',
                        methods: ['POST'],
                        authentication: {
                            type: 'cognito',
                            required: true,
                        },
                        rateLimit: {
                            requestsPerSecond: 8,
                            burstLimit: 15,
                        },
                    },
                ],
                healthCheckUrl: '/health',
                metadata: {
                    description: this.config.description,
                    capabilities: ['marketing-personalization', 'agent-bio', 'marketing-plan', 'email-campaign'],
                    contentTypes: ['bio', 'marketing-plan', 'email-campaign', 'newsletter', 'client-testimonial-request'],
                    maxConcurrency: 12,
                    averageProcessingTime: '20s',
                },
                status: 'healthy',
                tags: ['content-generation', 'ai', 'marketing', 'personalization'],
            });

            this.logger.info('Marketing content service registered successfully');
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
                return this.generateMarketingContent(event);
            case 'GET /content-types':
                return this.getSupportedContentTypes();
            case 'POST /personalize':
                return this.personalizeExistingContent(event);
            case 'GET /health':
                return this.healthCheck();
            default:
                return this.createErrorResponseData('ENDPOINT_NOT_FOUND', 'Endpoint not found', 404);
        }
    }

    /**
     * Generate personalized marketing content
     */
    private async generateMarketingContent(event: APIGatewayProxyEvent): Promise<ApiResponse<MarketingContentResponse>> {
        try {
            // Extract user ID for authorization
            const userId = this.extractUserId(event);

            // Validate request body
            const request = this.validateRequestBody(event, (data) =>
                MarketingContentRequestSchema.parse(data)
            );

            this.logger.info('Generating marketing content', {
                userId,
                contentType: request.contentType,
                agentName: request.agentProfile.name,
                specialties: request.agentProfile.specialties,
                location: `${request.agentProfile.location.city}, ${request.agentProfile.location.state}`,
            });

            // Execute marketing content generation with circuit breaker and retry
            const result = await this.executeWithCircuitBreaker(
                'marketing-content-generation',
                async () => {
                    return await this.executeWithRetry(
                        async () => {
                            switch (request.contentType) {
                                case 'bio':
                                    return await this.generateAgentBio(request);
                                case 'marketing-plan':
                                    return await this.generateMarketingPlan(request);
                                case 'email-campaign':
                                    return await this.generateEmailCampaign(request);
                                case 'newsletter':
                                    return await this.generateNewsletter(request);
                                case 'client-testimonial-request':
                                    return await this.generateTestimonialRequest(request);
                                default:
                                    throw new Error(`Unsupported content type: ${request.contentType}`);
                            }
                        },
                        3 // max retries
                    );
                }
            );

            // Calculate personalization score
            const personalizationScore = this.calculatePersonalizationScore(
                result.content,
                request.agentProfile
            );

            // Extract key personalization elements
            const keyPersonalizationElements = this.extractPersonalizationElements(
                result.content,
                request.agentProfile
            );

            // Suggest distribution channels
            const suggestedDistributionChannels = this.suggestDistributionChannels(
                request.contentType,
                request.agentProfile
            );

            const response: MarketingContentResponse = {
                content: result.content,
                contentType: request.contentType,
                personalizationScore,
                keyPersonalizationElements,
                suggestedDistributionChannels,
                generatedAt: new Date().toISOString(),
                agentProfile: {
                    name: request.agentProfile.name,
                    specialties: request.agentProfile.specialties,
                    location: `${request.agentProfile.location.city}, ${request.agentProfile.location.state}`,
                },
            };

            // Publish service event
            await this.publishServiceEvent(
                'bayon.coagent.content',
                'Marketing Content Generated',
                {
                    userId,
                    contentType: request.contentType,
                    agentName: request.agentProfile.name,
                    personalizationScore,
                    specialtiesCount: request.agentProfile.specialties.length,
                }
            );

            // Update service heartbeat
            await this.updateServiceHeartbeat('healthy');

            return this.createSuccessResponse(response, 200);

        } catch (error) {
            this.logger.error('Marketing content generation failed:', error);

            // Update service heartbeat as unhealthy
            await this.updateServiceHeartbeat('unhealthy');

            const errorMessage = error instanceof Error ? error.message : 'Marketing content generation failed';
            return this.createErrorResponseData('MARKETING_CONTENT_GENERATION_FAILED', errorMessage, 500, {
                originalError: error instanceof Error ? error.stack : String(error),
            });
        }
    }

    /**
     * Generate agent bio
     */
    private async generateAgentBio(request: MarketingContentRequest): Promise<{ content: string }> {
        const result = await generateAgentBio({
            name: request.agentProfile.name,
            experience: request.agentProfile.experience,
            specialties: request.agentProfile.specialties,
            location: `${request.agentProfile.location.city}, ${request.agentProfile.location.state}`,
            achievements: request.agentProfile.achievements || [],
            tone: request.customization?.tone || request.agentProfile.personalBrand.tone,
        });

        return { content: result.bio };
    }

    /**
     * Generate marketing plan
     */
    private async generateMarketingPlan(request: MarketingContentRequest): Promise<{ content: string }> {
        const result = await generateMarketingPlan({
            agentProfile: {
                name: request.agentProfile.name,
                experience: request.agentProfile.experience,
                specialties: request.agentProfile.specialties,
                location: request.agentProfile.location.city,
                targetAudience: request.agentProfile.targetAudience.buyerTypes,
            },
            marketContext: {
                conditions: request.context?.marketConditions || 'balanced',
                season: request.context?.season || 'current',
                goals: request.context?.targetGoal || 'increase-leads',
            },
        });

        return { content: result.marketingPlan };
    }

    /**
     * Generate email campaign content
     */
    private async generateEmailCampaign(request: MarketingContentRequest): Promise<{ content: string }> {
        // This would use a dedicated email campaign flow (to be implemented)
        // For now, we'll create a simple personalized email template
        const content = `Subject: ${request.agentProfile.name} - Your Local Real Estate Expert in ${request.agentProfile.location.city}

Dear [Client Name],

I hope this email finds you well. My name is ${request.agentProfile.name}, and I'm a real estate professional with ${request.agentProfile.experience} years of experience serving the ${request.agentProfile.location.city}, ${request.agentProfile.location.state} market.

I specialize in ${request.agentProfile.specialties.join(', ')}, and I'm passionate about helping clients like you achieve their real estate goals.

${request.agentProfile.personalBrand.values.map(value => `• ${value}`).join('\n')}

${request.customization?.callToAction || 'I would love to discuss how I can help you with your real estate needs. Please don\'t hesitate to reach out!'}

Best regards,
${request.agentProfile.name}`;

        return { content };
    }

    /**
     * Generate newsletter content
     */
    private async generateNewsletter(request: MarketingContentRequest): Promise<{ content: string }> {
        const content = `${request.agentProfile.name}'s Real Estate Newsletter
${request.agentProfile.location.city}, ${request.agentProfile.location.state} Market Update

Hello valued clients and friends,

Welcome to this month's real estate newsletter! I'm ${request.agentProfile.name}, your local real estate expert specializing in ${request.agentProfile.specialties.join(', ')}.

MARKET HIGHLIGHTS:
• Current market conditions in ${request.agentProfile.location.city}
• Recent sales trends and pricing updates
• Upcoming opportunities for ${request.agentProfile.targetAudience.buyerTypes.join(' and ')}

FEATURED PROPERTIES:
[Property listings would be inserted here]

COMMUNITY SPOTLIGHT:
What's happening in our ${request.agentProfile.location.city} community...

${request.customization?.callToAction || 'As always, I\'m here to help with all your real estate needs. Contact me anytime!'}

Warm regards,
${request.agentProfile.name}`;

        return { content };
    }

    /**
     * Generate client testimonial request
     */
    private async generateTestimonialRequest(request: MarketingContentRequest): Promise<{ content: string }> {
        const content = `Subject: Your Experience with ${request.agentProfile.name} - Would You Share Your Story?

Dear [Client Name],

I hope you're enjoying your new home! It was such a pleasure working with you during your recent ${request.agentProfile.specialties.includes('buyer representation') ? 'home purchase' : 'home sale'} in ${request.agentProfile.location.city}.

As a real estate professional who values ${request.agentProfile.personalBrand.values.join(', ')}, your feedback means the world to me. Would you be willing to share a brief testimonial about your experience?

Your testimonial would help other families in ${request.agentProfile.location.city} understand what it's like to work with me, and it would be incredibly meaningful to my business.

If you're comfortable sharing, I'd love to know:
• How was your overall experience?
• What stood out about my service?
• Would you recommend me to friends and family?

Thank you for trusting me with your real estate needs. I'm always here if you need anything in the future!

Best regards,
${request.agentProfile.name}`;

        return { content };
    }

    /**
     * Get supported content types
     */
    private getSupportedContentTypes(): ApiResponse<{ contentTypes: string[] }> {
        const contentTypes = ['bio', 'marketing-plan', 'email-campaign', 'newsletter', 'client-testimonial-request'];
        return this.createSuccessResponse({ contentTypes }, 200);
    }

    /**
     * Personalize existing content
     */
    private async personalizeExistingContent(event: APIGatewayProxyEvent): Promise<ApiResponse<MarketingContentResponse>> {
        try {
            const userId = this.extractUserId(event);

            const PersonalizeRequestSchema = z.object({
                existingContent: z.string().min(1, 'Existing content is required'),
                agentProfile: AgentProfileSchema,
                personalizationLevel: z.enum(['light', 'moderate', 'heavy']).default('moderate'),
            });

            const request = this.validateRequestBody(event, (data) =>
                PersonalizeRequestSchema.parse(data)
            );

            // For personalization, we'll enhance the existing content with agent-specific details
            const personalizedContent = this.personalizeContent(
                request.existingContent,
                request.agentProfile,
                request.personalizationLevel
            );

            const personalizationScore = this.calculatePersonalizationScore(
                personalizedContent,
                request.agentProfile
            );

            const response: MarketingContentResponse = {
                content: personalizedContent,
                contentType: 'personalized-content',
                personalizationScore,
                keyPersonalizationElements: this.extractPersonalizationElements(personalizedContent, request.agentProfile),
                suggestedDistributionChannels: ['email', 'social-media', 'website'],
                generatedAt: new Date().toISOString(),
                agentProfile: {
                    name: request.agentProfile.name,
                    specialties: request.agentProfile.specialties,
                    location: `${request.agentProfile.location.city}, ${request.agentProfile.location.state}`,
                },
            };

            await this.publishServiceEvent(
                'bayon.coagent.content',
                'Content Personalized',
                {
                    userId,
                    agentName: request.agentProfile.name,
                    personalizationLevel: request.personalizationLevel,
                    personalizationScore,
                }
            );

            await this.updateServiceHeartbeat('healthy');

            return this.createSuccessResponse(response, 200);

        } catch (error) {
            this.logger.error('Content personalization failed:', error);
            await this.updateServiceHeartbeat('unhealthy');

            const errorMessage = error instanceof Error ? error.message : 'Content personalization failed';
            return this.createErrorResponseData('CONTENT_PERSONALIZATION_FAILED', errorMessage, 500);
        }
    }

    /**
     * Personalize existing content
     */
    private personalizeContent(content: string, agentProfile: z.infer<typeof AgentProfileSchema>, level: string): string {
        let personalizedContent = content;

        // Replace generic placeholders with agent-specific information
        personalizedContent = personalizedContent.replace(/\[Agent Name\]/g, agentProfile.name);
        personalizedContent = personalizedContent.replace(/\[Location\]/g, `${agentProfile.location.city}, ${agentProfile.location.state}`);
        personalizedContent = personalizedContent.replace(/\[Specialties\]/g, agentProfile.specialties.join(', '));

        if (level === 'moderate' || level === 'heavy') {
            // Add experience and achievements
            if (agentProfile.experience > 0) {
                personalizedContent = personalizedContent.replace(
                    /real estate professional/g,
                    `real estate professional with ${agentProfile.experience} years of experience`
                );
            }
        }

        if (level === 'heavy') {
            // Add personal brand elements
            if (agentProfile.personalBrand.values.length > 0) {
                personalizedContent += `\n\nI believe in ${agentProfile.personalBrand.values.join(', ')}, and these values guide everything I do for my clients.`;
            }
        }

        return personalizedContent;
    }

    /**
     * Calculate personalization score
     */
    private calculatePersonalizationScore(content: string, agentProfile: z.infer<typeof AgentProfileSchema>): number {
        let score = 0;
        const lowerContent = content.toLowerCase();

        // Check for agent name
        if (lowerContent.includes(agentProfile.name.toLowerCase())) score += 20;

        // Check for location
        if (lowerContent.includes(agentProfile.location.city.toLowerCase())) score += 15;
        if (lowerContent.includes(agentProfile.location.state.toLowerCase())) score += 10;

        // Check for specialties
        const specialtiesIncluded = agentProfile.specialties.filter(specialty =>
            lowerContent.includes(specialty.toLowerCase())
        ).length;
        score += Math.min((specialtiesIncluded / agentProfile.specialties.length) * 25, 25);

        // Check for experience
        if (agentProfile.experience > 0 && lowerContent.includes(agentProfile.experience.toString())) {
            score += 10;
        }

        // Check for personal brand values
        const valuesIncluded = agentProfile.personalBrand.values.filter(value =>
            lowerContent.includes(value.toLowerCase())
        ).length;
        score += Math.min((valuesIncluded / agentProfile.personalBrand.values.length) * 20, 20);

        return Math.min(Math.round(score), 100);
    }

    /**
     * Extract personalization elements
     */
    private extractPersonalizationElements(content: string, agentProfile: z.infer<typeof AgentProfileSchema>): string[] {
        const elements: string[] = [];
        const lowerContent = content.toLowerCase();

        if (lowerContent.includes(agentProfile.name.toLowerCase())) {
            elements.push('Agent Name');
        }

        if (lowerContent.includes(agentProfile.location.city.toLowerCase())) {
            elements.push('Location');
        }

        agentProfile.specialties.forEach(specialty => {
            if (lowerContent.includes(specialty.toLowerCase())) {
                elements.push(`Specialty: ${specialty}`);
            }
        });

        if (agentProfile.experience > 0 && lowerContent.includes(agentProfile.experience.toString())) {
            elements.push('Experience');
        }

        agentProfile.personalBrand.values.forEach(value => {
            if (lowerContent.includes(value.toLowerCase())) {
                elements.push(`Brand Value: ${value}`);
            }
        });

        return elements;
    }

    /**
     * Suggest distribution channels based on content type and agent profile
     */
    private suggestDistributionChannels(contentType: string, agentProfile: z.infer<typeof AgentProfileSchema>): string[] {
        const baseChannels: Record<string, string[]> = {
            'bio': ['website', 'social-media', 'email-signature', 'business-cards'],
            'marketing-plan': ['internal-use', 'team-sharing'],
            'email-campaign': ['email', 'newsletter'],
            'newsletter': ['email', 'website', 'social-media'],
            'client-testimonial-request': ['email', 'direct-message'],
        };

        let channels = baseChannels[contentType] || ['email', 'social-media'];

        // Add channels based on agent profile
        if (agentProfile.targetAudience.demographics.includes('millennials')) {
            channels.push('instagram', 'tiktok');
        }

        if (agentProfile.targetAudience.demographics.includes('professionals')) {
            channels.push('linkedin');
        }

        return [...new Set(channels)]; // Remove duplicates
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
const handler = new MarketingContentServiceHandler();

// Export Lambda handler
export const lambdaHandler = handler.lambdaHandler.bind(handler);

// For testing
export { MarketingContentServiceHandler };