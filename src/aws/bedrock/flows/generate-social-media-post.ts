'use server';

/**
 * @fileOverview Bedrock flow for generating social media posts.
 */

import { defineFlow, definePrompt, MODEL_CONFIGS, BEDROCK_MODELS } from '../flow-base';
import {
  GenerateSocialMediaPostInputSchema,
  GenerateSocialMediaPostOutputSchema,
  type GenerateSocialMediaPostInput,
  type GenerateSocialMediaPostOutput,
} from '@/ai/schemas/social-media-post-schemas';

export { type GenerateSocialMediaPostInput, type GenerateSocialMediaPostOutput };

const prompt = definePrompt({
  name: 'generateSocialMediaPostPrompt',
  inputSchema: GenerateSocialMediaPostInputSchema,
  outputSchema: GenerateSocialMediaPostOutputSchema,
  options: {
    modelId: BEDROCK_MODELS.HAIKU,
    temperature: 0.7,
    maxTokens: 2048,
  },
  prompt: `You are a social media marketing expert for real estate agents.

Generate social media posts for the following real estate topic. The tone should be {{{tone}}}.

Topic: {{{topic}}}

Create posts for these platforms:
- LinkedIn: Professional post with relevant hashtags
- Twitter/X: Short, punchy post UNDER 280 characters with hashtags
- Facebook: Friendly, engaging post that encourages comments
- Google Business Profile: Local-focused post that highlights community value and encourages engagement (max 1500 characters)

IMPORTANT: Return ONLY valid JSON with no additional text. The JSON must have exactly these four fields:
{
  "linkedin": "your linkedin post here",
  "twitter": "your twitter post here (max 280 chars)",
  "facebook": "your facebook post here",
  "googleBusiness": "your google business profile post here"
}`,
});

const generateSocialMediaPostFlow = defineFlow(
  {
    name: 'generateSocialMediaPostFlow',
    inputSchema: GenerateSocialMediaPostInputSchema,
    outputSchema: GenerateSocialMediaPostOutputSchema,
  },
  async (input) => {
    const output = await prompt(input);
    if (!output?.linkedin || !output?.twitter || !output?.facebook || !output?.googleBusiness) {
      throw new Error("The AI failed to generate posts for all platforms. Please try again.");
    }
    return output;
  }
);

export async function generateSocialMediaPost(
  input: GenerateSocialMediaPostInput
): Promise<GenerateSocialMediaPostOutput> {
  return generateSocialMediaPostFlow.execute(input);
}
