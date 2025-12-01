'use server';

/**
 * @fileOverview Bedrock flow for generating social proof content from testimonials.
 * 
 * This flow takes client testimonials and formats them into engaging social media posts
 * optimized for different platforms (Instagram, Facebook, LinkedIn).
 * 
 * Features:
 * - Platform-specific formatting (Instagram, Facebook, LinkedIn)
 * - Client name and testimonial excerpt inclusion
 * - Relevant hashtag generation
 * - Image suggestions when client photos are available
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
    GenerateSocialProofInputSchema,
    GenerateSocialProofOutputSchema,
    type GenerateSocialProofInput,
    type GenerateSocialProofOutput,
} from '@/ai/schemas/social-proof-schemas';

const socialProofPrompt = definePrompt({
    name: 'generateSocialProofPrompt',
    inputSchema: z.object({
        testimonials: z.array(
            z.object({
                clientName: z.string(),
                testimonialText: z.string(),
                dateReceived: z.string(),
                clientPhotoUrl: z.string().optional(),
            })
        ),
        format: z.enum(['instagram', 'facebook', 'linkedin']),
        agentName: z.string(),
        hasPhotos: z.boolean(),
    }),
    outputSchema: GenerateSocialProofOutputSchema,
    options: MODEL_CONFIGS.CREATIVE,
    prompt: `You are an expert social media content creator specializing in real estate marketing. Your goal is to create engaging, authentic social proof content from client testimonials.

**Agent Name:** {{{agentName}}}

**Platform:** {{{format}}}

**Testimonials:**
{{{json testimonials}}}

**Has Client Photos:** {{{hasPhotos}}}

**Platform-Specific Guidelines:**

{{#if (eq format "instagram")}}
**Instagram Format:**
- Keep it visual and engaging
- Use emojis strategically (but not excessively)
- Include a strong hook in the first line
- Maximum 2,200 characters
- Use line breaks for readability
- Include a clear call-to-action
- Hashtags should be relevant and not excessive (5-10 hashtags)
{{/if}}

{{#if (eq format "facebook")}}
**Facebook Format:**
- More conversational and personal tone
- Can be slightly longer and more detailed
- Include context about the client's experience
- Use emojis moderately
- Strong call-to-action at the end
- Hashtags are less important (3-5 hashtags)
{{/if}}

{{#if (eq format "linkedin")}}
**LinkedIn Format:**
- Professional and polished tone
- Focus on business value and results
- Include specific outcomes when mentioned
- Minimal emoji use
- Professional call-to-action
- Industry-relevant hashtags (3-5 hashtags)
{{/if}}

**Instructions:**
1. **Content Creation:**
   - Start with an attention-grabbing opening
   - Include the client's name (first name or full name as appropriate)
   - Use a compelling excerpt from the testimonial (not the entire text)
   - Highlight specific results or emotions mentioned
   - Make it feel authentic and genuine, not overly promotional
   - End with a clear call-to-action appropriate for the platform

2. **Hashtag Generation:**
   - Create relevant hashtags for real estate and the local market
   - Include general real estate hashtags
   - Include platform-appropriate hashtags
   - Keep hashtags professional and searchable

3. **Image Suggestions:**
{{#if hasPhotos}}
   - Since client photos are available, suggest how to use them effectively
   - Suggest photo layouts or compositions
   - Recommend text overlays or graphics to add
   - Suggest carousel post ideas if multiple testimonials
{{else}}
   - Suggest alternative visuals (property photos, agent branding, quote graphics)
   - Recommend design styles that would work well
{{/if}}

**IMPORTANT:** Return ONLY a JSON response with this exact structure:
{
  "content": "The complete social media post text with appropriate formatting and emojis",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "imageSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

Generate the social proof content now.`,
});

const generateSocialProofFlow = defineFlow(
    {
        name: 'generateSocialProofFlow',
        inputSchema: GenerateSocialProofInputSchema,
        outputSchema: GenerateSocialProofOutputSchema,
    },
    async (input) => {
        console.log(`Generating social proof content for ${input.format} with ${input.testimonials.length} testimonial(s)`);

        // Check if any testimonials have photos
        const hasPhotos = input.testimonials.some(t => t.clientPhotoUrl);

        // Generate social proof content
        const output = await socialProofPrompt({
            testimonials: input.testimonials,
            format: input.format,
            agentName: input.agentName,
            hasPhotos,
        });

        console.log('Social proof flow output:', {
            contentLength: output.content.length,
            hashtagCount: output.hashtags.length,
            imageSuggestionCount: output.imageSuggestions.length,
        });

        if (!output?.content) {
            console.error('Missing content in output:', output);
            throw new Error("The AI returned empty social proof content. Please try again.");
        }

        return output;
    }
);

export async function generateSocialProof(
    input: GenerateSocialProofInput
): Promise<GenerateSocialProofOutput> {
    return generateSocialProofFlow.execute(input);
}
