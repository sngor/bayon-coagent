import { z } from 'zod';

/**
 * Schema for analyzing SEO of content
 */
export const AnalyzeSEOInputSchema = z.object({
    content: z.string().describe('The content to analyze'),
    title: z.string().describe('The title of the content'),
    metaDescription: z.string().optional().describe('Optional meta description'),
    targetKeywords: z.array(z.string()).optional().describe('Optional target keywords'),
});

export const AnalyzeSEOOutputSchema = z.object({
    score: z.number().min(0).max(100).describe('SEO score from 0-100'),
    recommendations: z.array(
        z.object({
            priority: z.enum(['high', 'medium', 'low']).describe('Priority level'),
            category: z.enum([
                'title',
                'headings',
                'keywords',
                'readability',
                'meta',
                'length',
            ]).describe('Category of recommendation'),
            message: z.string().describe('Human-readable recommendation'),
            currentValue: z.string().optional().describe('Current state'),
            suggestedValue: z.string().optional().describe('Suggested improvement'),
        })
    ).describe('List of SEO recommendations'),
    strengths: z.array(z.string()).describe('SEO strengths of the content'),
});

export type AnalyzeSEOInput = z.infer<typeof AnalyzeSEOInputSchema>;
export type AnalyzeSEOOutput = z.infer<typeof AnalyzeSEOOutputSchema>;

/**
 * Schema for generating keyword suggestions
 */
export const GenerateKeywordSuggestionsInputSchema = z.object({
    location: z.string().describe('Geographic area (city, state)'),
    agentSpecialties: z.array(z.string()).optional().describe('Agent specialties (e.g., luxury, first-time buyers)'),
});

export const GenerateKeywordSuggestionsOutputSchema = z.object({
    keywords: z.array(
        z.object({
            keyword: z.string().describe('The keyword phrase'),
            searchVolume: z.number().describe('Estimated monthly searches'),
            competition: z.enum(['low', 'medium', 'high']).describe('Competition level'),
            rationale: z.string().describe('Why this keyword is relevant'),
        })
    ).describe('List of keyword suggestions'),
});

export type GenerateKeywordSuggestionsInput = z.infer<typeof GenerateKeywordSuggestionsInputSchema>;
export type GenerateKeywordSuggestionsOutput = z.infer<typeof GenerateKeywordSuggestionsOutputSchema>;

/**
 * Schema for generating meta descriptions
 */
export const GenerateMetaDescriptionInputSchema = z.object({
    content: z.string().describe('Blog post or page content'),
    primaryKeyword: z.string().describe('Primary keyword to include'),
    agentName: z.string().describe('Agent name'),
    location: z.string().describe('Agent location'),
});

export const GenerateMetaDescriptionOutputSchema = z.object({
    metaDescription: z.string().describe('150-160 character meta description'),
    characterCount: z.number().describe('Character count of the meta description'),
});

export type GenerateMetaDescriptionInput = z.infer<typeof GenerateMetaDescriptionInputSchema>;
export type GenerateMetaDescriptionOutput = z.infer<typeof GenerateMetaDescriptionOutputSchema>;
