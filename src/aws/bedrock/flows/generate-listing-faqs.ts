'use server';

/**
 * @fileOverview Bedrock flow for generating FAQ sections for real estate listings.
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getGuardrailsService, DEFAULT_GUARDRAILS_CONFIG } from '../guardrails';
import { z } from 'zod';

const GenerateListingFaqsInputSchema = z.object({
  propertyDescription: z
    .string()
    .describe('The property description to generate FAQs from.'),
});
export type GenerateListingFaqsInput = z.infer<
  typeof GenerateListingFaqsInputSchema
>;

const FaqSchema = z.object({
  q: z.string().describe("The generated question."),
  a: z.string().describe("The generated answer."),
});

const GenerateListingFaqsOutputSchema = z.object({
  faqs: z.array(FaqSchema).describe('An array of 4-5 frequently asked questions and their answers.'),
});
export type GenerateListingFaqsOutput = z.infer<
  typeof GenerateListingFaqsOutputSchema
>;

const prompt = definePrompt({
  name: 'generateListingFaqsPrompt',
  inputSchema: GenerateListingFaqsInputSchema,
  outputSchema: GenerateListingFaqsOutputSchema,
  options: MODEL_CONFIGS.BALANCED,
  prompt: `You are an expert real estate copywriter specializing in Answer Engine Optimization (AEO).

Based on the following property description, generate a list of 4-5 common questions a potential buyer might ask. Provide a concise answer for each question based *only* on the information available in the description. If the information is not available, state that in the answer.

If the provided text does not seem to be a real estate property description, politely decline and state that you can only generate FAQs for property listings.

Property Description: {{{propertyDescription}}}

Return a JSON response with a "faqs" array, where each item has "q" (question) and "a" (answer) fields.`,
});

const generateListingFaqsFlow = defineFlow(
  {
    name: 'generateListingFaqsFlow',
    inputSchema: GenerateListingFaqsInputSchema,
    outputSchema: GenerateListingFaqsOutputSchema,
  },
  async (input) => {
    // 1. Validate input with Guardrails
    const guardrails = getGuardrailsService();
    const validationResult = guardrails.validateRequest(input.propertyDescription, DEFAULT_GUARDRAILS_CONFIG);

    if (!validationResult.allowed) {
      throw new Error(`Guardrails validation failed: ${validationResult.reason}`);
    }

    // Use sanitized prompt if PII was detected
    const propertyDescription = validationResult.sanitizedPrompt || input.propertyDescription;

    const output = await prompt({ ...input, propertyDescription });
    if (!output?.faqs || output.faqs.length === 0) {
      throw new Error("The AI returned an unexpected response format for FAQs. Please try again.");
    }
    return output;
  }
);

export async function generateListingFaqs(
  input: GenerateListingFaqsInput
): Promise<GenerateListingFaqsOutput> {
  return generateListingFaqsFlow.execute(input);
}
