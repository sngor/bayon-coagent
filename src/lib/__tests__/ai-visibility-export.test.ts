/**
 * Tests for AI Visibility Export Module
 */

import { describe, it, expect } from '@jest/globals';
import { generatePDFReport, generateExportFilename, type AIVisibilityExportData } from '../ai-visibility-export';
import type { AIMention, AIVisibilityScore } from '@/lib/types/common/common';

describe('AI Visibility Export', () => {
    // Sample test data
    const mockVisibilityScore: AIVisibilityScore = {
        id: 'score-1',
        userId: 'user-123',
        score: 75.5,
        breakdown: {
            mentionFrequency: 20,
            sentimentScore: 18,
            prominenceScore: 22,
            platformDiversity: 15.5,
        },
        mentionCount: 15,
        sentimentDistribution: {
            positive: 10,
            neutral: 3,
            negative: 2,
        },
        platformBreakdown: {
            chatgpt: 5,
            perplexity: 4,
            claude: 3,
            gemini: 3,
        },
        trend: 'up',
        trendPercentage: 12.5,
        previousScore: 63,
        calculatedAt: '2024-01-15T10:00:00Z',
        periodStart: '2024-01-01T00:00:00Z',
        periodEnd: '2024-01-15T00:00:00Z',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    const mockMentions: AIMention[] = [
        {
            id: 'mention-1',
            userId: 'user-123',
            platform: 'chatgpt',
            query: 'best real estate agents in Seattle',
            queryCategory: 'general',
            response: 'Full response text here...',
            snippet: 'John Doe is a highly recommended agent in Seattle...',
            sentiment: 'positive',
            sentimentReason: 'Positive language and recommendation',
            topics: ['expertise', 'local knowledge'],
            expertiseAreas: ['luxury homes', 'first-time buyers'],
            prominence: 'high',
            position: 150,
            timestamp: '2024-01-10T14:30:00Z',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            id: 'mention-2',
            userId: 'user-123',
            platform: 'perplexity',
            query: 'top agents for luxury homes',
            queryCategory: 'expertise',
            response: 'Another response...',
            snippet: 'John Doe specializes in luxury properties...',
            sentiment: 'positive',
            sentimentReason: 'Highlights specialization',
            topics: ['luxury', 'expertise'],
            expertiseAreas: ['luxury homes'],
            prominence: 'medium',
            position: 200,
            timestamp: '2024-01-12T09:15:00Z',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
    ];

    const mockCompetitorData = [
        {
            name: 'Jane Smith',
            score: 82.3,
            mentionCount: 20,
            sentimentDistribution: {
                positive: 15,
                neutral: 3,
                negative: 2,
            },
        },
        {
            name: 'John Doe',
            score: 75.5,
            mentionCount: 15,
            sentimentDistribution: {
                positive: 10,
                neutral: 3,
                negative: 2,
            },
        },
    ];

    const mockExportData: AIVisibilityExportData = {
        visibilityScore: mockVisibilityScore,
        mentions: mockMentions,
        competitorData: mockCompetitorData,
        dateRange: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-15T00:00:00Z',
        },
        agentName: 'John Doe',
    };

    describe('generatePDFReport', () => {
        it('should generate a PDF buffer', async () => {
            const pdfBuffer = await generatePDFReport(mockExportData);

            expect(pdfBuffer).toBeInstanceOf(Buffer);
            expect(pdfBuffer.length).toBeGreaterThan(0);
        });

        it('should generate PDF with correct header', async () => {
            const pdfBuffer = await generatePDFReport(mockExportData);
            const pdfString = pdfBuffer.toString('latin1');

            // PDF should start with PDF header
            expect(pdfString).toMatch(/^%PDF-/);
        });

        it('should handle export data without competitor data', async () => {
            const dataWithoutCompetitors = {
                ...mockExportData,
                competitorData: undefined,
            };

            const pdfBuffer = await generatePDFReport(dataWithoutCompetitors);

            expect(pdfBuffer).toBeInstanceOf(Buffer);
            expect(pdfBuffer.length).toBeGreaterThan(0);
        });

        it('should handle export data with no mentions', async () => {
            const dataWithoutMentions = {
                ...mockExportData,
                mentions: [],
            };

            const pdfBuffer = await generatePDFReport(dataWithoutMentions);

            expect(pdfBuffer).toBeInstanceOf(Buffer);
            expect(pdfBuffer.length).toBeGreaterThan(0);
        });

        it('should handle export data with many mentions', async () => {
            const manyMentions = Array(10).fill(null).map((_, i) => ({
                ...mockMentions[0],
                id: `mention-${i}`,
                timestamp: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
            }));

            const dataWithManyMentions = {
                ...mockExportData,
                mentions: manyMentions,
            };

            const pdfBuffer = await generatePDFReport(dataWithManyMentions);

            expect(pdfBuffer).toBeInstanceOf(Buffer);
            expect(pdfBuffer.length).toBeGreaterThan(0);
        });

        it('should include visibility score in PDF', async () => {
            const pdfBuffer = await generatePDFReport(mockExportData);
            const pdfString = pdfBuffer.toString('latin1');

            // Check for score value (as string in PDF)
            expect(pdfString).toContain('75.5');
        });

        it('should include agent name in PDF', async () => {
            const pdfBuffer = await generatePDFReport(mockExportData);
            const pdfString = pdfBuffer.toString('latin1');

            expect(pdfString).toContain('John Doe');
        });
    });

    describe('generateExportFilename', () => {
        it('should generate filename with agent name and date range', () => {
            const filename = generateExportFilename('John Doe', {
                start: '2024-01-01T00:00:00Z',
                end: '2024-01-15T00:00:00Z',
            });

            expect(filename).toBe('ai_visibility_john_doe_2024-01-01_to_2024-01-15.pdf');
        });

        it('should sanitize agent name with special characters', () => {
            const filename = generateExportFilename('John O\'Brien & Associates', {
                start: '2024-01-01T00:00:00Z',
                end: '2024-01-15T00:00:00Z',
            });

            expect(filename).toBe('ai_visibility_john_o_brien___associates_2024-01-01_to_2024-01-15.pdf');
        });

        it('should handle agent names with spaces', () => {
            const filename = generateExportFilename('Jane Marie Smith', {
                start: '2024-01-01T00:00:00Z',
                end: '2024-01-15T00:00:00Z',
            });

            expect(filename).toBe('ai_visibility_jane_marie_smith_2024-01-01_to_2024-01-15.pdf');
        });

        it('should format dates correctly', () => {
            const filename = generateExportFilename('Agent', {
                start: '2024-12-25T00:00:00Z',
                end: '2024-12-31T23:59:59Z',
            });

            expect(filename).toContain('2024-12-25_to_2024-12-31');
        });
    });
});
