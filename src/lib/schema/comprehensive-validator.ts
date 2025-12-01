/**
 * Comprehensive Schema Validation Service
 * 
 * Scans all public pages and validates schema markup
 * Requirements: 8.5
 */

import { Profile, Testimonial } from "@/lib/types/common";
import {
    generatePersonSchema,
    generateRealEstateAgentSchema,
    generateRealEstateAgentWithReviewsSchema,
    generateArticleSchema,
    generateReviewSchema,
    ArticleSchemaInput,
} from "./generators";
import {
    validateSchema,
    ValidationResult,
    formatValidationErrors,
    generateFixSuggestions,
} from "./validator";

export interface PageValidationResult {
    pageType: "profile" | "blog-post" | "testimonials";
    pageName: string;
    schemas: any[];
    validations: ValidationResult[];
    hasErrors: boolean;
    hasWarnings: boolean;
    errorCount: number;
    warningCount: number;
}

export interface ComprehensiveValidationReport {
    totalPages: number;
    pagesWithErrors: number;
    pagesWithWarnings: number;
    totalErrors: number;
    totalWarnings: number;
    pageResults: PageValidationResult[];
    summary: string;
}

// ==================== Page Validators ====================

/**
 * Validates schema markup for a profile page
 * 
 * @param profile - The agent's profile data
 * @param testimonials - Featured testimonials to display
 * @returns Validation result for the profile page
 */
export function validateProfilePage(
    profile: Profile,
    testimonials: Testimonial[] = []
): PageValidationResult {
    const schemas: any[] = [];
    const validations: ValidationResult[] = [];

    // Generate and validate Person schema
    const personSchema = {
        "@context": "https://schema.org",
        ...generatePersonSchema(profile),
    };
    schemas.push(personSchema);
    validations.push(validateSchema(personSchema));

    // Generate and validate RealEstateAgent schema with reviews
    const agentSchema = generateRealEstateAgentWithReviewsSchema(
        profile,
        testimonials
    );
    schemas.push(agentSchema);
    validations.push(validateSchema(agentSchema));

    // Calculate error and warning counts
    const errorCount = validations.reduce(
        (sum, v) => sum + v.errors.length,
        0
    );
    const warningCount = validations.reduce(
        (sum, v) => sum + v.warnings.length,
        0
    );

    return {
        pageType: "profile",
        pageName: `Profile: ${profile.name || "Unknown"}`,
        schemas,
        validations,
        hasErrors: errorCount > 0,
        hasWarnings: warningCount > 0,
        errorCount,
        warningCount,
    };
}

/**
 * Validates schema markup for a blog post page
 * 
 * @param article - The blog post data
 * @returns Validation result for the blog post page
 */
export function validateBlogPostPage(
    article: ArticleSchemaInput
): PageValidationResult {
    const schemas: any[] = [];
    const validations: ValidationResult[] = [];

    // Generate and validate Article schema
    const articleSchema = generateArticleSchema(article);
    schemas.push(articleSchema);
    validations.push(validateSchema(articleSchema));

    // Calculate error and warning counts
    const errorCount = validations.reduce(
        (sum, v) => sum + v.errors.length,
        0
    );
    const warningCount = validations.reduce(
        (sum, v) => sum + v.warnings.length,
        0
    );

    return {
        pageType: "blog-post",
        pageName: `Blog Post: ${article.title}`,
        schemas,
        validations,
        hasErrors: errorCount > 0,
        hasWarnings: warningCount > 0,
        errorCount,
        warningCount,
    };
}

/**
 * Validates schema markup for a testimonials page
 * 
 * @param testimonials - Array of testimonials to display
 * @param agentName - The agent's name
 * @returns Validation result for the testimonials page
 */
export function validateTestimonialsPage(
    testimonials: Testimonial[],
    agentName: string
): PageValidationResult {
    const schemas: any[] = [];
    const validations: ValidationResult[] = [];

    // Generate and validate Review schema for each testimonial
    testimonials.forEach((testimonial) => {
        const reviewSchema = {
            "@context": "https://schema.org",
            ...generateReviewSchema(testimonial, agentName),
        };
        schemas.push(reviewSchema);
        validations.push(validateSchema(reviewSchema));
    });

    // Calculate error and warning counts
    const errorCount = validations.reduce(
        (sum, v) => sum + v.errors.length,
        0
    );
    const warningCount = validations.reduce(
        (sum, v) => sum + v.warnings.length,
        0
    );

    return {
        pageType: "testimonials",
        pageName: "Testimonials Page",
        schemas,
        validations,
        hasErrors: errorCount > 0,
        hasWarnings: warningCount > 0,
        errorCount,
        warningCount,
    };
}

// ==================== Comprehensive Validation ====================

export interface ComprehensiveValidationInput {
    profile?: Profile;
    testimonials?: Testimonial[];
    blogPosts?: ArticleSchemaInput[];
}

/**
 * Performs comprehensive validation across all public pages
 * 
 * @param input - Data for all pages to validate
 * @returns Complete validation report with summary
 */
export function performComprehensiveValidation(
    input: ComprehensiveValidationInput
): ComprehensiveValidationReport {
    const pageResults: PageValidationResult[] = [];

    // Validate profile page if profile data provided
    if (input.profile) {
        const profileResult = validateProfilePage(
            input.profile,
            input.testimonials || []
        );
        pageResults.push(profileResult);
    }

    // Validate blog post pages if blog posts provided
    if (input.blogPosts && input.blogPosts.length > 0) {
        input.blogPosts.forEach((blogPost) => {
            const blogPostResult = validateBlogPostPage(blogPost);
            pageResults.push(blogPostResult);
        });
    }

    // Validate testimonials page if testimonials provided
    if (
        input.testimonials &&
        input.testimonials.length > 0 &&
        input.profile?.name
    ) {
        const testimonialsResult = validateTestimonialsPage(
            input.testimonials,
            input.profile.name
        );
        pageResults.push(testimonialsResult);
    }

    // Calculate totals
    const totalPages = pageResults.length;
    const pagesWithErrors = pageResults.filter((r) => r.hasErrors).length;
    const pagesWithWarnings = pageResults.filter((r) => r.hasWarnings).length;
    const totalErrors = pageResults.reduce((sum, r) => sum + r.errorCount, 0);
    const totalWarnings = pageResults.reduce(
        (sum, r) => sum + r.warningCount,
        0
    );

    // Generate summary
    const summary = generateValidationSummary({
        totalPages,
        pagesWithErrors,
        pagesWithWarnings,
        totalErrors,
        totalWarnings,
    });

    return {
        totalPages,
        pagesWithErrors,
        pagesWithWarnings,
        totalErrors,
        totalWarnings,
        pageResults,
        summary,
    };
}

/**
 * Generates a human-readable summary of validation results
 * 
 * @param stats - Validation statistics
 * @returns Summary text
 */
function generateValidationSummary(stats: {
    totalPages: number;
    pagesWithErrors: number;
    pagesWithWarnings: number;
    totalErrors: number;
    totalWarnings: number;
}): string {
    const lines: string[] = [];

    lines.push(`Validated ${stats.totalPages} page(s)`);

    if (stats.totalErrors === 0 && stats.totalWarnings === 0) {
        lines.push("✓ All schema markup is valid!");
        return lines.join("\n");
    }

    if (stats.totalErrors > 0) {
        lines.push(
            `✗ Found ${stats.totalErrors} error(s) across ${stats.pagesWithErrors} page(s)`
        );
    } else {
        lines.push("✓ No errors found");
    }

    if (stats.totalWarnings > 0) {
        lines.push(
            `⚠ Found ${stats.totalWarnings} warning(s) across ${stats.pagesWithWarnings} page(s)`
        );
    }

    return lines.join("\n");
}

// ==================== Detailed Report Generation ====================

/**
 * Generates a detailed text report of validation results
 * 
 * @param report - The comprehensive validation report
 * @returns Formatted text report
 */
export function generateDetailedReport(
    report: ComprehensiveValidationReport
): string {
    const lines: string[] = [];

    lines.push("=".repeat(60));
    lines.push("SCHEMA MARKUP VALIDATION REPORT");
    lines.push("=".repeat(60));
    lines.push("");
    lines.push(report.summary);
    lines.push("");

    if (report.totalErrors === 0 && report.totalWarnings === 0) {
        return lines.join("\n");
    }

    lines.push("-".repeat(60));
    lines.push("DETAILED RESULTS");
    lines.push("-".repeat(60));
    lines.push("");

    report.pageResults.forEach((pageResult, index) => {
        lines.push(`${index + 1}. ${pageResult.pageName}`);
        lines.push(`   Type: ${pageResult.pageType}`);
        lines.push(
            `   Status: ${pageResult.hasErrors ? "✗ ERRORS" : pageResult.hasWarnings ? "⚠ WARNINGS" : "✓ VALID"}`
        );

        if (pageResult.hasErrors || pageResult.hasWarnings) {
            lines.push("");
            pageResult.validations.forEach((validation, vIndex) => {
                if (validation.errors.length > 0 || validation.warnings.length > 0) {
                    lines.push(`   Schema ${vIndex + 1}:`);

                    validation.errors.forEach((error) => {
                        lines.push(`     ✗ ${error.field}: ${error.message}`);
                    });

                    validation.warnings.forEach((warning) => {
                        lines.push(`     ⚠ ${warning.field}: ${warning.message}`);
                    });
                }
            });

            // Add fix suggestions
            const allValidations = pageResult.validations.flat();
            const suggestions = allValidations
                .map(generateFixSuggestions)
                .flat()
                .filter((s, i, arr) => arr.indexOf(s) === i); // Remove duplicates

            if (suggestions.length > 0) {
                lines.push("");
                lines.push("   Fix Suggestions:");
                suggestions.forEach((suggestion) => {
                    lines.push(`     • ${suggestion}`);
                });
            }
        }

        lines.push("");
    });

    return lines.join("\n");
}

/**
 * Generates a JSON report of validation results
 * 
 * @param report - The comprehensive validation report
 * @returns JSON string
 */
export function generateJSONReport(
    report: ComprehensiveValidationReport
): string {
    return JSON.stringify(report, null, 2);
}

// ==================== Issue Extraction ====================

/**
 * Extracts all issues from a validation report
 * 
 * @param report - The comprehensive validation report
 * @returns Array of all issues with page context
 */
export function extractAllIssues(report: ComprehensiveValidationReport): Array<{
    page: string;
    pageType: string;
    severity: "error" | "warning";
    field: string;
    message: string;
}> {
    const issues: Array<{
        page: string;
        pageType: string;
        severity: "error" | "warning";
        field: string;
        message: string;
    }> = [];

    report.pageResults.forEach((pageResult) => {
        pageResult.validations.forEach((validation) => {
            validation.errors.forEach((error) => {
                issues.push({
                    page: pageResult.pageName,
                    pageType: pageResult.pageType,
                    severity: "error",
                    field: error.field,
                    message: error.message,
                });
            });

            validation.warnings.forEach((warning) => {
                issues.push({
                    page: pageResult.pageName,
                    pageType: pageResult.pageType,
                    severity: "warning",
                    field: warning.field,
                    message: warning.message,
                });
            });
        });
    });

    return issues;
}
