/**
 * Cross-Modal Consistency Checker - Multi-Modal Processing Quality Assurance
 * 
 * This component validates consistency across different media types (text, images, video, audio)
 * to ensure that content generated for the same topic maintains consistent messaging, branding,
 * and core values across all formats.
 * 
 * Features:
 * - Message alignment verification across media types
 * - Branding consistency checks (tone, style, values)
 * - Core message preservation validation
 * - Cross-modal content comparison
 * - Inconsistency detection and reporting
 * 
 * Requirements validated:
 * - 5.5: Ensures consistency across multi-modal content for the same topic
 * 
 * Property validated:
 * - Property 25: Cross-modal consistency - For any content generated across multiple media types
 *   for the same topic, the core message and branding should be consistent
 */

import { getBedrockClient } from '../client';
import { z } from 'zod';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Content type for cross-modal comparison
 */
export type ContentType = 'text' | 'image' | 'video' | 'audio';

/**
 * Content item for consistency checking
 */
export interface ContentItem {
    /** Content type */
    type: ContentType;

    /** Content identifier */
    id: string;

    /** Content data (text, description, script, etc.) */
    content: string;

    /** Optional metadata */
    metadata?: {
        title?: string;
        description?: string;
        keywords?: string[];
        tone?: string;
        style?: string;
        platform?: string;
        duration?: number;
    };
}

/**
 * Consistency issue severity
 */
export type ConsistencySeverity = 'critical' | 'major' | 'minor' | 'info';

/**
 * Consistency issue type
 */
export type ConsistencyIssueType =
    | 'message-mismatch'
    | 'tone-inconsistency'
    | 'branding-violation'
    | 'value-contradiction'
    | 'factual-discrepancy'
    | 'style-mismatch'
    | 'keyword-divergence';

/**
 * Detected consistency issue
 */
export interface ConsistencyIssue {
    /** Issue type */
    type: ConsistencyIssueType;

    /** Severity level */
    severity: ConsistencySeverity;

    /** Issue description */
    description: string;

    /** Affected content items */
    affectedContent: string[];

    /** Specific examples of the inconsistency */
    examples: string[];

    /** Recommendation for resolution */
    recommendation: string;

    /** Location in content (if applicable) */
    location?: string;
}

/**
 * Message alignment analysis
 */
export interface MessageAlignment {
    /** Core message identified */
    coreMessage: string;

    /** Key points across all content */
    keyPoints: string[];

    /** Message consistency score (0-1) */
    consistencyScore: number;

    /** Divergent messages found */
    divergentMessages: string[];

    /** Alignment notes */
    notes: string[];
}

/**
 * Branding consistency analysis
 */
export interface BrandingConsistency {
    /** Tone consistency score (0-1) */
    toneConsistency: number;

    /** Style consistency score (0-1) */
    styleConsistency: number;

    /** Values alignment score (0-1) */
    valuesAlignment: number;

    /** Overall branding score (0-1) */
    overallScore: number;

    /** Branding elements found */
    brandingElements: {
        tones: string[];
        styles: string[];
        values: string[];
    };

    /** Inconsistencies detected */
    inconsistencies: string[];
}

/**
 * Complete consistency validation result
 */
export interface ConsistencyValidationResult {
    /** Overall consistency score (0-1) */
    overallScore: number;

    /** Validation passed */
    passed: boolean;

    /** Message alignment analysis */
    messageAlignment: MessageAlignment;

    /** Branding consistency analysis */
    brandingConsistency: BrandingConsistency;

    /** Detected issues */
    issues: ConsistencyIssue[];

    /** Summary of findings */
    summary: string;

    /** Recommendations for improvement */
    recommendations: string[];

    /** Content items analyzed */
    analyzedContent: {
        id: string;
        type: ContentType;
    }[];
}

/**
 * Consistency check input
 */
export interface ConsistencyCheckInput {
    /** Content items to check for consistency */
    contentItems: ContentItem[];

    /** Topic or theme being checked */
    topic: string;

    /** Agent profile for branding context */
    agentProfile?: AgentProfile;

    /** Brand guidelines (optional) */
    brandGuidelines?: {
        tone?: string[];
        style?: string[];
        values?: string[];
        keywords?: string[];
        avoidWords?: string[];
    };

    /** Minimum consistency threshold (0-1) */
    minimumThreshold?: number;
}

/**
 * CrossModalConsistencyChecker - Validates consistency across media types
 */
export class CrossModalConsistencyChecker {
    private bedrockClient = getBedrockClient();

    /**
     * Validates consistency across multiple content items
     * 
     * @param input - Consistency check input
     * @param userId - Optional user ID for tracking
     * @returns Consistency validation result
     */
    async validateConsistency(
        input: ConsistencyCheckInput,
        userId?: string
    ): Promise<ConsistencyValidationResult> {
        if (input.contentItems.length < 2) {
            throw new Error('At least 2 content items are required for consistency checking');
        }

        // Construct the system prompt
        const systemPrompt = this.constructSystemPrompt(input);

        // Construct the user prompt
        const userPrompt = this.constructUserPrompt(input);

        // Define the output schema
        const outputSchema = z.object({
            overallScore: z.number().min(0).max(1).describe('Overall consistency score'),
            passed: z.boolean().describe('Whether consistency check passed'),
            messageAlignment: z.object({
                coreMessage: z.string(),
                keyPoints: z.array(z.string()),
                consistencyScore: z.number().min(0).max(1),
                divergentMessages: z.array(z.string()),
                notes: z.array(z.string()),
            }),
            brandingConsistency: z.object({
                toneConsistency: z.number().min(0).max(1),
                styleConsistency: z.number().min(0).max(1),
                valuesAlignment: z.number().min(0).max(1),
                overallScore: z.number().min(0).max(1),
                brandingElements: z.object({
                    tones: z.array(z.string()),
                    styles: z.array(z.string()),
                    values: z.array(z.string()),
                }),
                inconsistencies: z.array(z.string()),
            }),
            issues: z.array(z.object({
                type: z.enum([
                    'message-mismatch',
                    'tone-inconsistency',
                    'branding-violation',
                    'value-contradiction',
                    'factual-discrepancy',
                    'style-mismatch',
                    'keyword-divergence',
                ]),
                severity: z.enum(['critical', 'major', 'minor', 'info']),
                description: z.string(),
                affectedContent: z.array(z.string()),
                examples: z.array(z.string()),
                recommendation: z.string(),
                location: z.string().optional(),
            })),
            summary: z.string().describe('Summary of consistency findings'),
            recommendations: z.array(z.string()).describe('Recommendations for improvement'),
            analyzedContent: z.array(z.object({
                id: z.string(),
                type: z.enum(['text', 'image', 'video', 'audio']),
            })),
        });

        // Invoke Bedrock
        const result = await this.bedrockClient.invokeWithPrompts<z.infer<typeof outputSchema>>(
            systemPrompt,
            userPrompt,
            outputSchema,
            userId
        );

        return result;
    }

    /**
     * Checks message alignment across content items
     * 
     * @param contentItems - Content items to check
     * @param topic - Topic being checked
     * @param userId - Optional user ID for tracking
     * @returns Message alignment analysis
     */
    async checkMessageAlignment(
        contentItems: ContentItem[],
        topic: string,
        userId?: string
    ): Promise<MessageAlignment> {
        const result = await this.validateConsistency(
            { contentItems, topic },
            userId
        );

        return result.messageAlignment;
    }

    /**
     * Checks branding consistency across content items
     * 
     * @param contentItems - Content items to check
     * @param topic - Topic being checked
     * @param agentProfile - Agent profile for branding context
     * @param userId - Optional user ID for tracking
     * @returns Branding consistency analysis
     */
    async checkBrandingConsistency(
        contentItems: ContentItem[],
        topic: string,
        agentProfile?: AgentProfile,
        userId?: string
    ): Promise<BrandingConsistency> {
        const result = await this.validateConsistency(
            { contentItems, topic, agentProfile },
            userId
        );

        return result.brandingConsistency;
    }

    /**
     * Validates that core message is preserved across all content
     * 
     * @param contentItems - Content items to check
     * @param expectedMessage - Expected core message
     * @param userId - Optional user ID for tracking
     * @returns Whether core message is preserved
     */
    async validateCoreMessage(
        contentItems: ContentItem[],
        expectedMessage: string,
        userId?: string
    ): Promise<boolean> {
        const systemPrompt = `You are an expert content analyst specializing in message consistency validation.

Your task is to verify that all provided content items preserve the following core message:

"${expectedMessage}"

Analyze each content item and determine if the core message is present and accurately represented.

Respond with a JSON object containing:
- preserved: boolean (true if core message is preserved in all content)
- analysis: string (explanation of your findings)
- divergences: array of strings (any divergences from the core message)`;

        const userPrompt = `Content Items to Analyze:

${contentItems.map((item, i) => `
${i + 1}. ${item.type.toUpperCase()} (${item.id}):
${item.content}
${item.metadata?.title ? `Title: ${item.metadata.title}` : ''}
${item.metadata?.description ? `Description: ${item.metadata.description}` : ''}
`).join('\n---\n')}

Does all content preserve the core message: "${expectedMessage}"?`;

        const outputSchema = z.object({
            preserved: z.boolean(),
            analysis: z.string(),
            divergences: z.array(z.string()),
        });

        const result = await this.bedrockClient.invokeWithPrompts<z.infer<typeof outputSchema>>(
            systemPrompt,
            userPrompt,
            outputSchema,
            userId
        );

        return result.preserved;
    }

    /**
     * Compares two content items for consistency
     * 
     * @param item1 - First content item
     * @param item2 - Second content item
     * @param topic - Topic being checked
     * @param userId - Optional user ID for tracking
     * @returns Consistency issues found
     */
    async compareContent(
        item1: ContentItem,
        item2: ContentItem,
        topic: string,
        userId?: string
    ): Promise<ConsistencyIssue[]> {
        const result = await this.validateConsistency(
            { contentItems: [item1, item2], topic },
            userId
        );

        return result.issues;
    }

    /**
     * Constructs the system prompt for consistency validation
     */
    private constructSystemPrompt(input: ConsistencyCheckInput): string {
        const agentName = input.agentProfile?.agentName || 'the agent';
        const agentTone = input.agentProfile?.preferredTone || 'professional';
        const agentValues = input.agentProfile?.corePrinciple || 'providing exceptional service';

        let prompt = `You are an expert content consistency analyst specializing in cross-modal content validation for real estate professionals.

Your task is to analyze multiple pieces of content across different media types (text, images, video, audio) and validate that they maintain consistent messaging, branding, and core values.

Context:
- Agent: ${agentName}
- Preferred Tone: ${agentTone}
- Core Values: ${agentValues}
- Topic: ${input.topic}
- Content Types: ${input.contentItems.map(item => item.type).join(', ')}

`;

        if (input.brandGuidelines) {
            prompt += `\nBrand Guidelines:`;
            if (input.brandGuidelines.tone) {
                prompt += `\n- Approved Tones: ${input.brandGuidelines.tone.join(', ')}`;
            }
            if (input.brandGuidelines.style) {
                prompt += `\n- Approved Styles: ${input.brandGuidelines.style.join(', ')}`;
            }
            if (input.brandGuidelines.values) {
                prompt += `\n- Core Values: ${input.brandGuidelines.values.join(', ')}`;
            }
            if (input.brandGuidelines.keywords) {
                prompt += `\n- Key Terms: ${input.brandGuidelines.keywords.join(', ')}`;
            }
            if (input.brandGuidelines.avoidWords) {
                prompt += `\n- Avoid: ${input.brandGuidelines.avoidWords.join(', ')}`;
            }
            prompt += `\n`;
        }

        prompt += `
Consistency Validation Requirements:

1. MESSAGE ALIGNMENT:
   - Identify the core message across all content
   - Verify that key points are consistent
   - Detect any contradictory or divergent messages
   - Ensure value proposition is maintained
   - Check that facts and claims are consistent

2. BRANDING CONSISTENCY:
   - Verify tone consistency (professional, friendly, authoritative, etc.)
   - Check style consistency (formal, casual, technical, etc.)
   - Validate values alignment (core principles, beliefs)
   - Ensure brand voice is maintained
   - Check for brand guideline compliance

3. CROSS-MODAL ADAPTATION:
   - Recognize that different media require different approaches
   - Allow for format-appropriate variations
   - Focus on core message preservation, not exact wording
   - Consider platform-specific optimizations
   - Validate that adaptations enhance rather than dilute the message

4. ISSUE DETECTION:
   - Identify critical issues (contradictory messages, brand violations)
   - Flag major issues (significant tone shifts, value misalignment)
   - Note minor issues (slight style variations, keyword differences)
   - Provide info-level observations (optimization opportunities)

5. SCORING:
   - Overall consistency score (0-1): Holistic assessment
   - Message consistency score (0-1): Core message alignment
   - Tone consistency score (0-1): Tone uniformity
   - Style consistency score (0-1): Style coherence
   - Values alignment score (0-1): Core values preservation

Minimum Threshold: ${input.minimumThreshold || 0.8}
- Scores above threshold: PASS
- Scores below threshold: FAIL

Analysis Guidelines:
- Be thorough but fair in assessment
- Consider context and medium appropriateness
- Focus on substance over superficial differences
- Provide actionable recommendations
- Prioritize critical issues over minor variations
- Recognize that perfect consistency is not always possible or desirable

Real Estate Context:
- Professional standards and compliance
- Trust and credibility are paramount
- Consistent brand builds recognition
- Message clarity drives conversions
- Values alignment builds relationships

Respond with a comprehensive consistency validation report in the specified JSON format.`;

        return prompt;
    }

    /**
     * Constructs the user prompt for consistency validation
     */
    private constructUserPrompt(input: ConsistencyCheckInput): string {
        let prompt = `Please analyze the following content items for cross-modal consistency on the topic: "${input.topic}"

Content Items:
`;

        input.contentItems.forEach((item, index) => {
            prompt += `\n${index + 1}. ${item.type.toUpperCase()} Content (ID: ${item.id})`;

            if (item.metadata?.title) {
                prompt += `\n   Title: ${item.metadata.title}`;
            }

            if (item.metadata?.description) {
                prompt += `\n   Description: ${item.metadata.description}`;
            }

            if (item.metadata?.tone) {
                prompt += `\n   Tone: ${item.metadata.tone}`;
            }

            if (item.metadata?.platform) {
                prompt += `\n   Platform: ${item.metadata.platform}`;
            }

            prompt += `\n   Content:\n   ${item.content.split('\n').join('\n   ')}`;

            if (item.metadata?.keywords && item.metadata.keywords.length > 0) {
                prompt += `\n   Keywords: ${item.metadata.keywords.join(', ')}`;
            }

            prompt += `\n`;
        });

        prompt += `\nProvide a comprehensive consistency analysis including:
1. Overall consistency score and pass/fail determination
2. Message alignment analysis with core message identification
3. Branding consistency analysis across all content
4. Detailed list of any consistency issues found
5. Summary of findings
6. Actionable recommendations for improvement

Focus on ensuring that the core message and branding are consistent across all media types while allowing for appropriate format-specific adaptations.`;

        return prompt;
    }
}

/**
 * Singleton instance
 */
let consistencyCheckerInstance: CrossModalConsistencyChecker | null = null;

/**
 * Gets the singleton CrossModalConsistencyChecker instance
 */
export function getCrossModalConsistencyChecker(): CrossModalConsistencyChecker {
    if (!consistencyCheckerInstance) {
        consistencyCheckerInstance = new CrossModalConsistencyChecker();
    }
    return consistencyCheckerInstance;
}

/**
 * Resets the CrossModalConsistencyChecker singleton (useful for testing)
 */
export function resetCrossModalConsistencyChecker(): void {
    consistencyCheckerInstance = null;
}
