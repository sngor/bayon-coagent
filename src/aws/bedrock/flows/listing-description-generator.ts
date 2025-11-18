'use server';

/**
 * @fileOverview Bedrock flow for generating listing descriptions.
 */

import { defineFlow, definePrompt, BEDROCK_MODELS } from '../flow-base';
import { z } from 'zod';

const GenerateListingDescriptionInputSchema = z.object({
  propertyDetails: z.string().describe('The property details to generate a description from.'),
});
export type GenerateListingDescriptionInput = z.infer<typeof GenerateListingDescriptionInputSchema>;

const GenerateListingDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated listing description.'),
});
export type GenerateListingDescriptionOutput = z.infer<typeof GenerateListingDescriptionOutputSchema>;

const prompt = definePrompt({
  name: 'generateListingDescriptionPrompt',
  inputSchema: GenerateListingDescriptionInputSchema,
  outputSchema: GenerateListingDescriptionOutputSchema,
  options: {
    modelId: BEDROCK_MODELS.HAIKU,
    temperature: 0.7,
    maxTokens: 2048,
  },
  prompt: `You are an expert real estate copywriter specializing in compelling property listings.

Based on the following property details, create an engaging, professional listing description that highlights the property's best features and appeals to potential buyers.

Property Details:
{{{propertyDetails}}}

The description should:
- Start with an attention-grabbing opening
- Highlight key features and amenities
- Use vivid, descriptive language
- Be 2-3 paragraphs long
- End with a call-to-action

Return a JSON response with a "description" field containing the listing description.`,
});

const generateListingDescriptionFlow = defineFlow(
  {
    name: 'generateListingDescriptionFlow',
    inputSchema: GenerateListingDescriptionInputSchema,
    outputSchema: GenerateListingDescriptionOutputSchema,
  },
  async (input) => {
    const output = await prompt(input);
    if (!output?.description) {
      throw new Error("The AI returned an empty description. Please try again.");
    }
    return output;
  }
);

export async function generateListingDescription(
  input: GenerateListingDescriptionInput
): Promise<GenerateListingDescriptionOutput> {
  return generateListingDescriptionFlow.execute(input);
}
