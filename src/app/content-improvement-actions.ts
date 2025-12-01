'use server';

/**
 * Server Actions for AI Content Improvement
 */

import {
    autoImprove,
    quickImprove,
    aggressiveImprove,
    focusedImprove,
    type ImprovementResult
} from '@/aws/bedrock/content-improver';
import { getValidationAgent, type ValidationConfig } from '@/aws/bedrock/validation-agent-enhanced';

/**
 * Auto-improves content based on validation scores
 * Uses smart defaults to determine improvement strategy
 */
export async function autoImproveContentAction(
    content: string,
    validationConfig: ValidationConfig
) {
    try {
        // First validate the content
        const validator = getValidationAgent();
        const validation = await validator.validate(content, validationConfig);

        // If already excellent, no need to improve
        if (validation.score >= 95) {
            return {
                message: 'Content is already excellent!',
                data: {
                    improvedContent: content,
                    originalScore: validation.score,
                    finalScore: validation.score,
                    improved: false,
                },
                errors: {},
            };
        }

        // Auto-improve
        const result = await autoImprove(content, validation, validationConfig);

        return {
            message: 'success',
            data: {
                improvedContent: result.improvedContent,
                originalScore: result.originalValidation.score,
                finalScore: result.finalValidation.score,
                improved: result.success,
                targetAchieved: result.targetAchieved,
                iterations: result.iterations.length,
                changes: result.iterations[result.iterations.length - 1]?.changes || [],
            },
            errors: {},
        };
    } catch (error) {
        console.error('Auto-improve failed:', error);
        return {
            message: 'Failed to improve content',
            data: null,
            errors: { general: [(error as Error).message] },
        };
    }
}

/**
 * Quick improvement - single iteration for fast results
 */
export async function quickImproveContentAction(
    content: string,
    validationConfig: ValidationConfig
) {
    try {
        const validator = getValidationAgent();
        const validation = await validator.validate(content, validationConfig);

        const result = await quickImprove(content, validation, validationConfig);

        // Validate improved content
        const newValidation = await validator.validate(result.improvedContent, validationConfig);

        return {
            message: 'success',
            data: {
                improvedContent: result.improvedContent,
                originalScore: validation.score,
                finalScore: newValidation.score,
                changes: result.changes,
                validation: newValidation,
            },
            errors: {},
        };
    } catch (error) {
        console.error('Quick improve failed:', error);
        return {
            message: 'Failed to improve content',
            data: null,
            errors: { general: [(error as Error).message] },
        };
    }
}

/**
 * Aggressive improvement - multiple iterations to reach 90+
 */
export async function aggressiveImproveContentAction(
    content: string,
    validationConfig: ValidationConfig
) {
    try {
        const validator = getValidationAgent();
        const validation = await validator.validate(content, validationConfig);

        const result = await aggressiveImprove(content, validation, validationConfig);

        return {
            message: 'success',
            data: {
                improvedContent: result.improvedContent,
                originalScore: result.originalValidation.score,
                finalScore: result.finalValidation.score,
                improved: result.success,
                targetAchieved: result.targetAchieved,
                iterations: result.iterations.map(iter => ({
                    iteration: iter.iteration,
                    score: iter.validation.score,
                    changes: iter.changes,
                })),
                finalValidation: result.finalValidation,
            },
            errors: {},
        };
    } catch (error) {
        console.error('Aggressive improve failed:', error);
        return {
            message: 'Failed to improve content',
            data: null,
            errors: { general: [(error as Error).message] },
        };
    }
}

/**
 * Focused improvement - target specific area (social, SEO, or goal)
 */
export async function focusedImproveContentAction(
    content: string,
    focusArea: 'social' | 'seo' | 'goal',
    validationConfig: ValidationConfig
) {
    try {
        const validator = getValidationAgent();
        const validation = await validator.validate(content, validationConfig);

        const result = await focusedImprove(content, validation, validationConfig, focusArea);

        // Validate improved content
        const newValidation = await validator.validate(result.improvedContent, validationConfig);

        return {
            message: 'success',
            data: {
                improvedContent: result.improvedContent,
                originalScore: validation.score,
                finalScore: newValidation.score,
                focusArea,
                changes: result.changes,
                validation: newValidation,
            },
            errors: {},
        };
    } catch (error) {
        console.error('Focused improve failed:', error);
        return {
            message: 'Failed to improve content',
            data: null,
            errors: { general: [(error as Error).message] },
        };
    }
}
