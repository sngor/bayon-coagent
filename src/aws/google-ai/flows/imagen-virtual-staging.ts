/**
 * @fileOverview Virtual Staging using Google Imagen 4.0 Ultra
 * 
 * This module uses Imagen 4.0 Ultra's image editing capabilities
 * for virtual staging in the Reimagine toolkit.
 * 
 * Flow:
 * 1. Analyze the input image with Gemini 2.5 Flash for context
 * 2. Generate detailed staging instructions based on room type and style
 * 3. Use Imagen 4.0 Ultra to edit the image with furniture and decor
 * 
 * Requirements: 2.2, 2.3, 10.1
 */

import { z } from 'zod';
import { getGeminiImageModel, prepareImageForGemini, getImageMimeType } from '../client';
import { editImageWithImagen } from '@/lib/gemini-image';
import {
    VirtualStagingParamsSchema,
    type VirtualStagingParams,
} from '@/ai/schemas/reimagine-schemas';

// ============================================================================
// Room and Style Descriptions
// ============================================================================

const ROOM_TYPE_DESCRIPTIONS: Record<string, string> = {
    'living-room': 'a spacious living room with comfortable seating, coffee table, and entertainment area',
    'bedroom': 'a cozy bedroom with a bed, nightstands, and appropriate bedroom furniture',
    'kitchen': 'a modern kitchen with appliances, countertops, and dining area',
    'dining-room': 'an elegant dining room with dining table, chairs, and appropriate decor',
    'office': 'a professional home office with desk, chair, shelving, and work equipment',
    'bathroom': 'a clean bathroom with appropriate fixtures and decor',
};

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

export const ImagenVirtualStagingInputSchema = z.object({
    imageData: z.string(), // Base64 encoded source image
    imageFormat: z.enum(['jpeg', 'png', 'webp']),
    params: VirtualStagingParamsSchema,
});

export type ImagenVirtualStagingInput = z.infer<typeof ImagenVirtualStagingInputSchema>;

export const ImagenVirtualStagingOutputSchema = z.object({
    stagedImageData: z.string(), // Base64 encoded result image
    imageFormat: z.string(),
    analysis: z.string().optional(), // Optional Gemini analysis
});

export type ImagenVirtualStagingOutput = z.infer<typeof ImagenVirtualStagingOutputSchema>;

// ============================================================================
// Virtual Staging with Imagen 4.0 Ultra
// ============================================================================

/**
 * Virtual staging using Imagen 4.0 Ultra for high-quality results
 */
export async function virtualStagingWithImagen(
    input: ImagenVirtualStagingInput
): Promise<ImagenVirtualStagingOutput> {
    console.log('[Imagen Virtual Staging] Function called');

    // Validate input
    const validatedInput = ImagenVirtualStagingInputSchema.parse(input);
    const params = validatedInput.params;

    // Get Gemini model for analysis
    const model = getGeminiImageModel();

    // Prepare image for Gemini analysis
    const mimeType = getImageMimeType(validatedInput.imageFormat);
    const imageInput = prepareImageForGemini(validatedInput.imageData, mimeType);

    const roomDescription = ROOM_TYPE_DESCRIPTIONS[params.roomType] || 'a room';
    const styleDescription = STYLE_DESCRIPTIONS[params.style] || 'stylish';

    try {
        // Step 1: Gemini analyzes the image for context
        console.log('[Imagen Virtual Staging] Starting image analysis with Gemini...');

        const analysisPrompt = `Analyze this empty room for virtual staging as ${roomDescription} with ${styleDescription} design. 
Provide detailed recommendations for furniture placement, color schemes, and styling that would work well in this space.`;

        const analysisResult = await model.generateContent([
            analysisPrompt,
            imageInput
        ]);

        const analysisResponse = analysisResult.response;
        const analysis = analysisResponse.text();

        console.log('[Imagen Virtual Staging] Analysis completed');

        // Step 2: Create detailed staging prompt for Imagen
        console.log('[Imagen Virtual Staging] Generating staging prompt...');

        // Check if this is a multi-angle staging (has detailed custom prompt)
        const isMultiAngle = params.customPrompt && params.customPrompt.includes('EXACT SAME furniture');

        let stagingPrompt: string;

        if (isMultiAngle) {
            // Multi-angle staging: prioritize furniture consistency
            stagingPrompt = `${params.customPrompt}

Add furniture and decor to this empty room while:
- PRESERVING all architectural elements exactly (walls, windows, doors, flooring, moldings)
- MAINTAINING the exact camera angle and perspective
- USING the EXACT SAME furniture pieces, colors, and arrangement from the reference staging
- ENSURING furniture is properly scaled and positioned for this specific angle
- MATCHING the lighting and atmosphere from the reference staging
- CREATING photorealistic staging suitable for luxury real estate marketing

The result should look like the same professionally staged room photographed from a different angle.`;
        } else {
            // First angle or regular staging
            stagingPrompt = `Add furniture and decor to transform this empty room into ${roomDescription} with ${styleDescription} design.

Requirements:
- ADD appropriate furniture for ${roomDescription}: ${roomDescription}
- USE ${styleDescription} aesthetic with coordinated colors and materials
- PRESERVE all architectural elements exactly (walls, windows, doors, flooring, moldings)
- MAINTAIN the exact camera angle and perspective
- ENSURE furniture is properly scaled and positioned for the space
- CREATE photorealistic staging suitable for luxury real estate marketing
- MATCH natural lighting and shadows in the room

${params.customPrompt ? `Additional styling notes: ${params.customPrompt}` : ''}

Generate a professionally staged version of this room with high-quality furniture and decor.`;
        }

        // Step 3: Use Imagen 4.0 Ultra to edit the image
        console.log('[Imagen Virtual Staging] Generating staged image with Imagen 4.0 Ultra...');

        const result = await editImageWithImagen({
            prompt: stagingPrompt,
            referenceImage: validatedInput.imageData,
            mimeType,
        });

        console.log('[Imagen Virtual Staging] Image generation completed');

        // Extract base64 data from data URL
        const base64Data = result.imageUrl.split(',')[1] || result.imageUrl;

        return {
            stagedImageData: base64Data,
            imageFormat: 'png', // Imagen returns PNG
            analysis: analysis.substring(0, 500), // Truncate for storage
        };

    } catch (error) {
        console.error('[Imagen Virtual Staging] Error:', error);

        // Import error handling utilities
        const { logError, classifyError } = await import('../../bedrock/reimagine-error-handler');

        // Log error to CloudWatch
        logError(error, 'imagen-virtual-staging', {
            roomType: params.roomType,
            style: params.style,
        });

        // Classify and throw with user-friendly message
        const classifiedError = classifyError(error, 'image-generation');
        throw new Error(classifiedError.userMessage);
    }
}
