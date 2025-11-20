/**
 * @fileOverview Bedrock flow for image enhancement.
 * 
 * This flow uses Amazon Titan Image Generator to improve image quality
 * through automatic or manual adjustments to brightness, contrast, and
 * saturation while maintaining natural appearance.
 * 
 * Requirements: 4.2, 4.3, 10.3
 */

import { z } from 'zod';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { getConfig, getAWSCredentials } from '@/aws/config';
import { EnhanceParamsSchema, type EnhanceParams } from '@/ai/schemas/reimagine-schemas';

// ============================================================================
// Constants
// ============================================================================

/**
 * Stability AI Conservative Upscale model ID via inference profile
 * This model is optimized for image quality improvements while preserving details
 */
const UPSCALE_MODEL = 'us.stability.stable-conservative-upscale-v1:0';

/**
 * Enhancement presets for auto-adjust mode
 * These provide balanced improvements for common real estate photo issues
 */
const AUTO_ENHANCE_PROMPT = `Enhance this real estate photo to professional quality. 
Improve brightness, contrast, color balance, and sharpness while maintaining natural appearance. 
Correct exposure issues, enhance shadow details, and optimize colors for real estate marketing. 
Do not over-process or create artificial-looking results. 
Preserve the original composition and architectural features.`;

// ============================================================================
// Input/Output Schemas
// ============================================================================

export const EnhanceInputSchema = z.object({
  imageData: z.string(), // Base64 encoded source image
  imageFormat: z.enum(['jpeg', 'png', 'webp']),
  params: EnhanceParamsSchema,
});

export type EnhanceInput = z.infer<typeof EnhanceInputSchema>;

export const EnhanceOutputSchema = z.object({
  enhancedImageData: z.string(), // Base64 encoded result image
  imageFormat: z.string(),
});

export type EnhanceOutput = z.infer<typeof EnhanceOutputSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Builds enhancement prompt based on manual adjustment parameters
 * 
 * @param params - Enhancement parameters
 * @returns Prompt string for Titan
 */
function buildManualEnhancementPrompt(params: EnhanceParams): string {
  const adjustments: string[] = [];

  if (params.brightness !== undefined && params.brightness !== 0) {
    if (params.brightness > 0) {
      adjustments.push(`increase brightness by ${Math.abs(params.brightness)}%`);
    } else {
      adjustments.push(`decrease brightness by ${Math.abs(params.brightness)}%`);
    }
  }

  if (params.contrast !== undefined && params.contrast !== 0) {
    if (params.contrast > 0) {
      adjustments.push(`increase contrast by ${Math.abs(params.contrast)}%`);
    } else {
      adjustments.push(`decrease contrast by ${Math.abs(params.contrast)}%`);
    }
  }

  if (params.saturation !== undefined && params.saturation !== 0) {
    if (params.saturation > 0) {
      adjustments.push(`increase color saturation by ${Math.abs(params.saturation)}%`);
    } else {
      adjustments.push(`decrease color saturation by ${Math.abs(params.saturation)}%`);
    }
  }

  if (adjustments.length === 0) {
    // No manual adjustments specified, use auto-enhance
    return AUTO_ENHANCE_PROMPT;
  }

  return `Enhance this real estate photo with the following adjustments: ${adjustments.join(', ')}. 
Maintain natural appearance and preserve the original composition. 
Ensure the result looks professional for real estate marketing.`;
}

/**
 * Calculates similarity strength based on enhancement parameters
 * Higher values preserve more of the original image
 * 
 * @param params - Enhancement parameters
 * @returns Similarity strength (0.0 to 1.0)
 */
function calculateSimilarityStrength(params: EnhanceParams): number {
  if (params.autoAdjust) {
    // Auto-adjust can make more significant changes
    return 0.6;
  }

  // Calculate based on magnitude of manual adjustments
  const maxAdjustment = Math.max(
    Math.abs(params.brightness ?? 0),
    Math.abs(params.contrast ?? 0),
    Math.abs(params.saturation ?? 0)
  );

  // Map 0-100 adjustment range to 0.7-0.4 similarity range
  // Smaller adjustments = higher similarity (preserve more)
  // Larger adjustments = lower similarity (allow more change)
  const similarityRange = 0.3; // 0.7 to 0.4
  const minSimilarity = 0.4;
  const maxSimilarity = 0.7;
  
  const normalizedAdjustment = maxAdjustment / 100;
  return maxSimilarity - (normalizedAdjustment * similarityRange);
}

// ============================================================================
// Image Enhancement Flow Implementation
// ============================================================================

/**
 * Enhances image quality through AI-powered improvements
 * 
 * This function uses Amazon Titan Image Generator to:
 * 1. Analyze the image for quality issues (if auto-adjust)
 * 2. Apply brightness, contrast, and saturation adjustments
 * 3. Improve overall image quality and sharpness
 * 4. Maintain natural appearance without over-processing
 * 5. Preserve original resolution and composition
 * 
 * @param input - Source image and enhancement parameters
 * @returns Enhanced image with improved quality
 */
export async function enhanceImage(
  input: EnhanceInput
): Promise<EnhanceOutput> {
  // Validate input
  const validatedInput = EnhanceInputSchema.parse(input);

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

  // Build enhancement prompt
  const prompt = validatedInput.params.autoAdjust
    ? AUTO_ENHANCE_PROMPT
    : buildManualEnhancementPrompt(validatedInput.params);

  // Calculate similarity strength based on parameters
  const similarityStrength = calculateSimilarityStrength(validatedInput.params);

  // Negative prompt to avoid unwanted changes
  const negativePrompt = `distorted, blurry, artifacts, unrealistic, over-processed, artificial, changed composition, altered architecture`;

  // Construct Stability AI Upscale request
  const requestBody = {
    image: validatedInput.imageData, // Base64 encoded source image
    prompt: prompt,
    negative_prompt: negativePrompt,
    seed: Math.floor(Math.random() * 2147483647), // Random seed for variation
    output_format: 'png',
  };

  try {
    const command = new InvokeModelCommand({
      modelId: UPSCALE_MODEL,
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
      throw new Error('No images generated by Titan Image Generator');
    }

    // Extract the generated image (base64 encoded)
    const enhancedImageData = responseBody.images[0];

    if (!enhancedImageData) {
      throw new Error('Invalid response format from Titan Image Generator');
    }

    return {
      enhancedImageData,
      imageFormat: 'png', // Titan returns PNG format
    };
  } catch (error) {
    // Import error handling utilities
    const { logError, classifyError } = await import('../reimagine-error-handler');
    
    // Log error to CloudWatch
    logError(error, 'image-enhancement', {
      autoAdjust: validatedInput.params.autoAdjust,
      brightness: validatedInput.params.brightness,
      contrast: validatedInput.params.contrast,
      saturation: validatedInput.params.saturation,
    });
    
    // Classify and throw with user-friendly message
    const classifiedError = classifyError(error, 'image-enhancement');
    throw new Error(classifiedError.userMessage);
  }
}
