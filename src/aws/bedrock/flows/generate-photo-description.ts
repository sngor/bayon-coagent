'use server';

/**
 * @fileOverview Bedrock flow for generating photo descriptions from mobile captures.
 * 
 * This flow analyzes property photos captured on mobile devices and generates
 * professional descriptions suitable for real estate marketing content.
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
    GeneratePhotoDescriptionInputSchema,
    GeneratePhotoDescriptionOutputSchema,
} from '@/ai/schemas/photo-description-schemas';

import type {
    GeneratePhotoDescriptionInput,
    GeneratePhotoDescriptionOutput,
} from '@/ai/schemas/photo-description-schemas';

const photoDescriptionPrompt = definePrompt({
    name: 'generatePhotoDescriptionPrompt',
    inputSchema: GeneratePhotoDescriptionInputSchema,
    outputSchema: GeneratePhotoDescriptionOutputSchema,
    options: MODEL_CONFIGS.BALANCED, // Use vision-capable model
    prompt: `You are an expert real estate photographer and marketing specialist. Your task is to analyze property photos and generate professional descriptions that would be suitable for real estate marketing materials.

**Photo Analysis Instructions:**
1. Carefully examine the provided image
2. Identify the room type, key features, and notable elements
3. Generate a professional description that highlights the space's best qualities
4. Focus on features that would appeal to potential buyers
5. Use descriptive but concise language appropriate for real estate listings

**Image Metadata:**
- Dimensions: {{{metadata.width}}} × {{{metadata.height}}} pixels
- File size: {{{metadata.size}}} bytes
- Captured: {{{metadata.timestamp}}}

**Context:** {{{context}}}

**Response Requirements:**
- **description**: Write a professional 2-3 sentence description highlighting the space's key selling points
- **keyFeatures**: List 3-5 specific features visible in the photo (e.g., "granite countertops", "hardwood floors", "natural lighting")
- **tags**: Provide 3-5 relevant tags for categorization (e.g., "kitchen", "modern", "spacious", "updated")
- **roomType**: Identify the room or area type if clear (e.g., "kitchen", "living room", "master bedroom", "exterior", "bathroom")
- **marketingAppeal**: Rate as "high", "medium", or "low" based on the photo's potential to attract buyers
- **improvementSuggestions**: If applicable, suggest 1-2 ways to improve the photo or space for better marketing appeal

**Important Guidelines:**
- Focus on positive aspects and selling points
- Use professional real estate terminology
- Be specific about materials, finishes, and features
- Consider lighting, staging, and composition
- If the image quality is poor or unclear, mention this in improvement suggestions

Generate the analysis now.`,
});

const generatePhotoDescriptionFlow = defineFlow(
    {
        name: 'generatePhotoDescriptionFlow',
        inputSchema: GeneratePhotoDescriptionInputSchema,
        outputSchema: GeneratePhotoDescriptionOutputSchema,
    },
    async (input) => {
        // Validate that we have image data
        if (!input.imageData) {
            throw new Error("No image data provided for analysis");
        }

        // Validate image format
        if (!['jpeg', 'png', 'webp'].includes(input.imageFormat)) {
            throw new Error(`Unsupported image format: ${input.imageFormat}`);
        }

        const output = await photoDescriptionPrompt(input);

        if (!output?.description) {
            throw new Error("The AI failed to generate a photo description. Please try again.");
        }

        // Ensure all required fields are present with defaults if needed
        const result: GeneratePhotoDescriptionOutput = {
            description: output.description,
            keyFeatures: output.keyFeatures || [],
            tags: output.tags || [],
            roomType: output.roomType || undefined,
            marketingAppeal: output.marketingAppeal || 'medium',
            improvementSuggestions: output.improvementSuggestions || undefined,
        };

        return result;
    }
);

export async function generatePhotoDescription(
    input: GeneratePhotoDescriptionInput
): Promise<GeneratePhotoDescriptionOutput> {
    return generatePhotoDescriptionFlow.execute(input);
}