import { z } from 'zod';

/**
 * Schema for generating social media posts
 */
export const GenerateSocialMediaPostInputSchema = z.object({
  topic: z.string().describe('The topic for the social media posts'),
  tone: z.string().describe('The tone of the posts (e.g., professional, casual, enthusiastic)'),
});

export const GenerateSocialMediaPostOutputSchema = z.object({
  linkedin: z.string().describe('The LinkedIn post content'),
  twitter: z.string().describe('The Twitter/X post content'),
});

export type GenerateSocialMediaPostInput = z.infer<typeof GenerateSocialMediaPostInputSchema>;
export type GenerateSocialMediaPostOutput = z.infer<typeof GenerateSocialMediaPostOutputSchema>;
