'use server';

/**
 * @fileOverview Bedrock flow for generating social media posts.
 */

import { defineFlow, definePrompt } from '../flow-base';
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
  prompt: `You are a social media marketing expert for real estate agents. Your responses must be related to real estate.

Generate a set of social media posts for the following topic, tailored for each specified platform. The tone should be {{{tone}}}.
If the topic is not related to real estate, you must politely decline and state that you only create content for real estate topics.

Topic: {{{topic}}}

Platforms to generate for:
- LinkedIn: A professional post, slightly longer, using professional language and relevant hashtags.
- Twitter/X: A short, punchy post, under 280 characters, with engaging hashtags.
- Facebook: A friendly, community-focused post that encourages engagement and comments.

Return a JSON response with three fields:
- "linkedin": The LinkedIn post
- "twitter": The Twitter/X post
- "facebook": The Facebook post`,
});

const generateSocialMediaPostFlow = defineFlow(
  {
    name: 'generateSocialMediaPostFlow',
    inputSchema: GenerateSocialMediaPostInputSchema,
    outputSchema: GenerateSocialMediaPostOutputSchema,
  },
  async (input) => {
    const output = await prompt(input);
    if (!output?.linkedin || !output?.twitter || !output?.facebook) {
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
