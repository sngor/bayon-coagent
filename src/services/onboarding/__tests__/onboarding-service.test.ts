/**
 * Onboarding Service Tests
 * 
 * Tests for onboarding service business logic, error handling, and retry behavior.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OnboardingService, OnboardingError } from '../onboarding-service';
import type { OnboardingState, OnboardingFlowType } from '@/types/onboarding';

describe('OnboardingService', () => {
    let service: OnboardingService;
    let mockGet: jest.Mock;
    let mockPut: jest.Mock;
    let mockDelete: jest.Mock;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Create mock functions
        mockGet = jest.fn();
        mockPut = jest.fn();
        mockDelete = jest.fn();

        // Create a new service instance
        service = new OnboardingService();

        // Replace the repository methods with mocks
        (service as any).repository = {
            get: mockGet,
            put: mockPut,
            delete: mockDelete,
        };
    });

    describe('getOnboardingState', () => {
        it('should return onboarding state when it exists', async () => {
            const userId = 'user-123';
            const mockState: OnboardingState = {
                userId,
                flowType: 'user',
                currentStep: 1,
                completedSteps: ['welcome'],
                skippedSteps: [],
                isComplete: false,
                startedAt: '2024-01-01T00:00:00.000Z',
                lastAccessedAt: '2024-01-01T00:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(mockState);

            const result = await service.getOnboardingState(userId);

            expect(result).toEqual(mockState);
            expect(mockGet).toHaveBeenCalledWith(
                `USER#${userId}`,
                'ONBOARDING#STATE'
            );
        });

        it('should return null when state does not exist', async () => {
            const userId = 'user-123';
            mockGet.mockResolvedValue(null);

            const result = await service.getOnboardingState(userId);

            expect(result).toBeNull();
        });

        it('should throw OnboardingError for invalid user ID', async () => {
            await expect(service.getOnboardingState('')).rejects.toThrow(OnboardingError);
            await expect(service.getOnboardingState('   ')).rejects.toThrow(OnboardingError);
        });

        it('should wrap DynamoDB errors in OnboardingError', async () => {
            const userId = 'user-123';
            mockGet.mockRejectedValue(new Error('DynamoDB error'));

            await expect(service.getOnboardingState(userId)).rejects.toThrow(OnboardingError);
        });
    });

    describe('initializeOnboarding', () => {
        it('should create new onboarding state', async () => {
            const userId = 'user-123';
            const flowType: OnboardingFlowType = 'user';

            mockGet.mockResolvedValue(null); // No existing state
            mockPut.mockResolvedValue(undefined);

            const result = await service.initializeOnboarding(userId, flowType);

            expect(result.userId).toBe(userId);
            expect(result.flowType).toBe(flowType);
            expect(result.currentStep).toBe(0);
            expect(result.completedSteps).toEqual([]);
            expect(result.skippedSteps).toEqual([]);
            expect(result.isComplete).toBe(false);
            expect(result.startedAt).toBeDefined();
            expect(result.lastAccessedAt).toBeDefined();
            expect(mockPut).toHaveBeenCalled();
        });

        it('should return existing state if already initialized', async () => {
            const userId = 'user-123';
            const flowType: OnboardingFlowType = 'user';
            const existingState: OnboardingState = {
                userId,
                flowType,
                currentStep: 2,
                completedSteps: ['welcome', 'profile'],
                skippedSteps: [],
                isComplete: false,
                startedAt: '2024-01-01T00:00:00.000Z',
                lastAccessedAt: '2024-01-01T00:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);

            const result = await service.initializeOnboarding(userId, flowType);

            expect(result).toEqual(existingState);
            expect(mockPut).not.toHaveBeenCalled();
        });

        it('should throw OnboardingError for invalid user ID', async () => {
            await expect(service.initializeOnboarding('', 'user')).rejects.toThrow(OnboardingError);
        });

        it('should throw OnboardingError for invalid flow type', async () => {
            mockGet.mockResolvedValue(null);
            await expect(
                service.initializeOnboarding('user-123', 'invalid' as OnboardingFlowType)
            ).rejects.toThrow(OnboardingError);
        });
    });

    describe('completeStep', () => {
        it('should mark step as completed', async () => {
            const userId = 'user-123';
            const stepId = 'profile';
            const existingState: OnboardingState = {
                userId,
                flowType: 'user',
                currentStep: 1,
                completedSteps: ['welcome'],
                skippedSteps: [],
                isComplete: false,
                startedAt: '2024-01-01T00:00:00.000Z',
                lastAccessedAt: '2024-01-01T00:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);
            mockPut.mockResolvedValue(undefined);

            const result = await service.completeStep(userId, stepId);

            expect(result.completedSteps).toContain(stepId);
            expect(result.completedSteps).toContain('welcome');
            expect(mockPut).toHaveBeenCalled();
        });

        it('should remove step from skipped if it was skipped', async () => {
            const userId = 'user-123';
            const stepId = 'tour';
            const existingState: OnboardingState = {
                userId,
                flowType: 'user',
                currentStep: 2,
                completedSteps: ['welcome', 'profile'],
                skippedSteps: ['tour'],
                isComplete: false,
                startedAt: '2024-01-01T00:00:00.000Z',
                lastAccessedAt: '2024-01-01T00:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);
            mockPut.mockResolvedValue(undefined);

            const result = await service.completeStep(userId, stepId);

            expect(result.completedSteps).toContain(stepId);
            expect(result.skippedSteps).not.toContain(stepId);
        });

        it('should mark onboarding as complete when all required steps done', async () => {
            const userId = 'user-123';
            const stepId = 'complete';
            const existingState: OnboardingState = {
                userId,
                flowType: 'user',
                currentStep: 3,
                completedSteps: ['welcome', 'profile', 'tour', 'selection'],
                skippedSteps: [],
                isComplete: false,
                startedAt: '2024-01-01T00:00:00.000Z',
                lastAccessedAt: '2024-01-01T00:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);
            mockPut.mockResolvedValue(undefined);

            const result = await service.completeStep(userId, stepId);

            expect(result.isComplete).toBe(true);
            expect(result.completedAt).toBeDefined();
        });

        it('should throw OnboardingError when state not found', async () => {
            mockGet.mockResolvedValue(null);

            await expect(service.completeStep('user-123', 'profile')).rejects.toThrow(
                OnboardingError
            );
        });

        it('should throw OnboardingError for invalid step ID', async () => {
            const existingState: OnboardingState = {
                userId: 'user-123',
                flowType: 'user',
                currentStep: 1,
                completedSteps: ['welcome'],
                skippedSteps: [],
                isComplete: false,
                startedAt: '2024-01-01T00:00:00.000Z',
                lastAccessedAt: '2024-01-01T00:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);

            await expect(service.completeStep('user-123', '')).rejects.toThrow(OnboardingError);
        });

        it('should throw OnboardingError for step not in flow', async () => {
            const existingState: OnboardingState = {
                userId: 'user-123',
                flowType: 'user',
                currentStep: 1,
                completedSteps: ['welcome'],
                skippedSteps: [],
                isComplete: false,
                startedAt: '2024-01-01T00:00:00.000Z',
                lastAccessedAt: '2024-01-01T00:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);

            await expect(service.completeStep('user-123', 'admin-welcome')).rejects.toThrow(
                OnboardingError
            );
        });
    });

    describe('skipStep', () => {
        it('should mark step as skipped', async () => {
            const userId = 'user-123';
            const stepId = 'tour';
            const existingState: OnboardingState = {
                userId,
                flowType: 'user',
                currentStep: 2,
                completedSteps: ['welcome', 'profile'],
                skippedSteps: [],
                isComplete: false,
                startedAt: '2024-01-01T00:00:00.000Z',
                lastAccessedAt: '2024-01-01T00:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);
            mockPut.mockResolvedValue(undefined);

            const result = await service.skipStep(userId, stepId);

            expect(result.skippedSteps).toContain(stepId);
            expect(mockPut).toHaveBeenCalled();
        });

        it('should remove step from completed if it was completed', async () => {
            const userId = 'user-123';
            const stepId = 'profile';
            const existingState: OnboardingState = {
                userId,
                flowType: 'user',
                currentStep: 2,
                completedSteps: ['welcome', 'profile'],
                skippedSteps: [],
                isComplete: false,
                startedAt: '2024-01-01T00:00:00.000Z',
                lastAccessedAt: '2024-01-01T00:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);
            mockPut.mockResolvedValue(undefined);

            const result = await service.skipStep(userId, stepId);

            expect(result.skippedSteps).toContain(stepId);
            expect(result.completedSteps).not.toContain(stepId);
        });

        it('should throw OnboardingError when state not found', async () => {
            mockGet.mockResolvedValue(null);

            await expect(service.skipStep('user-123', 'tour')).rejects.toThrow(OnboardingError);
        });
    });

    describe('completeOnboarding', () => {
        it('should mark onboarding as complete', async () => {
            const userId = 'user-123';
            const existingState: OnboardingState = {
                userId,
                flowType: 'user',
                currentStep: 4,
                completedSteps: ['welcome', 'profile', 'tour', 'selection', 'complete'],
                skippedSteps: [],
                isComplete: false,
                startedAt: '2024-01-01T00:00:00.000Z',
                lastAccessedAt: '2024-01-01T00:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);
            mockPut.mockResolvedValue(undefined);

            const result = await service.completeOnboarding(userId);

            expect(result.isComplete).toBe(true);
            expect(result.completedAt).toBeDefined();
            expect(mockPut).toHaveBeenCalled();
        });

        it('should return existing state if already complete', async () => {
            const userId = 'user-123';
            const existingState: OnboardingState = {
                userId,
                flowType: 'user',
                currentStep: 4,
                completedSteps: ['welcome', 'profile', 'tour', 'selection', 'complete'],
                skippedSteps: [],
                isComplete: true,
                startedAt: '2024-01-01T00:00:00.000Z',
                completedAt: '2024-01-01T01:00:00.000Z',
                lastAccessedAt: '2024-01-01T01:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);

            const result = await service.completeOnboarding(userId);

            expect(result).toEqual(existingState);
            expect(mockPut).not.toHaveBeenCalled();
        });

        it('should throw OnboardingError when state not found', async () => {
            mockGet.mockResolvedValue(null);

            await expect(service.completeOnboarding('user-123')).rejects.toThrow(OnboardingError);
        });
    });

    describe('needsOnboarding', () => {
        it('should return true when no state exists', async () => {
            mockGet.mockResolvedValue(null);

            const result = await service.needsOnboarding('user-123');

            expect(result).toBe(true);
        });

        it('should return false when onboarding is complete', async () => {
            const existingState: OnboardingState = {
                userId: 'user-123',
                flowType: 'user',
                currentStep: 4,
                completedSteps: ['welcome', 'profile', 'tour', 'selection', 'complete'],
                skippedSteps: [],
                isComplete: true,
                startedAt: '2024-01-01T00:00:00.000Z',
                completedAt: '2024-01-01T01:00:00.000Z',
                lastAccessedAt: '2024-01-01T01:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);

            const result = await service.needsOnboarding('user-123');

            expect(result).toBe(false);
        });

        it('should return true when required steps are incomplete', async () => {
            const existingState: OnboardingState = {
                userId: 'user-123',
                flowType: 'user',
                currentStep: 2,
                completedSteps: ['welcome', 'tour'],
                skippedSteps: [],
                isComplete: false,
                startedAt: '2024-01-01T00:00:00.000Z',
                lastAccessedAt: '2024-01-01T00:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);

            const result = await service.needsOnboarding('user-123');

            expect(result).toBe(true);
        });

        it('should return false on error to avoid blocking access', async () => {
            mockGet.mockRejectedValue(new Error('Network error'));

            const result = await service.needsOnboarding('user-123');

            expect(result).toBe(false);
        });
    });

    describe('getNextStep', () => {
        it('should return first incomplete step', async () => {
            const existingState: OnboardingState = {
                userId: 'user-123',
                flowType: 'user',
                currentStep: 2,
                completedSteps: ['welcome', 'profile'],
                skippedSteps: [],
                isComplete: false,
                startedAt: '2024-01-01T00:00:00.000Z',
                lastAccessedAt: '2024-01-01T00:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);

            const result = await service.getNextStep('user-123');

            expect(result).toBeDefined();
            expect(result?.id).toBe('tour');
        });

        it('should skip completed and skipped steps', async () => {
            const existingState: OnboardingState = {
                userId: 'user-123',
                flowType: 'user',
                currentStep: 2,
                completedSteps: ['welcome', 'profile'],
                skippedSteps: ['tour'],
                isComplete: false,
                startedAt: '2024-01-01T00:00:00.000Z',
                lastAccessedAt: '2024-01-01T00:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);

            const result = await service.getNextStep('user-123');

            expect(result).toBeDefined();
            expect(result?.id).toBe('selection');
        });

        it('should return null when all steps completed', async () => {
            const existingState: OnboardingState = {
                userId: 'user-123',
                flowType: 'user',
                currentStep: 4,
                completedSteps: ['welcome', 'profile', 'tour', 'selection', 'complete'],
                skippedSteps: [],
                isComplete: true,
                startedAt: '2024-01-01T00:00:00.000Z',
                completedAt: '2024-01-01T01:00:00.000Z',
                lastAccessedAt: '2024-01-01T01:00:00.000Z',
                metadata: {},
            };

            mockGet.mockResolvedValue(existingState);

            const result = await service.getNextStep('user-123');

            expect(result).toBeNull();
        });

        it('should return null when state not found', async () => {
            mockGet.mockResolvedValue(null);

            const result = await service.getNextStep('user-123');

            expect(result).toBeNull();
        });

        it('should return null on error to avoid blocking flow', async () => {
            mockGet.mockRejectedValue(new Error('Network error'));

            const result = await service.getNextStep('user-123');

            expect(result).toBeNull();
        });
    });

    describe('updateMetadata', () => {
        it('should update metadata', async () => {
            const userId = 'user-123';
            const existingState: OnboardingState = {
                userId,
                flowType: 'user',
                currentStep: 2,
                completedSteps: ['welcome', 'profile'],
                skippedSteps: [],
                isComplete: false,
                startedAt: '2024-01-01T00:00:00.000Z',
                lastAccessedAt: '2024-01-01T00:00:00.000Z',
                metadata: { profileCompletion: 50 },
            };

            mockGet.mockResolvedValue(existingState);
            mockPut.mockResolvedValue(undefined);

            const result = await service.updateMetadata(userId, { selectedHub: 'studio' });

            expect(result.metadata?.selectedHub).toBe('studio');
            expect(result.metadata?.profileCompletion).toBe(50);
            expect(mockPut).toHaveBeenCalled();
        });
    });

    describe('resetOnboarding', () => {
        it('should delete onboarding state', async () => {
            const userId = 'user-123';
            mockDelete.mockResolvedValue(undefined);

            await service.resetOnboarding(userId);

            expect(mockDelete).toHaveBeenCalledWith(
                `USER#${userId}`,
                'ONBOARDING#STATE'
            );
        });

        it('should throw OnboardingError for invalid user ID', async () => {
            await expect(service.resetOnboarding('')).rejects.toThrow(OnboardingError);
        });
    });
});
