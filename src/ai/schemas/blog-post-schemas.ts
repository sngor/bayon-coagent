import { z } from 'zod';

/**
 * Schema for generating a blog post
 */
export const GenerateBlogPostInputSchema = z.object({
  topic: z.string().describe('The topic for the blog post'),
  includeWebSearch: z.boolean().optional().default(true).describe('Whether to search the web for current information'),
  searchDepth: z.enum(['basic', 'advanced']).optional().default('basic').describe('Depth of web search'),
});

export const GenerateBlogPostOutputSchema = z.object({
  blogPost: z.string().describe('The generated blog post in Markdown format'),
  headerImage: z.string().nullable().describe('URL for the header image (generated separately on user request)'),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    snippet: z.string().optional(),
  })).optional().describe('Sources used to ground the blog post'),
});

export type GenerateBlogPostInput = z.infer<typeof GenerateBlogPostInputSchema>;
export type GenerateBlogPostOutput = z.infer<typeof GenerateBlogPostOutputSchema>;
