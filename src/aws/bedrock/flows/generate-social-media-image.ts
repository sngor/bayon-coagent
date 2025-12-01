'use server';

/**
 * @fileOverview Bedrock flow for generating social media images using Amazon Titan Image Generator
 */

import { defineFlow, definePrompt, BEDROCK_MODELS } from '../flow-base';
import { getGuardrailsService, DEFAULT_GUARDRAILS_CONFIG } from '../guardrails';
import {
    GenerateSocialMediaImageInputSchema,
    GenerateSocialMediaImageOutputSchema,
    getDimensionsFromAspectRatio,
    type GenerateSocialMediaImageInput,
    type GenerateSocialMediaImageOutput,
} from '@/ai/schemas/social-media-image-schemas';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { getBedrockClient } from '../client';

/**
 * Style descriptions for different visual styles
 */
const STYLE_DESCRIPTIONS: Record<string, string> = {
    professional: 'professional, clean, corporate, business-appropriate, polished',
    modern: 'modern, contemporary, sleek, minimalist, trendy',
    luxury: 'luxury, high-end, elegant, sophisticated, premium',
    minimalist: 'minimalist, simple, clean lines, uncluttered, essential',
    vibrant: 'vibrant, colorful, energetic, bold, eye-catching',
    elegant: 'elegant, refined, graceful, tasteful, classic',
};

/**
 * Generate image prompt based on topic and style
 */
function buildImagePrompt(input: GenerateSocialMediaImageInput): string {
    const styleDesc = STYLE_DESCRIPTIONS[input.style] || STYLE_DESCRIPTIONS.professional;

    let prompt = `A ${styleDesc} real estate marketing image for social media about: ${input.topic}. `;

    // Add real estate context
    prompt += 'Professional real estate photography style, high quality, suitable for luxury property marketing. ';

    // Add aspect ratio context
    if (input.aspectRatio === '9:16') {
        prompt += 'Vertical composition optimized for mobile viewing. ';
    } else if (input.aspectRatio === '16:9') {
        prompt += 'Horizontal landscape composition. ';
    } else if (input.aspectRatio === '1:1') {
        prompt += 'Square composition, centered subject. ';
    }

    // Add text overlay note if requested
    if (input.includeText) {
        prompt += 'Leave space for text overlay. ';
    }

    // Add custom prompt if provided
    if (input.customPrompt) {
        prompt += input.customPrompt;
    }

    return prompt;
}

/**
 * Generate image using Amazon Titan Image Generator with a specific seed
 */
async function generateImageWithTitan(
    prompt: string,
    aspectRatio: string,
    seed?: number
): Promise<{ imageData: string; seed: number }> {
    const client = getBedrockClient();
    const dimensions = getDimensionsFromAspectRatio(aspectRatio);
    const usedSeed = seed || Math.floor(Math.random() * 2147483647);

    const requestBody = {
        taskType: 'TEXT_IMAGE',
        textToImageParams: {
            text: prompt,
        },
        imageGenerationConfig: {
            numberOfImages: 1,
            quality: 'premium',
            height: dimensions.height,
            width: dimensions.width,
            cfgScale: 8.0,
            seed: usedSeed,
        },
    };

    try {
        const command = new InvokeModelCommand({
            modelId: 'amazon.titan-image-generator-v2:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(requestBody),
        });

        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        if (responseBody.images && responseBody.images.length > 0) {
            // Return base64 image data and seed
            return {
                imageData: responseBody.images[0],
                seed: usedSeed,
            };
        }

        throw new Error('No image generated');
    } catch (error) {
        console.error('[Titan Image Generation] Error:', error);
        throw new Error('Failed to generate image with Amazon Titan');
    }
}

const generateSocialMediaImageFlow = defineFlow(
    {
        name: 'generateSocialMediaImageFlow',
        inputSchema: GenerateSocialMediaImageInputSchema,
        outputSchema: GenerateSocialMediaImageOutputSchema,
    },
    async (input) => {
        // 1. Validate input with Guardrails
        const guardrails = getGuardrailsService();
        const validationResult = guardrails.validateRequest(input.topic, DEFAULT_GUARDRAILS_CONFIG);

        if (!validationResult.allowed) {
            throw new Error(`Guardrails validation failed: ${validationResult.reason}`);
        }

        // Use sanitized prompt if PII was detected
        const topic = validationResult.sanitizedPrompt || input.topic;

        // 2. Build image generation prompt
        const imagePrompt = buildImagePrompt({ ...input, topic });

        // 3. Generate multiple image variations using Amazon Titan
        const numberOfImages = input.numberOfImages || 3;
        const imagePromises = [];

        for (let i = 0; i < numberOfImages; i++) {
            imagePromises.push(generateImageWithTitan(imagePrompt, input.aspectRatio));
        }

        const results = await Promise.all(imagePromises);

        return {
            images: results.map(result => ({
                imageUrl: `data:image/png;base64,${result.imageData}`,
                prompt: imagePrompt,
                seed: result.seed,
            })),
            aspectRatio: input.aspectRatio,
        };
    }
);

export async function generateSocialMediaImage(
    input: GenerateSocialMediaImageInput
): Promise<GenerateSocialMediaImageOutput> {
    return generateSocialMediaImageFlow.execute(input);
}

/**
 * Regenerate a single image with the same prompt but different seed
 */
export async function regenerateSingleImage(
    prompt: string,
    aspectRatio: string
): Promise<{ imageUrl: string; seed: number }> {
    const result = await generateImageWithTitan(prompt, aspectRatio);
    return {
        imageUrl: `data:image/png;base64,${result.imageData}`,
        seed: result.seed,
    };
}
