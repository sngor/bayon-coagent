/**
 * AI Service Wrapper with Fallback
 * 
 * Provides a unified interface for AI operations that:
 * 1. Attempts to use the AI Service (Lambda + SQS) for async processing
 * 2. Falls back to direct Bedrock calls if the service is unavailable
 * 3. Provides progress tracking for UI updates
 */

import { getAIServiceClient, AIJobSubmission } from './client';
import { generateBlogPost } from '../bedrock/flows/generate-blog-post';
import { generateSocialMediaPost } from '../bedrock/flows/generate-social-media-post';
import { generateListingDescription } from '../bedrock/flows/listing-description-generator';
import { generateMarketUpdate } from '../bedrock/flows/generate-market-update';

export interface AIOperationOptions {
    userId: string;
    useAsyncService?: boolean; // If false, always use direct Bedrock
    onProgress?: (status: string) => void;
}

/**
 * Generates a blog post using AI Service or direct Bedrock
 */
export async function generateBlogPostWithService(
    input: {
        topic: string;
        tone?: string;
        keywords?: string[];
        targetAudience?: string;
        length?: 'short' | 'medium' | 'long';
    },
    options: AIOperationOptions
): Promise<any> {
    const { userId, useAsyncService = true, onProgress } = options;

    // If async service is disabled or not available, use direct Bedrock
    if (!useAsyncService || !process.env.AI_JOB_REQUEST_QUEUE_URL) {
        onProgress?.('Generating blog post...');
        // Transform input to match Bedrock schema
        const bedrockInput = {
            topic: input.topic,
            includeWebSearch: true,
            searchDepth: 'advanced' as const
        };
        return generateBlogPost(bedrockInput);
    }

    try {
        const client = getAIServiceClient();

        onProgress?.('Submitting job to AI service...');

        // Submit job to AI service
        const submission: AIJobSubmission = {
            jobType: 'blog-post',
            userId,
            input,
        };

        const jobId = await client.submitJob(submission);

        onProgress?.('Job submitted. Processing...');

        // Poll for completion
        const result = await client.pollForCompletion(jobId, userId);

        if (result.status === 'failed') {
            throw new Error(result.error || 'Job failed');
        }

        onProgress?.('Blog post generated successfully');

        return result.result;
    } catch (error) {
        console.error('AI Service error, falling back to direct Bedrock:', error);
        onProgress?.('Falling back to direct generation...');

        // Fallback to direct Bedrock call
        const bedrockInput = {
            topic: input.topic,
            includeWebSearch: true,
            searchDepth: 'advanced' as const
        };
        return generateBlogPost(bedrockInput);
    }
}

/**
 * Generates a social media post using AI Service or direct Bedrock
 */
export async function generateSocialMediaPostWithService(
    input: {
        platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter';
        topic: string;
        tone?: string;
        includeHashtags?: boolean;
        includeEmojis?: boolean;
        callToAction?: string;
    },
    options: AIOperationOptions
): Promise<any> {
    const { userId, useAsyncService = true, onProgress } = options;

    if (!useAsyncService || !process.env.AI_JOB_REQUEST_QUEUE_URL) {
        onProgress?.('Generating social media post...');
        // Transform input to match Bedrock schema
        const bedrockInput = {
            topic: input.topic,
            tone: input.tone || 'professional',
            platforms: [input.platform],
            numberOfVariations: 1
        };
        return generateSocialMediaPost(bedrockInput);
    }

    try {
        const client = getAIServiceClient();

        onProgress?.('Submitting job to AI service...');

        const submission: AIJobSubmission = {
            jobType: 'social-media',
            userId,
            input,
        };

        const jobId = await client.submitJob(submission);
        onProgress?.('Job submitted. Processing...');

        const result = await client.pollForCompletion(jobId, userId);

        if (result.status === 'failed') {
            throw new Error(result.error || 'Job failed');
        }

        onProgress?.('Social media post generated successfully');

        return result.result;
    } catch (error) {
        console.error('AI Service error, falling back to direct Bedrock:', error);
        onProgress?.('Falling back to direct generation...');

        const bedrockInput = {
            topic: input.topic,
            tone: input.tone || 'professional',
            platforms: [input.platform],
            numberOfVariations: 1
        };
        return generateSocialMediaPost(bedrockInput);
    }
}

/**
 * Generates a listing description using AI Service or direct Bedrock
 */
export async function generateListingDescriptionWithService(
    input: {
        propertyType: string;
        bedrooms: number;
        bathrooms: number;
        squareFeet: number;
        price: number;
        address: string;
        features?: string[];
        neighborhood?: string;
        persona?: string;
    },
    options: AIOperationOptions
): Promise<any> {
    const { userId, useAsyncService = true, onProgress } = options;

    if (!useAsyncService || !process.env.AI_JOB_REQUEST_QUEUE_URL) {
        onProgress?.('Generating listing description...');
        // Transform input to match Bedrock schema
        const propertyDetails = `${input.propertyType} with ${input.bedrooms} bedrooms, ${input.bathrooms} bathrooms, ${input.squareFeet} sq ft, priced at $${input.price.toLocaleString()}. Located at ${input.address}${input.neighborhood ? ` in ${input.neighborhood}` : ''}${input.features ? `. Features: ${input.features.join(', ')}` : ''}.`;
        const bedrockInput = {
            propertyDetails: propertyDetails
        };
        return generateListingDescription(bedrockInput);
    }

    try {
        const client = getAIServiceClient();

        onProgress?.('Submitting job to AI service...');

        const submission: AIJobSubmission = {
            jobType: 'listing-description',
            userId,
            input,
        };

        const jobId = await client.submitJob(submission);
        onProgress?.('Job submitted. Processing...');

        const result = await client.pollForCompletion(jobId, userId);

        if (result.status === 'failed') {
            throw new Error(result.error || 'Job failed');
        }

        onProgress?.('Listing description generated successfully');

        return result.result;
    } catch (error) {
        console.error('AI Service error, falling back to direct Bedrock:', error);
        onProgress?.('Falling back to direct generation...');

        const propertyDetails = `${input.propertyType} with ${input.bedrooms} bedrooms, ${input.bathrooms} bathrooms, ${input.squareFeet} sq ft, priced at $${input.price.toLocaleString()}. Located at ${input.address}${input.neighborhood ? ` in ${input.neighborhood}` : ''}${input.features ? `. Features: ${input.features.join(', ')}` : ''}.`;
        const bedrockInput = {
            propertyDetails: propertyDetails
        };
        return generateListingDescription(bedrockInput);
    }
}

/**
 * Generates a market update using AI Service or direct Bedrock
 */
export async function generateMarketUpdateWithService(
    input: {
        location: string;
        marketData?: {
            averagePrice?: number;
            medianPrice?: number;
            daysOnMarket?: number;
            inventoryLevel?: number;
            priceChange?: number;
        };
        timeframe?: 'weekly' | 'monthly' | 'quarterly';
        tone?: string;
    },
    options: AIOperationOptions
): Promise<any> {
    const { userId, useAsyncService = true, onProgress } = options;

    if (!useAsyncService || !process.env.AI_JOB_REQUEST_QUEUE_URL) {
        onProgress?.('Generating market update...');
        // Transform input to match Bedrock schema
        const bedrockInput = {
            location: input.location,
            timePeriod: input.timeframe === 'weekly' ? 'This Week' :
                input.timeframe === 'monthly' ? 'This Month' :
                    input.timeframe === 'quarterly' ? 'This Quarter' : 'Current Period',
            audience: 'real estate professionals and clients'
        };
        return generateMarketUpdate(bedrockInput);
    }

    try {
        const client = getAIServiceClient();

        onProgress?.('Submitting job to AI service...');

        const submission: AIJobSubmission = {
            jobType: 'market-update',
            userId,
            input,
        };

        const jobId = await client.submitJob(submission);
        onProgress?.('Job submitted. Processing...');

        const result = await client.pollForCompletion(jobId, userId);

        if (result.status === 'failed') {
            throw new Error(result.error || 'Job failed');
        }

        onProgress?.('Market update generated successfully');

        return result.result;
    } catch (error) {
        console.error('AI Service error, falling back to direct Bedrock:', error);
        onProgress?.('Falling back to direct generation...');

        const bedrockInput = {
            location: input.location,
            timePeriod: input.timeframe === 'weekly' ? 'This Week' :
                input.timeframe === 'monthly' ? 'This Month' :
                    input.timeframe === 'quarterly' ? 'This Quarter' : 'Current Period',
            audience: 'real estate professionals and clients'
        };
        return generateMarketUpdate(bedrockInput);
    }
}
