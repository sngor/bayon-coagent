/**
 * Onboarding Navigation Handler
 * 
 * Handles navigation errors and validates step transitions in the onboarding flow.
 * Provides redirects for invalid navigation attempts.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Step order for user flow
 */
const USER_FLOW_STEPS = [
    'welcome',
    'profile',
    'tour',
    'selection',
    'complete',
];

/**
 * Step order for admin flow
 */
const ADMIN_FLOW_STEPS = [
    'welcome',
    'overview',
    'users',
    'analytics',
    'config',
    'complete',
];

/**
 * Extracts step ID from onboarding path
 */
function extractStepFromPath(pathname: string): string | null {
    const match = pathname.match(/\/onboarding\/(user|admin)\/([^/]+)/);
    return match ? match[2] : null;
}

/**
 * Extracts flow type from onboarding path
 */
function extractFlowFromPath(pathname: string): 'user' | 'admin' | null {
    const match = pathname.match(/\/onboarding\/(user|admin)/);
    return match ? (match[1] as 'user' | 'admin') : null;
}

/**
 * Gets step index in flow
 */
function getStepIndex(stepId: string, flowType: 'user' | 'admin'): number {
    const steps = flowType === 'user' ? USER_FLOW_STEPS : ADMIN_FLOW_STEPS;
    return steps.indexOf(stepId);
}

/**
 * Validates if navigation to a step is allowed
 */
export function validateStepNavigation(
    targetStep: string,
    completedSteps: string[],
    flowType: 'user' | 'admin'
): { valid: boolean; redirectTo?: string; reason?: string } {
    const steps = flowType === 'user' ? USER_FLOW_STEPS : ADMIN_FLOW_STEPS;
    const targetIndex = getStepIndex(targetStep, flowType);

    // Invalid step
    if (targetIndex === -1) {
        return {
            valid: false,
            redirectTo: `/onboarding/${flowType}/welcome`,
            reason: 'Invalid step',
        };
    }

    // Welcome step is always accessible
    if (targetStep === 'welcome') {
        return { valid: true };
    }

    // Complete step is accessible if all other steps are done
    if (targetStep === 'complete') {
        const requiredSteps = steps.filter(s => s !== 'complete');
        const allCompleted = requiredSteps.every(s => completedSteps.includes(s));

        if (!allCompleted) {
            // Find first incomplete step
            const nextStep = requiredSteps.find(s => !completedSteps.includes(s)) || 'welcome';
            return {
                valid: false,
                redirectTo: `/onboarding/${flowType}/${nextStep}`,
                reason: 'Must complete all steps before viewing completion',
            };
        }

        return { valid: true };
    }

    // Check if previous steps are completed
    const previousSteps = steps.slice(0, targetIndex);
    const incompletePrevious = previousSteps.find(s => !completedSteps.includes(s));

    if (incompletePrevious) {
        return {
            valid: false,
            redirectTo: `/onboarding/${flowType}/${incompletePrevious}`,
            reason: `Must complete ${incompletePrevious} before accessing ${targetStep}`,
        };
    }

    return { valid: true };
}

/**
 * Handles navigation errors in onboarding middleware
 */
export async function handleNavigationError(
    request: NextRequest,
    userId: string,
    onboardingState: any
): Promise<NextResponse | null> {
    const pathname = request.nextUrl.pathname;

    // Only handle onboarding routes
    if (!pathname.startsWith('/onboarding/')) {
        return null;
    }

    // Extract step and flow from path
    const step = extractStepFromPath(pathname);
    const flow = extractFlowFromPath(pathname);

    // If we can't determine step or flow, allow navigation
    if (!step || !flow) {
        return null;
    }

    // Validate navigation
    const validation = validateStepNavigation(
        step,
        onboardingState?.completedSteps || [],
        flow
    );

    // If navigation is invalid, redirect
    if (!validation.valid && validation.redirectTo) {
        console.log(
            `[ONBOARDING_NAVIGATION] Invalid navigation for user ${userId}: ${validation.reason}`
        );

        const redirectUrl = new URL(validation.redirectTo, request.url);

        // Preserve query parameters
        request.nextUrl.searchParams.forEach((value, key) => {
            redirectUrl.searchParams.set(key, value);
        });

        // Add error message as query param
        if (validation.reason) {
            redirectUrl.searchParams.set('error', validation.reason);
        }

        return NextResponse.redirect(redirectUrl);
    }

    return null;
}

/**
 * Creates an error response for navigation errors
 */
export function createNavigationErrorResponse(
    reason: string,
    redirectTo: string
): NextResponse {
    return NextResponse.json(
        {
            error: 'Navigation Error',
            message: reason,
            redirectTo,
        },
        { status: 400 }
    );
}
