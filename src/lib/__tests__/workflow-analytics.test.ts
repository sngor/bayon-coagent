/**
 * Workflow Analytics Service Tests
 * 
 * Tests for the WorkflowAnalyticsService class
 */

import { WorkflowAnalyticsService, WorkflowEventType, getWorkflowAnalyticsService } from '../workflow-analytics';
import { WorkflowInstance, WorkflowPreset, WorkflowStatus, WorkflowCategory } from '@/types/workflows';

describe('WorkflowAnalyticsService', () => {
    let service: WorkflowAnalyticsService;
    let mockInstance: WorkflowInstance;
    let mockPreset: WorkflowPreset;

    beforeEach(() => {
        service = new WorkflowAnalyticsService();

        mockPreset = {
            id: 'test-workflow',
            title: 'Test Workflow',
            description: 'Test Description',
            category: WorkflowCategory.BRAND_BUILDING,
            tags: ['test'],
            estimatedMinutes: 30,
            isRecommended: true,
            icon: 'TestIcon',
            steps: [
                {
                    id: 'step-1',
                    title: 'Step 1',
                    description: 'First step',
                    hubRoute: '/test',
                    estimatedMinutes: 10,
                    isOptional: false,
                    helpText: 'Help',
                    tips: [],
                    completionCriteria: 'Done',
                },
            ],
            outcomes: [],
        };

        mockInstance = {
            id: 'instance-1',
            userId: 'user-1',
            presetId: 'test-workflow',
            status: WorkflowStatus.ACTIVE,
            currentStepId: 'step-1',
            completedSteps: [],
            skippedSteps: [],
            contextData: {},
            startedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        };
    });

    describe('Service Initialization', () => {
        it('should create a service instance', () => {
            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(WorkflowAnalyticsService);
        });

        it('should provide a singleton instance', () => {
            const instance1 = getWorkflowAnalyticsService();
            const instance2 = getWorkflowAnalyticsService();
            expect(instance1).toBe(instance2);
        });
    });

    describe('trackWorkflowStart', () => {
        it('should not throw when tracking workflow start', () => {
            expect(() => {
                service.trackWorkflowStart('user-1', mockInstance, mockPreset);
            }).not.toThrow();
        });
    });

    describe('trackStepStart', () => {
        it('should not throw when tracking step start', () => {
            expect(() => {
                service.trackStepStart('user-1', mockInstance, mockPreset, 'step-1');
            }).not.toThrow();
        });
    });

    describe('trackStepCompletion', () => {
        it('should not throw when tracking step completion', () => {
            expect(() => {
                service.trackStepCompletion('user-1', mockInstance, mockPreset, 'step-1');
            }).not.toThrow();
        });

        it('should handle context data', () => {
            expect(() => {
                service.trackStepCompletion('user-1', mockInstance, mockPreset, 'step-1', { key: 'value' });
            }).not.toThrow();
        });
    });

    describe('trackStepSkip', () => {
        it('should not throw when tracking step skip', () => {
            expect(() => {
                service.trackStepSkip('user-1', mockInstance, mockPreset, 'step-1');
            }).not.toThrow();
        });
    });

    describe('trackWorkflowCompletion', () => {
        it('should not throw when tracking workflow completion', () => {
            expect(() => {
                service.trackWorkflowCompletion('user-1', mockInstance, mockPreset, 25);
            }).not.toThrow();
        });
    });

    describe('trackWorkflowAbandonment', () => {
        it('should not throw when tracking workflow abandonment', () => {
            expect(() => {
                service.trackWorkflowAbandonment('user-1', mockInstance, mockPreset, 35);
            }).not.toThrow();
        });
    });
});
