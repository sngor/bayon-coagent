'use server';

/**
 * @fileOverview Google Gemini 3.0 Pro Image generation service
 * Uses Gemini 3 Pro Image Preview (Nano Banana Pro) for state-of-the-art image generation
 * Falls back to Gemini 2.5 Flash Image for faster generation if needed
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

// Model names - Using the latest Gemini 3 Pro Image Preview
const GEMINI_3_PRO_IMAGE = 'gemini-3-pro-image-preview'; // State-of-the-art, up to 4K, thinking mode
const GEMINI_2_5_FLASH_IMAGE = 'gemini-2.5-flash-image'; // Fast alternative

export interface GenerateImageInput {
    prompt: string;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    useAdvancedModel?: boolean; // If true, use Gemini 3 Pro Image
    referenceImage?: string; // Base64 encoded image
    referenceImageMimeType?: string;
}

export interface GenerateImageOutput {
    imageUrl: string;
    mimeType: string;
}

/**
 * Generate an image using Gemini 3 Pro Image or Gemini 2.5 Flash Image
 */
export async function generateImageWithGemini(
    input: GenerateImageInput
): Promise<GenerateImageOutput> {
    if (!GOOGLE_AI_API_KEY) {
        throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    try {
        const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);

        // Use Gemini 3 Pro Image Preview by default for highest quality
        const modelName = input.useAdvancedModel !== false ? GEMINI_3_PRO_IMAGE : GEMINI_2_5_FLASH_IMAGE;

        console.log(`[Gemini Image Generation] Using model: ${modelName}`);

        const model = genAI.getGenerativeModel({ model: modelName });

        const promptParts: any[] = [input.prompt];

        // Add reference image if provided
        if (input.referenceImage) {
            promptParts.push({
                inlineData: {
                    data: input.referenceImage,
                    mimeType: input.referenceImageMimeType || 'image/png',
                },
            });
        }

        const result = await model.generateContent(promptParts);
        const response = await result.response;

        // Extract image from response
        if (response.candidates && response.candidates[0]) {
            const candidate = response.candidates[0];

            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        const imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;

                        console.log(`[Gemini Image Generation] Image generated successfully with ${modelName}`);

                        return {
                            imageUrl,
                            mimeType: part.inlineData.mimeType || 'image/png',
                        };
                    }
                }
            }
        }

        throw new Error('No image data found in Gemini response');
    } catch (error) {
        console.error('[Gemini Image Generation] Error:', error);

        // If Gemini 3 Pro failed and we haven't tried the fast model yet, try it
        if (input.useAdvancedModel !== false && error instanceof Error) {
            console.log('[Gemini Image Generation] Falling back to Gemini 2.5 Flash Image');
            return generateImageWithGemini({
                ...input,
                useAdvancedModel: false,
            });
        }

        throw error;
    }
}

/**
 * Generate a blog post header image using Gemini 3 Pro Image
 */
export async function generateBlogHeaderImage(topic: string): Promise<string> {
    const prompt = `A professional, high-quality header image for a real estate blog post about: "${topic}". Professional photography style, modern and bright, featuring real estate elements like houses, neighborhoods, or property details. Clean composition, visually appealing, suitable for a real estate blog header. No text or overlays. 16:9 aspect ratio.`;

    const result = await generateImageWithGemini({
        prompt,
        aspectRatio: '16:9',
        useAdvancedModel: true,
    });

    return result.imageUrl;
}

export interface EditImageInput {
    prompt: string;
    referenceImage: string; // Base64 encoded image
    mimeType?: string;
}

export interface EditImageOutput {
    imageUrl: string;
    mimeType: string;
}

/**
 * Edit an image using Gemini 3 Pro Image with reference image
 * Gemini 3 Pro supports up to 14 reference images and advanced editing
 */
export async function editImageWithGemini(
    input: EditImageInput
): Promise<EditImageOutput> {
    if (!GOOGLE_AI_API_KEY) {
        throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    try {
        const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
        const model = genAI.getGenerativeModel({ model: GEMINI_3_PRO_IMAGE });

        // Prepare the reference image
        const imageData = {
            inlineData: {
                data: input.referenceImage,
                mimeType: input.mimeType || 'image/png',
            },
        };

        const result = await model.generateContent([input.prompt, imageData]);
        const response = await result.response;

        // Extract image from response
        if (response.candidates && response.candidates[0]) {
            const candidate = response.candidates[0];

            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        const imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;

                        return {
                            imageUrl,
                            mimeType: part.inlineData.mimeType || 'image/png',
                        };
                    }
                }
            }
        }

        throw new Error('No image data found in Gemini response');
    } catch (error) {
        console.error('Error editing image with Gemini:', error);
        throw error;
    }
}

// Legacy alias for backward compatibility
export const editImageWithImagen = editImageWithGemini;
