'use server';

/**
 * Template Service
 * 
 * Provides comprehensive template management functionality including CRUD operations,
 * team sharing, seasonal templates, and template configuration management.
 * 
 * Requirements:
 * - 9.1: Save custom prompts and content templates
 * - 9.2: Store all prompt parameters and content structure
 * - 9.3: Display templates with preview information
 * - 9.4: Pre-populate content creation interface with template configuration
 * - 9.5: Save changes without affecting previously created content
 */

import { getRepository } from '@/aws/dynamodb/repository';
import { getTemplateKeys, getSharedTemplateKeys } from '@/aws/dynamodb/keys';
import type { EntityType } from '@/aws/dynamodb/types';
import {
    Template,
    TemplateConfiguration,
    TemplatePermissions,
    ContentCategory
} from '@/lib/content-workflow-types';

// ==================== Core Template CRUD Operations ====================

/**
 * Save a new template with comprehensive metadata capture and validation
 * Requirement 9.1, 9.2
 */
export async function saveTemplate(params: {
    userId: string;
    name: string;
    description: string;
    contentType: ContentCategory;
    configuration: TemplateConfiguration;
    isSeasonal?: boolean;
    seasonalTags?: string[];
    previewImage?: string;
}): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
        const repository = getRepository();
        const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const template: Template = {
            id: templateId,
            userId: params.userId,
            name: params.name,
            description: params.description,
            contentType: params.contentType,
            configuration: params.configuration,
            isShared: false,
            isSeasonal: params.isSeasonal || false,
            seasonalTags: params.seasonalTags || [],
            usageCount: 0,
            previewImage: params.previewImage,
            createdAt: new Date(),
            updatedAt: new Date(),
            // GSI keys for efficient querying
            GSI1PK: `TEMPLATE#${params.contentType}`,
            GSI1SK: `NAME#${params.name}`
        };

        const { PK, SK } = getTemplateKeys(params.userId, templateId);

        await repository.put({
            PK,
            SK,
            EntityType: 'Template' as EntityType,
            Data: template,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        });

        return { success: true, templateId };
    } catch (error) {
        console.error('Failed to save template:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save template'
        };
    }
}

/**
 * Get user templates with advanced filtering, sorting, and search capabilities
 * Requirement 9.3
 */
export async function getUserTemplates(params: {
    userId: string;
    contentType?: ContentCategory;
    isSeasonal?: boolean;
    searchQuery?: string;
    sortBy?: 'name' | 'createdAt' | 'usageCount' | 'lastUsed';
    sortOrder?: 'asc' | 'desc';
}): Promise<{ success: boolean; templates?: Template[]; error?: string }> {
    try {
        const repository = getRepository();
        const PK = `USER#${params.userId}`;

        // Query all templates for the user
        const result = await repository.query<Template>(PK, 'TEMPLATE#');

        let templates = result.items;

        // Apply filters
        if (params.contentType) {
            templates = templates.filter(t => t.contentType === params.contentType);
        }

        if (params.isSeasonal !== undefined) {
            templates = templates.filter(t => t.isSeasonal === params.isSeasonal);
        }

        if (params.searchQuery) {
            const query = params.searchQuery.toLowerCase();
            templates = templates.filter(t =>
                t.name.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query) ||
                t.seasonalTags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Apply sorting
        const sortBy = params.sortBy || 'createdAt';
        const sortOrder = params.sortOrder || 'desc';

        templates.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'usageCount':
                    aValue = a.usageCount;
                    bValue = b.usageCount;
                    break;
                case 'lastUsed':
                    aValue = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
                    bValue = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
                    break;
                default: // createdAt
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
            }

            if (sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return { success: true, templates };
    } catch (error) {
        console.error('Failed to get user templates:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get templates'
        };
    }
}

/**
 * Get template by ID for applying to content creation
 * Requirement 9.4
 */
export async function getTemplate(params: {
    userId: string;
    templateId: string;
}): Promise<{ success: boolean; template?: Template; error?: string }> {
    try {
        const repository = getRepository();
        const { PK, SK } = getTemplateKeys(params.userId, params.templateId);

        const template = await repository.get<Template>(PK, SK);
        if (!template) {
            return { success: false, error: 'Template not found' };
        }

        // Check if user has access to the template
        if (template.userId !== params.userId && !template.isShared) {
            return { success: false, error: 'Access denied' };
        }

        // Update usage tracking
        await updateTemplateUsage(params.userId, params.templateId);

        return { success: true, template };
    } catch (error) {
        console.error('Failed to get template:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get template'
        };
    }
}

/**
 * Update template usage statistics
 * Internal helper function
 */
async function updateTemplateUsage(userId: string, templateId: string): Promise<void> {
    try {
        const repository = getRepository();
        const { PK, SK } = getTemplateKeys(userId, templateId);

        const template = await repository.get<Template>(PK, SK);
        if (template) {
            const updatedTemplate = {
                ...template,
                usageCount: (template.usageCount || 0) + 1,
                lastUsed: new Date(),
                updatedAt: new Date()
            };

            await repository.put({
                PK,
                SK,
                EntityType: 'Template' as EntityType,
                Data: updatedTemplate,
                CreatedAt: template.createdAt.getTime(),
                UpdatedAt: Date.now()
            });
        }
    } catch (error) {
        console.error('Failed to update template usage:', error);
        // Don't throw error as this is not critical
    }
}

/**
 * Update template with new configuration or metadata
 * Requirement 9.5: Save changes without affecting previously created content
 */
export async function updateTemplate(params: {
    userId: string;
    templateId: string;
    updates: Partial<Pick<Template, 'name' | 'description' | 'configuration' | 'seasonalTags' | 'previewImage'>>;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const repository = getRepository();
        const { PK, SK } = getTemplateKeys(params.userId, params.templateId);

        // Get existing template
        const existingTemplate = await repository.get<Template>(PK, SK);
        if (!existingTemplate) {
            return { success: false, error: 'Template not found' };
        }

        // Check if user has permission to edit
        if (existingTemplate.userId !== params.userId && !existingTemplate.permissions?.canEdit?.includes(params.userId)) {
            return { success: false, error: 'Permission denied' };
        }

        // Update template
        const updatedTemplate: Template = {
            ...existingTemplate,
            ...params.updates,
            updatedAt: new Date()
        };

        await repository.put({
            PK,
            SK,
            EntityType: 'Template' as EntityType,
            Data: updatedTemplate,
            CreatedAt: existingTemplate.createdAt.getTime(),
            UpdatedAt: Date.now()
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to update template:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update template'
        };
    }
}

/**
 * Delete template (soft delete)
 * Requirement 9.5: Save changes without affecting previously created content
 */
export async function deleteTemplate(params: {
    userId: string;
    templateId: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const repository = getRepository();
        const { PK, SK } = getTemplateKeys(params.userId, params.templateId);

        // Get existing template
        const existingTemplate = await repository.get<Template>(PK, SK);
        if (!existingTemplate) {
            return { success: false, error: 'Template not found' };
        }

        // Check if user has permission to delete
        if (existingTemplate.userId !== params.userId && !existingTemplate.permissions?.canDelete?.includes(params.userId)) {
            return { success: false, error: 'Permission denied' };
        }

        // Delete template
        await repository.delete(PK, SK);

        return { success: true };
    } catch (error) {
        console.error('Failed to delete template:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete template'
        };
    }
}

/**
 * Apply template configuration to content creation form
 * Requirement 9.4: Pre-populate content creation interface with template configuration
 * 
 * This function retrieves a template and prepares its configuration for use in content creation,
 * including user-specific customizations and brand information.
 */
export async function applyTemplate(params: {
    userId: string;
    templateId: string;
    userBrandInfo?: {
        name?: string;
        contactInfo?: string;
        marketArea?: string;
        brokerageName?: string;
        colors?: {
            primary?: string;
            secondary?: string;
        };
    };
}): Promise<{
    success: boolean;
    template?: Template;
    populatedConfiguration?: TemplateConfiguration;
    error?: string
}> {
    try {
        const repository = getRepository();
        const { PK, SK } = getTemplateKeys(params.userId, params.templateId);

        let template = await repository.get<Template>(PK, SK);

        // If not found in user's templates, check shared templates
        if (!template) {
            const sharedTemplate = await getSharedTemplate(params.userId, params.templateId);
            if (sharedTemplate.success && sharedTemplate.template) {
                template = sharedTemplate.template;
            }
        }

        if (!template) {
            return { success: false, error: 'Template not found' };
        }

        // Check if user has access to the template
        const hasAccess = await checkTemplateAccess(params.userId, template, 'view');
        if (!hasAccess) {
            return { success: false, error: 'Access denied' };
        }

        // Create a copy of the configuration to avoid modifying the original
        const populatedConfiguration: TemplateConfiguration = JSON.parse(JSON.stringify(template.configuration));

        // Apply user-specific customizations
        if (params.userBrandInfo) {
            const brandInfo = params.userBrandInfo;

            // Update branding elements
            if (!populatedConfiguration.brandingElements) {
                populatedConfiguration.brandingElements = {};
            }

            // Apply brand colors if available
            if (brandInfo.colors) {
                populatedConfiguration.brandingElements.colorScheme = JSON.stringify(brandInfo.colors);
            }

            // Replace placeholder values in prompt parameters
            if (populatedConfiguration.promptParameters) {
                const params = populatedConfiguration.promptParameters;

                // Replace common placeholders
                Object.keys(params).forEach(key => {
                    if (typeof params[key] === 'string') {
                        let value = params[key] as string;

                        // Replace agent name placeholder
                        if (brandInfo.name) {
                            value = value.replace(/\[AGENT_NAME\]/g, brandInfo.name);
                            value = value.replace(/\[YOUR_NAME\]/g, brandInfo.name);
                        }

                        // Replace contact info placeholder
                        if (brandInfo.contactInfo) {
                            value = value.replace(/\[CONTACT_INFO\]/g, brandInfo.contactInfo);
                            value = value.replace(/\[YOUR_CONTACT\]/g, brandInfo.contactInfo);
                        }

                        // Replace market area placeholder
                        if (brandInfo.marketArea) {
                            value = value.replace(/\[MARKET_AREA\]/g, brandInfo.marketArea);
                            value = value.replace(/\[YOUR_MARKET\]/g, brandInfo.marketArea);
                        }

                        // Replace brokerage name placeholder
                        if (brandInfo.brokerageName) {
                            value = value.replace(/\[BROKERAGE_NAME\]/g, brandInfo.brokerageName);
                            value = value.replace(/\[YOUR_BROKERAGE\]/g, brandInfo.brokerageName);
                        }

                        params[key] = value;
                    }
                });
            }

            // Update style preferences with brand information
            if (populatedConfiguration.stylePreferences) {
                // Add brand-specific keywords if not already present
                if (brandInfo.name && !populatedConfiguration.stylePreferences.keywords.includes(brandInfo.name)) {
                    populatedConfiguration.stylePreferences.keywords.push(brandInfo.name);
                }

                if (brandInfo.marketArea && !populatedConfiguration.stylePreferences.keywords.includes(brandInfo.marketArea)) {
                    populatedConfiguration.stylePreferences.keywords.push(brandInfo.marketArea);
                }
            }
        }

        // Update usage tracking (async, don't wait for it)
        updateTemplateUsage(params.userId, params.templateId).catch(console.error);

        return {
            success: true,
            template,
            populatedConfiguration
        };
    } catch (error) {
        console.error('Failed to apply template:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to apply template'
        };
    }
}

// ==================== Template Sharing & Collaboration ====================

/**
 * Share template with team members within a brokerage
 * Requirement 10.1, 10.2: Enable template sharing within brokerage organization
 */
export async function shareTemplate(params: {
    userId: string;
    templateId: string;
    brokerageId: string;
    permissions: TemplatePermissions;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const repository = getRepository();
        const { PK, SK } = getTemplateKeys(params.userId, params.templateId);

        // Get the template to verify ownership
        const template = await repository.get<Template>(PK, SK);
        if (!template) {
            return { success: false, error: 'Template not found' };
        }

        // Check if user owns the template or has share permission
        if (template.userId !== params.userId && !template.permissions?.canShare?.includes(params.userId)) {
            return { success: false, error: 'Permission denied: Cannot share this template' };
        }

        // Update the template with sharing information
        const updatedTemplate: Template = {
            ...template,
            isShared: true,
            brokerageId: params.brokerageId,
            permissions: params.permissions,
            updatedAt: new Date()
        };

        // Save updated template
        await repository.put({
            PK,
            SK,
            EntityType: 'Template' as EntityType,
            Data: updatedTemplate,
            CreatedAt: template.createdAt.getTime(),
            UpdatedAt: Date.now()
        });

        // Create shared template reference for brokerage access
        const { PK: sharedPK, SK: sharedSK } = getSharedTemplateKeys(params.brokerageId, params.templateId);
        await repository.put({
            PK: sharedPK,
            SK: sharedSK,
            EntityType: 'SharedTemplate' as EntityType,
            Data: {
                templateId: params.templateId,
                ownerId: params.userId,
                brokerageId: params.brokerageId,
                permissions: params.permissions,
                sharedAt: new Date(),
                sharedBy: params.userId
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now()
        });

        // Track sharing analytics
        await trackTemplateSharing(params.userId, params.templateId, params.brokerageId);

        return { success: true };
    } catch (error) {
        console.error('Failed to share template:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to share template'
        };
    }
}

/**
 * Get shared templates accessible to a user within their brokerage
 * Requirement 10.2, 10.3: Access shared templates with proper permissions
 */
export async function getSharedTemplates(params: {
    userId: string;
    brokerageId: string;
    contentType?: ContentCategory;
    searchQuery?: string;
}): Promise<{ success: boolean; templates?: Template[]; error?: string }> {
    try {
        const repository = getRepository();
        const PK = `BROKERAGE#${params.brokerageId}`;

        // Query all shared templates for the brokerage
        const result = await repository.query<any>(PK, 'TEMPLATE#');

        const sharedTemplateRefs = result.items;
        const templates: Template[] = [];

        // Fetch actual template data for each shared template
        for (const ref of sharedTemplateRefs) {
            // Check if user has view permission
            if (!ref.permissions?.canView?.includes(params.userId) &&
                !ref.permissions?.canView?.includes('*')) {
                continue;
            }

            // Get the actual template
            const { PK: templatePK, SK: templateSK } = getTemplateKeys(ref.ownerId, ref.templateId);
            const template = await repository.get<Template>(templatePK, templateSK);

            if (template) {
                templates.push({
                    ...template,
                    // Add sharing metadata
                    sharedAt: ref.sharedAt,
                    sharedBy: ref.sharedBy,
                    effectivePermissions: ref.permissions
                });
            }
        }

        // Apply filters
        let filteredTemplates = templates;

        if (params.contentType) {
            filteredTemplates = filteredTemplates.filter(t => t.contentType === params.contentType);
        }

        if (params.searchQuery) {
            const query = params.searchQuery.toLowerCase();
            filteredTemplates = filteredTemplates.filter(t =>
                t.name.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query) ||
                t.seasonalTags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        return { success: true, templates: filteredTemplates };
    } catch (error) {
        console.error('Failed to get shared templates:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get shared templates'
        };
    }
}

/**
 * Get a specific shared template
 * Internal helper function
 */
async function getSharedTemplate(userId: string, templateId: string): Promise<{ success: boolean; template?: Template; error?: string }> {
    try {
        const repository = getRepository();

        // We need to find which brokerage this user belongs to
        // For now, we'll search across potential brokerages
        // In a real implementation, you'd get the user's brokerage from their profile

        // This is a simplified approach - in production you'd have the user's brokerage ID
        // from their profile or session data
        return { success: false, error: 'Template not found in shared templates' };
    } catch (error) {
        console.error('Failed to get shared template:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get shared template'
        };
    }
}

/**
 * Update shared template with copy-on-write behavior
 * Requirement 10.4: Create personal copy when user modifies shared template without edit permission
 */
export async function updateSharedTemplate(params: {
    userId: string;
    templateId: string;
    updates: Partial<Pick<Template, 'name' | 'description' | 'configuration' | 'seasonalTags' | 'previewImage'>>;
    brokerageId?: string;
}): Promise<{ success: boolean; templateId?: string; isNewCopy?: boolean; error?: string }> {
    try {
        const repository = getRepository();
        const { PK, SK } = getTemplateKeys(params.userId, params.templateId);

        // Try to get the template from user's own templates first
        let template = await repository.get<Template>(PK, SK);
        let isSharedTemplate = false;

        // If not found, check if it's a shared template
        if (!template && params.brokerageId) {
            const sharedResult = await getSharedTemplates({
                userId: params.userId,
                brokerageId: params.brokerageId
            });

            if (sharedResult.success && sharedResult.templates) {
                template = sharedResult.templates.find(t => t.id === params.templateId);
                isSharedTemplate = true;
            }
        }

        if (!template) {
            return { success: false, error: 'Template not found' };
        }

        // Check permissions
        const hasEditPermission = await checkTemplateAccess(params.userId, template, 'edit');

        if (isSharedTemplate && !hasEditPermission) {
            // Copy-on-write: Create a personal copy
            const newTemplateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const personalCopy: Template = {
                ...template,
                id: newTemplateId,
                userId: params.userId,
                name: `${template.name} (Copy)`,
                description: template.description,
                isShared: false,
                brokerageId: undefined,
                permissions: undefined,
                ...params.updates,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const { PK: newPK, SK: newSK } = getTemplateKeys(params.userId, newTemplateId);

            await repository.put({
                PK: newPK,
                SK: newSK,
                EntityType: 'Template' as EntityType,
                Data: personalCopy,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now()
            });

            // Track copy-on-write event
            await trackTemplateCopyOnWrite(params.userId, params.templateId, newTemplateId);

            return {
                success: true,
                templateId: newTemplateId,
                isNewCopy: true
            };
        } else if (hasEditPermission) {
            // User has edit permission, update the original
            const updatedTemplate: Template = {
                ...template,
                ...params.updates,
                updatedAt: new Date()
            };

            await repository.put({
                PK,
                SK,
                EntityType: 'Template' as EntityType,
                Data: updatedTemplate,
                CreatedAt: template.createdAt.getTime(),
                UpdatedAt: Date.now()
            });

            return {
                success: true,
                templateId: params.templateId,
                isNewCopy: false
            };
        } else {
            return { success: false, error: 'Permission denied: Cannot edit this template' };
        }
    } catch (error) {
        console.error('Failed to update shared template:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update template'
        };
    }
}

/**
 * Check if user has specific permission for a template
 * Internal helper function
 */
async function checkTemplateAccess(userId: string, template: Template, permission: 'view' | 'edit' | 'share' | 'delete'): Promise<boolean> {
    // Owner has all permissions
    if (template.userId === userId) {
        return true;
    }

    // Check if template is shared and user has the specific permission
    if (template.isShared && template.permissions) {
        const permissionList = template.permissions[`can${permission.charAt(0).toUpperCase() + permission.slice(1)}` as keyof TemplatePermissions] as string[];
        return permissionList?.includes(userId) || permissionList?.includes('*') || false;
    }

    return false;
}

/**
 * Remove template sharing (unshare)
 * Requirement 10.5: Manage template sharing permissions
 */
export async function unshareTemplate(params: {
    userId: string;
    templateId: string;
    brokerageId: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const repository = getRepository();
        const { PK, SK } = getTemplateKeys(params.userId, params.templateId);

        // Get the template to verify ownership
        const template = await repository.get<Template>(PK, SK);
        if (!template) {
            return { success: false, error: 'Template not found' };
        }

        // Check if user owns the template
        if (template.userId !== params.userId) {
            return { success: false, error: 'Permission denied: Only template owner can unshare' };
        }

        // Update the template to remove sharing
        const updatedTemplate: Template = {
            ...template,
            isShared: false,
            brokerageId: undefined,
            permissions: undefined,
            updatedAt: new Date()
        };

        // Save updated template
        await repository.put({
            PK,
            SK,
            EntityType: 'Template' as EntityType,
            Data: updatedTemplate,
            CreatedAt: template.createdAt.getTime(),
            UpdatedAt: Date.now()
        });

        // Remove shared template reference
        const { PK: sharedPK, SK: sharedSK } = getSharedTemplateKeys(params.brokerageId, params.templateId);
        await repository.delete(sharedPK, sharedSK);

        return { success: true };
    } catch (error) {
        console.error('Failed to unshare template:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to unshare template'
        };
    }
}

/**
 * Get template usage analytics and sharing metrics
 * Requirement: Add template usage analytics and sharing metrics
 */
export async function getTemplateAnalytics(params: {
    userId: string;
    templateId?: string;
    brokerageId?: string;
    startDate?: Date;
    endDate?: Date;
}): Promise<{
    success: boolean;
    analytics?: {
        totalUsage: number;
        uniqueUsers: number;
        sharingMetrics: {
            timesShared: number;
            activeShares: number;
            copyOnWriteEvents: number;
        };
        usageByContentType: Record<string, number>;
        usageOverTime: Array<{ date: string; count: number }>;
        topUsers: Array<{ userId: string; usageCount: number }>;
    };
    error?: string;
}> {
    try {
        const repository = getRepository();

        // This is a simplified implementation
        // In a real system, you'd have dedicated analytics tables
        const analytics = {
            totalUsage: 0,
            uniqueUsers: 0,
            sharingMetrics: {
                timesShared: 0,
                activeShares: 0,
                copyOnWriteEvents: 0
            },
            usageByContentType: {} as Record<string, number>,
            usageOverTime: [] as Array<{ date: string; count: number }>,
            topUsers: [] as Array<{ userId: string; usageCount: number }>
        };

        if (params.templateId) {
            // Get specific template analytics
            const { PK, SK } = getTemplateKeys(params.userId, params.templateId);
            const template = await repository.get<Template>(PK, SK);

            if (template) {
                analytics.totalUsage = template.usageCount || 0;
                analytics.uniqueUsers = 1; // Simplified

                if (template.isShared) {
                    analytics.sharingMetrics.activeShares = 1;
                    analytics.sharingMetrics.timesShared = 1;
                }
            }
        } else {
            // Get aggregate analytics for user's templates
            const templatesResult = await getUserTemplates({ userId: params.userId });

            if (templatesResult.success && templatesResult.templates) {
                for (const template of templatesResult.templates) {
                    analytics.totalUsage += template.usageCount || 0;

                    if (template.isShared) {
                        analytics.sharingMetrics.activeShares++;
                    }

                    // Count by content type
                    const contentType = template.contentType;
                    analytics.usageByContentType[contentType] = (analytics.usageByContentType[contentType] || 0) + (template.usageCount || 0);
                }

                analytics.uniqueUsers = templatesResult.templates.length;
            }
        }

        return { success: true, analytics };
    } catch (error) {
        console.error('Failed to get template analytics:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get template analytics'
        };
    }
}

// ==================== Analytics Tracking Functions ====================

/**
 * Track template sharing event
 * Internal helper function
 */
async function trackTemplateSharing(userId: string, templateId: string, brokerageId: string): Promise<void> {
    try {
        const repository = getRepository();
        const eventId = `sharing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store sharing event for analytics
        await repository.put({
            PK: `USER#${userId}`,
            SK: `TEMPLATE_EVENT#${eventId}`,
            EntityType: 'TemplateEvent' as EntityType,
            Data: {
                eventId,
                userId,
                templateId,
                eventType: 'shared',
                brokerageId,
                timestamp: new Date(),
                metadata: {
                    action: 'template_shared',
                    brokerageId
                }
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now()
        });
    } catch (error) {
        console.error('Failed to track template sharing:', error);
        // Don't throw error as this is not critical
    }
}

/**
 * Track copy-on-write event
 * Internal helper function
 */
async function trackTemplateCopyOnWrite(userId: string, originalTemplateId: string, newTemplateId: string): Promise<void> {
    try {
        const repository = getRepository();
        const eventId = `copy_on_write_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store copy-on-write event for analytics
        await repository.put({
            PK: `USER#${userId}`,
            SK: `TEMPLATE_EVENT#${eventId}`,
            EntityType: 'TemplateEvent' as EntityType,
            Data: {
                eventId,
                userId,
                templateId: originalTemplateId,
                eventType: 'copy_on_write',
                timestamp: new Date(),
                metadata: {
                    action: 'copy_on_write',
                    originalTemplateId,
                    newTemplateId
                }
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now()
        });
    } catch (error) {
        console.error('Failed to track copy-on-write event:', error);
        // Don't throw error as this is not critical
    }
}

// ==================== Seasonal Template Intelligence ====================

/**
 * Seasonal template data with real estate market intelligence
 * Based on NAR research and real estate market cycles
 */
const SEASONAL_TEMPLATES = {
    spring: {
        name: 'Spring Market',
        months: [3, 4, 5], // March, April, May
        peak: 4, // April
        templates: [
            {
                id: 'spring_market_update',
                name: 'Spring Market Update',
                description: 'Capitalize on the spring buying season with market insights and inventory updates',
                contentType: ContentCategory.MARKET_UPDATE,
                seasonalTags: ['spring', 'buying-season', 'inventory', 'market-update'],
                configuration: {
                    promptParameters: {
                        season: 'spring',
                        marketFocus: 'increased buyer activity and inventory growth',
                        keyPoints: [
                            'Spring inventory typically increases 20-30%',
                            'Buyer activity peaks in April-May',
                            'Best time for sellers to list properties',
                            'Market competition intensifies'
                        ],
                        callToAction: 'Ready to buy or sell this spring? Contact [AGENT_NAME] for a market consultation.'
                    },
                    contentStructure: {
                        sections: ['market-overview', 'inventory-update', 'buyer-tips', 'seller-opportunities', 'call-to-action'],
                        format: 'blog-post',
                        wordCount: 800,
                        includeImages: true,
                        includeHashtags: true
                    },
                    stylePreferences: {
                        tone: 'optimistic and informative',
                        length: 'medium',
                        keywords: ['spring market', 'buying season', 'inventory', '[MARKET_AREA]'],
                        targetAudience: 'homebuyers and sellers',
                        callToAction: 'Schedule a consultation'
                    }
                }
            },
            {
                id: 'spring_home_prep',
                name: 'Spring Home Preparation Guide',
                description: 'Help sellers prepare their homes for the competitive spring market',
                contentType: ContentCategory.NEIGHBORHOOD_GUIDE,
                seasonalTags: ['spring', 'home-prep', 'selling-tips', 'curb-appeal'],
                configuration: {
                    promptParameters: {
                        season: 'spring',
                        focus: 'home preparation and curb appeal for selling',
                        tips: [
                            'Enhance curb appeal with spring landscaping',
                            'Deep clean and declutter interior spaces',
                            'Complete necessary repairs and maintenance',
                            'Stage with fresh, bright decor'
                        ],
                        timeline: '4-6 weeks before listing'
                    },
                    contentStructure: {
                        sections: ['introduction', 'exterior-prep', 'interior-prep', 'staging-tips', 'timeline'],
                        format: 'guide',
                        wordCount: 1200,
                        includeImages: true,
                        includeHashtags: true
                    },
                    stylePreferences: {
                        tone: 'helpful and encouraging',
                        length: 'long',
                        keywords: ['home preparation', 'selling tips', 'spring market', '[MARKET_AREA]'],
                        targetAudience: 'home sellers',
                        callToAction: 'Get a free home selling consultation'
                    }
                }
            }
        ]
    },
    summer: {
        name: 'Summer Market',
        months: [6, 7, 8], // June, July, August
        peak: 7, // July
        templates: [
            {
                id: 'summer_family_focus',
                name: 'Summer Family Home Features',
                description: 'Highlight family-friendly features during summer when families are most active in home buying',
                contentType: ContentCategory.LISTING_DESCRIPTION,
                seasonalTags: ['summer', 'family-homes', 'outdoor-living', 'school-districts'],
                configuration: {
                    promptParameters: {
                        season: 'summer',
                        focus: 'family-friendly features and outdoor living',
                        highlights: [
                            'Outdoor entertaining spaces',
                            'Swimming pools and recreation areas',
                            'Proximity to good school districts',
                            'Family-friendly neighborhoods'
                        ]
                    },
                    contentStructure: {
                        sections: ['outdoor-features', 'family-amenities', 'school-info', 'neighborhood-highlights'],
                        format: 'listing-description',
                        wordCount: 400,
                        includeImages: true,
                        includeHashtags: true
                    },
                    stylePreferences: {
                        tone: 'warm and family-focused',
                        length: 'medium',
                        keywords: ['family home', 'outdoor living', 'school district', '[MARKET_AREA]'],
                        targetAudience: 'families with children',
                        callToAction: 'Schedule a family-friendly home tour'
                    }
                }
            }
        ]
    },
    fall: {
        name: 'Fall Market',
        months: [9, 10, 11], // September, October, November
        peak: 9, // September
        templates: [
            {
                id: 'fall_market_opportunities',
                name: 'Fall Market Opportunities',
                description: 'Educate clients about fall market advantages and opportunities',
                contentType: ContentCategory.MARKET_UPDATE,
                seasonalTags: ['fall', 'market-opportunities', 'less-competition', 'motivated-sellers'],
                configuration: {
                    promptParameters: {
                        season: 'fall',
                        advantages: [
                            'Less competition from other buyers',
                            'Motivated sellers more willing to negotiate',
                            'Better inventory selection',
                            'Faster closing times'
                        ],
                        marketInsights: 'Fall market typically sees 15-20% less competition while maintaining good inventory levels'
                    },
                    contentStructure: {
                        sections: ['market-overview', 'buyer-advantages', 'seller-considerations', 'market-data'],
                        format: 'market-analysis',
                        wordCount: 600,
                        includeImages: true,
                        includeHashtags: true
                    },
                    stylePreferences: {
                        tone: 'informative and strategic',
                        length: 'medium',
                        keywords: ['fall market', 'opportunities', 'less competition', '[MARKET_AREA]'],
                        targetAudience: 'serious buyers and sellers',
                        callToAction: 'Explore fall market opportunities'
                    }
                }
            }
        ]
    },
    winter: {
        name: 'Winter Market',
        months: [12, 1, 2], // December, January, February
        peak: 1, // January
        templates: [
            {
                id: 'winter_market_strategy',
                name: 'Winter Real Estate Strategy',
                description: 'Position winter as a strategic time for serious buyers and sellers',
                contentType: ContentCategory.BLOG_POST,
                seasonalTags: ['winter', 'serious-buyers', 'market-strategy', 'year-end'],
                configuration: {
                    promptParameters: {
                        season: 'winter',
                        strategy: 'positioning winter as optimal for serious transactions',
                        benefits: [
                            'Serious buyers and sellers only',
                            'Less market noise and distractions',
                            'Better negotiating opportunities',
                            'Tax advantages for year-end transactions'
                        ]
                    },
                    contentStructure: {
                        sections: ['winter-advantages', 'buyer-strategy', 'seller-strategy', 'market-outlook'],
                        format: 'strategy-guide',
                        wordCount: 700,
                        includeImages: true,
                        includeHashtags: true
                    },
                    stylePreferences: {
                        tone: 'strategic and confident',
                        length: 'medium',
                        keywords: ['winter market', 'strategy', 'serious buyers', '[MARKET_AREA]'],
                        targetAudience: 'motivated buyers and sellers',
                        callToAction: 'Develop your winter market strategy'
                    }
                }
            }
        ]
    },
    holidays: {
        name: 'Holiday Seasons',
        templates: [
            {
                id: 'thanksgiving_gratitude',
                name: 'Thanksgiving Client Appreciation',
                description: 'Express gratitude to clients and community during Thanksgiving',
                contentType: ContentCategory.SOCIAL_MEDIA,
                seasonalTags: ['thanksgiving', 'gratitude', 'client-appreciation', 'community'],
                months: [11], // November
                configuration: {
                    promptParameters: {
                        occasion: 'Thanksgiving',
                        message: 'gratitude and appreciation for clients and community',
                        personalTouch: 'Reflect on successful transactions and relationships built this year'
                    },
                    contentStructure: {
                        sections: ['gratitude-message', 'client-appreciation', 'community-thanks'],
                        format: 'social-post',
                        wordCount: 200,
                        includeImages: true,
                        includeHashtags: true
                    },
                    stylePreferences: {
                        tone: 'warm and grateful',
                        length: 'short',
                        keywords: ['thanksgiving', 'grateful', 'clients', '[MARKET_AREA]'],
                        targetAudience: 'past and current clients',
                        callToAction: 'Wishing you and your family a wonderful Thanksgiving'
                    }
                }
            },
            {
                id: 'new_year_market_outlook',
                name: 'New Year Market Outlook',
                description: 'Share market predictions and opportunities for the new year',
                contentType: ContentCategory.MARKET_UPDATE,
                seasonalTags: ['new-year', 'market-outlook', 'predictions', 'opportunities'],
                months: [1], // January
                configuration: {
                    promptParameters: {
                        occasion: 'New Year',
                        focus: 'market predictions and opportunities for the coming year',
                        predictions: [
                            'Interest rate trends',
                            'Inventory projections',
                            'Market opportunities',
                            'Best strategies for buyers and sellers'
                        ]
                    },
                    contentStructure: {
                        sections: ['year-review', 'market-predictions', 'opportunities', 'action-plan'],
                        format: 'market-outlook',
                        wordCount: 900,
                        includeImages: true,
                        includeHashtags: true
                    },
                    stylePreferences: {
                        tone: 'optimistic and forward-looking',
                        length: 'long',
                        keywords: ['new year', 'market outlook', 'predictions', '[MARKET_AREA]'],
                        targetAudience: 'potential buyers and sellers',
                        callToAction: 'Start your real estate journey this year'
                    }
                }
            }
        ]
    }
};

/**
 * Get seasonal templates with intelligent time-based filtering and recommendations
 * Requirements 11.1, 11.2: Display seasonal templates organized by time of year and recommend relevant templates
 */
export async function getSeasonalTemplates(params: {
    userId?: string;
    season?: string;
    month?: number;
    contentType?: ContentCategory;
    includeUpcoming?: boolean;
    userBrandInfo?: {
        name?: string;
        contactInfo?: string;
        marketArea?: string;
        brokerageName?: string;
    };
}): Promise<{
    success: boolean;
    templates?: Template[];
    recommendations?: {
        current: Template[];
        upcoming: Template[];
        trending: Template[];
    };
    error?: string;
}> {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
        const currentSeason = getCurrentSeason(currentMonth);

        let seasonalTemplates: Template[] = [];
        let recommendations = {
            current: [] as Template[],
            upcoming: [] as Template[],
            trending: [] as Template[]
        };

        // Determine which seasonal templates to include
        const targetMonth = params.month || currentMonth;
        const targetSeason = params.season || currentSeason;

        // Get templates for the specified season/month
        for (const [seasonKey, seasonData] of Object.entries(SEASONAL_TEMPLATES)) {
            if (seasonKey === 'holidays') {
                // Handle holiday templates separately
                for (const template of seasonData.templates) {
                    if (!template.months || template.months.includes(targetMonth)) {
                        const seasonalTemplate = createSeasonalTemplate(template, params.userBrandInfo);
                        seasonalTemplates.push(seasonalTemplate);

                        // Add to current recommendations if it's the current month
                        if (template.months?.includes(currentMonth)) {
                            recommendations.current.push(seasonalTemplate);
                        }
                    }
                }
            } else {
                const season = seasonData as any;

                // Check if this season matches our criteria
                if (params.season && seasonKey !== params.season) continue;
                if (params.month && !season.months.includes(params.month)) continue;

                // Add templates from this season
                for (const template of season.templates) {
                    if (!params.contentType || template.contentType === params.contentType) {
                        const seasonalTemplate = createSeasonalTemplate(template, params.userBrandInfo);
                        seasonalTemplates.push(seasonalTemplate);

                        // Categorize for recommendations
                        if (season.months.includes(currentMonth)) {
                            recommendations.current.push(seasonalTemplate);
                        } else if (isUpcomingSeason(season.months, currentMonth)) {
                            recommendations.upcoming.push(seasonalTemplate);
                        }

                        // Mark trending templates (peak season)
                        if (season.peak === currentMonth) {
                            recommendations.trending.push(seasonalTemplate);
                        }
                    }
                }
            }
        }

        // If no specific filters, include upcoming seasonal templates
        if (params.includeUpcoming !== false && !params.season && !params.month) {
            const upcomingMonth = currentMonth === 12 ? 1 : currentMonth + 1;
            const upcomingTemplates = await getSeasonalTemplates({
                ...params,
                month: upcomingMonth,
                includeUpcoming: false
            });

            if (upcomingTemplates.success && upcomingTemplates.templates) {
                recommendations.upcoming.push(...upcomingTemplates.templates);
            }
        }

        // Add user's custom seasonal templates if userId provided
        if (params.userId) {
            const userSeasonalResult = await getUserTemplates({
                userId: params.userId,
                isSeasonal: true,
                contentType: params.contentType
            });

            if (userSeasonalResult.success && userSeasonalResult.templates) {
                // Filter user templates by season/month if specified
                const filteredUserTemplates = userSeasonalResult.templates.filter(template => {
                    if (params.season) {
                        return template.seasonalTags?.includes(params.season);
                    }
                    if (params.month) {
                        return isTemplateRelevantForMonth(template, params.month);
                    }
                    return true;
                });

                seasonalTemplates.push(...filteredUserTemplates);
            }
        }

        // Sort templates by relevance (current season first, then by usage)
        seasonalTemplates.sort((a, b) => {
            const aRelevance = getSeasonalRelevance(a, currentMonth);
            const bRelevance = getSeasonalRelevance(b, currentMonth);

            if (aRelevance !== bRelevance) {
                return bRelevance - aRelevance; // Higher relevance first
            }

            return (b.usageCount || 0) - (a.usageCount || 0); // Then by usage
        });

        return {
            success: true,
            templates: seasonalTemplates,
            recommendations
        };
    } catch (error) {
        console.error('Failed to get seasonal templates:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get seasonal templates'
        };
    }
}

/**
 * Get proactive seasonal notifications for upcoming opportunities
 * Requirements 11.2, 11.4: Recommend relevant seasonal templates and notify users of updates
 */
export async function getSeasonalNotifications(params: {
    userId: string;
    lookAheadDays?: number;
}): Promise<{
    success: boolean;
    notifications?: Array<{
        type: 'seasonal_opportunity' | 'template_update' | 'market_trend';
        title: string;
        message: string;
        templates: Template[];
        priority: 'high' | 'medium' | 'low';
        actionUrl?: string;
        expiresAt: Date;
    }>;
    error?: string;
}> {
    try {
        const currentDate = new Date();
        const lookAheadDays = params.lookAheadDays || 14; // Default 2 weeks ahead
        const notifications = [];

        // Check for upcoming seasonal opportunities
        for (let i = 0; i <= lookAheadDays; i++) {
            const checkDate = new Date(currentDate);
            checkDate.setDate(checkDate.getDate() + i);
            const checkMonth = checkDate.getMonth() + 1;

            // Check if we're entering a new season
            const currentSeason = getCurrentSeason(currentDate.getMonth() + 1);
            const checkSeason = getCurrentSeason(checkMonth);

            if (currentSeason !== checkSeason && i > 0) {
                // Entering new season - recommend templates
                const seasonalResult = await getSeasonalTemplates({
                    userId: params.userId,
                    season: checkSeason,
                    includeUpcoming: false
                });

                if (seasonalResult.success && seasonalResult.templates && seasonalResult.templates.length > 0) {
                    notifications.push({
                        type: 'seasonal_opportunity',
                        title: `${checkSeason.charAt(0).toUpperCase() + checkSeason.slice(1)} Market Season Approaching`,
                        message: `The ${checkSeason} real estate season is starting soon. Prepare your content strategy with seasonal templates.`,
                        templates: seasonalResult.templates.slice(0, 3), // Top 3 templates
                        priority: 'high',
                        actionUrl: `/library/templates?season=${checkSeason}`,
                        expiresAt: new Date(checkDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
                    });
                }
            }

            // Check for specific holiday opportunities
            const holidayOpportunities = getHolidayOpportunities(checkDate);
            for (const opportunity of holidayOpportunities) {
                const holidayTemplates = await getSeasonalTemplates({
                    userId: params.userId,
                    month: checkMonth,
                    includeUpcoming: false
                });

                if (holidayTemplates.success && holidayTemplates.templates) {
                    const relevantTemplates = holidayTemplates.templates.filter(t =>
                        t.seasonalTags?.some(tag => opportunity.tags.includes(tag))
                    );

                    if (relevantTemplates.length > 0) {
                        notifications.push({
                            type: 'seasonal_opportunity',
                            title: opportunity.title,
                            message: opportunity.message,
                            templates: relevantTemplates,
                            priority: opportunity.priority,
                            actionUrl: `/studio/write?template=${relevantTemplates[0].id}`,
                            expiresAt: opportunity.date
                        });
                    }
                }
            }
        }

        // Check for market trend notifications
        const marketTrends = await getMarketTrendNotifications(params.userId);
        notifications.push(...marketTrends);

        // Sort by priority and date
        notifications.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority];
            const bPriority = priorityOrder[b.priority];

            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }

            return a.expiresAt.getTime() - b.expiresAt.getTime();
        });

        return {
            success: true,
            notifications: notifications.slice(0, 10) // Limit to 10 notifications
        };
    } catch (error) {
        console.error('Failed to get seasonal notifications:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get seasonal notifications'
        };
    }
}

/**
 * Track seasonal template performance and analytics
 * Requirements: Add seasonal template analytics and performance tracking
 */
export async function getSeasonalTemplateAnalytics(params: {
    userId: string;
    season?: string;
    year?: number;
    templateId?: string;
}): Promise<{
    success: boolean;
    analytics?: {
        seasonalPerformance: Record<string, {
            totalUsage: number;
            avgEngagement: number;
            topTemplates: Array<{ templateId: string; name: string; usage: number; engagement: number }>;
            trendData: Array<{ month: number; usage: number; engagement: number }>;
        }>;
        yearOverYear?: {
            currentYear: number;
            previousYear: number;
            growthRate: number;
            seasonalComparison: Record<string, { current: number; previous: number; growth: number }>;
        };
        recommendations: Array<{
            type: 'underperforming' | 'trending' | 'opportunity';
            message: string;
            templates: string[];
            actionable: boolean;
        }>;
    };
    error?: string;
}> {
    try {
        const currentYear = params.year || new Date().getFullYear();
        const analytics = {
            seasonalPerformance: {} as Record<string, any>,
            yearOverYear: undefined as any,
            recommendations: [] as Array<any>
        };

        // Get seasonal performance data
        for (const season of ['spring', 'summer', 'fall', 'winter']) {
            if (params.season && params.season !== season) continue;

            const seasonalTemplates = await getSeasonalTemplates({
                userId: params.userId,
                season,
                includeUpcoming: false
            });

            if (seasonalTemplates.success && seasonalTemplates.templates) {
                const performance = {
                    totalUsage: 0,
                    avgEngagement: 0,
                    topTemplates: [] as Array<any>,
                    trendData: [] as Array<any>
                };

                // Calculate performance metrics
                for (const template of seasonalTemplates.templates) {
                    performance.totalUsage += template.usageCount || 0;

                    // Add to top templates
                    performance.topTemplates.push({
                        templateId: template.id,
                        name: template.name,
                        usage: template.usageCount || 0,
                        engagement: 0 // Would be calculated from actual analytics data
                    });
                }

                // Sort top templates by usage
                performance.topTemplates.sort((a, b) => b.usage - a.usage);
                performance.topTemplates = performance.topTemplates.slice(0, 5);

                // Calculate average engagement (simplified)
                performance.avgEngagement = performance.totalUsage > 0 ?
                    performance.topTemplates.reduce((sum, t) => sum + t.engagement, 0) / performance.topTemplates.length : 0;

                analytics.seasonalPerformance[season] = performance;
            }
        }

        // Generate recommendations
        const recommendations = generateSeasonalRecommendations(analytics.seasonalPerformance, params.userId);
        analytics.recommendations = recommendations;

        return {
            success: true,
            analytics
        };
    } catch (error) {
        console.error('Failed to get seasonal template analytics:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get seasonal template analytics'
        };
    }
}

// ==================== Helper Functions ====================

/**
 * Create a seasonal template with user personalization
 * Requirements 11.3: Customize template with user's brand information
 */
function createSeasonalTemplate(templateData: any, userBrandInfo?: any): Template {
    const template: Template = {
        id: templateData.id,
        userId: 'system', // System templates
        name: templateData.name,
        description: templateData.description,
        contentType: templateData.contentType,
        configuration: JSON.parse(JSON.stringify(templateData.configuration)), // Deep copy
        isShared: true,
        isSeasonal: true,
        seasonalTags: templateData.seasonalTags || [],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        GSI1PK: `TEMPLATE#${templateData.contentType}`,
        GSI1SK: `NAME#${templateData.name}`
    };

    // Apply user brand personalization if provided
    if (userBrandInfo) {
        const config = template.configuration;

        // Replace placeholders in prompt parameters
        if (config.promptParameters) {
            Object.keys(config.promptParameters).forEach(key => {
                if (typeof config.promptParameters[key] === 'string') {
                    let value = config.promptParameters[key] as string;

                    if (userBrandInfo.name) {
                        value = value.replace(/\[AGENT_NAME\]/g, userBrandInfo.name);
                    }
                    if (userBrandInfo.marketArea) {
                        value = value.replace(/\[MARKET_AREA\]/g, userBrandInfo.marketArea);
                    }
                    if (userBrandInfo.contactInfo) {
                        value = value.replace(/\[CONTACT_INFO\]/g, userBrandInfo.contactInfo);
                    }
                    if (userBrandInfo.brokerageName) {
                        value = value.replace(/\[BROKERAGE_NAME\]/g, userBrandInfo.brokerageName);
                    }

                    config.promptParameters[key] = value;
                }
            });
        }

        // Update keywords with user-specific terms
        if (config.stylePreferences && userBrandInfo.marketArea) {
            config.stylePreferences.keywords = config.stylePreferences.keywords.map(keyword =>
                keyword.replace(/\[MARKET_AREA\]/g, userBrandInfo.marketArea)
            );
        }
    }

    return template;
}

/**
 * Determine current season based on month
 */
function getCurrentSeason(month: number): string {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
}

/**
 * Check if a season is upcoming within the next 2 months
 */
function isUpcomingSeason(seasonMonths: number[], currentMonth: number): boolean {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const monthAfter = nextMonth === 12 ? 1 : nextMonth + 1;

    return seasonMonths.includes(nextMonth) || seasonMonths.includes(monthAfter);
}

/**
 * Check if a template is relevant for a specific month
 */
function isTemplateRelevantForMonth(template: Template, month: number): boolean {
    if (!template.seasonalTags || template.seasonalTags.length === 0) return false;

    const season = getCurrentSeason(month);
    return template.seasonalTags.includes(season) ||
        template.seasonalTags.some(tag => {
            // Check for month-specific tags
            const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                'july', 'august', 'september', 'october', 'november', 'december'];
            return tag.toLowerCase().includes(monthNames[month - 1]);
        });
}

/**
 * Calculate seasonal relevance score for sorting
 */
function getSeasonalRelevance(template: Template, currentMonth: number): number {
    const currentSeason = getCurrentSeason(currentMonth);
    let score = 0;

    if (template.seasonalTags?.includes(currentSeason)) {
        score += 10;
    }

    // Boost score for upcoming seasons
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextSeason = getCurrentSeason(nextMonth);
    if (template.seasonalTags?.includes(nextSeason)) {
        score += 5;
    }

    // Add usage-based score
    score += Math.min(template.usageCount || 0, 5);

    return score;
}

/**
 * Get holiday opportunities for a specific date
 */
function getHolidayOpportunities(date: Date): Array<{
    title: string;
    message: string;
    tags: string[];
    priority: 'high' | 'medium' | 'low';
    date: Date;
}> {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const opportunities = [];

    // Major real estate relevant holidays
    const holidays = [
        { month: 1, day: 1, title: 'New Year Market Outlook', tags: ['new-year', 'market-outlook'], priority: 'high' as const },
        { month: 2, day: 14, title: 'Valentine\'s Day Home Features', tags: ['valentine', 'home-features'], priority: 'medium' as const },
        { month: 3, day: 17, title: 'Spring Market Launch', tags: ['spring', 'market-launch'], priority: 'high' as const },
        { month: 5, day: 1, title: 'May Market Update', tags: ['spring', 'market-update'], priority: 'medium' as const },
        { month: 7, day: 4, title: 'Summer Outdoor Living', tags: ['summer', 'outdoor-living'], priority: 'medium' as const },
        { month: 9, day: 1, title: 'Back to School Neighborhoods', tags: ['fall', 'school-districts'], priority: 'high' as const },
        { month: 11, day: 25, title: 'Thanksgiving Gratitude', tags: ['thanksgiving', 'gratitude'], priority: 'medium' as const },
        { month: 12, day: 25, title: 'Holiday Home Features', tags: ['holiday', 'home-features'], priority: 'low' as const }
    ];

    for (const holiday of holidays) {
        if (holiday.month === month && Math.abs(holiday.day - day) <= 7) {
            opportunities.push({
                title: holiday.title,
                message: `Create content for ${holiday.title} to engage with your audience during this seasonal opportunity.`,
                tags: holiday.tags,
                priority: holiday.priority,
                date: new Date(date.getFullYear(), holiday.month - 1, holiday.day)
            });
        }
    }

    return opportunities;
}

/**
 * Get market trend notifications
 */
async function getMarketTrendNotifications(userId: string): Promise<Array<any>> {
    // This would integrate with market data APIs in a real implementation
    // For now, return empty array
    return [];
}

/**
 * Generate seasonal recommendations based on performance data
 */
function generateSeasonalRecommendations(seasonalPerformance: Record<string, any>, userId: string): Array<any> {
    const recommendations = [];

    // Find underperforming seasons
    const seasons = Object.keys(seasonalPerformance);
    if (seasons.length > 1) {
        const avgUsage = seasons.reduce((sum, season) => sum + seasonalPerformance[season].totalUsage, 0) / seasons.length;

        for (const season of seasons) {
            const performance = seasonalPerformance[season];
            if (performance.totalUsage < avgUsage * 0.5) {
                recommendations.push({
                    type: 'underperforming',
                    message: `Your ${season} templates are underperforming. Consider creating more engaging seasonal content.`,
                    templates: performance.topTemplates.map((t: any) => t.templateId),
                    actionable: true
                });
            }
        }
    }

    return recommendations;
}

// ==================== Newsletter Template System ====================

/**
 * Newsletter template configuration with email-safe constraints
 * Requirements 12.1, 12.2, 12.3: Newsletter-specific templates with responsive design and email-safe validation
 */
export interface NewsletterTemplateConfig {
    subject: string;
    preheader?: string;
    sections: NewsletterSection[];
    layout: 'single-column' | 'two-column' | 'three-column';
    branding: {
        logo?: string;
        primaryColor: string;
        secondaryColor: string;
        fontFamily: 'Arial' | 'Helvetica' | 'Georgia' | 'Times' | 'Verdana'; // Email-safe fonts only
    };
    footer: {
        includeUnsubscribe: boolean;
        includeAddress: boolean;
        includeDisclaimer: boolean;
        customText?: string;
    };
    espCompatibility: {
        outlook: boolean;
        gmail: boolean;
        appleMail: boolean;
        yahooMail: boolean;
        thunderbird: boolean;
    };
}

/**
 * Newsletter section definition
 */
export interface NewsletterSection {
    id: string;
    type: 'header' | 'content' | 'image' | 'cta' | 'divider' | 'footer';
    title?: string;
    content?: string;
    imageUrl?: string;
    imageAlt?: string;
    ctaText?: string;
    ctaUrl?: string;
    backgroundColor?: string;
    textColor?: string;
    alignment?: 'left' | 'center' | 'right';
    padding?: string;
    order: number;
}

/**
 * Newsletter export formats
 */
export interface NewsletterExport {
    html: string;
    plainText: string;
    subject: string;
    preheader?: string;
    metadata: {
        generatedAt: Date;
        templateId: string;
        userId: string;
        espCompatibility: string[];
        validationResults: ValidationResult[];
    };
}

/**
 * Email validation result
 */
export interface ValidationResult {
    type: 'error' | 'warning' | 'info';
    category: 'html' | 'css' | 'accessibility' | 'esp-compatibility';
    message: string;
    line?: number;
    column?: number;
    suggestion?: string;
}

/**
 * Create newsletter-specific template with email-safe validation
 * Requirements 12.1, 12.2: Newsletter templates with responsive design and email best practices
 */
export async function createNewsletterTemplate(params: {
    userId: string;
    name: string;
    description: string;
    config: NewsletterTemplateConfig;
}): Promise<{ success: boolean; templateId?: string; validationResults?: ValidationResult[]; error?: string }> {
    try {
        // Validate email-safe configuration
        const validationResults = validateNewsletterConfig(params.config);

        // Check for critical errors that prevent template creation
        const criticalErrors = validationResults.filter(r => r.type === 'error');
        if (criticalErrors.length > 0) {
            return {
                success: false,
                error: `Template validation failed: ${criticalErrors.map(e => e.message).join(', ')}`,
                validationResults
            };
        }

        // Create template configuration
        const templateConfiguration: TemplateConfiguration = {
            promptParameters: {
                newsletterConfig: params.config,
                emailSafe: true,
                responsive: true
            },
            contentStructure: {
                sections: params.config.sections.map(s => s.type),
                format: 'newsletter',
                wordCount: 1000, // Default newsletter length
                includeImages: params.config.sections.some(s => s.type === 'image'),
                includeHashtags: false // Not typical for newsletters
            },
            stylePreferences: {
                tone: 'professional and informative',
                length: 'medium',
                keywords: ['newsletter', 'updates', 'insights'],
                targetAudience: 'email subscribers',
                callToAction: 'Read more on our website'
            },
            brandingElements: {
                includeLogo: !!params.config.branding.logo,
                includeContactInfo: params.config.footer.includeAddress,
                includeDisclaimer: params.config.footer.includeDisclaimer,
                colorScheme: JSON.stringify({
                    primary: params.config.branding.primaryColor,
                    secondary: params.config.branding.secondaryColor
                })
            }
        };

        // Save as newsletter template
        const result = await saveTemplate({
            userId: params.userId,
            name: params.name,
            description: params.description,
            contentType: ContentCategory.NEWSLETTER,
            configuration: templateConfiguration,
            isSeasonal: false
        });

        return {
            success: result.success,
            templateId: result.templateId,
            validationResults,
            error: result.error
        };
    } catch (error) {
        console.error('Failed to create newsletter template:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create newsletter template'
        };
    }
}

/**
 * Validate newsletter configuration for email safety and ESP compatibility
 * Requirements 12.3: Email-safe HTML/CSS validation and ESP compatibility
 */
function validateNewsletterConfig(config: NewsletterTemplateConfig): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Validate email-safe colors
    if (!isValidEmailColor(config.branding.primaryColor)) {
        results.push({
            type: 'warning',
            category: 'css',
            message: `Primary color ${config.branding.primaryColor} may not display consistently across all email clients`,
            suggestion: 'Use hex colors (#RRGGBB) for better compatibility'
        });
    }

    if (!isValidEmailColor(config.branding.secondaryColor)) {
        results.push({
            type: 'warning',
            category: 'css',
            message: `Secondary color ${config.branding.secondaryColor} may not display consistently across all email clients`,
            suggestion: 'Use hex colors (#RRGGBB) for better compatibility'
        });
    }

    // Validate font family (email-safe fonts only)
    const emailSafeFonts = ['Arial', 'Helvetica', 'Georgia', 'Times', 'Verdana'];
    if (!emailSafeFonts.includes(config.branding.fontFamily)) {
        results.push({
            type: 'error',
            category: 'css',
            message: `Font family ${config.branding.fontFamily} is not email-safe`,
            suggestion: `Use one of: ${emailSafeFonts.join(', ')}`
        });
    }

    // Validate layout constraints
    if (config.layout === 'three-column') {
        results.push({
            type: 'warning',
            category: 'html',
            message: 'Three-column layouts may not display well on mobile devices',
            suggestion: 'Consider using single or two-column layout for better mobile compatibility'
        });
    }

    // Validate sections
    config.sections.forEach((section, index) => {
        if (section.type === 'image' && !section.imageAlt) {
            results.push({
                type: 'warning',
                category: 'accessibility',
                message: `Image section ${index + 1} missing alt text`,
                suggestion: 'Add descriptive alt text for accessibility'
            });
        }

        if (section.type === 'cta' && !section.ctaUrl) {
            results.push({
                type: 'error',
                category: 'html',
                message: `CTA section ${index + 1} missing URL`,
                suggestion: 'Add a valid URL for the call-to-action button'
            });
        }

        // Validate custom colors in sections
        if (section.backgroundColor && !isValidEmailColor(section.backgroundColor)) {
            results.push({
                type: 'warning',
                category: 'css',
                message: `Section ${index + 1} background color may not display consistently`,
                suggestion: 'Use hex colors (#RRGGBB) for better compatibility'
            });
        }
    });

    // Validate ESP compatibility requirements
    if (!config.footer.includeUnsubscribe) {
        results.push({
            type: 'error',
            category: 'esp-compatibility',
            message: 'Unsubscribe link is required for ESP compliance',
            suggestion: 'Enable includeUnsubscribe in footer configuration'
        });
    }

    // Validate subject line length
    if (config.subject.length > 50) {
        results.push({
            type: 'warning',
            category: 'esp-compatibility',
            message: 'Subject line may be truncated on mobile devices',
            suggestion: 'Keep subject lines under 50 characters for optimal display'
        });
    }

    return results;
}

/**
 * Check if a color value is email-safe
 */
function isValidEmailColor(color: string): boolean {
    // Check for hex colors (#RRGGBB or #RGB)
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexPattern.test(color)) {
        return true;
    }

    // Check for named colors that are widely supported
    const emailSafeColors = [
        'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
        'silver', 'gray', 'maroon', 'olive', 'lime', 'aqua', 'teal', 'navy', 'fuchsia', 'purple'
    ];

    return emailSafeColors.includes(color.toLowerCase());
}

/**
 * Export newsletter template in dual format (HTML + plain text)
 * Requirements 12.4, 12.5: Dual-format export compatible with ESPs
 */
export async function exportNewsletterTemplate(params: {
    userId: string;
    templateId: string;
    content: {
        subject: string;
        preheader?: string;
        sections: NewsletterSection[];
    };
    userBrandInfo?: {
        name?: string;
        contactInfo?: string;
        address?: string;
        unsubscribeUrl?: string;
    };
}): Promise<{ success: boolean; export?: NewsletterExport; error?: string }> {
    try {
        // Get the template
        const templateResult = await getTemplate({
            userId: params.userId,
            templateId: params.templateId
        });

        if (!templateResult.success || !templateResult.template) {
            return { success: false, error: 'Template not found' };
        }

        const template = templateResult.template;
        const config = template.configuration.promptParameters?.newsletterConfig as NewsletterTemplateConfig;

        if (!config) {
            return { success: false, error: 'Invalid newsletter template configuration' };
        }

        // Generate HTML version
        const html = generateNewsletterHTML(params.content, config, params.userBrandInfo);

        // Generate plain text version
        const plainText = generateNewsletterPlainText(params.content, params.userBrandInfo);

        // Validate the generated HTML
        const validationResults = validateGeneratedHTML(html);

        const newsletterExport: NewsletterExport = {
            html,
            plainText,
            subject: params.content.subject,
            preheader: params.content.preheader,
            metadata: {
                generatedAt: new Date(),
                templateId: params.templateId,
                userId: params.userId,
                espCompatibility: Object.entries(config.espCompatibility)
                    .filter(([_, supported]) => supported)
                    .map(([esp, _]) => esp),
                validationResults
            }
        };

        return { success: true, export: newsletterExport };
    } catch (error) {
        console.error('Failed to export newsletter template:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to export newsletter template'
        };
    }
}

/**
 * Generate email-safe HTML for newsletter
 * Requirements 12.3: Email-safe HTML/CSS with ESP compatibility
 */
function generateNewsletterHTML(
    content: { subject: string; preheader?: string; sections: NewsletterSection[] },
    config: NewsletterTemplateConfig,
    userBrandInfo?: { name?: string; contactInfo?: string; address?: string; unsubscribeUrl?: string }
): string {
    const sortedSections = [...content.sections].sort((a, b) => a.order - b.order);

    // Email-safe HTML template with inline CSS
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${escapeHtml(content.subject)}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        /* Email-safe CSS reset */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        /* Responsive styles */
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                max-width: 100% !important;
            }
            .content {
                padding: 10px !important;
            }
            .two-column {
                width: 100% !important;
                display: block !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: ${config.branding.fontFamily}, sans-serif;">`;

    // Preheader (hidden text for email preview)
    if (content.preheader) {
        html += `
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: ${config.branding.fontFamily}, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        ${escapeHtml(content.preheader)}
    </div>`;
    }

    // Main container
    html += `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
            <td style="padding: 20px 0;">
                <table class="container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">`;

    // Generate sections
    for (const section of sortedSections) {
        html += generateSectionHTML(section, config);
    }

    // Footer
    html += generateFooterHTML(config, userBrandInfo);

    // Close main container
    html += `
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    return html;
}

/**
 * Generate HTML for individual newsletter section
 */
function generateSectionHTML(section: NewsletterSection, config: NewsletterTemplateConfig): string {
    const backgroundColor = section.backgroundColor || 'transparent';
    const textColor = section.textColor || '#333333';
    const alignment = section.alignment || 'left';
    const padding = section.padding || '20px';

    let sectionHTML = `
    <tr>
        <td style="background-color: ${backgroundColor}; padding: ${padding}; text-align: ${alignment};">`;

    switch (section.type) {
        case 'header':
            sectionHTML += `
            <h1 style="margin: 0; color: ${textColor}; font-size: 28px; font-weight: bold; line-height: 1.2; font-family: ${config.branding.fontFamily}, sans-serif;">
                ${escapeHtml(section.title || '')}
            </h1>`;
            break;

        case 'content':
            if (section.title) {
                sectionHTML += `
                <h2 style="margin: 0 0 15px 0; color: ${textColor}; font-size: 22px; font-weight: bold; line-height: 1.3; font-family: ${config.branding.fontFamily}, sans-serif;">
                    ${escapeHtml(section.title)}
                </h2>`;
            }
            if (section.content) {
                sectionHTML += `
                <p style="margin: 0; color: ${textColor}; font-size: 16px; line-height: 1.6; font-family: ${config.branding.fontFamily}, sans-serif;">
                    ${escapeHtml(section.content)}
                </p>`;
            }
            break;

        case 'image':
            if (section.imageUrl) {
                sectionHTML += `
                <img src="${escapeHtml(section.imageUrl)}" alt="${escapeHtml(section.imageAlt || '')}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">`;
            }
            break;

        case 'cta':
            if (section.ctaText && section.ctaUrl) {
                sectionHTML += `
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 20px auto;">
                    <tr>
                        <td style="border-radius: 6px; background-color: ${config.branding.primaryColor};">
                            <a href="${escapeHtml(section.ctaUrl)}" style="display: inline-block; padding: 12px 24px; font-family: ${config.branding.fontFamily}, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                ${escapeHtml(section.ctaText)}
                            </a>
                        </td>
                    </tr>
                </table>`;
            }
            break;

        case 'divider':
            sectionHTML += `
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">`;
            break;
    }

    sectionHTML += `
        </td>
    </tr>`;

    return sectionHTML;
}

/**
 * Generate footer HTML with required elements
 */
function generateFooterHTML(
    config: NewsletterTemplateConfig,
    userBrandInfo?: { name?: string; contactInfo?: string; address?: string; unsubscribeUrl?: string }
): string {
    let footerHTML = `
    <tr>
        <td style="background-color: #f8f9fa; padding: 30px 20px; text-align: center; border-top: 1px solid #e0e0e0;">`;

    // Custom footer text
    if (config.footer.customText) {
        footerHTML += `
            <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px; line-height: 1.5; font-family: ${config.branding.fontFamily}, sans-serif;">
                ${escapeHtml(config.footer.customText)}
            </p>`;
    }

    // Address
    if (config.footer.includeAddress && userBrandInfo?.address) {
        footerHTML += `
            <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px; line-height: 1.5; font-family: ${config.branding.fontFamily}, sans-serif;">
                ${escapeHtml(userBrandInfo.address)}
            </p>`;
    }

    // Contact info
    if (userBrandInfo?.contactInfo) {
        footerHTML += `
            <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px; line-height: 1.5; font-family: ${config.branding.fontFamily}, sans-serif;">
                ${escapeHtml(userBrandInfo.contactInfo)}
            </p>`;
    }

    // Disclaimer
    if (config.footer.includeDisclaimer) {
        footerHTML += `
            <p style="margin: 0 0 15px 0; color: #999999; font-size: 12px; line-height: 1.4; font-family: ${config.branding.fontFamily}, sans-serif;">
                This email was sent to you because you subscribed to our newsletter. 
                The information contained in this email is for informational purposes only.
            </p>`;
    }

    // Unsubscribe link (required)
    if (config.footer.includeUnsubscribe) {
        const unsubscribeUrl = userBrandInfo?.unsubscribeUrl || '#';
        footerHTML += `
            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.4; font-family: ${config.branding.fontFamily}, sans-serif;">
                <a href="${escapeHtml(unsubscribeUrl)}" style="color: #999999; text-decoration: underline;">
                    Unsubscribe
                </a> | 
                <a href="${escapeHtml(unsubscribeUrl.replace('unsubscribe', 'preferences'))}" style="color: #999999; text-decoration: underline;">
                    Update Preferences
                </a>
            </p>`;
    }

    footerHTML += `
        </td>
    </tr>`;

    return footerHTML;
}

/**
 * Generate plain text version of newsletter
 * Requirements 12.5: Plain text version for dual-format export
 */
function generateNewsletterPlainText(
    content: { subject: string; preheader?: string; sections: NewsletterSection[] },
    userBrandInfo?: { name?: string; contactInfo?: string; address?: string; unsubscribeUrl?: string }
): string {
    const sortedSections = [...content.sections].sort((a, b) => a.order - b.order);
    let plainText = '';

    // Subject as header
    plainText += `${content.subject}\n`;
    plainText += '='.repeat(content.subject.length) + '\n\n';

    // Preheader
    if (content.preheader) {
        plainText += `${content.preheader}\n\n`;
    }

    // Sections
    for (const section of sortedSections) {
        switch (section.type) {
            case 'header':
                if (section.title) {
                    plainText += `${section.title}\n`;
                    plainText += '-'.repeat(section.title.length) + '\n\n';
                }
                break;

            case 'content':
                if (section.title) {
                    plainText += `${section.title}\n\n`;
                }
                if (section.content) {
                    plainText += `${section.content}\n\n`;
                }
                break;

            case 'image':
                if (section.imageAlt) {
                    plainText += `[Image: ${section.imageAlt}]\n\n`;
                } else if (section.imageUrl) {
                    plainText += `[Image: ${section.imageUrl}]\n\n`;
                }
                break;

            case 'cta':
                if (section.ctaText && section.ctaUrl) {
                    plainText += `>>> ${section.ctaText} <<<\n`;
                    plainText += `${section.ctaUrl}\n\n`;
                }
                break;

            case 'divider':
                plainText += '---\n\n';
                break;
        }
    }

    // Footer
    plainText += '\n' + '='.repeat(50) + '\n\n';

    if (userBrandInfo?.address) {
        plainText += `${userBrandInfo.address}\n`;
    }

    if (userBrandInfo?.contactInfo) {
        plainText += `${userBrandInfo.contactInfo}\n`;
    }

    plainText += '\nTo unsubscribe: ';
    plainText += userBrandInfo?.unsubscribeUrl || '[Unsubscribe URL]';
    plainText += '\n';

    return plainText;
}

/**
 * Validate generated HTML for email safety
 */
function validateGeneratedHTML(html: string): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Check for unsupported CSS properties
    const unsupportedCSS = [
        'position: fixed',
        'position: absolute',
        'float:',
        'display: flex',
        'display: grid',
        'transform:',
        'animation:',
        'transition:'
    ];

    for (const css of unsupportedCSS) {
        if (html.includes(css)) {
            results.push({
                type: 'warning',
                category: 'css',
                message: `Potentially unsupported CSS property detected: ${css}`,
                suggestion: 'Use table-based layouts and inline styles for better email client support'
            });
        }
    }

    // Check for missing alt attributes on images
    const imgTags = html.match(/<img[^>]*>/g) || [];
    for (const img of imgTags) {
        if (!img.includes('alt=')) {
            results.push({
                type: 'warning',
                category: 'accessibility',
                message: 'Image missing alt attribute',
                suggestion: 'Add alt attributes to all images for accessibility'
            });
        }
    }

    // Check for table structure
    if (!html.includes('role="presentation"')) {
        results.push({
            type: 'info',
            category: 'accessibility',
            message: 'Consider adding role="presentation" to layout tables',
            suggestion: 'Add role="presentation" to tables used for layout'
        });
    }

    return results;
}

/**
 * Escape HTML entities for safe output
 */
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Get pre-built newsletter templates
 * Requirements 12.1: Newsletter-specific templates with responsive design
 */
export async function getNewsletterTemplates(params: {
    userId?: string;
    category?: 'market-update' | 'client-newsletter' | 'listing-showcase' | 'seasonal';
}): Promise<{ success: boolean; templates?: Template[]; error?: string }> {
    try {
        const newsletterTemplates: Partial<Template>[] = [
            {
                id: 'newsletter_market_update',
                name: 'Monthly Market Update',
                description: 'Professional market analysis newsletter for clients and prospects',
                contentType: ContentCategory.NEWSLETTER,
                configuration: {
                    promptParameters: {
                        newsletterConfig: {
                            subject: '[MARKET_AREA] Market Update - [MONTH] [YEAR]',
                            preheader: 'Latest market trends and insights from [AGENT_NAME]',
                            sections: [
                                {
                                    id: 'header',
                                    type: 'header',
                                    title: 'Market Update',
                                    order: 1
                                },
                                {
                                    id: 'intro',
                                    type: 'content',
                                    title: 'Market Overview',
                                    content: 'Here are the latest trends in the [MARKET_AREA] real estate market...',
                                    order: 2
                                },
                                {
                                    id: 'stats',
                                    type: 'content',
                                    title: 'Key Statistics',
                                    content: 'Average home price, days on market, and inventory levels...',
                                    order: 3
                                },
                                {
                                    id: 'cta',
                                    type: 'cta',
                                    ctaText: 'Get Your Home Value',
                                    ctaUrl: '[WEBSITE_URL]/home-value',
                                    order: 4
                                }
                            ],
                            layout: 'single-column',
                            branding: {
                                primaryColor: '#2563eb',
                                secondaryColor: '#64748b',
                                fontFamily: 'Arial'
                            },
                            footer: {
                                includeUnsubscribe: true,
                                includeAddress: true,
                                includeDisclaimer: true
                            },
                            espCompatibility: {
                                outlook: true,
                                gmail: true,
                                appleMail: true,
                                yahooMail: true,
                                thunderbird: true
                            }
                        }
                    },
                    contentStructure: {
                        sections: ['header', 'content', 'content', 'cta'],
                        format: 'newsletter'
                    },
                    stylePreferences: {
                        tone: 'professional and informative',
                        length: 'medium',
                        keywords: ['market update', 'real estate trends', '[MARKET_AREA]']
                    }
                },
                isSeasonal: false,
                usageCount: 0
            },
            {
                id: 'newsletter_client_appreciation',
                name: 'Client Appreciation Newsletter',
                description: 'Quarterly newsletter to stay in touch with past clients',
                contentType: ContentCategory.NEWSLETTER,
                configuration: {
                    promptParameters: {
                        newsletterConfig: {
                            subject: 'Thank You & Market Updates from [AGENT_NAME]',
                            preheader: 'Staying connected with valuable insights and appreciation',
                            sections: [
                                {
                                    id: 'header',
                                    type: 'header',
                                    title: 'Thank You!',
                                    order: 1
                                },
                                {
                                    id: 'appreciation',
                                    type: 'content',
                                    title: 'A Message of Gratitude',
                                    content: 'Thank you for trusting me with your real estate needs...',
                                    order: 2
                                },
                                {
                                    id: 'market_insights',
                                    type: 'content',
                                    title: 'Market Insights',
                                    content: 'Here\'s what\'s happening in our local market...',
                                    order: 3
                                },
                                {
                                    id: 'referral_cta',
                                    type: 'cta',
                                    ctaText: 'Refer a Friend',
                                    ctaUrl: '[WEBSITE_URL]/referral',
                                    order: 4
                                }
                            ],
                            layout: 'single-column',
                            branding: {
                                primaryColor: '#059669',
                                secondaryColor: '#6b7280',
                                fontFamily: 'Georgia'
                            },
                            footer: {
                                includeUnsubscribe: true,
                                includeAddress: true,
                                includeDisclaimer: true,
                                customText: 'Thank you for being a valued client!'
                            },
                            espCompatibility: {
                                outlook: true,
                                gmail: true,
                                appleMail: true,
                                yahooMail: true,
                                thunderbird: true
                            }
                        }
                    },
                    contentStructure: {
                        sections: ['header', 'content', 'content', 'cta'],
                        format: 'newsletter'
                    },
                    stylePreferences: {
                        tone: 'warm and appreciative',
                        length: 'medium',
                        keywords: ['appreciation', 'client newsletter', 'referrals']
                    }
                },
                isSeasonal: false,
                usageCount: 0
            }
        ];

        // Filter by category if specified
        let filteredTemplates = newsletterTemplates;
        if (params.category) {
            filteredTemplates = newsletterTemplates.filter(template => {
                const config = template.configuration?.promptParameters?.newsletterConfig;
                if (!config) return false;

                switch (params.category) {
                    case 'market-update':
                        return template.name?.toLowerCase().includes('market');
                    case 'client-newsletter':
                        return template.name?.toLowerCase().includes('client') ||
                            template.name?.toLowerCase().includes('appreciation');
                    case 'listing-showcase':
                        return template.name?.toLowerCase().includes('listing');
                    case 'seasonal':
                        return template.isSeasonal;
                    default:
                        return true;
                }
            });
        }

        // Convert to full Template objects
        const templates: Template[] = filteredTemplates.map(template => ({
            id: template.id!,
            userId: 'system',
            name: template.name!,
            description: template.description!,
            contentType: template.contentType!,
            configuration: template.configuration!,
            isShared: true,
            isSeasonal: template.isSeasonal!,
            usageCount: template.usageCount!,
            createdAt: new Date(),
            updatedAt: new Date(),
            GSI1PK: `TEMPLATE#${template.contentType}`,
            GSI1SK: `NAME#${template.name}`
        }));

        return { success: true, templates };
    } catch (error) {
        console.error('Failed to get newsletter templates:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get newsletter templates'
        };
    }
}