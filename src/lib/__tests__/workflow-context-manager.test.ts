/**
 * Tests for Workflow Context Manager
 * 
 * Tests context data storage, retrieval, aggregation, and graceful handling of missing data.
 */

import {
    setStepContext,
    getStepContext,
    getContextForStep,
    clearContext,
    validateStepContext,
    mergeStepContext,
    getContextKeys,
    hasStepContext,
} from '../workflow-context-manager';
import {
    WorkflowInstance,
    WorkflowPreset,
    WorkflowStatus,
    WorkflowCategory,
} from '@/types/workflows';

describe('Workflow Context Manager', () => {
    // Helper function to create a test workflow instance
    const createTestInstance = (contextData: Record<string, any> = {}): WorkflowInstance => ({
        id: 'test-instance-1',
        userId: 'user-123',
        presetId: 'test-preset',
        status: WorkflowStatus.ACTIVE,
        currentStepId: 'step-1',
        completedSteps: [],
        skippedSteps: [],
        contextData,
        startedAt: '2024-01-01T00:00:00Z',
        lastActiveAt: '2024-01-01T00:00:00Z',
    });

    // Helper function to create a test workflow preset
    const createTestPreset = (): WorkflowPreset => ({
        id: 'test-preset',
        title: 'Test Workflow',
        description: 'A test workflow',
        category: WorkflowCategory.CONTENT_CREATION,
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
                hubRoute: '/test/step1',
                estimatedMinutes: 10,
                isOptional: false,
                helpText: 'Help for step 1',
                tips: ['Tip 1'],
                completionCriteria: 'Complete step 1',
                contextOutputs: ['profileData', 'userData'],
            },
            {
                id: 'step-2',
                title: 'Step 2',
                description: 'Second step',
                hubRoute: '/test/step2',
                estimatedMinutes: 10,
                isOptional: false,
                helpText: 'Help for step 2',
                tips: ['Tip 2'],
                completionCriteria: 'Complete step 2',
                contextInputs: ['profileData'],
                contextOutputs: ['auditResults'],
            },
            {
                id: 'step-3',
                title: 'Step 3',
                description: 'Third step',
                hubRoute: '/test/step3',
                estimatedMinutes: 10,
                isOptional: false,
                helpText: 'Help for step 3',
                tips: ['Tip 3'],
                completionCriteria: 'Complete step 3',
                contextInputs: ['profileData', 'auditResults'],
                contextOutputs: ['finalReport'],
            },
        ],
    });

    describe('setStepContext', () => {
        it('should set context data for a step', () => {
            const instance = createTestInstance();
            const data = { name: 'John Doe', email: 'john@example.com' };

            const updatedContext = setStepContext(instance, 'step-1', data);

            expect(updatedContext['step-1']).toEqual(data);
        });

        it('should preserve existing context data when setting new step context', () => {
            const instance = createTestInstance({
                'step-1': { existing: 'data' },
            });
            const data = { name: 'John Doe' };

            const updatedContext = setStepContext(instance, 'step-2', data);

            expect(updatedContext['step-1']).toEqual({ existing: 'data' });
            expect(updatedContext['step-2']).toEqual(data);
        });

        it('should overwrite existing context for the same step', () => {
            const instance = createTestInstance({
                'step-1': { old: 'data' },
            });
            const data = { new: 'data' };

            const updatedContext = setStepContext(instance, 'step-1', data);

            expect(updatedContext['step-1']).toEqual(data);
        });
    });

    describe('getStepContext', () => {
        it('should retrieve context data for a step', () => {
            const data = { name: 'John Doe' };
            const instance = createTestInstance({
                'step-1': data,
            });

            const result = getStepContext(instance, 'step-1');

            expect(result).toEqual(data);
        });

        it('should return null for a step with no context', () => {
            const instance = createTestInstance();

            const result = getStepContext(instance, 'step-1');

            expect(result).toBeNull();
        });

        it('should return null for a non-existent step', () => {
            const instance = createTestInstance({
                'step-1': { data: 'value' },
            });

            const result = getStepContext(instance, 'non-existent-step');

            expect(result).toBeNull();
        });
    });

    describe('getContextForStep', () => {
        it('should return empty object for step with no context inputs', () => {
            const instance = createTestInstance();
            const preset = createTestPreset();

            const result = getContextForStep(instance, preset, 'step-1');

            expect(result).toEqual({});
        });

        it('should aggregate context from previous steps', () => {
            const instance = createTestInstance({
                'step-1': {
                    profileData: { name: 'John Doe' },
                    userData: { age: 30 },
                },
            });
            const preset = createTestPreset();

            const result = getContextForStep(instance, preset, 'step-2');

            expect(result.profileData).toEqual({ name: 'John Doe' });
        });

        it('should aggregate context from multiple previous steps', () => {
            const instance = createTestInstance({
                'step-1': {
                    profileData: { name: 'John Doe' },
                },
                'step-2': {
                    auditResults: { score: 95 },
                },
            });
            const preset = createTestPreset();

            const result = getContextForStep(instance, preset, 'step-3');

            expect(result.profileData).toEqual({ name: 'John Doe' });
            expect(result.auditResults).toEqual({ score: 95 });
        });

        it('should only include context outputs that match step inputs', () => {
            const instance = createTestInstance({
                'step-1': {
                    profileData: { name: 'John Doe' },
                    userData: { age: 30 },
                },
            });
            const preset = createTestPreset();

            const result = getContextForStep(instance, preset, 'step-2');

            expect(result.profileData).toEqual({ name: 'John Doe' });
            expect(result.userData).toBeUndefined();
        });

        it('should provide default values for missing context', () => {
            const instance = createTestInstance();
            const preset = createTestPreset();

            const result = getContextForStep(instance, preset, 'step-2');

            expect(result.profileData).toBeDefined();
            expect(result.profileData).toEqual({});
        });

        it('should handle missing context from skipped steps gracefully', () => {
            const instance = createTestInstance({
                'step-1': {
                    profileData: { name: 'John Doe' },
                },
                // step-2 was skipped, no auditResults
            });
            const preset = createTestPreset();

            const result = getContextForStep(instance, preset, 'step-3');

            expect(result.profileData).toEqual({ name: 'John Doe' });
            expect(result.auditResults).toBeDefined();
            expect(result.auditResults).toEqual({});
        });

        it('should return empty object for non-existent step', () => {
            const instance = createTestInstance();
            const preset = createTestPreset();

            const result = getContextForStep(instance, preset, 'non-existent-step');

            expect(result).toEqual({});
        });

        it('should handle partial context data gracefully', () => {
            const instance = createTestInstance({
                'step-1': {
                    profileData: { name: 'John Doe' },
                    // userData is missing
                },
            });
            const preset = createTestPreset();

            const result = getContextForStep(instance, preset, 'step-2');

            expect(result.profileData).toEqual({ name: 'John Doe' });
        });
    });

    describe('clearContext', () => {
        it('should return empty context object', () => {
            const instance = createTestInstance({
                'step-1': { data: 'value' },
                'step-2': { more: 'data' },
            });

            const result = clearContext(instance);

            expect(result).toEqual({});
        });

        it('should work with already empty context', () => {
            const instance = createTestInstance();

            const result = clearContext(instance);

            expect(result).toEqual({});
        });
    });

    describe('validateStepContext', () => {
        it('should return valid for step with no context inputs', () => {
            const instance = createTestInstance();
            const preset = createTestPreset();

            const result = validateStepContext(instance, preset, 'step-1');

            expect(result.isValid).toBe(true);
            expect(result.missingKeys).toEqual([]);
        });

        it('should return valid when all required context is present', () => {
            const instance = createTestInstance({
                'step-1': {
                    profileData: { name: 'John Doe' },
                },
            });
            const preset = createTestPreset();

            const result = validateStepContext(instance, preset, 'step-2');

            expect(result.isValid).toBe(true);
            expect(result.missingKeys).toEqual([]);
        });

        it('should return invalid when required context is missing', () => {
            const instance = createTestInstance();
            const preset = createTestPreset();

            const result = validateStepContext(instance, preset, 'step-2');

            expect(result.isValid).toBe(false);
            expect(result.missingKeys).toContain('profileData');
        });

        it('should identify multiple missing context keys', () => {
            const instance = createTestInstance();
            const preset = createTestPreset();

            const result = validateStepContext(instance, preset, 'step-3');

            expect(result.isValid).toBe(false);
            expect(result.missingKeys).toContain('profileData');
            expect(result.missingKeys).toContain('auditResults');
        });

        it('should return invalid for non-existent step', () => {
            const instance = createTestInstance();
            const preset = createTestPreset();

            const result = validateStepContext(instance, preset, 'non-existent-step');

            expect(result.isValid).toBe(false);
        });
    });

    describe('mergeStepContext', () => {
        it('should merge new data with existing step context', () => {
            const instance = createTestInstance({
                'step-1': { existing: 'data', keep: 'this' },
            });
            const newData = { new: 'data', existing: 'updated' };

            const updatedContext = mergeStepContext(instance, 'step-1', newData);

            expect(updatedContext['step-1']).toEqual({
                existing: 'updated',
                keep: 'this',
                new: 'data',
            });
        });

        it('should create new step context if none exists', () => {
            const instance = createTestInstance();
            const newData = { new: 'data' };

            const updatedContext = mergeStepContext(instance, 'step-1', newData);

            expect(updatedContext['step-1']).toEqual(newData);
        });

        it('should preserve other step contexts when merging', () => {
            const instance = createTestInstance({
                'step-1': { data: 'one' },
                'step-2': { data: 'two' },
            });
            const newData = { updated: 'data' };

            const updatedContext = mergeStepContext(instance, 'step-1', newData);

            expect(updatedContext['step-1']).toEqual({
                data: 'one',
                updated: 'data',
            });
            expect(updatedContext['step-2']).toEqual({ data: 'two' });
        });
    });

    describe('getContextKeys', () => {
        it('should return all step IDs with context data', () => {
            const instance = createTestInstance({
                'step-1': { data: 'one' },
                'step-2': { data: 'two' },
                'step-3': { data: 'three' },
            });

            const keys = getContextKeys(instance);

            expect(keys).toHaveLength(3);
            expect(keys).toContain('step-1');
            expect(keys).toContain('step-2');
            expect(keys).toContain('step-3');
        });

        it('should return empty array for instance with no context', () => {
            const instance = createTestInstance();

            const keys = getContextKeys(instance);

            expect(keys).toEqual([]);
        });
    });

    describe('hasStepContext', () => {
        it('should return true for step with context data', () => {
            const instance = createTestInstance({
                'step-1': { data: 'value' },
            });

            const result = hasStepContext(instance, 'step-1');

            expect(result).toBe(true);
        });

        it('should return false for step with no context data', () => {
            const instance = createTestInstance();

            const result = hasStepContext(instance, 'step-1');

            expect(result).toBe(false);
        });

        it('should return false for step with empty object context', () => {
            const instance = createTestInstance({
                'step-1': {},
            });

            const result = hasStepContext(instance, 'step-1');

            expect(result).toBe(false);
        });

        it('should return false for step with null context', () => {
            const instance = createTestInstance({
                'step-1': null,
            });

            const result = hasStepContext(instance, 'step-1');

            expect(result).toBe(false);
        });
    });

    describe('Default context values', () => {
        it('should provide empty array for list-like context keys', () => {
            const preset: WorkflowPreset = {
                ...createTestPreset(),
                steps: [
                    {
                        id: 'step-1',
                        title: 'Step 1',
                        description: 'First step',
                        hubRoute: '/test/step1',
                        estimatedMinutes: 10,
                        isOptional: false,
                        helpText: 'Help',
                        tips: [],
                        completionCriteria: 'Done',
                        contextInputs: ['competitorsList', 'itemsList'],
                    },
                ],
            };
            const instance = createTestInstance();

            const result = getContextForStep(instance, preset, 'step-1');

            expect(Array.isArray(result.competitorsList)).toBe(true);
            expect(Array.isArray(result.itemsList)).toBe(true);
        });

        it('should provide empty object for data-like context keys', () => {
            const preset: WorkflowPreset = {
                ...createTestPreset(),
                steps: [
                    {
                        id: 'step-1',
                        title: 'Step 1',
                        description: 'First step',
                        hubRoute: '/test/step1',
                        estimatedMinutes: 10,
                        isOptional: false,
                        helpText: 'Help',
                        tips: [],
                        completionCriteria: 'Done',
                        contextInputs: ['profileData', 'userDetails'],
                    },
                ],
            };
            const instance = createTestInstance();

            const result = getContextForStep(instance, preset, 'step-1');

            expect(typeof result.profileData).toBe('object');
            expect(typeof result.userDetails).toBe('object');
        });

        it('should provide empty string for text-like context keys', () => {
            const preset: WorkflowPreset = {
                ...createTestPreset(),
                steps: [
                    {
                        id: 'step-1',
                        title: 'Step 1',
                        description: 'First step',
                        hubRoute: '/test/step1',
                        estimatedMinutes: 10,
                        isOptional: false,
                        helpText: 'Help',
                        tips: [],
                        completionCriteria: 'Done',
                        contextInputs: ['descriptionText', 'reportContent'],
                    },
                ],
            };
            const instance = createTestInstance();

            const result = getContextForStep(instance, preset, 'step-1');

            expect(result.descriptionText).toBe('');
            expect(result.reportContent).toBe('');
        });

        it('should provide zero for count-like context keys', () => {
            const preset: WorkflowPreset = {
                ...createTestPreset(),
                steps: [
                    {
                        id: 'step-1',
                        title: 'Step 1',
                        description: 'First step',
                        hubRoute: '/test/step1',
                        estimatedMinutes: 10,
                        isOptional: false,
                        helpText: 'Help',
                        tips: [],
                        completionCriteria: 'Done',
                        contextInputs: ['itemCount', 'totalNumber'],
                    },
                ],
            };
            const instance = createTestInstance();

            const result = getContextForStep(instance, preset, 'step-1');

            expect(result.itemCount).toBe(0);
            expect(result.totalNumber).toBe(0);
        });
    });
});
