'use server';

/**
 * @fileOverview Bedrock flow for generating a real estate market update.
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getGuardrailsService, DEFAULT_GUARDRAILS_CONFIG } from '../guardrails';
import {
  GenerateMarketUpdateInputSchema,
  GenerateMarketUpdateOutputSchema,
  type GenerateMarketUpdateInput,
  type GenerateMarketUpdateOutput,
} from '@/ai/schemas/market-update-schemas';



const prompt = definePrompt({
  name: 'generateMarketUpdatePrompt',
  inputSchema: GenerateMarketUpdateInputSchema,
  outputSchema: GenerateMarketUpdateOutputSchema,
  options: MODEL_CONFIGS.BALANCED,
  prompt: `You are an expert real estate analyst and copywriter. Your sole purpose is to create content about the real estate market.

Write a market update for the given location and time period, specifically targeting the provided audience.
The tone should be informative, insightful, and encouraging. Use clear, accessible language.

If the request is not about real estate, you must politely decline and state that you can only generate real estate market updates.

- Location: {{{location}}}
- Time Period: {{{timePeriod}}}
- Target Audience: {{{audience}}}

Structure the update as follows:
1. Start with a general overview of the current market trends
2. Provide specific insights and data relevant to the target audience
3. Conclude with actionable advice or a positive outlook

Return a JSON response with the following structure:
{
  "title": "A compelling title for the market update",
  "content": "The complete market update content in markdown format",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "statistics": [
    {
      "metric": "Median Home Price",
      "value": "$XXX,XXX",
      "change": "+X.X% from last month"
    }
  ]
}

Include 3-5 key points and 2-4 relevant statistics if available.`,
});

const generateMarketUpdateFlow = defineFlow(
  {
    name: 'generateMarketUpdateFlow',
    inputSchema: GenerateMarketUpdateInputSchema,
    outputSchema: GenerateMarketUpdateOutputSchema,
  },
  async (input) => {
    // 1. Validate input with Guardrails
    const guardrails = getGuardrailsService();
    const validationResult = guardrails.validateRequest(input.location, DEFAULT_GUARDRAILS_CONFIG);

    if (!validationResult.allowed) {
      throw new Error(`Guardrails validation failed: ${validationResult.reason}`);
    }

    // Use sanitized prompt if PII was detected
    const location = validationResult.sanitizedPrompt || input.location;

    const output = await prompt({ ...input, location });
    if (!output?.title || !output?.content) {
      throw new Error("The AI returned an incomplete market update. Please try again.");
    }
    return output;
  }
);

export async function generateMarketUpdate(
  input: GenerateMarketUpdateInput
): Promise<GenerateMarketUpdateOutput> {
  return generateMarketUpdateFlow.execute(input);
}
