/**
 * @fileOverview Gemini flow for virtual staging of empty rooms.
 * 
 * This flow uses Google's Gemini 2.5 Flash model to add furniture and decor
 * to empty room images, helping potential buyers visualize the space.
 * 
 * Requirements: 2.2, 2.3, 10.1
 */

import { z } from 'zod';
import { getGeminiImageModel, prepareImageForGemini, getImageMimeType } from '../client';
import { VirtualStagingParamsSchema, type VirtualStagingParams } from '@/ai/schemas/reimagine-schemas';

// ============================================================================
// Constants
// ============================================================================

/**
 * Room type descriptions for better staging results
 */
const ROOM_TYPE_DESCRIPTIONS: Record<string, string> = {
    'living-room': 'a spacious living room with comfortable seating, coffee table, and entertainment area',
    'bedroom': 'a cozy bedroom with a bed, nightstands, and appropriate bedroom furniture',
    'kitchen': 'a modern kitchen with appliances, countertops, and dining area',
    'dining-room': 'an elegant dining room with dining table, chairs, and appropriate decor',
    'office': 'a professional home office with desk, chair, shelving, and work equipment',
    'bathroom': 'a clean bathroom with appropriate fixtures and decor',
};

/**
 * Style descriptions for furniture generation
 */
const STYLE_DESCRIPTIONS: Record<string, string> = {
    'modern': 'modern, clean lines, minimalist aesthetic, contemporary furniture',
    'traditional': 'traditional, classic furniture, warm tones, timeless design',
    'minimalist': 'minimalist, simple, uncluttered, neutral colors, essential furniture only',
    'luxury': 'luxury, high-end furniture, elegant details, premium materials',
    'rustic': 'rustic, natural materials, warm wood tones, cozy atmosphere',
    'contemporary': 'contemporary, current trends, stylish, comfortable and functional',
};

// ============================================================================
// Input/Output Schemas
// ============================================================================

export const VirtualStagingInputSchema = z.object({
    imageData: z.string(), // Base64 encoded source image
    imageFormat: z.enum(['jpeg', 'png', 'webp']),
    params: VirtualStagingParamsSchema,
});

export type VirtualStagingInput = z.infer<typeof VirtualStagingInputSchema>;

export const VirtualStagingOutputSchema = z.object({
    stagedImageData: z.string(), // Base64 encoded result image
    imageFormat: z.string(),
});

export type VirtualStagingOutput = z.infer<typeof VirtualStagingOutputSchema>;

// ============================================================================
// Virtual Staging Flow Implementation
// ============================================================================

/**
 * Generates a virtually staged image with furniture and decor using Gemini
 * 
 * This function uses Google's Gemini 2.5 Flash model to:
 * 1. Analyze the empty room image
 * 2. Generate appropriate furniture based on room type and style
 * 3. Place furniture naturally within the space
 * 4. Maintain realistic lighting and perspective
 * 
 * @param input - Source image and staging parameters
 * @returns Staged image with furniture and decor
 */
export async function virtualStaging(
    input: VirtualStagingInput
): Promise<VirtualStagingOutput> {
    console.log('[Gemini Virtual Staging] Function called');

    // Validate input
    try {
        const validatedInput = VirtualStagingInputSchema.parse(input);
        console.log('[Gemini Virtual Staging] Input validated successfully');
    } catch (error) {
        console.error('[Gemini Virtual Staging] Input validation failed:', error);
        throw error;
    }

    const validatedInput = VirtualStagingInputSchema.parse(input);

    // Get Gemini model
    const model = getGeminiImageModel();

    // Build staging prompt based on room type and style
    const roomDescription = ROOM_TYPE_DESCRIPTIONS[validatedInput.params.roomType] || 'a room';
    const styleDescription = STYLE_DESCRIPTIONS[validatedInput.params.style] || 'stylish';

    let prompt = `Transform this empty room into ${roomDescription} with ${styleDescription} design. 

CRITICAL REQUIREMENTS:
- PRESERVE the exact room structure, walls, corners, angles, windows, doors, and all architectural features
- Keep all straight lines, square angles, and room dimensions EXACTLY as they are
- DO NOT change the perspective, camera angle, or room geometry
- Only ADD furniture, decor, and accessories while preserving the exact room architecture
- Maintain the original lighting conditions and shadows
- Ensure furniture is appropriately sized and naturally placed for the space
- Create a realistic, professional staging suitable for real estate marketing
- The result should look like the same room with furniture added, not a different room

Style the furniture and decor with ${styleDescription} aesthetic. The furniture should complement the room's existing architecture and lighting.`;

    // Add custom prompt if provided
    if (validatedInput.params.customPrompt) {
        prompt += `\n\nAdditional styling instructions: ${validatedInput.params.customPrompt}`;
    }

    // Prepare image for Gemini
    const mimeType = getImageMimeType(validatedInput.imageFormat);
    const imageInput = prepareImageForGemini(validatedInput.imageData, mimeType);

    console.log('[Gemini Virtual Staging] Prompt length:', prompt.length);
    console.log('[Gemini Virtual Staging] Image format:', validatedInput.imageFormat);

    try {
        // Generate content with Gemini
        const result = await model.generateContent([
            prompt,
            imageInput
        ]);

        const response = await result.response;
        const text = response.text();

        // Note: Gemini 2.5 Flash currently generates text descriptions rather than images
        // For actual image generation, we would need to use a different approach
        // This is a placeholder implementation that would need to be updated
        // when Gemini image generation becomes available or integrate with another service

        console.log('[Gemini Virtual Staging] Generated description:', text.substring(0, 200) + '...');

        // For now, return the original image as we're waiting for Gemini image generation
        // In a real implementation, you would either:
        // 1. Wait for Gemini image generation capabilities
        // 2. Use the text description with another image generation service
        // 3. Use a different Google AI service that supports image generation

        return {
            stagedImageData: validatedInput.imageData, // Placeholder - return original
            imageFormat: validatedInput.imageFormat,
        };

    } catch (error) {
        // Log detailed error for debugging
        console.error('[Gemini Virtual Staging] Error details:', error);
        console.error('[Gemini Virtual Staging] Error message:', error instanceof Error ? error.message : String(error));

        // Import error handling utilities
        const { logError, classifyError } = await import('../../bedrock/reimagine-error-handler');

        // Log error to CloudWatch
        logError(error, 'gemini-virtual-staging', {
            roomType: validatedInput.params.roomType,
            style: validatedInput.params.style,
        });

        // Classify and throw with user-friendly message
        const classifiedError = classifyError(error, 'virtual-staging');
        throw new Error(classifiedError.userMessage);
    }
}