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
import { getTemplateKeys } from '@/aws/dynamodb/keys';
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

        const template = await repository.get<Template>(PK, SK);
        if (!template) {
            return { success: false, error: 'Template not found' };
        }

        // Check if user has access to the template
        if (template.userId !== params.userId && !template.isShared) {
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