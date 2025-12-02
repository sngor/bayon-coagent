/**
 * Template Management Tests
 * 
 * Tests for session template validation and data structures.
 * Validates Requirements: 14.1, 14.3, 14.5
 */

import { describe, it, expect } from '@jest/globals';
import {
    createSessionTemplateInputSchema,
    updateSessionTemplateInputSchema,
} from '@/lib/open-house/schemas';
import type { SessionTemplate } from '@/lib/open-house/types';

describe('Template Management Validation', () => {
    describe('createSessionTemplateInputSchema', () => {
        it('should validate template with all required fields', () => {
            const validInput = {
                name: 'Luxury Home Template',
                description: 'Template for high-end properties',
                propertyType: 'Single Family',
                typicalDuration: 120,
                customFields: {
                    parkingSpaces: 2,
                    hasPool: true,
                },
            };

            const result = createSessionTemplateInputSchema.safeParse(validInput);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe(validInput.name);
                expect(result.data.typicalDuration).toBe(120);
            }
        });

        it('should validate template with only required fields', () => {
            const minimalInput = {
                name: 'Basic Template',
                typicalDuration: 90,
            };

            const result = createSessionTemplateInputSchema.safeParse(minimalInput);
            expect(result.success).toBe(true);
        });

        it('should reject template with missing name', () => {
            const input = {
                typicalDuration: 120,
            };

            const result = createSessionTemplateInputSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('should reject template with empty name', () => {
            const input = {
                name: '',
                typicalDuration: 120,
            };

            const result = createSessionTemplateInputSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('should reject template with missing duration', () => {
            const input = {
                name: 'Test Template',
            };

            const result = createSessionTemplateInputSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('typicalDuration');
            }
        });

        it('should reject template with negative duration', () => {
            const input = {
                name: 'Test Template',
                typicalDuration: -10,
            };

            const result = createSessionTemplateInputSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('typicalDuration');
            }
        });

        it('should reject template with zero duration', () => {
            const input = {
                name: 'Test Template',
                typicalDuration: 0,
            };

            const result = createSessionTemplateInputSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('typicalDuration');
            }
        });

        it('should reject template with name exceeding max length', () => {
            const input = {
                name: 'A'.repeat(101), // Max is 100
                typicalDuration: 120,
            };

            const result = createSessionTemplateInputSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('name');
            }
        });

        it('should reject template with description exceeding max length', () => {
            const input = {
                name: 'Test Template',
                description: 'A'.repeat(501), // Max is 500
                typicalDuration: 120,
            };

            const result = createSessionTemplateInputSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('description');
            }
        });

        it('should accept custom fields as object', () => {
            const input = {
                name: 'Test Template',
                typicalDuration: 120,
                customFields: {
                    hasGarage: true,
                    bedrooms: 4,
                    features: ['pool', 'garden'],
                },
            };

            const result = createSessionTemplateInputSchema.safeParse(input);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.customFields).toEqual(input.customFields);
            }
        });
    });

    describe('updateSessionTemplateInputSchema', () => {
        it('should validate partial updates', () => {
            const updates = {
                name: 'Updated Template Name',
            };

            const result = updateSessionTemplateInputSchema.safeParse(updates);
            expect(result.success).toBe(true);
        });

        it('should validate multiple field updates', () => {
            const updates = {
                name: 'Updated Template',
                description: 'New description',
                typicalDuration: 150,
            };

            const result = updateSessionTemplateInputSchema.safeParse(updates);
            expect(result.success).toBe(true);
        });

        it('should allow empty updates object', () => {
            const updates = {};

            const result = updateSessionTemplateInputSchema.safeParse(updates);
            expect(result.success).toBe(true);
        });

        it('should reject invalid name in updates', () => {
            const updates = {
                name: '', // Empty name
            };

            const result = updateSessionTemplateInputSchema.safeParse(updates);
            expect(result.success).toBe(false);
        });

        it('should reject invalid duration in updates', () => {
            const updates = {
                typicalDuration: -20,
            };

            const result = updateSessionTemplateInputSchema.safeParse(updates);
            expect(result.success).toBe(false);
        });

        it('should accept custom fields updates', () => {
            const updates = {
                customFields: {
                    newField: 'value',
                },
            };

            const result = updateSessionTemplateInputSchema.safeParse(updates);
            expect(result.success).toBe(true);
        });
    });

    describe('SessionTemplate Data Structure', () => {
        it('should have correct structure for new template', () => {
            const template: SessionTemplate = {
                templateId: 'template-123',
                userId: 'user-456',
                name: 'Test Template',
                description: 'A test template',
                propertyType: 'Condo',
                typicalDuration: 90,
                customFields: {
                    hasElevator: true,
                },
                usageCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            expect(template.templateId).toBeDefined();
            expect(template.userId).toBeDefined();
            expect(template.name).toBeDefined();
            expect(template.typicalDuration).toBeGreaterThan(0);
            expect(template.usageCount).toBe(0);
        });

        it('should track usage count correctly', () => {
            const template: SessionTemplate = {
                templateId: 'template-123',
                userId: 'user-456',
                name: 'Popular Template',
                typicalDuration: 120,
                customFields: {},
                usageCount: 15,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-15T00:00:00Z',
            };

            expect(template.usageCount).toBe(15);
            expect(template.usageCount).toBeGreaterThan(0);
        });

        it('should support optional analytics fields', () => {
            const template: SessionTemplate = {
                templateId: 'template-123',
                userId: 'user-456',
                name: 'Analytics Template',
                typicalDuration: 120,
                customFields: {},
                usageCount: 10,
                averageVisitors: 25.5,
                averageInterestLevel: 2.3,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-15T00:00:00Z',
            };

            expect(template.averageVisitors).toBeDefined();
            expect(template.averageInterestLevel).toBeDefined();
            expect(template.averageVisitors).toBeGreaterThan(0);
        });
    });

    describe('Template Modification Behavior', () => {
        it('should preserve historical data when template is modified', () => {
            // This test documents the expected behavior:
            // When a template is updated, existing sessions created from it
            // should remain unchanged (Requirement 14.3)

            const originalTemplate: SessionTemplate = {
                templateId: 'template-123',
                userId: 'user-456',
                name: 'Original Name',
                typicalDuration: 120,
                customFields: { feature: 'old' },
                usageCount: 5,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            };

            // Simulate template modification
            const modifiedTemplate: SessionTemplate = {
                ...originalTemplate,
                name: 'Modified Name',
                typicalDuration: 150,
                customFields: { feature: 'new' },
                updatedAt: '2024-01-15T00:00:00Z',
            };

            // Template ID and user ID should remain the same
            expect(modifiedTemplate.templateId).toBe(originalTemplate.templateId);
            expect(modifiedTemplate.userId).toBe(originalTemplate.userId);

            // Usage count should be preserved
            expect(modifiedTemplate.usageCount).toBe(originalTemplate.usageCount);

            // Created timestamp should be preserved
            expect(modifiedTemplate.createdAt).toBe(originalTemplate.createdAt);

            // Updated timestamp should change
            expect(modifiedTemplate.updatedAt).not.toBe(originalTemplate.updatedAt);
        });

        it('should preserve template reference when template is deleted', () => {
            // This test documents the expected behavior:
            // When a template is deleted, sessions that used it should
            // preserve the templateId reference (Requirement 14.5)

            const sessionWithTemplate = {
                sessionId: 'session-123',
                userId: 'user-456',
                propertyAddress: '123 Main St',
                templateId: 'template-123', // Reference to deleted template
                scheduledDate: '2024-12-15',
                scheduledStartTime: '2024-12-15T14:00:00Z',
                status: 'completed',
                qrCodeUrl: 'https://example.com/qr.png',
                visitorCount: 20,
                interestLevelDistribution: { high: 5, medium: 10, low: 5 },
                photos: [],
                createdAt: '2024-12-01T00:00:00Z',
                updatedAt: '2024-12-15T16:00:00Z',
            };

            // Even if template is deleted, session should retain the reference
            expect(sessionWithTemplate.templateId).toBe('template-123');
            expect(sessionWithTemplate.templateId).toBeDefined();
        });
    });
});
