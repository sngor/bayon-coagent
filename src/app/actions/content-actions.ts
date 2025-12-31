/**
 * Content Generation Server Actions
 * 
 * Handles all content creation functionality including blog posts,
 * social media content, listing descriptions, and neighborhood guides.
 */

import { z } from 'zod';
import { validateFormData, createSuccessResponse, createErrorResponse } from '@/lib/form-validation';
import { handleAWSError } from './error-handling';
import { 
  generateBlogPost,
  generateSocialMediaPost,
  generateListingDescription,
  generateNeighborhoodGuide,
  generateVideoScript,
  generateMarketUpdate,
} from '@/aws/bedrock/flows/content-flows';

// ============================================================================
// Validation Schemas
// ============================================================================

const blogPostSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(200, 'Topic too long'),
  targetAudience: z.enum(['first-time-buyers', 'sellers', 'investors', 'general']),
  tone: z.enum(['professional', 'friendly', 'authoritative', 'conversational']),
  keywords: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
});

const socialMediaSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok']),
  content: z.string().min(1, 'Content is required').max(500, 'Content too long'),
  tone: z.enum(['professional', 'casual', 'engaging', 'informative']),
  includeHashtags: z.boolean().default(true),
  includeEmojis: z.boolean().default(true),
});

const listingDescriptionSchema = z.object({
  propertyType: z.enum(['single-family', 'condo', 'townhouse', 'multi-family', 'commercial']),
  bedrooms: z.number().min(0).max(20),
  bathrooms: z.number().min(0).max(20),
  squareFootage: z.number().min(0).optional(),
  lotSize: z.number().min(0).optional(),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear()).optional(),
  features: z.array(z.string()).default([]),
  neighborhood: z.string().min(1, 'Neighborhood is required'),
  price: z.number().min(0),
  targetBuyer: z.enum(['first-time-buyer', 'family', 'investor', 'luxury', 'downsizer']),
  tone: z.enum(['professional', 'warm', 'luxurious', 'practical']),
});

const neighborhoodGuideSchema = z.object({
  neighborhood: z.string().min(1, 'Neighborhood is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2, 'Use state abbreviation'),
  targetAudience: z.enum(['families', 'young-professionals', 'retirees', 'investors']),
  includeSchools: z.boolean().default(true),
  includeAmenities: z.boolean().default(true),
  includeTransportation: z.boolean().default(true),
  includeMarketData: z.boolean().default(true),
});

const videoScriptSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  duration: z.enum(['30-seconds', '1-minute', '2-minutes', '5-minutes']),
  style: z.enum(['educational', 'promotional', 'testimonial', 'market-update']),
  targetAudience: z.enum(['buyers', 'sellers', 'investors', 'general']),
  includeCallToAction: z.boolean().default(true),
});

const marketUpdateSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  timeframe: z.enum(['monthly', 'quarterly', 'yearly']),
  propertyTypes: z.array(z.enum(['residential', 'commercial', 'luxury', 'condos'])).min(1),
  includeGraphics: z.boolean().default(true),
  tone: z.enum(['professional', 'accessible', 'detailed']),
});

// ============================================================================
// Server Actions
// ============================================================================

export async function generateBlogPostAction(prevState: any, formData: FormData) {
  const validation = validateFormData(blogPostSchema, formData);

  if (!validation.success) {
    return createErrorResponse(
      validation.error?.message || 'Validation failed',
      validation.error?.details || {},
      prevState?.data
    );
  }

  try {
    const result = await generateBlogPost(validation.data);

    return createSuccessResponse({
      blogPost: result,
      metadata: {
        wordCount: result.content.split(' ').length,
        readingTime: Math.ceil(result.content.split(' ').length / 200),
        generatedAt: new Date().toISOString(),
      },
    }, 'Blog post generated successfully');
  } catch (error) {
    const errorResponse = handleAWSError(error, 'Failed to generate blog post');
    return createErrorResponse(errorResponse.message, {}, prevState?.data);
  }
}

export async function generateSocialMediaPostAction(prevState: any, formData: FormData) {
  const validation = validateFormData(socialMediaSchema, formData);

  if (!validation.success) {
    return createErrorResponse(
      validation.error?.message || 'Validation failed',
      validation.error?.details || {},
      prevState?.data
    );
  }

  try {
    const result = await generateSocialMediaPost(validation.data);

    return createSuccessResponse({
      post: result,
      metadata: {
        characterCount: result.content.length,
        platform: validation.data.platform,
        generatedAt: new Date().toISOString(),
      },
    }, 'Social media post generated successfully');
  } catch (error) {
    const errorResponse = handleAWSError(error, 'Failed to generate social media post');
    return createErrorResponse(errorResponse.message, {}, prevState?.data);
  }
}

export async function generateListingDescriptionAction(prevState: any, formData: FormData) {
  const validation = validateFormData(listingDescriptionSchema, formData);

  if (!validation.success) {
    return createErrorResponse(
      validation.error?.message || 'Validation failed',
      validation.error?.details || {},
      prevState?.data
    );
  }

  try {
    const result = await generateListingDescription(validation.data);

    return createSuccessResponse({
      description: result,
      metadata: {
        wordCount: result.description.split(' ').length,
        propertyType: validation.data.propertyType,
        generatedAt: new Date().toISOString(),
      },
    }, 'Listing description generated successfully');
  } catch (error) {
    const errorResponse = handleAWSError(error, 'Failed to generate listing description');
    return createErrorResponse(errorResponse.message, {}, prevState?.data);
  }
}

export async function generateNeighborhoodGuideAction(prevState: any, formData: FormData) {
  const validation = validateFormData(neighborhoodGuideSchema, formData);

  if (!validation.success) {
    return createErrorResponse(
      validation.error?.message || 'Validation failed',
      validation.error?.details || {},
      prevState?.data
    );
  }

  try {
    const result = await generateNeighborhoodGuide(validation.data);

    return createSuccessResponse({
      guide: result,
      metadata: {
        sections: Object.keys(result.sections).length,
        location: `${validation.data.neighborhood}, ${validation.data.city}, ${validation.data.state}`,
        generatedAt: new Date().toISOString(),
      },
    }, 'Neighborhood guide generated successfully');
  } catch (error) {
    const errorResponse = handleAWSError(error, 'Failed to generate neighborhood guide');
    return createErrorResponse(errorResponse.message, {}, prevState?.data);
  }
}

export async function generateVideoScriptAction(prevState: any, formData: FormData) {
  const validation = validateFormData(videoScriptSchema, formData);

  if (!validation.success) {
    return createErrorResponse(
      validation.error?.message || 'Validation failed',
      validation.error?.details || {},
      prevState?.data
    );
  }

  try {
    const result = await generateVideoScript(validation.data);

    return createSuccessResponse({
      script: result,
      metadata: {
        estimatedDuration: validation.data.duration,
        sceneCount: result.scenes.length,
        generatedAt: new Date().toISOString(),
      },
    }, 'Video script generated successfully');
  } catch (error) {
    const errorResponse = handleAWSError(error, 'Failed to generate video script');
    return createErrorResponse(errorResponse.message, {}, prevState?.data);
  }
}

export async function generateMarketUpdateAction(prevState: any, formData: FormData) {
  const validation = validateFormData(marketUpdateSchema, formData);

  if (!validation.success) {
    return createErrorResponse(
      validation.error?.message || 'Validation failed',
      validation.error?.details || {},
      prevState?.data
    );
  }

  try {
    const result = await generateMarketUpdate(validation.data);

    return createSuccessResponse({
      update: result,
      metadata: {
        location: validation.data.location,
        timeframe: validation.data.timeframe,
        propertyTypes: validation.data.propertyTypes,
        generatedAt: new Date().toISOString(),
      },
    }, 'Market update generated successfully');
  } catch (error) {
    const errorResponse = handleAWSError(error, 'Failed to generate market update');
    return createErrorResponse(errorResponse.message, {}, prevState?.data);
  }
}

// ============================================================================
// Content Management Actions
// ============================================================================

export async function saveContentAction(prevState: any, formData: FormData) {
  const saveContentSchema = z.object({
    type: z.enum(['blog-post', 'social-media', 'listing-description', 'neighborhood-guide', 'video-script', 'market-update']),
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    metadata: z.string().optional(), // JSON string
    tags: z.string().optional(), // Comma-separated tags
  });

  const validation = validateFormData(saveContentSchema, formData);

  if (!validation.success) {
    return createErrorResponse(
      validation.error?.message || 'Validation failed',
      validation.error?.details || {},
      prevState?.data
    );
  }

  try {
    // Parse metadata and tags
    const metadata = validation.data.metadata ? JSON.parse(validation.data.metadata) : {};
    const tags = validation.data.tags ? validation.data.tags.split(',').map(tag => tag.trim()) : [];

    // Save to DynamoDB (implementation would go here)
    const contentId = `content_${Date.now()}`;
    
    return createSuccessResponse({
      contentId,
      type: validation.data.type,
      title: validation.data.title,
      savedAt: new Date().toISOString(),
    }, 'Content saved successfully');
  } catch (error) {
    const errorResponse = handleAWSError(error, 'Failed to save content');
    return createErrorResponse(errorResponse.message, {}, prevState?.data);
  }
}

export async function deleteContentAction(prevState: any, formData: FormData) {
  const deleteContentSchema = z.object({
    contentId: z.string().min(1, 'Content ID is required'),
  });

  const validation = validateFormData(deleteContentSchema, formData);

  if (!validation.success) {
    return createErrorResponse(
      validation.error?.message || 'Validation failed',
      validation.error?.details || {},
      prevState?.data
    );
  }

  try {
    // Delete from DynamoDB (implementation would go here)
    
    return createSuccessResponse({
      contentId: validation.data.contentId,
      deletedAt: new Date().toISOString(),
    }, 'Content deleted successfully');
  } catch (error) {
    const errorResponse = handleAWSError(error, 'Failed to delete content');
    return createErrorResponse(errorResponse.message, {}, prevState?.data);
  }
}

export async function updateContentAction(prevState: any, formData: FormData) {
  const updateContentSchema = z.object({
    contentId: z.string().min(1, 'Content ID is required'),
    title: z.string().min(1, 'Title is required').optional(),
    content: z.string().min(1, 'Content is required').optional(),
    tags: z.string().optional(), // Comma-separated tags
  });

  const validation = validateFormData(updateContentSchema, formData);

  if (!validation.success) {
    return createErrorResponse(
      validation.error?.message || 'Validation failed',
      validation.error?.details || {},
      prevState?.data
    );
  }

  try {
    // Update in DynamoDB (implementation would go here)
    const tags = validation.data.tags ? validation.data.tags.split(',').map(tag => tag.trim()) : undefined;
    
    return createSuccessResponse({
      contentId: validation.data.contentId,
      updatedAt: new Date().toISOString(),
    }, 'Content updated successfully');
  } catch (error) {
    const errorResponse = handleAWSError(error, 'Failed to update content');
    return createErrorResponse(errorResponse.message, {}, prevState?.data);
  }
}