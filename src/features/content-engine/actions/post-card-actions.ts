'use server';

import { generateImageWithGemini } from '@/lib/gemini-image';
import { z } from 'zod';

const GeneratePostCardSchema = z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    style: z.string().optional(),
    recipient: z.string().optional(),
    cardType: z.string().default('Holiday Card'),
    generationMode: z.enum(['print', 'social']).default('print'),
    referenceImage: z.string().optional(), // Base64
});

export type GeneratePostCardInput = z.infer<typeof GeneratePostCardSchema>;

export async function generatePostCardAction(input: GeneratePostCardInput) {
    try {
        const validatedInput = GeneratePostCardSchema.parse(input);

        let fullPrompt = `A professional real estate ${validatedInput.cardType}`;

        if (validatedInput.recipient) {
            fullPrompt += ` for ${validatedInput.recipient}`;
        }

        fullPrompt += `. ${validatedInput.prompt}`;

        if (validatedInput.style) {
            fullPrompt += `. Style: ${validatedInput.style}`;
        }

        // Add mode-specific instructions
        if (validatedInput.generationMode === 'print') {
            fullPrompt += `. Full frame, flat 2D design, no background, edge-to-edge design, high resolution print ready, vector style graphics or clean photography filling the entire canvas.`;
        } else {
            fullPrompt += `. Staged product photography, photorealistic, the card is sitting on a beautiful surface or held by a hand, aesthetic background, depth of field, soft lighting, 3D mockup style.`;
        }

        if (validatedInput.referenceImage) {
            fullPrompt += `. Use the provided image as a strong visual reference for composition and style.`;
        }

        fullPrompt += `. High quality, professional design, clear text if any.`;

        const result = await generateImageWithGemini({
            prompt: fullPrompt,
            aspectRatio: '4:3', // Standard card ratio
            useAdvancedModel: true, // Use Gemini 3 Pro Image Preview for highest quality
            referenceImage: validatedInput.referenceImage,
        });

        return {
            success: true,
            imageUrl: result.imageUrl,
        };
    } catch (error) {
        console.error('Error generating post card:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate post card',
        };
    }
}
