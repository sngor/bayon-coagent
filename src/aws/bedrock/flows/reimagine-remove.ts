/**
 * @fileOverview Bedrock flow for item removal (inpainting).
 * 
 * This flow uses Stability AI SDXL Inpainting model to remove unwanted
 * objects from property photos and fill the areas naturally with
 * context-aware background reconstruction.
 * 
 * Requirements: 5.2, 5.3, 5.4, 10.4
 */

import { z } from 'zod';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { getConfig, getAWSCredentials } from '@/aws/config';
import { ItemRemovalParamsSchema, type ItemRemovalParams } from '@/ai/schemas/reimagine-schemas';

// ============================================================================
// Constants
// ============================================================================

/**
 * Stability AI Erase Object model ID via inference profile
 * This model is specialized for removing objects and filling areas naturally
 */
const ERASE_OBJECT_MODEL = 'us.stability.stable-image-erase-object-v1:0';

/**
 * Inpainting configuration for optimal results
 */
const INPAINTING_CONFIG = {
  cfgScale: 8.0, // How closely to follow the prompt
  steps: 50, // Number of diffusion steps (higher = better quality)
  seed: 0, // Random seed (0 = random)
  stylePreset: 'photographic', // Maintain photographic realism
};

// ============================================================================
// Input/Output Schemas
// ============================================================================

export const ItemRemovalInputSchema = z.object({
  imageData: z.string(), // Base64 encoded source image
  imageFormat: z.enum(['jpeg', 'png', 'webp']),
  params: ItemRemovalParamsSchema,
});

export type ItemRemovalInput = z.infer<typeof ItemRemovalInputSchema>;

export const ItemRemovalOutputSchema = z.object({
  cleanedImageData: z.string(), // Base64 encoded result image
  imageFormat: z.string(),
});

export type ItemRemovalOutput = z.infer<typeof ItemRemovalOutputSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Builds inpainting prompt based on objects to remove
 * 
 * The prompt guides the model on what to remove and how to fill the area
 * 
 * @param objects - Array of object descriptions to remove
 * @returns Prompt string for SDXL inpainting
 */
function buildInpaintingPrompt(objects: string[]): string {
  if (objects.length === 0) {
    return 'Remove the marked area and fill naturally with appropriate background matching the surrounding environment. Maintain photographic realism and seamless blending.';
  }

  const objectList = objects.join(', ');
  
  return `Remove ${objectList} from the image and fill the area naturally with appropriate background that matches the surrounding environment. 
Ensure seamless blending with realistic textures and patterns. 
Maintain the architectural features and lighting of the scene. 
The result should look like a professional real estate photo with no trace of the removed objects.`;
}

/**
 * Builds negative prompt to avoid unwanted artifacts
 * 
 * @returns Negative prompt string
 */
function buildNegativePrompt(): string {
  return 'blurry, distorted, artifacts, unrealistic, visible seams, obvious editing, inconsistent lighting, mismatched textures, low quality';
}

// ============================================================================
// Item Removal Flow Implementation
// ============================================================================

/**
 * Removes unwanted objects from images using AI inpainting
 * 
 * This function uses Stability AI SDXL Inpainting to:
 * 1. Identify the masked areas containing objects to remove
 * 2. Remove the specified objects from the image
 * 3. Fill the removed areas with context-aware background
 * 4. Blend the filled areas seamlessly with surroundings
 * 5. Maintain realistic textures and lighting
 * 
 * Multiple objects can be removed in a single operation by providing
 * a mask that covers all objects and listing them in the objects array.
 * 
 * @param input - Source image, mask data, and object descriptions
 * @returns Cleaned image with objects removed
 */
export async function removeItems(
  input: ItemRemovalInput
): Promise<ItemRemovalOutput> {
  // Validate input
  const validatedInput = ItemRemovalInputSchema.parse(input);

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

  // Build inpainting prompt
  const prompt = buildInpaintingPrompt(validatedInput.params.objects);
  const negativePrompt = buildNegativePrompt();

  // Construct Stability AI Erase Object request
  const requestBody = {
    image: validatedInput.imageData, // Base64 encoded source image
    mask: validatedInput.params.maskData, // Base64 encoded mask image
    prompt: prompt,
    negative_prompt: negativePrompt,
    seed: Math.floor(Math.random() * 2147483647),
    output_format: 'png',
  };

  try {
    const command = new InvokeModelCommand({
      modelId: ERASE_OBJECT_MODEL,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    const response = await client.send(command);

    if (!response.body) {
      throw new Error('Empty response from Stability AI SDXL');
    }

    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    if (!responseBody.images || responseBody.images.length === 0) {
      throw new Error('No images generated by Stability AI');
    }

    // Extract the generated image (base64 encoded) - it's in an array
    const cleanedImageData = responseBody.images[0];

    return {
      cleanedImageData,
      imageFormat: 'png', // Stability AI returns PNG format
    };
  } catch (error) {
    // Import error handling utilities
    const { logError, classifyError } = await import('../reimagine-error-handler');
    
    // Log error to CloudWatch
    logError(error, 'item-removal', {
      objectCount: validatedInput.params.objects.length,
      objects: validatedInput.params.objects,
    });
    
    // Classify and throw with user-friendly message
    const classifiedError = classifyError(error, 'item-removal');
    throw new Error(classifiedError.userMessage);
  }
}
