'use server';

/**
 * Server Actions for AEO (Answer Engine Optimization)
 */

import {
    analyzeAEO,
    optimizeForAEO,
    quickAEOCheck,
    generateAEOFAQ,
    checkAEOBestPractices,
    type AEOAnalysis,
    type AEOOptimizationResult,
} from '@/aws/bedrock/aeo-optimizer';

/**
 * Analyzes content for AEO optimization
 */
export async function analyzeAEOAction(
    content: string,
    contentType: 'blog' | 'article' | 'faq' | 'guide' = 'blog'
) {
    try {
        const analysis = await analyzeAEO(content, contentType);

        return {
            message: 'success',
            data: analysis,
            errors: {},
        };
    } catch (error) {
        console.error('AEO analysis failed:', error);
        return {
            message: 'Failed to analyze content for AEO',
            data: null,
            errors: { general: [(error as Error).message] },
        };
    }
}

/**
 * Optimizes content for AI search engines
 */
export async function optimizeForAEOAction(
    content: string,
    contentType: 'blog' | 'article' | 'faq' | 'guide' = 'blog',
    targetKeywords?: string[]
) {
    try {
        const result = await optimizeForAEO(content, contentType, targetKeywords);

        return {
            message: 'success',
            data: result,
            errors: {},
        };
    } catch (error) {
        console.error('AEO optimization failed:', error);
        return {
            message: 'Failed to optimize content for AEO',
            data: null,
            errors: { general: [(error as Error).message] },
        };
    }
}

/**
 * Quick AEO check for fast feedback
 */
export async function quickAEOCheckAction(content: string) {
    try {
        const result = await quickAEOCheck(content);

        return {
            message: 'success',
            data: result,
            errors: {},
        };
    } catch (error) {
        console.error('Quick AEO check failed:', error);
        return {
            message: 'Failed to check AEO',
            data: null,
            errors: { general: [(error as Error).message] },
        };
    }
}

/**
 * Generates FAQ section optimized for AI
 */
export async function generateAEOFAQAction(
    content: string,
    numQuestions: number = 5
) {
    try {
        const faqs = await generateAEOFAQ(content, numQuestions);

        return {
            message: 'success',
            data: { faqs },
            errors: {},
        };
    } catch (error) {
        console.error('FAQ generation failed:', error);
        return {
            message: 'Failed to generate FAQs',
            data: null,
            errors: { general: [(error as Error).message] },
        };
    }
}

/**
 * Checks AEO best practices
 */
export async function checkAEOBestPracticesAction(content: string) {
    try {
        const result = checkAEOBestPractices(content);

        return {
            message: 'success',
            data: result,
            errors: {},
        };
    } catch (error) {
        console.error('Best practices check failed:', error);
        return {
            message: 'Failed to check best practices',
            data: null,
            errors: { general: [(error as Error).message] },
        };
    }
}
