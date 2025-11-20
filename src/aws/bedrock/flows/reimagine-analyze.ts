/**
 * @fileOverview Bedrock flow for analyzing images and generating edit suggestions.
 * 
 * This flow uses Claude 3.5 Sonnet's vision capabilities to analyze uploaded
 * property images and generate contextual edit suggestions based on image content.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8
 */

import { z } from 'zod';
import { getBedrockClient } from '../client';
import { BEDROCK_MODELS } from '../flow-base';
import { EditSuggestionSchema, type EditSuggestion } from '@/ai/schemas/reimagine-schemas';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { getConfig, getAWSCredentials } from '@/aws/config';

// ============================================================================
// Input/Output Schemas
// ============================================================================

export const AnalyzeImageInputSchema = z.object({
  imageData: z.string(), // Base64 encoded image data
  imageFormat: z.enum(['jpeg', 'png', 'webp']),
});

export type AnalyzeImageInput = z.infer<typeof AnalyzeImageInputSchema>;

export const AnalyzeImageOutputSchema = z.object({
  suggestions: z.array(EditSuggestionSchema),
  analysis: z.string(), // Brief description of what was detected in the image
});

export type AnalyzeImageOutput = z.infer<typeof AnalyzeImageOutputSchema>;

// ============================================================================
// Analysis Flow Implementation
// ============================================================================

/**
 * Analyzes an image and generates contextual edit suggestions
 * 
 * This function uses Claude 3.5 Sonnet's vision model to:
 * 1. Identify the type of property image (interior/exterior, room type, etc.)
 * 2. Detect image characteristics (lighting, quality, objects, etc.)
 * 3. Generate prioritized edit suggestions based on the analysis
 * 
 * @param input - Image data and format
 * @returns Analysis results with edit suggestions
 */
export async function analyzeImage(
  input: AnalyzeImageInput
): Promise<AnalyzeImageOutput> {
  // Validate input
  const validatedInput = AnalyzeImageInputSchema.parse(input);

  // Create Bedrock client with Claude 3.5 Sonnet vision model
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

  // System prompt for image analysis
  const systemPrompt = `You are an expert real estate photography analyst. Your role is to analyze property images and suggest AI-powered edits that will make them more appealing to potential buyers.

You have access to the following edit types:
1. **virtual-staging**: Add furniture and decor to empty rooms
2. **day-to-dusk**: Convert daytime exterior photos to golden hour/dusk lighting
3. **enhance**: Improve brightness, contrast, color balance, and sharpness
4. **item-removal**: Remove unwanted objects from photos
5. **virtual-renovation**: Visualize potential property improvements

Your task is to:
1. Analyze the image carefully
2. Identify what type of property image it is (interior/exterior, room type, etc.)
3. Detect any issues or opportunities for improvement
4. Generate 1-5 edit suggestions that would most benefit this specific image
5. Prioritize suggestions based on impact (high/medium/low)
6. Provide clear reasons for each suggestion
7. Include suggested parameters when applicable
8. Assign confidence scores (0-1) based on how certain you are the edit would help

IMPORTANT: Only suggest edits that are truly relevant to the image. Don't suggest all edit types just because they exist.`;

  // User prompt with analysis instructions
  const userPrompt = `Please analyze this real estate property image and provide edit suggestions.

For each suggestion, provide:
- editType: The type of edit (virtual-staging, day-to-dusk, enhance, item-removal, or virtual-renovation)
- priority: high, medium, or low based on impact
- reason: A clear explanation of why this edit would benefit the image
- suggestedParams: Specific parameters for the edit (if applicable)
- confidence: A score from 0 to 1 indicating how confident you are this edit would help

Also provide a brief analysis describing what you see in the image.

Return your response as JSON with this structure:
{
  "suggestions": [
    {
      "editType": "virtual-staging",
      "priority": "high",
      "reason": "The room is empty and would benefit from furniture to help buyers visualize the space",
      "suggestedParams": {
        "roomType": "living-room",
        "style": "modern"
      },
      "confidence": 0.9
    }
  ],
  "analysis": "This is an empty living room with good natural lighting from large windows..."
}

Guidelines for suggestions:
- For empty rooms: Suggest virtual-staging with appropriate roomType (living-room, bedroom, kitchen, dining-room, office, bathroom) and style (modern, traditional, minimalist, luxury, rustic, contemporary)
- For daytime exteriors: Suggest day-to-dusk with intensity (subtle, moderate, dramatic)
- For images with quality issues: Suggest enhance with autoAdjust: true
- For images with distracting objects: Suggest item-removal and describe the objects
- For dated features: Suggest virtual-renovation with a description of improvements

Only suggest edits that would genuinely improve the image for real estate marketing.`;

  try {
    // Construct Converse API request with image
    const converseInput: ConverseCommandInput = {
      modelId: BEDROCK_MODELS.SONNET_3_5_V2,
      system: [{ text: systemPrompt }],
      messages: [
        {
          role: 'user',
          content: [
            {
              image: {
                format: validatedInput.imageFormat,
                source: {
                  bytes: Buffer.from(validatedInput.imageData, 'base64'),
                },
              },
            },
            {
              text: userPrompt,
            },
          ],
        },
      ],
      inferenceConfig: {
        temperature: 0.3, // Lower temperature for more consistent analysis
        maxTokens: 4096,
        topP: 1,
      },
    };

    const command = new ConverseCommand(converseInput);
    const response = await client.send(command);

    if (!response.output?.message?.content) {
      throw new Error('Empty response from Bedrock vision model');
    }

    // Extract text from response
    const textContent = response.output.message.content.find(
      (block) => 'text' in block
    );
    
    if (!textContent || !('text' in textContent)) {
      throw new Error('No text content in Bedrock response');
    }

    const textResponse = textContent.text || '';

    // Parse JSON response
    let parsedOutput: unknown;
    try {
      parsedOutput = JSON.parse(textResponse);
    } catch {
      // Try to extract JSON from markdown code blocks
      const codeBlockMatch = textResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        parsedOutput = JSON.parse(codeBlockMatch[1]);
      } else {
        // Try to find JSON object in the text
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedOutput = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse JSON from response');
        }
      }
    }

    // Validate against schema
    const validationResult = AnalyzeImageOutputSchema.safeParse(parsedOutput);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      console.error('Parsed output:', parsedOutput);
      throw new Error(
        `Response does not match expected schema: ${validationResult.error.message}`
      );
    }

    return validationResult.data;
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Return fallback suggestions if analysis fails
    // This ensures the upload can proceed even if analysis fails
    return {
      suggestions: [
        {
          editType: 'enhance',
          priority: 'medium',
          reason: 'Image analysis unavailable. Enhancement can improve overall image quality.',
          suggestedParams: {
            autoAdjust: true,
          },
          confidence: 0.5,
        },
      ],
      analysis: 'Image analysis temporarily unavailable. Basic enhancement suggested.',
    };
  }
}

