'use server';

/**
 * Enhanced Blog Post Generation with Validation
 * 
 * This is an example of how to integrate the validation agent with existing flows.
 * It generates a blog post and validates it before returning to the user.
 */

import { generateBlogPost } from './generate-blog-post';
import { getValidationAgent, type ValidationConfig } from '../validation-agent';
import type { GenerateBlogPostInput, GenerateBlogPostOutput } from '@/ai/schemas/blog-post-schemas';

/**
 * Extended output that includes validation results
 */
export interface ValidatedBlogPostOutput extends GenerateBlogPostOutput {
    validation: {
        passed: boolean;
        score: number;
        issues: Array<{
            severity: string;
            category: string;
            message: string;
            suggestion?: string;
        }>;
        summary: string;
        recommendations?: string[];
    };
}

/**
 * Generates a blog post with automatic validation
 * 
 * @param input Blog post generation input
 * @param validationConfig Optional validation configuration
 * @returns Blog post with validation results
 */
export async function generateBlogPostWithValidation(
    input: GenerateBlogPostInput,
    validationConfig?: Partial<ValidationConfig>
): Promise<ValidatedBlogPostOutput> {
    // 1. Generate the blog post
    const blogPostOutput = await generateBlogPost(input);

    // 2. Validate the generated content
    const validator = getValidationAgent();

    const validationResult = await validator.validate(
        blogPostOutput.blogPost,
        {
            // Default validation config for blog posts
            validateGoalAlignment: true,
            userGoal: `Generate a blog post about: ${input.topic}`,
            minQualityScore: 75,
            checkCompleteness: true,
            checkCoherence: true,
            checkProfessionalism: true,
            enforceGuardrails: true,
            checkDomainCompliance: true,
            checkEthicalCompliance: true,
            expectedFormat: 'markdown',
            minLength: 500, // Blog posts should be substantial
            requiredElements: ['introduction', 'conclusion'],
            checkFactualConsistency: true,
            checkToneAndStyle: true,
            targetAudience: 'real estate agents and their clients',
            strictMode: false,
            // Override with custom config
            ...validationConfig,
        }
    );

    // 3. Log validation results
    console.log('Blog post validation:', {
        passed: validationResult.passed,
        score: validationResult.score,
        issueCount: validationResult.issues.length,
    });

    if (!validationResult.passed) {
        console.warn('Blog post validation failed:', validationResult.summary);
        validationResult.issues.forEach(issue => {
            console.warn(`  [${issue.severity}] ${issue.category}: ${issue.message}`);
        });
    }

    // 4. Return blog post with validation results
    return {
        ...blogPostOutput,
        validation: validationResult,
    };
}

/**
 * Generates a blog post with strict validation
 * Will throw an error if validation fails
 * 
 * @param input Blog post generation input
 * @returns Validated blog post (only if validation passes)
 * @throws Error if validation fails
 */
export async function generateValidatedBlogPost(
    input: GenerateBlogPostInput
): Promise<GenerateBlogPostOutput> {
    const result = await generateBlogPostWithValidation(input, {
        strictMode: true,
        minQualityScore: 80,
    });

    if (!result.validation.passed) {
        throw new Error(
            `Blog post validation failed: ${result.validation.summary}\n\n` +
            `Issues:\n${result.validation.issues.map(i => `- ${i.message}`).join('\n')}`
        );
    }

    // Return only the blog post output (without validation details)
    return {
        blogPost: result.blogPost,
        headerImage: result.headerImage,
        sources: result.sources,
    };
}

/**
 * Generates a blog post with automatic retry on validation failure
 * Will attempt to regenerate up to maxRetries times if validation fails
 * 
 * @param input Blog post generation input
 * @param maxRetries Maximum number of retry attempts
 * @returns Validated blog post
 */
export async function generateBlogPostWithRetry(
    input: GenerateBlogPostInput,
    maxRetries: number = 2
): Promise<ValidatedBlogPostOutput> {
    let lastResult: ValidatedBlogPostOutput | null = null;
    let attempt = 0;

    while (attempt <= maxRetries) {
        attempt++;
        console.log(`Blog post generation attempt ${attempt}/${maxRetries + 1}`);

        lastResult = await generateBlogPostWithValidation(input);

        if (lastResult.validation.passed) {
            console.log(`Blog post validated successfully on attempt ${attempt}`);
            return lastResult;
        }

        console.warn(
            `Attempt ${attempt} failed validation (score: ${lastResult.validation.score}). ` +
            `${attempt <= maxRetries ? 'Retrying...' : 'Max retries reached.'}`
        );
    }

    // Return the last result even if it failed (caller can check validation.passed)
    return lastResult!;
}
