/**
 * Template Management Usage Examples
 * 
 * This file demonstrates how to use the template management server actions
 * in UI components and pages.
 * 
 * Validates Requirements: 14.1, 14.3, 14.5
 */

import {
    createSessionTemplate,
    updateSessionTemplate,
    deleteSessionTemplate,
    getSessionTemplate,
    listSessionTemplates,
} from '@/app/(app)/open-house/actions';

// ============================================================================
// Example 1: Creating a New Template
// ============================================================================

export async function exampleCreateTemplate() {
    const result = await createSessionTemplate({
        name: 'Luxury Home Open House',
        description: 'Template for high-end residential properties',
        propertyType: 'Single Family',
        typicalDuration: 120, // 2 hours
        customFields: {
            parkingSpaces: 3,
            hasPool: true,
            hasGourmetKitchen: true,
            targetAudience: 'High-net-worth buyers',
        },
    });

    if (result.success) {
        console.log('Template created:', result.templateId);
        // Redirect to template list or show success message
        return result.templateId;
    } else {
        console.error('Failed to create template:', result.error);
        // Show error message to user
        if (result.errors) {
            // Display field-specific errors
            Object.entries(result.errors).forEach(([field, messages]) => {
                console.error(`${field}: ${messages.join(', ')}`);
            });
        }
    }
}

// ============================================================================
// Example 2: Listing All Templates
// ============================================================================

export async function exampleListTemplates() {
    const result = await listSessionTemplates();

    if (result.success && result.templates) {
        console.log(`Found ${result.templates.length} templates`);

        // Display templates in UI
        result.templates.forEach(template => {
            console.log(`- ${template.name} (used ${template.usageCount} times)`);
            if (template.averageVisitors) {
                console.log(`  Average visitors: ${template.averageVisitors}`);
            }
        });

        return result.templates;
    } else {
        console.error('Failed to load templates:', result.error);
        return [];
    }
}

// ============================================================================
// Example 3: Getting a Single Template
// ============================================================================

export async function exampleGetTemplate(templateId: string) {
    const result = await getSessionTemplate(templateId);

    if (result.success && result.template) {
        const template = result.template;

        console.log('Template details:');
        console.log(`Name: ${template.name}`);
        console.log(`Duration: ${template.typicalDuration} minutes`);
        console.log(`Used: ${template.usageCount} times`);

        if (template.customFields) {
            console.log('Custom fields:', template.customFields);
        }

        return template;
    } else {
        console.error('Template not found:', result.error);
        return null;
    }
}

// ============================================================================
// Example 4: Updating a Template
// ============================================================================

export async function exampleUpdateTemplate(templateId: string) {
    const result = await updateSessionTemplate(templateId, {
        name: 'Updated Luxury Home Template',
        description: 'Updated description with new details',
        typicalDuration: 150, // Extended to 2.5 hours
        customFields: {
            parkingSpaces: 4, // Updated
            hasPool: true,
            hasGourmetKitchen: true,
            hasWineRoom: true, // New field
        },
    });

    if (result.success) {
        console.log('Template updated successfully');
        // Refresh template list or show success message
        return true;
    } else {
        console.error('Failed to update template:', result.error);
        if (result.errors) {
            Object.entries(result.errors).forEach(([field, messages]) => {
                console.error(`${field}: ${messages.join(', ')}`);
            });
        }
        return false;
    }
}

// ============================================================================
// Example 5: Partial Template Update
// ============================================================================

export async function examplePartialUpdate(templateId: string) {
    // Only update specific fields
    const result = await updateSessionTemplate(templateId, {
        description: 'Updated description only',
    });

    if (result.success) {
        console.log('Template description updated');
        return true;
    } else {
        console.error('Update failed:', result.error);
        return false;
    }
}

// ============================================================================
// Example 6: Deleting a Template
// ============================================================================

export async function exampleDeleteTemplate(templateId: string) {
    // Show confirmation dialog first
    const confirmed = confirm('Are you sure you want to delete this template? Sessions created from this template will not be affected.');

    if (!confirmed) {
        return false;
    }

    const result = await deleteSessionTemplate(templateId);

    if (result.success) {
        console.log('Template deleted successfully');
        // Refresh template list
        return true;
    } else {
        console.error('Failed to delete template:', result.error);
        return false;
    }
}

// ============================================================================
// Example 7: Using a Template to Create a Session
// ============================================================================

export async function exampleUseTemplate(templateId: string) {
    // First, get the template to pre-populate the form
    const templateResult = await getSessionTemplate(templateId);

    if (!templateResult.success || !templateResult.template) {
        console.error('Template not found');
        return;
    }

    const template = templateResult.template;

    // Pre-populate session creation form with template values
    const sessionData = {
        propertyAddress: '', // User must fill this in
        scheduledDate: '', // User must fill this in
        scheduledStartTime: '', // User must fill this in
        scheduledEndTime: '', // Can be calculated from typicalDuration
        templateId: template.templateId, // Link to template
        notes: `Created from template: ${template.name}`,
    };

    console.log('Session form pre-populated with template:', sessionData);

    // When the session is created, the template usage count will be
    // automatically incremented by the createOpenHouseSession action

    return sessionData;
}

// ============================================================================
// Example 8: Template with Analytics
// ============================================================================

export async function exampleTemplateAnalytics() {
    const result = await listSessionTemplates();

    if (result.success && result.templates) {
        // Sort templates by usage count
        const sortedByUsage = [...result.templates].sort(
            (a, b) => b.usageCount - a.usageCount
        );

        console.log('Most popular templates:');
        sortedByUsage.slice(0, 5).forEach((template, index) => {
            console.log(`${index + 1}. ${template.name}`);
            console.log(`   Used: ${template.usageCount} times`);
            if (template.averageVisitors) {
                console.log(`   Avg visitors: ${template.averageVisitors.toFixed(1)}`);
            }
            if (template.averageInterestLevel) {
                console.log(`   Avg interest: ${template.averageInterestLevel.toFixed(2)}`);
            }
        });

        return sortedByUsage;
    }

    return [];
}

// ============================================================================
// Example 9: Template Form Validation
// ============================================================================

export function exampleValidateTemplateForm(formData: {
    name: string;
    description?: string;
    propertyType?: string;
    typicalDuration: number;
    customFields?: Record<string, any>;
}) {
    const errors: Record<string, string> = {};

    // Name validation
    if (!formData.name || formData.name.trim().length === 0) {
        errors.name = 'Template name is required';
    } else if (formData.name.length > 100) {
        errors.name = 'Template name must be 100 characters or less';
    }

    // Duration validation
    if (!formData.typicalDuration || formData.typicalDuration <= 0) {
        errors.typicalDuration = 'Duration must be greater than 0';
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
        errors.description = 'Description must be 500 characters or less';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

// ============================================================================
// Example 10: Template Selection UI
// ============================================================================

export async function exampleTemplateSelector() {
    const result = await listSessionTemplates();

    if (!result.success || !result.templates) {
        return [];
    }

    // Format templates for a dropdown or selection UI
    const templateOptions = result.templates.map(template => ({
        value: template.templateId,
        label: template.name,
        description: template.description,
        duration: `${template.typicalDuration} minutes`,
        usageCount: template.usageCount,
        // Can include additional metadata for display
        metadata: {
            propertyType: template.propertyType,
            averageVisitors: template.averageVisitors,
        },
    }));

    console.log('Template options for selector:', templateOptions);
    return templateOptions;
}

// ============================================================================
// Example 11: Error Handling Pattern
// ============================================================================

export async function exampleErrorHandling(templateId: string) {
    try {
        const result = await updateSessionTemplate(templateId, {
            name: 'Updated Name',
        });

        if (!result.success) {
            // Handle different error types
            if (result.error === 'Not authenticated') {
                // Redirect to login
                console.log('User not authenticated, redirecting to login');
            } else if (result.error === 'Template not found') {
                // Show not found message
                console.log('Template no longer exists');
            } else if (result.errors) {
                // Show validation errors
                console.log('Validation errors:', result.errors);
            } else {
                // Generic error
                console.log('An error occurred:', result.error);
            }
            return false;
        }

        return true;
    } catch (error) {
        // Handle unexpected errors
        console.error('Unexpected error:', error);
        return false;
    }
}

// ============================================================================
// Example 12: Bulk Template Operations
// ============================================================================

export async function exampleBulkTemplateOperations() {
    const result = await listSessionTemplates();

    if (!result.success || !result.templates) {
        return;
    }

    // Find templates that haven't been used
    const unusedTemplates = result.templates.filter(t => t.usageCount === 0);
    console.log(`Found ${unusedTemplates.length} unused templates`);

    // Find templates with high usage
    const popularTemplates = result.templates.filter(t => t.usageCount >= 10);
    console.log(`Found ${popularTemplates.length} popular templates`);

    // Calculate average usage across all templates
    const totalUsage = result.templates.reduce((sum, t) => sum + t.usageCount, 0);
    const averageUsage = totalUsage / result.templates.length;
    console.log(`Average template usage: ${averageUsage.toFixed(1)}`);

    return {
        total: result.templates.length,
        unused: unusedTemplates.length,
        popular: popularTemplates.length,
        averageUsage,
    };
}
