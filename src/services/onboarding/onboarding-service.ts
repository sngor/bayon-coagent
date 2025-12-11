/**
 * Onboarding Service
 * 
 * Provides business logic for managing user onboarding state and progress.
 * Handles CRUD operations for onboarding state in DynamoDB.
 * 
 * Features:
 * - Automatic retry logic for network failures (3 retries with exponential backoff)
 * - Comprehensive error handling with user-friendly messages
 * - State validation and consistency checks
 * - Support for user, admin, and dual-role flows
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { getOnboardingStateKeys } from '@/aws/dynamodb';
import type { DynamoDBItem } from '@/aws/dynamodb/types';
import type {
    OnboardingState,
    OnboardingFlowType,
    OnboardingStep,
} from '@/types/onboarding';
import {
    getStepsForFlow,
    getNextStep as getNextStepHelper,
    isOnboardingComplete as checkOnboardingComplete,
} from '@/types/onboarding';
import { DynamoDBError } from '@/aws/dynamodb/errors';
import { logError, recoverFromStateError } from './onboarding-error-handler';

/**
 * Custom error for onboarding operations
 */
export class OnboardingError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly retryable: boolean = false,
        public readonly originalError?: Error
    ) {
        super(message);
        this.name = 'OnboardingError';
    }
}

/**
 * Onboarding Service class
 * Manages onboarding state persistence and business logic
 */
export class OnboardingService {
    private repository: DynamoDBRepository;

    constructor() {
        // Configure repository with retry options for network resilience
        this.repository = new DynamoDBRepository({
            maxRetries: 3,
            initialDelayMs: 100,
            maxDelayMs: 5000,
            backoffMultiplier: 2,
            jitter: true,
        });
    }

    /**
     * Gets the current onboarding state for a user
     * @param userId User ID
     * @returns Onboarding state or null if not found
     * @throws OnboardingError if the operation fails after retries
     */
    async getOnboardingState(userId: string): Promise<OnboardingState | null> {
        try {
            this.validateUserId(userId);
            const keys = getOnboardingStateKeys(userId);
            const state = await this.repository.get<OnboardingState>(keys.PK, keys.SK);

            // Validate state structure if it exists
            if (state) {
                const validationResult = this.validateStateStructure(state);
                if (!validationResult.valid) {
                    console.warn('[ONBOARDING_SERVICE] Invalid state structure detected:', validationResult.errors);
                    // Attempt to recover
                    const recovery = await recoverFromStateError(userId, state);
                    if (!recovery.recovered) {
                        throw new OnboardingError(
                            'Corrupted onboarding state detected',
                            'STATE_CORRUPTED',
                            false
                        );
                    }
                }
            }

            return state;
        } catch (error) {
            // Enhanced error logging for debugging
            console.error('[ONBOARDING_SERVICE] getOnboardingState error details:', {
                error,
                errorMessage: error?.message,
                errorStack: error?.stack,
                errorName: error?.name,
                userId,
                keys: getOnboardingStateKeys(userId)
            });

            logError(error, { userId, operation: 'getOnboardingState' });
            throw this.handleError(error, 'Failed to retrieve onboarding state');
        }
    }

    /**
     * Initializes onboarding for a new user
     * @param userId User ID
     * @param flowType Type of onboarding flow
     * @returns Created onboarding state
     * @throws OnboardingError if the operation fails after retries
     */
    async initializeOnboarding(
        userId: string,
        flowType: OnboardingFlowType
    ): Promise<OnboardingState> {
        try {
            this.validateUserId(userId);
            this.validateFlowType(flowType);

            // Check if onboarding already exists
            const existingState = await this.getOnboardingState(userId);
            if (existingState) {
                console.warn('[ONBOARDING_SERVICE] Onboarding already exists for user:', userId);
                return existingState;
            }

            const now = new Date().toISOString();
            const state: OnboardingState = {
                userId,
                flowType,
                currentStep: 0,
                completedSteps: [],
                skippedSteps: [],
                isComplete: false,
                startedAt: now,
                lastAccessedAt: now,
                metadata: {},
            };

            const keys = getOnboardingStateKeys(userId, false, now);
            const item: DynamoDBItem<OnboardingState> = {
                PK: keys.PK,
                SK: keys.SK,
                EntityType: 'OnboardingState',
                Data: state,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
                GSI1PK: keys.GSI1PK,
                GSI1SK: keys.GSI1SK,
            };

            await this.repository.put(item);
            console.log('[ONBOARDING_SERVICE] Initialized onboarding for user:', userId, 'flowType:', flowType);
            return state;
        } catch (error) {
            console.error('[ONBOARDING_SERVICE] Error initializing onboarding:', error);
            throw this.handleError(error, 'Failed to initialize onboarding');
        }
    }

    /**
     * Marks a step as completed
     * @param userId User ID
     * @param stepId Step ID to complete
     * @returns Updated onboarding state
     * @throws OnboardingError if the operation fails after retries
     */
    async completeStep(userId: string, stepId: string): Promise<OnboardingState> {
        try {
            this.validateUserId(userId);
            this.validateStepId(stepId);

            const state = await this.getOnboardingState(userId);
            if (!state) {
                throw new OnboardingError(
                    'Onboarding state not found. Please initialize onboarding first.',
                    'STATE_NOT_FOUND',
                    false
                );
            }

            // Validate step belongs to the user's flow
            const steps = getStepsForFlow(state.flowType);
            const stepExists = steps.some((s) => s.id === stepId);
            if (!stepExists) {
                throw new OnboardingError(
                    `Step '${stepId}' is not valid for flow type '${state.flowType}'`,
                    'INVALID_STEP',
                    false
                );
            }

            // Add to completed steps if not already there
            if (!state.completedSteps.includes(stepId)) {
                state.completedSteps.push(stepId);
            }

            // Remove from skipped steps if it was there
            state.skippedSteps = state.skippedSteps.filter((id) => id !== stepId);

            // Update current step
            const completedStepIndex = steps.findIndex((s) => s.id === stepId);
            if (completedStepIndex !== -1 && completedStepIndex >= state.currentStep) {
                state.currentStep = completedStepIndex + 1;
            }

            // For dual role users, track individual flow completion
            if (state.flowType === 'both') {
                state.metadata = state.metadata || {};

                // Check if admin flow is complete
                const adminSteps = getStepsForFlow('admin');
                const adminComplete = adminSteps
                    .filter(s => s.required)
                    .every(s => state.completedSteps.includes(s.id));
                state.metadata.adminFlowComplete = adminComplete;

                // Check if user flow is complete
                const userSteps = getStepsForFlow('user');
                const userComplete = userSteps
                    .filter(s => s.required)
                    .every(s => state.completedSteps.includes(s.id));
                state.metadata.userFlowComplete = userComplete;

                // Both flows must be complete for overall completion
                state.isComplete = adminComplete && userComplete;
            } else {
                // Single flow completion check
                state.isComplete = checkOnboardingComplete(state.completedSteps, state.flowType);
            }

            if (state.isComplete && !state.completedAt) {
                state.completedAt = new Date().toISOString();
            }

            // Update last accessed
            state.lastAccessedAt = new Date().toISOString();

            // Save updated state
            await this.updateState(userId, state);
            console.log('[ONBOARDING_SERVICE] Completed step:', stepId, 'for user:', userId);
            return state;
        } catch (error) {
            console.error('[ONBOARDING_SERVICE] Error completing step:', error);
            throw this.handleError(error, `Failed to complete step '${stepId}'`);
        }
    }

    /**
     * Marks a step as skipped
     * @param userId User ID
     * @param stepId Step ID to skip
     * @returns Updated onboarding state
     * @throws OnboardingError if the operation fails after retries
     */
    async skipStep(userId: string, stepId: string): Promise<OnboardingState> {
        try {
            this.validateUserId(userId);
            this.validateStepId(stepId);

            const state = await this.getOnboardingState(userId);
            if (!state) {
                throw new OnboardingError(
                    'Onboarding state not found. Please initialize onboarding first.',
                    'STATE_NOT_FOUND',
                    false
                );
            }

            // Validate step belongs to the user's flow
            const steps = getStepsForFlow(state.flowType);
            const stepExists = steps.some((s) => s.id === stepId);
            if (!stepExists) {
                throw new OnboardingError(
                    `Step '${stepId}' is not valid for flow type '${state.flowType}'`,
                    'INVALID_STEP',
                    false
                );
            }

            // Add to skipped steps if not already there
            if (!state.skippedSteps.includes(stepId)) {
                state.skippedSteps.push(stepId);
            }

            // Remove from completed steps if it was there
            state.completedSteps = state.completedSteps.filter((id) => id !== stepId);

            // Update last accessed
            state.lastAccessedAt = new Date().toISOString();

            // Save updated state
            await this.updateState(userId, state);
            console.log('[ONBOARDING_SERVICE] Skipped step:', stepId, 'for user:', userId);
            return state;
        } catch (error) {
            console.error('[ONBOARDING_SERVICE] Error skipping step:', error);
            throw this.handleError(error, `Failed to skip step '${stepId}'`);
        }
    }

    /**
     * Marks the entire onboarding as complete
     * @param userId User ID
     * @returns Updated onboarding state
     * @throws OnboardingError if the operation fails after retries
     */
    async completeOnboarding(userId: string): Promise<OnboardingState> {
        try {
            this.validateUserId(userId);

            const state = await this.getOnboardingState(userId);
            if (!state) {
                throw new OnboardingError(
                    'Onboarding state not found. Please initialize onboarding first.',
                    'STATE_NOT_FOUND',
                    false
                );
            }

            if (state.isComplete) {
                console.warn('[ONBOARDING_SERVICE] Onboarding already complete for user:', userId);
                return state;
            }

            state.isComplete = true;
            state.completedAt = new Date().toISOString();
            state.lastAccessedAt = new Date().toISOString();

            // Save updated state
            await this.updateState(userId, state);
            console.log('[ONBOARDING_SERVICE] Completed onboarding for user:', userId);
            return state;
        } catch (error) {
            console.error('[ONBOARDING_SERVICE] Error completing onboarding:', error);
            throw this.handleError(error, 'Failed to complete onboarding');
        }
    }

    /**
     * Checks if a user needs onboarding
     * @param userId User ID
     * @returns True if user needs onboarding, false otherwise
     * @note On error, returns false to avoid blocking user access
     */
    async needsOnboarding(userId: string): Promise<boolean> {
        try {
            this.validateUserId(userId);

            const state = await this.getOnboardingState(userId);

            // If no state exists, user needs onboarding
            if (!state) {
                return true;
            }

            // If onboarding is marked complete, user doesn't need it
            if (state.isComplete) {
                return false;
            }

            // Check if all required steps are completed
            return !checkOnboardingComplete(state.completedSteps, state.flowType);
        } catch (error) {
            console.error('[ONBOARDING_SERVICE] Error checking if needs onboarding:', error);
            // On error, assume user doesn't need onboarding to avoid blocking access
            // This is a deliberate design decision to prioritize user access over onboarding enforcement
            return false;
        }
    }

    /**
     * Gets the next incomplete step for a user
     * @param userId User ID
     * @returns Next step or null if all steps completed
     * @note On error, returns null to avoid blocking user flow
     */
    async getNextStep(userId: string): Promise<OnboardingStep | null> {
        try {
            this.validateUserId(userId);

            const state = await this.getOnboardingState(userId);
            if (!state) {
                return null;
            }

            const steps = getStepsForFlow(state.flowType);

            // Find first incomplete step
            for (const step of steps) {
                if (!state.completedSteps.includes(step.id) && !state.skippedSteps.includes(step.id)) {
                    return step;
                }
            }

            return null; // All steps completed or skipped
        } catch (error) {
            console.error('[ONBOARDING_SERVICE] Error getting next step:', error);
            // On error, return null to avoid blocking user flow
            return null;
        }
    }

    /**
     * Updates the onboarding state in DynamoDB
     * @param userId User ID
     * @param state Updated state
     */
    private async updateState(userId: string, state: OnboardingState): Promise<void> {
        try {
            const keys = getOnboardingStateKeys(userId, state.isComplete, state.lastAccessedAt);
            const item: DynamoDBItem<OnboardingState> = {
                PK: keys.PK,
                SK: keys.SK,
                EntityType: 'OnboardingState',
                Data: state,
                CreatedAt: Date.now(), // Will be preserved if item exists
                UpdatedAt: Date.now(),
                GSI1PK: keys.GSI1PK,
                GSI1SK: keys.GSI1SK,
            };

            await this.repository.put(item);
        } catch (error) {
            console.error('[ONBOARDING_SERVICE] Error updating state:', error);
            throw error;
        }
    }

    /**
     * Updates metadata for onboarding state
     * @param userId User ID
     * @param metadata Metadata to merge with existing
     * @returns Updated onboarding state
     */
    async updateMetadata(
        userId: string,
        metadata: Partial<OnboardingState['metadata']>
    ): Promise<OnboardingState> {
        try {
            const state = await this.getOnboardingState(userId);
            if (!state) {
                throw new Error('Onboarding state not found');
            }

            state.metadata = {
                ...state.metadata,
                ...metadata,
            };

            state.lastAccessedAt = new Date().toISOString();

            await this.updateState(userId, state);
            return state;
        } catch (error) {
            console.error('[ONBOARDING_SERVICE] Error updating metadata:', error);
            throw error;
        }
    }

    /**
     * Resets onboarding state for a user (useful for testing or re-onboarding)
     * @param userId User ID
     * @throws OnboardingError if the operation fails after retries
     */
    async resetOnboarding(userId: string): Promise<void> {
        try {
            this.validateUserId(userId);
            const keys = getOnboardingStateKeys(userId);
            await this.repository.delete(keys.PK, keys.SK);
            console.log('[ONBOARDING_SERVICE] Reset onboarding for user:', userId);
        } catch (error) {
            console.error('[ONBOARDING_SERVICE] Error resetting onboarding:', error);
            throw this.handleError(error, 'Failed to reset onboarding');
        }
    }

    /**
     * Validates onboarding state structure
     * @param state State to validate
     * @returns Validation result with errors if any
     */
    private validateStateStructure(state: any): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!state.userId || typeof state.userId !== 'string') {
            errors.push('Missing or invalid userId');
        }

        if (!state.flowType || !['user', 'admin', 'both'].includes(state.flowType)) {
            errors.push('Missing or invalid flowType');
        }

        if (typeof state.currentStep !== 'number' || state.currentStep < 0) {
            errors.push('Missing or invalid currentStep');
        }

        if (!Array.isArray(state.completedSteps)) {
            errors.push('completedSteps must be an array');
        }

        if (!Array.isArray(state.skippedSteps)) {
            errors.push('skippedSteps must be an array');
        }

        if (typeof state.isComplete !== 'boolean') {
            errors.push('Missing or invalid isComplete');
        }

        if (!state.startedAt || typeof state.startedAt !== 'string') {
            errors.push('Missing or invalid startedAt');
        }

        if (!state.lastAccessedAt || typeof state.lastAccessedAt !== 'string') {
            errors.push('Missing or invalid lastAccessedAt');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validates user ID
     * @param userId User ID to validate
     * @throws OnboardingError if user ID is invalid
     */
    private validateUserId(userId: string): void {
        if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
            throw new OnboardingError(
                'User ID is required and must be a non-empty string',
                'INVALID_USER_ID',
                false
            );
        }
    }

    /**
     * Validates step ID
     * @param stepId Step ID to validate
     * @throws OnboardingError if step ID is invalid
     */
    private validateStepId(stepId: string): void {
        if (!stepId || typeof stepId !== 'string' || stepId.trim().length === 0) {
            throw new OnboardingError(
                'Step ID is required and must be a non-empty string',
                'INVALID_STEP_ID',
                false
            );
        }
    }

    /**
     * Validates flow type
     * @param flowType Flow type to validate
     * @throws OnboardingError if flow type is invalid
     */
    private validateFlowType(flowType: OnboardingFlowType): void {
        const validFlowTypes: OnboardingFlowType[] = ['user', 'admin', 'both'];
        if (!validFlowTypes.includes(flowType)) {
            throw new OnboardingError(
                `Flow type must be one of: ${validFlowTypes.join(', ')}`,
                'INVALID_FLOW_TYPE',
                false
            );
        }
    }

    /**
     * Handles errors and wraps them in OnboardingError
     * @param error Original error
     * @param message User-friendly error message
     * @returns OnboardingError
     */
    private handleError(error: any, message: string): OnboardingError {
        // If it's already an OnboardingError, return it
        if (error instanceof OnboardingError) {
            return error;
        }

        // If it's a DynamoDB error, wrap it
        if (error instanceof DynamoDBError) {
            return new OnboardingError(
                `${message}: ${error.message}`,
                error.code || 'DYNAMODB_ERROR',
                error.retryable,
                error
            );
        }

        // For network errors, mark as retryable
        const isNetworkError =
            error.code === 'ECONNREFUSED' ||
            error.code === 'ENOTFOUND' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ENETUNREACH' ||
            error.message?.includes('network') ||
            error.message?.includes('timeout');

        return new OnboardingError(
            `${message}: ${error.message || 'Unknown error'}`,
            error.code || 'UNKNOWN_ERROR',
            isNetworkError,
            error
        );
    }
}

// Export singleton instance
export const onboardingService = new OnboardingService();
