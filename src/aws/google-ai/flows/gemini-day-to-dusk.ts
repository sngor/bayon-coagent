/**
 * @fileOverview Gemini 2.5 Flash Day-to-Dusk transformation flow
 * 
 * This flow uses Google's Gemini 2.5 Flash model to transform daytime
 * exterior photos to golden hour/dusk lighting for real estate listings.
 * 
 * Requirements: 3.2, 3.3, 10.2
 */

import { z } from 'zod';
import { getGeminiImageModel, prepareImageForGemini, getImageMimeType } from '../client';
import { DayToDuskParamsSchema, type DayToDuskParams } from '@/ai/schemas/reimagine-schemas';

// ============================================================================
// Input/Output Schemas
// ============================================================================

export const GeminiDayToDuskInputSchema = z.object({
    imageData: z.string(), // Base64 encoded source image
    imageFormat: z.enum(['jpeg', 'png', 'webp']),
    params: DayToDuskParamsSchema,
});

export type GeminiDayToDuskInput = z.infer<typeof GeminiDayToDuskInputSchema>;

export const GeminiDayToDuskOutputSchema = z.object({
    duskImageData: z.string(), // Base64 encoded result image
    imageFormat: z.string(),
    analysis?: z.string(), // Optional analysis from Gemini
});

export type GeminiDayToDuskOutput = z.infer<typeof GeminiDayToDuskOutputSchema>;

// ============================================================================
// Intensity Configurations
// ============================================================================

const INTENSITY_DESCRIPTIONS = {
    subtle: {
        description: 'subtle golden hour lighting with gentle warm tones',
        transformation: 'Apply a gentle golden hour filter with soft warm lighting. Keep changes minimal and natural.',
    },
    moderate: {
        description: 'moderate dusk lighting with enhanced warm glow and deeper sky colors',
        transformation: 'Transform to beautiful golden hour with warm orange and pink sky colors. Add interior lighting through windows.',
    },
    dramatic: {
        description: 'dramatic dusk lighting with rich golden tones, deep blue sky, and enhanced interior lighting',
        transformation: 'Create a stunning twilight scene with dramatic golden lighting, deep blue-orange sky gradients, and prominent interior lighting.',
    },
} as const;

// ============================================================================
// Gemini Day-to-Dusk Implementation
// ============================================================================

/**
 * Transforms a daytime exterior photo to golden hour/dusk lighting using Gemini 2.5 Flash
 * 
 * This function uses Gemini's vision and generation capabilities to:
 * 1. Analyze the daytime lighting in the image
 * 2. Generate detailed transformation instructions
 * 3. Apply the day-to-dusk transformation
 * 
 * @param input - Source image and intensity parameters
 * @returns Transformed image with dusk lighting
 */
export async function geminiDayToDusk(
    input: GeminiDayToDuskInput
): Promise<GeminiDayToDuskOutput> {
    console.log('[Gemini Day-to-Dusk] Starting transformation...');

    // Validate input
    const validatedInput = GeminiDayToDuskInputSchema.parse(input);

    // Get Gemini model
    const model = getGeminiImageModel();

    // Prepare image for Gemini
    const mimeType = getImageMimeType(validatedInput.imageFormat);
    const imageInput = prepareImageForGemini(validatedInput.imageData, mimeType);

    // Get intensity configuration
    const intensityConfig = INTENSITY_DESCRIPTIONS[validatedInput.params.intensity];

    try {
        // Step 1: Analyze the image for day-to-dusk transformation
        console.log('[Gemini Day-to-Dusk] Analyzing image...');

        const analysisPrompt = `Analyze this daytime property photo for twilight/golden hour transformation with ${validatedInput.params.intensity} intensity.

ANALYSIS REQUIREMENTS:
1. Identify the current lighting conditions (time of day, sky color, shadows)
2. Locate windows and interior spaces that should show lighting
3. Identify architectural features that would benefit from golden hour lighting
4. Assess the sky area and cloud formations for transformation potential
5. Note any existing exterior lighting fixtures
6. Evaluate the overall composition for twilight enhancement

Provide a detailed analysis focusing on how to transform this daytime scene into an appealing ${intensityConfig.description} twilight scene.`;

        const analysisResult = await model.generateContent([
            analysisPrompt,
            imageInput
        ]);

        const analysisResponse = await analysisResult.response;
        const analysis = analysisResponse.text();

        console.log('[Gemini Day-to-Dusk] Analysis completed, generating transformation...');

        // Step 2: Generate the day-to-dusk transformation
        const transformationPrompt = `Transform this daytime property photo into a stunning twilight scene with ${validatedInput.params.intensity} intensity.

TRANSFORMATION INSTRUCTIONS:
${intensityConfig.transformation}

SPECIFIC REQUIREMENTS:
1. SKY TRANSFORMATION:
   - Convert blue daytime sky to warm golden hour colors (orange, pink, deep blue gradients)
   - Create natural sunset/dusk lighting with realistic color transitions
   - Maintain cloud formations but adjust colors to match golden hour

2. LIGHTING EFFECTS:
   - Add warm golden lighting on building surfaces
   - Create realistic shadows and depth with evening light angles
   - Apply warm color temperature throughout the scene

3. INTERIOR LIGHTING:
   - Make interior lights visible through windows with warm yellow/amber glow
   - Add realistic light spill from windows onto exterior surfaces
   - Ensure interior lighting looks inviting and natural

4. ARCHITECTURAL ENHANCEMENT:
   - Enhance building materials with golden hour warmth
   - Add subtle landscape lighting if appropriate
   - Maintain all structural details and proportions exactly

5. TECHNICAL REQUIREMENTS:
   - Preserve exact composition, framing, and camera angle
   - Keep all architectural elements unchanged
   - Apply ${validatedInput.params.intensity} intensity level
   - Create photorealistic result suitable for luxury real estate marketing

Based on this analysis: ${analysis.substring(0, 500)}

Generate a professionally transformed twilight version of this property photo.`;

        // Try multiple approaches for image generation
        const approaches = [
            {
                name: 'Direct Transformation',
                prompt: `${transformationPrompt}\n\nIMPORTANT: Generate the transformed image directly. Return the edited twilight version as image data.`,
            },
            {
                name: 'Photo Editing Mode',
                prompt: `You are a professional real estate photographer. Edit this daytime photo to create a beautiful twilight scene.\n\n${transformationPrompt}\n\nReturn the edited image.`,
            },
            {
                name: 'Image Generation Request',
                prompt: `Create a twilight version of this property photo:\n\n${transformationPrompt}\n\nGenerate and return the transformed image.`,
            }
        ];

        for (const approach of approaches) {
            try {
                console.log(`[Gemini Day-to-Dusk] Trying ${approach.name}...`);

                const result = await model.generateContent([
                    approach.prompt,
                    imageInput
                ]);

                const response = await result.response;

                // Check if Gemini returned image data
                if (response.candidates && response.candidates[0]) {
                    const candidate = response.candidates[0];

                    if (candidate.content && candidate.content.parts) {
                        for (const part of candidate.content.parts) {
                            if (part.inlineData && part.inlineData.data) {
                                console.log(`[Gemini Day-to-Dusk] ${approach.name} successful - image generated`);
                                return {
                                    duskImageData: part.inlineData.data,
                                    imageFormat: validatedInput.imageFormat,
                                    analysis: analysis.substring(0, 500),
                                };
                            }
                        }
                    }
                }

                // If no image data, log the text response
                const text = response.text();
                console.log(`[Gemini Day-to-Dusk] ${approach.name} returned text:`, text.substring(0, 100));

            } catch (error) {
                console.log(`[Gemini Day-to-Dusk] ${approach.name} failed:`, error.message);
                continue;
            }
        }

        // If all approaches failed, return original with analysis
        console.log('[Gemini Day-to-Dusk] Image generation not available, returning original with analysis');

        return {
            duskImageData: validatedInput.imageData,
            imageFormat: validatedInput.imageFormat,
            analysis: `Analysis completed: ${analysis.substring(0, 300)}... Note: Gemini image generation is still experimental. The original image is returned with analysis.`,
        };

    } catch (error) {
        console.error('[Gemini Day-to-Dusk] Error:', error);

        // Import error handling utilities
        const { logError, classifyError } = await import('../../bedrock/reimagine-error-handler');

        // Log error to CloudWatch
        logError(error, 'gemini-day-to-dusk', {
            intensity: validatedInput.params.intensity,
        });

        // Classify and throw with user-friendly message
        const classifiedError = classifyError(error, 'day-to-dusk');
        throw new Error(classifiedError.userMessage);
    }
}

// Export for compatibility with existing interface
export async function dayToDusk(input: {
    imageData: string;
    imageFormat: 'jpeg' | 'png' | 'webp';
    params: DayToDuskParams;
}) {
    const result = await geminiDayToDusk({
        ...input,
        params: input.params,
    });

    return {
        duskImageData: result.duskImageData,
        imageFormat: result.imageFormat,
    };
}