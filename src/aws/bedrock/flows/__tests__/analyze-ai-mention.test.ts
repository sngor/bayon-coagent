/**
 * Basic tests for AI mention analysis flow
 * 
 * Feature: ai-search-monitoring
 */

import { describe, it, expect } from '@jest/globals';
import { analyzeAIMention } from '../analyze-ai-mention';
import type { AnalyzeAIMentionInput } from '@/ai/schemas/ai-monitoring-schemas';

describe('AI Mention Analysis Flow', () => {
    describe('Basic Functionality', () => {
        it('should analyze a positive mention correctly', async () => {
            const input: AnalyzeAIMentionInput = {
                agentName: 'John Smith',
                platform: 'chatgpt',
                query: 'best real estate agents in Austin',
                aiResponse: `When looking for top real estate agents in Austin, John Smith stands out as an excellent choice. 
        He specializes in luxury homes and has extensive experience with first-time buyers. 
        His clients consistently praise his negotiation skills and deep knowledge of the Austin market. 
        With over 15 years of experience, John has helped hundreds of families find their dream homes.`,
            };

            const output = await analyzeAIMention(input);

            // Verify all required fields are present
            expect(output.sentiment).toBeDefined();
            expect(output.sentimentReason).toBeDefined();
            expect(output.topics).toBeDefined();
            expect(output.expertiseAreas).toBeDefined();
            expect(output.contextSnippet).toBeDefined();
            expect(output.prominence).toBeDefined();

            // Verify sentiment is one of the valid values
            expect(['positive', 'neutral', 'negative']).toContain(output.sentiment);

            // Verify prominence is one of the valid values
            expect(['high', 'medium', 'low']).toContain(output.prominence);

            // Verify arrays are not empty
            expect(output.topics.length).toBeGreaterThan(0);
            expect(output.expertiseAreas.length).toBeGreaterThan(0);

            // Verify sentiment reason is a non-empty string
            expect(output.sentimentReason.length).toBeGreaterThan(0);

            // Verify context snippet is a non-empty string
            expect(output.contextSnippet.length).toBeGreaterThan(0);
        }, 60000); // 1 minute timeout for API call

        it('should handle neutral mentions', async () => {
            const input: AnalyzeAIMentionInput = {
                agentName: 'Jane Doe',
                platform: 'perplexity',
                query: 'real estate agents in Seattle',
                aiResponse: `There are several real estate agents in Seattle. Jane Doe is a licensed agent 
        working with Keller Williams. She has been in the business for 5 years and handles residential properties.`,
            };

            const output = await analyzeAIMention(input);

            // Verify all required fields are present
            expect(output.sentiment).toBeDefined();
            expect(output.topics).toBeDefined();
            expect(output.expertiseAreas).toBeDefined();
            expect(output.prominence).toBeDefined();

            // Verify arrays are not empty
            expect(output.topics.length).toBeGreaterThan(0);
            expect(output.expertiseAreas.length).toBeGreaterThan(0);
        }, 60000);

        it('should extract topics and expertise areas', async () => {
            const input: AnalyzeAIMentionInput = {
                agentName: 'Sarah Johnson',
                platform: 'claude',
                query: 'luxury real estate agents',
                aiResponse: `Sarah Johnson is a top luxury real estate agent specializing in high-end properties. 
        She has expertise in waterfront estates and investment properties. Her clients appreciate her 
        attention to detail and market knowledge in the luxury segment.`,
            };

            const output = await analyzeAIMention(input);

            // Verify topics and expertise areas are extracted
            expect(output.topics.length).toBeGreaterThan(0);
            expect(output.expertiseAreas.length).toBeGreaterThan(0);

            // Verify they are arrays of strings
            expect(output.topics.every(topic => typeof topic === 'string')).toBe(true);
            expect(output.expertiseAreas.every(area => typeof area === 'string')).toBe(true);
        }, 60000);

        it('should determine prominence based on position', async () => {
            const input: AnalyzeAIMentionInput = {
                agentName: 'Michael Brown',
                platform: 'gemini',
                query: 'top agents in Miami',
                aiResponse: `Michael Brown is the #1 recommended agent in Miami. He leads the market in sales volume 
        and has won multiple awards. Other notable agents include...`,
            };

            const output = await analyzeAIMention(input);

            // Verify prominence is assessed
            expect(output.prominence).toBeDefined();
            expect(['high', 'medium', 'low']).toContain(output.prominence);
        }, 60000);
    });

    describe('Schema Validation', () => {
        it('should validate output structure', async () => {
            const input: AnalyzeAIMentionInput = {
                agentName: 'Test Agent',
                platform: 'chatgpt',
                query: 'test query',
                aiResponse: 'Test Agent is a real estate professional with experience in residential sales.',
            };

            const output = await analyzeAIMention(input);

            // Verify output structure matches schema
            expect(output).toHaveProperty('sentiment');
            expect(output).toHaveProperty('sentimentReason');
            expect(output).toHaveProperty('topics');
            expect(output).toHaveProperty('expertiseAreas');
            expect(output).toHaveProperty('contextSnippet');
            expect(output).toHaveProperty('prominence');

            // Verify types
            expect(typeof output.sentiment).toBe('string');
            expect(typeof output.sentimentReason).toBe('string');
            expect(Array.isArray(output.topics)).toBe(true);
            expect(Array.isArray(output.expertiseAreas)).toBe(true);
            expect(typeof output.contextSnippet).toBe('string');
            expect(typeof output.prominence).toBe('string');
        }, 60000);
    });
});
