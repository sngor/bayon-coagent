/**
 * Tests for Workflow Navigation Controller
 * 
 * Tests URL generation, parameter handling, and navigation logic
 * for workflow step navigation.
 */

import {
    navigateToStep,
    getStepUrl,
    attachWorkflowParams,
    extractWorkflowParams,
    extractContextFromUrl,
    isWorkflowUrl,
    removeWorkflowParams,
    getCurrentStepRoute,
    getStepRoute,
    buildCurrentStepUrl,
    parseHubRoute,
    isValidHubRoute,
} from '../workflow-navigation-controller';
import {
    WorkflowInstance,
    WorkflowPreset,
    WorkflowCategory,
    WorkflowStatus,
} from '@/types/workflows';

// Test fixtures
const mockPreset: WorkflowPreset = {
    id: 'test-workflow',
    title: 'Test Workflow',
    description: 'A test workflow',
    category: WorkflowCategory.BRAND_BUILDING,
    tags: ['test'],
    estimatedMinutes: 30,
    isRecommended: false,
    icon: 'TestIcon',
    outcomes: ['Test outcome'],
    steps: [
        {
            id: 'step-1',
            title: 'Step 1',
            description: 'First step',
            hubRoute: '/brand/profile',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Help for step 1',
            tips: ['Tip 1'],
            completionCriteria: 'Complete step 1',
            contextOutputs: ['data1'],
        },
        {
            id: 'step-2',
            title: 'Step 2',
            description: 'Second step',
            hubRoute: '/studio/write?type=blog',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Help for step 2',
            tips: ['Tip 2'],
            completionCriteria: 'Complete step 2',
            contextInputs: ['data1'],
            contextOutputs: ['data2'],
        },
        {
            id: 'step-3',
            title: 'Step 3',
            description: 'Third step',
            hubRoute: '/research/agent',
            estimatedMinutes: 10,
            isOptional: true,
            helpText: 'Help for step 3',
            tips: ['Tip 3'],
            completionCriteria: 'Complete step 3',
            contextInputs: ['data1', 'data2'],
        },
    ],
};

const mockInstance: WorkflowInstance = {
    id: 'instance-123',
    userId: 'user-456',
    presetId: 'test-workflow',
    status: WorkflowStatus.ACTIVE,
    currentStepId: 'step-1',
    completedSteps: [],
    skippedSteps: [],
    contextData: {},
    startedAt: '2024-01-01T00:00:00Z',
    lastActiveAt: '2024-01-01T00:00:00Z',
};

describe('navigateToStep', () => {
    it('should generate URL for first step', () => {
        const url = navigateToStep(mockInstance, 'step-1', mockPreset);
        expect(url).toBe('/brand/profile?workflow=instance-123&step=step-1');
    });

    it('should generate URL for step with existing query params', () => {
        const url = navigateToStep(mockInstance, 'step-2', mockPreset);
        expect(url).toBe('/studio/write?type=blog&workflow=instance-123&step=step-2');
    });

    it('should generate URL for third step', () => {
        const url = navigateToStep(mockInstance, 'step-3', mockPreset);
        expect(url).toBe('/research/agent?workflow=instance-123&step=step-3');
    });

    it('should throw error for non-existent step', () => {
        expect(() => {
            navigateToStep(mockInstance, 'non-existent', mockPreset);
        }).toThrow('Step "non-existent" not found');
    });
});

describe('getStepUrl', () => {
    it('should generate URL without context', () => {
        const url = getStepUrl('test-workflow', 'step-1', mockPreset);
        expect(url).toBe('/brand/profile');
    });

    it('should generate URL with simple context', () => {
        const context = { name: 'John', age: '30' };
        const url = getStepUrl('test-workflow', 'step-1', mockPreset, context);
        expect(url).toContain('/brand/profile?');
        expect(url).toContain('ctx_name=John');
        expect(url).toContain('ctx_age=30');
    });

    it('should generate URL with complex context (JSON)', () => {
        const context = { user: { name: 'John', age: 30 } };
        const url = getStepUrl('test-workflow', 'step-1', mockPreset, context);
        expect(url).toContain('/brand/profile?');
        expect(url).toContain('ctx_user=');
        // Should contain JSON-encoded object
        expect(decodeURIComponent(url)).toContain('"name":"John"');
    });

    it('should handle step with existing query params', () => {
        const context = { data: 'test' };
        const url = getStepUrl('test-workflow', 'step-2', mockPreset, context);
        expect(url).toContain('/studio/write?type=blog&');
        expect(url).toContain('ctx_data=test');
    });

    it('should handle empty context', () => {
        const url = getStepUrl('test-workflow', 'step-1', mockPreset, {});
        expect(url).toBe('/brand/profile');
    });

    it('should throw error for non-existent step', () => {
        expect(() => {
            getStepUrl('test-workflow', 'non-existent', mockPreset);
        }).toThrow('Step "non-existent" not found');
    });
});

describe('attachWorkflowParams', () => {
    it('should attach params to URL without query string', () => {
        const url = attachWorkflowParams('/brand/profile', 'inst-1', 'step-1');
        expect(url).toBe('/brand/profile?workflow=inst-1&step=step-1');
    });

    it('should attach params to URL with existing query string', () => {
        const url = attachWorkflowParams('/studio/write?type=blog', 'inst-1', 'step-1');
        expect(url).toBe('/studio/write?type=blog&workflow=inst-1&step=step-1');
    });

    it('should handle multiple existing params', () => {
        const url = attachWorkflowParams('/hub?a=1&b=2', 'inst-1', 'step-1');
        expect(url).toContain('a=1');
        expect(url).toContain('b=2');
        expect(url).toContain('workflow=inst-1');
        expect(url).toContain('step=step-1');
    });

    it('should override existing workflow params', () => {
        const url = attachWorkflowParams(
            '/hub?workflow=old&step=old',
            'new-inst',
            'new-step'
        );
        expect(url).toContain('workflow=new-inst');
        expect(url).toContain('step=new-step');
        expect(url).not.toContain('workflow=old');
        expect(url).not.toContain('step=old');
    });
});

describe('extractWorkflowParams', () => {
    it('should extract params from full URL', () => {
        const params = extractWorkflowParams('/brand/profile?workflow=inst-1&step=step-1');
        expect(params).toEqual({ instanceId: 'inst-1', stepId: 'step-1' });
    });

    it('should extract params from query string only', () => {
        const params = extractWorkflowParams('workflow=inst-1&step=step-1');
        expect(params).toEqual({ instanceId: 'inst-1', stepId: 'step-1' });
    });

    it('should return null if workflow param missing', () => {
        const params = extractWorkflowParams('/brand/profile?step=step-1');
        expect(params).toBeNull();
    });

    it('should return null if step param missing', () => {
        const params = extractWorkflowParams('/brand/profile?workflow=inst-1');
        expect(params).toBeNull();
    });

    it('should return null if no params', () => {
        const params = extractWorkflowParams('/brand/profile');
        expect(params).toBeNull();
    });

    it('should handle URL with other params', () => {
        const params = extractWorkflowParams(
            '/studio/write?type=blog&workflow=inst-1&step=step-1&other=value'
        );
        expect(params).toEqual({ instanceId: 'inst-1', stepId: 'step-1' });
    });
});

describe('extractContextFromUrl', () => {
    it('should extract simple context params', () => {
        const context = extractContextFromUrl('/hub?ctx_name=John&ctx_age=30');
        // Note: Numeric strings are parsed as numbers by JSON.parse
        expect(context).toEqual({ name: 'John', age: 30 });
    });

    it('should extract JSON context params', () => {
        const jsonData = encodeURIComponent(JSON.stringify({ name: 'John', age: 30 }));
        const context = extractContextFromUrl(`/hub?ctx_user=${jsonData}`);
        expect(context).toEqual({ user: { name: 'John', age: 30 } });
    });

    it('should return empty object if no context params', () => {
        const context = extractContextFromUrl('/hub?workflow=inst-1&step=step-1');
        expect(context).toEqual({});
    });

    it('should ignore non-context params', () => {
        const context = extractContextFromUrl('/hub?other=value&ctx_data=test');
        expect(context).toEqual({ data: 'test' });
    });

    it('should handle mixed context and non-context params', () => {
        const context = extractContextFromUrl(
            '/hub?workflow=inst-1&ctx_name=John&step=step-1&ctx_age=30'
        );
        // Note: Numeric strings are parsed as numbers by JSON.parse
        expect(context).toEqual({ name: 'John', age: 30 });
    });

    it('should handle URL without query string', () => {
        const context = extractContextFromUrl('/hub');
        expect(context).toEqual({});
    });
});

describe('isWorkflowUrl', () => {
    it('should return true for URL with workflow params', () => {
        expect(isWorkflowUrl('/hub?workflow=inst-1&step=step-1')).toBe(true);
    });

    it('should return false for URL without workflow params', () => {
        expect(isWorkflowUrl('/hub')).toBe(false);
    });

    it('should return false for URL with only workflow param', () => {
        expect(isWorkflowUrl('/hub?workflow=inst-1')).toBe(false);
    });

    it('should return false for URL with only step param', () => {
        expect(isWorkflowUrl('/hub?step=step-1')).toBe(false);
    });

    it('should return true for query string with workflow params', () => {
        expect(isWorkflowUrl('workflow=inst-1&step=step-1')).toBe(true);
    });
});

describe('removeWorkflowParams', () => {
    it('should remove workflow params from URL', () => {
        const url = removeWorkflowParams('/hub?workflow=inst-1&step=step-1');
        expect(url).toBe('/hub');
    });

    it('should preserve other params', () => {
        const url = removeWorkflowParams('/hub?type=blog&workflow=inst-1&step=step-1');
        expect(url).toBe('/hub?type=blog');
    });

    it('should remove context params', () => {
        const url = removeWorkflowParams('/hub?ctx_name=John&ctx_age=30');
        expect(url).toBe('/hub');
    });

    it('should remove workflow and context params but keep others', () => {
        const url = removeWorkflowParams(
            '/hub?type=blog&workflow=inst-1&ctx_name=John&step=step-1&other=value'
        );
        expect(url).toContain('type=blog');
        expect(url).toContain('other=value');
        expect(url).not.toContain('workflow');
        expect(url).not.toContain('step');
        expect(url).not.toContain('ctx_');
    });

    it('should handle URL without query string', () => {
        const url = removeWorkflowParams('/hub');
        expect(url).toBe('/hub');
    });
});

describe('getCurrentStepRoute', () => {
    it('should return route for current step', () => {
        const route = getCurrentStepRoute(mockInstance, mockPreset);
        expect(route).toBe('/brand/profile');
    });

    it('should return route for different current step', () => {
        const instance = { ...mockInstance, currentStepId: 'step-2' };
        const route = getCurrentStepRoute(instance, mockPreset);
        expect(route).toBe('/studio/write?type=blog');
    });

    it('should throw error if current step not found', () => {
        const instance = { ...mockInstance, currentStepId: 'non-existent' };
        expect(() => {
            getCurrentStepRoute(instance, mockPreset);
        }).toThrow('Current step "non-existent" not found');
    });
});

describe('getStepRoute', () => {
    it('should return route for specified step', () => {
        expect(getStepRoute('step-1', mockPreset)).toBe('/brand/profile');
        expect(getStepRoute('step-2', mockPreset)).toBe('/studio/write?type=blog');
        expect(getStepRoute('step-3', mockPreset)).toBe('/research/agent');
    });

    it('should throw error for non-existent step', () => {
        expect(() => {
            getStepRoute('non-existent', mockPreset);
        }).toThrow('Step "non-existent" not found');
    });
});

describe('buildCurrentStepUrl', () => {
    it('should build complete URL for current step', () => {
        const url = buildCurrentStepUrl(mockInstance, mockPreset);
        expect(url).toBe('/brand/profile?workflow=instance-123&step=step-1');
    });

    it('should build URL for step with existing query params', () => {
        const instance = { ...mockInstance, currentStepId: 'step-2' };
        const url = buildCurrentStepUrl(instance, mockPreset);
        expect(url).toBe('/studio/write?type=blog&workflow=instance-123&step=step-2');
    });
});

describe('parseHubRoute', () => {
    it('should parse simple hub route', () => {
        const parsed = parseHubRoute('/brand/profile');
        expect(parsed).toEqual({ hub: 'brand', tab: 'profile' });
    });

    it('should parse hub route with query string', () => {
        const parsed = parseHubRoute('/studio/write?type=blog');
        expect(parsed).toEqual({ hub: 'studio', tab: 'write', query: 'type=blog' });
    });

    it('should parse hub-only route', () => {
        const parsed = parseHubRoute('/dashboard');
        expect(parsed).toEqual({ hub: 'dashboard' });
    });

    it('should handle route without leading slash', () => {
        const parsed = parseHubRoute('brand/profile');
        expect(parsed).toEqual({ hub: 'brand', tab: 'profile' });
    });

    it('should parse route with multiple query params', () => {
        const parsed = parseHubRoute('/studio/write?type=blog&mode=edit');
        expect(parsed).toEqual({
            hub: 'studio',
            tab: 'write',
            query: 'type=blog&mode=edit',
        });
    });

    it('should throw error for empty route', () => {
        expect(() => {
            parseHubRoute('');
        }).toThrow('Invalid hub route');
    });

    it('should throw error for just slash', () => {
        expect(() => {
            parseHubRoute('/');
        }).toThrow('Invalid hub route');
    });
});

describe('isValidHubRoute', () => {
    it('should validate correct hub routes', () => {
        expect(isValidHubRoute('/brand/profile')).toBe(true);
        expect(isValidHubRoute('/studio/write?type=blog')).toBe(true);
        expect(isValidHubRoute('/dashboard')).toBe(true);
        expect(isValidHubRoute('/research/agent')).toBe(true);
    });

    it('should reject routes without leading slash', () => {
        expect(isValidHubRoute('brand/profile')).toBe(false);
    });

    it('should reject empty routes', () => {
        expect(isValidHubRoute('')).toBe(false);
    });

    it('should reject just slash', () => {
        expect(isValidHubRoute('/')).toBe(false);
    });

    it('should reject invalid formats', () => {
        expect(isValidHubRoute('not-a-route')).toBe(false);
    });
});
