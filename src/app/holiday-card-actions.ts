'use server';

import { generateImageWithGemini } from '@/lib/gemini-image';
import { z } from 'zod';

const GenerateHolidayCardSchema = z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    style: z.string().optional(),
    recipient: z.string().optional(),
});

export type GenerateHolidayCardInput = z.infer<typeof GenerateHolidayCardSchema>;

export async function generateHolidayCardAction(input: GenerateHolidayCardInput) {
    try {
        const validatedInput = GenerateHolidayCardSchema.parse(input);

        let fullPrompt = `A festive holiday card`;

        if (validatedInput.recipient) {
            fullPrompt += ` for ${validatedInput.recipient}`;
        }

        fullPrompt += `. ${validatedInput.prompt}`;

        if (validatedInput.style) {
            fullPrompt += `. Style: ${validatedInput.style}`;
        }

        fullPrompt += `. High quality, professional holiday card design, festive atmosphere, clear text if any.`;

        const result = await generateImageWithGemini({
            prompt: fullPrompt,
            aspectRatio: '4:3', // Standard card ratio
            useAdvancedModel: true, // Use Gemini 3 Pro Image Preview for highest quality
        });

        return {
            success: true,
            imageUrl: result.imageUrl,
        };
    } catch (error) {
        console.error('Error generating holiday card:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate holiday card',
        };
    }
}
