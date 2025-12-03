/**
 * Quality Assurance Strand - Comprehensive Content Validation
 * 
 * This strand provides automated quality checks on all generated content,
 * ensuring accuracy, compliance, brand consistency, and SEO optimization.
 * 
 * Features:
 * - Fact checking and verification
 * - Fair housing and legal compliance validation
 * - Brand voice and messaging consistency
 * - SEO optimization analysis
 * - Grammar and style checking
 * 
 * Requirements validated:
 * - 8.1: Verifies factual claims against reliable sources
 * - 8.2: Checks for fair housing violations and discriminatory language
 * - 8.3: Validates content against brand guidelines
 * - 8.4: Analyzes and optimizes for SEO
 * - 8.5: Provides specific recommendations for improvement
 * 
 * Properties validated:
 * - Property 36: Fact verification
 * - Property 37: Compliance checking
 * - Property 38: Brand validation
 * - Property 39: SEO optimization
 * - Property 40: Quality recommendations
 */

import type { AgentStrand, AgentCapabilities, AgentMemory, AgentMetrics } from '../agent-core';
import type { WorkerAgentType } from '../worker-protocol';
import { BedrockClient, getBedrockClient } from '../client';
import { z } from 'zod';
import type {
    QualityAssuranceInput,
    QualityAssuranceResult,
    ValidationResult,
    ValidationIssue,
    ValidationType,
    ComplianceResult,
    BrandValidationResult,
    SEOOptimization,
    ComplianceRules,
    BrandGuidelines,
} from './types';
import { getFactChecker, type FactCheckResult, type FactCheckConfig } from './fact-checker';
import { getComplianceValidator, type DetailedComplianceResult } from './compliance-validator';
import { getSEOOptimizer, type SEOConfig, type SEOOptimizationResult } from './seo-optimizer';

/**
 * QualityAssuranceStrand - Specialized strand for content quality validation
 */
export class QualityAssuranceStrand implements AgentStrand {
    id: string;
    type: WorkerAgentType = 'content-generator'; // Using content-generator as closest match
    private client: BedrockClient;
    capabilities: AgentCapabilities;
    state: 'idle' | 'active' | 'busy' | 'overloaded' | 'error' | 'maintenance';
    memory: AgentMemory;
    metrics: AgentMetrics;
    createdAt: string;
    lastActiveAt: string;

    constructor(id?: string) {
        const now = new Date().toISOString();

        this.id = id || this.generateStrandId();
        this.state = 'idle';
        this.createdAt = now;
        this.lastActiveAt = now;
        this.client = getBedrockClient();

        this.capabilities = {
            expertise: [
                'quality-assurance',
                'fact-checking',
                'compliance-validation',
                'brand-consistency',
                'seo-optimization',
                'content-validation',
            ],
            taskTypes: [
                'content-validation',
                'fact-checking',
                'compliance-check',
                'brand-validation',
                'seo-analysis',
                'comprehensive-qa',
            ],
            qualityScore: 0.95,
            speedScore: 0.80,
            reliabilityScore: 0.98,
            maxConcurrentTasks: 5,
            preferredModel: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        };

        this.memory = {
            workingMemory: {},
            knowledgeBase: {},
            recentTasks: [],
            learnedPatterns: {},
        };

        this.metrics = {
            tasksCompleted: 0,
            successRate: 1.0,
            avgExecutionTime: 0,
            currentLoad: 0,
            recentQualityRatings: [],
            lastUpdated: now,
        };
    }

    /**
     * Validates content with comprehensive quality checks
     * 
     * @param input - Quality assurance input
     * @returns Comprehensive quality assurance result
     */
    async validateContent(input: QualityAssuranceInput): Promise<QualityAssuranceResult> {
        const startTime = Date.now();

        try {
            this.state = 'active';
            this.lastActiveAt = new Date().toISOString();

            // Perform requested validations in parallel
            const validationPromises: Promise<any>[] = [];

            // Perform basic validation (includes fact-checking if requested)
            validationPromises.push(this.performBasicValidation(input));

            // Add specific validations based on request
            if (input.validationTypes.includes('compliance') && input.complianceRules) {
                validationPromises.push(this.checkCompliance(input.content, input.complianceRules));
            }

            if (input.validationTypes.includes('brand') && input.brandGuidelines) {
                validationPromises.push(this.validateBrand(input.content, input.brandGuidelines));
            }

            if (input.validationTypes.includes('seo') && input.targetKeywords) {
                validationPromises.push(this.optimizeSEO(input.content, input.targetKeywords));
            }

            // Wait for all validations to complete
            const results = await Promise.all(validationPromises);

            // Combine results
            const validation = results[0] as ValidationResult;
            const compliance = input.validationTypes.includes('compliance') ? results[1] as ComplianceResult : undefined;
            const brand = input.validationTypes.includes('brand') ? results[input.validationTypes.includes('compliance') ? 2 : 1] as BrandValidationResult : undefined;
            const seo = input.validationTypes.includes('seo') ? results[results.length - 1] as SEOOptimization : undefined;

            // Generate final result
            const result = this.generateFinalResult(validation, compliance, brand, seo);

            // Update metrics
            const executionTime = Date.now() - startTime;
            this.updateMetrics(true, executionTime);

            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            this.updateMetrics(false, executionTime);
            this.state = 'error';
            throw error;
        } finally {
            this.state = this.metrics.currentLoad > 0.8 ? 'busy' :
                this.metrics.currentLoad > 0 ? 'active' : 'idle';
        }
    }

    /**
     * Performs comprehensive fact-checking on content
     * 
     * @param content - Content to fact-check
     * @param config - Fact-checking configuration
     * @returns Fact-check result
     */
    async checkFacts(content: string, config?: Partial<FactCheckConfig>): Promise<FactCheckResult> {
        const factChecker = getFactChecker();

        const defaultConfig: FactCheckConfig = {
            verifyAll: true,
            claimConfidenceThreshold: 0.7,
            generateCitations: true,
            citationFormat: 'inline',
            checkSourceReliability: true,
            domain: 'real-estate',
        };

        const finalConfig = { ...defaultConfig, ...config };

        return await factChecker.checkFacts(content, finalConfig);
    }

    /**
     * Performs basic validation including factual and grammar checks
     */
    private async performBasicValidation(input: QualityAssuranceInput): Promise<ValidationResult> {
        // Run fact-checking if factual validation is requested
        let factCheckResult: FactCheckResult | null = null;
        if (input.validationTypes.includes('factual')) {
            const factChecker = getFactChecker();
            factCheckResult = await factChecker.checkFacts(input.content, {
                verifyAll: true,
                claimConfidenceThreshold: 0.7,
                generateCitations: true,
                citationFormat: 'inline',
                checkSourceReliability: true,
                domain: 'real-estate',
            });
        }

        const prompt = `You are a quality assurance expert for real estate content. Analyze the following content and identify any issues.

Content to analyze:
${input.content}

Content Type: ${input.contentType || 'general'}

Please analyze for:
1. Grammar and spelling errors
2. Clarity and readability issues
3. Professional tone and language
${!input.validationTypes.includes('factual') ? '4. Factual accuracy - Flag any claims that seem unverified or questionable' : ''}

Provide your analysis in the following JSON format:
{
  "issues": [
    {
      "type": "grammar" ${!input.validationTypes.includes('factual') ? '| "factual"' : ''},
      "severity": "error" | "warning" | "info",
      "message": "Description of the issue",
      "location": { "start": 0, "end": 10 },
      "suggestion": "How to fix it"
    }
  ],
  "overallScore": 0.85,
  "recommendations": ["Specific actionable recommendations"]
}`;

        const schema = z.object({
            issues: z.array(z.any()),
            overallScore: z.number(),
            recommendations: z.array(z.string()),
        });

        const analysis = await this.client.invoke(prompt, schema, {
            temperature: 0.3,
            maxTokens: 2000,
        });

        // Merge fact-checking issues if available
        if (factCheckResult) {
            // Convert fact-check results to validation issues
            factCheckResult.unverifiedClaims.forEach(verification => {
                analysis.issues.push({
                    type: 'factual',
                    severity: verification.status === 'false' ? 'error' : 'warning',
                    message: `Unverified claim: ${verification.claim.claim}. ${verification.explanation}`,
                    location: verification.claim.location,
                    suggestion: verification.suggestedCorrection || verification.suggestedCitation || 'Provide citation or remove claim',
                });
            });

            factCheckResult.problematicClaims.forEach(verification => {
                analysis.issues.push({
                    type: 'factual',
                    severity: 'error',
                    message: `${verification.status === 'false' ? 'False' : 'Disputed'} claim: ${verification.claim.claim}. ${verification.explanation}`,
                    location: verification.claim.location,
                    suggestion: verification.suggestedCorrection || 'Correct or remove this claim',
                });
            });

            // Add fact-check recommendations
            analysis.recommendations.push(...factCheckResult.recommendations);

            // Adjust overall score based on fact-checking
            analysis.overallScore = (analysis.overallScore + factCheckResult.overallScore) / 2;
        }

        // Calculate scores by type
        const scoresByType: Record<ValidationType, number> = {
            factual: factCheckResult ? factCheckResult.overallScore : this.calculateTypeScore(analysis.issues, 'factual'),
            grammar: this.calculateTypeScore(analysis.issues, 'grammar'),
            compliance: 1.0,
            brand: 1.0,
            seo: 1.0,
        };

        return {
            passed: analysis.overallScore >= 0.7,
            issues: analysis.issues,
            recommendations: analysis.recommendations,
            overallScore: analysis.overallScore,
            scoresByType,
        };
    }

    /**
     * Checks content for compliance issues using the dedicated compliance validator
     */
    async checkCompliance(content: string, rules: ComplianceRules): Promise<ComplianceResult> {
        const complianceValidator = getComplianceValidator();

        const detailedResult = await complianceValidator.validateCompliance(content, rules, {
            strictMode: false,
            confidenceThreshold: 0.7,
            domain: 'real-estate',
            includeEducation: false, // Don't include education in basic checks
        });

        // Return standard ComplianceResult format
        return {
            compliant: detailedResult.compliant,
            violations: detailedResult.violations,
            complianceScore: detailedResult.complianceScore,
        };
    }

    /**
     * Performs detailed compliance validation with full analysis
     * 
     * @param content - Content to validate
     * @param rules - Compliance rules
     * @param config - Optional configuration
     * @returns Detailed compliance result with risk assessment and education
     */
    async checkComplianceDetailed(
        content: string,
        rules: ComplianceRules,
        config?: {
            strictMode?: boolean;
            confidenceThreshold?: number;
            includeEducation?: boolean;
        }
    ): Promise<DetailedComplianceResult> {
        const complianceValidator = getComplianceValidator();

        return await complianceValidator.validateCompliance(content, rules, {
            strictMode: config?.strictMode ?? false,
            confidenceThreshold: config?.confidenceThreshold ?? 0.7,
            domain: 'real-estate',
            includeEducation: config?.includeEducation ?? true,
        });
    }

    /**
     * Validates content against brand guidelines
     */
    async validateBrand(content: string, guidelines: BrandGuidelines): Promise<BrandValidationResult> {
        const prompt = `You are a brand consistency expert. Analyze the following content against the brand guidelines.

Content:
${content}

Brand Guidelines:
- Voice Tone: ${guidelines.voice.tone}
- Formality: ${guidelines.voice.formality}
- Personality Traits: ${guidelines.voice.personality.join(', ')}
- Key Messages: ${guidelines.messaging.keyMessages.join(', ')}
- Avoid Phrases: ${guidelines.messaging.avoidPhrases.join(', ')}
- Sentence Length: ${guidelines.style.sentenceLength}
- Paragraph Length: ${guidelines.style.paragraphLength}

Provide your analysis in JSON format:
{
  "voiceAlignment": 0.85,
  "messagingAlignment": 0.90,
  "styleAlignment": 0.88,
  "issues": [
    {
      "category": "voice" | "messaging" | "style",
      "message": "Description of the issue",
      "suggestion": "How to align with brand"
    }
  ]
}`;

        const schema = z.object({
            voiceAlignment: z.number(),
            messagingAlignment: z.number(),
            styleAlignment: z.number(),
            issues: z.array(z.any()),
        });

        const analysis = await this.client.invoke(prompt, schema, {
            temperature: 0.3,
            maxTokens: 1500,
        });

        return {
            matchesBrand: analysis.voiceAlignment >= 0.7 && analysis.messagingAlignment >= 0.7 && analysis.styleAlignment >= 0.7,
            voiceAlignment: analysis.voiceAlignment,
            messagingAlignment: analysis.messagingAlignment,
            styleAlignment: analysis.styleAlignment,
            overallBrandScore: (analysis.voiceAlignment + analysis.messagingAlignment + analysis.styleAlignment) / 3,
            issues: analysis.issues,
        };
    }

    /**
     * Optimizes content for SEO using the dedicated SEO optimizer
     * 
     * @param content - Content to optimize
     * @param targetKeywords - Target keywords
     * @param contentType - Optional content type for context
     * @returns SEO optimization result
     */
    async optimizeSEO(
        content: string,
        targetKeywords: string[],
        contentType?: 'blog' | 'landing-page' | 'product' | 'article' | 'listing'
    ): Promise<SEOOptimization> {
        const seoOptimizer = getSEOOptimizer();

        const config: SEOConfig = {
            targetKeywords,
            contentType,
            analyzeLinks: true,
            analyzeImages: true,
            minReadabilityScore: 60,
        };

        const result = await seoOptimizer.optimizeSEO(content, config);

        // Convert to SEOOptimization type for compatibility
        return seoOptimizer.toSEOOptimization(result);
    }

    /**
     * Performs detailed SEO optimization with full analysis
     * 
     * @param content - Content to optimize
     * @param config - SEO configuration
     * @returns Detailed SEO optimization result
     */
    async optimizeSEODetailed(content: string, config: SEOConfig): Promise<SEOOptimizationResult> {
        const seoOptimizer = getSEOOptimizer();
        return await seoOptimizer.optimizeSEO(content, config);
    }

    /**
     * Generates final comprehensive result
     */
    private generateFinalResult(
        validation: ValidationResult,
        compliance?: ComplianceResult,
        brand?: BrandValidationResult,
        seo?: SEOOptimization
    ): QualityAssuranceResult {
        // Determine final recommendation
        const hasErrors = validation.issues.some(i => i.severity === 'error') ||
            (compliance && !compliance.compliant) ||
            (brand && !brand.matchesBrand);

        const hasWarnings = validation.issues.some(i => i.severity === 'warning');

        let finalRecommendation: 'approve' | 'approve-with-changes' | 'reject';
        if (hasErrors) {
            finalRecommendation = 'reject';
        } else if (hasWarnings || (seo && seo.currentScore < 0.7)) {
            finalRecommendation = 'approve-with-changes';
        } else {
            finalRecommendation = 'approve';
        }

        // Generate summary
        const summary = this.generateSummary(validation, compliance, brand, seo);

        // Generate prioritized action items
        const actionItems = this.generateActionItems(validation, compliance, brand, seo);

        return {
            validation,
            compliance,
            brand,
            seo,
            finalRecommendation,
            summary,
            actionItems,
        };
    }

    /**
     * Generates a summary of quality issues
     */
    private generateSummary(
        validation: ValidationResult,
        compliance?: ComplianceResult,
        brand?: BrandValidationResult,
        seo?: SEOOptimization
    ): string {
        const parts: string[] = [];

        // Validation summary
        if (validation.passed) {
            parts.push(`Content quality is good (score: ${(validation.overallScore * 100).toFixed(0)}%).`);
        } else {
            parts.push(`Content quality needs improvement (score: ${(validation.overallScore * 100).toFixed(0)}%).`);
        }

        // Compliance summary
        if (compliance) {
            if (compliance.compliant) {
                parts.push('Content is compliant with regulations.');
            } else {
                parts.push(`Found ${compliance.violations.length} compliance issue(s).`);
            }
        }

        // Brand summary
        if (brand) {
            if (brand.matchesBrand) {
                parts.push('Content aligns with brand guidelines.');
            } else {
                parts.push(`Brand alignment needs improvement (score: ${(brand.overallBrandScore * 100).toFixed(0)}%).`);
            }
        }

        // SEO summary
        if (seo) {
            parts.push(`SEO score: ${(seo.currentScore * 100).toFixed(0)}%.`);
        }

        return parts.join(' ');
    }

    /**
     * Generates prioritized action items
     */
    private generateActionItems(
        validation: ValidationResult,
        compliance?: ComplianceResult,
        brand?: BrandValidationResult,
        seo?: SEOOptimization
    ): Array<{ priority: 'high' | 'medium' | 'low'; action: string; rationale: string }> {
        const items: Array<{ priority: 'high' | 'medium' | 'low'; action: string; rationale: string }> = [];

        // Add compliance issues (highest priority)
        if (compliance && !compliance.compliant) {
            compliance.violations.forEach(v => {
                items.push({
                    priority: v.severity === 'error' ? 'high' : 'medium',
                    action: v.suggestion,
                    rationale: v.message,
                });
            });
        }

        // Add validation errors
        validation.issues.filter(i => i.severity === 'error').forEach(issue => {
            items.push({
                priority: 'high',
                action: issue.suggestion || 'Fix this issue',
                rationale: issue.message,
            });
        });

        // Add brand issues
        if (brand && !brand.matchesBrand) {
            brand.issues.forEach(issue => {
                items.push({
                    priority: 'medium',
                    action: issue.suggestion,
                    rationale: issue.message,
                });
            });
        }

        // Add validation warnings
        validation.issues.filter(i => i.severity === 'warning').forEach(issue => {
            items.push({
                priority: 'medium',
                action: issue.suggestion || 'Address this issue',
                rationale: issue.message,
            });
        });

        // Add SEO suggestions
        if (seo) {
            seo.contentSuggestions.forEach(suggestion => {
                items.push({
                    priority: suggestion.priority,
                    action: suggestion.message,
                    rationale: `SEO optimization: ${suggestion.type}`,
                });
            });
        }

        return items;
    }



    /**
     * Calculates score for a specific validation type
     */
    private calculateTypeScore(issues: ValidationIssue[], type: ValidationType): number {
        const typeIssues = issues.filter(i => i.type === type);

        if (typeIssues.length === 0) {
            return 1.0;
        }

        // Deduct points based on severity
        let deduction = 0;
        typeIssues.forEach(issue => {
            switch (issue.severity) {
                case 'error':
                    deduction += 0.2;
                    break;
                case 'warning':
                    deduction += 0.1;
                    break;
                case 'info':
                    deduction += 0.05;
                    break;
            }
        });

        return Math.max(0, 1.0 - deduction);
    }

    /**
     * Updates strand metrics after task completion
     */
    private updateMetrics(success: boolean, executionTime: number): void {
        this.metrics.tasksCompleted += 1;

        // Update success rate (weighted average of last 20 tasks)
        const recentSuccesses = this.memory.recentTasks.slice(0, 19).filter(t => t.success).length;
        this.metrics.successRate = (recentSuccesses + (success ? 1 : 0)) / Math.min(this.metrics.tasksCompleted, 20);

        // Update average execution time (weighted average of last 10 tasks)
        const recentTimes = this.memory.recentTasks.slice(0, 9).map(t => t.executionTime);
        const totalTime = recentTimes.reduce((sum, t) => sum + t, 0) + executionTime;
        this.metrics.avgExecutionTime = totalTime / Math.min(this.metrics.tasksCompleted, 10);

        // Update current load
        const activeTasks = Object.keys(this.memory.workingMemory).length;
        this.metrics.currentLoad = activeTasks / this.capabilities.maxConcurrentTasks;

        this.metrics.lastUpdated = new Date().toISOString();
    }

    /**
     * Generates a unique strand ID
     */
    private generateStrandId(): string {
        return `quality-assurance-strand_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}

/**
 * Singleton instance
 */
let qualityAssuranceStrandInstance: QualityAssuranceStrand | null = null;

/**
 * Gets the singleton QualityAssuranceStrand instance
 */
export function getQualityAssuranceStrand(): QualityAssuranceStrand {
    if (!qualityAssuranceStrandInstance) {
        qualityAssuranceStrandInstance = new QualityAssuranceStrand();
    }
    return qualityAssuranceStrandInstance;
}

/**
 * Resets the QualityAssuranceStrand singleton (useful for testing)
 */
export function resetQualityAssuranceStrand(): void {
    qualityAssuranceStrandInstance = null;
}
