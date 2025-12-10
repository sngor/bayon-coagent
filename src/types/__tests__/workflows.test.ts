/**
 * Unit tests for workflow types and schemas
 */

import {
    WorkflowCategory,
    WorkflowStatus,
    WorkflowCategorySchema,
    WorkflowStatusSchema,
    WorkflowStepDefinitionSchema,
    WorkflowPresetSchema,
    WorkflowStateSchema,
    WorkflowInstanceSchema,
    InstanceFilterSchema,
    UserProfileSchema,
    isWorkflowCategory,
    isWorkflowStatus,
    isActiveWorkflow,
    isCompletedWorkflow,
    isStaleWorkflow,
    type WorkflowInstance,
    type WorkflowPreset,
    type WorkflowStepDefinition,
    type WorkflowState,
} from '../workflows';

describe('Workflow Enums', () => {
    test('WorkflowCategory enum has correct values', () => {
        expect(WorkflowCategory.BRAND_BUILDING).toBe('brand-building');
        expect(WorkflowCategory.CONTENT_CREATION).toBe('content-creation');
        expect(WorkflowCategory.MARKET_ANALYSIS).toBe('market-analysis');
        expect(WorkflowCategory.CLIENT_ACQUISITION).toBe('client-acquisition');
    });

    test('WorkflowStatus enum has correct values', () => {
        expect(WorkflowStatus.ACTIVE).toBe('active');
        expect(WorkflowStatus.COMPLETED).toBe('completed');
        expect(WorkflowStatus.STALE).toBe('stale');
        expect(WorkflowStatus.ARCHIVED).toBe('archived');
    });
});

describe('Workflow Type Guards', () => {
    test('isWorkflowCategory validates correctly', () => {
        expect(isWorkflowCategory('brand-building')).toBe(true);
        expect(isWorkflowCategory('invalid')).toBe(false);
        expect(isWorkflowCategory(null)).toBe(false);
    });

    test('isWorkflowStatus validates correctly', () => {
        expect(isWorkflowStatus('active')).toBe(true);
        expect(isWorkflowStatus('invalid')).toBe(false);
        expect(isWorkflowStatus(undefined)).toBe(false);
    });

    test('isActiveWorkflow identifies active workflows', () => {
        const activeInstance: WorkflowInstance = {
            id: 'test-1',
            userId: 'user-1',
            presetId: 'preset-1',
            status: WorkflowStatus.ACTIVE,
            currentStepId: 'step-1',
            completedSteps: [],
            skippedSteps: [],
            contextData: {},
            startedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        };
        expect(isActiveWorkflow(activeInstance)).toBe(true);

        const completedInstance: WorkflowInstance = {
            ...activeInstance,
            status: WorkflowStatus.COMPLETED,
        };
        expect(isActiveWorkflow(completedInstance)).toBe(false);
    });

    test('isCompletedWorkflow identifies completed workflows', () => {
        const completedInstance: WorkflowInstance = {
            id: 'test-1',
            userId: 'user-1',
            presetId: 'preset-1',
            status: WorkflowStatus.COMPLETED,
            currentStepId: 'step-1',
            completedSteps: ['step-1'],
            skippedSteps: [],
            contextData: {},
            startedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
        };
        expect(isCompletedWorkflow(completedInstance)).toBe(true);

        const activeInstance: WorkflowInstance = {
            ...completedInstance,
            status: WorkflowStatus.ACTIVE,
        };
        expect(isCompletedWorkflow(activeInstance)).toBe(false);
    });

    test('isStaleWorkflow identifies stale workflows', () => {
        const staleInstance: WorkflowInstance = {
            id: 'test-1',
            userId: 'user-1',
            presetId: 'preset-1',
            status: WorkflowStatus.STALE,
            currentStepId: 'step-1',
            completedSteps: [],
            skippedSteps: [],
            contextData: {},
            startedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        };
        expect(isStaleWorkflow(staleInstance)).toBe(true);

        const activeInstance: WorkflowInstance = {
            ...staleInstance,
            status: WorkflowStatus.ACTIVE,
        };
        expect(isStaleWorkflow(activeInstance)).toBe(false);
    });
});

describe('Zod Schemas', () => {
    describe('WorkflowCategorySchema', () => {
        test('validates valid categories', () => {
            expect(WorkflowCategorySchema.parse('brand-building')).toBe('brand-building');
            expect(WorkflowCategorySchema.parse('content-creation')).toBe('content-creation');
        });

        test('rejects invalid categories', () => {
            expect(() => WorkflowCategorySchema.parse('invalid')).toThrow();
        });
    });

    describe('WorkflowStatusSchema', () => {
        test('validates valid statuses', () => {
            expect(WorkflowStatusSchema.parse('active')).toBe('active');
            expect(WorkflowStatusSchema.parse('completed')).toBe('completed');
        });

        test('rejects invalid statuses', () => {
            expect(() => WorkflowStatusSchema.parse('invalid')).toThrow();
        });
    });

    describe('WorkflowStepDefinitionSchema', () => {
        const validStep: WorkflowStepDefinition = {
            id: 'step-1',
            title: 'Test Step',
            description: 'A test step',
            hubRoute: '/test',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Help text',
            tips: ['Tip 1', 'Tip 2'],
            completionCriteria: 'Complete the test',
            contextInputs: ['input1'],
            contextOutputs: ['output1'],
        };

        test('validates valid step definition', () => {
            const result = WorkflowStepDefinitionSchema.parse(validStep);
            expect(result).toEqual(validStep);
        });

        test('validates step without optional fields', () => {
            const stepWithoutOptional = { ...validStep };
            delete stepWithoutOptional.contextInputs;
            delete stepWithoutOptional.contextOutputs;

            const result = WorkflowStepDefinitionSchema.parse(stepWithoutOptional);
            expect(result.contextInputs).toBeUndefined();
            expect(result.contextOutputs).toBeUndefined();
        });

        test('rejects step with invalid estimatedMinutes', () => {
            const invalidStep = { ...validStep, estimatedMinutes: -5 };
            expect(() => WorkflowStepDefinitionSchema.parse(invalidStep)).toThrow();
        });

        test('rejects step with empty required fields', () => {
            const invalidStep = { ...validStep, title: '' };
            expect(() => WorkflowStepDefinitionSchema.parse(invalidStep)).toThrow();
        });
    });

    describe('WorkflowPresetSchema', () => {
        const validPreset: WorkflowPreset = {
            id: 'preset-1',
            title: 'Test Workflow',
            description: 'A test workflow',
            category: WorkflowCategory.BRAND_BUILDING,
            tags: ['test', 'example'],
            estimatedMinutes: 30,
            isRecommended: true,
            icon: 'Rocket',
            steps: [
                {
                    id: 'step-1',
                    title: 'Step 1',
                    description: 'First step',
                    hubRoute: '/test',
                    estimatedMinutes: 15,
                    isOptional: false,
                    helpText: 'Help',
                    tips: ['Tip'],
                    completionCriteria: 'Done',
                },
            ],
            outcomes: ['Outcome 1', 'Outcome 2'],
            prerequisites: ['Prerequisite 1'],
            requiredIntegrations: ['google-business-profile'],
        };

        test('validates valid preset', () => {
            const result = WorkflowPresetSchema.parse(validPreset);
            expect(result).toEqual(validPreset);
        });

        test('validates preset without optional fields', () => {
            const presetWithoutOptional = { ...validPreset };
            delete presetWithoutOptional.prerequisites;
            delete presetWithoutOptional.requiredIntegrations;

            const result = WorkflowPresetSchema.parse(presetWithoutOptional);
            expect(result.prerequisites).toBeUndefined();
            expect(result.requiredIntegrations).toBeUndefined();
        });

        test('rejects preset with empty steps array', () => {
            const invalidPreset = { ...validPreset, steps: [] };
            expect(() => WorkflowPresetSchema.parse(invalidPreset)).toThrow();
        });

        test('rejects preset with empty outcomes array', () => {
            const invalidPreset = { ...validPreset, outcomes: [] };
            expect(() => WorkflowPresetSchema.parse(invalidPreset)).toThrow();
        });
    });

    describe('WorkflowStateSchema', () => {
        const validState: WorkflowState = {
            currentStepId: 'step-1',
            completedSteps: ['step-0'],
            skippedSteps: [],
            contextData: { key: 'value' },
            lastActiveAt: new Date().toISOString(),
        };

        test('validates valid state', () => {
            const result = WorkflowStateSchema.parse(validState);
            expect(result).toEqual(validState);
        });

        test('rejects state with invalid datetime', () => {
            const invalidState = { ...validState, lastActiveAt: 'not-a-date' };
            expect(() => WorkflowStateSchema.parse(invalidState)).toThrow();
        });
    });

    describe('WorkflowInstanceSchema', () => {
        const validInstance: WorkflowInstance = {
            id: 'instance-1',
            userId: 'user-1',
            presetId: 'preset-1',
            status: WorkflowStatus.ACTIVE,
            currentStepId: 'step-1',
            completedSteps: [],
            skippedSteps: [],
            contextData: {},
            startedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        };

        test('validates valid instance', () => {
            const result = WorkflowInstanceSchema.parse(validInstance);
            expect(result).toEqual(validInstance);
        });

        test('validates completed instance with optional fields', () => {
            const completedInstance: WorkflowInstance = {
                ...validInstance,
                status: WorkflowStatus.COMPLETED,
                completedAt: new Date().toISOString(),
                actualMinutes: 45,
            };

            const result = WorkflowInstanceSchema.parse(completedInstance);
            expect(result).toEqual(completedInstance);
        });

        test('rejects instance with invalid status', () => {
            const invalidInstance = { ...validInstance, status: 'invalid' };
            expect(() => WorkflowInstanceSchema.parse(invalidInstance)).toThrow();
        });

        test('rejects instance with negative actualMinutes', () => {
            const invalidInstance = { ...validInstance, actualMinutes: -10 };
            expect(() => WorkflowInstanceSchema.parse(invalidInstance)).toThrow();
        });
    });

    describe('InstanceFilterSchema', () => {
        test('validates empty filter', () => {
            const result = InstanceFilterSchema.parse({});
            expect(result).toEqual({});
        });

        test('validates filter with all fields', () => {
            const filter = {
                status: WorkflowStatus.ACTIVE,
                presetId: 'preset-1',
                limit: 10,
            };
            const result = InstanceFilterSchema.parse(filter);
            expect(result).toEqual(filter);
        });

        test('rejects filter with invalid limit', () => {
            const invalidFilter = { limit: -5 };
            expect(() => InstanceFilterSchema.parse(invalidFilter)).toThrow();
        });
    });

    describe('UserProfileSchema', () => {
        test('validates minimal user profile', () => {
            const profile = { userId: 'user-1' };
            const result = UserProfileSchema.parse(profile);
            expect(result).toEqual(profile);
        });

        test('validates complete user profile', () => {
            const profile = {
                userId: 'user-1',
                isNewUser: true,
                interests: ['brand', 'content'],
                completedWorkflows: ['workflow-1'],
            };
            const result = UserProfileSchema.parse(profile);
            expect(result).toEqual(profile);
        });

        test('rejects profile without userId', () => {
            const invalidProfile = { isNewUser: true };
            expect(() => UserProfileSchema.parse(invalidProfile)).toThrow();
        });
    });
});
