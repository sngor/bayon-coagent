/**
 * Template Application Usage Examples
 * 
 * This file demonstrates how to use templates when creating sessions
 * and how template metrics are calculated and displayed.
 * 
 * Validates Requirements: 14.2, 14.4
 */

import {
    getSessionTemplate,
    listSessionTemplates,
    createOpenHouseSession,
    updateTemplateMetrics,
} from '@/app/(app)/open-house/actions';

// ============================================================================
// Example 1: Using a Template to Create a Session (Requirement 14.2)
// ============================================================================

export async function exampleUseTemplateForSession(templateId: string) {
    // Step 1: Get the template to pre-populate the form
    const templateResult = await getSessionTemplate(templateId);

    if (!templateResult.success || !templateResult.template) {
        console.error('Template not found');
        return;
    }

    const template = templateResult.template;

    // Step 2: Pre-populate session data from template (Requirement 14.2)
    const scheduledStartTime = new Date('2024-12-15T14:00:00');
    const scheduledEndTime = new Date(
        scheduledStartTime.getTime() + template.typicalDuration * 60000
    );

    const sessionData = {
        propertyAddress: '123 Main St, City, State 12345', // User fills this
        scheduledDate: '2024-12-15',
        scheduledStartTime: scheduledStartTime.toISOString(),
        scheduledEndTime: scheduledEndTime.toISOString(),
        templateId: template.templateId, // Link to template
        notes: `Created from template: ${template.name}`,
    };

    // Step 3: Create the session
    // The createOpenHouseSession action will automatically increment
    // the template's usage count
    const result = await createOpenHouseSession(sessionData);

    if (result.success) {
        console.log('Session created:', result.sessionId);
        console.log('QR Code:', result.qrCodeUrl);
        console.log('Template usage count will be incremented automatically');
        return result.sessionId;
    } else {
        console.error('Failed to create session:', result.error);
    }
}

// ============================================================================
// Example 2: Template Selection in UI
// ============================================================================

export async function exampleTemplateSelector() {
    // Get all templates for the user
    const result = await listSessionTemplates();

    if (!result.success || !result.templates) {
        return [];
    }

    // Format templates for a dropdown selector
    const templateOptions = result.templates.map((template) => ({
        value: template.templateId,
        label: template.name,
        description: template.description,
        duration: template.typicalDuration,
        // Show usage statistics to help user choose
        stats: {
            usageCount: template.usageCount,
            averageVisitors: template.averageVisitors,
            averageInterestLevel: template.averageInterestLevel,
        },
    }));

    console.log('Available templates:', templateOptions);
    return templateOptions;
}

// ============================================================================
// Example 3: Auto-calculating End Time from Template Duration
// ============================================================================

export function exampleCalculateEndTime(
    startTime: string,
    typicalDuration: number
): string {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + typicalDuration * 60000);
    return end.toISOString();
}

// Usage in form:
export async function exampleFormWithTemplate(templateId: string) {
    const templateResult = await getSessionTemplate(templateId);
    if (!templateResult.success || !templateResult.template) return;

    const template = templateResult.template;
    const startTime = '2024-12-15T14:00:00';

    // Auto-calculate end time based on template duration
    const endTime = exampleCalculateEndTime(startTime, template.typicalDuration);

    console.log('Start time:', startTime);
    console.log('Duration:', template.typicalDuration, 'minutes');
    console.log('Calculated end time:', endTime);
}

// ============================================================================
// Example 4: Updating Template Metrics (Requirement 14.4)
// ============================================================================

export async function exampleUpdateTemplateMetrics(templateId: string) {
    // This is typically called after a session is completed
    // to update the template's performance metrics

    const result = await updateTemplateMetrics(templateId);

    if (result.success) {
        console.log('Template metrics updated successfully');

        // Fetch updated template to see new metrics
        const templateResult = await getSessionTemplate(templateId);
        if (templateResult.success && templateResult.template) {
            const template = templateResult.template;
            console.log('Updated metrics:');
            console.log('- Usage count:', template.usageCount);
            console.log('- Average visitors:', template.averageVisitors?.toFixed(1));
            console.log('- Average interest:', template.averageInterestLevel?.toFixed(2));
        }
    } else {
        console.error('Failed to update metrics:', result.error);
    }
}

// ============================================================================
// Example 5: Displaying Template Performance
// ============================================================================

export async function exampleDisplayTemplatePerformance() {
    const result = await listSessionTemplates();

    if (!result.success || !result.templates) {
        return;
    }

    // Sort templates by different metrics
    const byUsage = [...result.templates].sort(
        (a, b) => b.usageCount - a.usageCount
    );

    const byVisitors = [...result.templates]
        .filter((t) => t.averageVisitors !== undefined)
        .sort((a, b) => (b.averageVisitors || 0) - (a.averageVisitors || 0));

    const byInterest = [...result.templates]
        .filter((t) => t.averageInterestLevel !== undefined)
        .sort((a, b) => (b.averageInterestLevel || 0) - (a.averageInterestLevel || 0));

    console.log('Most used templates:');
    byUsage.slice(0, 3).forEach((t, i) => {
        console.log(`${i + 1}. ${t.name} (${t.usageCount} uses)`);
    });

    console.log('\nHighest average visitors:');
    byVisitors.slice(0, 3).forEach((t, i) => {
        console.log(`${i + 1}. ${t.name} (${t.averageVisitors?.toFixed(1)} avg)`);
    });

    console.log('\nHighest average interest:');
    byInterest.slice(0, 3).forEach((t, i) => {
        console.log(`${i + 1}. ${t.name} (${t.averageInterestLevel?.toFixed(2)} avg)`);
    });
}

// ============================================================================
// Example 6: Template Recommendation Based on Property Type
// ============================================================================

export async function exampleRecommendTemplate(propertyType: string) {
    const result = await listSessionTemplates();

    if (!result.success || !result.templates) {
        return null;
    }

    // Find templates matching the property type
    const matchingTemplates = result.templates.filter(
        (t) => t.propertyType?.toLowerCase() === propertyType.toLowerCase()
    );

    if (matchingTemplates.length === 0) {
        console.log('No templates found for property type:', propertyType);
        return null;
    }

    // Recommend the most successful template (by average visitors)
    const recommended = matchingTemplates.reduce((best, current) => {
        const bestVisitors = best.averageVisitors || 0;
        const currentVisitors = current.averageVisitors || 0;
        return currentVisitors > bestVisitors ? current : best;
    });

    console.log('Recommended template:', recommended.name);
    console.log('Average visitors:', recommended.averageVisitors?.toFixed(1));
    console.log('Usage count:', recommended.usageCount);

    return recommended;
}

// ============================================================================
// Example 7: Template Usage Tracking
// ============================================================================

export async function exampleTrackTemplateUsage(templateId: string) {
    // When a session is created with a template, the usage count is
    // automatically incremented by the createOpenHouseSession action

    const beforeResult = await getSessionTemplate(templateId);
    if (!beforeResult.success || !beforeResult.template) return;

    const usageCountBefore = beforeResult.template.usageCount;
    console.log('Usage count before:', usageCountBefore);

    // Create a session using the template
    await exampleUseTemplateForSession(templateId);

    // Check updated usage count
    const afterResult = await getSessionTemplate(templateId);
    if (!afterResult.success || !afterResult.template) return;

    const usageCountAfter = afterResult.template.usageCount;
    console.log('Usage count after:', usageCountAfter);
    console.log('Increment:', usageCountAfter - usageCountBefore);
}

// ============================================================================
// Example 8: Template Performance Dashboard
// ============================================================================

export async function exampleTemplatePerformanceDashboard() {
    const result = await listSessionTemplates();

    if (!result.success || !result.templates) {
        return;
    }

    const templates = result.templates;

    // Calculate overall statistics
    const totalTemplates = templates.length;
    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
    const averageUsage = totalUsage / totalTemplates;

    const templatesWithMetrics = templates.filter(
        (t) => t.averageVisitors !== undefined
    );

    const avgVisitorsAcrossTemplates =
        templatesWithMetrics.reduce((sum, t) => sum + (t.averageVisitors || 0), 0) /
        templatesWithMetrics.length;

    console.log('Template Performance Dashboard');
    console.log('==============================');
    console.log('Total templates:', totalTemplates);
    console.log('Total usage:', totalUsage);
    console.log('Average usage per template:', averageUsage.toFixed(1));
    console.log('Average visitors (across all templates):', avgVisitorsAcrossTemplates.toFixed(1));

    // Show top performers
    console.log('\nTop 3 Templates by Usage:');
    const topByUsage = [...templates]
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 3);

    topByUsage.forEach((t, i) => {
        console.log(`${i + 1}. ${t.name}`);
        console.log(`   Used: ${t.usageCount} times`);
        if (t.averageVisitors) {
            console.log(`   Avg visitors: ${t.averageVisitors.toFixed(1)}`);
        }
    });
}

// ============================================================================
// Example 9: Form Pre-population with Template
// ============================================================================

export async function exampleFormPrePopulation(templateId: string) {
    const templateResult = await getSessionTemplate(templateId);

    if (!templateResult.success || !templateResult.template) {
        return null;
    }

    const template = templateResult.template;

    // Create a form data object pre-populated with template values
    const formData = {
        // User must fill these
        propertyAddress: '',
        scheduledDate: '',
        scheduledStartTime: '',

        // Pre-populated from template
        scheduledEndTime: '', // Will be calculated when start time is set
        notes: `Created from template: ${template.name}`,
        templateId: template.templateId,

        // Template metadata for reference
        _templateDuration: template.typicalDuration,
        _templateName: template.name,
        _templatePropertyType: template.propertyType,
    };

    console.log('Form pre-populated with template:', formData);
    return formData;
}

// ============================================================================
// Example 10: Template Metrics Calculation
// ============================================================================

export function exampleCalculateMetrics(
    sessions: Array<{
        templateId?: string;
        visitorCount: number;
        interestLevelDistribution: { low: number; medium: number; high: number };
    }>,
    templateId: string
) {
    // Filter sessions created from this template
    const templateSessions = sessions.filter((s) => s.templateId === templateId);

    if (templateSessions.length === 0) {
        return {
            usageCount: 0,
            averageVisitors: undefined,
            averageInterestLevel: undefined,
        };
    }

    // Calculate average visitors
    const totalVisitors = templateSessions.reduce(
        (sum, s) => sum + s.visitorCount,
        0
    );
    const averageVisitors = totalVisitors / templateSessions.length;

    // Calculate average interest level (low=1, medium=2, high=3)
    let totalInterestScore = 0;
    let totalVisitorsWithInterest = 0;

    templateSessions.forEach((session) => {
        const dist = session.interestLevelDistribution;
        totalInterestScore += dist.low * 1 + dist.medium * 2 + dist.high * 3;
        totalVisitorsWithInterest += dist.low + dist.medium + dist.high;
    });

    const averageInterestLevel =
        totalVisitorsWithInterest > 0
            ? totalInterestScore / totalVisitorsWithInterest
            : undefined;

    return {
        usageCount: templateSessions.length,
        averageVisitors,
        averageInterestLevel,
    };
}
