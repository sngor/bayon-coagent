/**
 * Onboarding Repository
 * Handles all database operations for onboarding
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { getOnboardingStateKeys } from '@/aws/dynamodb';
import type { DynamoDBItem } from '@/aws/dynamodb/types';
import type { OnboardingState } from '@/types/onboarding';
import { createLogger } from '@/aws/logging/logger';

const logger = createLogger({ service: 'onboarding-repository' });

export class OnboardingRepository {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository({
            maxRetries: 3,
            initialDelayMs: 100,
            maxDelayMs: 5000,
            backoffMultiplier: 2,
            jitter: true,
        });
    }

    /**
     * Gets onboarding state from database
     */
    async getState(userId: string): Promise<OnboardingState | null> {
        try {
            const keys = getOnboardingStateKeys(userId);
            const state = await this.repository.get<OnboardingState>(keys.PK, keys.SK);
            return state;
        } catch (error) {
            logger.error('Failed to get onboarding state:', error instanceof Error ? error : new Error(String(error)), { userId, operation: 'getState' });
            throw error;
        }
    }

    /**
     * Saves onboarding state to database
     */
    async saveState(userId: string, state: OnboardingState): Promise<void> {
        try {
            const keys = getOnboardingStateKeys(userId, state.isComplete, state.lastAccessedAt);
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
            logger.info('Onboarding state saved successfully', { userId, operation: 'saveState' });
        } catch (error) {
            logger.error('Failed to save onboarding state:', error instanceof Error ? error : new Error(String(error)), { userId, operation: 'saveState' });
            throw error;
        }
    }

    /**
     * Deletes onboarding state from database
     */
    async deleteState(userId: string): Promise<void> {
        try {
            const keys = getOnboardingStateKeys(userId);
            await this.repository.delete(keys.PK, keys.SK);
            logger.info('Onboarding state deleted successfully', { userId, operation: 'deleteState' });
        } catch (error) {
            logger.error('Failed to delete onboarding state:', error instanceof Error ? error : new Error(String(error)), { userId, operation: 'deleteState' });
            throw error;
        }
    }

    /**
     * Batch operations for multiple states (future enhancement)
     */
    async batchGetStates(userIds: string[]): Promise<Map<string, OnboardingState | null>> {
        const results = new Map<string, OnboardingState | null>();

        // For now, implement as individual calls
        // TODO: Implement true batch operations when needed
        for (const userId of userIds) {
            try {
                const state = await this.getState(userId);
                results.set(userId, state);
            } catch (error) {
                logger.warn('Failed to get state in batch operation:', { userId, error: error instanceof Error ? error.message : String(error) });
                results.set(userId, null);
            }
        }

        return results;
    }
}