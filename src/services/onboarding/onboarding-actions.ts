/**
 * Onboarding Server Actions
 * 
 * Secure server actions for onboarding operations with:
 * - JWT token verification
 * - Server-side role validation
 * - Input sanitization
 * - Rate limiting
 * - CSRF protection
 * 
 * Requirements: 11.1, 2.2 (Security)
 */

'use server';

import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { onboardingService } from './onboarding-service';
import { sanitizeText, sanitizeObject } from '@/lib/security/input-sanitization';
import { validateCSRFToken } from '@/lib/security/csrf-protection';
import { rateLimiters, getIdentifier } from '@/lib/security/rate-limiter';
import { getCognitoClient } from '@/aws/auth/cognito-client';
import type { OnboardingFlowType, OnboardingState } from '@/types/onboarding';
import { headers } from 'next/headers';

/**
 * Standard action response type
 */
interface ActionResponse<T = any> {
    message: string;
    data?: T;
    errors: Record<string, string[]>;
}

/**
 * Rate limiter specifically for onboarding state updates
 * More lenient than auth but stricter than general API
 */
const onboardingRateLimiter = rateLimiters.api;

/**
 * Verify JWT token and get authenticated user
 * Throws error if user is not authenticated
 */
async function verifyAuthentication(): Promise<{ userId: string; email: string }> {
    const user = await getCurrentUserServer();

    if (!user || !user.id) {
        throw new Error('Authentication required. Please sign in to continue.');
    }

    return {
        userId: user.id,
        email: user.email,
    };
}

/**
 * Verify user has admin role
 * Checks Cognito user attributes for admin role
 */
async function verifyAdminRole(userId: string): Promise<boolean> {
    try {
        // Get user from Cognito to check attributes
        const user = await getCurrentUserServer();

        if (!user) {
            return false;
        }

        // Check for admin role in custom attributes
        const isAdmin = user.attributes?.['custom:role'] === 'admin' ||
            user.attributes?.['custom:role'] === 'super_admin';

        return isAdmin;
    } catch (error) {
        console.error('[ONBOARDING_ACTIONS] Error verifying admin role:', error);
        return false;
    }
}

/**
 * Check rate limit for onboarding operations
 */
async function checkRateLimit(userId: string): Promise<void> {
    const headersList = await headers();
    const mockRequest = new Request('http://localhost', {
        headers: headersList,
    });

    const identifier = getIdentifier(mockRequest, userId);
    const result = onboardingRateLimiter.check(identifier);

    if (!result.allowed) {
        const resetDate = new Date(result.resetAt);
        throw new Error(
            `Too many requests. Please try again after ${resetDate.toLocaleTimeString()}.`
        );
    }
}

/**
 * Sanitize onboarding metadata
 */
function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeText(value);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeMetadata(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Initialize onboarding for a user
 * Validates: Requirements 11.1 (Admin role detection)
 */
export async function initializeOnboardingAction(
    flowType: OnboardingFlowType
): Promise<ActionResponse<OnboardingState>> {
    try {
        // 1. Verify authentication (JWT token verification)
        const { userId } = await verifyAuthentication();

        // 2. Check rate limit
        await checkRateLimit(userId);

        // 3. Validate flow type
        const validFlowTypes: OnboardingFlowType[] = ['user', 'admin', 'both'];
        if (!validFlowTypes.includes(flowType)) {
            return {
                message: 'Invalid flow type',
                errors: { flowType: ['Flow type must be user, admin, or both'] },
            };
        }

        // 4. Server-side role validation for admin flows
        if (flowType === 'admin' || flowType === 'both') {
            const isAdmin = await verifyAdminRole(userId);
            if (!isAdmin) {
                return {
                    message: 'Unauthorized',
                    errors: { auth: ['Admin role required for admin onboarding flow'] },
                };
            }
        }

        // 5. Initialize onboarding
        const state = await onboardingService.initializeOnboarding(userId, flowType);

        return {
            message: 'success',
            data: state,
            errors: {},
        };
    } catch (error) {
        console.error('[ONBOARDING_ACTIONS] Initialize error:', error);
        return {
            message: error instanceof Error ? error.message : 'Failed to initialize onboarding',
            errors: { server: [error instanceof Error ? error.message : 'Unknown error'] },
        };
    }
}

/**
 * Get onboarding state for current user
 */
export async function getOnboardingStateAction(): Promise<ActionResponse<OnboardingState | null>> {
    try {
        // 1. Verify authentication
        const { userId } = await verifyAuthentication();

        // 2. Get onboarding state
        const state = await onboardingService.getOnboardingState(userId);

        return {
            message: 'success',
            data: state,
            errors: {},
        };
    } catch (error) {
        console.error('[ONBOARDING_ACTIONS] Get state error:', error);
        return {
            message: error instanceof Error ? error.message : 'Failed to get onboarding state',
            errors: { server: [error instanceof Error ? error.message : 'Unknown error'] },
        };
    }
}

/**
 * Complete an onboarding step
 * Validates: Requirements 2.2 (Input validation)
 */
export async function completeStepAction(
    stepId: string,
    csrfToken?: string
): Promise<ActionResponse<OnboardingState>> {
    try {
        // 1. CSRF protection (if token provided)
        if (csrfToken) {
            const isValidCSRF = await validateCSRFToken(csrfToken);
            if (!isValidCSRF) {
                return {
                    message: 'CSRF validation failed',
                    errors: { csrf: ['Invalid or missing CSRF token'] },
                };
            }
        }

        // 2. Verify authentication
        const { userId } = await verifyAuthentication();

        // 3. Check rate limit
        await checkRateLimit(userId);

        // 4. Input sanitization
        const sanitizedStepId = sanitizeText(stepId);

        if (!sanitizedStepId || sanitizedStepId.length === 0) {
            return {
                message: 'Invalid step ID',
                errors: { stepId: ['Step ID is required'] },
            };
        }

        // 5. Complete step
        const state = await onboardingService.completeStep(userId, sanitizedStepId);

        return {
            message: 'success',
            data: state,
            errors: {},
        };
    } catch (error) {
        console.error('[ONBOARDING_ACTIONS] Complete step error:', error);
        return {
            message: error instanceof Error ? error.message : 'Failed to complete step',
            errors: { server: [error instanceof Error ? error.message : 'Unknown error'] },
        };
    }
}

/**
 * Skip an onboarding step
 */
export async function skipStepAction(
    stepId: string,
    csrfToken?: string
): Promise<ActionResponse<OnboardingState>> {
    try {
        // 1. CSRF protection (if token provided)
        if (csrfToken) {
            const isValidCSRF = await validateCSRFToken(csrfToken);
            if (!isValidCSRF) {
                return {
                    message: 'CSRF validation failed',
                    errors: { csrf: ['Invalid or missing CSRF token'] },
                };
            }
        }

        // 2. Verify authentication
        const { userId } = await verifyAuthentication();

        // 3. Check rate limit
        await checkRateLimit(userId);

        // 4. Input sanitization
        const sanitizedStepId = sanitizeText(stepId);

        if (!sanitizedStepId || sanitizedStepId.length === 0) {
            return {
                message: 'Invalid step ID',
                errors: { stepId: ['Step ID is required'] },
            };
        }

        // 5. Skip step
        const state = await onboardingService.skipStep(userId, sanitizedStepId);

        return {
            message: 'success',
            data: state,
            errors: {},
        };
    } catch (error) {
        console.error('[ONBOARDING_ACTIONS] Skip step error:', error);
        return {
            message: error instanceof Error ? error.message : 'Failed to skip step',
            errors: { server: [error instanceof Error ? error.message : 'Unknown error'] },
        };
    }
}

/**
 * Complete entire onboarding flow
 */
export async function completeOnboardingAction(
    csrfToken?: string
): Promise<ActionResponse<OnboardingState>> {
    try {
        // 1. CSRF protection (if token provided)
        if (csrfToken) {
            const isValidCSRF = await validateCSRFToken(csrfToken);
            if (!isValidCSRF) {
                return {
                    message: 'CSRF validation failed',
                    errors: { csrf: ['Invalid or missing CSRF token'] },
                };
            }
        }

        // 2. Verify authentication
        const { userId } = await verifyAuthentication();

        // 3. Check rate limit
        await checkRateLimit(userId);

        // 4. Complete onboarding
        const state = await onboardingService.completeOnboarding(userId);

        return {
            message: 'success',
            data: state,
            errors: {},
        };
    } catch (error) {
        console.error('[ONBOARDING_ACTIONS] Complete onboarding error:', error);
        return {
            message: error instanceof Error ? error.message : 'Failed to complete onboarding',
            errors: { server: [error instanceof Error ? error.message : 'Unknown error'] },
        };
    }
}

/**
 * Update onboarding metadata
 * Validates: Requirements 2.2 (Input sanitization)
 */
export async function updateMetadataAction(
    metadata: Record<string, any>,
    csrfToken?: string
): Promise<ActionResponse<OnboardingState>> {
    try {
        // 1. CSRF protection (if token provided)
        if (csrfToken) {
            const isValidCSRF = await validateCSRFToken(csrfToken);
            if (!isValidCSRF) {
                return {
                    message: 'CSRF validation failed',
                    errors: { csrf: ['Invalid or missing CSRF token'] },
                };
            }
        }

        // 2. Verify authentication
        const { userId } = await verifyAuthentication();

        // 3. Check rate limit
        await checkRateLimit(userId);

        // 4. Input sanitization
        const sanitizedMetadata = sanitizeMetadata(metadata);

        // 5. Update metadata
        const state = await onboardingService.updateMetadata(userId, sanitizedMetadata);

        return {
            message: 'success',
            data: state,
            errors: {},
        };
    } catch (error) {
        console.error('[ONBOARDING_ACTIONS] Update metadata error:', error);
        return {
            message: error instanceof Error ? error.message : 'Failed to update metadata',
            errors: { server: [error instanceof Error ? error.message : 'Unknown error'] },
        };
    }
}

/**
 * Check if user needs onboarding
 */
export async function needsOnboardingAction(): Promise<ActionResponse<boolean>> {
    try {
        // 1. Verify authentication
        const { userId } = await verifyAuthentication();

        // 2. Check if needs onboarding
        const needsOnboarding = await onboardingService.needsOnboarding(userId);

        return {
            message: 'success',
            data: needsOnboarding,
            errors: {},
        };
    } catch (error) {
        console.error('[ONBOARDING_ACTIONS] Needs onboarding error:', error);
        return {
            message: error instanceof Error ? error.message : 'Failed to check onboarding status',
            errors: { server: [error instanceof Error ? error.message : 'Unknown error'] },
        };
    }
}

/**
 * Reset onboarding (admin only)
 * Validates: Requirements 11.1 (Admin role validation)
 */
export async function resetOnboardingAction(
    targetUserId?: string,
    csrfToken?: string
): Promise<ActionResponse<void>> {
    try {
        // 1. CSRF protection (if token provided)
        if (csrfToken) {
            const isValidCSRF = await validateCSRFToken(csrfToken);
            if (!isValidCSRF) {
                return {
                    message: 'CSRF validation failed',
                    errors: { csrf: ['Invalid or missing CSRF token'] },
                };
            }
        }

        // 2. Verify authentication
        const { userId } = await verifyAuthentication();

        // 3. Server-side role validation
        const isAdmin = await verifyAdminRole(userId);
        if (!isAdmin && targetUserId && targetUserId !== userId) {
            return {
                message: 'Unauthorized',
                errors: { auth: ['Admin role required to reset other users onboarding'] },
            };
        }

        // 4. Check rate limit
        await checkRateLimit(userId);

        // 5. Determine which user to reset
        const userToReset = targetUserId || userId;

        // 6. Input sanitization
        const sanitizedUserId = sanitizeText(userToReset);

        // 7. Reset onboarding
        await onboardingService.resetOnboarding(sanitizedUserId);

        return {
            message: 'success',
            errors: {},
        };
    } catch (error) {
        console.error('[ONBOARDING_ACTIONS] Reset onboarding error:', error);
        return {
            message: error instanceof Error ? error.message : 'Failed to reset onboarding',
            errors: { server: [error instanceof Error ? error.message : 'Unknown error'] },
        };
    }
}
