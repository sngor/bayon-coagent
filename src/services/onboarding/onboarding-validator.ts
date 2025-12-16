/**
 * Onboarding Validation Service
 * Handles all validation logic for onboarding operations
 */

import type { OnboardingFlowType, OnboardingState } from '@/types/onboarding';
import { OnboardingError } from './onboarding-service';

export class OnboardingValidator {
    /**
     * Validates user ID
     */
    static validateUserId(userId: string): void {
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
     */
    static validateStepId(stepId: string): void {
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
     */
    static validateFlowType(flowType: OnboardingFlowType): void {
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
     * Validates onboarding state structure
     */
    static validateStateStructure(state: any): { valid: boolean; errors: string[] } {
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
}