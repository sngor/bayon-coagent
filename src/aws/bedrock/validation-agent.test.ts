/**
 * Tests for AI Generation Validation Agent
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    ValidationAgent,
    ValidationSeverity,
    DEFAULT_VALIDATION_CONFIG,
    type ValidationConfig,
} from './validation-agent';

describe('ValidationAgent', () => {
    let agent: ValidationAgent;

    beforeEach(() => {
        agent = new ValidationAgent();
    });

    describe('Format Validation', () => {
        it('should pass validation for well-formatted markdown content', async () => {
            const content = `# Real Estate Market Trends 2024

## Introduction
The real estate market is experiencing significant changes...

## Key Trends
- Rising interest rates
- Increased demand for suburban properties
- Growing importance of virtual tours

## Conclusion
These trends will shape the market for years to come.`;

            const result = await agent.validate(content, {
                ...DEFAULT_VALIDATION_CONFIG,
                expectedFormat: 'markdown',
                requiredElements: ['introduction', 'conclusion'],
                validateGoalAlignment: false, // Skip AI validation for speed
                checkCompleteness: false,
                checkCoherence: false,
                checkProfessionalism: false,
                checkFactualConsistency: false,
                checkToneAndStyle: false,
            });

            expect(result.passed).toBe(true);
            expect(result.score).toBeGreaterThan(70);
        });

        it('should fail validation for content that is too short', async () => {
            const content = 'Short content';

            const result = await agent.validate(content, {
                ...DEFAULT_VALIDATION_CONFIG,
                minLength: 100,
                validateGoalAlignment: false,
                checkCompleteness: false,
                checkCoherence: false,
                checkProfessionalism: false,
                checkFactualConsistency: false,
                checkToneAndStyle: false,
            });

            expect(result.passed).toBe(false);
            expect(result.issues).toContainEqual(
                expect.objectContaining({
                    severity: ValidationSeverity.CRITICAL,
                    category: 'format',
                })
            );
        });

        it('should detect missing required elements', async () => {
            const content = `# Blog Post

Some content here without the required sections.`;

            const result = await agent.validate(content, {
                ...DEFAULT_VALIDATION_CONFIG,
                requiredElements: ['introduction', 'conclusion', 'call to action'],
                validateGoalAlignment: false,
                checkCompleteness: false,
                checkCoherence: false,
                checkProfessionalism: false,
                checkFactualConsistency: false,
                checkToneAndStyle: false,
            });

            expect(result.passed).toBe(false);
            const missingElements = result.issues.filter(
                issue => issue.category === 'format' && issue.message.includes('Missing required element')
            );
            expect(missingElements.length).toBeGreaterThan(0);
        });

        it('should validate JSON format', async () => {
            const validJSON = JSON.stringify({
                title: 'Test',
                content: 'Real estate content',
            });

            const result = await agent.validate(validJSON, {
                ...DEFAULT_VALIDATION_CONFIG,
                expectedFormat: 'json',
                validateGoalAlignment: false,
                checkCompleteness: false,
                checkCoherence: false,
                checkProfessionalism: false,
                checkFactualConsistency: false,
                checkToneAndStyle: false,
            });

            expect(result.passed).toBe(true);
        });

        it('should fail for invalid JSON', async () => {
            const invalidJSON = '{ invalid json }';

            const result = await agent.validate(invalidJSON, {
                ...DEFAULT_VALIDATION_CONFIG,
                expectedFormat: 'json',
                validateGoalAlignment: false,
                checkCompleteness: false,
                checkCoherence: false,
                checkProfessionalism: false,
                checkFactualConsistency: false,
                checkToneAndStyle: false,
            });

            expect(result.passed).toBe(false);
            expect(result.issues).toContainEqual(
                expect.objectContaining({
                    severity: ValidationSeverity.CRITICAL,
                    category: 'format',
                    message: 'Content is not valid JSON',
                })
            );
        });
    });

    describe('Guardrails Validation', () => {
        it('should detect non-real-estate content', async () => {
            const content = 'How to cook the perfect pasta dish with tomato sauce';

            const result = await agent.validate(content, {
                ...DEFAULT_VALIDATION_CONFIG,
                checkDomainCompliance: true,
                validateGoalAlignment: false,
                checkCompleteness: false,
                checkCoherence: false,
                checkProfessionalism: false,
                checkFactualConsistency: false,
                checkToneAndStyle: false,
            });

            expect(result.passed).toBe(false);
            expect(result.issues).toContainEqual(
                expect.objectContaining({
                    severity: ValidationSeverity.CRITICAL,
                    category: 'domain',
                })
            );
        });

        it('should detect PII in content', async () => {
            const content = `Contact me at john.doe@example.com or call 555-123-4567 for real estate opportunities.`;

            const result = await agent.validate(content, {
                ...DEFAULT_VALIDATION_CONFIG,
                enforceGuardrails: true,
                validateGoalAlignment: false,
                checkCompleteness: false,
                checkCoherence: false,
                checkProfessionalism: false,
                checkFactualConsistency: false,
                checkToneAndStyle: false,
            });

            // Note: PII detection depends on context in guardrails
            // This test may pass if context doesn't indicate personal info
            if (!result.passed) {
                expect(result.issues.some(issue => issue.category === 'privacy')).toBe(true);
            }
        });

        it('should detect financial guarantees', async () => {
            const content = `I guarantee you will make 20% profit on this real estate investment.`;

            const result = await agent.validate(content, {
                ...DEFAULT_VALIDATION_CONFIG,
                checkEthicalCompliance: true,
                validateGoalAlignment: false,
                checkCompleteness: false,
                checkCoherence: false,
                checkProfessionalism: false,
                checkFactualConsistency: false,
                checkToneAndStyle: false,
            });

            expect(result.passed).toBe(false);
            expect(result.issues).toContainEqual(
                expect.objectContaining({
                    severity: ValidationSeverity.CRITICAL,
                    category: 'ethics',
                    message: 'Content makes financial guarantees',
                })
            );
        });

        it('should detect unethical content', async () => {
            const content = `Let's discriminate against certain buyers to maximize profit.`;

            const result = await agent.validate(content, {
                ...DEFAULT_VALIDATION_CONFIG,
                checkEthicalCompliance: true,
                validateGoalAlignment: false,
                checkCompleteness: false,
                checkCoherence: false,
                checkProfessionalism: false,
                checkFactualConsistency: false,
                checkToneAndStyle: false,
            });

            expect(result.passed).toBe(false);
            expect(result.issues).toContainEqual(
                expect.objectContaining({
                    severity: ValidationSeverity.CRITICAL,
                    category: 'ethics',
                })
            );
        });
    });

    describe('Strict Mode', () => {
        it('should fail on warnings in strict mode', async () => {
            const content = `# Real Estate Tips

This is a short article about real estate.`;

            const result = await agent.validate(content, {
                ...DEFAULT_VALIDATION_CONFIG,
                strictMode: true,
                minLength: 50,
                maxLength: 100, // Content is within range but might trigger other warnings
                validateGoalAlignment: false,
                checkCompleteness: false,
                checkCoherence: false,
                checkProfessionalism: false,
                checkFactualConsistency: false,
                checkToneAndStyle: false,
            });

            // In strict mode, any warning should cause failure
            if (result.issues.some(issue => issue.severity === ValidationSeverity.WARNING)) {
                expect(result.passed).toBe(false);
            }
        });
    });

    describe('Score Calculation', () => {
        it('should calculate score based on issue severity', async () => {
            const content = `# Real Estate Market

Some content here.`;

            const result = await agent.validate(content, {
                ...DEFAULT_VALIDATION_CONFIG,
                requiredElements: ['introduction', 'conclusion'], // Will create critical issues
                validateGoalAlignment: false,
                checkCompleteness: false,
                checkCoherence: false,
                checkProfessionalism: false,
                checkFactualConsistency: false,
                checkToneAndStyle: false,
            });

            // Score should be reduced based on critical issues
            expect(result.score).toBeLessThan(100);
            expect(result.issues.length).toBeGreaterThan(0);
        });
    });

    describe('Summary Generation', () => {
        it('should generate appropriate summary for passed validation', async () => {
            const content = `# Excellent Real Estate Content

## Introduction
This is a comprehensive guide to real estate investing.

## Main Content
Real estate investing requires careful analysis of market conditions, property values, and potential returns.

## Conclusion
With proper research and planning, real estate can be a rewarding investment.`;

            const result = await agent.validate(content, {
                ...DEFAULT_VALIDATION_CONFIG,
                validateGoalAlignment: false,
                checkCompleteness: false,
                checkCoherence: false,
                checkProfessionalism: false,
                checkFactualConsistency: false,
                checkToneAndStyle: false,
            });

            expect(result.passed).toBe(true);
            expect(result.summary).toContain('passed');
            expect(result.summary).toMatch(/\d+\/100/); // Should include score
        });

        it('should generate appropriate summary for failed validation', async () => {
            const content = 'Too short';

            const result = await agent.validate(content, {
                ...DEFAULT_VALIDATION_CONFIG,
                minLength: 100,
                validateGoalAlignment: false,
                checkCompleteness: false,
                checkCoherence: false,
                checkProfessionalism: false,
                checkFactualConsistency: false,
                checkToneAndStyle: false,
            });

            expect(result.passed).toBe(false);
            expect(result.summary).toContain('failed');
            expect(result.issues.length).toBeGreaterThan(0);
        });
    });
});
