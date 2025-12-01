/**
 * AI Generation Validation Agent
 * 
 * Validates AI-generated content to ensure it achieves user goals and stays within guardrails.
 * This agent performs post-generation validation to catch issues that may have slipped through
 * initial guardrails or to verify content quality and goal alignment.
 * 
 * Features:
 * - Goal alignment validation (does content meet user's stated objective?)
 * - Content quality checks (completeness, coherence, professionalism)
 * - Guardrails compliance verification (domain, ethics, safety)
 * - Format validation (structure, length, required elements)
 * - Factual consistency checks (no contradictions, logical flow)
 * - Tone and style validation (appropriate for real estate professionals)
 */

import { z } from 'zod';
import { getBedrockClient } from './client';
import { getGuardrailsService, DEFAULT_GUARDRAILS_CONFIG } from './guardrails';
import { MODEL_CONFIGS } from './flow-base';

/**
 * Validation severity levels
 */
export enum ValidationSeverity {
    CRITICAL = 'critical',  // Content must be rejected
    WARNING = 'warning',    // Content should be reviewed
    INFO = 'info',          // Minor issue, informational only
}

/**
 * Validation issue
 */
export interface ValidationIssue {
    severity: ValidationSeverity;
    category: string;
    message: string;
    suggestion?: string;
    location?: string; // Where in the content the issue occurs
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
 * Validation result
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
    minQualityScore?: number; // 0-100
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
    requiredElements?: string[]; // e.g., ['title', 'introduction', 'conclusion']

    // Content checks
    checkFactualConsistency?: boolean;
    checkToneAndStyle?: boolean;
    targetAudience?: string; // e.g., 'real estate agents', 'home buyers'

    // Strictness
    strictMode?: boolean; // If true, warnings become critical issues
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
    strictMode: false,
};

/**
 * AI validation response schema
 */
const AIValidationResponseSchema = z.object({
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
    overallScore: z.number().min(0).max(100),
    recommendations: z.array(z.string()),
});

type AIValidationResponse = z.infer<typeof AIValidationResponseSchema>;

/**
 * AI Generation Validation Agent
 */
export class ValidationAgent {
    private client = getBedrockClient();
    private guardrails = getGuardrailsService();

    /**
     * Validates AI-generated content
     * 
     * @param content The generated content to validate
     * @param config Validation configuration
     * @returns Validation result with issues and recommendations
     */
    async validate(
        content: string,
        config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
    ): Promise<ValidationResult> {
        const issues: ValidationIssue[] = [];
        const recommendations: string[] = [];

        // 1. Basic format validation (fast, synchronous)
        this.validateFormat(content, config, issues);

        // 2. Guardrails validation (fast, synchronous)
        if (config.enforceGuardrails) {
            this.validateGuardrails(content, config, issues);
        }

        // 3. AI-powered deep validation (slower, uses Bedrock)
        let aiValidation: AIValidationResponse | null = null;
        if (this.shouldPerformAIValidation(config)) {
            try {
                aiValidation = await this.performAIValidation(content, config);
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

        // 4. Calculate overall score and determine pass/fail
        const score = aiValidation?.overallScore ?? this.calculateScore(issues);
        const passed = this.determinePassed(score, issues, config);

        // 5. Generate summary
        const summary = this.generateSummary(passed, score, issues, config);

        return {
            passed,
            score,
            issues,
            summary,
            recommendations: recommendations.length > 0 ? recommendations : undefined,
        };
    }

    /**
     * Validates content format and structure
     */
    private validateFormat(
        content: string,
        config: ValidationConfig,
        issues: ValidationIssue[]
    ): void {
        // Length validation
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

        // Required elements validation
        if (config.requiredElements && config.requiredElements.length > 0) {
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

        // Format-specific validation
        if (config.expectedFormat === 'markdown') {
            this.validateMarkdown(content, issues);
        } else if (config.expectedFormat === 'json') {
            this.validateJSON(content, issues);
        }
    }

    /**
     * Validates content against guardrails
     */
    private validateGuardrails(
        content: string,
        config: ValidationConfig,
        issues: ValidationIssue[]
    ): void {
        const guardrailsResult = this.guardrails.validateRequest(
            content,
            DEFAULT_GUARDRAILS_CONFIG
        );

        if (!guardrailsResult.allowed) {
            issues.push({
                severity: ValidationSeverity.CRITICAL,
                category: 'guardrails',
                message: `Guardrails violation: ${guardrailsResult.reason}`,
                suggestion: 'Content must be regenerated to comply with guardrails',
            });
        }

        // Check for PII in output
        if (guardrailsResult.detectedPII && guardrailsResult.detectedPII.length > 0) {
            issues.push({
                severity: ValidationSeverity.CRITICAL,
                category: 'privacy',
                message: `PII detected in generated content: ${guardrailsResult.detectedPII.join(', ')}`,
                suggestion: 'Remove or redact PII before using this content',
            });
        }

        // Domain compliance
        if (config.checkDomainCompliance) {
            if (!this.guardrails.isRealEstateDomain(content)) {
                issues.push({
                    severity: ValidationSeverity.CRITICAL,
                    category: 'domain',
                    message: 'Content is not related to real estate',
                    suggestion: 'Regenerate with real estate focus',
                });
            }
        }

        // Ethical compliance
        if (config.checkEthicalCompliance) {
            if (this.guardrails.containsUnethicalContent(content)) {
                issues.push({
                    severity: ValidationSeverity.CRITICAL,
                    category: 'ethics',
                    message: 'Content contains unethical or illegal suggestions',
                    suggestion: 'Content must be regenerated',
                });
            }

            if (this.guardrails.requestsFinancialGuarantee(content)) {
                issues.push({
                    severity: ValidationSeverity.CRITICAL,
                    category: 'ethics',
                    message: 'Content makes financial guarantees',
                    suggestion: 'Remove guarantee language',
                });
            }

            if (this.guardrails.requestsLegalAdvice(content)) {
                issues.push({
                    severity: ValidationSeverity.WARNING,
                    category: 'ethics',
                    message: 'Content may contain legal advice',
                    suggestion: 'Add disclaimer or rephrase',
                });
            }
        }
    }

    /**
     * Performs AI-powered validation using Bedrock
     */
    private async performAIValidation(
        content: string,
        config: ValidationConfig
    ): Promise<AIValidationResponse> {
        const systemPrompt = `You are an expert content validator for real estate marketing materials. Your role is to analyze generated content and provide detailed quality assessment.

Evaluate the content across multiple dimensions:
1. Goal alignment - Does it achieve the stated objective?
2. Quality - Is it complete, coherent, and professional?
3. Domain compliance - Is it relevant to real estate?
4. Ethical compliance - Does it avoid guarantees, legal advice, or unethical suggestions?
5. Factual consistency - Are there contradictions or logical issues?
6. Tone and style - Is it appropriate for the target audience?

Provide scores (0-100) and specific issues for each dimension.`;

        const userPrompt = `Validate the following generated content:

${config.userGoal ? `**User's Goal:** ${config.userGoal}\n\n` : ''}${config.targetAudience ? `**Target Audience:** ${config.targetAudience}\n\n` : ''}**Content to Validate:**
\`\`\`
${content.substring(0, 8000)} ${content.length > 8000 ? '... (truncated)' : ''}
\`\`\`

Provide a comprehensive validation assessment in JSON format with the following structure:
{
  "goalAlignment": {
    "score": <0-100>,
    "meetsGoal": <boolean>,
    "explanation": "<explanation>"
  },
  "qualityChecks": {
    "completeness": { "score": <0-100>, "issues": ["<issue1>", ...] },
    "coherence": { "score": <0-100>, "issues": ["<issue1>", ...] },
    "professionalism": { "score": <0-100>, "issues": ["<issue1>", ...] }
  },
  "domainCompliance": {
    "isRealEstateRelated": <boolean>,
    "relevanceScore": <0-100>,
    "issues": ["<issue1>", ...]
  },
  "ethicalCompliance": {
    "hasEthicalIssues": <boolean>,
    "issues": ["<issue1>", ...]
  },
  "factualConsistency": {
    "hasContradictions": <boolean>,
    "issues": ["<issue1>", ...]
  },
  "toneAndStyle": {
    "appropriate": <boolean>,
    "score": <0-100>,
    "issues": ["<issue1>", ...]
  },
  "overallScore": <0-100>,
  "recommendations": ["<recommendation1>", ...]
}`;

        return await this.client.invokeWithPrompts(
            systemPrompt,
            userPrompt,
            AIValidationResponseSchema,
            {
                ...MODEL_CONFIGS.ANALYTICAL,
                flowName: 'validationAgent',
            }
        );
    }

    /**
     * Processes AI validation results and adds issues
     */
    private processAIValidationResults(
        aiValidation: AIValidationResponse,
        config: ValidationConfig,
        issues: ValidationIssue[],
        recommendations: string[]
    ): void {
        // Goal alignment
        if (config.validateGoalAlignment && !aiValidation.goalAlignment.meetsGoal) {
            issues.push({
                severity: config.strictMode ? ValidationSeverity.CRITICAL : ValidationSeverity.WARNING,
                category: 'goal_alignment',
                message: `Content does not meet user's goal: ${aiValidation.goalAlignment.explanation}`,
                suggestion: 'Regenerate with clearer goal specification',
            });
        }

        // Quality checks
        if (config.checkCompleteness && aiValidation.qualityChecks.completeness.score < 70) {
            aiValidation.qualityChecks.completeness.issues.forEach(issue => {
                issues.push({
                    severity: ValidationSeverity.WARNING,
                    category: 'completeness',
                    message: issue,
                    suggestion: 'Add missing information or sections',
                });
            });
        }

        if (config.checkCoherence && aiValidation.qualityChecks.coherence.score < 70) {
            aiValidation.qualityChecks.coherence.issues.forEach(issue => {
                issues.push({
                    severity: ValidationSeverity.WARNING,
                    category: 'coherence',
                    message: issue,
                    suggestion: 'Improve logical flow and transitions',
                });
            });
        }

        if (config.checkProfessionalism && aiValidation.qualityChecks.professionalism.score < 70) {
            aiValidation.qualityChecks.professionalism.issues.forEach(issue => {
                issues.push({
                    severity: ValidationSeverity.WARNING,
                    category: 'professionalism',
                    message: issue,
                    suggestion: 'Adjust tone and language for professional audience',
                });
            });
        }

        // Domain compliance
        if (config.checkDomainCompliance && !aiValidation.domainCompliance.isRealEstateRelated) {
            issues.push({
                severity: ValidationSeverity.CRITICAL,
                category: 'domain',
                message: 'AI validation confirms content is not real estate related',
                suggestion: 'Regenerate with real estate focus',
            });
        }

        // Ethical compliance
        if (config.checkEthicalCompliance && aiValidation.ethicalCompliance.hasEthicalIssues) {
            aiValidation.ethicalCompliance.issues.forEach(issue => {
                issues.push({
                    severity: ValidationSeverity.CRITICAL,
                    category: 'ethics',
                    message: issue,
                    suggestion: 'Remove unethical content and regenerate',
                });
            });
        }

        // Factual consistency
        if (config.checkFactualConsistency && aiValidation.factualConsistency.hasContradictions) {
            aiValidation.factualConsistency.issues.forEach(issue => {
                issues.push({
                    severity: ValidationSeverity.WARNING,
                    category: 'consistency',
                    message: issue,
                    suggestion: 'Resolve contradictions and ensure logical consistency',
                });
            });
        }

        // Tone and style
        if (config.checkToneAndStyle && !aiValidation.toneAndStyle.appropriate) {
            aiValidation.toneAndStyle.issues.forEach(issue => {
                issues.push({
                    severity: ValidationSeverity.INFO,
                    category: 'tone',
                    message: issue,
                    suggestion: 'Adjust tone to match target audience',
                });
            });
        }

        // Add recommendations
        recommendations.push(...aiValidation.recommendations);
    }

    /**
     * Determines if AI validation should be performed
     */
    private shouldPerformAIValidation(config: ValidationConfig): boolean {
        return !!(
            config.validateGoalAlignment ||
            config.checkCompleteness ||
            config.checkCoherence ||
            config.checkProfessionalism ||
            config.checkFactualConsistency ||
            config.checkToneAndStyle
        );
    }

    /**
     * Checks if content has a required element
     */
    private hasElement(content: string, element: string, format?: string): boolean {
        const lowerContent = content.toLowerCase();
        const lowerElement = element.toLowerCase();

        // Check for common patterns
        if (format === 'markdown') {
            // Check for markdown headers
            const headerPattern = new RegExp(`^#+\\s*${lowerElement}`, 'im');
            if (headerPattern.test(content)) return true;
        }

        // Check for element name in content
        return lowerContent.includes(lowerElement);
    }

    /**
     * Validates markdown format
     */
    private validateMarkdown(content: string, issues: ValidationIssue[]): void {
        // Check for basic markdown structure
        if (!content.includes('#') && content.length > 500) {
            issues.push({
                severity: ValidationSeverity.INFO,
                category: 'format',
                message: 'Content lacks markdown headers for structure',
                suggestion: 'Add headers to improve readability',
            });
        }

        // Check for broken markdown links
        const brokenLinkPattern = /\[([^\]]+)\]\(\s*\)/g;
        if (brokenLinkPattern.test(content)) {
            issues.push({
                severity: ValidationSeverity.WARNING,
                category: 'format',
                message: 'Content contains broken markdown links',
                suggestion: 'Fix or remove broken links',
            });
        }
    }

    /**
     * Validates JSON format
     */
    private validateJSON(content: string, issues: ValidationIssue[]): void {
        try {
            JSON.parse(content);
        } catch (error) {
            issues.push({
                severity: ValidationSeverity.CRITICAL,
                category: 'format',
                message: 'Content is not valid JSON',
                suggestion: 'Ensure content is properly formatted JSON',
            });
        }
    }

    /**
     * Calculates overall score from issues
     */
    private calculateScore(issues: ValidationIssue[]): number {
        let score = 100;

        for (const issue of issues) {
            switch (issue.severity) {
                case ValidationSeverity.CRITICAL:
                    score -= 25;
                    break;
                case ValidationSeverity.WARNING:
                    score -= 10;
                    break;
                case ValidationSeverity.INFO:
                    score -= 2;
                    break;
            }
        }

        return Math.max(0, score);
    }

    /**
     * Determines if validation passed
     */
    private determinePassed(
        score: number,
        issues: ValidationIssue[],
        config: ValidationConfig
    ): boolean {
        // Critical issues always fail
        const hasCriticalIssues = issues.some(
            issue => issue.severity === ValidationSeverity.CRITICAL
        );
        if (hasCriticalIssues) return false;

        // Check minimum score
        const minScore = config.minQualityScore ?? 70;
        if (score < minScore) return false;

        // In strict mode, warnings also fail
        if (config.strictMode) {
            const hasWarnings = issues.some(
                issue => issue.severity === ValidationSeverity.WARNING
            );
            if (hasWarnings) return false;
        }

        return true;
    }

    /**
     * Generates validation summary
     */
    private generateSummary(
        passed: boolean,
        score: number,
        issues: ValidationIssue[],
        config: ValidationConfig
    ): string {
        if (passed) {
            if (score >= 90) {
                return `Excellent! Content passed validation with a score of ${score}/100. ${issues.length === 0 ? 'No issues found.' : `${issues.length} minor issue(s) noted.`}`;
            } else if (score >= 80) {
                return `Good! Content passed validation with a score of ${score}/100. ${issues.length} issue(s) noted for improvement.`;
            } else {
                return `Content passed validation with a score of ${score}/100. ${issues.length} issue(s) should be addressed for better quality.`;
            }
        } else {
            const criticalCount = issues.filter(i => i.severity === ValidationSeverity.CRITICAL).length;
            const warningCount = issues.filter(i => i.severity === ValidationSeverity.WARNING).length;

            if (criticalCount > 0) {
                return `Validation failed with ${criticalCount} critical issue(s) and ${warningCount} warning(s). Content must be regenerated or manually corrected.`;
            } else {
                return `Validation failed with a score of ${score}/100 (minimum ${config.minQualityScore ?? 70} required). ${issues.length} issue(s) must be addressed.`;
            }
        }
    }
}

/**
 * Singleton instance
 */
let validationAgentInstance: ValidationAgent | null = null;

/**
 * Gets the singleton validation agent instance
 */
export function getValidationAgent(): ValidationAgent {
    if (!validationAgentInstance) {
        validationAgentInstance = new ValidationAgent();
    }
    return validationAgentInstance;
}

/**
 * Resets the validation agent singleton (useful for testing)
 */
export function resetValidationAgent(): void {
    validationAgentInstance = null;
}

/**
 * Convenience function to validate content
 */
export async function validateContent(
    content: string,
    config?: ValidationConfig
): Promise<ValidationResult> {
    const agent = getValidationAgent();
    return agent.validate(content, config);
}
