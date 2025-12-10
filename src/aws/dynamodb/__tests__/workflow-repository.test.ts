/**
 * Unit tests for WorkflowInstanceRepository
 * 
 * These tests verify the repository structure and method signatures.
 */

import { describe, it, expect } from '@jest/globals';
import { WorkflowInstanceRepository, getWorkflowRepository } from '../workflow-repository';
import { WorkflowStatus } from '@/types/workflows';

describe('WorkflowInstanceRepository', () => {
    describe('Repository Structure', () => {
        it('should create a repository instance', () => {
            const repository = new WorkflowInstanceRepository();
            expect(repository).toBeDefined();
            expect(repository).toBeInstanceOf(WorkflowInstanceRepository);
        });

        it('should have all required methods', () => {
            const repository = new WorkflowInstanceRepository();

            expect(typeof repository.createWorkflowInstance).toBe('function');
            expect(typeof repository.getWorkflowInstance).toBe('function');
            expect(typeof repository.getUserWorkflowInstances).toBe('function');
            expect(typeof repository.updateWorkflowInstance).toBe('function');
            expect(typeof repository.deleteWorkflowInstance).toBe('function');
            expect(typeof repository.completeStep).toBe('function');
            expect(typeof repository.skipStep).toBe('function');
            expect(typeof repository.completeWorkflow).toBe('function');
            expect(typeof repository.archiveWorkflow).toBe('function');
            expect(typeof repository.markStaleWorkflows).toBe('function');
        });

        it('should return singleton instance from getWorkflowRepository', () => {
            const repo1 = getWorkflowRepository();
            const repo2 = getWorkflowRepository();

            expect(repo1).toBe(repo2);
            expect(repo1).toBeInstanceOf(WorkflowInstanceRepository);
        });
    });

    describe('Method Signatures', () => {
        it('createWorkflowInstance should accept correct parameters', () => {
            const repository = new WorkflowInstanceRepository();
            const method = repository.createWorkflowInstance;

            expect(method.length).toBe(3); // userId, presetId, initialStepId
        });

        it('getWorkflowInstance should accept correct parameters', () => {
            const repository = new WorkflowInstanceRepository();
            const method = repository.getWorkflowInstance;

            expect(method.length).toBe(2); // userId, instanceId
        });

        it('getUserWorkflowInstances should accept correct parameters', () => {
            const repository = new WorkflowInstanceRepository();
            const method = repository.getUserWorkflowInstances;

            expect(method.length).toBe(2); // userId, filter (optional)
        });

        it('updateWorkflowInstance should accept correct parameters', () => {
            const repository = new WorkflowInstanceRepository();
            const method = repository.updateWorkflowInstance;

            expect(method.length).toBe(3); // userId, instanceId, updates
        });

        it('deleteWorkflowInstance should accept correct parameters', () => {
            const repository = new WorkflowInstanceRepository();
            const method = repository.deleteWorkflowInstance;

            expect(method.length).toBe(2); // userId, instanceId
        });

        it('completeStep should accept correct parameters', () => {
            const repository = new WorkflowInstanceRepository();
            const method = repository.completeStep;

            expect(method.length).toBe(4); // userId, instanceId, stepId, contextData (optional)
        });

        it('skipStep should accept correct parameters', () => {
            const repository = new WorkflowInstanceRepository();
            const method = repository.skipStep;

            expect(method.length).toBe(3); // userId, instanceId, stepId
        });

        it('completeWorkflow should accept correct parameters', () => {
            const repository = new WorkflowInstanceRepository();
            const method = repository.completeWorkflow;

            expect(method.length).toBe(3); // userId, instanceId, actualMinutes (optional)
        });

        it('archiveWorkflow should accept correct parameters', () => {
            const repository = new WorkflowInstanceRepository();
            const method = repository.archiveWorkflow;

            expect(method.length).toBe(2); // userId, instanceId
        });

        it('markStaleWorkflows should accept correct parameters', () => {
            const repository = new WorkflowInstanceRepository();
            const method = repository.markStaleWorkflows;

            expect(method.length).toBe(1); // userId
        });
    });

    describe('WorkflowStatus Enum', () => {
        it('should have all required status values', () => {
            expect(WorkflowStatus.ACTIVE).toBe('active');
            expect(WorkflowStatus.COMPLETED).toBe('completed');
            expect(WorkflowStatus.STALE).toBe('stale');
            expect(WorkflowStatus.ARCHIVED).toBe('archived');
        });
    });
});
