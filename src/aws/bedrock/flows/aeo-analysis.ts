'use server';

/**
 * @fileOverview Bedrock flow for AEO (Answer Engine Optimization) analysis
 * 
 * Analyzes an agent's online presence for AI discoverability and provides
 * actionable recommendations to improve visibility in AI search engines.
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getGuardrailsService, DEFAULT_GUARDRAILS_CONFIG } from '../guardrails';
import { getSearchClient } from '@/aws/search/client';
import {
    aeoAnalysisInputSchema,
    aeoAnalysisResultSchema,
    type AEOAnalysisInput,
    type AEOAnalysisResult,
} from '@/ai/schemas/aeo-schemas';

const aeoAnalysisPrompt = definePrompt({
    name: 'aeoAnalysisPrompt',
    inputSchema: z.object({
        agentName: z.string(),
        businessName: z.string().optional(),
        website: z.string().optional(),
        location: z.string().optional(),
        googleBusinessProfileUrl: z.string().optional(),
        socialMediaUrls: z.array(z.string()).optional(),
        reviewCount: z.number().optional(),
        averageRating: z.number().optional(),
        hasSchemaMarkup: z.boolean().optional(),
        napConsistency: z.number().optional(),
        webSearchResults: z.string().optional(),
    }),
    outputSchema: aeoAnalysisResultSchema,
    options: MODEL_CONFIGS.LONG_FORM,
    prompt: `You are an expert in AEO (Answer Engine Optimization) and AI search visibility for real estate professionals. Your task is to analyze an agent's online presence and provide a comprehensive assessment of their AI discoverability.

**Agent Information:**
- Name: {{{agentName}}}
{{#if businessName}}- Business: {{{businessName}}}{{/if}}
{{#if website}}- Website: {{{website}}}{{/if}}
{{#if location}}- Location: {{{location}}}{{/if}}
{{#if googleBusinessProfileUrl}}- Google Business Profile: {{{googleBusinessProfileUrl}}}{{/if}}
{{#if socialMediaUrls}}- Social Media: {{#each socialMediaUrls}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if reviewCount}}- Reviews: {{{reviewCount}}} reviews{{/if}}
{{#if averageRating}}- Average Rating: {{{averageRating}}}/5{{/if}}
{{#if hasSchemaMarkup}}- Has Schema Markup: {{{hasSchemaMarkup}}}{{/if}}
{{#if napConsistency}}- NAP Consistency: {{{napConsistency}}}%{{/if}}

{{#if webSearchResults}}
**Current Online Presence:**
{{{webSearchResults}}}
{{/if}}

**Your Task:**
Analyze this agent's AI visibility and provide:

1. **AEO Score (0-100)** with breakdown:
   - schemaMarkup (0-20): Does the website have proper schema.org markup?
   - googleBusinessProfile (0-20): Is the GBP complete and optimized?
   - reviewsAndRatings (0-15): Quality and quantity of reviews
   - socialMediaPresence (0-10): Active social media profiles
   - contentFreshness (0-10): Recent, relevant content
   - napConsistency (0-10): Name, Address, Phone consistency
   - backlinkQuality (0-10): Quality backlinks and citations
   - faqContent (0-5): FAQ sections and Q&A content

2. **Recommendations** (3-5 actionable items):
   Each recommendation must include:
   - id: unique identifier (use format: "rec_1", "rec_2", etc.)
   - category: one of [technical_seo, content, reviews, social_proof, authority, local_seo, structured_data]
   - priority: high, medium, or low
   - title: short, actionable title
   - description: detailed explanation
   - impact: potential score improvement (0-20)
   - effort: easy, moderate, or difficult
   - actionItems: array of 2-4 specific steps
   - status: "pending"
   - createdAt: current ISO timestamp

3. **Insights** (3-5 key findings):
   Each insight must include:
   - type: strength, weakness, opportunity, or threat
   - category: relevant category
   - message: clear, concise message
   - details: additional context (optional)

4. **Competitive Position** (optional):
   Brief assessment of how this agent compares to typical competitors

**Scoring Guidelines:**
- 0-40: Poor AI visibility, needs significant work
- 41-60: Fair visibility, room for improvement
- 61-80: Good visibility, competitive
- 81-100: Excellent visibility, market leader

**Important:**
- Be specific and actionable in recommendations
- Prioritize high-impact, easy-to-implement items
- Consider real estate industry best practices
- Focus on AI search engines (ChatGPT, Perplexity, Claude, Gemini)

Return ONLY a valid JSON response matching this exact structure:
{
  "score": {
    "userId": "will be set by system",
    "score": 75,
    "timestamp": "2024-01-01T00:00:00Z",
    "breakdown": {
      "schemaMarkup": 15,
      "googleBusinessProfile": 18,
      "reviewsAndRatings": 12,
      "socialMediaPresence": 8,
      "contentFreshness": 7,
      "napConsistency": 9,
      "backlinkQuality": 4,
      "faqContent": 2
    },
    "trend": "stable"
  },
  "recommendations": [
    {
      "id": "rec_1",
      "userId": "will be set by system",
      "category": "structured_data",
      "priority": "high",
      "title": "Add Schema.org Markup",
      "description": "Implement LocalBusiness and Person schema markup...",
      "impact": 15,
      "effort": "moderate",
      "actionItems": ["Step 1", "Step 2", "Step 3"],
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "insights": [
    {
      "type": "strength",
      "category": "reviews",
      "message": "Strong review profile with high ratings",
      "details": "50+ reviews with 4.8 average rating"
    }
  ],
  "competitivePosition": "Above average for the market"
}`,
});

/**
 * Search for agent's online presence
 */
async function searchAgentPresence(agentName: string, location?: string): Promise<string> {
    try {
        const searchClient = getSearchClient('tavily');

        // Build search query
        let searchQuery = `"${agentName}" real estate agent`;
        if (location) {
            searchQuery += ` ${location}`;
        }

        console.log(`Searching for agent presence: "${searchQuery}"`);

        const searchResponse = await searchClient.search(searchQuery, {
            maxResults: 5,
            searchDepth: 'basic',
            includeAnswer: false,
        });

        console.log(`Found ${searchResponse.results.length} results for agent`);

        // Format results for AI analysis
        const formattedResults = searchClient.formatResultsForAI(searchResponse.results, true);

        return formattedResults;
    } catch (error) {
        console.error('Agent presence search failed:', error);
        return '';
    }
}

const aeoAnalysisFlow = defineFlow(
    {
        name: 'aeoAnalysisFlow',
        inputSchema: aeoAnalysisInputSchema,
        outputSchema: aeoAnalysisResultSchema,
    },
    async (input) => {
        // 1. Validate input with Guardrails
        const guardrails = getGuardrailsService();
        const validationResult = guardrails.validateRequest(
            `${input.agentName} ${input.location || ''}`,
            DEFAULT_GUARDRAILS_CONFIG
        );

        if (!validationResult.allowed) {
            throw new Error(`Guardrails validation failed: ${validationResult.reason}`);
        }

        // 2. Search for agent's online presence
        console.log(`Starting AEO analysis for: ${input.agentName}`);
        const webSearchResults = await searchAgentPresence(input.agentName, input.location);

        // 3. Run AEO analysis
        const output = await aeoAnalysisPrompt({
            agentName: input.agentName,
            businessName: input.businessName,
            website: input.website,
            location: input.location,
            googleBusinessProfileUrl: input.googleBusinessProfileUrl,
            socialMediaUrls: input.socialMediaUrls,
            reviewCount: input.reviewCount,
            averageRating: input.averageRating,
            hasSchemaMarkup: input.hasSchemaMarkup,
            napConsistency: input.napConsistency,
            webSearchResults: webSearchResults || undefined,
        });

        console.log('AEO analysis output:', JSON.stringify(output, null, 2));

        if (!output?.score) {
            console.error('Missing score in output:', output);
            throw new Error('The AI returned an incomplete analysis. Please try again.');
        }

        // 4. Set userId and timestamp on all items
        const timestamp = new Date().toISOString();
        output.score.userId = input.userId;
        output.score.timestamp = timestamp;

        output.recommendations = output.recommendations.map((rec) => ({
            ...rec,
            userId: input.userId,
            createdAt: timestamp,
        }));

        // 5. Calculate trend if we have previous score
        // This will be enhanced later when we have historical data
        output.score.trend = 'stable';

        console.log('Returning AEO analysis result:', {
            score: output.score.score,
            recommendationsCount: output.recommendations.length,
            insightsCount: output.insights.length,
        });

        return output;
    }
);

export async function analyzeAEO(input: AEOAnalysisInput): Promise<AEOAnalysisResult> {
    return aeoAnalysisFlow.execute(input);
}
