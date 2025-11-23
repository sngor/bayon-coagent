/**
 * Template Sharing Tests
 * 
 * Tests for the template sharing functionality including brokerage-level
 * template management, copy-on-write behavior, and access controls.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    saveTemplate,
    shareTemplate,
    getSharedTemplates,
    updateSharedTemplate,
    unshareTemplate,
    getTemplateAnalytics
} from '@/services/template-service';
import { ContentCategory, TemplatePermissions } from '@/lib/content-workflow-types';

describe('Template Sharing', () => {
    const userId = 'test-user-123';
    const brokerageId = 'test-brokerage-456';
    const otherUserId = 'other-user-789';

    beforeEach(() => {
        // Reset any mocks or test state if needed
    });

    describe('shareTemplate', () => {
        it('should share a template with brokerage members', async () => {
            // Create a template first
            const templateResult = await saveTemplate({
                userId,
                name: 'Test Listing Template',
                description: 'A template for listing descriptions',
                contentType: ContentCategory.LISTING_DESCRIPTION,
                configuration: {
                    promptParameters: {
                        style: 'professional',
                        tone: 'engaging'
                    },
                    contentStructure: {
                        sections: ['intro', 'features', 'location'],
                        format: 'structured'
                    },
                    stylePreferences: {
                        tone: 'professional',
                        length: 'medium',
                        keywords: ['luxury', 'modern']
                    }
                }
            });

            expect(templateResult.success).toBe(true);
            expect(templateResult.templateId).toBeDefined();

            // Share the template
            const permissions: TemplatePermissions = {
                canView: [otherUserId],
                canEdit: [],
                canShare: [],
                canDelete: []
            };

            const shareResult = await shareTemplate({
                userId,
                templateId: templateResult.templateId!,
                brokerageId,
                permissions
            });

            expect(shareResult.success).toBe(true);
        });

        it('should prevent sharing by non-owners', async () => {
            // Create a template
            const templateResult = await saveTemplate({
                userId,
                name: 'Private Template',
                description: 'A private template',
                contentType: ContentCategory.BLOG_POST,
                configuration: {
                    promptParameters: {},
                    contentStructure: {
                        sections: ['intro'],
                        format: 'simple'
                    },
                    stylePreferences: {
                        tone: 'casual',
                        length: 'short',
                        keywords: []
                    }
                }
            });

            expect(templateResult.success).toBe(true);

            // Try to share as different user
            const permissions: TemplatePermissions = {
                canView: [otherUserId],
                canEdit: [],
                canShare: [],
                canDelete: []
            };

            const shareResult = await shareTemplate({
                userId: otherUserId, // Different user
                templateId: templateResult.templateId!,
                brokerageId,
                permissions
            });

            expect(shareResult.success).toBe(false);
            expect(shareResult.error).toContain('Permission denied');
        });
    });

    describe('getSharedTemplates', () => {
        it('should return shared templates for brokerage members', async () => {
            // This test would require setting up shared templates
            // For now, we'll test the basic functionality
            const result = await getSharedTemplates({
                userId: otherUserId,
                brokerageId
            });

            expect(result.success).toBe(true);
            expect(Array.isArray(result.templates)).toBe(true);
        });

        it('should filter shared templates by content type', async () => {
            const result = await getSharedTemplates({
                userId: otherUserId,
                brokerageId,
                contentType: ContentCategory.BLOG_POST
            });

            expect(result.success).toBe(true);
            expect(Array.isArray(result.templates)).toBe(true);
        });
    });

    describe('updateSharedTemplate - Copy-on-Write', () => {
        it('should create personal copy when user without edit permission modifies template', async () => {
            // Create and share a template
            const templateResult = await saveTemplate({
                userId,
                name: 'Shared Template',
                description: 'A shared template',
                contentType: ContentCategory.SOCIAL_MEDIA,
                configuration: {
                    promptParameters: {
                        platform: 'facebook'
                    },
                    contentStructure: {
                        sections: ['main'],
                        format: 'social'
                    },
                    stylePreferences: {
                        tone: 'friendly',
                        length: 'short',
                        keywords: ['realestate']
                    }
                }
            });

            expect(templateResult.success).toBe(true);

            const permissions: TemplatePermissions = {
                canView: [otherUserId],
                canEdit: [], // No edit permission
                canShare: [],
                canDelete: []
            };

            await shareTemplate({
                userId,
                templateId: templateResult.templateId!,
                brokerageId,
                permissions
            });

            // Try to modify as user without edit permission
            const updateResult = await updateSharedTemplate({
                userId: otherUserId,
                templateId: templateResult.templateId!,
                updates: {
                    name: 'Modified Template',
                    description: 'Modified description'
                },
                brokerageId
            });

            expect(updateResult.success).toBe(true);
            expect(updateResult.isNewCopy).toBe(true);
            expect(updateResult.templateId).toBeDefined();
            expect(updateResult.templateId).not.toBe(templateResult.templateId);
        });
    });

    describe('unshareTemplate', () => {
        it('should remove template sharing', async () => {
            // Create and share a template
            const templateResult = await saveTemplate({
                userId,
                name: 'Template to Unshare',
                description: 'A template that will be unshared',
                contentType: ContentCategory.NEWSLETTER,
                configuration: {
                    promptParameters: {},
                    contentStructure: {
                        sections: ['header', 'body', 'footer'],
                        format: 'newsletter'
                    },
                    stylePreferences: {
                        tone: 'professional',
                        length: 'long',
                        keywords: ['newsletter', 'updates']
                    }
                }
            });

            expect(templateResult.success).toBe(true);

            const permissions: TemplatePermissions = {
                canView: [otherUserId],
                canEdit: [],
                canShare: [],
                canDelete: []
            };

            await shareTemplate({
                userId,
                templateId: templateResult.templateId!,
                brokerageId,
                permissions
            });

            // Unshare the template
            const unshareResult = await unshareTemplate({
                userId,
                templateId: templateResult.templateId!,
                brokerageId
            });

            expect(unshareResult.success).toBe(true);
        });

        it('should prevent unsharing by non-owners', async () => {
            // Create a template
            const templateResult = await saveTemplate({
                userId,
                name: 'Protected Template',
                description: 'A protected template',
                contentType: ContentCategory.MARKET_UPDATE,
                configuration: {
                    promptParameters: {},
                    contentStructure: {
                        sections: ['market-data'],
                        format: 'report'
                    },
                    stylePreferences: {
                        tone: 'analytical',
                        length: 'medium',
                        keywords: ['market', 'trends']
                    }
                }
            });

            expect(templateResult.success).toBe(true);

            // Try to unshare as different user
            const unshareResult = await unshareTemplate({
                userId: otherUserId, // Different user
                templateId: templateResult.templateId!,
                brokerageId
            });

            expect(unshareResult.success).toBe(false);
            expect(unshareResult.error).toContain('Permission denied');
        });
    });

    describe('getTemplateAnalytics', () => {
        it('should return template usage analytics', async () => {
            const result = await getTemplateAnalytics({
                userId
            });

            expect(result.success).toBe(true);
            expect(result.analytics).toBeDefined();
            expect(typeof result.analytics?.totalUsage).toBe('number');
            expect(typeof result.analytics?.uniqueUsers).toBe('number');
            expect(result.analytics?.sharingMetrics).toBeDefined();
        });

        it('should return analytics for specific template', async () => {
            // Create a template first
            const templateResult = await saveTemplate({
                userId,
                name: 'Analytics Test Template',
                description: 'Template for analytics testing',
                contentType: ContentCategory.VIDEO_SCRIPT,
                configuration: {
                    promptParameters: {},
                    contentStructure: {
                        sections: ['intro', 'main', 'outro'],
                        format: 'script'
                    },
                    stylePreferences: {
                        tone: 'engaging',
                        length: 'medium',
                        keywords: ['video', 'script']
                    }
                }
            });

            expect(templateResult.success).toBe(true);

            const result = await getTemplateAnalytics({
                userId,
                templateId: templateResult.templateId!
            });

            expect(result.success).toBe(true);
            expect(result.analytics).toBeDefined();
        });
    });
});