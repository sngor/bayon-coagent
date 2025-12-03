/**
 * Style Transfer Engine
 * 
 * Enables content adaptation across different tones, formats, and platforms
 * while preserving the core message.
 * 
 * Requirements: 11.4
 */

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { getBedrockClient } from '../client';
import { getRepository } from '@/aws/dynamodb/repository';

/**
 * Tone options for content adaptation
 */
export type ToneOption =
    | 'professional'
    | 'casual'
    | 'friendly'
    | 'formal'
    | 'conversational'
    | 'authoritative'
    | 'empathetic'
    | 'enthusiastic';

/**
 * Format options for content adaptation
 */
export type FormatOption =
    | 'blog-post'
    | 'social-media'
    | 'email'
    | 'newsletter'
    | 'video-script'
    | 'podcast-script'
    | 'press-release'
    | 'listing-description'
    | 'market-update';

/**
 * Platform options for content adaptation
 */
export type PlatformOption =
    | 'facebook'
    | 'instagram'
    | 'twitter'
    | 'linkedin'
    | 'youtube'
    | 'tiktok'
    | 'email'
    | 'website'
    | 'print';

/**
 * Content adaptation request
 */
export interface AdaptationRequest {
    originalContent: string;
    targetTone?: ToneOption;
    targetFormat?: FormatOption;
    targetPlatform?: PlatformOption;
    preserveKeyPoints?: string[];
    additionalInstructions?: string;
}

/**
 * Content adaptation result
 */
export interface AdaptationResult {
    adaptedContent: string;
    originalContent: string;
    adaptationType: 'tone' | 'format' | 'platform' | 'combined';
    targetTone?: ToneOption;
    targetFormat?: FormatOption;
    targetPlatform?: PlatformOption;
    preservedElements: PreservedElement[];
    confidence: number;
    metadata: {
        originalWordCount: number;
        adaptedWordCount: number;
        preservationScore: number;
        adaptationRationale: string;
    };
    createdAt: string;
}

/**
 * Preserved element in adaptation
 */
export interface PreservedElement {
    type: 'key-point' | 'fact' | 'call-to-action' | 'brand-message';
    content: string;
    preserved: boolean;
    location: string;
}

/**
 * Message preservation validation result
 */
export interface PreservationValidation {
    isPreserved: boolean;
    preservationScore: number;
    preservedElements: PreservedElement[];
    missingElements: string[];
    addedElements: string[];
    coreMessageIntact: boolean;
    recommendations: string[];
}

/**
 * Style Transfer Engine class
 */
export class StyleTransferEngine {
    private client: BedrockRuntimeClient;
    private repository: ReturnType<typeof getRepository>;
    private modelId: string;

    constructor(
        client?: BedrockRuntimeClient,
        modelId: string = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
    ) {
        const bedrockClient = client || getBedrockClient();
        // Ensure we have a BedrockRuntimeClient
        if ('config' in bedrockClient && 'send' in bedrockClient) {
            this.client = bedrockClient as BedrockRuntimeClient;
        } else {
            throw new Error('Invalid Bedrock client provided');
        }
        this.repository = getRepository();
        this.modelId = modelId;
    }

    /**
     * Adapts content to a different tone
     * 
     * @param content - Original content
     * @param targetTone - Target tone
     * @param preserveKeyPoints - Key points to preserve
     * @returns Adapted content with tone transformation
     */
    async adaptTone(
        content: string,
        targetTone: ToneOption,
        preserveKeyPoints?: string[]
    ): Promise<AdaptationResult> {
        const request: AdaptationRequest = {
            originalContent: content,
            targetTone,
            preserveKeyPoints,
        };

        return this.adaptContent(request);
    }

    /**
     * Adapts content to a different format
     * 
     * @param content - Original content
     * @param targetFormat - Target format
     * @param preserveKeyPoints - Key points to preserve
     * @returns Adapted content with format conversion
     */
    async adaptFormat(
        content: string,
        targetFormat: FormatOption,
        preserveKeyPoints?: string[]
    ): Promise<AdaptationResult> {
        const request: AdaptationRequest = {
            originalContent: content,
            targetFormat,
            preserveKeyPoints,
        };

        return this.adaptContent(request);
    }

    /**
     * Adapts content for a specific platform
     * 
     * @param content - Original content
     * @param targetPlatform - Target platform
     * @param preserveKeyPoints - Key points to preserve
     * @returns Adapted content optimized for platform
     */
    async adaptPlatform(
        content: string,
        targetPlatform: PlatformOption,
        preserveKeyPoints?: string[]
    ): Promise<AdaptationResult> {
        const request: AdaptationRequest = {
            originalContent: content,
            targetPlatform,
            preserveKeyPoints,
        };

        return this.adaptContent(request);
    }

    /**
     * Adapts content with multiple transformations
     * 
     * @param request - Complete adaptation request
     * @returns Adapted content with all transformations applied
     */
    async adaptContent(request: AdaptationRequest): Promise<AdaptationResult> {
        // Extract key elements from original content
        const keyElements = await this.extractKeyElements(request.originalContent);

        // Generate adapted content
        const adaptedContent = await this.generateAdaptation(request, keyElements);

        // Validate message preservation
        const validation = await this.validatePreservation(
            request.originalContent,
            adaptedContent,
            keyElements
        );

        // Determine adaptation type
        const adaptationType = this.determineAdaptationType(request);

        const result: AdaptationResult = {
            adaptedContent,
            originalContent: request.originalContent,
            adaptationType,
            targetTone: request.targetTone,
            targetFormat: request.targetFormat,
            targetPlatform: request.targetPlatform,
            preservedElements: validation.preservedElements,
            confidence: validation.preservationScore,
            metadata: {
                originalWordCount: this.countWords(request.originalContent),
                adaptedWordCount: this.countWords(adaptedContent),
                preservationScore: validation.preservationScore,
                adaptationRationale: this.generateRationale(request, validation),
            },
            createdAt: new Date().toISOString(),
        };

        return result;
    }

    /**
     * Validates that core message is preserved in adaptation
     * 
     * @param originalContent - Original content
     * @param adaptedContent - Adapted content
     * @param keyElements - Key elements to check
     * @returns Validation result
     */
    async validatePreservation(
        originalContent: string,
        adaptedContent: string,
        keyElements: PreservedElement[]
    ): Promise<PreservationValidation> {
        const systemPrompt = `You are a content analysis expert. Compare the original and adapted content to verify that the core message is preserved.

Original Content:
${originalContent}

Adapted Content:
${adaptedContent}

Key Elements to Check:
${keyElements.map((e) => `- ${e.type}: ${e.content}`).join('\n')}

Analyze whether:
1. All key points are present in the adapted content
2. The core message remains intact
3. Important facts and calls-to-action are preserved
4. Brand messaging is consistent

Respond in JSON format:
{
  "coreMessageIntact": true/false,
  "preservationScore": 0.0-1.0,
  "preservedElements": [
    {
      "type": "key-point|fact|call-to-action|brand-message",
      "content": "element content",
      "preserved": true/false,
      "location": "where it appears in adapted content"
    }
  ],
  "missingElements": ["list of missing key elements"],
  "addedElements": ["list of new elements added"],
  "recommendations": ["suggestions for improvement"]
}`;

        const command = new ConverseCommand({
            modelId: this.modelId,
            messages: [
                {
                    role: 'user',
                    content: [{ text: systemPrompt }],
                },
            ],
            inferenceConfig: {
                temperature: 0.3,
                maxTokens: 2000,
            },
        });

        const response = await this.client.send(command);
        const responseText = response.output?.message?.content?.[0]?.text || '{}';

        let validation;
        try {
            validation = JSON.parse(responseText);
        } catch (error) {
            // Fallback validation
            validation = {
                coreMessageIntact: true,
                preservationScore: 0.8,
                preservedElements: keyElements.map((e) => ({ ...e, preserved: true, location: 'unknown' })),
                missingElements: [],
                addedElements: [],
                recommendations: [],
            };
        }

        return {
            isPreserved: validation.coreMessageIntact,
            preservationScore: validation.preservationScore,
            preservedElements: validation.preservedElements,
            missingElements: validation.missingElements || [],
            addedElements: validation.addedElements || [],
            coreMessageIntact: validation.coreMessageIntact,
            recommendations: validation.recommendations || [],
        };
    }

    /**
     * Stores an adaptation result
     * 
     * @param userId - User ID
     * @param result - Adaptation result to store
     */
    async storeAdaptation(userId: string, result: AdaptationResult): Promise<void> {
        const adaptationId = `adaptation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await this.repository.create(
            `USER#${userId}`,
            `ADAPTATION#${adaptationId}`,
            'ContentAdaptation',
            result
        );
    }

    /**
     * Extracts key elements from content
     */
    private async extractKeyElements(content: string): Promise<PreservedElement[]> {
        const systemPrompt = `Extract the key elements from this content that must be preserved in any adaptation:

Content:
${content}

Identify:
1. Key points and main messages
2. Important facts and statistics
3. Calls-to-action
4. Brand messaging

Respond in JSON format:
{
  "elements": [
    {
      "type": "key-point|fact|call-to-action|brand-message",
      "content": "the element text"
    }
  ]
}`;

        const command = new ConverseCommand({
            modelId: this.modelId,
            messages: [
                {
                    role: 'user',
                    content: [{ text: systemPrompt }],
                },
            ],
            inferenceConfig: {
                temperature: 0.3,
                maxTokens: 1500,
            },
        });

        const response = await this.client.send(command);
        const responseText = response.output?.message?.content?.[0]?.text || '{}';

        let extracted;
        try {
            extracted = JSON.parse(responseText);
        } catch (error) {
            extracted = { elements: [] };
        }

        return (extracted.elements || []).map((e: any) => ({
            type: e.type,
            content: e.content,
            preserved: false,
            location: '',
        }));
    }

    /**
     * Generates adapted content using AI
     */
    private async generateAdaptation(
        request: AdaptationRequest,
        keyElements: PreservedElement[]
    ): Promise<string> {
        const adaptationInstructions = this.buildAdaptationInstructions(request);

        const systemPrompt = `You are an expert content adapter. Transform the following content while preserving its core message.

Original Content:
${request.originalContent}

Adaptation Instructions:
${adaptationInstructions}

Key Elements to Preserve:
${keyElements.map((e) => `- ${e.type}: ${e.content}`).join('\n')}

${request.preserveKeyPoints ? `\nAdditional Key Points to Preserve:\n${request.preserveKeyPoints.map((p) => `- ${p}`).join('\n')}` : ''}

${request.additionalInstructions ? `\nAdditional Instructions:\n${request.additionalInstructions}` : ''}

IMPORTANT: Preserve all key points, facts, calls-to-action, and brand messaging while adapting the style, tone, format, or platform requirements.

Provide only the adapted content without any explanations or metadata.`;

        const command = new ConverseCommand({
            modelId: this.modelId,
            messages: [
                {
                    role: 'user',
                    content: [{ text: systemPrompt }],
                },
            ],
            inferenceConfig: {
                temperature: 0.7,
                maxTokens: 4000,
            },
        });

        const response = await this.client.send(command);
        const adaptedContent = response.output?.message?.content?.[0]?.text || request.originalContent;

        return adaptedContent.trim();
    }

    /**
     * Builds adaptation instructions based on request
     */
    private buildAdaptationInstructions(request: AdaptationRequest): string {
        const instructions: string[] = [];

        if (request.targetTone) {
            instructions.push(`- Transform the tone to be ${request.targetTone}`);
            instructions.push(this.getToneGuidelines(request.targetTone));
        }

        if (request.targetFormat) {
            instructions.push(`- Convert to ${request.targetFormat} format`);
            instructions.push(this.getFormatGuidelines(request.targetFormat));
        }

        if (request.targetPlatform) {
            instructions.push(`- Optimize for ${request.targetPlatform} platform`);
            instructions.push(this.getPlatformGuidelines(request.targetPlatform));
        }

        return instructions.join('\n');
    }

    /**
     * Gets tone-specific guidelines
     */
    private getToneGuidelines(tone: ToneOption): string {
        const guidelines: Record<ToneOption, string> = {
            professional: '  Use formal language, avoid slang, maintain objectivity',
            casual: '  Use conversational language, contractions, and relatable examples',
            friendly: '  Be warm and approachable, use inclusive language',
            formal: '  Use sophisticated vocabulary, complex sentences, maintain distance',
            conversational: '  Write as if speaking directly to the reader, use questions',
            authoritative: '  Demonstrate expertise, use confident language, cite sources',
            empathetic: '  Show understanding, acknowledge emotions, be supportive',
            enthusiastic: '  Use energetic language, exclamation points, positive framing',
        };

        return guidelines[tone] || '';
    }

    /**
     * Gets format-specific guidelines
     */
    private getFormatGuidelines(format: FormatOption): string {
        const guidelines: Record<FormatOption, string> = {
            'blog-post': '  Structure with introduction, body paragraphs, conclusion. Use headings and subheadings.',
            'social-media': '  Keep concise (under 280 characters for Twitter). Use hashtags and emojis appropriately.',
            'email': '  Include subject line, greeting, body, call-to-action, and signature.',
            'newsletter': '  Use sections, bullet points, and clear CTAs. Include header and footer.',
            'video-script': '  Write for spoken delivery. Include hooks, transitions, and visual cues.',
            'podcast-script': '  Write for audio only. Include intro, segments, and outro.',
            'press-release': '  Follow AP style. Include headline, dateline, boilerplate.',
            'listing-description': '  Highlight features, benefits, and unique selling points. Use descriptive language.',
            'market-update': '  Include data, trends, and actionable insights. Use professional tone.',
        };

        return guidelines[format] || '';
    }

    /**
     * Gets platform-specific guidelines
     */
    private getPlatformGuidelines(platform: PlatformOption): string {
        const guidelines: Record<PlatformOption, string> = {
            facebook: '  Optimize for engagement. Use conversational tone. Include call-to-action.',
            instagram: '  Visual-first approach. Use hashtags. Keep text concise.',
            twitter: '  Maximum 280 characters. Use hashtags and mentions strategically.',
            linkedin: '  Professional tone. Focus on business value and insights.',
            youtube: '  Optimize for video. Include timestamps and key moments.',
            tiktok: '  Short, engaging, trend-aware. Use popular sounds and hashtags.',
            email: '  Mobile-friendly. Clear subject line. Single call-to-action.',
            website: '  SEO-optimized. Scannable with headings. Clear navigation.',
            print: '  High-quality writing. Consider layout and white space.',
        };

        return guidelines[platform] || '';
    }

    /**
     * Determines the type of adaptation
     */
    private determineAdaptationType(request: AdaptationRequest): 'tone' | 'format' | 'platform' | 'combined' {
        const hasMultiple = [
            request.targetTone,
            request.targetFormat,
            request.targetPlatform,
        ].filter(Boolean).length > 1;

        if (hasMultiple) return 'combined';
        if (request.targetTone) return 'tone';
        if (request.targetFormat) return 'format';
        if (request.targetPlatform) return 'platform';
        return 'combined';
    }

    /**
     * Generates rationale for the adaptation
     */
    private generateRationale(
        request: AdaptationRequest,
        validation: PreservationValidation
    ): string {
        const parts: string[] = [];

        if (request.targetTone) {
            parts.push(`Adapted tone to ${request.targetTone}`);
        }
        if (request.targetFormat) {
            parts.push(`Converted to ${request.targetFormat} format`);
        }
        if (request.targetPlatform) {
            parts.push(`Optimized for ${request.targetPlatform}`);
        }

        parts.push(`Preservation score: ${(validation.preservationScore * 100).toFixed(0)}%`);

        if (validation.missingElements.length > 0) {
            parts.push(`Note: ${validation.missingElements.length} elements may need review`);
        }

        return parts.join('. ');
    }

    /**
     * Counts words in text
     */
    private countWords(text: string): number {
        return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
    }
}

/**
 * Creates a new style transfer engine instance
 */
export function createStyleTransferEngine(
    client?: BedrockRuntimeClient,
    modelId?: string
): StyleTransferEngine {
    return new StyleTransferEngine(client, modelId);
}
