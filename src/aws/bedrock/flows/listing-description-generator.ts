'use server';

/**
 * @fileOverview Bedrock flow for generating listing descriptions.
 */

import { defineFlow, definePrompt, BEDROCK_MODELS } from '../flow-base';
import {
  GenerateNewListingInputSchema,
  OptimizeListingInputSchema,
  type GenerateNewListingInput,
  type OptimizeListingInput
} from '@/ai/schemas/listing-description-schemas';
import { z } from 'zod';

const ListingDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated listing description.'),
});
export type ListingDescriptionOutput = z.infer<typeof ListingDescriptionOutputSchema>;

// Buyer persona characteristics for optimization
const BUYER_PERSONAS = {
  'First-Time Homebuyer': {
    focus: 'affordability, low maintenance, move-in ready features, and neighborhood amenities',
    tone: 'encouraging and educational'
  },
  'Growing Family': {
    focus: 'space, bedrooms, yard, schools, safety, and family-friendly features',
    tone: 'warm and family-oriented'
  },
  'Empty Nester': {
    focus: 'low maintenance, single-level living, accessibility, community, and lifestyle',
    tone: 'sophisticated and aspirational'
  },
  'Investor': {
    focus: 'ROI potential, rental income, appreciation, location advantages, and condition',
    tone: 'analytical and data-driven'
  },
  'Luxury Buyer': {
    focus: 'premium finishes, exclusivity, craftsmanship, unique features, and prestige',
    tone: 'sophisticated and elegant'
  },
  'Downsizer': {
    focus: 'efficiency, convenience, low maintenance, walkability, and lifestyle amenities',
    tone: 'practical yet aspirational'
  }
} as const;

// Generate new listing description
const generateNewPrompt = definePrompt({
  name: 'generateNewListingPrompt',
  inputSchema: GenerateNewListingInputSchema,
  outputSchema: ListingDescriptionOutputSchema,
  options: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.7,
    maxTokens: 2048,
  },
  prompt: `You are an expert real estate copywriter specializing in compelling property listings.

Create an engaging, professional listing description based on the following property details:

Property Type: {{{propertyType}}}
Bedrooms: {{{bedrooms}}}
Bathrooms: {{{bathrooms}}}
Square Feet: {{{squareFeet}}}
Location: {{{location}}}
Key Features: {{{keyFeatures}}}

Target Buyer Persona: {{{buyerPersona}}}
Writing Style: {{{writingStyle}}}

Tailor the description specifically for the {{{buyerPersona}}} persona based on their typical needs:

- First-Time Homebuyer: Focus on affordability, low maintenance, move-in ready features, and neighborhood amenities. Use an encouraging, educational tone emphasizing value and opportunity.
- Growing Family: Focus on space, bedrooms, yard, schools, safety, and family-friendly features. Use a warm, family-oriented tone emphasizing comfort and room to grow.
- Empty Nester: Focus on low maintenance, single-level living, accessibility, community, and lifestyle. Use a sophisticated tone emphasizing freedom and new chapter.
- Investor: Focus on ROI potential, rental income, appreciation, location advantages, and condition. Use an analytical, data-driven tone emphasizing financial opportunity.
- Luxury Buyer: Focus on premium finishes, exclusivity, craftsmanship, unique features, and prestige. Use a sophisticated, elegant tone emphasizing quality and distinction.
- Downsizer: Focus on efficiency, convenience, low maintenance, walkability, and lifestyle amenities. Use a practical yet aspirational tone emphasizing simplicity and quality of life.

The description should:
- Start with an attention-grabbing opening that speaks directly to the target buyer
- Highlight features most relevant to the {{{buyerPersona}}} persona
- Use vivid, descriptive language appropriate for the {{{writingStyle}}} style
- Be 2-4 paragraphs long (200-300 words)
- Paint a picture of the lifestyle this property enables
- End with a compelling call-to-action

Return a JSON response with a "description" field containing the listing description.`,
});

const generateNewFlow = defineFlow(
  {
    name: 'generateNewListingFlow',
    inputSchema: GenerateNewListingInputSchema,
    outputSchema: ListingDescriptionOutputSchema,
  },
  async (input) => {
    const output = await generateNewPrompt(input);
    if (!output?.description) {
      throw new Error("The AI returned an empty description. Please try again.");
    }
    return output;
  }
);

// Optimize existing listing description
const optimizePrompt = definePrompt({
  name: 'optimizeListingPrompt',
  inputSchema: OptimizeListingInputSchema,
  outputSchema: ListingDescriptionOutputSchema,
  options: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.7,
    maxTokens: 2048,
  },
  prompt: `You are an expert real estate copywriter specializing in optimizing property listings for specific buyer personas.

Rewrite the following listing description to specifically appeal to the {{{buyerPersona}}} persona:

Original Description:
{{{originalDescription}}}

Target Buyer Persona: {{{buyerPersona}}}
Emotional Appeal Style: {{{emotionalAppeal}}}
{{#if sellingPoints}}
Key Selling Points to Emphasize: {{{sellingPoints}}}
{{/if}}

Tailor the description specifically for the {{{buyerPersona}}} persona based on their typical needs:

- First-Time Homebuyer: Focus on affordability, low maintenance, move-in ready features, and neighborhood amenities. Use an encouraging, educational tone.
- Growing Family: Focus on space, bedrooms, yard, schools, safety, and family-friendly features. Use a warm, family-oriented tone.
- Empty Nester: Focus on low maintenance, single-level living, accessibility, community, and lifestyle. Use a sophisticated tone.
- Investor: Focus on ROI potential, rental income, appreciation, location advantages, and condition. Use an analytical, data-driven tone.
- Luxury Buyer: Focus on premium finishes, exclusivity, craftsmanship, unique features, and prestige. Use a sophisticated, elegant tone.
- Downsizer: Focus on efficiency, convenience, low maintenance, walkability, and lifestyle amenities. Use a practical yet aspirational tone.

Rewrite the description to:
- Speak directly to the {{{buyerPersona}}} buyer's needs and desires
- Emphasize features most relevant to this persona
- Use the {{{emotionalAppeal}}} emotional appeal style
- Maintain the same factual information but reframe the narrative
- Be 2-4 paragraphs long (200-300 words)
- Create an emotional connection with the target buyer
- End with a compelling call-to-action

Return a JSON response with a "description" field containing the optimized listing description.`,
});

const optimizeFlow = defineFlow(
  {
    name: 'optimizeListingFlow',
    inputSchema: OptimizeListingInputSchema,
    outputSchema: ListingDescriptionOutputSchema,
  },
  async (input) => {
    const output = await optimizePrompt(input);
    if (!output?.description) {
      throw new Error("The AI returned an empty description. Please try again.");
    }
    return output;
  }
);

export async function generateNewListingDescription(
  input: GenerateNewListingInput
): Promise<ListingDescriptionOutput> {
  return generateNewFlow.execute(input);
}

export async function optimizeListingDescription(
  input: OptimizeListingInput
): Promise<ListingDescriptionOutput> {
  return optimizeFlow.execute(input);
}

// Legacy function for backward compatibility
const LegacyInputSchema = z.object({
  propertyDetails: z.string(),
});

export async function generateListingDescription(
  input: z.infer<typeof LegacyInputSchema>
): Promise<ListingDescriptionOutput> {
  // Use the new generate flow with minimal defaults
  return generateNewFlow.execute({
    propertyType: 'Single-Family Home',
    bedrooms: '3',
    bathrooms: '2',
    squareFeet: '',
    location: 'Local Area',
    keyFeatures: input.propertyDetails,
    buyerPersona: 'First-Time Homebuyer',
    writingStyle: 'Balanced',
  });
}
