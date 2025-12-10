/**
 * Tests for WorkflowPresetService
 * 
 * Validates all methods of the WorkflowPresetService class
 */

import { WorkflowPresetService } from '../workflow-preset-service';
import { WorkflowCategory, UserProfile } from '@/types/workflows';
import {
    LAUNCH_YOUR_BRAND,
    MARKET_UPDATE_POST,
    NEW_LISTING_CAMPAIGN,
    COMPETITIVE_POSITIONING,
} from '@/lib/workflow-presets';

describe('WorkflowPresetService', () => {
    let service: WorkflowPresetService;

    beforeEach(() => {
        service = new WorkflowPresetService();
    });

    describe('getAllPresets', () => {
        it('should return all workflow presets', () => {
            const presets = service.getAllPresets();

            expect(presets).toHaveLength(4);
            expect(presets).toContainEqual(LAUNCH_YOUR_BRAND);
            expect(presets).toContainEqual(MARKET_UPDATE_POST);
            expect(presets).toContainEqual(NEW_LISTING_CAMPAIGN);
            expect(presets).toContainEqual(COMPETITIVE_POSITIONING);
        });

        it('should return an array', () => {
            const presets = service.getAllPresets();
            expect(Array.isArray(presets)).toBe(true);
        });
    });

    describe('getPresetById', () => {
        it('should return the correct preset for valid ID', () => {
            const preset = service.getPresetById('launch-your-brand');

            expect(preset).not.toBeNull();
            expect(preset?.id).toBe('launch-your-brand');
            expect(preset?.title).toBe('Launch Your Brand');
        });

        it('should return null for invalid ID', () => {
            const preset = service.getPresetById('non-existent-workflow');

            expect(preset).toBeNull();
        });

        it('should return correct preset for each known ID', () => {
            expect(service.getPresetById('launch-your-brand')).toEqual(LAUNCH_YOUR_BRAND);
            expect(service.getPresetById('market-update-post')).toEqual(MARKET_UPDATE_POST);
            expect(service.getPresetById('new-listing-campaign')).toEqual(NEW_LISTING_CAMPAIGN);
            expect(service.getPresetById('competitive-positioning')).toEqual(COMPETITIVE_POSITIONING);
        });
    });

    describe('getPresetsByCategory', () => {
        it('should return presets for BRAND_BUILDING category', () => {
            const presets = service.getPresetsByCategory(WorkflowCategory.BRAND_BUILDING);

            expect(presets).toHaveLength(1);
            expect(presets[0].id).toBe('launch-your-brand');
        });

        it('should return presets for CONTENT_CREATION category', () => {
            const presets = service.getPresetsByCategory(WorkflowCategory.CONTENT_CREATION);

            expect(presets).toHaveLength(2);
            expect(presets.map(p => p.id)).toContain('market-update-post');
            expect(presets.map(p => p.id)).toContain('new-listing-campaign');
        });

        it('should return presets for MARKET_ANALYSIS category', () => {
            const presets = service.getPresetsByCategory(WorkflowCategory.MARKET_ANALYSIS);

            expect(presets).toHaveLength(1);
            expect(presets[0].id).toBe('competitive-positioning');
        });

        it('should return empty array for category with no presets', () => {
            const presets = service.getPresetsByCategory(WorkflowCategory.CLIENT_ACQUISITION);

            expect(presets).toHaveLength(0);
        });

        it('should only return presets matching the specified category', () => {
            const presets = service.getPresetsByCategory(WorkflowCategory.CONTENT_CREATION);

            presets.forEach(preset => {
                expect(preset.category).toBe(WorkflowCategory.CONTENT_CREATION);
            });
        });
    });

    describe('searchPresets', () => {
        it('should return all presets for empty query', () => {
            const presets = service.searchPresets('');

            expect(presets).toHaveLength(4);
        });

        it('should return all presets for whitespace-only query', () => {
            const presets = service.searchPresets('   ');

            expect(presets).toHaveLength(4);
        });

        it('should find presets by title (case-insensitive)', () => {
            const presets = service.searchPresets('brand');

            expect(presets.length).toBeGreaterThan(0);
            expect(presets.some(p => p.id === 'launch-your-brand')).toBe(true);
        });

        it('should find presets by title with different case', () => {
            const presets = service.searchPresets('BRAND');

            expect(presets.length).toBeGreaterThan(0);
            expect(presets.some(p => p.id === 'launch-your-brand')).toBe(true);
        });

        it('should find presets by description', () => {
            const presets = service.searchPresets('market trends');

            expect(presets.length).toBeGreaterThan(0);
            expect(presets.some(p => p.id === 'market-update-post')).toBe(true);
        });

        it('should find presets by tags', () => {
            const presets = service.searchPresets('onboarding');

            expect(presets).toHaveLength(1);
            expect(presets[0].id).toBe('launch-your-brand');
        });

        it('should find presets by partial tag match', () => {
            const presets = service.searchPresets('seo');

            expect(presets.some(p => p.id === 'competitive-positioning')).toBe(true);
        });

        it('should return empty array when no matches found', () => {
            const presets = service.searchPresets('xyz123nonexistent');

            expect(presets).toHaveLength(0);
        });

        it('should match across title, description, and tags', () => {
            const presets = service.searchPresets('content');

            // Should match multiple presets that have "content" in various fields
            expect(presets.length).toBeGreaterThan(0);
        });

        it('should handle special characters in query', () => {
            const presets = service.searchPresets('3-step');

            // Should not throw error
            expect(Array.isArray(presets)).toBe(true);
        });
    });

    describe('getRecommendedPresets', () => {
        it('should return recommended presets for new users', () => {
            const userProfile: UserProfile = {
                userId: 'user-123',
                isNewUser: true,
            };

            const presets = service.getRecommendedPresets(userProfile);

            expect(presets.length).toBeGreaterThan(0);
            presets.forEach(preset => {
                expect(preset.isRecommended).toBe(true);
            });
        });

        it('should exclude completed workflows for existing users', () => {
            const userProfile: UserProfile = {
                userId: 'user-123',
                isNewUser: false,
                completedWorkflows: ['launch-your-brand'],
            };

            const presets = service.getRecommendedPresets(userProfile);

            expect(presets.every(p => p.id !== 'launch-your-brand')).toBe(true);
        });

        it('should prioritize presets matching user interests', () => {
            const userProfile: UserProfile = {
                userId: 'user-123',
                isNewUser: false,
                interests: ['brand', 'strategy'],
                completedWorkflows: [],
            };

            const presets = service.getRecommendedPresets(userProfile);

            // First preset should have matching tags
            if (presets.length > 0) {
                const firstPreset = presets[0];
                const hasMatchingTag = firstPreset.tags.some(tag =>
                    ['brand', 'strategy'].includes(tag.toLowerCase())
                );
                expect(hasMatchingTag).toBe(true);
            }
        });

        it('should handle user with no interests', () => {
            const userProfile: UserProfile = {
                userId: 'user-123',
                isNewUser: false,
                interests: [],
                completedWorkflows: [],
            };

            const presets = service.getRecommendedPresets(userProfile);

            presets.forEach(preset => {
                expect(preset.isRecommended).toBe(true);
            });
        });

        it('should handle user with no completed workflows', () => {
            const userProfile: UserProfile = {
                userId: 'user-123',
                isNewUser: false,
            };

            const presets = service.getRecommendedPresets(userProfile);

            presets.forEach(preset => {
                expect(preset.isRecommended).toBe(true);
            });
        });

        it('should return empty array if all recommended workflows are completed', () => {
            // First, find all recommended preset IDs
            const allRecommended = service.getAllPresets()
                .filter(p => p.isRecommended)
                .map(p => p.id);

            const userProfile: UserProfile = {
                userId: 'user-123',
                isNewUser: false,
                completedWorkflows: allRecommended,
            };

            const presets = service.getRecommendedPresets(userProfile);

            expect(presets).toHaveLength(0);
        });

        it('should be case-insensitive when matching interests', () => {
            const userProfile: UserProfile = {
                userId: 'user-123',
                isNewUser: false,
                interests: ['BRAND', 'STRATEGY'],
                completedWorkflows: [],
            };

            const presets = service.getRecommendedPresets(userProfile);

            // Should still find matches despite case difference
            expect(presets.length).toBeGreaterThan(0);
        });
    });
});

