/**
 * AI Content Improver
 * 
 * Automatically improves content based on validation scores and recommendations.
 * Uses iterative refinement to achieve target quality scores.
 */

import { z } from 'zod';
import { getBedrockClient } from './client';
import { getValidationAgent, type ValidationResult, type ValidationConfig } from './validation-agent-enhanced';
import { MODEL_CONFIGS } from './flow-base';

/**
 * Improvement options
 */
export interface ImprovementOptions {
    targetScore?: number; // Target overall score (default: 90)
    maxIterations?: number; // Max improvement attempts (default: 3)
    focusAreas?: ('goal' | 'social' | 'seo' | 'quality' | 'compliance')[]; // Areas to focus on
    preserveLength?: boolean; // Try to maintain similar length
    preserveStyle?: boolean; // Try to maintain writing style
}

/**
 * Improvement result
 */
export interface ImprovementResult {
    originalContent: string;
    improvedContent: string;
    originalValidation: ValidationResult;
    finalValidation: ValidationResult;
    iterations: {
        iteration: number;
        content: string;
        validation: ValidationResult;
        changes: string[];
    }[];
    success: boolean;
    targetAchieved: boolean;
}

/**
 * AI response schema for content improvement
 */
const ContentImprovementSchema = z.object({
    improvedContent: z.string(),
    changesMade: z.array(z.string()),
    reasoning: z.string(),
});

type ContentImprovementResponse = z.infer<typeof ContentImprovementSchema>;

/**
 * Improves content iteratively until target score is achieved
 */
export async function improveContent(
    content: string,
    validation: ValidationResult,
    validationConfig: ValidationConfig,
    options: ImprovementOptions = {}
): Promise<ImprovementResult> {
    const {
        targetScore = 90,
        maxIterations = 3,
        focusAreas = ['goal', 'social', 'seo', 'quality'],
        preserveLength = true,
        preserveStyle = true,
    } = options;

    const iterations: ImprovementResult['iterations'] = [];
    let currentContent = content;
    let currentValidation = validation;
    let iterationCount = 0;

    // Store original
    const originalContent = content;
    const originalValidation = validation;

    console.log(`Starting content improvement. Current score: ${currentValidation.score}, Target: ${targetScore}`);

    while (iterationCount < maxIterations && currentValidation.score < targetScore) {
        iterationCount++;
        console.log(`Improvement iteration ${iterationCount}/${maxIterations}`);

        // Generate improvement
        const improved = await generateImprovement(
            currentContent,
            currentValidation,
            validationConfig,
            {
                targetScore,
                focusAreas,
                preserveLength,
                preserveStyle,
                iteration: iterationCount,
            }
        );

        // Validate improved content
        const validator = getValidationAgent();
        const newValidation = await validator.validate(improved.improvedContent, validationConfig);

        // Record iteration
        iterations.push({
            iteration: iterationCount,
            content: improved.improvedContent,
            validation: newValidation,
            changes: improved.changesMade,
        });

        console.log(`Iteration ${iterationCount} score: ${newValidation.score} (${newValidation.score > currentValidation.score ? '+' : ''}${newValidation.score - currentValidation.score})`);

        // Check if improvement was successful
        if (newValidation.score <= currentValidation.score) {
            console.log('No improvement in score, stopping iterations');
            break;
        }

        // Update current content and validation
        currentContent = improved.improvedContent;
        currentValidation = newValidation;

        // Check if target achieved
        if (currentValidation.score >= targetScore) {
            console.log(`Target score ${targetScore} achieved!`);
            break;
        }
    }

    return {
        originalContent,
        improvedContent: currentContent,
        originalValidation,
        finalValidation: currentValidation,
        iterations,
        success: currentValidation.score > originalValidation.score,
        targetAchieved: currentValidation.score >= targetScore,
    };
}

/**
 * Generates improved content based on validation feedback
 */
async function generateImprovement(
    content: string,
    validation: ValidationResult,
    validationConfig: ValidationConfig,
    options: {
        targetScore: number;
        focusAreas: string[];
        preserveLength: boolean;
        preserveStyle: boolean;
        iteration: number;
    }
): Promise<ContentImprovementResponse> {
    const client = getBedrockClient();

    // Build focus areas description
    const focusDescription = buildFocusDescription(validation, options.focusAreas);

    // Build constraints
    const constraints: string[] = [];
    if (options.preserveLength) {
        constraints.push(`- Maintain similar length (current: ${content.length} characters, target: ${content.length * 0.9}-${content.length * 1.1})`);
    }
    if (options.preserveStyle) {
        constraints.push('- Preserve the original writing style and tone');
    }
    constraints.push('- Keep all factual information accurate');
    constraints.push('- Maintain real estate focus');

    const systemPrompt = `You are an expert content editor specializing in real estate marketing. Your role is to improve content based on validation feedback to achieve higher quality scores.

You must:
1. Address specific issues identified in the validation
2. Implement recommended improvements
3. Maintain the core message and intent
4. Follow all constraints provided

Be surgical in your edits - only change what needs improvement.`;

    const userPrompt = `Improve the following real estate content to achieve a target score of ${options.targetScore}/100.

**Current Content:**
\`\`\`
${content}
\`\`\`

**Current Scores:**
- Overall: ${validation.score}/100
- Goal Alignment: ${validation.scoreBreakdown.goalAlignment}/100
- Social Media: ${validation.scoreBreakdown.socialMedia}/100
- SEO: ${validation.scoreBreakdown.seo}/100
- Quality: ${validation.scoreBreakdown.quality}/100

**Issues to Address:**
${validation.issues.map(issue => `- [${issue.severity.toUpperCase()}] ${issue.category}: ${issue.message}${issue.suggestion ? `\n  Suggestion: ${issue.suggestion}` : ''}`).join('\n')}

**Recommendations:**
${validation.recommendations?.map((rec, i) => `${i + 1}. ${rec}`).join('\n') || 'None'}

**Focus Areas for This Iteration:**
${focusDescription}

**Social Media Improvements Needed:**
${validation.socialMediaScore ? `
- Engagement: ${validation.socialMediaScore.engagement}/100
  ${validation.socialMediaScore.improvements.filter(i => i.toLowerCase().includes('engagement')).map(i => `  • ${i}`).join('\n')}
- Shareability: ${validation.socialMediaScore.shareability}/100
  ${validation.socialMediaScore.improvements.filter(i => i.toLowerCase().includes('share')).map(i => `  • ${i}`).join('\n')}
` : 'N/A'}

**SEO Improvements Needed:**
${validation.seoScore ? `
- Keywords: ${validation.seoScore.keywordOptimization}/100
  ${validation.seoScore.improvements.filter(i => i.toLowerCase().includes('keyword')).map(i => `  • ${i}`).join('\n')}
- Readability: ${validation.seoScore.readability}/100
  ${validation.seoScore.improvements.filter(i => i.toLowerCase().includes('read')).map(i => `  • ${i}`).join('\n')}
- Structure: ${validation.seoScore.structure}/100
  ${validation.seoScore.improvements.filter(i => i.toLowerCase().includes('structure') || i.toLowerCase().includes('heading')).map(i => `  • ${i}`).join('\n')}
` : 'N/A'}

**Constraints:**
${constraints.join('\n')}

**Instructions:**
1. Analyze the issues and recommendations
2. Make targeted improvements to address the most impactful issues first
3. Focus on the specified areas: ${options.focusAreas.join(', ')}
4. Ensure all changes improve the content without losing its core message

Respond with JSON:
{
  "improvedContent": "<the improved content>",
  "changesMade": ["<specific change 1>", "<specific change 2>", ...],
  "reasoning": "<brief explanation of your improvement strategy>"
}`;

    return await client.invokeWithPrompts(
        systemPrompt,
        userPrompt,
        ContentImprovementSchema,
        {
            ...MODEL_CONFIGS.CREATIVE,
            maxTokens: 8192,
            flowName: 'contentImprover',
        }
    );
}

/**
 * Builds focus description based on validation scores
 */
function buildFocusDescription(validation: ValidationResult, focusAreas: string[]): string {
    const descriptions: string[] = [];

    if (focusAreas.includes('goal')) {
        descriptions.push(`- **Goal Alignment (${validation.scoreBreakdown.goalAlignment}/100)**: Ensure content directly addresses the user's stated objective`);
    }

    if (focusAreas.includes('social')) {
        descriptions.push(`- **Social Media (${validation.scoreBreakdown.socialMedia}/100)**: Improve engagement potential, shareability, and platform fit`);
    }

    if (focusAreas.includes('seo')) {
        descriptions.push(`- **SEO (${validation.scoreBreakdown.seo}/100)**: Optimize keywords, readability, structure, and meta elements`);
    }

    if (focusAreas.includes('quality')) {
        descriptions.push(`- **Quality (${validation.scoreBreakdown.quality}/100)**: Enhance completeness, coherence, and professionalism`);
    }

    if (focusAreas.includes('compliance')) {
        descriptions.push(`- **Compliance (${validation.scoreBreakdown.compliance}/100)**: Ensure domain relevance and ethical standards`);
    }

    return descriptions.join('\n');
}

/**
 * Quick improvement - single iteration focused on critical issues
 */
export async function quickImprove(
    content: string,
    validation: ValidationResult,
    validationConfig: ValidationConfig
): Promise<{ improvedContent: string; changes: string[] }> {
    const result = await improveContent(content, validation, validationConfig, {
        targetScore: validation.score + 15, // Aim for +15 points
        maxIterations: 1,
        focusAreas: ['goal', 'social', 'seo'],
        preserveLength: true,
        preserveStyle: true,
    });

    return {
        improvedContent: result.improvedContent,
        changes: result.iterations[0]?.changes || [],
    };
}

/**
 * Aggressive improvement - multiple iterations to reach 90+
 */
export async function aggressiveImprove(
    content: string,
    validation: ValidationResult,
    validationConfig: ValidationConfig
): Promise<ImprovementResult> {
    return improveContent(content, validation, validationConfig, {
        targetScore: 90,
        maxIterations: 3,
        focusAreas: ['goal', 'social', 'seo', 'quality'],
        preserveLength: false, // Allow length changes for better quality
        preserveStyle: false, // Allow style changes for better engagement
    });
}

/**
 * Focused improvement - target specific area
 */
export async function focusedImprove(
    content: string,
    validation: ValidationResult,
    validationConfig: ValidationConfig,
    focusArea: 'social' | 'seo' | 'goal'
): Promise<{ improvedContent: string; changes: string[] }> {
    const result = await improveContent(content, validation, validationConfig, {
        targetScore: 90,
        maxIterations: 2,
        focusAreas: [focusArea],
        preserveLength: true,
        preserveStyle: true,
    });

    return {
        improvedContent: result.improvedContent,
        changes: result.iterations[result.iterations.length - 1]?.changes || [],
    };
}

/**
 * Auto-improve with smart defaults based on current score
 */
export async function autoImprove(
    content: string,
    validation: ValidationResult,
    validationConfig: ValidationConfig
): Promise<ImprovementResult> {
    // Determine strategy based on current score
    if (validation.score >= 85) {
        // Already good, just polish
        return improveContent(content, validation, validationConfig, {
            targetScore: 95,
            maxIterations: 1,
            focusAreas: ['quality'],
            preserveLength: true,
            preserveStyle: true,
        });
    } else if (validation.score >= 70) {
        // Good foundation, improve specific areas
        const weakestArea = getWeakestArea(validation);
        return improveContent(content, validation, validationConfig, {
            targetScore: 90,
            maxIterations: 2,
            focusAreas: [weakestArea, 'quality'],
            preserveLength: true,
            preserveStyle: true,
        });
    } else {
        // Needs significant improvement
        return improveContent(content, validation, validationConfig, {
            targetScore: 85,
            maxIterations: 3,
            focusAreas: ['goal', 'social', 'seo', 'quality'],
            preserveLength: false,
            preserveStyle: false,
        });
    }
}

/**
 * Identifies the weakest scoring area
 */
function getWeakestArea(validation: ValidationResult): 'goal' | 'social' | 'seo' | 'quality' {
    const scores = {
        goal: validation.scoreBreakdown.goalAlignment,
        social: validation.scoreBreakdown.socialMedia,
        seo: validation.scoreBreakdown.seo,
        quality: validation.scoreBreakdown.quality,
    };

    return Object.entries(scores).reduce((weakest, [area, score]) =>
        score < scores[weakest] ? area as any : weakest,
        'goal' as 'goal' | 'social' | 'seo' | 'quality'
    );
}
