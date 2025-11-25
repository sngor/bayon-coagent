'use server';

/**
 * @fileOverview Google Imagen image generation service
 * Uses Imagen 4.0 Ultra model for high-quality image generation
 */

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const IMAGEN_GENERATE_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-001:predict';
const IMAGEN_EDIT_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict';

export interface GenerateImageInput {
    prompt: string;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

export interface GenerateImageOutput {
    imageUrl: string;
    mimeType: string;
}

/**
 * Generate an image using Google Imagen 4.0 API
 */
export async function generateImageWithGemini(
    input: GenerateImageInput
): Promise<GenerateImageOutput> {
    if (!GOOGLE_AI_API_KEY) {
        throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    try {
        const response = await fetch(
            `${IMAGEN_GENERATE_API_URL}?key=${GOOGLE_AI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    instances: [
                        {
                            prompt: input.prompt,
                        },
                    ],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: input.aspectRatio || '16:9',
                        safetyFilterLevel: 'block_some',
                        personGeneration: 'allow_adult',
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `Imagen API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
            );
        }

        const data = await response.json();

        // Extract the image data from the response
        if (!data.predictions || !data.predictions[0]) {
            throw new Error('Invalid response from Imagen API');
        }

        const prediction = data.predictions[0];

        // Imagen returns base64 encoded image data
        if (prediction.bytesBase64Encoded) {
            const imageUrl = `data:image/png;base64,${prediction.bytesBase64Encoded}`;

            return {
                imageUrl,
                mimeType: prediction.mimeType || 'image/png',
            };
        }

        throw new Error('No image data found in Imagen response');
    } catch (error) {
        console.error('Error generating image with Imagen:', error);
        throw error;
    }
}

/**
 * Generate a blog post header image using Imagen 4.0 Ultra
 */
export async function generateBlogHeaderImage(topic: string): Promise<string> {
    const prompt = `A professional, high-quality header image for a real estate blog post about: "${topic}". Professional photography style, modern and bright, featuring real estate elements like houses, neighborhoods, or property details. Clean composition, visually appealing, suitable for a real estate blog header. No text or overlays. 16:9 aspect ratio.`;

    const result = await generateImageWithGemini({
        prompt,
        aspectRatio: '16:9',
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
 * Edit an image using Google Imagen 3.0 API with reference image
 * Used for virtual staging and other image editing tasks
 * Note: Using Imagen 3.0 as it supports image editing, while 4.0 Ultra is text-to-image only
 */
export async function editImageWithImagen(
    input: EditImageInput
): Promise<EditImageOutput> {
    if (!GOOGLE_AI_API_KEY) {
        throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    try {
        const response = await fetch(
            `${IMAGEN_EDIT_API_URL}?key=${GOOGLE_AI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    instances: [
                        {
                            prompt: input.prompt,
                            referenceImages: [
                                {
                                    referenceType: 1,
                                    referenceImage: {
                                        bytesBase64Encoded: input.referenceImage,
                                    },
                                },
                            ],
                        },
                    ],
                    parameters: {
                        sampleCount: 1,
                        mode: 'upscale',
                        safetyFilterLevel: 'block_some',
                        personGeneration: 'allow_adult',
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `Imagen API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
            );
        }

        const data = await response.json();

        // Extract the image data from the response
        if (!data.predictions || !data.predictions[0]) {
            throw new Error('Invalid response from Imagen API');
        }

        const prediction = data.predictions[0];

        // Imagen returns base64 encoded image data
        if (prediction.bytesBase64Encoded) {
            const imageUrl = `data:image/png;base64,${prediction.bytesBase64Encoded}`;

            return {
                imageUrl,
                mimeType: prediction.mimeType || 'image/png',
            };
        }

        throw new Error('No image data found in Imagen response');
    } catch (error) {
        console.error('Error editing image with Imagen:', error);
        throw error;
    }
}
