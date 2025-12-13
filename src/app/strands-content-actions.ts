'use server';

/**
 * Enhanced Content Actions using Strands-Inspired Content Studio
 * 
 * These actions replace your existing content generation actions with
 * unified, intelligent content creation capabilities.
 */

import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { z } from 'zod';
import {
    generateContent,
    generateBlogPost,
    generateSocialMediaPosts,
    generateMarketUpdate,
    type ContentStudioInput,
    type ContentStudioOutput,
    ContentTypeSchema,
    ContentToneSchema,
    SocialPlatformSchema
} from '@/services/strands/content-studio-service';

// Enhanced blog post action schema
const enhancedBlogPostSchema = z.object({
    topic: z.string().min(1, 'Blog topic is required'),
    tone: ContentToneSchema.default('professional'),
    targetAudience: z.enum(['buyers', 'sellers', 'investors', 'agents', 'general']).default('general'),
    length: z.enum(['short', 'medium', 'long']).default('medium'),
    includeWebSearch: z.boolean().default(true),
    includeSEO: z.boolean().default(true),
    location: z.string().optional(),
});

// Enhanced social media action schema
const enhancedSocialMediaSchema = z.object({
    topic: z.string().min(1, 'Social media topic is required'),
    platforms: z.array(SocialPlatformSchema).min(1, 'At least one platform is required'),
    tone: ContentToneSchema.default('conversational'),
    targetAudience: z.enum(['buyers', 'sellers', 'investors', 'agents', 'general']).default('general'),
    includeHashtags: z.boolean().default(true),
    numberOfVariations: z.number().min(1).max(3).default(1),
});

// Enhanced market update action schema
const enhancedMarketUpdateSchema = z.object({
    topic: z.string().min(1, 'Market update topic is required'),
    location: z.string().min(1, 'Location is required'),
    tone: ContentToneSchema.default('professional'),
    includeData: z.boolean().default(true),
    includeWebSearch: z.boolean().default(true),
});

// Video script action schema
const videoScriptSchema = z.object({
    topic: z.string().min(1, 'Video topic is required'),
    tone: ContentToneSchema.default('conversational'),
    length: z.enum(['short', 'medium', 'long']).default('medium'),
    targetAudience: z.enum(['buyers', 'sellers', 'investors', 'agents', 'general']).default('general'),
    includeWebSearch: z.boolean().default(true),
});

/**
 * Enhanced Blog Post Action
 * Replaces: generateBlogPostAction
 */
export async function generateEnhancedBlogPostAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ContentStudioOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate content' },
            data: null,
        };
    }

    // Validate input
    const validatedFields = enhancedBlogPostSchema.safeParse({
        topic: formData.get('topic'),
        tone: formData.get('tone') || 'professional',
        targetAudience: formData.get('targetAudience') || 'general',
        length: formData.get('length') || 'medium',
        includeWebSearch: formData.get('includeWebSearch') !== 'false',
        includeSEO: formData.get('includeSEO') !== 'false',
        location: formData.get('location') || undefined,
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.topic?.[0] || 'Validation failed',
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log('🎨 Starting enhanced blog post generation...');

        // Try enhanced content studio first
        try {
            const result = await generateBlogPost(
                validatedFields.data.topic,
                user.id,
                {
                    tone: validatedFields.data.tone,
                    targetAudience: validatedFields.data.targetAudience,
                    length: validatedFields.data.length,
                    includeWebSearch: validatedFields.data.includeWebSearch,
                    includeSEO: validatedFields.data.includeSEO,
                    location: validatedFields.data.location,
                    saveToLibrary: true,
                }
            );

            if (result.success) {
                console.log('✅ Enhanced blog post generated successfully');
                return {
                    message: 'success',
                    data: result,
                    errors: {},
                };
            }
        } catch (enhancedError) {
            console.warn('⚠️ Enhanced blog generation failed, using fallback:', enhancedError);
        }

        // Fallback to original Bedrock implementation
        console.log('🔄 Using standard Bedrock blog generation');
        const { generateBlogPost: originalGenerateBlogPost } = await import('@/aws/bedrock/flows/generate-blog-post');

        const bedrockResult = await originalGenerateBlogPost({
            topic: validatedFields.data.topic,
            includeWebSearch: validatedFields.data.includeWebSearch,
        });

        // Transform to match ContentStudioOutput format
        const transformedResult: ContentStudioOutput = {
            success: true,
            content: [{
                type: 'blog-post',
                title: validatedFields.data.topic,
                body: bedrockResult.blogPost,
            }],
            citations: bedrockResult.sources?.map(s => s.url),
            timestamp: new Date().toISOString(),
            userId: user.id,
            source: 'bedrock-fallback',
        };

        return {
            message: 'success',
            data: transformedResult,
            errors: {},
        };

    } catch (error) {
        console.error('❌ Blog post generation failed:', error);
        return {
            message: `Blog post generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Enhanced Social Media Action
 * Replaces: generateSocialMediaPostAction
 */
export async function generateEnhancedSocialMediaAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ContentStudioOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate content' },
            data: null,
        };
    }

    // Parse platforms from form data
    const platformsData = formData.get('platforms');
    let platforms: string[] = [];

    if (typeof platformsData === 'string') {
        try {
            platforms = JSON.parse(platformsData);
        } catch {
            platforms = [platformsData];
        }
    }

    // Validate input
    const validatedFields = enhancedSocialMediaSchema.safeParse({
        topic: formData.get('topic'),
        platforms,
        tone: formData.get('tone') || 'conversational',
        targetAudience: formData.get('targetAudience') || 'general',
        includeHashtags: formData.get('includeHashtags') !== 'false',
        numberOfVariations: parseInt(formData.get('numberOfVariations') as string) || 1,
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.topic?.[0] || fieldErrors.platforms?.[0] || 'Validation failed',
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log('🎨 Starting enhanced social media generation...');

        // Try enhanced content studio first
        try {
            const result = await generateSocialMediaPosts(
                validatedFields.data.topic,
                user.id,
                validatedFields.data.platforms,
                {
                    tone: validatedFields.data.tone,
                    targetAudience: validatedFields.data.targetAudience,
                    includeHashtags: validatedFields.data.includeHashtags,
                    generateVariations: validatedFields.data.numberOfVariations,
                    saveToLibrary: true,
                }
            );

            if (result.success) {
                console.log('✅ Enhanced social media posts generated successfully');
                return {
                    message: 'success',
                    data: result,
                    errors: {},
                };
            }
        } catch (enhancedError) {
            console.warn('⚠️ Enhanced social media generation failed, using fallback:', enhancedError);
        }

        // Fallback to original Bedrock implementation
        console.log('🔄 Using standard Bedrock social media generation');
        const { generateSocialMediaPost } = await import('@/aws/bedrock/flows/generate-social-media-post');

        const bedrockResult = await generateSocialMediaPost({
            topic: validatedFields.data.topic,
            tone: validatedFields.data.tone,
            platforms: validatedFields.data.platforms,
            numberOfVariations: validatedFields.data.numberOfVariations,
        });

        // Transform to match ContentStudioOutput format
        const transformedContent = bedrockResult.variations.flatMap((variation, index) =>
            validatedFields.data.platforms.map(platform => ({
                type: 'social-media' as const,
                title: `${validatedFields.data.topic} - ${platform}`,
                body: variation[platform as keyof typeof variation] || '',
                platform: platform as any,
                metadata: { variation: index + 1 }
            }))
        );

        const transformedResult: ContentStudioOutput = {
            success: true,
            content: transformedContent,
            timestamp: new Date().toISOString(),
            userId: user.id,
            source: 'bedrock-fallback',
        };

        return {
            message: 'success',
            data: transformedResult,
            errors: {},
        };

    } catch (error) {
        console.error('❌ Social media generation failed:', error);
        return {
            message: `Social media generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Enhanced Market Update Action
 * Replaces: generateMarketUpdateAction
 */
export async function generateEnhancedMarketUpdateAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ContentStudioOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate content' },
            data: null,
        };
    }

    // Validate input
    const validatedFields = enhancedMarketUpdateSchema.safeParse({
        topic: formData.get('topic'),
        location: formData.get('location'),
        tone: formData.get('tone') || 'professional',
        includeData: formData.get('includeData') !== 'false',
        includeWebSearch: formData.get('includeWebSearch') !== 'false',
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.topic?.[0] || fieldErrors.location?.[0] || 'Validation failed',
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log('🎨 Starting enhanced market update generation...');

        // Try enhanced content studio first
        try {
            const result = await generateMarketUpdate(
                validatedFields.data.topic,
                user.id,
                validatedFields.data.location,
                {
                    tone: validatedFields.data.tone,
                    includeData: validatedFields.data.includeData,
                    includeWebSearch: validatedFields.data.includeWebSearch,
                    saveToLibrary: true,
                }
            );

            if (result.success) {
                console.log('✅ Enhanced market update generated successfully');
                return {
                    message: 'success',
                    data: result,
                    errors: {},
                };
            }
        } catch (enhancedError) {
            console.warn('⚠️ Enhanced market update generation failed, using fallback:', enhancedError);
        }

        // Fallback to original Bedrock implementation
        console.log('🔄 Using standard Bedrock market update generation');
        const { generateMarketUpdate: originalGenerateMarketUpdate } = await import('@/aws/bedrock/flows/generate-market-update');

        const bedrockResult = await originalGenerateMarketUpdate({
            location: validatedFields.data.location,
            timePeriod: 'current',
            audience: validatedFields.data.topic,
        });

        // Transform to match ContentStudioOutput format
        const transformedResult: ContentStudioOutput = {
            success: true,
            content: [{
                type: 'market-update',
                title: bedrockResult.title,
                body: bedrockResult.content,
            }],
            timestamp: new Date().toISOString(),
            userId: user.id,
            source: 'bedrock-fallback',
        };

        return {
            message: 'success',
            data: transformedResult,
            errors: {},
        };

    } catch (error) {
        console.error('❌ Market update generation failed:', error);
        return {
            message: `Market update generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Enhanced Video Script Action
 * New capability - generates video scripts with research and structure
 */
export async function generateEnhancedVideoScriptAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ContentStudioOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate content' },
            data: null,
        };
    }

    // Validate input
    const validatedFields = videoScriptSchema.safeParse({
        topic: formData.get('topic'),
        tone: formData.get('tone') || 'conversational',
        length: formData.get('length') || 'medium',
        targetAudience: formData.get('targetAudience') || 'general',
        includeWebSearch: formData.get('includeWebSearch') !== 'false',
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.topic?.[0] || 'Validation failed',
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log('🎨 Starting enhanced video script generation...');

        const result = await generateContent({
            contentType: 'video-script',
            topic: validatedFields.data.topic,
            userId: user.id,
            tone: validatedFields.data.tone,
            targetAudience: validatedFields.data.targetAudience,
            length: validatedFields.data.length,
            includeWebSearch: validatedFields.data.includeWebSearch,
            saveToLibrary: true,
        });

        if (result.success) {
            console.log('✅ Enhanced video script generated successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Video script generation failed');
        }

    } catch (error) {
        console.error('❌ Video script generation failed:', error);
        return {
            message: `Video script generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Universal Content Generation Action
 * Handles any content type with unified interface
 */
export async function generateUniversalContentAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ContentStudioOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate content' },
            data: null,
        };
    }

    try {
        // Parse form data into ContentStudioInput
        const contentType = formData.get('contentType') as string;
        const topic = formData.get('topic') as string;

        if (!contentType || !topic) {
            return {
                message: 'Content type and topic are required',
                errors: { validation: 'Missing required fields' },
                data: null,
            };
        }

        // Build input object
        const input: ContentStudioInput = {
            contentType: contentType as any,
            topic,
            userId: user.id,
            tone: (formData.get('tone') as any) || 'professional',
            targetAudience: (formData.get('targetAudience') as any) || 'general',
            length: (formData.get('length') as any) || 'medium',
            platforms: formData.get('platforms') ? JSON.parse(formData.get('platforms') as string) : undefined,
            includeHashtags: formData.get('includeHashtags') !== 'false',
            includeWebSearch: formData.get('includeWebSearch') !== 'false',
            includeSEO: formData.get('includeSEO') !== 'false',
            includeData: formData.get('includeData') !== 'false',
            location: formData.get('location') as string || undefined,
            saveToLibrary: formData.get('saveToLibrary') !== 'false',
            generateVariations: parseInt(formData.get('generateVariations') as string) || 1,
        };

        console.log(`🎨 Starting universal content generation: ${contentType} - ${topic}`);

        const result = await generateContent(input);

        if (result.success) {
            console.log('✅ Universal content generated successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Content generation failed');
        }

    } catch (error) {
        console.error('❌ Universal content generation failed:', error);
        return {
            message: `Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}