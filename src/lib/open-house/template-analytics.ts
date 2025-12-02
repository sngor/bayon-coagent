/**
 * Template Analytics Utilities
 * 
 * Functions for calculating template performance metrics.
 * Validates Requirements: 14.4
 */

import type { OpenHouseSession, SessionTemplate } from './types';

/**
 * Calculates performance metrics for a template based on sessions created from it
 * 
 * Validates Requirement 14.4: Template analytics calculate usage correctly
 * 
 * @param template - The template to calculate metrics for
 * @param sessions - All sessions created from this template
 * @returns Updated template with calculated metrics
 */
export function calculateTemplateMetrics(
    template: SessionTemplate,
    sessions: OpenHouseSession[]
): SessionTemplate {
    // Filter sessions that were created from this template
    const templateSessions = sessions.filter(
        (session) => session.templateId === template.templateId
    );

    // Usage count is the number of sessions created from this template
    const usageCount = templateSessions.length;

    if (usageCount === 0) {
        return {
            ...template,
            usageCount: 0,
            averageVisitors: undefined,
            averageInterestLevel: undefined,
        };
    }

    // Calculate average visitors per session
    const totalVisitors = templateSessions.reduce(
        (sum, session) => sum + session.visitorCount,
        0
    );
    const averageVisitors = totalVisitors / usageCount;

    // Calculate average interest level
    // Interest level is scored as: low=1, medium=2, high=3
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
        ...template,
        usageCount,
        averageVisitors,
        averageInterestLevel,
    };
}

/**
 * Calculates metrics for multiple templates
 * 
 * @param templates - Array of templates
 * @param sessions - All sessions
 * @returns Templates with updated metrics
 */
export function calculateAllTemplateMetrics(
    templates: SessionTemplate[],
    sessions: OpenHouseSession[]
): SessionTemplate[] {
    return templates.map((template) =>
        calculateTemplateMetrics(template, sessions)
    );
}

/**
 * Gets the most popular templates by usage count
 * 
 * @param templates - Array of templates with metrics
 * @param limit - Maximum number of templates to return
 * @returns Top templates sorted by usage count
 */
export function getTopTemplatesByUsage(
    templates: SessionTemplate[],
    limit: number = 5
): SessionTemplate[] {
    return [...templates]
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
}

/**
 * Gets the best performing templates by average visitors
 * 
 * @param templates - Array of templates with metrics
 * @param limit - Maximum number of templates to return
 * @returns Top templates sorted by average visitors
 */
export function getTopTemplatesByVisitors(
    templates: SessionTemplate[],
    limit: number = 5
): SessionTemplate[] {
    return [...templates]
        .filter((t) => t.averageVisitors !== undefined)
        .sort((a, b) => (b.averageVisitors || 0) - (a.averageVisitors || 0))
        .slice(0, limit);
}

/**
 * Gets the best performing templates by average interest level
 * 
 * @param templates - Array of templates with metrics
 * @param limit - Maximum number of templates to return
 * @returns Top templates sorted by average interest level
 */
export function getTopTemplatesByInterest(
    templates: SessionTemplate[],
    limit: number = 5
): SessionTemplate[] {
    return [...templates]
        .filter((t) => t.averageInterestLevel !== undefined)
        .sort((a, b) => (b.averageInterestLevel || 0) - (a.averageInterestLevel || 0))
        .slice(0, limit);
}

/**
 * Formats template metrics for display
 * 
 * @param template - Template with metrics
 * @returns Formatted metrics object
 */
export function formatTemplateMetrics(template: SessionTemplate): {
    usageCount: string;
    averageVisitors: string;
    averageInterestLevel: string;
} {
    return {
        usageCount: template.usageCount.toString(),
        averageVisitors: template.averageVisitors
            ? template.averageVisitors.toFixed(1)
            : 'N/A',
        averageInterestLevel: template.averageInterestLevel
            ? template.averageInterestLevel.toFixed(2)
            : 'N/A',
    };
}
