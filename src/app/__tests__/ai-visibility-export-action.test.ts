/**
 * Integration tests for AI Visibility Export Action
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock AWS modules
jest.mock('@/aws/dynamodb/repository', () => ({
    getRepository: jest.fn(() => ({
        query: jest.fn(),
        get: jest.fn(),
    })),
}));

jest.mock('@/aws/s3/client', () => ({
    uploadFile: jest.fn(),
    getPresignedDownloadUrl: jest.fn(),
}));

jest.mock('@/lib/ai-visibility-export', () => ({
    generatePDFReport: jest.fn(),
    generateExportFilename: jest.fn(),
}));

jest.mock('@/aws/dynamodb/keys', () => ({
    getUserProfileKeys: jest.fn(() => ({ PK: 'USER#123', SK: 'PROFILE' })),
    getCompetitorKeys: jest.fn(() => ({ PK: 'USER#123', SK: 'COMPETITOR#456' })),
}));

describe('exportAIVisibilityReport Action', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should validate input schema', async () => {
        const { ExportAIVisibilityReportInputSchema } = await import('@/ai/schemas/ai-monitoring-schemas');

        // Valid input
        const validInput = {
            userId: 'user-123',
            dateRange: {
                start: '2024-01-01T00:00:00Z',
                end: '2024-01-15T00:00:00Z',
            },
        };

        const result = ExportAIVisibilityReportInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it('should reject invalid date range', async () => {
        const { ExportAIVisibilityReportInputSchema } = await import('@/ai/schemas/ai-monitoring-schemas');

        // Invalid: end before start
        const invalidInput = {
            userId: 'user-123',
            dateRange: {
                start: '2024-01-15T00:00:00Z',
                end: '2024-01-01T00:00:00Z',
            },
        };

        const result = ExportAIVisibilityReportInputSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });

    it('should reject missing userId', async () => {
        const { ExportAIVisibilityReportInputSchema } = await import('@/ai/schemas/ai-monitoring-schemas');

        const invalidInput = {
            userId: '',
            dateRange: {
                start: '2024-01-01T00:00:00Z',
                end: '2024-01-15T00:00:00Z',
            },
        };

        const result = ExportAIVisibilityReportInputSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });

    it('should reject invalid date format', async () => {
        const { ExportAIVisibilityReportInputSchema } = await import('@/ai/schemas/ai-monitoring-schemas');

        const invalidInput = {
            userId: 'user-123',
            dateRange: {
                start: '2024-01-01',
                end: '2024-01-15',
            },
        };

        const result = ExportAIVisibilityReportInputSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });
});

describe('Export Filename Generation', () => {
    it('should generate valid filename', async () => {
        const { generateExportFilename } = await import('@/lib/ai-visibility-export');

        const filename = generateExportFilename('John Doe', {
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-15T00:00:00Z',
        });

        expect(filename).toMatch(/^ai_visibility_.*\.pdf$/);
        expect(filename).toContain('john_doe');
        expect(filename).toContain('2024-01-01');
        expect(filename).toContain('2024-01-15');
    });
});
