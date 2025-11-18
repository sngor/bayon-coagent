import { z } from 'zod';

/**
 * Schema for generating a real estate agent bio
 */
export const GenerateAgentBioInputSchema = z.object({
  name: z.string().describe('The agent\'s full name'),
  agencyName: z.string().describe('The name of the real estate agency'),
  experience: z.string().describe('Years of experience in real estate'),
  certifications: z.string().describe('Professional certifications and credentials'),
});

export const GenerateAgentBioOutputSchema = z.object({
  bio: z.string().describe('The generated professional biography'),
});

export type GenerateAgentBioInput = z.infer<typeof GenerateAgentBioInputSchema>;
export type GenerateAgentBioOutput = z.infer<typeof GenerateAgentBioOutputSchema>;
