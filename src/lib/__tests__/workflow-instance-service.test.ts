/**
 * Tests for WorkflowInstanceService
 * 
 * Tests the high-level service layer for workflow instance management.
 * These are unit tests that verify the service logic without database calls.
 */

import { WorkflowInstanceService } from '../workflow-instance-service';
import { WorkflowPreset, WorkflowCategory, WorkflowStatus } from '@/types/workflows';

describe('WorkflowInstanceService', () => {
    let service: WorkflowInstanceService;

    // Sample workflow preset for testing
    const samplePreset: WorkflowPreset = {
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
            },
            {
                id: 'step-2',
                title: 'Step 2',
                description: 'Second step',
                hubRoute: '/test/step2',
                estimatedMinutes: 10,
                isOptional: true,
                helpText: 'Help for step 2',
                tips: ['Tip 2'],
                completionCriteria: 'Complete step 2',
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
            },
        ],
    };

    beforeEach(() => {
        // Create service instance with custom retry options for faster tests
        service = new WorkflowInstanceService({
            maxRetries: 1,
            initialDelayMs: 10,
            maxDelayMs: 50,
        });
    });

    describe('Service Initialization', () => {
        it('should create a service instance', () => {
            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(WorkflowInstanceService);
        });

        it('should have all required methods', () => {
            expect(typeof service.createInstance).toBe('function');
            expect(typeof service.getInstance).toBe('function');
            expect(typeof service.getUserInstances).toBe('function');
            expect(typeof service.updateInstanceState).toBe('function');
            expect(typeof service.completeStep).toBe('function');
            expect(typeof service.skipStep).toBe('function');
            expect(typeof service.completeWorkflow).toBe('function');
            expect(typeof service.archiveInstance).toBe('function');
        });
    });

    describe('Error Handling', () => {
        it('should throw error if preset has no steps', async () => {
            const userId = 'user-123';
            const emptyPreset = { ...samplePreset, steps: [] };

            await expect(service.createInstance(userId, emptyPreset)).rejects.toThrow(
                'Workflow preset "test-workflow" has no steps'
            );
        });
    });
});

