'use server';

/**
 * @fileOverview Bedrock flow for generating a real estate agent bio.
 */

import { defineFlow, definePrompt } from '../flow-base';
import {
  GenerateAgentBioInputSchema,
  GenerateAgentBioOutputSchema,
  type GenerateAgentBioInput,
  type GenerateAgentBioOutput,
} from '@/ai/schemas/agent-bio-schemas';

export { type GenerateAgentBioInput, type GenerateAgentBioOutput };

const prompt = definePrompt({
  name: 'generateAgentBioPrompt',
  inputSchema: GenerateAgentBioInputSchema,
  outputSchema: GenerateAgentBioOutputSchema,
  prompt: `You are an expert copywriter for real estate professionals.

Write a compelling, professional, and concise (3-4 sentences) biography for a real estate agent using the following details.
The tone should be authoritative, trustworthy, and approachable.
Focus on highlighting their experience and specializations.

Agent Details:
- Name: {{{name}}}
- Agency: {{{agencyName}}}
- Years of Experience: {{{experience}}}
- Certifications: {{{certifications}}}

Generate the bio in JSON format with a "bio" field containing the biography text.`,
});

const generateAgentBioFlow = defineFlow(
  {
    name: 'generateAgentBioFlow',
    inputSchema: GenerateAgentBioInputSchema,
    outputSchema: GenerateAgentBioOutputSchema,
  },
  async (input) => {
    const output = await prompt(input);
    if (!output?.bio) {
      throw new Error("The AI returned an empty bio. Please try again.");
    }
    return output;
  }
);

export async function generateAgentBio(
  input: GenerateAgentBioInput
): Promise<GenerateAgentBioOutput> {
  return generateAgentBioFlow.execute(input);
}
