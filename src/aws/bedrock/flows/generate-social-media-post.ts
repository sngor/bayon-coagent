'use server';

/**
 * @fileOverview Bedrock flow for generating social media posts.
 */

import { defineFlow, BEDROCK_MODELS } from '../flow-base';
import { getGuardrailsService, DEFAULT_GUARDRAILS_CONFIG } from '../guardrails';
import {
  GenerateSocialMediaPostInputSchema,
  GenerateSocialMediaPostOutputSchema,
  type GenerateSocialMediaPostInput,
  type GenerateSocialMediaPostOutput,
} from '@/ai/schemas/social-media-post-schemas';
import { getBedrockClient } from '../client';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

/**
 * Build platform-specific instructions
 */
function buildPlatformInstructions(platforms: string[]): string {
  const instructions: Record<string, string> = {
    linkedin: '- LinkedIn: Professional post with relevant hashtags',
    twitter: '- Twitter/X: Short, punchy post UNDER 280 characters with hashtags',
    facebook: '- Facebook: Friendly, engaging post that encourages comments',
    googleBusiness: '- Google Business Profile: Local-focused post that highlights community value and encourages engagement (max 1500 characters)',
    instagram: '- Instagram: Visual-focused post with engaging caption and relevant hashtags (max 2200 characters)',
  };

  return platforms.map(p => instructions[p] || '').filter(Boolean).join('\n');
}

/**
 * Build JSON structure example
 */
function buildJsonExample(platforms: string[]): string {
  const examples: Record<string, string> = {
    linkedin: '"linkedin": "your linkedin post here"',
    twitter: '"twitter": "your twitter post here (max 280 chars)"',
    facebook: '"facebook": "your facebook post here"',
    googleBusiness: '"googleBusiness": "your google business profile post here"',
    instagram: '"instagram": "your instagram post here"',
  };

  const fields = platforms.map(p => examples[p] || '').filter(Boolean).join(',\n  ');
  return `{\n  ${fields}\n}`;
}

/**
 * Generate posts using Bedrock
 */
async function generatePostsForPlatforms(topic: string, tone: string, platforms: string[]) {
  const client = getBedrockClient();

  const promptText = `You are a social media marketing expert for real estate agents.

Generate social media posts for the following real estate topic. The tone should be ${tone}.

Topic: ${topic}

Create posts for these platforms:
${buildPlatformInstructions(platforms)}

IMPORTANT: Return ONLY valid JSON with no additional text. The JSON must have exactly these fields:
${buildJsonExample(platforms)}`;

  const command = new InvokeModelCommand({
    modelId: BEDROCK_MODELS.HAIKU,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2048,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: promptText
      }]
    })
  });

  const response = await client.invokeModel(command.input);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const content = responseBody.content[0].text;

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error('Failed to parse JSON response from AI');
}

const generateSocialMediaPostFlow = defineFlow(
  {
    name: 'generateSocialMediaPostFlow',
    inputSchema: GenerateSocialMediaPostInputSchema,
    outputSchema: GenerateSocialMediaPostOutputSchema,
  },
  async (input) => {
    // 1. Validate input with Guardrails
    const guardrails = getGuardrailsService();
    const validationResult = guardrails.validateRequest(input.topic, DEFAULT_GUARDRAILS_CONFIG);

    if (!validationResult.allowed) {
      throw new Error(`Guardrails validation failed: ${validationResult.reason}`);
    }

    // Use sanitized prompt if PII was detected
    const topic = validationResult.sanitizedPrompt || input.topic;
    const platforms = input.platforms || ['linkedin', 'twitter', 'facebook', 'googleBusiness'];

    // 2. Generate multiple variations
    const numberOfVariations = input.numberOfVariations || 1;
    const variations = [];

    for (let i = 0; i < numberOfVariations; i++) {
      const output = await generatePostsForPlatforms(topic, input.tone, platforms);

      // Validate that requested platforms were generated
      const missingPlatforms = platforms.filter(p => !output[p as keyof typeof output]);
      if (missingPlatforms.length > 0) {
        console.warn(`Missing platforms in variation ${i + 1}:`, missingPlatforms);
      }

      variations.push(output);
    }

    return { variations };
  }
);

export async function generateSocialMediaPost(
  input: GenerateSocialMediaPostInput
): Promise<GenerateSocialMediaPostOutput> {
  return generateSocialMediaPostFlow.execute(input);
}
