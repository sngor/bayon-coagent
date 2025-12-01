/**
 * Enhanced AI Generation Validation Agent with Social Media & SEO Scoring
 * 
 * Validates AI-generated content with detailed scoring for:
 * - User goal alignment
 * - Social media optimization (engagement, shareability, platform fit)
 * - SEO effectiveness (keywords, readability, structure)
 * - Overall quality and compliance
 */

import { z } from 'zod';
import { getBedrockClient } from './client';
import { getGuardrailsService, DEFAULT_GUARDRAILS_CONFIG } from './guardrails';
import { MODEL_CONFIGS } from './flow-base';

/**
 * Validation severity levels
 */
export enum ValidationSeverity {
    CRITICAL = 'critical',
    WARNING = 'warning',
    INFO = 'info',
}

/**
 * Validation issue
 */
export interface ValidationIssue {
    severity: ValidationSeverity;
    category: string;
    message: string;
    suggestion?: string;
    location?: string;
}

/**
 * Detailed score breakdown
 */
export interface ScoreBreakdown {
    overall: number; // 0-100
    goalAlignment: number; // 0-100
    socialMedia: number; // 0-100
    seo: number; // 0-100
    quality: number; // 0-100
    compliance: number; // 0-100
}

/**
 * Social media optimization details
 */
export interface SocialMediaScore {
    score: number; // 0-100
    engagement: number; // 0-100, likelihood to drive engagement
    shareability: number; // 0-100, likelihood to be shared
    platformFit: {
        facebook: number;
        instagram: number;
        linkedin: number;
        twitter: number;
    };
    strengths: string[];
    improvements: string[];
}

/**
 * SEO optimization details
 */
export interface SEOScore {
    score: number; // 0-100
    keywordOptimization: number; // 0-100
    readability: number; // 0-100
    structure: number; // 0-100
    metaOptimization: number; // 0-100
    strengths: string[];
    improvements: string[];
    suggestedKeywords?: string[];
}

/**
 * Validation result with detailed scoring
 */
export interface ValidationResult {
    passed: boolean;
    score: number; // 0-100, overall quality score
    scoreBreakdown: ScoreBreakdown;
    socialMediaScore?: SocialMediaScore;
    seoScore?: SEOScore;
    issues: ValidationIssue[];
    summary: string;
    recommendations?: string[];
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
    // Goal validation
    validateGoalAlignment?: boolean;
    userGoal?: string;

    // Quality checks
    minQualityScore?: number;
    checkCompleteness?: boolean;
    checkCoherence?: boolean;
    checkProfessionalism?: boolean;

    // Guardrails
    enforceGuardrails?: boolean;
    checkDomainCompliance?: boolean;
    checkEthicalCompliance?: boolean;

    // Format validation
    expectedFormat?: 'markdown' | 'html' | 'plain' | 'json';
    minLength?: number;
    maxLength?: number;
    requiredElements?: string[];

    // Content checks
    checkFactualConsistency?: boolean;
    checkToneAndStyle?: boolean;
    targetAudience?: string;

    // Social media & SEO validation
    validateSocialMedia?: boolean;
    validateSEO?: boolean;
    contentType?: 'blog' | 'social' | 'listing' | 'email' | 'video-script' | 'general';
    targetKeywords?: string[];

    // Strictness
    strictMode?: boolean;
}

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
    validateGoalAlignment: true,
    minQualityScore: 70,
    checkCompleteness: true,
    checkCoherence: true,
    checkProfessionalism: true,
    enforceGuardrails: true,
    checkDomainCompliance: true,
    checkEthicalCompliance: true,
    checkFactualConsistency: true,
    checkToneAndStyle: true,
    validateSocialMedia: true,
    validateSEO: true,
    strictMode: false,
};

/**
 * Enhanced AI validation response schema
 */
const EnhancedAIValidationResponseSchema = z.object({
    goalAlignment: z.object({
        score: z.number().min(0).max(100),
        meetsGoal: z.boolean(),
        explanation: z.string(),
    }),
    qualityChecks: z.object({
        completeness: z.object({
            score: z.number().min(0).max(100),
            issues: z.array(z.string()),
        }),
        coherence: z.object({
            score: z.number().min(0).max(100),
            issues: z.array(z.string()),
        }),
        professionalism: z.object({
            score: z.number().min(0).max(100),
            issues: z.array(z.string()),
        }),
    }),
    domainCompliance: z.object({
        isRealEstateRelated: z.boolean(),
        relevanceScore: z.number().min(0).max(100),
        issues: z.array(z.string()),
    }),
    ethicalCompliance: z.object({
        hasEthicalIssues: z.boolean(),
        issues: z.array(z.string()),
    }),
    factualConsistency: z.object({
        hasContradictions: z.boolean(),
        issues: z.array(z.string()),
    }),
    toneAndStyle: z.object({
        appropriate: z.boolean(),
        score: z.number().min(0).max(100),
        issues: z.array(z.string()),
    }),
    socialMediaOptimization: z.object({
        score: z.number().min(0).max(100),
        engagement: z.number().min(0).max(100),
        shareability: z.number().min(0).max(100),
        platformFit: z.object({
            facebook: z.number().min(0).max(100),
            instagram: z.number().min(0).max(100),
            linkedin: z.number().min(0).max(100),
            twitter: z.number().min(0).max(100),
        }),
        strengths: z.array(z.string()),
        improvements: z.array(z.string()),
    }),
    seoOptimization: z.object({
        score: z.number().min(0).max(100),
        keywordOptimization: z.number().min(0).max(100),
        readability: z.number().min(0).max(100),
        structure: z.number().min(0).max(100),
        metaOptimization: z.number().min(0).max(100),
        strengths: z.array(z.string()),
        improvements: z.array(z.string()),
        suggestedKeywords: z.array(z.string()).optional(),
    }),
    overallScore: z.number().min(0).max(100),
    recommendations: z.array(z.string()),
});

type EnhancedAIValidationResponse = z.infer<typeof EnhancedAIValidationResponseSchema>;

/**
 * Enhanced AI Generation Validation Agent
 */
export class ValidationAgent {
    private client = getBedrockClient();
    private guardrails = getGuardrailsService();

    /**
     * Validates AI-generated content with detailed scoring
     */
    async validate(
        content: string,
        config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
    ): Promise<ValidationResult> {
        const issues: ValidationIssue[] = [];
        const recommendations: string[] = [];

        // 1. Basic format validation
        this.validateFormat(content, config, issues);

        // 2. Guardrails validation
        if (config.enforceGuardrails) {
            this.validateGuardrails(content, config, issues);
        }

        // 3. AI-powered deep validation with social media & SEO scoring
        let aiValidation: EnhancedAIValidationResponse | null = null;
        if (this.shouldPerformAIValidation(config)) {
            try {
                aiValidation = await this.performEnhancedAIValidation(content, config);
                this.processAIValidationResults(aiValidation, config, issues, recommendations);
            } catch (error) {
                console.error('AI validation failed:', error);
                issues.push({
                    severity: ValidationSeverity.WARNING,
                    category: 'validation',
                    message: 'AI validation could not be completed',
                    suggestion: 'Manual review recommended',
                });
            }
        }

        // 4. Calculate scores
        const scoreBreakdown = this.calculateScoreBreakdown(aiValidation, issues);
        const score = scoreBreakdown.overall;
        const passed = this.determinePassed(score, issues, config);

        // 5. Extract social media and SEO scores
        const socialMediaScore = aiValidation ? {
            score: aiValidation.socialMediaOptimization.score,
            engagement: aiValidation.socialMediaOptimization.engagement,
            shareability: aiValidation.socialMediaOptimization.shareability,
            platformFit: aiValidation.socialMediaOptimization.platformFit,
            strengths: aiValidation.socialMediaOptimization.strengths,
            improvements: aiValidation.socialMediaOptimization.improvements,
        } : undefined;

        const seoScore = aiValidation ? {
            score: aiValidation.seoOptimization.score,
            keywordOptimization: aiValidation.seoOptimization.keywordOptimization,
            readability: aiValidation.seoOptimization.readability,
            structure: aiValidation.seoOptimization.structure,
            metaOptimization: aiValidation.seoOptimization.metaOptimization,
            strengths: aiValidation.seoOptimization.strengths,
            improvements: aiValidation.seoOptimization.improvements,
            suggestedKeywords: aiValidation.seoOptimization.suggestedKeywords,
        } : undefined;

        // 6. Generate summary
        const summary = this.generateSummary(passed, scoreBreakdown, issues, config);

        return {
            passed,
            score,
            scoreBreakdown,
            socialMediaScore,
            seoScore,
            issues,
            summary,
            recommendations: recommendations.length > 0 ? recommendations : undefined,
        };
    }

    /**
     * Performs enhanced AI validation with social media & SEO analysis
     */
    private async performEnhancedAIValidation(
        content: string,
        config: ValidationConfig
    ): Promise<EnhancedAIValidationResponse> {
        const contentTypeContext = config.contentType ? `\n**Content Type:** ${config.contentType}` : '';
        const keywordsContext = config.targetKeywords?.length
            ? `\n**Target Keywords:** ${config.targetKeywords.join(', ')}`
            : '';

        const systemPrompt = `You are an expert content validator specializing in real estate marketing, social media optimization, and SEO.

Your role is to analyze generated content across multiple dimensions:
1. **Goal Alignment** - Does it achieve the stated objective?
2. **Quality** - Completeness, coherence, professionalism
3. **Domain Compliance** - Real estate relevance
4. **Ethical Compliance** - No guarantees, legal advice, or unethical suggestions
5. **Factual Consistency** - No contradictions or logical issues
6. **Tone & Style** - Appropriate for target audience
7. **Social Media Optimization** - Engagement potential, shareability, platform fit
8. **SEO Optimization** - Keywords, readability, structure, meta elements

Provide detailed scores (0-100) and actionable feedback for each dimension.`;

        const userPrompt = `Validate the following real estate content:
${config.userGoal ? `\n**User's Goal:** ${config.userGoal}` : ''}${config.targetAudience ? `\n**Target Audience:** ${config.targetAudience}` : ''}${contentTypeContext}${keywordsContext}

**Content to Validate:**
\`\`\`
${content.substring(0, 8000)}${content.length > 8000 ? '\n... (truncated for analysis)' : ''}
\`\`\`

Provide a comprehensive validation assessment in JSON format:

{
  "goalAlignment": {
    "score": <0-100>,
    "meetsGoal": <boolean>,
    "explanation": "<detailed explanation>"
  },
  "qualityChecks": {
    "completeness": { "score": <0-100>, "issues": ["<issue>", ...] },
    "coherence": { "score": <0-100>, "issues": ["<issue>", ...] },
    "professionalism": { "score": <0-100>, "issues": ["<issue>", ...] }
  },
  "domainCompliance": {
    "isRealEstateRelated": <boolean>,
    "relevanceScore": <0-100>,
    "issues": ["<issue>", ...]
  },
  "ethicalCompliance": {
    "hasEthicalIssues": <boolean>,
    "issues": ["<issue>", ...]
  },
  "factualConsistency": {
    "hasContradictions": <boolean>,
    "issues": ["<issue>", ...]
  },
  "toneAndStyle": {
    "appropriate": <boolean>,
    "score": <0-100>,
    "issues": ["<issue>", ...]
  },
  "socialMediaOptimization": {
    "score": <0-100>,
    "engagement": <0-100, likelihood to drive likes/comments/shares>,
    "shareability": <0-100, likelihood to be shared>,
    "platformFit": {
      "facebook": <0-100, how well it fits Facebook>,
      "instagram": <0-100, how well it fits Instagram>,
      "linkedin": <0-100, how well it fits LinkedIn>,
      "twitter": <0-100, how well it fits Twitter/X>
    },
    "strengths": ["<strength>", ...],
    "improvements": ["<improvement>", ...]
  },
  "seoOptimization": {
    "score": <0-100>,
    "keywordOptimization": <0-100, keyword usage and placement>,
    "readability": <0-100, readability and scannability>,
    "structure": <0-100, heading hierarchy and formatting>,
    "metaOptimization": <0-100, title, description, meta elements>,
    "strengths": ["<strength>", ...],
    "improvements": ["<improvement>", ...],
    "suggestedKeywords": ["<keyword>", ...]
  },
  "overallScore": <0-100>,
  "recommendations": ["<actionable recommendation>", ...]
}`;

        return await this.client.invokeWithPrompts(
            systemPrompt,
            userPrompt,
            EnhancedAIValidationResponseSchema,
            {
                ...MODEL_CONFIGS.ANALYTICAL,
                maxTokens: 4096,
                flowName: 'enhancedValidationAgent',
            }
        );
    }

    /**
     * Calculates detailed score breakdown
     */
    private calculateScoreBreakdown(
        aiValidation: EnhancedAIValidationResponse | null,
        issues: ValidationIssue[]
    ): ScoreBreakdown {
        if (!aiValidation) {
            // Fallback calculation based on issues
            const baseScore = 100;
            let deductions = 0;

            for (const issue of issues) {
                switch (issue.severity) {
                    case ValidationSeverity.CRITICAL:
                        deductions += 25;
                        break;
                    case ValidationSeverity.WARNING:
                        deductions += 10;
                        break;
                    case ValidationSeverity.INFO:
                        deductions += 2;
                        break;
                }
            }

            const overall = Math.max(0, baseScore - deductions);

            return {
                overall,
                goalAlignment: overall,
                socialMedia: overall,
                seo: overall,
                quality: overall,
                compliance: overall,
            };
        }

        // Calculate from AI validation
        const qualityScore = (
            aiValidation.qualityChecks.completeness.score +
            aiValidation.qualityChecks.coherence.score +
            aiValidation.qualityChecks.professionalism.score
        ) / 3;

        const complianceScore = (
            aiValidation.domainCompliance.relevanceScore +
            (aiValidation.ethicalCompliance.hasEthicalIssues ? 0 : 100) +
            (aiValidation.factualConsistency.hasContradictions ? 50 : 100)
        ) / 3;

        // Apply issue deductions
        let deductions = 0;
        for (const issue of issues) {
            switch (issue.severity) {
                case ValidationSeverity.CRITICAL:
                    deductions += 15;
                    break;
                case ValidationSeverity.WARNING:
                    deductions += 5;
                    break;
                case ValidationSeverity.INFO:
                    deductions += 1;
                    break;
            }
        }

        return {
            overall: Math.max(0, aiValidation.overallScore - deductions),
            goalAlignment: aiValidation.goalAlignment.score,
            socialMedia: aiValidation.socialMediaOptimization.score,
            seo: aiValidation.seoOptimization.score,
            quality: qualityScore,
            compliance: complianceScore,
        };
    }

    // Include all other methods from the original validation-agent.ts
    private validateFormat(content: string, config: ValidationConfig, issues: ValidationIssue[]): void {
        if (config.minLength && content.length < config.minLength) {
            issues.push({
                severity: ValidationSeverity.CRITICAL,
                category: 'format',
                message: `Content is too short (${content.length} chars, minimum ${config.minLength})`,
                suggestion: 'Generate more comprehensive content',
            });
        }

        if (config.maxLength && content.length > config.maxLength) {
            issues.push({
                severity: ValidationSeverity.WARNING,
                category: 'format',
                message: `Content exceeds maximum length (${content.length} chars, maximum ${config.maxLength})`,
                suggestion: 'Consider condensing the content',
            });
        }

        if (config.requiredElements?.length) {
            for (const element of config.requiredElements) {
                if (!this.hasElement(content, element, config.expectedFormat)) {
                    issues.push({
                        severity: ValidationSeverity.CRITICAL,
                        category: 'format',
                        message: `Missing required element: ${element}`,
                        suggestion: `Add a ${element} section to the content`,
                    });
                }
            }
        }
    }

    private validateGuardrails(content: string, config: ValidationConfig, issues: ValidationIssue[]): void {
        const guardrailsResult = this.guardrails.validateRequest(content, DEFAULT_GUARDRAILS_CONFIG);

        if (!guardrailsResult.allowed) {
            issues.push({
                severity: ValidationSeverity.CRITICAL,
                category: 'guardrails',
                message: `Guardrails violation: ${guardrailsResult.reason}`,
                suggestion: 'Content must be regenerated to comply with guardrails',
            });
        }

        if (guardrailsResult.detectedPII?.length) {
            issues.push({
                severity: ValidationSeverity.CRITICAL,
                category: 'privacy',
                message: `PII detected: ${guardrailsResult.detectedPII.join(', ')}`,
                suggestion: 'Remove or redact PII before using this content',
            });
        }
    }

    private processAIValidationResults(
        aiValidation: EnhancedAIValidationResponse,
        config: ValidationConfig,
        issues: ValidationIssue[],
        recommendations: string[]
    ): void {
        if (config.validateGoalAlignment && !aiValidation.goalAlignment.meetsGoal) {
            issues.push({
                severity: config.strictMode ? ValidationSeverity.CRITICAL : ValidationSeverity.WARNING,
                category: 'goal_alignment',
                message: `Content does not meet user's goal: ${aiValidation.goalAlignment.explanation}`,
                suggestion: 'Regenerate with clearer goal specification',
            });
        }

        recommendations.push(...aiValidation.recommendations);
    }

    private shouldPerformAIValidation(config: ValidationConfig): boolean {
        return !!(
            config.validateGoalAlignment ||
            config.checkCompleteness ||
            config.checkCoherence ||
            config.checkProfessionalism ||
            config.checkFactualConsistency ||
            config.checkToneAndStyle ||
            config.validateSocialMedia ||
            config.validateSEO
        );
    }

    private hasElement(content: string, element: string, format?: string): boolean {
        const lowerContent = content.toLowerCase();
        const lowerElement = element.toLowerCase();

        if (format === 'markdown') {
            const headerPattern = new RegExp(`^#+\\s*${lowerElement}`, 'im');
            if (headerPattern.test(content)) return true;
        }

        return lowerContent.includes(lowerElement);
    }

    private determinePassed(score: number, issues: ValidationIssue[], config: ValidationConfig): boolean {
        const hasCriticalIssues = issues.some(i => i.severity === ValidationSeverity.CRITICAL);
        if (hasCriticalIssues) return false;

        const minScore = config.minQualityScore ?? 70;
        if (score < minScore) return false;

        if (config.strictMode) {
            const hasWarnings = issues.some(i => i.severity === ValidationSeverity.WARNING);
            if (hasWarnings) return false;
        }

        return true;
    }

    private generateSummary(
        passed: boolean,
        scoreBreakdown: ScoreBreakdown,
        issues: ValidationIssue[],
        config: ValidationConfig
    ): string {
        const score = scoreBreakdown.overall;

        if (passed) {
            if (score >= 90) {
                return `Excellent! Content passed validation with ${score}/100 overall. Goal: ${scoreBreakdown.goalAlignment}/100, Social: ${scoreBreakdown.socialMedia}/100, SEO: ${scoreBreakdown.seo}/100`;
            } else if (score >= 80) {
                return `Good! Content passed with ${score}/100. Goal: ${scoreBreakdown.goalAlignment}/100, Social: ${scoreBreakdown.socialMedia}/100, SEO: ${scoreBreakdown.seo}/100`;
            } else {
                return `Content passed with ${score}/100. Goal: ${scoreBreakdown.goalAlignment}/100, Social: ${scoreBreakdown.socialMedia}/100, SEO: ${scoreBreakdown.seo}/100. ${issues.length} issue(s) noted.`;
            }
        } else {
            const criticalCount = issues.filter(i => i.severity === ValidationSeverity.CRITICAL).length;
            return `Validation failed (${score}/100). ${criticalCount} critical issue(s). Goal: ${scoreBreakdown.goalAlignment}/100, Social: ${scoreBreakdown.socialMedia}/100, SEO: ${scoreBreakdown.seo}/100`;
        }
    }
}

let validationAgentInstance: ValidationAgent | null = null;

export function getValidationAgent(): ValidationAgent {
    if (!validationAgentInstance) {
        validationAgentInstance = new ValidationAgent();
    }
    return validationAgentInstance;
}

export function resetValidationAgent(): void {
    validationAgentInstance = null;
}

export async function validateContent(
    content: string,
    config?: ValidationConfig
): Promise<ValidationResult> {
    const agent = getValidationAgent();
    return agent.validate(content, config);
}
