'use server';

/**
 * @fileOverview Bedrock flow for generating a blog post.
 * 
 * Note: This version generates only the blog post text. The header image generation
 * functionality from Genkit (using Imagen) is not available in Bedrock. Consider
 * integrating with Amazon Titan Image Generator or another image generation service
 * for production use.
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
  GenerateBlogPostInputSchema,
  GenerateBlogPostOutputSchema,
  type GenerateBlogPostInput,
  type GenerateBlogPostOutput,
} from '@/ai/schemas/blog-post-schemas';

export { type GenerateBlogPostInput, type GenerateBlogPostOutput };

const textPrompt = definePrompt({
  name: 'generateBlogPostTextPrompt',
  inputSchema: GenerateBlogPostInputSchema,
  outputSchema: GenerateBlogPostOutputSchema,
  options: MODEL_CONFIGS.LONG_FORM,
  prompt: `You are an expert real estate content writer and SEO specialist. Your goal is to produce a well-structured, engaging, and SEO-friendly blog post.

**Topic:** {{{topic}}}

**IMPORTANT**: Your response MUST be about real estate. If the topic is not related to real estate, you must politely decline and explain that you can only write about real estate topics.

**Instructions:**
1.  **Title:** Start with a catchy, relevant title for the blog post.
2.  **Introduction:** Write a brief introduction that hooks the reader and states the purpose of the post.
3.  **Body:**
    -   Create at least 3-4 main sections with clear, descriptive subheadings (using '##' in Markdown).
    -   Within each section, use paragraphs, bullet points, or numbered lists to present information clearly.
    -   Use bold text to highlight key terms or takeaways.
    -   The tone should be professional, informative, and conversational.
4.  **Conclusion:** End with a summary of the key points.
5.  **Call to Action:** Include a concluding sentence that encourages readers to get in touch for more information.
6.  **Formatting:** The entire output must be a single Markdown string.

Return a JSON response with:
- "blogPost": The complete blog post in Markdown format
- "headerImage": A placeholder URL (use "https://via.placeholder.com/1200x630/4A90E2/FFFFFF?text=Real+Estate+Blog")

Generate the blog post now.`,
});

const generateBlogPostFlow = defineFlow(
  {
    name: 'generateBlogPostFlow',
    inputSchema: GenerateBlogPostInputSchema,
    outputSchema: GenerateBlogPostOutputSchema,
  },
  async (input) => {
    const output = await textPrompt(input);
    if (!output?.blogPost) {
      throw new Error("The AI returned an empty blog post. Please try again.");
    }
    
    // Ensure headerImage is present (use placeholder if not generated)
    if (!output.headerImage) {
      output.headerImage = "https://via.placeholder.com/1200x630/4A90E2/FFFFFF?text=Real+Estate+Blog";
    }
    
    return output;
  }
);

export async function generateBlogPost(
  input: GenerateBlogPostInput
): Promise<GenerateBlogPostOutput> {
  return generateBlogPostFlow.execute(input);
}
