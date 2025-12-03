/**
 * Tests for website analysis database operations
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
    saveWebsiteAnalysis,
    getLatestWebsiteAnalysis,
    getWebsiteAnalysisHistory,
    calculateWebsiteAnalysisTrend,
} from '../actions';
import type { WebsiteAnalysisResult } from '@/ai/schemas/website-analysis-schemas';

// Mock the repository
jest.mock('@/aws/dynamodb/repository', () => ({
    getRepository: jest.fn(() => ({
        create: jest.fn(),
        get: jest.fn(),
        query: jest.fn(),
        put: jest.fn(),
    })),
}));

// Mock the keys module
jest.mock('@/aws/dynamodb/keys', () => ({
    getWebsiteAnalysisKeys: jest.fn((userId: string, timestamp?: string) => ({
        PK: `USER#${userId}`,
        SK: timestamp ? `WEBSITE_ANALYSIS#${timestamp}` : 'WEBSITE_ANALYSIS#latest',
    })),
    getProfileKeys: jest.fn((userId: string) => ({
        PK: `USER#${userId}`,
        SK: 'PROFILE',
    })),
}));

describe('Website Analysis Database Operations', () => {
    const mockUserId = 'test-user-123';
    const mockAnalysis: WebsiteAnalysisResult = {
        id: 'analysis-1',
        userId: mockUserId,
        websiteUrl: 'https://example.com',
        analyzedAt: new Date().toISOString(),
        overallScore: 75,
        scoreBreakdown: {
            schemaMarkup: 20,
            metaTags: 20,
            structuredData: 20,
            napConsistency: 15,
        },
        schemaMarkup: {
            found: true,
            types: ['Person', 'LocalBusiness'],
            properties: {},
            issues: [],
            recommendations: [],
        },
        metaTags: {
            title: {
                content: 'Test Title',
                length: 10,
                isOptimal: true,
                issues: [],
            },
            description: {
                content: 'Test Description',
                length: 16,
                isOptimal: false,
                issues: ['Too short'],
            },
            openGraph: {
                found: true,
                properties: {},
                issues: [],
            },
            twitterCard: {
                found: false,
                properties: {},
                issues: ['Missing Twitter Card tags'],
            },
        },
        napConsistency: {
            name: {
                found: 'John Doe',
                matches: true,
                confidence: 1.0,
            },
            address: {
                found: '123 Main St',
                matches: true,
                confidence: 0.9,
            },
            phone: {
                found: '555-1234',
                matches: true,
                confidence: 1.0,
            },
            overallConsistency: 95,
        },
        recommendations: [],
        summary: 'Your website has good optimization but could improve meta tags.',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('saveWebsiteAnalysis', () => {
        it('should save analysis as both latest and historical', async () => {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const mockRepository = getRepository();

            const result = await saveWebsiteAnalysis(mockUserId, mockAnalysis);

            expect(result.message).toBe('Website analysis saved successfully');
            expect(result.data).toEqual({ success: true });
            expect(mockRepository.create).toHaveBeenCalledTimes(2);
        });

        it('should handle validation errors', async () => {
            const invalidAnalysis = { ...mockAnalysis, overallScore: 150 }; // Invalid score

            const result = await saveWebsiteAnalysis(mockUserId, invalidAnalysis as any);

            expect(result.message).toContain('Failed to save');
            expect(result.data).toBeNull();
        });
    });

    describe('getLatestWebsiteAnalysis', () => {
        it('should retrieve the latest analysis', async () => {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const mockRepository = getRepository();
            (mockRepository.get as jest.Mock).mockResolvedValue(mockAnalysis);

            const result = await getLatestWebsiteAnalysis(mockUserId);

            expect(result.message).toBe('success');
            expect(result.data).toEqual(mockAnalysis);
        });

        it('should return helpful message when no analysis exists', async () => {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const mockRepository = getRepository();
            (mockRepository.get as jest.Mock).mockResolvedValue(null);

            const result = await getLatestWebsiteAnalysis(mockUserId);

            expect(result.message).toContain('No website analysis found');
            expect(result.data).toBeNull();
        });
    });

    describe('getWebsiteAnalysisHistory', () => {
        it('should retrieve historical analyses', async () => {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const mockRepository = getRepository();

            const mockHistory = [
                { ...mockAnalysis, id: 'analysis-1234567890' },
                { ...mockAnalysis, id: 'analysis-1234567891', overallScore: 70 },
            ];

            (mockRepository.query as jest.Mock).mockResolvedValue({
                items: mockHistory,
                count: 2,
            });

            const result = await getWebsiteAnalysisHistory(mockUserId, 5);

            expect(result.message).toBe('success');
            expect(result.data).toHaveLength(2);
        });

        it('should filter out the latest entry', async () => {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const mockRepository = getRepository();

            const mockHistory = [
                { ...mockAnalysis, id: 'latest' }, // Should be filtered out
                { ...mockAnalysis, id: 'analysis-1234567890' },
            ];

            (mockRepository.query as jest.Mock).mockResolvedValue({
                items: mockHistory,
                count: 2,
            });

            const result = await getWebsiteAnalysisHistory(mockUserId, 5);

            expect(result.data).toHaveLength(1);
            expect(result.data?.[0].id).toBe('analysis-1234567890');
        });
    });

    describe('calculateWebsiteAnalysisTrend', () => {
        it('should calculate improving trend', async () => {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const mockRepository = getRepository();

            const mockHistory = [
                { ...mockAnalysis, id: 'analysis-1234567891', overallScore: 80 },
                { ...mockAnalysis, id: 'analysis-1234567890', overallScore: 70 },
            ];

            (mockRepository.query as jest.Mock).mockResolvedValue({
                items: mockHistory,
                count: 2,
            });

            const result = await calculateWebsiteAnalysisTrend(mockUserId);

            expect(result.message).toBe('success');
            expect(result.data?.trend).toBe('improving');
            expect(result.data?.currentScore).toBe(80);
            expect(result.data?.previousScore).toBe(70);
            expect(result.data?.scoreChange).toBe(10);
        });

        it('should calculate declining trend', async () => {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const mockRepository = getRepository();

            const mockHistory = [
                { ...mockAnalysis, id: 'analysis-1234567891', overallScore: 60 },
                { ...mockAnalysis, id: 'analysis-1234567890', overallScore: 75 },
            ];

            (mockRepository.query as jest.Mock).mockResolvedValue({
                items: mockHistory,
                count: 2,
            });

            const result = await calculateWebsiteAnalysisTrend(mockUserId);

            expect(result.message).toBe('success');
            expect(result.data?.trend).toBe('declining');
            expect(result.data?.scoreChange).toBe(-15);
        });

        it('should calculate stable trend for small changes', async () => {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const mockRepository = getRepository();

            const mockHistory = [
                { ...mockAnalysis, id: 'analysis-1234567891', overallScore: 75 },
                { ...mockAnalysis, id: 'analysis-1234567890', overallScore: 74 },
            ];

            (mockRepository.query as jest.Mock).mockResolvedValue({
                items: mockHistory,
                count: 2,
            });

            const result = await calculateWebsiteAnalysisTrend(mockUserId);

            expect(result.message).toBe('success');
            expect(result.data?.trend).toBe('stable');
        });

        it('should handle single analysis', async () => {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const mockRepository = getRepository();

            const mockHistory = [
                { ...mockAnalysis, id: 'analysis-1234567890' },
            ];

            (mockRepository.query as jest.Mock).mockResolvedValue({
                items: mockHistory,
                count: 1,
            });

            const result = await calculateWebsiteAnalysisTrend(mockUserId);

            expect(result.message).toBe('success');
            expect(result.data?.trend).toBe('stable');
            expect(result.data?.previousScore).toBeNull();
        });
    });
});
