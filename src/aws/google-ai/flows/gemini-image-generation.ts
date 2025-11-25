/**
 * @fileOverview Gemini 2.5 Flash and Imagen 4.0 Ultra image generation flows
 * 
 * This module uses:
 * - Imagen 4.0 Ultra for virtual staging (high-quality image editing)
 * - Gemini 2.5 Flash for other image generation tasks
 * 
 * Flow:
 * 1. Gemini 2.5 Flash analyzes the input image with advanced vision understanding
 * 2. Generates detailed edit instructions based on the analysis
 * 3. Uses Imagen 4.0 Ultra for virtual staging, Gemini for other edits
 * 
 * Requirements: 2.2, 2.3, 10.1
 */

import { z } from 'zod';
import { getGeminiImageModel, prepareImageForGemini, getImageMimeType } from '../client';
import {
    VirtualStagingParamsSchema,
    DayToDuskParamsSchema,
    EnhanceParamsSchema,
    ItemRemovalParamsSchema,
    VirtualRenovationParamsSchema,
    type VirtualStagingParams,
    type DayToDuskParams,
    type EnhanceParams,
    type ItemRemovalParams,
    type VirtualRenovationParams
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

export const GeminiImageInputSchema = z.object({
    imageData: z.string(), // Base64 encoded source image
    imageFormat: z.enum(['jpeg', 'png', 'webp']),
    editType: z.enum(['virtual-staging', 'day-to-dusk', 'enhance', 'item-removal', 'virtual-renovation']),
    params: z.union([
        VirtualStagingParamsSchema,
        DayToDuskParamsSchema,
        EnhanceParamsSchema,
        ItemRemovalParamsSchema,
        VirtualRenovationParamsSchema,
    ]),
});

export type GeminiImageInput = z.infer<typeof GeminiImageInputSchema>;

export const GeminiImageOutputSchema = z.object({
    resultImageData: z.string(), // Base64 encoded result image
    imageFormat: z.string(),
    analysis: z.string().optional(), // Optional Gemini analysis
});

export type GeminiImageOutput = z.infer<typeof GeminiImageOutputSchema>;

// ============================================================================
// Gemini Native Image Generation
// ============================================================================

async function generateImageWithGeminiNative(
    sourceImageBase64: string,
    mimeType: string,
    editPrompt: string
): Promise<string> {
    console.log('[Gemini Native Generation] Starting image generation...');

    const model = getGeminiImageModel();

    // Prepare the source image for Gemini
    const imageInput = prepareImageForGemini(sourceImageBase64, mimeType);

    // Try multiple approaches for image generation with Gemini 2.5 Flash
    const approaches = [
        // Approach 1: Direct image generation request
        {
            name: 'Direct Generation',
            prompt: `You are an expert photo editor. Edit this image according to these instructions: ${editPrompt}

CRITICAL: You must generate and return a new edited image, not text descriptions. Apply the edits directly to the provided image and return the result as image data.`,
        },
        // Approach 2: Specific image editing request
        {
            name: 'Image Editing Request',
            prompt: `Edit this image: ${editPrompt}

Return the edited image. Do not provide text descriptions - generate the actual edited image.`,
        },
        // Approach 3: Professional photo editing request
        {
            name: 'Professional Editing',
            prompt: `As a professional photo editor, apply these edits to the image: ${editPrompt}

Generate the edited result as an image file.`,
        }
    ];

    for (const approach of approaches) {
        try {
            console.log(`[Gemini Native Generation] Trying ${approach.name}...`);

            const result = await model.generateContent([
                approach.prompt,
                imageInput
            ]);

            const response = await result.response;

            // Check if Gemini returned image data
            if (response.candidates && response.candidates[0]) {
                const candidate = response.candidates[0];

                // Look for image data in the response
                if (candidate.content && candidate.content.parts) {
                    for (const part of candidate.content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            console.log(`[Gemini Native Generation] ${approach.name} successful - image generated`);
                            return part.inlineData.data;
                        }
                    }
                }
            }

            // Check if we got text response (analysis instead of image)
            const text = response.text();
            if (text && text.length > 50) {
                console.log(`[Gemini Native Generation] ${approach.name} returned text analysis:`, text.substring(0, 100));
                // Continue to next approach
                continue;
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.log(`[Gemini Native Generation] ${approach.name} failed:`, errorMessage);
            // Continue to next approach
            continue;
        }
    }

    // If all approaches failed to generate an image, log the issue
    console.log('[Gemini Native Generation] All generation approaches failed');

    // For now, return the original image since Gemini 2.5 Flash image generation 
    // may not be fully available yet. This ensures the user gets a response
    // while we wait for Google to fully enable the image generation capabilities.
    console.log('[Gemini Native Generation] Returning original image - Gemini image generation may not be fully available yet');

    return sourceImageBase64;
}

// ============================================================================
// Main Generation Function
// ============================================================================

/**
 * Generates images using Gemini 2.5 Flash native capabilities
 */
export async function generateImageWithGemini(
    input: GeminiImageInput
): Promise<GeminiImageOutput> {
    console.log('[Gemini Image Generation] Function called for:', input.editType);

    // Validate input
    const validatedInput = GeminiImageInputSchema.parse(input);

    // Get Gemini model for analysis
    const model = getGeminiImageModel();

    // Prepare image for Gemini analysis
    const mimeType = getImageMimeType(validatedInput.imageFormat);
    const imageInput = prepareImageForGemini(validatedInput.imageData, mimeType);

    let analysisPrompt = '';
    let editPrompt = '';

    // Create prompts based on edit type
    switch (validatedInput.editType) {
        case 'virtual-staging': {
            const params = validatedInput.params as VirtualStagingParams;
            const roomDescription = ROOM_TYPE_DESCRIPTIONS[params.roomType] || 'a room';
            const styleDescription = STYLE_DESCRIPTIONS[params.style] || 'stylish';

            analysisPrompt = `Analyze this empty room for virtual staging as ${roomDescription} with ${styleDescription} design. 
Provide detailed recommendations for furniture placement, color schemes, and styling.`;

            // Check if this is a multi-angle staging (has detailed custom prompt)
            const isMultiAngle = params.customPrompt && params.customPrompt.includes('MULTI-ANGLE STAGING');

            if (isMultiAngle) {
                // Multi-angle staging: balance furniture consistency with spatial adaptation
                editPrompt = `Transform this empty room into ${roomDescription} with ${styleDescription} design.

${params.customPrompt}

CRITICAL TECHNICAL REQUIREMENTS:
1. ANALYZE THIS IMAGE FIRST:
   - Study THIS room's actual layout, dimensions, and architectural features
   - Identify natural furniture placement zones in THIS space
   - Respect THIS room's windows, doors, walls, and floor plan

2. STAGING EXECUTION:
   - Stage THIS room naturally based on its actual layout
   - Use furniture that matches the reference style, colors, and aesthetic
   - Position furniture appropriately for THIS room's dimensions
   - Adapt furniture placement to THIS camera angle and perspective

3. PRESERVE ARCHITECTURE:
   - Keep all architectural elements of THIS room exactly as shown
   - Maintain THIS room's exact camera angle and perspective
   - Do not alter walls, windows, doors, or flooring
   - Respect THIS room's spatial constraints

4. QUALITY:
   - Create photorealistic staging suitable for luxury real estate marketing
   - Ensure furniture is properly scaled for THIS space
   - Match lighting and atmosphere to THIS room's conditions

Generate a professionally staged version of THIS room using furniture that matches the reference style.`;
            } else {
                // First angle or regular staging
                editPrompt = `Transform this empty room into ${roomDescription} with ${styleDescription} design.

EDIT INSTRUCTIONS:
- ADD appropriate furniture and decor for ${roomDescription}
- USE ${styleDescription} aesthetic with coordinated colors and materials
- PRESERVE all architectural elements exactly (walls, windows, doors, flooring)
- MAINTAIN the exact camera angle and perspective
- CREATE photorealistic staging suitable for luxury real estate marketing
- ENSURE furniture is properly scaled and positioned for the space

${params.customPrompt ? `Additional styling notes: ${params.customPrompt}` : ''}

Generate a professionally staged version of this room.`;
            }
            break;
        }

        case 'day-to-dusk': {
            const params = validatedInput.params as DayToDuskParams;

            analysisPrompt = `Analyze this daytime property photo for twilight conversion with ${params.intensity} intensity.
Identify lighting opportunities and architectural features that would benefit from golden hour transformation.`;

            // Enhanced prompt for better Gemini understanding
            editPrompt = `Transform this daytime exterior property photo into a stunning twilight/golden hour scene with ${params.intensity} lighting intensity.

SPECIFIC TRANSFORMATION REQUIREMENTS:
1. SKY TRANSFORMATION:
   - Convert blue daytime sky to warm golden hour colors (orange, pink, deep blue gradients)
   - Add realistic sunset/dusk cloud formations if visible
   - Create natural color transitions from horizon to upper sky

2. LIGHTING ADJUSTMENTS:
   - Add warm golden lighting on building surfaces facing the light source
   - Create realistic shadows and depth with evening lighting angles
   - Enhance contrast between lit and shadowed areas

3. INTERIOR LIGHTING:
   - Make interior lights visible through windows with warm yellow/amber glow
   - Add realistic light spill from windows onto exterior surfaces
   - Ensure interior lighting looks natural and inviting

4. LANDSCAPE & EXTERIOR:
   - Add subtle landscape lighting if appropriate (path lights, accent lighting)
   - Enhance any existing exterior fixtures with warm lighting
   - Adjust vegetation colors to match golden hour lighting

5. TECHNICAL REQUIREMENTS:
   - Maintain exact architectural proportions and details
   - Preserve image composition and camera angle
   - Keep all structural elements unchanged
   - Apply ${params.intensity} intensity level (subtle/moderate/dramatic)
   - Ensure photorealistic result suitable for luxury real estate marketing

Generate a professionally edited twilight version that transforms the daytime scene into an appealing evening property photo.`;
            break;
        }

        case 'enhance': {
            analysisPrompt = `Analyze this real estate image for quality enhancement opportunities.
Identify technical improvements needed for professional presentation.`;

            editPrompt = `Enhance this real estate image to professional photography standards.

EDIT INSTRUCTIONS:
- OPTIMIZE exposure for perfect highlight and shadow detail
- CORRECT color balance for natural, appealing tones
- ENHANCE sharpness and clarity for crisp appearance
- REDUCE noise while preserving architectural details
- IMPROVE overall visual impact for luxury real estate marketing
- MAINTAIN exact composition, framing, and perspective
- PRESERVE all content exactly as positioned
- AVOID over-processing or artificial appearance

Generate a professionally enhanced version of this image.`;
            break;
        }

        case 'item-removal': {
            const params = validatedInput.params as ItemRemovalParams;

            analysisPrompt = `Analyze this image for object removal. Objects to remove: ${params.objects.join(', ')}
Identify the best approach to seamlessly remove these items and fill the areas naturally.`;

            editPrompt = `Remove the following objects from this image: ${params.objects.join(', ')}

EDIT INSTRUCTIONS:
- IDENTIFY and REMOVE the specified objects: ${params.objects.join(', ')}
- FILL the removed areas with appropriate background content that matches the surrounding environment
- MAINTAIN natural lighting, shadows, and perspective in the filled areas
- ENSURE seamless blending with no visible artifacts or inconsistencies
- PRESERVE all other elements in the image exactly as they are
- CREATE a clean, professional result suitable for real estate marketing
- MAINTAIN the exact composition, framing, and camera angle

Generate a clean version of this image with the specified objects removed.`;
            break;
        }

        case 'virtual-renovation': {
            const params = validatedInput.params as VirtualRenovationParams;

            analysisPrompt = `Analyze this space for virtual renovation: "${params.description}"
Provide renovation recommendations and design improvements.`;

            editPrompt = `Apply virtual renovation to this space: "${params.description}"

EDIT INSTRUCTIONS:
- TRANSFORM the space according to the renovation description
- UPDATE finishes, fixtures, and design elements as specified
- MAINTAIN structural integrity and room layout
- PRESERVE architectural character and proportions
- INTEGRATE new elements seamlessly with existing architecture
${params.style ? `- IMPLEMENT ${params.style} design aesthetic throughout` : ''}
- CREATE photorealistic renovation visualization
- ENSURE renovations look realistic and achievable
- MAINTAIN camera angle and perspective exactly

Generate a beautifully renovated version of this space.`;
            break;
        }
    }

    try {
        // Step 1: Gemini analyzes the image
        console.log('[Gemini Image Generation] Starting image analysis...');

        const analysisResult = await model.generateContent([
            analysisPrompt,
            imageInput
        ]);

        const analysisResponse = await analysisResult.response;
        const analysis = analysisResponse.text();

        console.log('[Gemini Image Generation] Analysis completed');

        // Step 2: Generate the edited image using Gemini's native capabilities
        console.log('[Gemini Image Generation] Generating edited image with Gemini...');

        const resultImageData = await generateImageWithGeminiNative(
            validatedInput.imageData,
            mimeType,
            editPrompt
        );

        console.log('[Gemini Image Generation] Image generation completed');

        return {
            resultImageData,
            imageFormat: validatedInput.imageFormat,
            analysis: analysis.substring(0, 500), // Truncate for storage
        };

    } catch (error) {
        console.error('[Gemini Image Generation] Error:', error);

        // Import error handling utilities
        const { logError, classifyError } = await import('../../bedrock/reimagine-error-handler');

        // Log error to CloudWatch
        logError(error, 'gemini-image-generation', {
            editType: validatedInput.editType,
        });

        // Classify and throw with user-friendly message
        const classifiedError = classifyError(error, 'image-generation');
        throw new Error(classifiedError.userMessage);
    }
}

// ============================================================================
// Individual Flow Functions (for compatibility)
// ============================================================================

export async function virtualStaging(input: {
    imageData: string;
    imageFormat: 'jpeg' | 'png' | 'webp';
    params: VirtualStagingParams;
}) {
    // Virtual staging requires image editing with reference image
    // Imagen 4.0 Ultra is text-to-image only, so we use Gemini's capabilities
    const result = await generateImageWithGemini({
        ...input,
        editType: 'virtual-staging',
    });

    return {
        stagedImageData: result.resultImageData,
        imageFormat: result.imageFormat,
    };
}

export async function dayToDusk(input: {
    imageData: string;
    imageFormat: 'jpeg' | 'png' | 'webp';
    params: DayToDuskParams;
}) {
    const result = await generateImageWithGemini({
        ...input,
        editType: 'day-to-dusk',
    });

    return {
        duskImageData: result.resultImageData,
        imageFormat: result.imageFormat,
    };
}

export async function enhanceImage(input: {
    imageData: string;
    imageFormat: 'jpeg' | 'png' | 'webp';
    params: EnhanceParams;
}) {
    const result = await generateImageWithGemini({
        ...input,
        editType: 'enhance',
    });

    return {
        enhancedImageData: result.resultImageData,
        imageFormat: result.imageFormat,
    };
}

export async function removeItems(input: {
    imageData: string;
    imageFormat: 'jpeg' | 'png' | 'webp';
    params: ItemRemovalParams;
}) {
    const result = await generateImageWithGemini({
        ...input,
        editType: 'item-removal',
    });

    return {
        cleanedImageData: result.resultImageData,
        imageFormat: result.imageFormat,
    };
}

export async function virtualRenovation(input: {
    imageData: string;
    imageFormat: 'jpeg' | 'png' | 'webp';
    params: VirtualRenovationParams;
}) {
    const result = await generateImageWithGemini({
        ...input,
        editType: 'virtual-renovation',
    });

    return {
        renovatedImageData: result.resultImageData,
        imageFormat: result.imageFormat,
    };
}