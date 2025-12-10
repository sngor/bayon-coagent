/**
 * Tests for workflow preset definitions
 */

import {
    ALL_WORKFLOW_PRESETS,
    WORKFLOW_PRESETS_BY_ID,
    LAUNCH_YOUR_BRAND,
    MARKET_UPDATE_POST,
    NEW_LISTING_CAMPAIGN,
    COMPETITIVE_POSITIONING,
    getPresetsByCategory,
    getRecommendedPresets,
    searchPresets,
} from '../workflow-presets';
import { WorkflowCategory, WorkflowPresetSchema } from '@/types/workflows';

describe('Workflow Presets', () => {
    describe('Individual Presets', () => {
        test('Launch Your Brand preset is valid', () => {
            expect(() => WorkflowPresetSchema.parse(LAUNCH_YOUR_BRAND)).not.toThrow();
            expect(LAUNCH_YOUR_BRAND.id).toBe('launch-your-brand');
            expect(LAUNCH_YOUR_BRAND.steps).toHaveLength(4);
            expect(LAUNCH_YOUR_BRAND.category).toBe(WorkflowCategory.BRAND_BUILDING);
            expect(LAUNCH_YOUR_BRAND.isRecommended).toBe(true);
        });

        test('Market Update Post preset is valid', () => {
            expect(() => WorkflowPresetSchema.parse(MARKET_UPDATE_POST)).not.toThrow();
            expect(MARKET_UPDATE_POST.id).toBe('market-update-post');
            expect(MARKET_UPDATE_POST.steps).toHaveLength(4);
            expect(MARKET_UPDATE_POST.category).toBe(WorkflowCategory.CONTENT_CREATION);
        });

        test('New Listing Campaign preset is valid', () => {
            expect(() => WorkflowPresetSchema.parse(NEW_LISTING_CAMPAIGN)).not.toThrow();
            expect(NEW_LISTING_CAMPAIGN.id).toBe('new-listing-campaign');
            expect(NEW_LISTING_CAMPAIGN.steps).toHaveLength(4);
            expect(NEW_LISTING_CAMPAIGN.category).toBe(WorkflowCategory.CONTENT_CREATION);
        });

        test('Competitive Positioning preset is valid', () => {
            expect(() => WorkflowPresetSchema.parse(COMPETITIVE_POSITIONING)).not.toThrow();
            expect(COMPETITIVE_POSITIONING.id).toBe('competitive-positioning');
            expect(COMPETITIVE_POSITIONING.steps).toHaveLength(4);
            expect(COMPETITIVE_POSITIONING.category).toBe(WorkflowCategory.MARKET_ANALYSIS);
        });
    });

    describe('ALL_WORKFLOW_PRESETS', () => {
        test('contains all four presets', () => {
            expect(ALL_WORKFLOW_PRESETS).toHaveLength(4);
            expect(ALL_WORKFLOW_PRESETS).toContain(LAUNCH_YOUR_BRAND);
            expect(ALL_WORKFLOW_PRESETS).toContain(MARKET_UPDATE_POST);
            expect(ALL_WORKFLOW_PRESETS).toContain(NEW_LISTING_CAMPAIGN);
            expect(ALL_WORKFLOW_PRESETS).toContain(COMPETITIVE_POSITIONING);
        });

        test('all presets have unique IDs', () => {
            const ids = ALL_WORKFLOW_PRESETS.map(p => p.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });

        test('all presets have valid estimated times', () => {
            ALL_WORKFLOW_PRESETS.forEach(preset => {
                expect(preset.estimatedMinutes).toBeGreaterThan(0);
                const totalStepTime = preset.steps.reduce((sum, step) => sum + step.estimatedMinutes, 0);
                expect(preset.estimatedMinutes).toBe(totalStepTime);
            });
        });
    });

    describe('WORKFLOW_PRESETS_BY_ID', () => {
        test('contains all presets by ID', () => {
            expect(Object.keys(WORKFLOW_PRESETS_BY_ID)).toHaveLength(4);
            expect(WORKFLOW_PRESETS_BY_ID['launch-your-brand']).toBe(LAUNCH_YOUR_BRAND);
            expect(WORKFLOW_PRESETS_BY_ID['market-update-post']).toBe(MARKET_UPDATE_POST);
            expect(WORKFLOW_PRESETS_BY_ID['new-listing-campaign']).toBe(NEW_LISTING_CAMPAIGN);
            expect(WORKFLOW_PRESETS_BY_ID['competitive-positioning']).toBe(COMPETITIVE_POSITIONING);
        });
    });

    describe('getPresetsByCategory', () => {
        test('returns brand building presets', () => {
            const presets = getPresetsByCategory(WorkflowCategory.BRAND_BUILDING);
            expect(presets).toHaveLength(1);
            expect(presets[0]).toBe(LAUNCH_YOUR_BRAND);
        });

        test('returns content creation presets', () => {
            const presets = getPresetsByCategory(WorkflowCategory.CONTENT_CREATION);
            expect(presets).toHaveLength(2);
            expect(presets).toContain(MARKET_UPDATE_POST);
            expect(presets).toContain(NEW_LISTING_CAMPAIGN);
        });

        test('returns market analysis presets', () => {
            const presets = getPresetsByCategory(WorkflowCategory.MARKET_ANALYSIS);
            expect(presets).toHaveLength(1);
            expect(presets[0]).toBe(COMPETITIVE_POSITIONING);
        });

        test('returns empty array for client acquisition category', () => {
            const presets = getPresetsByCategory(WorkflowCategory.CLIENT_ACQUISITION);
            expect(presets).toHaveLength(0);
        });
    });

    describe('getRecommendedPresets', () => {
        test('returns only recommended presets', () => {
            const presets = getRecommendedPresets();
            expect(presets).toHaveLength(1);
            expect(presets[0]).toBe(LAUNCH_YOUR_BRAND);
            expect(presets[0].isRecommended).toBe(true);
        });
    });

    describe('searchPresets', () => {
        test('finds presets by title', () => {
            const results = searchPresets('Launch');
            expect(results).toHaveLength(1);
            expect(results[0]).toBe(LAUNCH_YOUR_BRAND);
        });

        test('finds presets by description', () => {
            const results = searchPresets('market trends');
            expect(results).toHaveLength(1);
            expect(results[0]).toBe(MARKET_UPDATE_POST);
        });

        test('finds presets by tags', () => {
            const results = searchPresets('listing');
            expect(results).toHaveLength(1);
            expect(results[0]).toBe(NEW_LISTING_CAMPAIGN);
        });

        test('search is case insensitive', () => {
            const results = searchPresets('COMPETITIVE');
            expect(results).toHaveLength(1);
            expect(results[0]).toBe(COMPETITIVE_POSITIONING);
        });

        test('returns multiple matches', () => {
            const results = searchPresets('content');
            expect(results.length).toBeGreaterThanOrEqual(2);
        });

        test('returns empty array for no matches', () => {
            const results = searchPresets('nonexistent');
            expect(results).toHaveLength(0);
        });
    });

    describe('Step Structure', () => {
        test('all steps have required fields', () => {
            ALL_WORKFLOW_PRESETS.forEach(preset => {
                preset.steps.forEach(step => {
                    expect(step.id).toBeTruthy();
                    expect(step.title).toBeTruthy();
                    expect(step.description).toBeTruthy();
                    expect(step.hubRoute).toBeTruthy();
                    expect(step.estimatedMinutes).toBeGreaterThan(0);
                    expect(typeof step.isOptional).toBe('boolean');
                    expect(step.helpText).toBeTruthy();
                    expect(Array.isArray(step.tips)).toBe(true);
                    expect(step.completionCriteria).toBeTruthy();
                });
            });
        });

        test('all steps have unique IDs within their workflow', () => {
            ALL_WORKFLOW_PRESETS.forEach(preset => {
                const stepIds = preset.steps.map(s => s.id);
                const uniqueIds = new Set(stepIds);
                expect(uniqueIds.size).toBe(stepIds.length);
            });
        });

        test('context outputs are referenced as inputs in later steps', () => {
            // Launch Your Brand workflow context flow
            const launchSteps = LAUNCH_YOUR_BRAND.steps;
            expect(launchSteps[0].contextOutputs).toContain('profileData');
            expect(launchSteps[1].contextInputs).toContain('profileData');
            expect(launchSteps[1].contextOutputs).toContain('auditResults');
            expect(launchSteps[2].contextInputs).toContain('profileData');
            expect(launchSteps[2].contextOutputs).toContain('competitors');
            expect(launchSteps[3].contextInputs).toContain('profileData');
            expect(launchSteps[3].contextInputs).toContain('auditResults');
            expect(launchSteps[3].contextInputs).toContain('competitors');
        });
    });
});
