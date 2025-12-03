/**
 * Refinement Learning System
 * 
 * Tracks patterns from iterative refinement sessions and uses them to improve
 * the quality of future initial content generations.
 * 
 * Requirements: 11.5
 * Property 55: Refinement learning - patterns from refinement should improve future generations
 */

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { getBedrockClient } from '../client';
import { getRepository } from '@/aws/dynamodb/repository';
import {
    EditingSession,
    EditingSummary,
    EditingLearning,
    ContentVersion,
} from './types';

/**
 * Refinement pattern captured from editing sessions
 */
export interface RefinementPattern {
    patternId: string;
    userId: string;
    contentType: string;
    pattern: string;
    description: string;
    frequency: number;
    examples: RefinementExample[];
    qualityImpact: number; // 0-1 score indicating impact on quality
    confidence: number; // 0-1 score indicating confidence in pattern
    createdAt: string;
    lastSeenAt: string;
    shouldApplyToFuture: boolean;
}

/**
 * Example of a refinement pattern
 */
export interface RefinementExample {
    sessionId: string;
    originalText: string;
    refinedText: string;
    context: string;
    timestamp: string;
}

/**
 * Quality improvement metrics
 */
export interface QualityImprovement {
    metric: string;
    before: number;
    after: number;
    improvement: number;
    significance: 'low' | 'medium' | 'high';
}

/**
 * Refinement analysis result
 */
export interface RefinementAnalysis {
    sessionId: string;
    patterns: RefinementPattern[];
    qualityImprovements: QualityImprovement[];
    recommendations: string[];
    overallQualityGain: number;
}

/**
 * Learning application result
 */
export interface LearningApplicationResult {
    appliedPatterns: string[];
    skippedPatterns: string[];
    confidenceBoost: number;
    estimatedQualityImprovement: number;
}

/**
 * RefinementLearningSystem class
 */
export class RefinementLearningSystem {
    private client: BedrockRuntimeClient;
    private repository: ReturnType<typeof getRepository>;
    private modelId: string;

    constructor(
        client?: BedrockRuntimeClient,
        modelId: string = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
    ) {
        const bedrockClient = client || getBedrockClient();
        if ('config' in bedrockClient && 'send' in bedrockClient) {
            this.client = bedrockClient as BedrockRuntimeClient;
        } else {
            throw new Error('Invalid Bedrock client provided');
        }
        this.repository = getRepository();
        this.modelId = modelId;
    }

    /**
     * Tracks refinement patterns from a completed editing session
     * 
     * @param session - The completed editing session
     * @param summary - The session summary with learnings
     * @returns Identified refinement patterns
     */
    async trackRefinementPatterns(
        session: EditingSession,
        summary: EditingSummary
    ): Promise<RefinementPattern[]> {
        const patterns: RefinementPattern[] = [];

        // Analyze each learning from the summary
        for (const learning of summary.learnings) {
            if (!learning.shouldApplyToFuture) {
                continue;
            }

            // Check if pattern already exists
            const existingPattern = await this.findExistingPattern(
                session.userId,
                session.metadata.contentType,
                learning.pattern
            );

            if (existingPattern) {
                // Update existing pattern
                const updatedPattern = await this.updatePattern(
                    existingPattern,
                    session,
                    learning
                );
                patterns.push(updatedPattern);
            } else {
                // Create new pattern
                const newPattern = await this.createPattern(
                    session,
                    learning
                );
                patterns.push(newPattern);
            }
        }

        return patterns;
    }

    /**
     * Analyzes quality improvements from an editing session
     * 
     * @param session - The editing session to analyze
     * @returns Quality improvement analysis
     */
    async analyzeQualityImprovements(
        session: EditingSession
    ): Promise<RefinementAnalysis> {
        const firstVersion = session.versions[0];
        const lastVersion = session.versions[session.versions.length - 1];

        // Calculate quality metrics
        const qualityImprovements: QualityImprovement[] = [];

        // Word count improvement
        const wordCountBefore = firstVersion.metadata.wordCount;
        const wordCountAfter = lastVersion.metadata.wordCount;
        const wordCountChange = Math.abs(wordCountAfter - wordCountBefore) / wordCountBefore;

        if (wordCountChange > 0.1) {
            qualityImprovements.push({
                metric: 'word_count',
                before: wordCountBefore,
                after: wordCountAfter,
                improvement: wordCountChange,
                significance: wordCountChange > 0.3 ? 'high' : wordCountChange > 0.15 ? 'medium' : 'low',
            });
        }

        // Clarity improvement (based on AI analysis)
        const clarityImprovement = await this.analyzeClarityImprovement(
            firstVersion.content,
            lastVersion.content
        );

        if (clarityImprovement.improvement > 0.1) {
            qualityImprovements.push(clarityImprovement);
        }

        // Structure improvement
        const structureImprovement = await this.analyzeStructureImprovement(
            firstVersion.content,
            lastVersion.content
        );

        if (structureImprovement.improvement > 0.1) {
            qualityImprovements.push(structureImprovement);
        }

        // Get patterns for this session
        const patterns = await this.getPatternsForSession(session.userId, session.sessionId);

        // Generate recommendations
        const recommendations = await this.generateRecommendations(
            session,
            qualityImprovements,
            patterns
        );

        // Calculate overall quality gain
        const overallQualityGain = qualityImprovements.reduce(
            (sum, imp) => sum + imp.improvement,
            0
        ) / Math.max(qualityImprovements.length, 1);

        return {
            sessionId: session.sessionId,
            patterns,
            qualityImprovements,
            recommendations,
            overallQualityGain,
        };
    }

    /**
     * Applies learned patterns to improve future content generation
     * 
     * @param userId - The user ID
     * @param contentType - The type of content being generated
     * @param initialContent - The initially generated content
     * @returns Enhanced content with applied learnings
     */
    async applyLearnedPatterns(
        userId: string,
        contentType: string,
        initialContent: string
    ): Promise<LearningApplicationResult> {
        // Get relevant patterns for this user and content type
        const patterns = await this.getRelevantPatterns(userId, contentType);

        if (patterns.length === 0) {
            return {
                appliedPatterns: [],
                skippedPatterns: [],
                confidenceBoost: 0,
                estimatedQualityImprovement: 0,
            };
        }

        // Filter patterns by confidence and quality impact
        const applicablePatterns = patterns.filter(
            (p) => p.confidence > 0.7 && p.qualityImpact > 0.5 && p.shouldApplyToFuture
        );

        const appliedPatterns: string[] = [];
        const skippedPatterns: string[] = [];

        // Apply each pattern
        for (const pattern of applicablePatterns) {
            const shouldApply = await this.shouldApplyPattern(pattern, initialContent);

            if (shouldApply) {
                appliedPatterns.push(pattern.patternId);
            } else {
                skippedPatterns.push(pattern.patternId);
            }
        }

        // Calculate confidence boost and quality improvement
        const confidenceBoost = applicablePatterns.reduce(
            (sum, p) => sum + p.confidence,
            0
        ) / Math.max(applicablePatterns.length, 1);

        const estimatedQualityImprovement = applicablePatterns.reduce(
            (sum, p) => sum + p.qualityImpact,
            0
        ) / Math.max(applicablePatterns.length, 1);

        return {
            appliedPatterns,
            skippedPatterns,
            confidenceBoost,
            estimatedQualityImprovement,
        };
    }

    /**
     * Gets learned patterns for a user and content type
     * 
     * @param userId - The user ID
     * @param contentType - The content type
     * @returns Array of relevant patterns
     */
    async getRelevantPatterns(
        userId: string,
        contentType: string
    ): Promise<RefinementPattern[]> {
        // Query patterns from DynamoDB
        const items = await this.repository.query<RefinementPattern>(
            `USER#${userId}`,
            `REFINEMENT_PATTERN#${contentType}#`
        );

        // Sort by quality impact and frequency
        return items.sort((a, b) => {
            const scoreA = a.qualityImpact * a.frequency * a.confidence;
            const scoreB = b.qualityImpact * b.frequency * b.confidence;
            return scoreB - scoreA;
        });
    }

    /**
     * Creates a new refinement pattern
     */
    private async createPattern(
        session: EditingSession,
        learning: EditingLearning
    ): Promise<RefinementPattern> {
        const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        // Extract example from session
        const example = this.extractExample(session, learning);

        const pattern: RefinementPattern = {
            patternId,
            userId: session.userId,
            contentType: session.metadata.contentType,
            pattern: learning.pattern,
            description: `User frequently edits ${learning.pattern}`,
            frequency: learning.frequency,
            examples: example ? [example] : [],
            qualityImpact: 0.7, // Initial estimate
            confidence: learning.frequency > 2 ? 0.8 : 0.6,
            createdAt: now,
            lastSeenAt: now,
            shouldApplyToFuture: learning.shouldApplyToFuture,
        };

        // Store pattern
        await this.repository.create(
            `USER#${session.userId}`,
            `REFINEMENT_PATTERN#${session.metadata.contentType}#${patternId}`,
            'RefinementPattern',
            pattern
        );

        return pattern;
    }

    /**
     * Updates an existing refinement pattern
     */
    private async updatePattern(
        existingPattern: RefinementPattern,
        session: EditingSession,
        learning: EditingLearning
    ): Promise<RefinementPattern> {
        const example = this.extractExample(session, learning);

        const updatedPattern: RefinementPattern = {
            ...existingPattern,
            frequency: existingPattern.frequency + learning.frequency,
            examples: example
                ? [...existingPattern.examples.slice(-4), example] // Keep last 5 examples
                : existingPattern.examples,
            confidence: Math.min(0.95, existingPattern.confidence + 0.05),
            qualityImpact: Math.min(0.95, existingPattern.qualityImpact + 0.05),
            lastSeenAt: new Date().toISOString(),
            shouldApplyToFuture: learning.shouldApplyToFuture,
        };

        // Update in storage
        await this.repository.update(
            `USER#${session.userId}`,
            `REFINEMENT_PATTERN#${session.metadata.contentType}#${existingPattern.patternId}`,
            {
                frequency: updatedPattern.frequency,
                examples: updatedPattern.examples,
                confidence: updatedPattern.confidence,
                qualityImpact: updatedPattern.qualityImpact,
                lastSeenAt: updatedPattern.lastSeenAt,
                shouldApplyToFuture: updatedPattern.shouldApplyToFuture,
            }
        );

        return updatedPattern;
    }

    /**
     * Finds an existing pattern for a user
     */
    private async findExistingPattern(
        userId: string,
        contentType: string,
        patternText: string
    ): Promise<RefinementPattern | null> {
        const patterns = await this.getRelevantPatterns(userId, contentType);

        // Find pattern with similar text
        return patterns.find((p) =>
            p.pattern.toLowerCase().includes(patternText.toLowerCase()) ||
            patternText.toLowerCase().includes(p.pattern.toLowerCase())
        ) || null;
    }

    /**
     * Extracts an example from a session
     */
    private extractExample(
        session: EditingSession,
        learning: EditingLearning
    ): RefinementExample | null {
        if (session.versions.length < 2) {
            return null;
        }

        const firstVersion = session.versions[0];
        const lastVersion = session.versions[session.versions.length - 1];

        return {
            sessionId: session.sessionId,
            originalText: firstVersion.content.substring(0, 200),
            refinedText: lastVersion.content.substring(0, 200),
            context: learning.context,
            timestamp: lastVersion.createdAt,
        };
    }

    /**
     * Analyzes clarity improvement using AI
     */
    private async analyzeClarityImprovement(
        originalContent: string,
        refinedContent: string
    ): Promise<QualityImprovement> {
        const prompt = `Compare these two versions of content and rate the clarity improvement on a scale of 0-1.

Original:
${originalContent.substring(0, 500)}

Refined:
${refinedContent.substring(0, 500)}

Respond with a JSON object:
{
  "clarityBefore": 0.7,
  "clarityAfter": 0.9,
  "improvement": 0.2,
  "significance": "medium"
}`;

        try {
            const command = new ConverseCommand({
                modelId: this.modelId,
                messages: [
                    {
                        role: 'user',
                        content: [{ text: prompt }],
                    },
                ],
                inferenceConfig: {
                    temperature: 0.3,
                    maxTokens: 500,
                },
            });

            const response = await this.client.send(command);
            const responseText = response.output?.message?.content?.[0]?.text || '{}';
            const result = JSON.parse(responseText);

            return {
                metric: 'clarity',
                before: result.clarityBefore || 0.7,
                after: result.clarityAfter || 0.7,
                improvement: result.improvement || 0,
                significance: result.significance || 'low',
            };
        } catch (error) {
            // Fallback if AI analysis fails
            return {
                metric: 'clarity',
                before: 0.7,
                after: 0.7,
                improvement: 0,
                significance: 'low',
            };
        }
    }

    /**
     * Analyzes structure improvement
     */
    private async analyzeStructureImprovement(
        originalContent: string,
        refinedContent: string
    ): Promise<QualityImprovement> {
        // Simple heuristic: count paragraphs, headings, lists
        const countStructure = (text: string) => {
            const paragraphs = text.split('\n\n').length;
            const headings = (text.match(/^#+\s/gm) || []).length;
            const lists = (text.match(/^[-*]\s/gm) || []).length;
            return paragraphs + headings * 2 + lists;
        };

        const structureBefore = countStructure(originalContent);
        const structureAfter = countStructure(refinedContent);
        const improvement = Math.abs(structureAfter - structureBefore) / Math.max(structureBefore, 1);

        return {
            metric: 'structure',
            before: structureBefore,
            after: structureAfter,
            improvement: Math.min(improvement, 1),
            significance: improvement > 0.3 ? 'high' : improvement > 0.15 ? 'medium' : 'low',
        };
    }

    /**
     * Gets patterns for a specific session
     */
    private async getPatternsForSession(
        userId: string,
        sessionId: string
    ): Promise<RefinementPattern[]> {
        // Get all patterns for user
        const allPatterns = await this.repository.query<RefinementPattern>(
            `USER#${userId}`,
            'REFINEMENT_PATTERN#'
        );

        // Filter patterns that have examples from this session
        return allPatterns.filter((pattern) =>
            pattern.examples.some((ex) => ex.sessionId === sessionId)
        );
    }

    /**
     * Generates recommendations based on analysis
     */
    private async generateRecommendations(
        session: EditingSession,
        improvements: QualityImprovement[],
        patterns: RefinementPattern[]
    ): Promise<string[]> {
        const recommendations: string[] = [];

        // Recommendations based on improvements
        improvements.forEach((imp) => {
            if (imp.significance === 'high') {
                recommendations.push(
                    `Future content should prioritize ${imp.metric} improvements (${(imp.improvement * 100).toFixed(0)}% gain observed)`
                );
            }
        });

        // Recommendations based on patterns
        patterns.forEach((pattern) => {
            if (pattern.frequency > 3 && pattern.qualityImpact > 0.7) {
                recommendations.push(
                    `Apply pattern "${pattern.pattern}" to initial generations (seen ${pattern.frequency} times)`
                );
            }
        });

        // General recommendations
        if (session.metadata.editCount > 5) {
            recommendations.push(
                'Consider adjusting initial generation parameters to reduce edit iterations'
            );
        }

        return recommendations;
    }

    /**
     * Determines if a pattern should be applied to content
     */
    private async shouldApplyPattern(
        pattern: RefinementPattern,
        content: string
    ): Promise<boolean> {
        // Simple heuristic: check if pattern is relevant to content
        const patternKeywords = pattern.pattern.toLowerCase().split(' ');
        const contentLower = content.toLowerCase();

        // Pattern is relevant if at least 50% of keywords appear in content
        const relevantKeywords = patternKeywords.filter((keyword) =>
            contentLower.includes(keyword)
        );

        return relevantKeywords.length >= patternKeywords.length * 0.5;
    }
}

/**
 * Creates a new refinement learning system instance
 */
export function createRefinementLearningSystem(
    client?: BedrockRuntimeClient,
    modelId?: string
): RefinementLearningSystem {
    return new RefinementLearningSystem(client, modelId);
}
