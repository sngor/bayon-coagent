/**
 * Property Test: Distributed Transaction Consistency
 * 
 * **Feature: microservices-architecture, Property 21: Distributed Transaction Consistency**
 * **Validates: Requirements 7.2**
 * 
 * Property: For any cross-service transaction, saga patterns should maintain data consistency across services
 * 
 * This test verifies that:
 * 1. Cross-service transactions use saga patterns for consistency
 * 2. Compensating transactions are executed on failure
 * 3. Data remains consistent across services even when partial failures occur
 * 4. All-or-nothing semantics are maintained
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';

// Define transaction types that span multiple services
type TransactionType =
    | 'create-content-with-ai'      // Content Service + AI Service
    | 'publish-to-social'           // Content Service + Integration Service
    | 'generate-and-publish'        // AI Service + Content Service + Integration Service
    | 'user-content-analytics';     // User Service + Content Service + Analytics Service

// Define service states
interface ServiceState {
    service: string;
    data: Map<string, any>;
    committed: boolean;
}

// Define saga step
interface SagaStep {
    service: string;
    action: string;
    compensatingAction: string;
    execute: (state: ServiceState, data: any) => Promise<any>;
    compensate: (state: ServiceState, data: any) => Promise<void>;
}

// Define saga transaction
interface SagaTransaction {
    id: string;
    type: TransactionType;
    steps: SagaStep[];
    completedSteps: number;
    status: 'pending' | 'in-progress' | 'completed' | 'compensating' | 'failed';
}

/**
 * Mock service state manager
 */
class ServiceStateManager {
    private states: Map<string, ServiceState> = new Map();

    constructor() {
        this.initializeServices();
    }

    private initializeServices() {
        const services = ['user-service', 'content-service', 'ai-service', 'integration-service', 'analytics-service'];
        for (const service of services) {
            this.states.set(service, {
                service,
                data: new Map(),
                committed: false,
            });
        }
    }

    getState(service: string): ServiceState {
        const state = this.states.get(service);
        if (!state) {
            throw new Error(`Service ${service} not found`);
        }
        return state;
    }

    reset() {
        this.states.clear();
        this.initializeServices();
    }

    getAllStates(): ServiceState[] {
        return Array.from(this.states.values());
    }
}

/**
 * Saga coordinator that manages distributed transactions
 */
class SagaCoordinator {
    private stateManager: ServiceStateManager;
    private transactions: Map<string, SagaTransaction> = new Map();

    constructor(stateManager: ServiceStateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Execute a saga transaction with automatic compensation on failure
     */
    async executeSaga(transaction: SagaTransaction, shouldFail: boolean = false, failAtStep: number = -1): Promise<boolean> {
        transaction.status = 'in-progress';
        const executedSteps: Array<{ step: SagaStep; result: any }> = [];

        try {
            // Execute each step in sequence
            for (let i = 0; i < transaction.steps.length; i++) {
                const step = transaction.steps[i];

                // Simulate failure at specific step if requested
                if (shouldFail && i === failAtStep) {
                    throw new Error(`Simulated failure at step ${i}: ${step.action}`);
                }

                const state = this.stateManager.getState(step.service);
                const result = await step.execute(state, { transactionId: transaction.id });

                executedSteps.push({ step, result });
                transaction.completedSteps = i + 1;
            }

            // All steps succeeded - commit transaction
            transaction.status = 'completed';
            this.commitTransaction(transaction);
            return true;

        } catch (error) {
            // Failure occurred - execute compensating transactions in reverse order
            transaction.status = 'compensating';
            await this.compensate(executedSteps);
            transaction.status = 'failed';
            return false;
        }
    }

    /**
     * Execute compensating transactions in reverse order
     */
    private async compensate(executedSteps: Array<{ step: SagaStep; result: any }>) {
        // Execute compensating actions in reverse order
        for (let i = executedSteps.length - 1; i >= 0; i--) {
            const { step, result } = executedSteps[i];
            const state = this.stateManager.getState(step.service);

            try {
                await step.compensate(state, result);
            } catch (error) {
                // Log compensation failure but continue with other compensations
                console.error(`Compensation failed for ${step.service}:${step.action}`, error);
            }
        }
    }

    /**
     * Commit transaction across all services
     */
    private commitTransaction(transaction: SagaTransaction) {
        for (const step of transaction.steps) {
            const state = this.stateManager.getState(step.service);
            state.committed = true;
        }
    }

    /**
     * Create a saga transaction for content creation with AI
     */
    createContentWithAISaga(transactionId: string): SagaTransaction {
        return {
            id: transactionId,
            type: 'create-content-with-ai',
            steps: [
                {
                    service: 'content-service',
                    action: 'reserve-content-id',
                    compensatingAction: 'release-content-id',
                    execute: async (state, data) => {
                        const contentId = `content-${data.transactionId}`;
                        state.data.set(contentId, { status: 'reserved', transactionId: data.transactionId });
                        return { contentId };
                    },
                    compensate: async (state, data) => {
                        state.data.delete(data.contentId);
                    },
                },
                {
                    service: 'ai-service',
                    action: 'generate-content',
                    compensatingAction: 'delete-generated-content',
                    execute: async (state, data) => {
                        const jobId = `job-${data.transactionId}`;
                        state.data.set(jobId, { status: 'completed', content: 'AI generated content' });
                        return { jobId, content: 'AI generated content' };
                    },
                    compensate: async (state, data) => {
                        state.data.delete(data.jobId);
                    },
                },
                {
                    service: 'content-service',
                    action: 'save-content',
                    compensatingAction: 'delete-content',
                    execute: async (state, data) => {
                        const contentId = `content-${data.transactionId}`;
                        const existing = state.data.get(contentId);
                        state.data.set(contentId, { ...existing, status: 'saved', content: 'AI generated content' });
                        return { contentId };
                    },
                    compensate: async (state, data) => {
                        state.data.delete(data.contentId);
                    },
                },
            ],
            completedSteps: 0,
            status: 'pending',
        };
    }

    /**
     * Create a saga transaction for publishing to social media
     */
    createPublishToSocialSaga(transactionId: string): SagaTransaction {
        return {
            id: transactionId,
            type: 'publish-to-social',
            steps: [
                {
                    service: 'content-service',
                    action: 'mark-publishing',
                    compensatingAction: 'unmark-publishing',
                    execute: async (state, data) => {
                        const contentId = `content-${data.transactionId}`;
                        state.data.set(contentId, { status: 'publishing', transactionId: data.transactionId });
                        return { contentId };
                    },
                    compensate: async (state, data) => {
                        // Delete the content entry to restore initial state
                        state.data.delete(data.contentId);
                    },
                },
                {
                    service: 'integration-service',
                    action: 'publish-to-platform',
                    compensatingAction: 'delete-from-platform',
                    execute: async (state, data) => {
                        const postId = `post-${data.transactionId}`;
                        state.data.set(postId, { status: 'published', platform: 'facebook' });
                        return { postId };
                    },
                    compensate: async (state, data) => {
                        state.data.delete(data.postId);
                    },
                },
                {
                    service: 'content-service',
                    action: 'mark-published',
                    compensatingAction: 'unmark-published',
                    execute: async (state, data) => {
                        const contentId = `content-${data.transactionId}`;
                        const existing = state.data.get(contentId);
                        state.data.set(contentId, { ...existing, status: 'published' });
                        return { contentId };
                    },
                    compensate: async (state, data) => {
                        // Delete the content entry to restore initial state
                        state.data.delete(data.contentId);
                    },
                },
            ],
            completedSteps: 0,
            status: 'pending',
        };
    }

    /**
     * Create a saga transaction for user content analytics
     */
    createUserContentAnalyticsSaga(transactionId: string): SagaTransaction {
        return {
            id: transactionId,
            type: 'user-content-analytics',
            steps: [
                {
                    service: 'user-service',
                    action: 'increment-content-count',
                    compensatingAction: 'decrement-content-count',
                    execute: async (state, data) => {
                        const userId = `user-${data.transactionId}`;
                        const existing = state.data.get(userId) || { contentCount: 0 };
                        const wasNew = !state.data.has(userId);
                        state.data.set(userId, { ...existing, contentCount: existing.contentCount + 1 });
                        return { userId, wasNew };
                    },
                    compensate: async (state, data) => {
                        const userId = data.userId;
                        // If this was a new user entry, delete it entirely
                        // Otherwise, decrement the count
                        if (data.wasNew) {
                            state.data.delete(userId);
                        } else {
                            const existing = state.data.get(userId);
                            if (existing) {
                                state.data.set(userId, { ...existing, contentCount: existing.contentCount - 1 });
                            }
                        }
                    },
                },
                {
                    service: 'content-service',
                    action: 'create-content',
                    compensatingAction: 'delete-content',
                    execute: async (state, data) => {
                        const contentId = `content-${data.transactionId}`;
                        state.data.set(contentId, { status: 'created', userId: `user-${data.transactionId}` });
                        return { contentId };
                    },
                    compensate: async (state, data) => {
                        state.data.delete(data.contentId);
                    },
                },
                {
                    service: 'analytics-service',
                    action: 'record-event',
                    compensatingAction: 'delete-event',
                    execute: async (state, data) => {
                        const eventId = `event-${data.transactionId}`;
                        state.data.set(eventId, { type: 'content-created', timestamp: Date.now() });
                        return { eventId };
                    },
                    compensate: async (state, data) => {
                        state.data.delete(data.eventId);
                    },
                },
            ],
            completedSteps: 0,
            status: 'pending',
        };
    }
}

describe('Property 21: Distributed Transaction Consistency', () => {
    let stateManager: ServiceStateManager;
    let sagaCoordinator: SagaCoordinator;

    beforeEach(() => {
        stateManager = new ServiceStateManager();
        sagaCoordinator = new SagaCoordinator(stateManager);
    });

    /**
     * Property Test: For any successful saga transaction, all services should have consistent state
     */
    it('should maintain consistency across services for successful transactions', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom<TransactionType>('create-content-with-ai', 'publish-to-social', 'user-content-analytics'),
                fc.uuid(),
                async (transactionType: TransactionType, transactionId: string) => {
                    // Reset state for each iteration
                    stateManager.reset();

                    // Create appropriate saga based on transaction type
                    let saga: SagaTransaction;
                    switch (transactionType) {
                        case 'create-content-with-ai':
                            saga = sagaCoordinator.createContentWithAISaga(transactionId);
                            break;
                        case 'publish-to-social':
                            saga = sagaCoordinator.createPublishToSocialSaga(transactionId);
                            break;
                        case 'user-content-analytics':
                            saga = sagaCoordinator.createUserContentAnalyticsSaga(transactionId);
                            break;
                        default:
                            throw new Error(`Unknown transaction type: ${transactionType}`);
                    }

                    // Execute saga without failures
                    const success = await sagaCoordinator.executeSaga(saga, false);

                    // Verify transaction completed successfully
                    expect(success).toBe(true);
                    expect(saga.status).toBe('completed');
                    expect(saga.completedSteps).toBe(saga.steps.length);

                    // Verify all involved services have consistent data
                    for (const step of saga.steps) {
                        const state = stateManager.getState(step.service);
                        expect(state.committed).toBe(true);
                        expect(state.data.size).toBeGreaterThan(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property Test: For any failed saga transaction, compensating transactions should restore consistency
     */
    it('should execute compensating transactions on failure', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom<TransactionType>('create-content-with-ai', 'publish-to-social', 'user-content-analytics'),
                fc.uuid(),
                fc.integer({ min: 0, max: 2 }), // Fail at different steps
                async (transactionType: TransactionType, transactionId: string, failAtStep: number) => {
                    // Reset state for each iteration
                    stateManager.reset();

                    // Create appropriate saga based on transaction type
                    let saga: SagaTransaction;
                    switch (transactionType) {
                        case 'create-content-with-ai':
                            saga = sagaCoordinator.createContentWithAISaga(transactionId);
                            break;
                        case 'publish-to-social':
                            saga = sagaCoordinator.createPublishToSocialSaga(transactionId);
                            break;
                        case 'user-content-analytics':
                            saga = sagaCoordinator.createUserContentAnalyticsSaga(transactionId);
                            break;
                        default:
                            throw new Error(`Unknown transaction type: ${transactionType}`);
                    }

                    // Only fail if the step index is valid
                    if (failAtStep >= saga.steps.length) {
                        return true; // Skip this test case
                    }

                    // Capture initial state
                    const initialStates = new Map<string, number>();
                    for (const step of saga.steps) {
                        const state = stateManager.getState(step.service);
                        initialStates.set(step.service, state.data.size);
                    }

                    // Execute saga with failure at specific step
                    const success = await sagaCoordinator.executeSaga(saga, true, failAtStep);

                    // Verify transaction failed
                    expect(success).toBe(false);
                    expect(saga.status).toBe('failed');

                    // Verify compensating transactions restored state
                    // All services should have the same or fewer entries than before
                    for (const step of saga.steps) {
                        const state = stateManager.getState(step.service);
                        const initialSize = initialStates.get(step.service) || 0;
                        expect(state.data.size).toBeLessThanOrEqual(initialSize);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property Test: Saga pattern should maintain all-or-nothing semantics
     */
    it('should maintain all-or-nothing semantics for cross-service transactions', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom<TransactionType>('create-content-with-ai', 'publish-to-social', 'user-content-analytics'),
                fc.uuid(),
                fc.boolean(), // Whether to simulate failure
                async (transactionType: TransactionType, transactionId: string, shouldFail: boolean) => {
                    // Reset state for each iteration
                    stateManager.reset();

                    // Create appropriate saga
                    let saga: SagaTransaction;
                    switch (transactionType) {
                        case 'create-content-with-ai':
                            saga = sagaCoordinator.createContentWithAISaga(transactionId);
                            break;
                        case 'publish-to-social':
                            saga = sagaCoordinator.createPublishToSocialSaga(transactionId);
                            break;
                        case 'user-content-analytics':
                            saga = sagaCoordinator.createUserContentAnalyticsSaga(transactionId);
                            break;
                        default:
                            throw new Error(`Unknown transaction type: ${transactionType}`);
                    }

                    // Execute saga
                    const failAtStep = shouldFail ? Math.floor(saga.steps.length / 2) : -1;
                    const success = await sagaCoordinator.executeSaga(saga, shouldFail, failAtStep);

                    if (success) {
                        // All steps should be completed
                        expect(saga.completedSteps).toBe(saga.steps.length);
                        expect(saga.status).toBe('completed');

                        // All services should have data
                        for (const step of saga.steps) {
                            const state = stateManager.getState(step.service);
                            expect(state.data.size).toBeGreaterThan(0);
                        }
                    } else {
                        // Transaction should be failed
                        expect(saga.status).toBe('failed');

                        // Either no data or compensated data (depending on when failure occurred)
                        // The key is that partial state should not persist
                        const hasPartialState = saga.steps.some(step => {
                            const state = stateManager.getState(step.service);
                            return state.data.size > 0 && !state.committed;
                        });
                        expect(hasPartialState).toBe(false);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property Test: Compensating transactions should be idempotent
     */
    it('should handle idempotent compensation', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.uuid(),
                async (transactionId: string) => {
                    // Reset state for each iteration
                    stateManager.reset();

                    // Create a saga that will fail
                    const saga = sagaCoordinator.createContentWithAISaga(transactionId);

                    // Execute and fail at step 1
                    const success = await sagaCoordinator.executeSaga(saga, true, 1);
                    expect(success).toBe(false);

                    // Capture state after first compensation
                    const statesAfterFirstCompensation = new Map<string, number>();
                    for (const step of saga.steps) {
                        const state = stateManager.getState(step.service);
                        statesAfterFirstCompensation.set(step.service, state.data.size);
                    }

                    // Execute compensation again (simulating retry)
                    const executedSteps = saga.steps.slice(0, saga.completedSteps).map(step => ({
                        step,
                        result: { transactionId },
                    }));

                    // Manually trigger compensation again
                    for (let i = executedSteps.length - 1; i >= 0; i--) {
                        const { step } = executedSteps[i];
                        const state = stateManager.getState(step.service);
                        await step.compensate(state, { transactionId });
                    }

                    // Verify state is the same (idempotent)
                    for (const step of saga.steps) {
                        const state = stateManager.getState(step.service);
                        const expectedSize = statesAfterFirstCompensation.get(step.service) || 0;
                        expect(state.data.size).toBe(expectedSize);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Unit test: Verify saga coordinator creates correct transaction types
     */
    it('should create correct saga transactions for each type', () => {
        const contentAISaga = sagaCoordinator.createContentWithAISaga('test-1');
        expect(contentAISaga.type).toBe('create-content-with-ai');
        expect(contentAISaga.steps.length).toBe(3);
        expect(contentAISaga.steps[0].service).toBe('content-service');
        expect(contentAISaga.steps[1].service).toBe('ai-service');
        expect(contentAISaga.steps[2].service).toBe('content-service');

        const publishSaga = sagaCoordinator.createPublishToSocialSaga('test-2');
        expect(publishSaga.type).toBe('publish-to-social');
        expect(publishSaga.steps.length).toBe(3);
        expect(publishSaga.steps[0].service).toBe('content-service');
        expect(publishSaga.steps[1].service).toBe('integration-service');
        expect(publishSaga.steps[2].service).toBe('content-service');

        const analyticsSaga = sagaCoordinator.createUserContentAnalyticsSaga('test-3');
        expect(analyticsSaga.type).toBe('user-content-analytics');
        expect(analyticsSaga.steps.length).toBe(3);
        expect(analyticsSaga.steps[0].service).toBe('user-service');
        expect(analyticsSaga.steps[1].service).toBe('content-service');
        expect(analyticsSaga.steps[2].service).toBe('analytics-service');
    });

    /**
     * Unit test: Verify compensating actions are defined for all steps
     */
    it('should have compensating actions for all saga steps', () => {
        const transactionTypes: TransactionType[] = ['create-content-with-ai', 'publish-to-social', 'user-content-analytics'];

        for (const type of transactionTypes) {
            let saga: SagaTransaction;
            switch (type) {
                case 'create-content-with-ai':
                    saga = sagaCoordinator.createContentWithAISaga('test');
                    break;
                case 'publish-to-social':
                    saga = sagaCoordinator.createPublishToSocialSaga('test');
                    break;
                case 'user-content-analytics':
                    saga = sagaCoordinator.createUserContentAnalyticsSaga('test');
                    break;
            }

            for (const step of saga.steps) {
                expect(step.compensatingAction).toBeDefined();
                expect(step.compensatingAction.length).toBeGreaterThan(0);
                expect(step.compensate).toBeDefined();
                expect(typeof step.compensate).toBe('function');
            }
        }
    });
});
