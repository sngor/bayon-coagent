'use server';

/**
 * @fileOverview Bedrock flow for generating neighborhood guides.
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { z } from 'zod';

const GenerateNeighborhoodGuideInputSchema = z.object({
  targetMarket: z
    .string()
    .describe('The target market for the neighborhood guide (e.g., "Austin, TX").'),
  pillarTopic: z
    .string()
    .describe(
      'The core pillar topic for the guide (e.g., "The Ultimate Guide to Living in Austin").'
    ),
});
export type GenerateNeighborhoodGuideInput = z.infer<
  typeof GenerateNeighborhoodGuideInputSchema
>;

const GenerateNeighborhoodGuideOutputSchema = z.object({
  neighborhoodGuide: z
    .string()
    .describe('The generated neighborhood guide content in Markdown format.'),
});
export type GenerateNeighborhoodGuideOutput = z.infer<
  typeof GenerateNeighborhoodGuideOutputSchema
>;

const prompt = definePrompt({
  name: 'generateNeighborhoodGuidePrompt',
  inputSchema: GenerateNeighborhoodGuideInputSchema,
  outputSchema: GenerateNeighborhoodGuideOutputSchema,
  options: MODEL_CONFIGS.LONG_FORM,
  prompt: `You are an expert real estate content writer specializing in creating hyper-local neighborhood guides. Your sole purpose is to create content for people looking to move to a new area.

You will use your internal knowledge, public data, and market statistics to create a comprehensive and engaging guide for the specified target market and pillar topic.
The guide should include information about amenities, lifestyle, local history, and other relevant details that would be of interest to a potential resident.

If the topic is not about a real estate location or neighborhood, you must politely decline and state that you can only create real estate guides.

Format the output as a well-structured Markdown document. Use headings (##, ###), paragraphs, and lists to structure the content.

Target Market: {{{targetMarket}}}
Pillar Topic: {{{pillarTopic}}}

Return a JSON response with a "neighborhoodGuide" field containing the complete guide in Markdown format.`,
});

const generateNeighborhoodGuideFlow = defineFlow(
  {
    name: 'generateNeighborhoodGuideFlow',
    inputSchema: GenerateNeighborhoodGuideInputSchema,
    outputSchema: GenerateNeighborhoodGuideOutputSchema,
  },
  async (input) => {
    const output = await prompt(input);
    if (!output?.neighborhoodGuide) {
      throw new Error("The AI returned an empty neighborhood guide. Please try again.");
    }
    return output;
  }
);

export async function generateNeighborhoodGuide(
  input: GenerateNeighborhoodGuideInput
): Promise<GenerateNeighborhoodGuideOutput> {
  return generateNeighborhoodGuideFlow.execute(input);
}
