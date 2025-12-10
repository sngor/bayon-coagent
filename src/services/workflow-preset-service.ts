/**
 * Workflow Preset Service
 * 
 * Manages workflow preset definitions and provides preset metadata.
 * This service handles filtering, searching, and retrieving workflow presets.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

import {
    WorkflowPreset,
    WorkflowCategory,
    UserProfile,
} from '@/types/workflows';
import {
    ALL_WORKFLOW_PRESETS,
    WORKFLOW_PRESETS_BY_ID,
} from '@/lib/workflow-presets';

/**
 * Service class for managing workflow presets
 */
export class WorkflowPresetService {
    /**
     * Get all available workflow presets
     * 
     * @returns Array of all workflow presets
     */
    getAllPresets(): WorkflowPreset[] {
        return ALL_WORKFLOW_PRESETS;
    }

    /**
     * Get a specific workflow preset by ID
     * 
     * @param id - The preset ID to retrieve
     * @returns The workflow preset or null if not found
     */
    getPresetById(id: string): WorkflowPreset | null {
        return WORKFLOW_PRESETS_BY_ID[id] || null;
    }

    /**
     * Get workflow presets filtered by category
     * 
     * @param category - The category to filter by
     * @returns Array of workflow presets in the specified category
     */
    getPresetsByCategory(category: WorkflowCategory): WorkflowPreset[] {
        return ALL_WORKFLOW_PRESETS.filter(preset => preset.category === category);
    }

    /**
     * Search workflow presets by query string
     * Matches against title, description, and tags (case-insensitive)
     * 
     * @param query - The search query string
     * @returns Array of matching workflow presets
     */
    searchPresets(query: string): WorkflowPreset[] {
        if (!query || query.trim() === '') {
            return ALL_WORKFLOW_PRESETS;
        }

        const lowerQuery = query.toLowerCase().trim();

        return ALL_WORKFLOW_PRESETS.filter(preset => {
            // Check title
            if (preset.title.toLowerCase().includes(lowerQuery)) {
                return true;
            }

            // Check description
            if (preset.description.toLowerCase().includes(lowerQuery)) {
                return true;
            }

            // Check tags
            if (preset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
                return true;
            }

            return false;
        });
    }

    /**
     * Get recommended workflow presets for a user
     * 
     * For new users, returns presets marked as recommended.
     * For existing users, can be enhanced to consider user profile,
     * interests, and completed workflows.
     * 
     * @param userProfile - The user profile for personalization
     * @returns Array of recommended workflow presets
     */
    getRecommendedPresets(userProfile: UserProfile): WorkflowPreset[] {
        // For new users, return all recommended presets
        if (userProfile.isNewUser) {
            return ALL_WORKFLOW_PRESETS.filter(preset => preset.isRecommended);
        }

        // For existing users, filter out already completed workflows
        const completedWorkflowIds = new Set(userProfile.completedWorkflows || []);
        const recommendedPresets = ALL_WORKFLOW_PRESETS.filter(
            preset => preset.isRecommended && !completedWorkflowIds.has(preset.id)
        );

        // If user has interests, prioritize presets with matching tags
        if (userProfile.interests && userProfile.interests.length > 0) {
            const interestSet = new Set(
                userProfile.interests.map(interest => interest.toLowerCase())
            );

            // Sort by relevance: presets with matching tags first
            return recommendedPresets.sort((a, b) => {
                const aMatches = a.tags.filter(tag =>
                    interestSet.has(tag.toLowerCase())
                ).length;
                const bMatches = b.tags.filter(tag =>
                    interestSet.has(tag.toLowerCase())
                ).length;

                return bMatches - aMatches; // Higher matches first
            });
        }

        return recommendedPresets;
    }
}

/**
 * Singleton instance of WorkflowPresetService
 * Use this for consistent access across the application
 */
export const workflowPresetService = new WorkflowPresetService();

