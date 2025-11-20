/**
 * @fileOverview Bedrock flow for day-to-dusk lighting transformation.
 * 
 * This flow uses Stability AI SDXL to transform daytime exterior photos
 * to golden hour/dusk lighting, creating attractive evening ambiance for
 * real estate listings.
 * 
 * Requirements: 3.2, 3.3, 10.2
 */

import { z } from 'zod';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { getConfig, getAWSCredentials } from '@/aws/config';
import { DayToDuskParamsSchema, type DayToDuskParams } from '@/ai/schemas/reimagine-schemas';

// ============================================================================
// Constants
// ============================================================================

/**
 * Stability AI Control Structure model ID via inference profile
 * This model is optimized for lighting transformations and atmosphere changes
 * while maintaining the structural integrity of the image
 */
const CONTROL_STRUCTURE_MODEL = 'us.stability.stable-image-control-structure-v1:0';

/**
 * Intensity configurations for day-to-dusk transformation
 * Each intensity level has specific parameters for the transformation
 */
const INTENSITY_CONFIGS = {
  subtle: {
    description: 'subtle golden hour lighting with warm tones',
    cfgScale: 7.0,
    stylePreset: 'photographic',
    promptStrength: 0.35, // Lower strength preserves more of original
  },
  moderate: {
    description: 'moderate dusk lighting with enhanced warm glow and deeper sky colors',
    cfgScale: 8.0,
    stylePreset: 'photographic',
    promptStrength: 0.5, // Balanced transformation
  },
  dramatic: {
    description: 'dramatic dusk lighting with rich golden tones, deep blue sky, and enhanced interior lighting',
    cfgScale: 9.0,
    stylePreset: 'cinematic',
    promptStrength: 0.65, // Stronger transformation
  },
} as const;

// ============================================================================
// Input/Output Schemas
// ============================================================================

export const DayToDuskInputSchema = z.object({
  imageData: z.string(), // Base64 encoded source image
  imageFormat: z.enum(['jpeg', 'png', 'webp']),
  params: DayToDuskParamsSchema,
});

export type DayToDuskInput = z.infer<typeof DayToDuskInputSchema>;

export const DayToDuskOutputSchema = z.object({
  duskImageData: z.string(), // Base64 encoded result image
  imageFormat: z.string(),
});

export type DayToDuskOutput = z.infer<typeof DayToDuskOutputSchema>;

// ============================================================================
// Day-to-Dusk Flow Implementation
// ============================================================================

/**
 * Transforms a daytime exterior photo to golden hour/dusk lighting
 * 
 * This function uses Stability AI SDXL to:
 * 1. Analyze the daytime lighting in the image
 * 2. Transform the sky to warm evening colors (golden, orange, deep blue)
 * 3. Adjust overall lighting to golden hour warmth
 * 4. Enhance interior lighting visibility through windows
 * 5. Preserve the original image resolution and aspect ratio
 * 
 * @param input - Source image and intensity parameters
 * @returns Transformed image with dusk lighting
 */
export async function dayToDusk(
  input: DayToDuskInput
): Promise<DayToDuskOutput> {
  // Validate input
  const validatedInput = DayToDuskInputSchema.parse(input);

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

  // Get intensity configuration
  const intensityConfig = INTENSITY_CONFIGS[validatedInput.params.intensity];

  // Build transformation prompt (must be under 512 characters for Titan)
  const prompt = `Transform to ${intensityConfig.description}. Convert sky to warm golden hour colors with orange and pink tones. Add warm golden lighting. Enhance interior lights through windows. Maintain architecture and composition. Professional real estate photo.`;

  // Negative prompt to avoid unwanted changes
  const negativePrompt = `distorted, blurry, artifacts, unrealistic, changed architecture, altered structure`;

  // Construct Stability AI Control Structure request for image-to-image transformation
  const requestBody = {
    image: validatedInput.imageData, // Base64 encoded source image
    prompt: prompt,
    negative_prompt: negativePrompt,
    control_strength: intensityConfig.promptStrength, // How much to transform
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
    const duskImageData = responseBody.images[0];

    if (!duskImageData) {
      throw new Error('Invalid response format from Titan Image Generator');
    }

    return {
      duskImageData,
      imageFormat: 'png', // Titan returns PNG format
    };
  } catch (error) {
    // Import error handling utilities
    const { logError, classifyError } = await import('../reimagine-error-handler');
    
    // Log error to CloudWatch
    logError(error, 'day-to-dusk', {
      intensity: validatedInput.params.intensity,
    });
    
    // Classify and throw with user-friendly message
    const classifiedError = classifyError(error, 'day-to-dusk');
    throw new Error(classifiedError.userMessage);
  }
}
