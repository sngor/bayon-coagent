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
    imageUrl: z.string().url('Valid image URL required'),
    enhancement: z.enum(['virtual-staging', 'day-to-dusk', 'enhancement', 'item-removal', 'renovation']),
    customPrompt: z.string().optional(),
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
                    tone: validatedInput.tone,
                    targetAudience: validatedInput.targetAudience,
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
                    topic: validatedInput.topic,
                    targetAudience: validatedInput.targetAudience,
                });
                break;

            case 'video-script':
                result = await generateVideoScript({
                    topic: validatedInput.topic,
                    tone: validatedInput.tone,
                    duration: 'medium',
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

        return {
            success: true,
            message: 'Content generated successfully',
            data: {
                content: result.content || result.blogPost || result.posts?.[0]?.content || result.script || result.neighborhoodGuide,
                title: result.title || `${validatedInput.contentType} - ${validatedInput.topic}`,
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
                propertyDetails: validatedInput.propertyDescription,
                buyerPersona: validatedInput.buyerPersona,
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
                faqs: faqResult.faqs,
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
        imageUrl: string;
        enhancementType: string;
    }>> => {
        const user = await getCurrentUserServer();
        if (!user) {
            throw new AuthenticationError('Please sign in to reimagine images', 'studio');
        }

        const validatedInput = reimagineImageSchema.parse(input);

        // Import image enhancement service
        const { enhanceImage } = await import('@/services/image-enhancement');

        const result = await enhanceImage({
            imageUrl: validatedInput.imageUrl,
            enhancement: validatedInput.enhancement,
            customPrompt: validatedInput.customPrompt,
        });

        return {
            success: true,
            message: 'Image reimagined successfully',
            data: {
                imageUrl: result.enhancedImageUrl,
                enhancementType: validatedInput.enhancement,
            },
        };
    },
    'studio'
);