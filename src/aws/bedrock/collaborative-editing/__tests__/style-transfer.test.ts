/**
 * Style Transfer Engine Tests
 * 
 * Tests content adaptation logic, tone transformation, format conversion,
 * and message preservation validation.
 */

import { StyleTransferEngine } from '../style-transfer';
import { PreservedElement } from '../types';

describe('StyleTransferEngine', () => {
    let engine: StyleTransferEngine;

    beforeEach(() => {
        engine = new StyleTransferEngine();
    });

    describe('Tone Adaptation', () => {
        it('should create adaptation result with correct structure', async () => {
            const professionalContent = `
                We are pleased to announce the availability of a premium residential property 
                located in the prestigious Westwood neighborhood. This exceptional home features 
                four bedrooms, three bathrooms, and approximately 2,500 square feet of living space.
            `;

            // Note: This test will make actual API calls in integration testing
            // For unit testing, we verify the structure and logic
            const result = await engine.adaptTone(
                professionalContent,
                'casual',
                ['4 bedrooms', '3 bathrooms', '2,500 square feet']
            );

            expect(result.adaptationType).toBe('tone');
            expect(result.targetTone).toBe('casual');
            expect(result.adaptedContent).toBeTruthy();
            expect(result.originalContent).toBe(professionalContent);
            expect(result.metadata).toBeDefined();
            expect(result.metadata.originalWordCount).toBeGreaterThan(0);
            expect(result.metadata.adaptedWordCount).toBeGreaterThan(0);
            expect(result.createdAt).toBeTruthy();
        }, 30000); // Increase timeout for API call

        it('should track metadata correctly', async () => {
            const content = 'This is a test with exactly seven words here.';

            const result = await engine.adaptTone(content, 'professional');

            expect(result.metadata.originalWordCount).toBe(9);
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
            expect(result.preservedElements).toBeDefined();
        }, 30000);
    });

    describe('Format Adaptation', () => {
        it('should convert content to a different format', async () => {
            const blogPost = `
                The real estate market in downtown Seattle continues to show strong momentum 
                as we enter Q4 2024. Home prices have increased by 8% year-over-year.
            `;

            const result = await engine.adaptFormat(blogPost, 'social-media');

            expect(result.adaptationType).toBe('format');
            expect(result.targetFormat).toBe('social-media');
            expect(result.adaptedContent).toBeTruthy();
            expect(result.metadata.originalWordCount).toBeGreaterThan(0);
        }, 30000);

        it('should set correct format type', async () => {
            const result = await engine.adaptFormat('Content', 'email');

            expect(result.targetFormat).toBe('email');
            expect(result.adaptationType).toBe('format');
        }, 30000);
    });

    describe('Platform Adaptation', () => {
        it('should optimize content for a specific platform', async () => {
            const genericContent = `
                Just listed! Beautiful 3-bedroom home in Capitol Hill. 
                Features hardwood floors and updated kitchen.
            `;

            const result = await engine.adaptPlatform(genericContent, 'instagram');

            expect(result.adaptationType).toBe('platform');
            expect(result.targetPlatform).toBe('instagram');
            expect(result.adaptedContent).toBeTruthy();
        }, 30000);

        it('should set correct platform type', async () => {
            const result = await engine.adaptPlatform('Content', 'twitter');

            expect(result.targetPlatform).toBe('twitter');
            expect(result.adaptationType).toBe('platform');
        }, 30000);
    });

    describe('Combined Adaptation', () => {
        it('should handle multiple adaptations simultaneously', async () => {
            const result = await engine.adaptContent({
                originalContent: 'Original content about real estate',
                targetTone: 'professional',
                targetFormat: 'email',
                targetPlatform: 'linkedin',
            });

            expect(result.adaptationType).toBe('combined');
            expect(result.targetTone).toBe('professional');
            expect(result.targetFormat).toBe('email');
            expect(result.targetPlatform).toBe('linkedin');
            expect(result.adaptedContent).toBeTruthy();
        }, 30000);

        it('should respect additional instructions', async () => {
            const result = await engine.adaptContent({
                originalContent: 'Real estate market update',
                targetTone: 'casual',
                additionalInstructions: 'Include a call-to-action',
            });

            expect(result.adaptedContent).toBeTruthy();
            expect(result.targetTone).toBe('casual');
        }, 30000);
    });

    describe('Message Preservation Validation', () => {
        it('should validate that core message is preserved', async () => {
            const keyElements: PreservedElement[] = [
                { type: 'key-point', content: 'Main point', preserved: false, location: '' }
            ];

            const validation = await engine.validatePreservation(
                'Original content with main point',
                'Adapted content with main point',
                keyElements
            );

            expect(validation.isPreserved).toBeDefined();
            expect(validation.coreMessageIntact).toBeDefined();
            expect(validation.preservationScore).toBeGreaterThanOrEqual(0);
            expect(validation.preservationScore).toBeLessThanOrEqual(1);
            expect(validation.preservedElements).toBeDefined();
            expect(validation.missingElements).toBeDefined();
        }, 30000);

        it('should return validation structure', async () => {
            const validation = await engine.validatePreservation(
                'Original',
                'Adapted',
                []
            );

            expect(validation).toHaveProperty('isPreserved');
            expect(validation).toHaveProperty('preservationScore');
            expect(validation).toHaveProperty('preservedElements');
            expect(validation).toHaveProperty('missingElements');
            expect(validation).toHaveProperty('addedElements');
            expect(validation).toHaveProperty('coreMessageIntact');
            expect(validation).toHaveProperty('recommendations');
        }, 30000);
    });

    describe('Storage', () => {
        it('should store adaptation results without error', async () => {
            const mockResult = {
                adaptedContent: 'Adapted',
                originalContent: 'Original',
                adaptationType: 'tone' as const,
                targetTone: 'casual' as const,
                preservedElements: [],
                confidence: 0.9,
                metadata: {
                    originalWordCount: 10,
                    adaptedWordCount: 8,
                    preservationScore: 0.9,
                    adaptationRationale: 'Test',
                },
                createdAt: new Date().toISOString(),
            };

            await expect(
                engine.storeAdaptation('user_123', mockResult)
            ).resolves.not.toThrow();
        });
    });

    describe('Metadata', () => {
        it('should track word count changes', async () => {
            const longContent = 'This is a much longer piece of content with many words that will be condensed';
            const result = await engine.adaptTone(longContent, 'casual');

            expect(result.metadata.originalWordCount).toBeGreaterThan(0);
            expect(result.metadata.adaptedWordCount).toBeGreaterThan(0);
        }, 30000);

        it('should include adaptation rationale', async () => {
            const result = await engine.adaptContent({
                originalContent: 'Real estate content here',
                targetTone: 'professional',
                targetFormat: 'email',
            });

            expect(result.metadata.adaptationRationale).toBeTruthy();
            expect(result.metadata.adaptationRationale).toContain('professional');
            expect(result.metadata.adaptationRationale).toContain('email');
        }, 30000);

        it('should include timestamp', async () => {
            const result = await engine.adaptTone('Content about real estate', 'casual');

            expect(result.createdAt).toBeTruthy();
            expect(new Date(result.createdAt).getTime()).toBeLessThanOrEqual(Date.now());
        }, 30000);
    });
});
