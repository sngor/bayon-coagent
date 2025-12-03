/**
 * Basic tests for topic extraction flow
 * 
 * Feature: ai-search-monitoring
 */

import { describe, it, expect } from '@jest/globals';
import { extractTopics } from '../extract-topics';
import type { ExtractTopicsInput } from '@/ai/schemas/ai-monitoring-schemas';

describe('Topic Extraction Flow', () => {
    describe('Basic Functionality', () => {
        it('should aggregate topics across multiple mentions', async () => {
            const input: ExtractTopicsInput = {
                mentions: [
                    {
                        topics: ['luxury homes', 'waterfront properties', 'negotiation'],
                        contextSnippet: 'Known for luxury home sales and waterfront properties.',
                    },
                    {
                        topics: ['luxury homes', 'first-time buyers', 'market expertise'],
                        contextSnippet: 'Specializes in luxury homes and helping first-time buyers.',
                    },
                    {
                        topics: ['luxury homes', 'investment properties', 'negotiation'],
                        contextSnippet: 'Expert in luxury real estate and investment properties.',
                    },
                ],
            };

            const output = await extractTopics(input);

            // Verify topics are returned
            expect(output.topics).toBeDefined();
            expect(Array.isArray(output.topics)).toBe(true);
            expect(output.topics.length).toBeGreaterThan(0);

            // Verify each topic has required fields
            output.topics.forEach(topic => {
                expect(topic).toHaveProperty('topic');
                expect(topic).toHaveProperty('count');
                expect(topic).toHaveProperty('examples');
                expect(typeof topic.topic).toBe('string');
                expect(typeof topic.count).toBe('number');
                expect(Array.isArray(topic.examples)).toBe(true);
            });

            // Verify topics are sorted by count (descending)
            for (let i = 0; i < output.topics.length - 1; i++) {
                expect(output.topics[i].count).toBeGreaterThanOrEqual(output.topics[i + 1].count);
            }
        }, 60000); // 1 minute timeout for API call

        it('should provide example quotes for each topic', async () => {
            const input: ExtractTopicsInput = {
                mentions: [
                    {
                        topics: ['buyer representation', 'local market knowledge'],
                        contextSnippet: 'Excellent buyer representation with deep local market knowledge.',
                    },
                    {
                        topics: ['buyer representation', 'negotiation skills'],
                        contextSnippet: 'Strong buyer representation and negotiation skills.',
                    },
                ],
            };

            const output = await extractTopics(input);

            // Verify each topic has examples
            output.topics.forEach(topic => {
                expect(topic.examples.length).toBeGreaterThan(0);
                expect(topic.examples.every(ex => typeof ex === 'string')).toBe(true);
                expect(topic.examples.every(ex => ex.length > 0)).toBe(true);
            });
        }, 60000);

        it('should handle mentions with diverse topics', async () => {
            const input: ExtractTopicsInput = {
                mentions: [
                    {
                        topics: ['luxury real estate', 'waterfront homes', 'high-end properties'],
                        contextSnippet: 'Specializes in luxury waterfront estates.',
                    },
                    {
                        topics: ['first-time buyers', 'affordable housing', 'buyer education'],
                        contextSnippet: 'Helps first-time buyers navigate the market.',
                    },
                    {
                        topics: ['investment properties', 'rental analysis', 'ROI calculation'],
                        contextSnippet: 'Expert in investment property analysis.',
                    },
                ],
            };

            const output = await extractTopics(input);

            // Verify diverse topics are captured
            expect(output.topics.length).toBeGreaterThan(0);

            // Verify each topic has a count
            output.topics.forEach(topic => {
                expect(topic.count).toBeGreaterThan(0);
            });
        }, 60000);

        it('should limit results to top topics', async () => {
            const input: ExtractTopicsInput = {
                mentions: Array.from({ length: 20 }, (_, i) => ({
                    topics: [`topic-${i}`, `topic-${i + 1}`, `topic-${i + 2}`],
                    contextSnippet: `Context for topic ${i}`,
                })),
            };

            const output = await extractTopics(input);

            // Verify results are limited (should be <= 10)
            expect(output.topics.length).toBeLessThanOrEqual(10);
        }, 60000);
    });

    describe('Edge Cases', () => {
        it('should handle empty mentions array', async () => {
            const input: ExtractTopicsInput = {
                mentions: [],
            };

            const output = await extractTopics(input);

            // Should return empty topics array
            expect(output.topics).toBeDefined();
            expect(Array.isArray(output.topics)).toBe(true);
            expect(output.topics.length).toBe(0);
        });

        it('should handle mentions with no topics', async () => {
            const input: ExtractTopicsInput = {
                mentions: [
                    {
                        topics: [],
                        contextSnippet: 'Some context without topics.',
                    },
                ],
            };

            const output = await extractTopics(input);

            // Should return empty topics array
            expect(output.topics).toBeDefined();
            expect(Array.isArray(output.topics)).toBe(true);
            expect(output.topics.length).toBe(0);
        });

        it('should handle single mention', async () => {
            const input: ExtractTopicsInput = {
                mentions: [
                    {
                        topics: ['luxury homes', 'waterfront properties'],
                        contextSnippet: 'Specializes in luxury waterfront homes.',
                    },
                ],
            };

            const output = await extractTopics(input);

            // Should still return topics
            expect(output.topics.length).toBeGreaterThan(0);
        }, 60000);
    });

    describe('Schema Validation', () => {
        it('should validate output structure', async () => {
            const input: ExtractTopicsInput = {
                mentions: [
                    {
                        topics: ['test topic'],
                        contextSnippet: 'Test context',
                    },
                ],
            };

            const output = await extractTopics(input);

            // Verify output structure matches schema
            expect(output).toHaveProperty('topics');
            expect(Array.isArray(output.topics)).toBe(true);

            // Verify each topic has correct structure
            output.topics.forEach(topic => {
                expect(topic).toHaveProperty('topic');
                expect(topic).toHaveProperty('count');
                expect(topic).toHaveProperty('examples');
                expect(typeof topic.topic).toBe('string');
                expect(typeof topic.count).toBe('number');
                expect(Array.isArray(topic.examples)).toBe(true);
            });
        }, 60000);
    });
});
