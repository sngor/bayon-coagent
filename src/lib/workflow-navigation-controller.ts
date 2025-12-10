/**
 * Workflow Navigation Controller
 * 
 * Handles navigation between workflow steps and hub pages.
 * Routes users to the correct hub page for each workflow step
 * and manages workflow-related query parameters.
 * 
 * Requirements: 1.3, 3.1, 3.2, 3.3, 3.4, 4.1
 */

import {
    WorkflowInstance,
    WorkflowPreset,
    WorkflowStepDefinition,
} from '@/types/workflows';
import { getCurrentStep } from './workflow-state-manager';

/**
 * Navigate to a specific step in a workflow
 * 
 * Returns the full URL with workflow parameters attached.
 * The URL includes the hub route from the step definition
 * plus query parameters for workflow tracking.
 * 
 * @param instance - The workflow instance
 * @param stepId - The step ID to navigate to
 * @param preset - The workflow preset definition
 * @returns Full URL with workflow parameters
 * @throws Error if step is not found in preset
 */
export function navigateToStep(
    instance: WorkflowInstance,
    stepId: string,
    preset: WorkflowPreset
): string {
    // Find the step in the preset
    const step = preset.steps.find(s => s.id === stepId);

    if (!step) {
        throw new Error(
            `Step "${stepId}" not found in workflow preset "${preset.id}"`
        );
    }

    // Get the base URL from the step's hub route
    const baseUrl = step.hubRoute;

    // Attach workflow parameters
    return attachWorkflowParams(baseUrl, instance.id, stepId);
}

/**
 * Get the URL for a workflow step with optional context pre-population
 * 
 * Generates a URL for a specific step in a workflow preset.
 * Can optionally include context data as query parameters for pre-population.
 * 
 * @param presetId - The workflow preset ID
 * @param stepId - The step ID
 * @param preset - The workflow preset definition
 * @param context - Optional context data to include in URL
 * @returns URL for the step
 * @throws Error if step is not found in preset
 */
export function getStepUrl(
    presetId: string,
    stepId: string,
    preset: WorkflowPreset,
    context?: Record<string, any>
): string {
    // Find the step in the preset
    const step = preset.steps.find(s => s.id === stepId);

    if (!step) {
        throw new Error(
            `Step "${stepId}" not found in workflow preset "${presetId}"`
        );
    }

    // Start with the hub route
    let url = step.hubRoute;

    // Add context data as query parameters if provided
    if (context && Object.keys(context).length > 0) {
        const params = new URLSearchParams();

        // Add each context key-value pair
        Object.entries(context).forEach(([key, value]) => {
            // Serialize complex objects as JSON
            const serializedValue = typeof value === 'object'
                ? JSON.stringify(value)
                : String(value);
            params.set(`ctx_${key}`, serializedValue);
        });

        // Append to URL
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}${params.toString()}`;
    }

    return url;
}

/**
 * Attach workflow parameters to a URL
 * 
 * Adds workflow tracking query parameters to a URL.
 * These parameters allow hub pages to detect they're being
 * accessed as part of a workflow and adjust their behavior accordingly.
 * 
 * @param url - The base URL
 * @param instanceId - The workflow instance ID
 * @param stepId - The current step ID
 * @returns URL with workflow parameters attached
 */
export function attachWorkflowParams(
    url: string,
    instanceId: string,
    stepId: string
): string {
    // Parse the URL to handle existing query parameters
    const [basePath, existingQuery] = url.split('?');
    const params = new URLSearchParams(existingQuery || '');

    // Add workflow parameters
    params.set('workflow', instanceId);
    params.set('step', stepId);

    // Reconstruct the URL
    return `${basePath}?${params.toString()}`;
}

/**
 * Extract workflow parameters from a URL
 * 
 * Parses workflow tracking parameters from a URL's query string.
 * Returns null if no workflow parameters are present.
 * 
 * @param url - The URL to parse (can be full URL or just query string)
 * @returns Object with instanceId and stepId, or null if not a workflow URL
 */
export function extractWorkflowParams(
    url: string
): { instanceId: string; stepId: string } | null {
    // Handle both full URLs and query strings
    const queryString = url.includes('?') ? url.split('?')[1] : url;
    const params = new URLSearchParams(queryString);

    const instanceId = params.get('workflow');
    const stepId = params.get('step');

    if (!instanceId || !stepId) {
        return null;
    }

    return { instanceId, stepId };
}

/**
 * Extract context data from URL parameters
 * 
 * Parses context data that was embedded in the URL as query parameters.
 * Context parameters are prefixed with 'ctx_'.
 * 
 * @param url - The URL to parse
 * @returns Object with context data, or empty object if no context found
 */
export function extractContextFromUrl(url: string): Record<string, any> {
    const queryString = url.includes('?') ? url.split('?')[1] : url;
    const params = new URLSearchParams(queryString);
    const context: Record<string, any> = {};

    // Find all parameters starting with 'ctx_'
    params.forEach((value, key) => {
        if (key.startsWith('ctx_')) {
            const contextKey = key.substring(4); // Remove 'ctx_' prefix

            // Try to parse as JSON, fall back to string
            try {
                context[contextKey] = JSON.parse(value);
            } catch {
                context[contextKey] = value;
            }
        }
    });

    return context;
}

/**
 * Check if a URL is a workflow URL
 * 
 * Determines if a URL contains workflow tracking parameters.
 * 
 * @param url - The URL to check
 * @returns True if URL contains workflow parameters
 */
export function isWorkflowUrl(url: string): boolean {
    return extractWorkflowParams(url) !== null;
}

/**
 * Remove workflow parameters from a URL
 * 
 * Strips workflow tracking parameters from a URL,
 * leaving other query parameters intact.
 * 
 * @param url - The URL to clean
 * @returns URL without workflow parameters
 */
export function removeWorkflowParams(url: string): string {
    const [basePath, existingQuery] = url.split('?');

    if (!existingQuery) {
        return basePath;
    }

    const params = new URLSearchParams(existingQuery);

    // Remove workflow parameters
    params.delete('workflow');
    params.delete('step');

    // Remove context parameters
    const keysToDelete: string[] = [];
    params.forEach((_, key) => {
        if (key.startsWith('ctx_')) {
            keysToDelete.push(key);
        }
    });
    keysToDelete.forEach(key => params.delete(key));

    // Reconstruct URL
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Get the hub route for the current step
 * 
 * Returns the hub route path for the current step in a workflow instance.
 * 
 * @param instance - The workflow instance
 * @param preset - The workflow preset definition
 * @returns Hub route path
 */
export function getCurrentStepRoute(
    instance: WorkflowInstance,
    preset: WorkflowPreset
): string {
    const step = getCurrentStep(instance, preset);
    return step.hubRoute;
}

/**
 * Get the hub route for a specific step
 * 
 * Returns the hub route path for a specific step in a workflow preset.
 * 
 * @param stepId - The step ID
 * @param preset - The workflow preset definition
 * @returns Hub route path
 * @throws Error if step is not found
 */
export function getStepRoute(stepId: string, preset: WorkflowPreset): string {
    const step = preset.steps.find(s => s.id === stepId);

    if (!step) {
        throw new Error(
            `Step "${stepId}" not found in workflow preset "${preset.id}"`
        );
    }

    return step.hubRoute;
}

/**
 * Build a complete navigation URL for the current step
 * 
 * Convenience function that combines getting the current step route
 * and attaching workflow parameters.
 * 
 * @param instance - The workflow instance
 * @param preset - The workflow preset definition
 * @returns Complete URL with workflow parameters
 */
export function buildCurrentStepUrl(
    instance: WorkflowInstance,
    preset: WorkflowPreset
): string {
    const route = getCurrentStepRoute(instance, preset);
    return attachWorkflowParams(route, instance.id, instance.currentStepId);
}

/**
 * Parse hub route to extract hub name and tab
 * 
 * Extracts the hub name and optional tab from a hub route.
 * Examples:
 * - '/brand/profile' -> { hub: 'brand', tab: 'profile' }
 * - '/studio/write?type=blog' -> { hub: 'studio', tab: 'write', query: 'type=blog' }
 * 
 * @param hubRoute - The hub route path
 * @returns Object with hub, tab, and optional query
 */
export function parseHubRoute(hubRoute: string): {
    hub: string;
    tab?: string;
    query?: string;
} {
    // Remove leading slash
    const cleanRoute = hubRoute.startsWith('/') ? hubRoute.substring(1) : hubRoute;

    // Split by query string
    const [path, query] = cleanRoute.split('?');

    // Split path into segments
    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0) {
        throw new Error(`Invalid hub route: ${hubRoute}`);
    }

    return {
        hub: segments[0],
        tab: segments[1],
        query,
    };
}

/**
 * Validate that a hub route is properly formatted
 * 
 * Checks if a hub route follows the expected format:
 * - Starts with '/'
 * - Has at least a hub name
 * - Optionally has a tab and query parameters
 * 
 * @param hubRoute - The hub route to validate
 * @returns True if valid
 */
export function isValidHubRoute(hubRoute: string): boolean {
    try {
        // Must start with '/'
        if (!hubRoute.startsWith('/')) {
            return false;
        }

        // Must have at least a hub name
        const parsed = parseHubRoute(hubRoute);
        return parsed.hub.length > 0;
    } catch {
        return false;
    }
}
