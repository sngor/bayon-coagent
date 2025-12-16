/**
 * AI Service - Content Generation Lambda Handler
 * Handles all AI-powered content generation requests
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCurrentUserFromEvent } from '@/aws/auth/lambda-auth';
import { wrapLambdaHandler } from '@/aws/lambda/wrapper';

// Import AI flows
import { generateNeighborhoodGuide } from '@/aws/bedrock/flows/generate-neighborhood-guides';
import { generateBlogPost } from '@/aws/bedrock/flows/generate-blog-post';
import { generateSocialMediaPost } from '@/aws/bedrock/flows/generate-social-media-post';
import { generateVideoScript } from '@/aws/bedrock/flows/generate-video-script';
import { generateMarketUpdate } from '@/aws/bedrock/flows/generate-market-update';
import { generateFutureCast } from '@/aws/bedrock/flows/generate-future-cast';

// Import schemas
import { GenerateNeighborhoodGuideInputSchema } from '@/ai/schemas/neighborhood-guide-schemas';
import { GenerateBlogPostInputSchema } from '@/ai/schemas/blog-post-schemas';
import { GenerateSocialMediaPostInputSchema } from '@/ai/schemas/social-media-post-schemas';
import { GenerateVideoScriptInputSchema } from '@/ai/schemas/video-script-schemas';
import { GenerateMarketUpdateInputSchema } from '@/ai/schemas/market-update-schemas';
import { GenerateFutureCastInputSchema } from '@/ai/schemas/future-cast-schemas';

interface ContentGenerationRequest {
    type: 'neighborhood-guide' | 'blog-post' | 'social-media-post' | 'video-script' | 'market-update' | 'future-cast';
    input: any;
}

export const handler = wrapLambdaHandler(async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const user = await getCurrentUserFromEvent(event);
    if (!user) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Unauthorized' }),
        };
    }

    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Request body is required' }),
        };
    }

    try {
        const request: ContentGenerationRequest = JSON.parse(event.body);

        let result;

        switch (request.type) {
            case 'neighborhood-guide':
                const guideInput = GenerateNeighborhoodGuideInputSchema.parse(request.input);
                // Map new schema format to old function format
                const mappedGuideInput = {
                    targetMarket: `${guideInput.neighborhood}, ${guideInput.city}, ${guideInput.state}`,
                    pillarTopic: `Complete Guide to ${guideInput.neighborhood} - ${guideInput.targetAudience} Edition`
                };
                result = await generateNeighborhoodGuide(mappedGuideInput);
                break;

            case 'blog-post':
                const blogInput = GenerateBlogPostInputSchema.parse(request.input);
                result = await generateBlogPost(blogInput);
                break;

            case 'social-media-post':
                const socialInput = GenerateSocialMediaPostInputSchema.parse(request.input);
                result = await generateSocialMediaPost(socialInput);
                break;

            case 'video-script':
                const videoInput = GenerateVideoScriptInputSchema.parse(request.input);
                result = await generateVideoScript(videoInput);
                break;

            case 'market-update':
                const marketInput = GenerateMarketUpdateInputSchema.parse(request.input);
                result = await generateMarketUpdate(marketInput);
                break;

            case 'future-cast':
                const futureCastInput = GenerateFutureCastInputSchema.parse(request.input);
                result = await generateFutureCast(futureCastInput);
                break;

            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid content type' }),
                };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: true,
                data: result,
            }),
        };
    } catch (error: any) {
        console.error('Content generation error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Content generation failed',
                message: error.message,
            }),
        };
    }
});