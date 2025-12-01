import { z } from 'zod';

/**
 * Validation severity enum schema
 */
export const ValidationSeveritySchema = z.enum(['critical', 'warning', 'info']);

/**
 * Validation issue schema
 */
export const ValidationIssueSchema = z.object({
    severity: ValidationSeveritySchema,
    category: z.string(),
    message: z.string(),
    suggestion: z.string().optional(),
    location: z.string().optional(),
});

/**
 * Validation result schema
 */
export const ValidationResultSchema = z.object({
    passed: z.boolean(),
    score: z.number().min(0).max(100),
    issues: z.array(ValidationIssueSchema),
    summary: z.string(),
    recommendations: z.array(z.string()).optional(),
});

/**
 * Validation configuration schema
 */
export const ValidationConfigSchema = z.object({
    validateGoalAlignment: z.boolean().optional(),
    userGoal: z.string().optional(),
    minQualityScore: z.number().min(0).max(100).optional(),
    checkCompleteness: z.boolean().optional(),
    checkCoherence: z.boolean().optional(),
    checkProfessionalism: z.boolean().optional(),
    enforceGuardrails: z.boolean().optional(),
    checkDomainCompliance: z.boolean().optional(),
    checkEthicalCompliance: z.boolean().optional(),
    expectedFormat: z.enum(['markdown', 'html', 'plain', 'json']).optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    requiredElements: z.array(z.string()).optional(),
    checkFactualConsistency: z.boolean().optional(),
    checkToneAndStyle: z.boolean().optional(),
    targetAudience: z.string().optional(),
    strictMode: z.boolean().optional(),
});

export type ValidationSeverity = z.infer<typeof ValidationSeveritySchema>;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type ValidationConfig = z.infer<typeof ValidationConfigSchema>;
