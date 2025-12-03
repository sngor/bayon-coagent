/**
 * Property Photo Analysis Flow
 * 
 * This flow analyzes property photos captured on mobile devices and extracts
 * key details for quick content generation. Optimized for speed and accuracy
 * during property showings and open houses.
 * 
 * Features:
 * - Property type identification
 * - Key feature extraction
 * - Condition assessment
 * - Marketing highlights generation
 * - Improvement suggestions
 * 
 * Requirements validated:
 * - 1.2: Extracts property details using AI vision analysis
 */

import { getBedrockClient } from '../client';
import { MODEL_CONFIGS } from '../flow-base';
import {
    PropertyPhotoAnalysisInputSchema,
    PropertyPhotoAnalysisOutputSchema,
    type PropertyPhotoAnalysisInput,
    type PropertyPhotoAnalysisOutput,
} from '@/ai/schemas/property-photo-analysis-schemas';

/**
 * Constructs the system prompt for property photo analysis
 */
function constructSystemPrompt(): string {
    return `You are a real estate property analysis expert specializing in quick property assessments from photos.

Your role is to analyze property photos and extract key details that help real estate agents create marketing content and property listings.

ANALYSIS GUIDELINES:

1. Property Type Identification:
   - Identify the property type (single-family, condo, townhouse, multi-family, commercial, land, other)
   - If it's an interior photo, identify the room type (kitchen, living-room, bedroom, bathroom, etc.)

2. Feature Extraction:
   - Identify key features that would appeal to buyers
   - Focus on materials, finishes, and notable characteristics
   - Examples: hardwood floors, granite countertops, stainless steel appliances, vaulted ceilings, crown molding

3. Condition Assessment:
   - Assess overall condition: excellent, good, fair, or needs-work
   - Base assessment on visible maintenance, cleanliness, and updates

4. Marketing Highlights:
   - Generate 2-5 compelling marketing highlights
   - Focus on features that increase property value
   - Use language that appeals to buyers
   - Be specific and descriptive

5. Improvement Suggestions:
   - Provide up to 3 practical improvement suggestions
   - Focus on staging, minor updates, or presentation improvements
   - Consider cost-effectiveness and impact

6. Brief Description:
   - Create a 1-2 sentence description suitable for listing content
   - Use engaging, professional language
   - Highlight the most appealing features

IMPORTANT: Respond with ONLY valid JSON matching the required schema. Do not include any markdown formatting, code blocks, or explanatory text.`;
}

/**
 * Constructs the user prompt for property photo analysis
 */
function constructUserPrompt(input: PropertyPhotoAnalysisInput): string {
    let prompt = 'Please analyze this property photo and provide a comprehensive assessment.';

    if (input.location?.address) {
        prompt += `\n\nLocation: ${input.location.address}`;
    }

    if (input.propertyContext) {
        prompt += `\n\nAdditional Context: ${input.propertyContext}`;
    }

    prompt += `\n\nProvide:
1. Property type and room type (if applicable)
2. Key features visible in the photo
3. Overall condition assessment
4. Marketing highlights (2-5 items)
5. Improvement suggestions (up to 3)
6. Price range indicator if determinable
7. Brief description for listing content`;

    return prompt;
}

/**
 * Analyzes a property photo and extracts key details
 * 
 * @param input - Property photo analysis input with image data
 * @param userId - Optional user ID for execution logging
 * @returns Property photo analysis output with extracted details
 */
export async function analyzePropertyPhoto(
    input: PropertyPhotoAnalysisInput,
    userId?: string
): Promise<PropertyPhotoAnalysisOutput> {
    // Validate input
    const validatedInput = PropertyPhotoAnalysisInputSchema.parse(input);

    // Get Bedrock client with analytical model configuration
    const client = getBedrockClient(MODEL_CONFIGS.ANALYTICAL.modelId);

    // Construct prompts
    const systemPrompt = constructSystemPrompt();
    const userPrompt = constructUserPrompt(validatedInput);

    // Prepare image content
    const imageContent = {
        data: validatedInput.imageData,
        format: validatedInput.imageFormat,
    };

    // Invoke Bedrock with vision capabilities
    const response = await client.invokeWithVision<PropertyPhotoAnalysisOutput>(
        systemPrompt,
        userPrompt,
        imageContent,
        PropertyPhotoAnalysisOutputSchema,
        {
            temperature: MODEL_CONFIGS.ANALYTICAL.temperature,
            maxTokens: MODEL_CONFIGS.ANALYTICAL.maxTokens,
            topP: 1,
            flowName: 'analyze-property-photo',
            executionMetadata: {
                userId,
                featureCategory: 'mobile-capture',
                temperature: MODEL_CONFIGS.ANALYTICAL.temperature,
                maxTokens: MODEL_CONFIGS.ANALYTICAL.maxTokens,
                topP: 1,
            },
        }
    );

    return response;
}

/**
 * Analyzes a property photo with retry logic for failed analyses
 * 
 * @param input - Property photo analysis input
 * @param userId - Optional user ID for execution logging
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @returns Property photo analysis output
 */
export async function analyzePropertyPhotoWithRetry(
    input: PropertyPhotoAnalysisInput,
    userId?: string,
    maxRetries: number = 2
): Promise<PropertyPhotoAnalysisOutput> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await analyzePropertyPhoto(input, userId);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Log retry attempt
            if (attempt < maxRetries) {
                console.warn(`Property photo analysis attempt ${attempt + 1} failed, retrying...`, {
                    error: lastError.message,
                    userId,
                });

                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }

    // All retries failed
    throw new Error(
        `Property photo analysis failed after ${maxRetries + 1} attempts: ${lastError?.message}`
    );
}
