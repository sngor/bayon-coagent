/**
 * @fileOverview Gemini flow for image analysis and edit suggestions.
 * 
 * This flow uses Google's Gemini 2.5 Flash model's vision capabilities to analyze 
 * property images and generate contextual edit suggestions for the Reimagine toolkit.
 * 
 * Requirements: 1.3, 1.4, 13.10
 */

import { z } from 'zod';
import { getGeminiImageModel, prepareImageForGemini, getImageMimeType } from '../client';
import { EditSuggestionSchema, type EditSuggestion } from '@/ai/schemas/reimagine-schemas';

// ============================================================================
// Input/Output Schemas
// ============================================================================

export const AnalyzeImageInputSchema = z.object({
    imageData: z.string(), // Base64 encoded image
    imageFormat: z.enum(['jpeg', 'png', 'webp']),
});

export type AnalyzeImageInput = z.infer<typeof AnalyzeImageInputSchema>;

export const AnalyzeImageOutputSchema = z.object({
    suggestions: z.array(EditSuggestionSchema),
    analysis: z.string().optional(), // Detailed analysis text
});

export type AnalyzeImageOutput = z.infer<typeof AnalyzeImageOutputSchema>;

// ============================================================================
// Analysis Prompts
// ============================================================================

const ANALYSIS_PROMPT = `As an expert real estate photographer, interior designer, and marketing specialist, analyze this property image with Gemini 2.5 Flash's advanced vision capabilities.

COMPREHENSIVE IMAGE ANALYSIS:

**TECHNICAL ASSESSMENT:**
- Image quality: exposure, color balance, sharpness, composition
- Lighting conditions: natural vs artificial, direction, quality, shadows
- Camera angle and perspective: optimal for real estate marketing?
- Architectural features: room type, style, condition, unique elements

**MARKETING POTENTIAL EVALUATION:**
- Current appeal level for target buyers
- Emotional impact and first impression
- Competitive advantage opportunities
- Areas that detract from property value presentation

**AI ENHANCEMENT OPPORTUNITIES:**
Evaluate each edit type for maximum marketing impact:

1. **Virtual Staging** - Analyze empty spaces for furniture potential
   - Room identification and optimal furniture layouts
   - Style recommendations based on architecture and target market
   - Specific furniture pieces that would enhance buyer visualization

2. **Day-to-Dusk Transformation** - Assess exterior lighting potential
   - Current time of day and lighting conditions
   - Twilight photography opportunities for curb appeal
   - Interior lighting visibility and landscape lighting potential

3. **Image Enhancement** - Identify technical improvements needed
   - Exposure and color correction opportunities
   - Sharpness and clarity improvements
   - Professional photography standard upgrades

4. **Virtual Renovation** - Spot renovation visualization opportunities
   - Outdated elements that could be modernized
   - High-impact updates that increase perceived value
   - Style improvements that appeal to current market trends

5. **Item Removal** - Detect distracting or unwanted elements
   - Clutter, personal items, or staging mistakes
   - Temporary objects that detract from the space
   - Elements that date the property or reduce appeal

**PRIORITIZATION CRITERIA:**
- Marketing impact: How much will this edit improve buyer interest?
- Technical feasibility: How well will AI handle this specific edit?
- ROI potential: Cost vs. benefit for marketing investment
- Target market appeal: Alignment with likely buyer preferences

**RESPONSE FORMAT:**
Provide detailed JSON analysis with specific, actionable recommendations:

{
  "suggestions": [
    {
      "editType": "virtual-staging",
      "priority": "high",
      "reason": "Detailed explanation of why this edit will significantly improve marketing appeal",
      "confidence": 0.9,
      "suggestedParams": {
        "roomType": "living-room",
        "style": "modern"
      }
    }
  ],
  "analysis": "Comprehensive analysis covering technical quality, marketing potential, and specific improvement opportunities..."
}

Focus on suggestions that will genuinely transform this property's marketing effectiveness and buyer appeal.`;

// ============================================================================
// Image Analysis Implementation
// ============================================================================

/**
 * Analyzes a property image using Gemini and generates edit suggestions
 * 
 * This function uses Gemini 2.5 Flash's vision capabilities to:
 * 1. Analyze the image content and context
 * 2. Identify opportunities for improvement
 * 3. Generate specific, actionable edit suggestions
 * 4. Prioritize suggestions based on potential impact
 * 
 * @param input - Image data and format
 * @returns Analysis results with edit suggestions
 */
export async function analyzeImage(
    input: AnalyzeImageInput
): Promise<AnalyzeImageOutput> {
    console.log('[Gemini Image Analysis] Function called');

    // Validate input
    try {
        const validatedInput = AnalyzeImageInputSchema.parse(input);
        console.log('[Gemini Image Analysis] Input validated successfully');
    } catch (error) {
        console.error('[Gemini Image Analysis] Input validation failed:', error);
        throw error;
    }

    const validatedInput = AnalyzeImageInputSchema.parse(input);

    // Get Gemini model
    const model = getGeminiImageModel();

    // Prepare image for Gemini
    const mimeType = getImageMimeType(validatedInput.imageFormat);
    const imageInput = prepareImageForGemini(validatedInput.imageData, mimeType);

    console.log('[Gemini Image Analysis] Image format:', validatedInput.imageFormat);
    console.log('[Gemini Image Analysis] Starting analysis...');

    try {
        // Generate analysis with Gemini
        const result = await model.generateContent([
            ANALYSIS_PROMPT,
            imageInput
        ]);

        const response = await result.response;
        const analysisText = response.text();

        console.log('[Gemini Image Analysis] Raw response received');

        // Parse the JSON response
        let parsedResponse;
        try {
            // Extract JSON from the response (Gemini sometimes wraps it in markdown)
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            const jsonText = jsonMatch ? jsonMatch[0] : analysisText;
            parsedResponse = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('[Gemini Image Analysis] JSON parsing failed:', parseError);
            console.log('[Gemini Image Analysis] Raw response:', analysisText);

            // Fallback: provide default suggestions
            return {
                suggestions: [
                    {
                        editType: 'enhance',
                        priority: 'medium',
                        reason: 'Image analysis unavailable. Enhancement can improve overall image quality and appeal.',
                        confidence: 0.5,
                        suggestedParams: {
                            autoAdjust: true,
                        },
                    },
                ],
                analysis: 'Automatic analysis failed. Manual review recommended.',
            };
        }

        // Validate and clean suggestions
        const suggestions: EditSuggestion[] = [];

        if (parsedResponse.suggestions && Array.isArray(parsedResponse.suggestions)) {
            for (const suggestion of parsedResponse.suggestions) {
                try {
                    // Validate each suggestion against the schema
                    const validatedSuggestion = EditSuggestionSchema.parse(suggestion);
                    suggestions.push(validatedSuggestion);
                } catch (validationError) {
                    console.warn('[Gemini Image Analysis] Invalid suggestion skipped:', suggestion);
                }
            }
        }

        // Ensure we have at least one suggestion
        if (suggestions.length === 0) {
            suggestions.push({
                editType: 'enhance',
                priority: 'medium',
                reason: 'No specific suggestions generated. Enhancement can improve overall image quality.',
                confidence: 0.6,
                suggestedParams: {
                    autoAdjust: true,
                },
            });
        }

        console.log('[Gemini Image Analysis] Generated', suggestions.length, 'suggestions');

        return {
            suggestions,
            analysis: parsedResponse.analysis || 'Analysis completed successfully.',
        };

    } catch (error) {
        // Log detailed error for debugging
        console.error('[Gemini Image Analysis] Error details:', error);
        console.error('[Gemini Image Analysis] Error message:', error instanceof Error ? error.message : String(error));

        // Import error handling utilities
        const { logError, classifyError } = await import('../../bedrock/reimagine-error-handler');

        // Log error to CloudWatch
        logError(error, 'gemini-image-analysis', {
            imageFormat: validatedInput.imageFormat,
        });

        // Provide fallback suggestions instead of failing completely
        console.log('[Gemini Image Analysis] Providing fallback suggestions due to error');

        return {
            suggestions: [
                {
                    editType: 'enhance',
                    priority: 'medium',
                    reason: 'Analysis service temporarily unavailable. Enhancement can improve image quality and lighting.',
                    confidence: 0.5,
                    suggestedParams: {
                        autoAdjust: true,
                    },
                },
                {
                    editType: 'virtual-staging',
                    priority: 'low',
                    reason: 'Consider virtual staging if this is an empty room to help buyers visualize the space.',
                    confidence: 0.4,
                    suggestedParams: {
                        roomType: 'living-room',
                        style: 'modern',
                    },
                },
            ],
            analysis: 'Automatic analysis failed. Manual review and custom edit selection recommended.',
        };
    }
}

/**
 * Quick analysis for determining if an image needs specific edits
 * Returns a simplified boolean result for common edit types
 */
export async function quickAnalyze(
    input: AnalyzeImageInput
): Promise<{
    needsStaging: boolean;
    needsDayToDusk: boolean;
    needsEnhancement: boolean;
    needsRenovation: boolean;
    confidence: number;
}> {
    try {
        const result = await analyzeImage(input);

        const needsStaging = result.suggestions.some(s => s.editType === 'virtual-staging' && s.priority !== 'low');
        const needsDayToDusk = result.suggestions.some(s => s.editType === 'day-to-dusk' && s.priority !== 'low');
        const needsEnhancement = result.suggestions.some(s => s.editType === 'enhance' && s.priority !== 'low');
        const needsRenovation = result.suggestions.some(s => s.editType === 'virtual-renovation' && s.priority !== 'low');

        // Calculate overall confidence as average of high-priority suggestions
        const highPrioritySuggestions = result.suggestions.filter(s => s.priority === 'high');
        const confidence = highPrioritySuggestions.length > 0
            ? highPrioritySuggestions.reduce((sum, s) => sum + s.confidence, 0) / highPrioritySuggestions.length
            : 0.5;

        return {
            needsStaging,
            needsDayToDusk,
            needsEnhancement,
            needsRenovation,
            confidence,
        };
    } catch (error) {
        console.error('[Gemini Quick Analysis] Error:', error);

        // Return conservative defaults
        return {
            needsStaging: false,
            needsDayToDusk: false,
            needsEnhancement: true, // Enhancement is usually safe to suggest
            needsRenovation: false,
            confidence: 0.3,
        };
    }
}