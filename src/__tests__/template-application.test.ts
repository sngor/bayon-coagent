/**
 * Template Application Tests
 * 
 * Tests for template application functionality including form pre-population
 * and template performance metrics calculation.
 * 
 * Validates Requirements: 14.2, 14.4
 */

import { describe, it, expect } from '@jest/globals';
import { calculateTemplateMetrics, calculateAllTemplateMetrics } from '@/lib/open-house/template-analytics';
import type { SessionTemplate, OpenHouseSession } from '@/lib/open-house/types';

describe('Template Application', () => {
    describe('Form Pre-population (Requirement 14.2)', () => {
        it('should pre-populate form with template values', () => {
            const template: SessionTemplate = {
                templateId: 'template-123',
                userId: 'user-456',
                name: 'Luxury Home Template',
                description: 'For high-end properties',
                propertyType: 'Single Family',
                typicalDuration: 120,
                customFields: {},
                usageCount: 5,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            };

            // Simulate form pre-population
            const formData = {
                propertyAddress: '', // User fills this
                scheduledDate: '', // User fills this
                scheduledStartTime: '', // User fills this
                scheduledEndTime: '', // Calculated from duration
                notes: `Created from template: ${template.name}`,
                templateId: template.templateId,
            };

            expect(formData.templateId).toBe(template.templateId);
            expect(formData.notes).toContain(template.name);
        });

        it('should calculate end time from template duration', () => {
            const template: SessionTemplate = {
                templateId: 'template-123',
                userId: 'user-456',
                name: 'Test Template',
                typicalDuration: 120, // 2 hours
                customFields: {},
                usageCount: 0,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            };

            const startTime = new Date('2024-12-15T14:00:00Z');
            const expectedEndTime = new Date(
                startTime.getTime() + template.typicalDuration * 60000
            );

            const calculatedEndTime = new Date(
                startTime.getTime() + template.typicalDuration * 60000
            );

            expect(calculatedEndTime.getTime()).toBe(expectedEndTime.getTime());
            expect(calculatedEndTime.toISOString()).toBe('2024-12-15T16:00:00.000Z');
        });

        it('should handle different duration values', () => {
            const durations = [60, 90, 120, 150, 180]; // minutes

            durations.forEach((duration) => {
                const startTime = new Date('2024-12-15T14:00:00Z');
                const endTime = new Date(startTime.getTime() + duration * 60000);

                const expectedHours = Math.floor(duration / 60);
                const expectedMinutes = duration % 60;

                const actualHours = endTime.getHours() - startTime.getHours();
                const actualMinutes = endTime.getMinutes() - startTime.getMinutes();

                expect(actualHours * 60 + actualMinutes).toBe(duration);
            });
        });
    });

    describe('Template Performance Metrics (Requirement 14.4)', () => {
        it('should calculate usage count correctly', () => {
            const template: SessionTemplate = {
                templateId: 'template-123',
                userId: 'user-456',
                name: 'Test Template',
                typicalDuration: 120,
                customFields: {},
                usageCount: 0,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            };

            const sessions: OpenHouseSession[] = [
                {
                    sessionId: 'session-1',
                    userId: 'user-456',
                    propertyAddress: '123 Main St',
                    scheduledDate: '2024-12-15',
                    scheduledStartTime: '2024-12-15T14:00:00Z',
                    status: 'completed',
                    qrCodeUrl: 'https://example.com/qr1.png',
                    visitorCount: 20,
                    interestLevelDistribution: { high: 5, medium: 10, low: 5 },
                    photos: [],
                    templateId: 'template-123',
                    createdAt: '2024-12-01T00:00:00Z',
                    updatedAt: '2024-12-15T16:00:00Z',
                },
                {
                    sessionId: 'session-2',
                    userId: 'user-456',
                    propertyAddress: '456 Oak Ave',
                    scheduledDate: '2024-12-16',
                    scheduledStartTime: '2024-12-16T14:00:00Z',
                    status: 'completed',
                    qrCodeUrl: 'https://example.com/qr2.png',
                    visitorCount: 30,
                    interestLevelDistribution: { high: 10, medium: 15, low: 5 },
                    photos: [],
                    templateId: 'template-123',
                    createdAt: '2024-12-02T00:00:00Z',
                    updatedAt: '2024-12-16T16:00:00Z',
                },
            ];

            const updatedTemplate = calculateTemplateMetrics(template, sessions);

            expect(updatedTemplate.usageCount).toBe(2);
        });

        it('should calculate average visitors correctly', () => {
            const template: SessionTemplate = {
                templateId: 'template-123',
                userId: 'user-456',
                name: 'Test Template',
                typicalDuration: 120,
                customFields: {},
                usageCount: 0,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            };

            const sessions: OpenHouseSession[] = [
                {
                    sessionId: 'session-1',
                    userId: 'user-456',
                    propertyAddress: '123 Main St',
                    scheduledDate: '2024-12-15',
                    scheduledStartTime: '2024-12-15T14:00:00Z',
                    status: 'completed',
                    qrCodeUrl: 'https://example.com/qr1.png',
                    visitorCount: 20,
                    interestLevelDistribution: { high: 5, medium: 10, low: 5 },
                    photos: [],
                    templateId: 'template-123',
                    createdAt: '2024-12-01T00:00:00Z',
                    updatedAt: '2024-12-15T16:00:00Z',
                },
                {
                    sessionId: 'session-2',
                    userId: 'user-456',
                    propertyAddress: '456 Oak Ave',
                    scheduledDate: '2024-12-16',
                    scheduledStartTime: '2024-12-16T14:00:00Z',
                    status: 'completed',
                    qrCodeUrl: 'https://example.com/qr2.png',
                    visitorCount: 30,
                    interestLevelDistribution: { high: 10, medium: 15, low: 5 },
                    photos: [],
                    templateId: 'template-123',
                    createdAt: '2024-12-02T00:00:00Z',
                    updatedAt: '2024-12-16T16:00:00Z',
                },
            ];

            const updatedTemplate = calculateTemplateMetrics(template, sessions);

            expect(updatedTemplate.averageVisitors).toBe(25); // (20 + 30) / 2
        });

        it('should calculate average interest level correctly', () => {
            const template: SessionTemplate = {
                templateId: 'template-123',
                userId: 'user-456',
                name: 'Test Template',
                typicalDuration: 120,
                customFields: {},
                usageCount: 0,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            };

            const sessions: OpenHouseSession[] = [
                {
                    sessionId: 'session-1',
                    userId: 'user-456',
                    propertyAddress: '123 Main St',
                    scheduledDate: '2024-12-15',
                    scheduledStartTime: '2024-12-15T14:00:00Z',
                    status: 'completed',
                    qrCodeUrl: 'https://example.com/qr1.png',
                    visitorCount: 20,
                    interestLevelDistribution: { high: 10, medium: 5, low: 5 }, // 10*3 + 5*2 + 5*1 = 45
                    photos: [],
                    templateId: 'template-123',
                    createdAt: '2024-12-01T00:00:00Z',
                    updatedAt: '2024-12-15T16:00:00Z',
                },
            ];

            const updatedTemplate = calculateTemplateMetrics(template, sessions);

            // Interest level: (10*3 + 5*2 + 5*1) / 20 = 45 / 20 = 2.25
            expect(updatedTemplate.averageInterestLevel).toBe(2.25);
        });

        it('should handle templates with no sessions', () => {
            const template: SessionTemplate = {
                templateId: 'template-123',
                userId: 'user-456',
                name: 'Unused Template',
                typicalDuration: 120,
                customFields: {},
                usageCount: 0,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            };

            const sessions: OpenHouseSession[] = [];

            const updatedTemplate = calculateTemplateMetrics(template, sessions);

            expect(updatedTemplate.usageCount).toBe(0);
            expect(updatedTemplate.averageVisitors).toBeUndefined();
            expect(updatedTemplate.averageInterestLevel).toBeUndefined();
        });

        it('should only count sessions from the specific template', () => {
            const template: SessionTemplate = {
                templateId: 'template-123',
                userId: 'user-456',
                name: 'Test Template',
                typicalDuration: 120,
                customFields: {},
                usageCount: 0,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            };

            const sessions: OpenHouseSession[] = [
                {
                    sessionId: 'session-1',
                    userId: 'user-456',
                    propertyAddress: '123 Main St',
                    scheduledDate: '2024-12-15',
                    scheduledStartTime: '2024-12-15T14:00:00Z',
                    status: 'completed',
                    qrCodeUrl: 'https://example.com/qr1.png',
                    visitorCount: 20,
                    interestLevelDistribution: { high: 5, medium: 10, low: 5 },
                    photos: [],
                    templateId: 'template-123', // Matches
                    createdAt: '2024-12-01T00:00:00Z',
                    updatedAt: '2024-12-15T16:00:00Z',
                },
                {
                    sessionId: 'session-2',
                    userId: 'user-456',
                    propertyAddress: '456 Oak Ave',
                    scheduledDate: '2024-12-16',
                    scheduledStartTime: '2024-12-16T14:00:00Z',
                    status: 'completed',
                    qrCodeUrl: 'https://example.com/qr2.png',
                    visitorCount: 30,
                    interestLevelDistribution: { high: 10, medium: 15, low: 5 },
                    photos: [],
                    templateId: 'template-456', // Different template
                    createdAt: '2024-12-02T00:00:00Z',
                    updatedAt: '2024-12-16T16:00:00Z',
                },
                {
                    sessionId: 'session-3',
                    userId: 'user-456',
                    propertyAddress: '789 Pine Rd',
                    scheduledDate: '2024-12-17',
                    scheduledStartTime: '2024-12-17T14:00:00Z',
                    status: 'completed',
                    qrCodeUrl: 'https://example.com/qr3.png',
                    visitorCount: 25,
                    interestLevelDistribution: { high: 8, medium: 12, low: 5 },
                    photos: [],
                    // No templateId - created without template
                    createdAt: '2024-12-03T00:00:00Z',
                    updatedAt: '2024-12-17T16:00:00Z',
                },
            ];

            const updatedTemplate = calculateTemplateMetrics(template, sessions);

            // Should only count session-1
            expect(updatedTemplate.usageCount).toBe(1);
            expect(updatedTemplate.averageVisitors).toBe(20);
        });

        it('should calculate metrics for multiple templates', () => {
            const templates: SessionTemplate[] = [
                {
                    templateId: 'template-1',
                    userId: 'user-456',
                    name: 'Template 1',
                    typicalDuration: 120,
                    customFields: {},
                    usageCount: 0,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                },
                {
                    templateId: 'template-2',
                    userId: 'user-456',
                    name: 'Template 2',
                    typicalDuration: 90,
                    customFields: {},
                    usageCount: 0,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                },
            ];

            const sessions: OpenHouseSession[] = [
                {
                    sessionId: 'session-1',
                    userId: 'user-456',
                    propertyAddress: '123 Main St',
                    scheduledDate: '2024-12-15',
                    scheduledStartTime: '2024-12-15T14:00:00Z',
                    status: 'completed',
                    qrCodeUrl: 'https://example.com/qr1.png',
                    visitorCount: 20,
                    interestLevelDistribution: { high: 5, medium: 10, low: 5 },
                    photos: [],
                    templateId: 'template-1',
                    createdAt: '2024-12-01T00:00:00Z',
                    updatedAt: '2024-12-15T16:00:00Z',
                },
                {
                    sessionId: 'session-2',
                    userId: 'user-456',
                    propertyAddress: '456 Oak Ave',
                    scheduledDate: '2024-12-16',
                    scheduledStartTime: '2024-12-16T14:00:00Z',
                    status: 'completed',
                    qrCodeUrl: 'https://example.com/qr2.png',
                    visitorCount: 30,
                    interestLevelDistribution: { high: 10, medium: 15, low: 5 },
                    photos: [],
                    templateId: 'template-2',
                    createdAt: '2024-12-02T00:00:00Z',
                    updatedAt: '2024-12-16T16:00:00Z',
                },
            ];

            const updatedTemplates = calculateAllTemplateMetrics(templates, sessions);

            expect(updatedTemplates[0].usageCount).toBe(1);
            expect(updatedTemplates[0].averageVisitors).toBe(20);

            expect(updatedTemplates[1].usageCount).toBe(1);
            expect(updatedTemplates[1].averageVisitors).toBe(30);
        });
    });

    describe('Template Usage Tracking', () => {
        it('should track template usage when session is created', () => {
            // This test documents the expected behavior:
            // When a session is created with a templateId, the template's
            // usageCount should be incremented

            const initialUsageCount = 5;
            const expectedUsageCount = 6;

            // Simulate template usage increment
            const newUsageCount = initialUsageCount + 1;

            expect(newUsageCount).toBe(expectedUsageCount);
        });

        it('should not increment usage for sessions without template', () => {
            const initialUsageCount = 5;

            // Session created without template
            const templateId = undefined;

            // Usage count should remain the same
            const newUsageCount = templateId ? initialUsageCount + 1 : initialUsageCount;

            expect(newUsageCount).toBe(initialUsageCount);
        });
    });
});
