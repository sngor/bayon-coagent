/**
 * @fileOverview Bedrock flow for virtual staging of empty rooms.
 * 
 * This flow uses Amazon Titan Image Generator to add furniture and decor
 * to empty room images, helping potential buyers visualize the space.
 * 
 * Requirements: 2.2, 2.3, 10.1
 */

import { z } from 'zod';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { getConfig, getAWSCredentials } from '@/aws/config';
import { VirtualStagingParamsSchema, type VirtualStagingParams } from '@/ai/schemas/reimagine-schemas';

// ============================================================================
// Constants
// ============================================================================

/**
 * Stability AI Control Structure model ID via inference profile
 * This model is optimized for maintaining structure while adding furniture and decor
 */
const CONTROL_STRUCTURE_MODEL = 'us.stability.stable-image-control-structure-v1:0';

/**
 * Room type descriptions for better staging results
 */
const ROOM_TYPE_DESCRIPTIONS: Record<string, string> = {
  'living-room': 'a spacious living room with comfortable seating, coffee table, and entertainment area',
  'bedroom': 'a cozy bedroom with a bed, nightstands, and appropriate bedroom furniture',
  'kitchen': 'a modern kitchen with appliances, countertops, and dining area',
  'dining-room': 'an elegant dining room with dining table, chairs, and appropriate decor',
  'office': 'a professional home office with desk, chair, shelving, and work equipment',
  'bathroom': 'a clean bathroom with appropriate fixtures and decor',
};

/**
 * Style descriptions for furniture generation
 */
const STYLE_DESCRIPTIONS: Record<string, string> = {
  'modern': 'modern, clean lines, minimalist aesthetic, contemporary furniture',
  'traditional': 'traditional, classic furniture, warm tones, timeless design',
  'minimalist': 'minimalist, simple, uncluttered, neutral colors, essential furniture only',
  'luxury': 'luxury, high-end furniture, elegant details, premium materials',
  'rustic': 'rustic, natural materials, warm wood tones, cozy atmosphere',
  'contemporary': 'contemporary, current trends, stylish, comfortable and functional',
};

// ============================================================================
// Input/Output Schemas
// ============================================================================

export const VirtualStagingInputSchema = z.object({
  imageData: z.string(), // Base64 encoded source image
  imageFormat: z.enum(['jpeg', 'png', 'webp']),
  params: VirtualStagingParamsSchema,
});

export type VirtualStagingInput = z.infer<typeof VirtualStagingInputSchema>;

export const VirtualStagingOutputSchema = z.object({
  stagedImageData: z.string(), // Base64 encoded result image
  imageFormat: z.string(),
});

export type VirtualStagingOutput = z.infer<typeof VirtualStagingOutputSchema>;

// ============================================================================
// Virtual Staging Flow Implementation
// ============================================================================

/**
 * Generates a virtually staged image with furniture and decor
 * 
 * This function uses Amazon Titan Image Generator to:
 * 1. Analyze the empty room image
 * 2. Generate appropriate furniture based on room type and style
 * 3. Place furniture naturally within the space
 * 4. Maintain realistic lighting and perspective
 * 
 * @param input - Source image and staging parameters
 * @returns Staged image with furniture and decor
 */
export async function virtualStaging(
  input: VirtualStagingInput
): Promise<VirtualStagingOutput> {
  console.log('[Virtual Staging] Function called');
  
  // Validate input
  try {
    const validatedInput = VirtualStagingInputSchema.parse(input);
    console.log('[Virtual Staging] Input validated successfully');
  } catch (error) {
    console.error('[Virtual Staging] Input validation failed:', error);
    throw error;
  }
  
  const validatedInput = VirtualStagingInputSchema.parse(input);

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

  // Build staging prompt based on room type and style
  const roomDescription = ROOM_TYPE_DESCRIPTIONS[validatedInput.params.roomType] || 'a room';
  const styleDescription = STYLE_DESCRIPTIONS[validatedInput.params.style] || 'stylish';

  let prompt = `Add furniture and decor to this empty room to create ${roomDescription} with ${styleDescription} design. 
IMPORTANT: Do NOT change the room structure, walls, corners, angles, windows, doors, or any architectural features. 
Keep all straight lines, square angles, and room dimensions exactly as they are in the original image.
Only add furniture, decor, and accessories while preserving the exact room geometry and architecture.
The furniture should be appropriately sized for the space, placed naturally, and match the room's existing architecture and lighting. 
Ensure the staging looks realistic and professional for real estate marketing.`;

  // Add custom prompt if provided
  if (validatedInput.params.customPrompt) {
    prompt += `\n\nAdditional instructions: ${validatedInput.params.customPrompt}`;
  }

  // Construct Stability AI Control Structure request
  // This model uses the control-structure API format
  const requestBody = {
    image: validatedInput.imageData, // Base64 encoded source image
    prompt: prompt,
    control_strength: 0.85, // Higher value = better preservation of original structure and angles
    seed: Math.floor(Math.random() * 2147483647), // Random seed for variation
    output_format: 'png',
  };

  console.log('[Virtual Staging] Request body keys:', Object.keys(requestBody));
  console.log('[Virtual Staging] Model ID:', CONTROL_STRUCTURE_MODEL);
  console.log('[Virtual Staging] Prompt length:', prompt.length);

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
    const stagedImageData = responseBody.images[0];

    return {
      stagedImageData,
      imageFormat: 'png', // Stability AI returns PNG format
    };
  } catch (error) {
    // Log detailed error for debugging
    console.error('[Virtual Staging] Error details:', error);
    console.error('[Virtual Staging] Error message:', error instanceof Error ? error.message : String(error));
    
    // Import error handling utilities
    const { logError, classifyError } = await import('../reimagine-error-handler');
    
    // Log error to CloudWatch
    logError(error, 'virtual-staging', {
      roomType: validatedInput.params.roomType,
      style: validatedInput.params.style,
    });
    
    // Classify and throw with user-friendly message
    const classifiedError = classifyError(error, 'virtual-staging');
    throw new Error(classifiedError.userMessage);
  }
}
