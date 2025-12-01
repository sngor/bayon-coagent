'use server';

/**
 * @fileOverview Bedrock flow for generating keyword suggestions.
 * 
 * This flow generates location-based keyword suggestions for real estate agents,
 * combining geographic data with real estate terms and market trends.
 * 
 * Features:
 * - Location-based keyword generation
 * - Real estate term integration
 * - Search volume and competition estimates
 * - Specialty-specific keywords
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
    GenerateKeywordSuggestionsInputSchema,
    GenerateKeywordSuggestionsOutputSchema,
    type GenerateKeywordSuggestionsInput,
    type GenerateKeywordSuggestionsOutput,
} from '@/ai/schemas/seo-schemas';

const generateKeywordSuggestionsPrompt = definePrompt({
    name: 'generateKeywordSuggestionsPrompt',
    inputSchema: GenerateKeywordSuggestionsInputSchema,
    outputSchema: GenerateKeywordSuggestionsOutputSchema,
    options: MODEL_CONFIGS.ANALYTICAL,
    prompt: `You are an expert SEO strategist specializing in real estate keyword research. Your task is to generate highly relevant, location-based keyword suggestions for a real estate agent.

**Location:** {{{location}}}

{{#if agentSpecialties}}
**Agent Specialties:** {{{agentSpecialties}}}
{{/if}}

**Keyword Generation Instructions:**

Generate 10-15 keyword suggestions that combine:
1. The agent's location (city, neighborhood, or region)
2. Real estate terms (e.g., "homes for sale", "real estate agent", "property", "market", "listings", "houses", "condos", "townhomes")
3. Relevant modifiers (e.g., "best", "top", "luxury", "affordable", "new", "first-time buyer")
{{#if agentSpecialties}}
4. Specialty-specific terms based on the agent's focus areas
{{/if}}

**Keyword Requirements:**
- Each keyword must include the location name
- Mix of short-tail (2-3 words) and long-tail (4-6 words) keywords
- Include both buyer-focused and seller-focused keywords
- Consider seasonal trends and current market conditions
- Prioritize keywords with commercial intent

**Search Volume & Competition Estimates:**
For each keyword, provide realistic estimates:
- **Search Volume**: Monthly searches (range: 10-50,000)
  - High volume: 5,000+ (competitive, broad terms)
  - Medium volume: 500-5,000 (balanced opportunity)
  - Low volume: 10-500 (niche, specific terms)
- **Competition**: 'low', 'medium', or 'high'
  - Low: Niche terms, specific neighborhoods
  - Medium: Balanced terms with moderate competition
  - High: Broad terms, major cities

**Rationale:**
For each keyword, explain why it's valuable for this agent's market.

Return ONLY a JSON response with this exact structure:
{
  "keywords": [
    {
      "keyword": "Seattle real estate agent",
      "searchVolume": 2400,
      "competition": "high",
      "rationale": "High-intent keyword for agents in Seattle with strong commercial value"
    },
    {
      "keyword": "Capitol Hill homes for sale Seattle",
      "searchVolume": 480,
      "competition": "medium",
      "rationale": "Neighborhood-specific keyword with good balance of volume and competition"
    }
  ]
}

Generate keyword suggestions now.`,
});

const generateKeywordSuggestionsFlow = defineFlow(
    {
        name: 'generateKeywordSuggestionsFlow',
        inputSchema: GenerateKeywordSuggestionsInputSchema,
        outputSchema: GenerateKeywordSuggestionsOutputSchema,
    },
    async (input) => {
        console.log(`Generating keyword suggestions for location: "${input.location}"`);
        if (input.agentSpecialties && input.agentSpecialties.length > 0) {
            console.log(`Agent specialties: ${input.agentSpecialties.join(', ')}`);
        }

        // Execute the keyword generation prompt
        const output = await generateKeywordSuggestionsPrompt(input);

        console.log('Keyword suggestions generated:', {
            keywordCount: output.keywords.length,
        });

        // Validate the output
        if (!Array.isArray(output.keywords) || output.keywords.length === 0) {
            throw new Error('No keywords generated');
        }

        // Validate that all keywords include the location
        const location = input.location.toLowerCase();
        const missingLocation = output.keywords.filter(
            (k) => !k.keyword.toLowerCase().includes(location)
        );

        if (missingLocation.length > 0) {
            console.warn(
                `Warning: ${missingLocation.length} keywords don't include location:`,
                missingLocation.map((k) => k.keyword)
            );
        }

        // Validate that all keywords include at least one real estate term
        const realEstateTerms = [
            'real estate',
            'agent',
            'realtor',
            'homes',
            'houses',
            'property',
            'properties',
            'market',
            'listings',
            'condos',
            'townhomes',
            'apartments',
            'sale',
            'buy',
            'sell',
        ];

        const missingRealEstateTerm = output.keywords.filter((k) => {
            const keywordLower = k.keyword.toLowerCase();
            return !realEstateTerms.some((term) => keywordLower.includes(term));
        });

        if (missingRealEstateTerm.length > 0) {
            console.warn(
                `Warning: ${missingRealEstateTerm.length} keywords don't include real estate terms:`,
                missingRealEstateTerm.map((k) => k.keyword)
            );
        }

        return output;
    }
);

export async function generateKeywordSuggestions(
    input: GenerateKeywordSuggestionsInput
): Promise<GenerateKeywordSuggestionsOutput> {
    return generateKeywordSuggestionsFlow.execute(input);
}
