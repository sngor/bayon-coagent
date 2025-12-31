'use server';

/**
 * Studio Hub Server Actions
 * 
 * Handles content creation workflows:
 * - Write: Blog posts, social media, market updates, video scripts
 * - Describe: Listing descriptions with persona targeting
 * - Reimagine: AI image editing and enhancement
 */

import { z } from 'zod';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { withErrorHandling, AuthenticationError } from '@/lib/error-handling/unified-error-handler';
import type { ActionResponse } from '@/lib/error-handling/unified-error-handler';

// Studio action schemas
const generateContentSchema = z.object({
    contentType: z.enum(['blog-post', 'social-media', 'market-update', 'video-script', 'neighborhood-guide']),
    topic: z.string().min(10, 'Please provide a more detailed topic'),
    tone: z.enum(['Professional', 'Casual', 'Enthusiastic', 'Humorous']).default('Professional'),
    targetAudience: z.enum(['buyers', 'sellers', 'investors', 'agents']).default('buyers'),
});

const describeListingSchema = z.object({
    propertyDescription: z.string().min(50, 'Property description must be at least 50 characters'),
    buyerPersona: z.string().min(3, 'Buyer persona is required'),
    highlights: z.array(z.string()).optional(),
});

const reimagineImageSchema = z.object({
    imageData: z.string().min(1, 'Image data required'), // Base64 encoded image
    imageFormat: z.enum(['jpeg', 'png', 'webp']).default('jpeg'),
    enhancement: z.enum(['virtual-staging', 'day-to-dusk', 'enhancement', 'item-removal', 'renovation']),
    customPrompt: z.string().optional(),
    brightness: z.number().optional(),
    contrast: z.number().optional(),
    saturation: z.number().optional(),
});

/**
 * Generate content using AI (Write tab)
 */
export const generateContentAction = withErrorHandling(
    async (input: z.infer<typeof generateContentSchema>): Promise<ActionResponse<{
        content: string;
        title: string;
        metadata: any;
    }>> => {
        const user = await getCurrentUserServer();
        if (!user) {
            throw new AuthenticationError('Please sign in to generate content', 'studio');
        }

        const validatedInput = generateContentSchema.parse(input);

        // Import the appropriate content generation flow
        const { generateBlogPost } = await import('@/aws/bedrock/flows/generate-blog-post');
        const { generateSocialMediaPost } = await import('@/aws/bedrock/flows/generate-social-media-post');
        const { generateMarketUpdate } = await import('@/aws/bedrock/flows/generate-market-update');
        const { generateVideoScript } = await import('@/aws/bedrock/flows/generate-video-script');
        const { generateNeighborhoodGuide } = await import('@/aws/bedrock/flows/generate-neighborhood-guides');

        let result;
        switch (validatedInput.contentType) {
            case 'blog-post':
                result = await generateBlogPost({
                    topic: validatedInput.topic,
                    includeWebSearch: true,
                    searchDepth: 'basic'
                });
                break;

            case 'social-media':
                result = await generateSocialMediaPost({
                    topic: validatedInput.topic,
                    tone: validatedInput.tone,
                    platforms: ['linkedin', 'facebook', 'instagram'],
                    numberOfVariations: 1,
                });
                break;

            case 'market-update':
                result = await generateMarketUpdate({
                    location: 'General Market', // Default location
                    timePeriod: 'Current', // Default time period
                    audience: validatedInput.targetAudience,
                });
                break;

            case 'video-script':
                result = await generateVideoScript({
                    topic: validatedInput.topic,
                    tone: validatedInput.tone,
                    audience: validatedInput.targetAudience || 'General',
                });
                break;

            case 'neighborhood-guide':
                result = await generateNeighborhoodGuide({
                    targetMarket: validatedInput.topic,
                    pillarTopic: `Comprehensive guide for ${validatedInput.topic}`,
                });
                break;

            default:
                throw new Error(`Unsupported content type: ${validatedInput.contentType}`);
        }

        // Extract content based on the result type
        let content = '';
        let title = '';
        
        if ('blogPost' in result) {
            content = result.blogPost;
            title = `Blog Post - ${validatedInput.topic}`;
        } else if ('posts' in result && Array.isArray(result.posts) && result.posts.length > 0) {
            const firstPost = result.posts[0];
            content = (firstPost && typeof firstPost === 'object' && 'content' in firstPost) ? 
                     firstPost.content : 
                     (typeof firstPost === 'string' ? firstPost : JSON.stringify(firstPost));
            title = `Social Media - ${validatedInput.topic}`;
        } else if ('script' in result) {
            // Handle script object or string
            content = typeof result.script === 'string' ? result.script : 
                     (typeof result.script === 'object' && result.script?.title ? 
                      `${result.script.title}\n\n${result.script.content || ''}` : 
                      JSON.stringify(result.script));
            title = `Video Script - ${validatedInput.topic}`;
        } else if ('neighborhoodGuide' in result) {
            content = result.neighborhoodGuide;
            title = `Neighborhood Guide - ${validatedInput.topic}`;
        } else if ('content' in result) {
            content = result.content;
            title = result.title || `${validatedInput.contentType} - ${validatedInput.topic}`;
        }

        return {
            success: true,
            message: 'Content generated successfully',
            data: {
                content,
                title,
                metadata: {
                    contentType: validatedInput.contentType,
                    generatedAt: new Date().toISOString(),
                    userId: user.id,
                },
            },
        };
    },
    'studio'
);

/**
 * Generate listing description (Describe tab)
 */
export const describeListingAction = withErrorHandling(
    async (input: z.infer<typeof describeListingSchema>): Promise<ActionResponse<{
        description: string;
        faqs: Array<{ question: string; answer: string }>;
    }>> => {
        const user = await getCurrentUserServer();
        if (!user) {
            throw new AuthenticationError('Please sign in to generate descriptions', 'studio');
        }

        const validatedInput = describeListingSchema.parse(input);

        const { generateListingDescription } = await import('@/aws/bedrock/flows/listing-description-generator');
        const { generateListingFaqs } = await import('@/aws/bedrock/flows/generate-listing-faqs');

        // Run description and FAQ generation in parallel
        const [descriptionResult, faqResult] = await Promise.all([
            generateListingDescription({
                property_details: validatedInput.propertyDescription,
            }),
            generateListingFaqs({
                propertyDescription: validatedInput.propertyDescription,
            }),
        ]);

        return {
            success: true,
            message: 'Listing description generated successfully',
            data: {
                description: descriptionResult.description,
                faqs: faqResult.faqs.map(faq => ({
                    question: faq.q,
                    answer: faq.a
                })),
            },
        };
    },
    'studio'
);

/**
 * Reimagine image with AI (Reimagine tab)
 */
export const reimagineImageAction = withErrorHandling(
    async (input: z.infer<typeof reimagineImageSchema>): Promise<ActionResponse<{
        imageData: string;
        imageFormat: string;
        enhancementType: string;
    }>> => {
        const user = await getCurrentUserServer();
        if (!user) {
            throw new AuthenticationError('Please sign in to reimagine images', 'studio');
        }

        const validatedInput = reimagineImageSchema.parse(input);

        // Import image enhancement service
        const { enhanceImage } = await import('@/aws/bedrock/flows/reimagine-enhance');

        const result = await enhanceImage({
            imageData: validatedInput.imageData, // Expecting base64 data
            imageFormat: validatedInput.imageFormat || 'jpeg',
            params: {
                autoAdjust: true,
                brightness: validatedInput.brightness,
                contrast: validatedInput.contrast,
                saturation: validatedInput.saturation,
            }
        });

        return {
            success: true,
            message: 'Image reimagined successfully',
            data: {
                imageData: result.enhancedImageData,
                imageFormat: result.imageFormat,
                enhancementType: validatedInput.enhancement,
            },
        };
    },
    'studio'
);