'use server';

/**
 * @fileOverview Bedrock flow for generating a blog post.
 * 
 * This version generates blog post text grounded with real-time web search data.
 * Header images are generated separately using Google Gemini API when the user clicks "Generate Image".
 * 
 * Features:
 * - Web search integration via Tavily API for current, factual information
 * - Automatic citation of sources
 * - Grounded content with real statistics and data
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getGuardrailsService, DEFAULT_GUARDRAILS_CONFIG } from '../guardrails';
import { getSearchClient } from '@/aws/search/client';
import type { SearchResult } from '@/aws/search/client';
import {
  GenerateBlogPostInputSchema,
  GenerateBlogPostOutputSchema,
  type GenerateBlogPostInput,
  type GenerateBlogPostOutput,
} from '@/ai/schemas/blog-post-schemas';

export { type GenerateBlogPostInput, type GenerateBlogPostOutput };

const textPrompt = definePrompt({
  name: 'generateBlogPostTextPrompt',
  inputSchema: z.object({
    topic: z.string(),
    searchContext: z.string().optional(),
  }),
  outputSchema: GenerateBlogPostOutputSchema.omit({ sources: true }),
  options: MODEL_CONFIGS.LONG_FORM,
  prompt: `You are an expert real estate content writer and SEO specialist. Your goal is to produce a well-structured, engaging, and SEO-friendly blog post grounded in current, factual information.

**Topic:** {{{topic}}}

{{#if searchContext}}
**Current Information & Research:**
{{{searchContext}}}

Use this research to ground your blog post with specific facts, statistics, trends, and expert insights. Reference specific data points naturally within the content. Include inline citations using [1], [2], etc. format where you reference specific sources.
{{/if}}

**IMPORTANT**: Your response MUST be about real estate. If the topic is not related to real estate, you must politely decline and explain that you can only write about real estate topics.

**Instructions:**
1.  **Title:** Start with a catchy, relevant title for the blog post that reflects current trends or data.
2.  **Introduction:** Write a brief introduction that hooks the reader with a compelling statistic or current trend, then states the purpose of the post.
3.  **Body:**
    -   Create at least 3-4 main sections with clear, descriptive subheadings (using '##' in Markdown).
    -   Within each section, use paragraphs, bullet points, or numbered lists to present information clearly.
    -   **Ground your content with specific facts, statistics, and data from the research provided.**
    -   Use bold text to highlight key terms or takeaways.
    -   Include inline citations [1], [2], etc. when referencing specific sources.
    -   The tone should be professional, informative, and conversational.
4.  **Conclusion:** End with a summary of the key points and forward-looking insights.
5.  **Call to Action:** Include a concluding sentence that encourages readers to get in touch for more information.
6.  **Formatting:** The entire output must be a single Markdown string.

Return ONLY a JSON response with this exact structure:
{
  "blogPost": "The complete blog post in Markdown format with inline citations",
  "headerImage": null
}

Do not include any other fields. Generate the blog post now.`,
});

/**
 * Performs web search to gather current information for the blog post
 */
async function searchForContext(topic: string, searchDepth: 'basic' | 'advanced'): Promise<{
  searchContext: string;
  sources: Array<{ title: string; url: string; snippet?: string }>;
}> {
  try {
    const searchClient = getSearchClient('tavily');

    // Enhance the search query for real estate context
    const searchQuery = `real estate ${topic} latest trends statistics 2024 2025`;

    console.log(`Searching for: "${searchQuery}" with depth: ${searchDepth}`);

    const searchResponse = await searchClient.search(searchQuery, {
      maxResults: searchDepth === 'advanced' ? 10 : 5,
      searchDepth,
      includeAnswer: true,
    });

    console.log(`Found ${searchResponse.results.length} search results`);

    // Format search results for AI consumption
    const formattedResults = searchClient.formatResultsForAI(searchResponse.results, true);

    // Add AI-generated answer if available
    let searchContext = '';
    if (searchResponse.answer) {
      searchContext += `**AI Summary:**\n${searchResponse.answer}\n\n---\n\n`;
    }
    searchContext += `**Detailed Sources:**\n\n${formattedResults}`;

    // Extract sources for citations
    const sources = searchResponse.results.map((result: SearchResult) => ({
      title: result.title,
      url: result.url,
      snippet: result.content,
    }));

    return { searchContext, sources };
  } catch (error) {
    console.error('Web search failed:', error);
    // If search fails, continue without it rather than failing the entire flow
    return {
      searchContext: '',
      sources: [],
    };
  }
}

const generateBlogPostFlow = defineFlow(
  {
    name: 'generateBlogPostFlow',
    inputSchema: GenerateBlogPostInputSchema,
    outputSchema: GenerateBlogPostOutputSchema,
  },
  async (input) => {
    // 1. Validate input with Guardrails
    const guardrails = getGuardrailsService();
    const validationResult = guardrails.validateRequest(input.topic, DEFAULT_GUARDRAILS_CONFIG);

    if (!validationResult.allowed) {
      throw new Error(`Guardrails validation failed: ${validationResult.reason}`);
    }

    // Use sanitized prompt if PII was detected
    const topic = validationResult.sanitizedPrompt || input.topic;

    let searchContext = '';
    let sources: Array<{ title: string; url: string; snippet?: string }> = [];

    // Perform web search if enabled
    if (input.includeWebSearch !== false) {
      const searchDepth = input.searchDepth || 'basic';
      console.log(`Performing web search for topic: "${topic}"`);

      const searchData = await searchForContext(topic, searchDepth);
      searchContext = searchData.searchContext;
      sources = searchData.sources;

      if (sources.length > 0) {
        console.log(`Grounding blog post with ${sources.length} sources`);
      } else {
        console.log('No search results found, generating without web context');
      }
    } else {
      console.log('Web search disabled, generating blog post without external context');
    }

    // Generate blog post with search context
    const output = await textPrompt({
      topic: topic,
      searchContext: searchContext || undefined,
    });

    console.log('Blog post flow output:', JSON.stringify(output, null, 2));

    if (!output?.blogPost) {
      console.error('Missing blogPost in output:', output);
      throw new Error("The AI returned an empty blog post. Please try again.");
    }

    // Append sources section if we have citations
    let finalBlogPost = output.blogPost;
    if (sources.length > 0) {
      finalBlogPost += '\n\n---\n\n## Sources\n\n';
      sources.forEach((source, index) => {
        finalBlogPost += `[${index + 1}] [${source.title}](${source.url})\n`;
      });
    }

    const result = {
      blogPost: finalBlogPost,
      headerImage: null,
      sources: sources.length > 0 ? sources : undefined,
    };

    console.log('Returning blog post result:', {
      blogPostLength: result.blogPost.length,
      headerImage: result.headerImage,
      sourcesCount: sources.length,
    });

    return result;
  }
);

export async function generateBlogPost(
  input: GenerateBlogPostInput
): Promise<GenerateBlogPostOutput> {
  return generateBlogPostFlow.execute(input);
}
