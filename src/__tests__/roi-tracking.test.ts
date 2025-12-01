/**
 * ROI Tracking Tests
 * 
 * Tests for ROI event tracking, analytics calculation, and export functionality.
 * Validates Requirements 7.1-7.5 from the content workflow features spec.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
    trackROIEvent,
    getROIAnalytics,
    exportROIData,
} from '@/services/analytics/analytics-service';
import {
    ROIEventType,
    ContentCategory,
    PublishChannelType,
} from '@/lib/types/content-workflow-types';

// Mock the repository
const mockCreate = jest.fn().mockResolvedValue(undefined);
const mockGet = jest.fn().mockResolvedValue(null);
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockQuery = jest.fn().mockResolvedValue({ items: [] });

jest.mock('@/aws/dynamodb/repository', () => ({
    getRepository: jest.fn(() => ({
        create: mockCreate,
        get: mockGet,
        update: mockUpdate,
        query: mockQuery,
    })),
}));

describe('ROI Tracking Implementation', () => {
    const mockUserId = 'test-user-123';
    const mockContentId = 'content-456';

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreate.mockResolvedValue(undefined);
        mockGet.mockResolvedValue(null);
        mockUpdate.mockResolvedValue(undefined);
        mockQuery.mockResolvedValue({ items: [] });
    });

    describe('trackROIEvent', () => {
        it('should track a lead event with attribution', async () => {
            const result = await trackROIEvent({
                userId: mockUserId,
                contentId: mockContentId,
                contentType: ContentCategory.BLOG_POST,
                eventType: ROIEventType.LEAD,
                value: 100,
                currency: 'USD',
                clientInfo: {
                    clientId: 'client-789',
                    clientName: 'John Doe',
                    contactInfo: 'john@example.com',
                },
                touchPoints: [
                    {
                        contentId: mockContentId,
                        channel: PublishChannelType.FACEBOOK,
                        touchedAt: new Date(),
                        interactionType: 'view',
                    },
                ],
                attributionModel: 'linear',
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.eventType).toBe(ROIEventType.LEAD);
            expect(result.data?.value).toBe(100);
            expect(result.data?.currency).toBe('USD');
            expect(result.data?.attribution).toBeDefined();
            expect(result.data?.attribution.attributionModel).toBe('linear');
        });

        it('should track a conversion event', async () => {
            const result = await trackROIEvent({
                userId: mockUserId,
                contentId: mockContentId,
                contentType: ContentCategory.LISTING_DESCRIPTION,
                eventType: ROIEventType.CONVERSION,
                value: 5000,
                currency: 'USD',
                attributionModel: 'last-touch',
            });

            expect(result.success).toBe(true);
            expect(result.data?.eventType).toBe(ROIEventType.CONVERSION);
            expect(result.data?.value).toBe(5000);
        });

        it('should track a revenue event with conversion path', async () => {
            const result = await trackROIEvent({
                userId: mockUserId,
                contentId: mockContentId,
                contentType: ContentCategory.SOCIAL_MEDIA,
                eventType: ROIEventType.REVENUE,
                value: 15000,
                currency: 'USD',
                conversionPath: [
                    {
                        step: 'Initial Contact',
                        completedAt: new Date(),
                        notes: 'First inquiry',
                    },
                    {
                        step: 'Property Viewing',
                        completedAt: new Date(),
                        notes: 'Showed 3 properties',
                    },
                    {
                        step: 'Offer Accepted',
                        completedAt: new Date(),
                        value: 15000,
                    },
                ],
                attributionModel: 'time-decay',
            });

            expect(result.success).toBe(true);
            expect(result.data?.eventType).toBe(ROIEventType.REVENUE);
            expect(result.data?.value).toBe(15000);
            expect(result.data?.conversionPath).toHaveLength(3);
        });

        it('should default to USD currency if not specified', async () => {
            const result = await trackROIEvent({
                userId: mockUserId,
                contentId: mockContentId,
                contentType: ContentCategory.BLOG_POST,
                eventType: ROIEventType.LEAD,
                value: 50,
            });

            expect(result.success).toBe(true);
            expect(result.data?.currency).toBe('USD');
        });

        it('should default to linear attribution if not specified', async () => {
            const result = await trackROIEvent({
                userId: mockUserId,
                contentId: mockContentId,
                contentType: ContentCategory.BLOG_POST,
                eventType: ROIEventType.LEAD,
                value: 50,
            });

            expect(result.success).toBe(true);
            expect(result.data?.attribution.attributionModel).toBe('linear');
        });
    });

    describe('getROIAnalytics', () => {
        it('should calculate ROI analytics for a date range', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');

            const result = await getROIAnalytics({
                userId: mockUserId,
                startDate,
                endDate,
                attributionModel: 'linear',
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.timeRange.startDate).toEqual(startDate);
            expect(result.data?.timeRange.endDate).toEqual(endDate);
            expect(result.data?.totalRevenue).toBeDefined();
            expect(result.data?.totalLeads).toBeDefined();
            expect(result.data?.totalConversions).toBeDefined();
            expect(result.data?.costPerLead).toBeDefined();
            expect(result.data?.conversionRate).toBeDefined();
            expect(result.data?.returnOnAdSpend).toBeDefined();
        });

        it('should filter by content types', async () => {
            const result = await getROIAnalytics({
                userId: mockUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                contentTypes: [ContentCategory.BLOG_POST, ContentCategory.SOCIAL_MEDIA],
            });

            expect(result.success).toBe(true);
        });

        it('should include conversion funnel when requested', async () => {
            const result = await getROIAnalytics({
                userId: mockUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                includeConversionFunnel: true,
            });

            expect(result.success).toBe(true);
            expect(result.data?.conversionFunnel).toBeDefined();
        });

        it('should support different attribution models', async () => {
            const models: Array<'first-touch' | 'last-touch' | 'linear' | 'time-decay'> = [
                'first-touch',
                'last-touch',
                'linear',
                'time-decay',
            ];

            for (const model of models) {
                const result = await getROIAnalytics({
                    userId: mockUserId,
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2024-01-31'),
                    attributionModel: model,
                });

                expect(result.success).toBe(true);
            }
        });

        it('should group by day, week, or month', async () => {
            const groupByOptions: Array<'day' | 'week' | 'month'> = ['day', 'week', 'month'];

            for (const groupBy of groupByOptions) {
                const result = await getROIAnalytics({
                    userId: mockUserId,
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2024-01-31'),
                    groupBy,
                });

                expect(result.success).toBe(true);
            }
        });
    });

    describe('exportROIData', () => {
        it('should export ROI data in CSV format', async () => {
            const result = await exportROIData({
                userId: mockUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                format: 'csv',
                includeDetails: true,
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(typeof result.data).toBe('string');
            // CSV should contain headers
            if (result.data) {
                expect(result.data).toContain('Content ID');
            }
        });

        it('should export ROI data in Excel format', async () => {
            const result = await exportROIData({
                userId: mockUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                format: 'excel',
                includeDetails: false,
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });

        it('should export ROI data in PDF format', async () => {
            const result = await exportROIData({
                userId: mockUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                format: 'pdf',
                includeDetails: true,
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(typeof result.data).toBe('string');
            // PDF should contain report header
            if (result.data) {
                expect(result.data).toContain('ROI Analytics Report');
            }
        });

        it('should support different attribution models in export', async () => {
            const result = await exportROIData({
                userId: mockUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                format: 'csv',
                attributionModel: 'time-decay',
            });

            expect(result.success).toBe(true);
        });
    });

    describe('ROI Metrics Calculations', () => {
        it('should calculate CAC (Customer Acquisition Cost)', async () => {
            const result = await getROIAnalytics({
                userId: mockUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
            });

            expect(result.success).toBe(true);
            expect(result.data?.costPerLead).toBeDefined();
            expect(typeof result.data?.costPerLead).toBe('number');
        });

        it('should calculate conversion rate', async () => {
            const result = await getROIAnalytics({
                userId: mockUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
            });

            expect(result.success).toBe(true);
            expect(result.data?.conversionRate).toBeDefined();
            expect(typeof result.data?.conversionRate).toBe('number');
            expect(result.data?.conversionRate).toBeGreaterThanOrEqual(0);
            expect(result.data?.conversionRate).toBeLessThanOrEqual(100);
        });

        it('should calculate ROAS (Return on Ad Spend)', async () => {
            const result = await getROIAnalytics({
                userId: mockUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
            });

            expect(result.success).toBe(true);
            expect(result.data?.returnOnAdSpend).toBeDefined();
            expect(typeof result.data?.returnOnAdSpend).toBe('number');
        });

        it('should calculate average order value', async () => {
            const result = await getROIAnalytics({
                userId: mockUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
            });

            expect(result.success).toBe(true);
            expect(result.data?.averageOrderValue).toBeDefined();
            expect(typeof result.data?.averageOrderValue).toBe('number');
        });
    });

    describe('Attribution Models', () => {
        it('should support first-touch attribution', async () => {
            const result = await trackROIEvent({
                userId: mockUserId,
                contentId: mockContentId,
                contentType: ContentCategory.BLOG_POST,
                eventType: ROIEventType.CONVERSION,
                value: 1000,
                touchPoints: [
                    {
                        contentId: mockContentId,
                        channel: PublishChannelType.FACEBOOK,
                        touchedAt: new Date('2024-01-01'),
                        interactionType: 'view',
                    },
                    {
                        contentId: 'other-content',
                        channel: PublishChannelType.LINKEDIN,
                        touchedAt: new Date('2024-01-15'),
                        interactionType: 'click',
                    },
                ],
                attributionModel: 'first-touch',
            });

            expect(result.success).toBe(true);
            expect(result.data?.attribution.attributionModel).toBe('first-touch');
        });

        it('should support last-touch attribution', async () => {
            const result = await trackROIEvent({
                userId: mockUserId,
                contentId: mockContentId,
                contentType: ContentCategory.BLOG_POST,
                eventType: ROIEventType.CONVERSION,
                value: 1000,
                attributionModel: 'last-touch',
            });

            expect(result.success).toBe(true);
            expect(result.data?.attribution.attributionModel).toBe('last-touch');
        });

        it('should support linear attribution', async () => {
            const result = await trackROIEvent({
                userId: mockUserId,
                contentId: mockContentId,
                contentType: ContentCategory.BLOG_POST,
                eventType: ROIEventType.CONVERSION,
                value: 1000,
                attributionModel: 'linear',
            });

            expect(result.success).toBe(true);
            expect(result.data?.attribution.attributionModel).toBe('linear');
        });

        it('should support time-decay attribution', async () => {
            const result = await trackROIEvent({
                userId: mockUserId,
                contentId: mockContentId,
                contentType: ContentCategory.BLOG_POST,
                eventType: ROIEventType.CONVERSION,
                value: 1000,
                attributionModel: 'time-decay',
            });

            expect(result.success).toBe(true);
            expect(result.data?.attribution.attributionModel).toBe('time-decay');
        });
    });

    describe('Conversion Funnel', () => {
        it('should build conversion funnel with standard steps', async () => {
            const result = await getROIAnalytics({
                userId: mockUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                includeConversionFunnel: true,
            });

            expect(result.success).toBe(true);
            expect(result.data?.conversionFunnel).toBeDefined();

            if (result.data?.conversionFunnel) {
                // Should have standard funnel steps
                const steps = result.data.conversionFunnel.map(s => s.step);
                expect(steps).toContain('Awareness');
                expect(steps).toContain('Lead');
                expect(steps).toContain('Conversion');
            }
        });

        it('should calculate conversion rates for each funnel step', async () => {
            const result = await getROIAnalytics({
                userId: mockUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                includeConversionFunnel: true,
            });

            expect(result.success).toBe(true);

            if (result.data?.conversionFunnel) {
                result.data.conversionFunnel.forEach(step => {
                    expect(step.conversionRate).toBeDefined();
                    expect(step.conversionRate).toBeGreaterThanOrEqual(0);
                    expect(step.conversionRate).toBeLessThanOrEqual(100);
                });
            }
        });

        it('should calculate drop-off rates for each funnel step', async () => {
            const result = await getROIAnalytics({
                userId: mockUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                includeConversionFunnel: true,
            });

            expect(result.success).toBe(true);

            if (result.data?.conversionFunnel) {
                result.data.conversionFunnel.forEach(step => {
                    expect(step.dropOffRate).toBeDefined();
                    expect(step.dropOffRate).toBeGreaterThanOrEqual(0);
                    expect(step.dropOffRate).toBeLessThanOrEqual(100);
                });
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle missing required parameters', async () => {
            const result = await trackROIEvent({
                userId: '',
                contentId: '',
                contentType: ContentCategory.BLOG_POST,
                eventType: ROIEventType.LEAD,
                value: 0,
            });

            // Should still succeed but with validation
            expect(result).toBeDefined();
        });

        it('should handle invalid date ranges', async () => {
            const result = await getROIAnalytics({
                userId: mockUserId,
                startDate: new Date('2024-12-31'),
                endDate: new Date('2024-01-01'), // End before start
            });

            expect(result).toBeDefined();
        });

        it('should handle unsupported export formats gracefully', async () => {
            const result = await exportROIData({
                userId: mockUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                format: 'invalid' as any,
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
});
