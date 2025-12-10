/**
 * Unit tests for Workflow State Manager
 * 
 * Tests all state transition logic, validation, and helper functions.
 */

import {
    getCurrentStep,
    getNextStep,
    canNavigateToStep,
    transitionToStep,
    markStepComplete,
    markStepSkipped,
    isWorkflowComplete,
    getStepIndex,
    getStepAtIndex,
    calculateProgress,
    calculateRemainingTime,
} from '../workflow-state-manager';
import {
    WorkflowInstance,
    WorkflowPreset,
    WorkflowCategory,
    WorkflowStatus,
} from '@/types/workflows';

// Mock workflow preset for testing
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
            hubRoute: '/test/step1',
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
            hubRoute: '/test/step2',
            estimatedMinutes: 5,
            isOptional: true,
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
            hubRoute: '/test/step3',
            estimatedMinutes: 15,
            isOptional: false,
            helpText: 'Help for step 3',
            tips: ['Tip 3'],
            completionCriteria: 'Complete step 3',
            contextInputs: ['data1', 'data2'],
        },
    ],
};

// Helper to create a mock workflow instance
function createMockInstance(overrides?: Partial<WorkflowInstance>): WorkflowInstance {
    return {
        id: 'instance-1',
        userId: 'user-1',
        presetId: 'test-workflow',
        status: WorkflowStatus.ACTIVE,
        currentStepId: 'step-1',
        completedSteps: [],
        skippedSteps: [],
        contextData: {},
        startedAt: '2024-01-01T00:00:00Z',
        lastActiveAt: '2024-01-01T00:00:00Z',
        ...overrides,
    };
}

describe('getCurrentStep', () => {
    it('should return the current step definition', () => {
        const instance = createMockInstance({ currentStepId: 'step-2' });
        const step = getCurrentStep(instance, mockPreset);

        expect(step.id).toBe('step-2');
        expect(step.title).toBe('Step 2');
    });

    it('should throw error if current step not found', () => {
        const instance = createMockInstance({ currentStepId: 'invalid-step' });

        expect(() => getCurrentStep(instance, mockPreset)).toThrow(
            'Current step "invalid-step" not found'
        );
    });
});

describe('getNextStep', () => {
    it('should return the next step in sequence', () => {
        const instance = createMockInstance({ currentStepId: 'step-1' });
        const nextStep = getNextStep(instance, mockPreset);

        expect(nextStep).not.toBeNull();
        expect(nextStep?.id).toBe('step-2');
    });

    it('should return null when at the last step', () => {
        const instance = createMockInstance({ currentStepId: 'step-3' });
        const nextStep = getNextStep(instance, mockPreset);

        expect(nextStep).toBeNull();
    });

    it('should throw error if current step not found', () => {
        const instance = createMockInstance({ currentStepId: 'invalid-step' });

        expect(() => getNextStep(instance, mockPreset)).toThrow(
            'Current step "invalid-step" not found'
        );
    });
});

describe('canNavigateToStep', () => {
    it('should allow navigation to current step', () => {
        const instance = createMockInstance({ currentStepId: 'step-2' });

        expect(canNavigateToStep(instance, 'step-2', mockPreset)).toBe(true);
    });

    it('should allow navigation to completed steps', () => {
        const instance = createMockInstance({
            currentStepId: 'step-3',
            completedSteps: ['step-1', 'step-2'],
        });

        expect(canNavigateToStep(instance, 'step-1', mockPreset)).toBe(true);
        expect(canNavigateToStep(instance, 'step-2', mockPreset)).toBe(true);
    });

    it('should allow navigation to skipped steps', () => {
        const instance = createMockInstance({
            currentStepId: 'step-3',
            skippedSteps: ['step-2'],
        });

        expect(canNavigateToStep(instance, 'step-2', mockPreset)).toBe(true);
    });

    it('should not allow navigation to incomplete future steps', () => {
        const instance = createMockInstance({ currentStepId: 'step-1' });

        expect(canNavigateToStep(instance, 'step-3', mockPreset)).toBe(false);
    });

    it('should return false for non-existent steps', () => {
        const instance = createMockInstance();

        expect(canNavigateToStep(instance, 'invalid-step', mockPreset)).toBe(false);
    });
});

describe('transitionToStep', () => {
    it('should transition to a completed step', () => {
        const instance = createMockInstance({
            currentStepId: 'step-3',
            completedSteps: ['step-1', 'step-2'],
        });

        const newState = transitionToStep(instance, 'step-1', mockPreset);

        expect(newState.currentStepId).toBe('step-1');
        expect(newState.completedSteps).toEqual(['step-1', 'step-2']);
    });

    it('should update lastActiveAt timestamp', () => {
        const instance = createMockInstance({
            currentStepId: 'step-2',
            completedSteps: ['step-1'],
        });

        const beforeTime = new Date().toISOString();
        const newState = transitionToStep(instance, 'step-1', mockPreset);
        const afterTime = new Date().toISOString();

        expect(newState.lastActiveAt >= beforeTime).toBe(true);
        expect(newState.lastActiveAt <= afterTime).toBe(true);
    });

    it('should throw error when transitioning to incomplete future step', () => {
        const instance = createMockInstance({ currentStepId: 'step-1' });

        expect(() => transitionToStep(instance, 'step-3', mockPreset)).toThrow(
            'Cannot navigate to step "step-3"'
        );
    });

    it('should preserve context data', () => {
        const instance = createMockInstance({
            currentStepId: 'step-2',
            completedSteps: ['step-1'],
            contextData: { key: 'value' },
        });

        const newState = transitionToStep(instance, 'step-1', mockPreset);

        expect(newState.contextData).toEqual({ key: 'value' });
    });
});

describe('markStepComplete', () => {
    it('should mark current step as complete', () => {
        const instance = createMockInstance({ currentStepId: 'step-1' });

        const newState = markStepComplete(instance, 'step-1', mockPreset);

        expect(newState.completedSteps).toContain('step-1');
    });

    it('should advance to next step', () => {
        const instance = createMockInstance({ currentStepId: 'step-1' });

        const newState = markStepComplete(instance, 'step-1', mockPreset);

        expect(newState.currentStepId).toBe('step-2');
    });

    it('should stay on last step when completing it', () => {
        const instance = createMockInstance({
            currentStepId: 'step-3',
            completedSteps: ['step-1', 'step-2'],
        });

        const newState = markStepComplete(instance, 'step-3', mockPreset);

        expect(newState.currentStepId).toBe('step-3');
        expect(newState.completedSteps).toContain('step-3');
    });

    it('should merge context data', () => {
        const instance = createMockInstance({
            currentStepId: 'step-1',
            contextData: { existing: 'data' },
        });

        const newState = markStepComplete(instance, 'step-1', mockPreset, {
            new: 'data',
        });

        expect(newState.contextData).toEqual({
            existing: 'data',
            new: 'data',
        });
    });

    it('should remove step from skipped steps if previously skipped', () => {
        const instance = createMockInstance({
            currentStepId: 'step-2',
            skippedSteps: ['step-2'],
        });

        const newState = markStepComplete(instance, 'step-2', mockPreset);

        expect(newState.skippedSteps).not.toContain('step-2');
        expect(newState.completedSteps).toContain('step-2');
    });

    it('should throw error when completing non-current step', () => {
        const instance = createMockInstance({ currentStepId: 'step-1' });

        expect(() => markStepComplete(instance, 'step-2', mockPreset)).toThrow(
            'Cannot complete step "step-2". Current step is "step-1"'
        );
    });

    it('should not duplicate step in completedSteps', () => {
        const instance = createMockInstance({
            currentStepId: 'step-1',
            completedSteps: ['step-1'],
        });

        const newState = markStepComplete(instance, 'step-1', mockPreset);

        expect(newState.completedSteps.filter(id => id === 'step-1')).toHaveLength(1);
    });
});

describe('markStepSkipped', () => {
    it('should mark optional step as skipped', () => {
        const instance = createMockInstance({ currentStepId: 'step-2' });

        const newState = markStepSkipped(instance, 'step-2', mockPreset);

        expect(newState.skippedSteps).toContain('step-2');
    });

    it('should advance to next step', () => {
        const instance = createMockInstance({
            currentStepId: 'step-2',
            completedSteps: ['step-1'],
        });

        const newState = markStepSkipped(instance, 'step-2', mockPreset);

        expect(newState.currentStepId).toBe('step-3');
    });

    it('should throw error when skipping required step', () => {
        const instance = createMockInstance({ currentStepId: 'step-1' });

        expect(() => markStepSkipped(instance, 'step-1', mockPreset)).toThrow(
            'Cannot skip required step "step-1"'
        );
    });

    it('should throw error when skipping non-current step', () => {
        const instance = createMockInstance({ currentStepId: 'step-1' });

        expect(() => markStepSkipped(instance, 'step-2', mockPreset)).toThrow(
            'Cannot skip step "step-2". Current step is "step-1"'
        );
    });

    it('should remove step from completed steps if previously completed', () => {
        const instance = createMockInstance({
            currentStepId: 'step-2',
            completedSteps: ['step-1', 'step-2'],
        });

        const newState = markStepSkipped(instance, 'step-2', mockPreset);

        expect(newState.completedSteps).not.toContain('step-2');
        expect(newState.skippedSteps).toContain('step-2');
    });

    it('should not duplicate step in skippedSteps', () => {
        const instance = createMockInstance({
            currentStepId: 'step-2',
            skippedSteps: ['step-2'],
        });

        const newState = markStepSkipped(instance, 'step-2', mockPreset);

        expect(newState.skippedSteps.filter(id => id === 'step-2')).toHaveLength(1);
    });
});

describe('isWorkflowComplete', () => {
    it('should return false when no steps completed', () => {
        const instance = createMockInstance();

        expect(isWorkflowComplete(instance, mockPreset)).toBe(false);
    });

    it('should return false when only some required steps completed', () => {
        const instance = createMockInstance({
            completedSteps: ['step-1'],
        });

        expect(isWorkflowComplete(instance, mockPreset)).toBe(false);
    });

    it('should return true when all required steps completed and optional skipped', () => {
        const instance = createMockInstance({
            completedSteps: ['step-1', 'step-3'],
            skippedSteps: ['step-2'],
        });

        expect(isWorkflowComplete(instance, mockPreset)).toBe(true);
    });

    it('should return true when all steps completed', () => {
        const instance = createMockInstance({
            completedSteps: ['step-1', 'step-2', 'step-3'],
        });

        expect(isWorkflowComplete(instance, mockPreset)).toBe(true);
    });

    it('should return false when optional step neither completed nor skipped', () => {
        const instance = createMockInstance({
            completedSteps: ['step-1', 'step-3'],
        });

        expect(isWorkflowComplete(instance, mockPreset)).toBe(false);
    });
});

describe('getStepIndex', () => {
    it('should return correct index for existing step', () => {
        expect(getStepIndex('step-1', mockPreset)).toBe(0);
        expect(getStepIndex('step-2', mockPreset)).toBe(1);
        expect(getStepIndex('step-3', mockPreset)).toBe(2);
    });

    it('should return -1 for non-existent step', () => {
        expect(getStepIndex('invalid-step', mockPreset)).toBe(-1);
    });
});

describe('getStepAtIndex', () => {
    it('should return step at valid index', () => {
        const step = getStepAtIndex(1, mockPreset);

        expect(step).not.toBeNull();
        expect(step?.id).toBe('step-2');
    });

    it('should return null for negative index', () => {
        expect(getStepAtIndex(-1, mockPreset)).toBeNull();
    });

    it('should return null for index out of bounds', () => {
        expect(getStepAtIndex(10, mockPreset)).toBeNull();
    });
});

describe('calculateProgress', () => {
    it('should return 0 when no steps handled', () => {
        const instance = createMockInstance();

        expect(calculateProgress(instance, mockPreset)).toBe(0);
    });

    it('should calculate progress correctly with completed steps', () => {
        const instance = createMockInstance({
            completedSteps: ['step-1'],
        });

        // 1 out of 3 steps = 33%
        expect(calculateProgress(instance, mockPreset)).toBe(33);
    });

    it('should calculate progress correctly with skipped steps', () => {
        const instance = createMockInstance({
            skippedSteps: ['step-2'],
        });

        // 1 out of 3 steps = 33%
        expect(calculateProgress(instance, mockPreset)).toBe(33);
    });

    it('should calculate progress correctly with both completed and skipped', () => {
        const instance = createMockInstance({
            completedSteps: ['step-1', 'step-3'],
            skippedSteps: ['step-2'],
        });

        // 3 out of 3 steps = 100%
        expect(calculateProgress(instance, mockPreset)).toBe(100);
    });

    it('should return 100 for empty workflow', () => {
        const emptyPreset: WorkflowPreset = {
            ...mockPreset,
            steps: [],
        };
        const instance = createMockInstance();

        expect(calculateProgress(instance, emptyPreset)).toBe(100);
    });
});

describe('calculateRemainingTime', () => {
    it('should return total time when no steps completed', () => {
        const instance = createMockInstance();

        // 10 + 5 + 15 = 30 minutes
        expect(calculateRemainingTime(instance, mockPreset)).toBe(30);
    });

    it('should subtract completed steps from total', () => {
        const instance = createMockInstance({
            completedSteps: ['step-1'],
        });

        // 5 + 15 = 20 minutes (step-1's 10 minutes excluded)
        expect(calculateRemainingTime(instance, mockPreset)).toBe(20);
    });

    it('should subtract skipped steps from total', () => {
        const instance = createMockInstance({
            skippedSteps: ['step-2'],
        });

        // 10 + 15 = 25 minutes (step-2's 5 minutes excluded)
        expect(calculateRemainingTime(instance, mockPreset)).toBe(25);
    });

    it('should return 0 when all steps handled', () => {
        const instance = createMockInstance({
            completedSteps: ['step-1', 'step-3'],
            skippedSteps: ['step-2'],
        });

        expect(calculateRemainingTime(instance, mockPreset)).toBe(0);
    });
});
