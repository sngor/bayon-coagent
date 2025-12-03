/**
 * SEO Optimization System
 * 
 * Implements comprehensive SEO optimization capabilities for content validation.
 * Analyzes keywords, generates meta descriptions, optimizes structure,
 * and provides SEO scoring.
 * 
 * Requirements validated:
 * - 8.4: Analyzes and optimizes content for SEO
 * 
 * Properties validated:
 * - Property 39: SEO optimization
 */

import { BedrockClient, getBedrockClient } from '../client';
import { z } from 'zod';
import { SEOOptimization } from './types';

/**
 * Keyword analysis result
 */
export interface KeywordAnalysis {
    /** Primary keywords found */
    primary: string[];

    /** Secondary keywords found */
    secondary: string[];

    /** Keyword density map */
    density: Record<string, number>;

    /** Suggested keywords to add */
    suggestions: string[];

    /** Keywords that are overused */
    overused: string[];

    /** Keywords that are underused */
    underused: string[];
}

/**
 * Meta description analysis
 */
export interface MetaDescriptionAnalysis {
    /** Current meta description if exists */
    current?: string;

    /** Suggested meta description */
    suggested: string;

    /** Length of suggested description */
    length: number;

    /** Whether it includes target keywords */
    includesKeywords: boolean;

    /** Score for current description (0-1) */
    currentScore?: number;

    /** Issues with current description */
    issues: string[];
}

/**
 * Content structure analysis
 */
export interface StructureAnalysis {
    /** Has H1 heading */
    hasH1: boolean;

    /** Heading hierarchy is correct */
    headingHierarchy: boolean;

    /** Heading count by level */
    headingCount: Record<string, number>;

    /** Paragraph length assessment */
    paragraphLength: 'good' | 'too-long' | 'too-short';

    /** Average paragraph length in words */
    avgParagraphLength: number;

    /** Readability score (0-100) */
    readabilityScore: number;

    /** Readability level */
    readabilityLevel: 'easy' | 'moderate' | 'difficult';

    /** Structure suggestions */
    suggestions: string[];
}

/**
 * Content optimization suggestion
 */
export interface ContentSuggestion {
    /** Type of suggestion */
    type: 'keyword' | 'structure' | 'readability' | 'meta' | 'links' | 'images';

    /** Suggestion message */
    message: string;

    /** Priority level */
    priority: 'high' | 'medium' | 'low';

    /** Specific action to take */
    action: string;

    /** Expected impact */
    impact: string;
}

/**
 * SEO optimization configuration
 */
export interface SEOConfig {
    /** Target keywords to optimize for */
    targetKeywords: string[];

    /** Content type for context */
    contentType?: 'blog' | 'landing-page' | 'product' | 'article' | 'listing';

    /** Target audience */
    targetAudience?: string;

    /** Geographic focus */
    geographic?: string;

    /** Whether to analyze internal/external links */
    analyzeLinks?: boolean;

    /** Whether to analyze images */
    analyzeImages?: boolean;

    /** Minimum readability score target */
    minReadabilityScore?: number;
}

/**
 * Complete SEO optimization result
 */
export interface SEOOptimizationResult {
    /** Current SEO score (0-1) */
    currentScore: number;

    /** Potential score with improvements (0-1) */
    potentialScore: number;

    /** Keyword analysis */
    keywords: KeywordAnalysis;

    /** Meta description analysis */
    metaDescription: MetaDescriptionAnalysis;

    /** Structure analysis */
    structure: StructureAnalysis;

    /** Content optimization suggestions */
    contentSuggestions: ContentSuggestion[];

    /** Overall assessment */
    assessment: string;

    /** Priority improvements */
    priorityImprovements: string[];

    /** Estimated time to implement improvements */
    estimatedEffort: 'low' | 'medium' | 'high';
}

/**
 * SEOOptimizer - Comprehensive SEO optimization system
 */
export class SEOOptimizer {
    private client: BedrockClient;

    constructor() {
        this.client = getBedrockClient();
    }

    /**
     * Performs comprehensive SEO optimization analysis
     * 
     * @param content - Content to optimize
     * @param config - SEO configuration
     * @returns Complete SEO optimization result
     */
    async optimizeSEO(content: string, config: SEOConfig): Promise<SEOOptimizationResult> {
        // Step 1: Analyze keywords
        const keywords = await this.analyzeKeywords(content, config);

        // Step 2: Analyze/generate meta description
        const metaDescription = await this.analyzeMetaDescription(content, config, keywords);

        // Step 3: Analyze content structure
        const structure = await this.analyzeStructure(content, config);

        // Step 4: Generate optimization suggestions
        const contentSuggestions = await this.generateSuggestions(
            content,
            keywords,
            metaDescription,
            structure,
            config
        );

        // Step 5: Calculate scores
        const currentScore = this.calculateSEOScore(keywords, metaDescription, structure);
        const potentialScore = this.calculatePotentialScore(currentScore, contentSuggestions);

        // Step 6: Generate assessment and priority improvements
        const assessment = this.generateAssessment(currentScore, potentialScore, contentSuggestions);
        const priorityImprovements = this.identifyPriorityImprovements(contentSuggestions);
        const estimatedEffort = this.estimateEffort(contentSuggestions);

        return {
            currentScore,
            potentialScore,
            keywords,
            metaDescription,
            structure,
            contentSuggestions,
            assessment,
            priorityImprovements,
            estimatedEffort,
        };
    }

    /**
     * Analyzes keywords in content
     * 
     * @param content - Content to analyze
     * @param config - Configuration
     * @returns Keyword analysis
     */
    async analyzeKeywords(content: string, config: SEOConfig): Promise<KeywordAnalysis> {
        const prompt = `You are an SEO expert. Analyze the following content for keyword optimization.

Content:
${content}

Target Keywords: ${config.targetKeywords.join(', ')}
Content Type: ${config.contentType || 'general'}
${config.targetAudience ? `Target Audience: ${config.targetAudience}` : ''}
${config.geographic ? `Geographic Focus: ${config.geographic}` : ''}

Analyze the content and provide:
1. Primary keywords found (most important, high-value keywords)
2. Secondary keywords found (supporting keywords)
3. Keyword density for each keyword (percentage)
4. Suggested keywords to add based on content and target
5. Keywords that are overused (density too high)
6. Keywords that are underused (should appear more)

Optimal keyword density is 1-3% for primary keywords and 0.5-1% for secondary keywords.

Provide your analysis in JSON format:
{
  "primary": ["keyword1", "keyword2"],
  "secondary": ["keyword3", "keyword4"],
  "density": {
    "keyword1": 2.5,
    "keyword2": 1.8
  },
  "suggestions": ["suggested keyword 1", "suggested keyword 2"],
  "overused": ["overused keyword"],
  "underused": ["underused keyword"]
}`;

        const schema = z.object({
            primary: z.array(z.string()),
            secondary: z.array(z.string()),
            density: z.record(z.number()),
            suggestions: z.array(z.string()),
            overused: z.array(z.string()),
            underused: z.array(z.string()),
        });

        return await this.client.invoke(prompt, schema, {
            temperature: 0.3,
            maxTokens: 1500,
        });
    }

    /**
     * Analyzes or generates meta description
     * 
     * @param content - Content to analyze
     * @param config - Configuration
     * @param keywords - Keyword analysis
     * @returns Meta description analysis
     */
    async analyzeMetaDescription(
        content: string,
        config: SEOConfig,
        keywords: KeywordAnalysis
    ): Promise<MetaDescriptionAnalysis> {
        // Extract current meta description if present
        const metaMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
        const currentMeta = metaMatch ? metaMatch[1] : undefined;

        const prompt = `You are an SEO expert. ${currentMeta ? 'Analyze and improve' : 'Generate'} a meta description for the following content.

Content Summary:
${content.substring(0, 500)}...

${currentMeta ? `Current Meta Description: "${currentMeta}"` : ''}

Target Keywords: ${config.targetKeywords.join(', ')}
Primary Keywords: ${keywords.primary.join(', ')}
Content Type: ${config.contentType || 'general'}

Requirements for meta description:
- Length: 150-160 characters (optimal)
- Include primary target keywords naturally
- Compelling and action-oriented
- Accurately summarizes content
- Encourages click-through

Provide your analysis in JSON format:
{
  "suggested": "Your optimized meta description here",
  "length": 155,
  "includesKeywords": true,
  ${currentMeta ? '"currentScore": 0.7,' : ''}
  "issues": ["Issue 1 with current description", "Issue 2"]
}`;

        const schema = z.object({
            suggested: z.string(),
            length: z.number(),
            includesKeywords: z.boolean(),
            currentScore: z.number().optional(),
            issues: z.array(z.string()),
        });

        const result = await this.client.invoke(prompt, schema, {
            temperature: 0.4,
            maxTokens: 500,
        });

        return {
            current: currentMeta,
            ...result,
        };
    }

    /**
     * Analyzes content structure
     * 
     * @param content - Content to analyze
     * @param config - Configuration
     * @returns Structure analysis
     */
    async analyzeStructure(content: string, config: SEOConfig): Promise<StructureAnalysis> {
        const prompt = `You are an SEO expert. Analyze the structure and readability of the following content.

Content:
${content}

Content Type: ${config.contentType || 'general'}
${config.minReadabilityScore ? `Target Readability Score: ${config.minReadabilityScore}` : ''}

Analyze:
1. Heading structure (H1, H2, H3, etc.)
2. Heading hierarchy correctness
3. Paragraph length (should be 3-5 sentences typically)
4. Readability score (Flesch Reading Ease: 0-100, higher is easier)
5. Readability level (easy/moderate/difficult)
6. Structure improvement suggestions

Provide your analysis in JSON format:
{
  "hasH1": true,
  "headingHierarchy": true,
  "headingCount": {
    "h1": 1,
    "h2": 3,
    "h3": 5
  },
  "paragraphLength": "good" | "too-long" | "too-short",
  "avgParagraphLength": 45,
  "readabilityScore": 65,
  "readabilityLevel": "moderate",
  "suggestions": [
    "Add more H2 subheadings to break up content",
    "Shorten paragraphs in section 3"
  ]
}`;

        const schema = z.object({
            hasH1: z.boolean(),
            headingHierarchy: z.boolean(),
            headingCount: z.record(z.number()),
            paragraphLength: z.enum(['good', 'too-long', 'too-short']),
            avgParagraphLength: z.number(),
            readabilityScore: z.number(),
            readabilityLevel: z.enum(['easy', 'moderate', 'difficult']),
            suggestions: z.array(z.string()),
        });

        return await this.client.invoke(prompt, schema, {
            temperature: 0.3,
            maxTokens: 1000,
        });
    }

    /**
     * Generates optimization suggestions
     * 
     * @param content - Content being analyzed
     * @param keywords - Keyword analysis
     * @param metaDescription - Meta description analysis
     * @param structure - Structure analysis
     * @param config - Configuration
     * @returns List of suggestions
     */
    async generateSuggestions(
        content: string,
        keywords: KeywordAnalysis,
        metaDescription: MetaDescriptionAnalysis,
        structure: StructureAnalysis,
        config: SEOConfig
    ): Promise<ContentSuggestion[]> {
        const suggestions: ContentSuggestion[] = [];

        // Keyword suggestions
        if (keywords.underused.length > 0) {
            suggestions.push({
                type: 'keyword',
                message: `Increase usage of underused keywords: ${keywords.underused.join(', ')}`,
                priority: 'high',
                action: 'Add these keywords naturally throughout the content, especially in headings and first paragraph',
                impact: 'Improved keyword relevance and search ranking',
            });
        }

        if (keywords.overused.length > 0) {
            suggestions.push({
                type: 'keyword',
                message: `Reduce usage of overused keywords: ${keywords.overused.join(', ')}`,
                priority: 'medium',
                action: 'Replace some instances with synonyms or related terms to avoid keyword stuffing',
                impact: 'Better keyword density and more natural content',
            });
        }

        if (keywords.suggestions.length > 0) {
            suggestions.push({
                type: 'keyword',
                message: `Consider adding suggested keywords: ${keywords.suggestions.slice(0, 3).join(', ')}`,
                priority: 'medium',
                action: 'Incorporate these related keywords to expand topic coverage',
                impact: 'Broader search visibility and topic authority',
            });
        }

        // Meta description suggestions
        if (!metaDescription.current) {
            suggestions.push({
                type: 'meta',
                message: 'Add meta description to improve search appearance',
                priority: 'high',
                action: `Use suggested meta description: "${metaDescription.suggested}"`,
                impact: 'Better click-through rate from search results',
            });
        } else if (metaDescription.issues.length > 0) {
            suggestions.push({
                type: 'meta',
                message: `Improve meta description: ${metaDescription.issues[0]}`,
                priority: 'high',
                action: `Update to: "${metaDescription.suggested}"`,
                impact: 'Improved search result appearance and CTR',
            });
        }

        // Structure suggestions
        if (!structure.hasH1) {
            suggestions.push({
                type: 'structure',
                message: 'Add H1 heading for main topic',
                priority: 'high',
                action: 'Add a clear, keyword-rich H1 heading at the top of the content',
                impact: 'Better content hierarchy and search engine understanding',
            });
        }

        if (!structure.headingHierarchy) {
            suggestions.push({
                type: 'structure',
                message: 'Fix heading hierarchy',
                priority: 'high',
                action: 'Ensure headings follow proper order (H1 → H2 → H3) without skipping levels',
                impact: 'Improved content structure and accessibility',
            });
        }

        if (structure.paragraphLength === 'too-long') {
            suggestions.push({
                type: 'readability',
                message: 'Break up long paragraphs',
                priority: 'medium',
                action: 'Split paragraphs longer than 5-6 sentences into smaller chunks',
                impact: 'Better readability and user engagement',
            });
        }

        if (structure.readabilityScore < (config.minReadabilityScore || 60)) {
            suggestions.push({
                type: 'readability',
                message: 'Improve content readability',
                priority: 'medium',
                action: 'Use shorter sentences, simpler words, and more active voice',
                impact: 'Wider audience reach and better user experience',
            });
        }

        // Add structure-specific suggestions
        structure.suggestions.forEach(suggestion => {
            suggestions.push({
                type: 'structure',
                message: suggestion,
                priority: 'low',
                action: suggestion,
                impact: 'Enhanced content organization',
            });
        });

        return suggestions;
    }

    /**
     * Calculates current SEO score
     * 
     * @param keywords - Keyword analysis
     * @param metaDescription - Meta description analysis
     * @param structure - Structure analysis
     * @returns Score from 0-1
     */
    private calculateSEOScore(
        keywords: KeywordAnalysis,
        metaDescription: MetaDescriptionAnalysis,
        structure: StructureAnalysis
    ): number {
        let score = 0;
        let maxScore = 0;

        // Keyword score (40% weight)
        maxScore += 40;
        const keywordScore = this.calculateKeywordScore(keywords);
        score += keywordScore * 40;

        // Meta description score (20% weight)
        maxScore += 20;
        const metaScore = metaDescription.current
            ? (metaDescription.currentScore || 0.5)
            : 0;
        score += metaScore * 20;

        // Structure score (40% weight)
        maxScore += 40;
        const structureScore = this.calculateStructureScore(structure);
        score += structureScore * 40;

        return score / maxScore;
    }

    /**
     * Calculates keyword score component
     */
    private calculateKeywordScore(keywords: KeywordAnalysis): number {
        let score = 0;

        // Primary keywords present
        if (keywords.primary.length > 0) score += 0.3;

        // Secondary keywords present
        if (keywords.secondary.length > 0) score += 0.2;

        // No overused keywords
        if (keywords.overused.length === 0) score += 0.3;

        // Few underused keywords
        if (keywords.underused.length <= 2) score += 0.2;

        return score;
    }

    /**
     * Calculates structure score component
     */
    private calculateStructureScore(structure: StructureAnalysis): number {
        let score = 0;

        // Has H1
        if (structure.hasH1) score += 0.25;

        // Correct heading hierarchy
        if (structure.headingHierarchy) score += 0.25;

        // Good paragraph length
        if (structure.paragraphLength === 'good') score += 0.2;

        // Readability score (normalized)
        score += (structure.readabilityScore / 100) * 0.3;

        return score;
    }

    /**
     * Calculates potential score with improvements
     */
    private calculatePotentialScore(
        currentScore: number,
        suggestions: ContentSuggestion[]
    ): number {
        // Estimate improvement based on priority of suggestions
        const highPriority = suggestions.filter(s => s.priority === 'high').length;
        const mediumPriority = suggestions.filter(s => s.priority === 'medium').length;

        const potentialImprovement = (highPriority * 0.1) + (mediumPriority * 0.05);

        return Math.min(1.0, currentScore + potentialImprovement);
    }

    /**
     * Generates overall assessment
     */
    private generateAssessment(
        currentScore: number,
        potentialScore: number,
        suggestions: ContentSuggestion[]
    ): string {
        const scorePercent = (currentScore * 100).toFixed(0);
        const potentialPercent = (potentialScore * 100).toFixed(0);

        let assessment = `Current SEO score: ${scorePercent}/100. `;

        if (currentScore >= 0.8) {
            assessment += 'Excellent SEO optimization. ';
        } else if (currentScore >= 0.6) {
            assessment += 'Good SEO foundation with room for improvement. ';
        } else if (currentScore >= 0.4) {
            assessment += 'Moderate SEO optimization. Several improvements needed. ';
        } else {
            assessment += 'Significant SEO improvements required. ';
        }

        const improvement = potentialScore - currentScore;
        if (improvement > 0.1) {
            assessment += `Implementing suggested changes could improve score to ${potentialPercent}/100. `;
        }

        const highPriority = suggestions.filter(s => s.priority === 'high').length;
        if (highPriority > 0) {
            assessment += `Focus on ${highPriority} high-priority improvement${highPriority !== 1 ? 's' : ''} first.`;
        }

        return assessment;
    }

    /**
     * Identifies priority improvements
     */
    private identifyPriorityImprovements(suggestions: ContentSuggestion[]): string[] {
        return suggestions
            .filter(s => s.priority === 'high')
            .map(s => s.message)
            .slice(0, 5); // Top 5 priorities
    }

    /**
     * Estimates effort to implement improvements
     */
    private estimateEffort(suggestions: ContentSuggestion[]): 'low' | 'medium' | 'high' {
        const highPriority = suggestions.filter(s => s.priority === 'high').length;
        const totalSuggestions = suggestions.length;

        if (highPriority >= 4 || totalSuggestions >= 10) {
            return 'high';
        } else if (highPriority >= 2 || totalSuggestions >= 5) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Converts result to SEOOptimization type for compatibility
     */
    toSEOOptimization(result: SEOOptimizationResult): SEOOptimization {
        return {
            currentScore: result.currentScore,
            keywords: {
                primary: result.keywords.primary,
                secondary: result.keywords.secondary,
                density: result.keywords.density,
                suggestions: result.keywords.suggestions,
            },
            metaDescription: {
                current: result.metaDescription.current,
                suggested: result.metaDescription.suggested,
                length: result.metaDescription.length,
                includesKeywords: result.metaDescription.includesKeywords,
            },
            structure: {
                hasH1: result.structure.hasH1,
                headingHierarchy: result.structure.headingHierarchy,
                paragraphLength: result.structure.paragraphLength,
                readabilityScore: result.structure.readabilityScore,
                suggestions: result.structure.suggestions,
            },
            contentSuggestions: result.contentSuggestions.map(s => ({
                type: s.type as any,
                message: s.message,
                priority: s.priority,
            })),
        };
    }
}

/**
 * Singleton instance
 */
let seoOptimizerInstance: SEOOptimizer | null = null;

/**
 * Gets the singleton SEOOptimizer instance
 */
export function getSEOOptimizer(): SEOOptimizer {
    if (!seoOptimizerInstance) {
        seoOptimizerInstance = new SEOOptimizer();
    }
    return seoOptimizerInstance;
}

/**
 * Resets the SEOOptimizer singleton (useful for testing)
 */
export function resetSEOOptimizer(): void {
    seoOptimizerInstance = null;
}
