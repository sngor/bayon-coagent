'use server';

/**
 * @fileOverview Bedrock flow for analyzing SEO of content.
 * 
 * This flow analyzes blog posts and other content for SEO optimization,
 * providing a score and actionable recommendations.
 * 
 * Features:
 * - Evaluates title length, heading structure, keyword density, and readability
 * - Generates prioritized recommendations
 * - Identifies content strengths
 * - Provides specific suggestions for improvement
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
    AnalyzeSEOInputSchema,
    AnalyzeSEOOutputSchema,
    type AnalyzeSEOInput,
    type AnalyzeSEOOutput,
} from '@/ai/schemas/seo-schemas';

const analyzeSEOPrompt = definePrompt({
    name: 'analyzeSEOPrompt',
    inputSchema: AnalyzeSEOInputSchema,
    outputSchema: AnalyzeSEOOutputSchema,
    options: MODEL_CONFIGS.ANALYTICAL,
    prompt: `You are an expert SEO analyst specializing in real estate content optimization. Your task is to analyze the provided content and generate a comprehensive SEO evaluation.

**Title:** {{{title}}}

**Content:**
{{{content}}}

{{#if metaDescription}}
**Meta Description:** {{{metaDescription}}}
{{/if}}

{{#if targetKeywords}}
**Target Keywords:** {{{targetKeywords}}}
{{/if}}

**Analysis Instructions:**

Evaluate the content across these key SEO factors:

1. **Title Optimization (0-20 points)**
   - Optimal length: 50-60 characters
   - Includes primary keyword
   - Compelling and click-worthy
   - Not too long (>70 chars) or too short (<30 chars)

2. **Heading Structure (0-20 points)**
   - Has clear H1 (title)
   - Uses H2 and H3 subheadings effectively
   - Headings include relevant keywords
   - Logical hierarchy and organization

3. **Keyword Usage (0-20 points)**
   - Primary keyword appears naturally
   - Keyword density is 1-2% (not stuffed)
   - Related keywords and synonyms used
   - Keywords in first paragraph

4. **Readability (0-20 points)**
   - Clear, concise sentences
   - Appropriate paragraph length (3-5 sentences)
   - Uses bullet points and lists
   - Conversational tone

5. **Content Length (0-20 points)**
   - Optimal: 1500+ words for blog posts
   - Adequate depth and detail
   - Comprehensive coverage of topic

**Output Requirements:**

1. Calculate a total SEO score (0-100) based on the factors above
2. Generate 3-7 specific, actionable recommendations
3. Prioritize recommendations as 'high', 'medium', or 'low'
4. For each recommendation, provide:
   - Category (title, headings, keywords, readability, meta, length)
   - Clear message explaining the issue
   - Current value (if applicable)
   - Suggested improvement (if applicable)
5. List 2-4 strengths of the content

Return ONLY a JSON response with this exact structure:
{
  "score": 75,
  "recommendations": [
    {
      "priority": "high",
      "category": "title",
      "message": "Title is too long at 72 characters",
      "currentValue": "Current title here",
      "suggestedValue": "Shorter, optimized title here"
    }
  ],
  "strengths": [
    "Strong use of subheadings",
    "Good keyword density"
  ]
}

Analyze the content now and provide your SEO evaluation.`,
});

const analyzeSEOFlow = defineFlow(
    {
        name: 'analyzeSEOFlow',
        inputSchema: AnalyzeSEOInputSchema,
        outputSchema: AnalyzeSEOOutputSchema,
    },
    async (input) => {
        console.log(`Analyzing SEO for content with title: "${input.title}"`);

        // Execute the SEO analysis prompt
        const output = await analyzeSEOPrompt(input);

        console.log('SEO analysis complete:', {
            score: output.score,
            recommendationCount: output.recommendations.length,
            strengthCount: output.strengths.length,
        });

        // Validate the output
        if (typeof output.score !== 'number' || output.score < 0 || output.score > 100) {
            throw new Error('Invalid SEO score returned');
        }

        if (!Array.isArray(output.recommendations) || output.recommendations.length === 0) {
            throw new Error('No recommendations generated');
        }

        return output;
    }
);

export async function analyzeSEO(
    input: AnalyzeSEOInput
): Promise<AnalyzeSEOOutput> {
    return analyzeSEOFlow.execute(input);
}
