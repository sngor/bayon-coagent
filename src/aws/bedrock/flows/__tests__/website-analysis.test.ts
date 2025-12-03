/**
 * Basic tests for website analysis flow
 * 
 * Feature: website-analysis
 */

import { describe, it, expect } from '@jest/globals';
import { analyzeWebsite } from '../website-analysis';
import type { WebsiteAnalysisInput } from '@/ai/schemas/website-analysis-schemas';

describe('Website Analysis Flow', () => {
    describe('Basic Functionality', () => {
        it('should analyze a website and return valid structure', async () => {
            const input: WebsiteAnalysisInput = {
                userId: 'test-user-123',
                websiteUrl: 'https://example.com',
                profileData: {
                    name: 'John Smith',
                    address: '123 Main St, Austin, TX 78701',
                    phone: '512-555-1234',
                    email: 'john@example.com',
                },
            };

            const output = await analyzeWebsite(input);

            // Verify all required fields are present
            expect(output.id).toBeDefined();
            expect(output.userId).toBe(input.userId);
            expect(output.websiteUrl).toBe(input.websiteUrl);
            expect(output.analyzedAt).toBeDefined();
            expect(output.overallScore).toBeDefined();
            expect(output.scoreBreakdown).toBeDefined();
            expect(output.schemaMarkup).toBeDefined();
            expect(output.metaTags).toBeDefined();
            expect(output.napConsistency).toBeDefined();
            expect(output.recommendations).toBeDefined();
            expect(output.summary).toBeDefined();

            // Verify score is within bounds
            expect(output.overallScore).toBeGreaterThanOrEqual(0);
            expect(output.overallScore).toBeLessThanOrEqual(100);

            // Verify score breakdown is within bounds
            expect(output.scoreBreakdown.schemaMarkup).toBeGreaterThanOrEqual(0);
            expect(output.scoreBreakdown.schemaMarkup).toBeLessThanOrEqual(30);
            expect(output.scoreBreakdown.metaTags).toBeGreaterThanOrEqual(0);
            expect(output.scoreBreakdown.metaTags).toBeLessThanOrEqual(25);
            expect(output.scoreBreakdown.structuredData).toBeGreaterThanOrEqual(0);
            expect(output.scoreBreakdown.structuredData).toBeLessThanOrEqual(25);
            expect(output.scoreBreakdown.napConsistency).toBeGreaterThanOrEqual(0);
            expect(output.scoreBreakdown.napConsistency).toBeLessThanOrEqual(20);

            // Verify recommendations is an array
            expect(Array.isArray(output.recommendations)).toBe(true);

            // Verify each recommendation has required fields
            output.recommendations.forEach(rec => {
                expect(rec.id).toBeDefined();
                expect(rec.priority).toBeDefined();
                expect(['high', 'medium', 'low']).toContain(rec.priority);
                expect(rec.category).toBeDefined();
                expect(['schema_markup', 'meta_tags', 'structured_data', 'nap_consistency', 'technical_seo']).toContain(rec.category);
                expect(rec.title).toBeDefined();
                expect(rec.description).toBeDefined();
                expect(Array.isArray(rec.actionItems)).toBe(true);
                expect(rec.estimatedImpact).toBeGreaterThanOrEqual(0);
                expect(rec.estimatedImpact).toBeLessThanOrEqual(30);
                expect(['easy', 'moderate', 'difficult']).toContain(rec.effort);
            });
        }, 120000); // 2 minute timeout for crawling and API call

        it('should handle schema markup detection', async () => {
            const input: WebsiteAnalysisInput = {
                userId: 'test-user-456',
                websiteUrl: 'https://example.com',
                profileData: {
                    name: 'Jane Doe',
                    address: '456 Oak Ave, Seattle, WA 98101',
                    phone: '206-555-5678',
                },
            };

            const output = await analyzeWebsite(input);

            // Verify schema markup analysis
            expect(output.schemaMarkup).toBeDefined();
            expect(output.schemaMarkup.found).toBeDefined();
            expect(Array.isArray(output.schemaMarkup.types)).toBe(true);
            expect(typeof output.schemaMarkup.properties).toBe('object');
            expect(Array.isArray(output.schemaMarkup.issues)).toBe(true);
            expect(Array.isArray(output.schemaMarkup.recommendations)).toBe(true);
        }, 120000);

        it('should analyze meta tags', async () => {
            const input: WebsiteAnalysisInput = {
                userId: 'test-user-789',
                websiteUrl: 'https://example.com',
                profileData: {
                    name: 'Bob Johnson',
                },
            };

            const output = await analyzeWebsite(input);

            // Verify meta tags analysis
            expect(output.metaTags).toBeDefined();
            expect(output.metaTags.title).toBeDefined();
            expect(output.metaTags.title.length).toBeDefined();
            expect(output.metaTags.title.isOptimal).toBeDefined();
            expect(Array.isArray(output.metaTags.title.issues)).toBe(true);

            expect(output.metaTags.description).toBeDefined();
            expect(output.metaTags.description.length).toBeDefined();
            expect(output.metaTags.description.isOptimal).toBeDefined();
            expect(Array.isArray(output.metaTags.description.issues)).toBe(true);

            expect(output.metaTags.openGraph).toBeDefined();
            expect(output.metaTags.openGraph.found).toBeDefined();
            expect(typeof output.metaTags.openGraph.properties).toBe('object');
            expect(Array.isArray(output.metaTags.openGraph.issues)).toBe(true);

            expect(output.metaTags.twitterCard).toBeDefined();
            expect(output.metaTags.twitterCard.found).toBeDefined();
            expect(typeof output.metaTags.twitterCard.properties).toBe('object');
            expect(Array.isArray(output.metaTags.twitterCard.issues)).toBe(true);
        }, 120000);

        it('should check NAP consistency', async () => {
            const input: WebsiteAnalysisInput = {
                userId: 'test-user-101',
                websiteUrl: 'https://example.com',
                profileData: {
                    name: 'Sarah Williams',
                    address: '789 Pine St, Portland, OR 97201',
                    phone: '503-555-9012',
                    email: 'sarah@example.com',
                },
            };

            const output = await analyzeWebsite(input);

            // Verify NAP consistency analysis
            expect(output.napConsistency).toBeDefined();
            expect(output.napConsistency.name).toBeDefined();
            expect(output.napConsistency.name.matches).toBeDefined();
            expect(output.napConsistency.name.confidence).toBeGreaterThanOrEqual(0);
            expect(output.napConsistency.name.confidence).toBeLessThanOrEqual(1);

            expect(output.napConsistency.address).toBeDefined();
            expect(output.napConsistency.address.matches).toBeDefined();
            expect(output.napConsistency.address.confidence).toBeGreaterThanOrEqual(0);
            expect(output.napConsistency.address.confidence).toBeLessThanOrEqual(1);

            expect(output.napConsistency.phone).toBeDefined();
            expect(output.napConsistency.phone.matches).toBeDefined();
            expect(output.napConsistency.phone.confidence).toBeGreaterThanOrEqual(0);
            expect(output.napConsistency.phone.confidence).toBeLessThanOrEqual(1);

            expect(output.napConsistency.overallConsistency).toBeGreaterThanOrEqual(0);
            expect(output.napConsistency.overallConsistency).toBeLessThanOrEqual(100);
        }, 120000);
    });

    describe('Schema Validation', () => {
        it('should validate output structure', async () => {
            const input: WebsiteAnalysisInput = {
                userId: 'test-user-202',
                websiteUrl: 'https://example.com',
                profileData: {
                    name: 'Test Agent',
                },
            };

            const output = await analyzeWebsite(input);

            // Verify output structure matches schema
            expect(output).toHaveProperty('id');
            expect(output).toHaveProperty('userId');
            expect(output).toHaveProperty('websiteUrl');
            expect(output).toHaveProperty('analyzedAt');
            expect(output).toHaveProperty('overallScore');
            expect(output).toHaveProperty('scoreBreakdown');
            expect(output).toHaveProperty('schemaMarkup');
            expect(output).toHaveProperty('metaTags');
            expect(output).toHaveProperty('napConsistency');
            expect(output).toHaveProperty('recommendations');
            expect(output).toHaveProperty('summary');

            // Verify types
            expect(typeof output.id).toBe('string');
            expect(typeof output.userId).toBe('string');
            expect(typeof output.websiteUrl).toBe('string');
            expect(typeof output.analyzedAt).toBe('string');
            expect(typeof output.overallScore).toBe('number');
            expect(typeof output.scoreBreakdown).toBe('object');
            expect(typeof output.schemaMarkup).toBe('object');
            expect(typeof output.metaTags).toBe('object');
            expect(typeof output.napConsistency).toBe('object');
            expect(Array.isArray(output.recommendations)).toBe(true);
            expect(typeof output.summary).toBe('string');
        }, 120000);

        it('should generate valid ISO timestamp', async () => {
            const input: WebsiteAnalysisInput = {
                userId: 'test-user-303',
                websiteUrl: 'https://example.com',
                profileData: {
                    name: 'Test Agent',
                },
            };

            const output = await analyzeWebsite(input);

            // Verify timestamp is valid ISO format
            expect(output.analyzedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

            // Verify it can be parsed as a date
            const date = new Date(output.analyzedAt);
            expect(date.toString()).not.toBe('Invalid Date');
        }, 120000);
    });

    describe('Error Handling', () => {
        it('should handle invalid URLs gracefully', async () => {
            const input: WebsiteAnalysisInput = {
                userId: 'test-user-404',
                websiteUrl: 'https://this-domain-definitely-does-not-exist-12345.com',
                profileData: {
                    name: 'Test Agent',
                },
            };

            const output = await analyzeWebsite(input);

            // Should return fallback response with error recommendation
            expect(output).toBeDefined();
            expect(output.overallScore).toBe(0);
            expect(output.recommendations.length).toBeGreaterThan(0);

            // Should have an error-related recommendation
            const errorRec = output.recommendations.find(r => r.category === 'technical_seo');
            expect(errorRec).toBeDefined();
        }, 120000);
    });
});
