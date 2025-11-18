import { z } from 'zod';

/**
 * Schema for generating a blog post
 */
export const GenerateBlogPostInputSchema = z.object({
  topic: z.string().describe('The topic for the blog post'),
});

export const GenerateBlogPostOutputSchema = z.object({
  blogPost: z.string().describe('The generated blog post in Markdown format'),
  headerImage: z.string().describe('URL for the header image'),
});

export type GenerateBlogPostInput = z.infer<typeof GenerateBlogPostInputSchema>;
export type GenerateBlogPostOutput = z.infer<typeof GenerateBlogPostOutputSchema>;
