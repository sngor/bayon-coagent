'use server';

/**
 * @fileOverview Bedrock flow for generating listing descriptions.
 */

import { defineFlow, definePrompt, BEDROCK_MODELS } from '../flow-base';
import { getGuardrailsService, DEFAULT_GUARDRAILS_CONFIG } from '../guardrails';
import { getBedrockClient } from '../client';
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
    // 1. Validate input with Guardrails
    const guardrails = getGuardrailsService();

    // Validate key features and location
    const featuresValidation = guardrails.validateRequest(input.keyFeatures, DEFAULT_GUARDRAILS_CONFIG);
    if (!featuresValidation.allowed) {
      throw new Error(`Guardrails validation failed for Key Features: ${featuresValidation.reason}`);
    }

    const locationValidation = guardrails.validateRequest(input.location, DEFAULT_GUARDRAILS_CONFIG);
    if (!locationValidation.allowed) {
      throw new Error(`Guardrails validation failed for Location: ${locationValidation.reason}`);
    }

    // Use sanitized inputs
    const keyFeatures = featuresValidation.sanitizedPrompt || input.keyFeatures;
    const location = locationValidation.sanitizedPrompt || input.location;

    const output = await generateNewPrompt({ ...input, keyFeatures, location });
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
    // 1. Validate input with Guardrails
    const guardrails = getGuardrailsService();

    // Validate original description
    const descValidation = guardrails.validateRequest(input.originalDescription, DEFAULT_GUARDRAILS_CONFIG);
    if (!descValidation.allowed) {
      throw new Error(`Guardrails validation failed for Original Description: ${descValidation.reason}`);
    }

    let sellingPoints = input.sellingPoints;
    if (input.sellingPoints) {
      const spValidation = guardrails.validateRequest(input.sellingPoints, DEFAULT_GUARDRAILS_CONFIG);
      if (!spValidation.allowed) {
        throw new Error(`Guardrails validation failed for Selling Points: ${spValidation.reason}`);
      }
      sellingPoints = spValidation.sanitizedPrompt || input.sellingPoints;
    }

    // Use sanitized inputs
    const originalDescription = descValidation.sanitizedPrompt || input.originalDescription;

    const output = await optimizePrompt({ ...input, originalDescription, sellingPoints });
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

// Generate listing description from images
const GenerateFromImagesInputSchema = z.object({
  images: z.array(z.object({
    data: z.string(), // Base64 encoded
    format: z.enum(['jpeg', 'png', 'webp']),
    order: z.number(),
  })).min(1, 'At least one image is required'),
  propertyType: z.string(),
  location: z.string(),
  buyerPersona: z.string(),
  writingStyle: z.string(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  squareFeet: z.string().optional(),
});

type GenerateFromImagesInput = z.infer<typeof GenerateFromImagesInputSchema>;

const generateFromImagesFlow = defineFlow(
  {
    name: 'generateFromImagesFlow',
    inputSchema: GenerateFromImagesInputSchema,
    outputSchema: ListingDescriptionOutputSchema,
  },
  async (input) => {
    // Validate location with Guardrails
    const guardrails = getGuardrailsService();
    const locationValidation = guardrails.validateRequest(input.location, DEFAULT_GUARDRAILS_CONFIG);
    if (!locationValidation.allowed) {
      throw new Error(`Guardrails validation failed for Location: ${locationValidation.reason}`);
    }

    const location = locationValidation.sanitizedPrompt || input.location;

    // Build the system prompt
    const systemPrompt = 'You are an expert real estate copywriter specializing in compelling property listings. Analyze property images and create engaging descriptions.';

    // Build the user prompt with property details
    let userPrompt = `Analyze the provided property images and create an engaging, professional listing description.

Property Details:
- Property Type: ${input.propertyType}`;

    if (input.bedrooms) userPrompt += `\n- Bedrooms: ${input.bedrooms}`;
    if (input.bathrooms) userPrompt += `\n- Bathrooms: ${input.bathrooms}`;
    if (input.squareFeet) userPrompt += `\n- Square Feet: ${input.squareFeet}`;

    userPrompt += `\n- Location: ${location}

Target Buyer Persona: ${input.buyerPersona}
Writing Style: ${input.writingStyle}

Based on the images provided, identify and highlight:
1. Architectural style and exterior features
2. Interior finishes, materials, and design elements
3. Room layouts and spatial flow
4. Natural lighting and views
5. Unique or standout features
6. Condition and maintenance level
7. Outdoor spaces (yard, patio, deck, etc.)
8. Any luxury or premium elements

Tailor the description specifically for the ${input.buyerPersona} persona based on their typical needs and use the ${input.writingStyle} writing style.

The description should:
- Start with an attention-grabbing opening that speaks directly to the target buyer
- Highlight features visible in the images that are most relevant to the ${input.buyerPersona} persona
- Use vivid, descriptive language appropriate for the ${input.writingStyle} style
- Be 2-4 paragraphs long (200-300 words)
- Paint a picture of the lifestyle this property enables
- End with a compelling call-to-action

Return a JSON response with a "description" field containing the listing description.`;

    // Get Bedrock client
    const client = getBedrockClient();

    // Process images one at a time (Claude vision works best with single images)
    // We'll use the first image as primary, or combine insights if multiple
    const primaryImage = input.images[0];

    const output = await client.invokeWithVision(
      systemPrompt,
      userPrompt,
      {
        data: primaryImage.data,
        format: primaryImage.format,
      },
      ListingDescriptionOutputSchema,
      {
        temperature: 0.7,
        maxTokens: 2048,
        flowName: 'generateFromImagesFlow',
      }
    );

    if (!output?.description) {
      throw new Error("The AI returned an empty description. Please try again.");
    }

    return output;
  }
);

export async function generateListingFromImages(
  input: GenerateFromImagesInput
): Promise<ListingDescriptionOutput> {
  return generateFromImagesFlow.execute(input);
}
