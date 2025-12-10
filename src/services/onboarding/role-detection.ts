/**
 * Role Detection and Flow Routing
 * 
 * Provides functionality to detect user roles from Cognito attributes
 * and determine the appropriate onboarding flow type.
 * 
 * Features:
 * - Admin role detection from Cognito custom attributes
 * - Dual role detection (users with both admin and user roles)
 * - Flow type determination based on roles
 * - Support for flow choice presentation
 */

import { getCognitoClient } from '@/aws/auth/cognito-client';
import type { UserRole } from '@/aws/dynamodb/admin-types';
import type { OnboardingFlowType } from '@/types/onboarding';

/**
 * Role detection result
 */
export interface RoleDetectionResult {
    /** Whether user has admin role */
    isAdmin: boolean;
    /** Whether user has standard user role */
    isUser: boolean;
    /** Whether user has both roles */
    isDualRole: boolean;
    /** Detected user role from Cognito */
    cognitoRole: UserRole;
    /** Recommended flow type */
    recommendedFlow: OnboardingFlowType;
}

/**
 * Flow choice option for dual role users
 */
export interface FlowChoiceOption {
    /** Flow type */
    flowType: OnboardingFlowType;
    /** Display title */
    title: string;
    /** Description */
    description: string;
    /** Whether this is the recommended option */
    recommended: boolean;
    /** Icon name (for UI) */
    icon: string;
}

/**
 * Detects the appropriate onboarding flow based on user's Cognito attributes
 * 
 * This function checks the user's role from Cognito and determines:
 * - Whether they have admin privileges
 * - Whether they should see the admin flow, user flow, or both
 * - The recommended flow type
 * 
 * @param userId - User ID (Cognito username/sub)
 * @returns Role detection result with flow recommendation
 * @throws Error if unable to fetch user attributes
 */
export async function detectOnboardingFlow(userId: string): Promise<RoleDetectionResult> {
    try {
        // Validate input
        if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
            throw new Error('User ID is required and must be a non-empty string');
        }

        // Get Cognito client
        const cognitoClient = getCognitoClient();

        // Fetch user role from Cognito attributes
        // This requires admin credentials and uses AdminGetUserCommand
        let cognitoRole: UserRole;
        try {
            cognitoRole = await cognitoClient.getUserRole(userId);
        } catch (error) {
            console.warn('[ROLE_DETECTION] Failed to get user role from Cognito, defaulting to user:', error);
            // Default to 'user' role if we can't fetch from Cognito
            cognitoRole = 'user';
        }

        // Determine role flags
        const isAdmin = cognitoRole === 'admin' || cognitoRole === 'superadmin';
        const isUser = true; // All users have basic user capabilities
        const isDualRole = isAdmin && isUser; // Admin users also have user capabilities

        // Determine recommended flow
        let recommendedFlow: OnboardingFlowType;
        if (isDualRole) {
            // For dual role users, recommend both flows
            recommendedFlow = 'both';
        } else if (isAdmin) {
            // Admin-only users get admin flow
            recommendedFlow = 'admin';
        } else {
            // Standard users get user flow
            recommendedFlow = 'user';
        }

        console.log('[ROLE_DETECTION] Detected roles for user:', userId, {
            cognitoRole,
            isAdmin,
            isUser,
            isDualRole,
            recommendedFlow,
        });

        return {
            isAdmin,
            isUser,
            isDualRole,
            cognitoRole,
            recommendedFlow,
        };
    } catch (error) {
        console.error('[ROLE_DETECTION] Error detecting onboarding flow:', error);
        throw new Error(`Failed to detect onboarding flow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Gets flow choice options for dual role users
 * 
 * When a user has both admin and user roles, they should be presented
 * with options to choose which flow(s) to complete.
 * 
 * @returns Array of flow choice options
 */
export function getFlowChoiceOptions(): FlowChoiceOption[] {
    return [
        {
            flowType: 'both',
            title: 'Complete Both Flows',
            description: 'Experience the platform from both admin and user perspectives. Admin flow first, then user flow.',
            recommended: true,
            icon: 'users-cog',
        },
        {
            flowType: 'admin',
            title: 'Admin Flow Only',
            description: 'Focus on platform management features. You can complete the user flow later from settings.',
            recommended: false,
            icon: 'shield-check',
        },
        {
            flowType: 'user',
            title: 'User Flow Only',
            description: 'Focus on content creation and brand building. You can complete the admin flow later from settings.',
            recommended: false,
            icon: 'user',
        },
    ];
}

/**
 * Validates if a flow type is appropriate for a user's roles
 * 
 * @param flowType - The flow type to validate
 * @param roleDetection - The user's role detection result
 * @returns True if the flow type is valid for the user
 */
export function isFlowTypeValid(
    flowType: OnboardingFlowType,
    roleDetection: RoleDetectionResult
): boolean {
    // User flow is always valid
    if (flowType === 'user') {
        return true;
    }

    // Admin flow requires admin role
    if (flowType === 'admin') {
        return roleDetection.isAdmin;
    }

    // Both flows require dual role
    if (flowType === 'both') {
        return roleDetection.isDualRole;
    }

    return false;
}

/**
 * Gets the display name for a flow type
 * 
 * @param flowType - The flow type
 * @returns Display name
 */
export function getFlowDisplayName(flowType: OnboardingFlowType): string {
    switch (flowType) {
        case 'user':
            return 'User Onboarding';
        case 'admin':
            return 'Admin Onboarding';
        case 'both':
            return 'Complete Onboarding';
        default:
            return 'Onboarding';
    }
}

/**
 * Gets the description for a flow type
 * 
 * @param flowType - The flow type
 * @returns Description
 */
export function getFlowDescription(flowType: OnboardingFlowType): string {
    switch (flowType) {
        case 'user':
            return 'Learn how to create content, build your brand, and grow your business';
        case 'admin':
            return 'Learn how to manage users, monitor the platform, and configure settings';
        case 'both':
            return 'Experience the platform from both admin and user perspectives';
        default:
            return 'Get started with Bayon Coagent';
    }
}

/**
 * Determines if a user should see the flow choice screen
 * 
 * Users should see the flow choice screen if:
 * - They have dual roles (admin + user)
 * - They haven't started onboarding yet
 * 
 * @param roleDetection - The user's role detection result
 * @param hasStartedOnboarding - Whether the user has already started onboarding
 * @returns True if the user should see the flow choice screen
 */
export function shouldShowFlowChoice(
    roleDetection: RoleDetectionResult,
    hasStartedOnboarding: boolean
): boolean {
    // Only show flow choice for dual role users who haven't started
    return roleDetection.isDualRole && !hasStartedOnboarding;
}

/**
 * Gets the next flow for dual role users
 * 
 * For users completing both flows, this determines which flow comes next
 * based on what they've already completed.
 * 
 * Admin flow always comes first, then user flow.
 * 
 * @param adminFlowComplete - Whether admin flow is complete
 * @param userFlowComplete - Whether user flow is complete
 * @returns The next flow type, or null if both are complete
 */
export function getNextFlowForDualRole(
    adminFlowComplete: boolean,
    userFlowComplete: boolean
): OnboardingFlowType | null {
    // Admin flow comes first
    if (!adminFlowComplete) {
        return 'admin';
    }

    // Then user flow
    if (!userFlowComplete) {
        return 'user';
    }

    // Both complete
    return null;
}

/**
 * Checks if both flows are complete for a dual role user
 * 
 * @param adminFlowComplete - Whether admin flow is complete
 * @param userFlowComplete - Whether user flow is complete
 * @returns True if both flows are complete
 */
export function areBothFlowsComplete(
    adminFlowComplete: boolean,
    userFlowComplete: boolean
): boolean {
    return adminFlowComplete && userFlowComplete;
}
