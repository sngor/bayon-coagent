/**
 * @fileOverview Bedrock flow for virtual renovation visualization.
 * 
 * This flow uses Amazon Titan Image Generator to visualize potential
 * property renovations based on natural language descriptions, helping
 * buyers see the potential of fixer-upper homes.
 * 
 * Requirements: 6.2, 6.3, 10.5
 */

import { z } from 'zod';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { getConfig, getAWSCredentials } from '@/aws/config';
import { VirtualRenovationParamsSchema, type VirtualRenovationParams } from '@/ai/schemas/reimagine-schemas';

// ============================================================================
// Constants
// ============================================================================

/**
 * Stability AI Control Structure model ID via inference profile
 * This model is optimized for architectural visualization and style transfer
 * while maintaining structural integrity
 */
const CONTROL_STRUCTURE_MODEL = 'us.stability.stable-image-control-structure-v1:0';

/**
 * Common renovation style presets to enhance user descriptions
 */
const STYLE_ENHANCEMENTS: Record<string, string> = {
  'modern': 'with clean lines, contemporary finishes, and minimalist aesthetic',
  'traditional': 'with classic details, timeless finishes, and warm traditional style',
  'farmhouse': 'with rustic charm, shiplap, and farmhouse-style fixtures',
  'industrial': 'with exposed elements, metal accents, and urban industrial style',
  'coastal': 'with light colors, natural textures, and beach-inspired design',
  'transitional': 'with balanced blend of traditional and contemporary elements',
  'craftsman': 'with quality craftsmanship, natural materials, and attention to detail',
  'mediterranean': 'with warm colors, textured walls, and Mediterranean-inspired details',
};

// ============================================================================
// Input/Output Schemas
// ============================================================================

export const VirtualRenovationInputSchema = z.object({
  imageData: z.string(), // Base64 encoded source image
  imageFormat: z.enum(['jpeg', 'png', 'webp']),
  params: VirtualRenovationParamsSchema,
});

export type VirtualRenovationInput = z.infer<typeof VirtualRenovationInputSchema>;

export const VirtualRenovationOutputSchema = z.object({
  renovatedImageData: z.string(), // Base64 encoded result image
  imageFormat: z.string(),
});

export type VirtualRenovationOutput = z.infer<typeof VirtualRenovationOutputSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Enhances the user's renovation description with style-specific details
 * and professional real estate visualization guidance
 * 
 * Titan has a 512 character limit for prompts, so we need to be concise
 * 
 * @param params - Renovation parameters
 * @returns Enhanced prompt for Titan (max 512 characters)
 */
function buildRenovationPrompt(params: VirtualRenovationParams): string {
  // Start with the core renovation description
  let prompt = `Renovate: ${params.description}`;

  // Add style if provided (keep it concise)
  if (params.style) {
    const styleLower = params.style.toLowerCase();
    const styleEnhancement = STYLE_ENHANCEMENTS[styleLower];
    
    if (styleEnhancement) {
      prompt += `. ${params.style} style ${styleEnhancement}`;
    } else {
      prompt += `. ${params.style} style`;
    }
  }

  // Add essential guidance (keep under 512 chars total)
  prompt += `. Maintain architecture. Professional real estate visualization. Realistic, achievable renovations.`;

  // Ensure we don't exceed 512 characters
  if (prompt.length > 512) {
    // Truncate to fit, prioritizing the user's description
    const maxDescLength = 512 - 100; // Reserve 100 chars for style and guidance
    const truncatedDesc = params.description.substring(0, maxDescLength);
    prompt = `Renovate: ${truncatedDesc}`;
    
    if (params.style) {
      prompt += `. ${params.style} style`;
    }
    
    prompt += `. Maintain architecture. Professional visualization.`;
    
    // Final safety check
    if (prompt.length > 512) {
      prompt = prompt.substring(0, 512);
    }
  }

  return prompt;
}

/**
 * Calculates similarity strength based on renovation scope
 * More extensive renovations need lower similarity to allow bigger changes
 * 
 * @param description - Renovation description
 * @returns Similarity strength (0.0 to 1.0)
 */
function calculateSimilarityStrength(description: string): number {
  const descriptionLower = description.toLowerCase();
  
  // Keywords indicating major renovations (need more freedom)
  const majorKeywords = [
    'complete', 'total', 'gut', 'rebuild', 'demolish', 'remove wall',
    'open concept', 'addition', 'expand', 'reconfigure'
  ];
  
  // Keywords indicating minor updates (preserve more)
  const minorKeywords = [
    'paint', 'refresh', 'update', 'replace fixtures', 'new hardware',
    'refinish', 'touch up', 'cosmetic'
  ];
  
  const hasMajorKeywords = majorKeywords.some(keyword => 
    descriptionLower.includes(keyword)
  );
  
  const hasMinorKeywords = minorKeywords.some(keyword => 
    descriptionLower.includes(keyword)
  );
  
  // Major renovations: lower similarity (0.3-0.4) for more dramatic changes
  if (hasMajorKeywords) {
    return 0.35;
  }
  
  // Minor updates: higher similarity (0.6-0.7) to preserve more
  if (hasMinorKeywords) {
    return 0.65;
  }
  
  // Default: moderate renovations (0.45-0.55)
  return 0.5;
}

// ============================================================================
// Virtual Renovation Flow Implementation
// ============================================================================

/**
 * Generates a visualization of potential property renovations
 * 
 * This function uses Amazon Titan Image Generator to:
 * 1. Analyze the current property condition
 * 2. Interpret the natural language renovation description
 * 3. Generate a realistic visualization of the renovated property
 * 4. Maintain architectural integrity and structural features
 * 5. Apply style guidance if provided
 * 
 * The visualization helps buyers see the potential of fixer-upper properties
 * and understand how renovations could transform the space.
 * 
 * @param input - Source image and renovation parameters
 * @returns Renovated visualization image
 */
export async function virtualRenovation(
  input: VirtualRenovationInput
): Promise<VirtualRenovationOutput> {
  // Validate input
  const validatedInput = VirtualRenovationInputSchema.parse(input);

  // Create Bedrock client
  const config = getConfig();
  const credentials = getAWSCredentials();

  const client = new BedrockRuntimeClient({
    region: config.bedrock.region,
    endpoint: config.bedrock.endpoint,
    credentials: credentials.accessKeyId && credentials.secretAccessKey
      ? {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        }
      : undefined,
  });

  // Build renovation prompt with style enhancements
  const prompt = buildRenovationPrompt(validatedInput.params);

  // Calculate similarity strength based on renovation scope
  const similarityStrength = calculateSimilarityStrength(
    validatedInput.params.description
  );

  // Negative prompt to avoid unwanted changes
  const negativePrompt = `distorted architecture, unrealistic, impossible renovations, 
structural impossibilities, blurry, low quality, artifacts, 
changed building footprint, altered fundamental structure`;

  // Construct Titan Image Generator request for renovation visualization
  const requestBody = {
    image: validatedInput.imageData, // Base64 encoded source image
    prompt: prompt,
    negative_prompt: negativePrompt,
    control_strength: 1.0 - similarityStrength, // Balance between preserving structure and showing renovations
    seed: Math.floor(Math.random() * 2147483647), // Random seed for variation
    output_format: 'png',
  };

  try {
    const command = new InvokeModelCommand({
      modelId: CONTROL_STRUCTURE_MODEL,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    const response = await client.send(command);

    if (!response.body) {
      throw new Error('Empty response from Titan Image Generator');
    }

    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    if (!responseBody.images || responseBody.images.length === 0) {
      throw new Error('No images generated by Stability AI');
    }

    // Extract the generated image (base64 encoded) - it's in an array
    const renovatedImageData = responseBody.images[0];

    if (!renovatedImageData) {
      throw new Error('Invalid response format from Titan Image Generator');
    }

    return {
      renovatedImageData,
      imageFormat: 'png', // Titan returns PNG format
    };
  } catch (error) {
    // Import error handling utilities
    const { logError, classifyError } = await import('../reimagine-error-handler');
    
    // Log error to CloudWatch
    logError(error, 'virtual-renovation', {
      descriptionLength: validatedInput.params.description.length,
      style: validatedInput.params.style,
    });
    
    // Classify and throw with user-friendly message
    const classifiedError = classifyError(error, 'virtual-renovation');
    throw new Error(classifiedError.userMessage);
  }
}
