/**
 * Onboarding Status Check API Route
 * 
 * This API route handles onboarding status checks for the middleware.
 * It runs in Node.js runtime and can safely use DynamoDB and other AWS services.
 */

import { NextRequest, NextResponse } from 'next/server';
import { onboardingService } from '@/services/onboarding/onboarding-service';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Get onboarding state
        const state = await onboardingService.getOnboardingState(userId);

        // If no state exists, user needs onboarding
        if (!state) {
            return NextResponse.json({
                needsOnboarding: true,
                nextStepPath: '/onboarding/welcome',
            });
        }

        // If onboarding is marked complete, user doesn't need it
        if (state.isComplete) {
            return NextResponse.json({
                needsOnboarding: false,
                nextStepPath: null,
            });
        }

        // Check if all required steps are completed
        const { getStepsForFlow, isOnboardingComplete } = await import('@/types/onboarding');
        const steps = getStepsForFlow(state.flowType);
        const complete = isOnboardingComplete(state.completedSteps, state.flowType);

        if (complete) {
            return NextResponse.json({
                needsOnboarding: false,
                nextStepPath: null,
            });
        }

        // Find next incomplete step
        const nextStep = steps.find(
            step => !state.completedSteps.includes(step.id) && !state.skippedSteps.includes(step.id)
        );

        return NextResponse.json({
            needsOnboarding: true,
            nextStepPath: nextStep?.path || '/onboarding/welcome',
        });

    } catch (error) {
        console.error('[ONBOARDING_API] Error checking status:', error);

        // On error, don't block user access
        return NextResponse.json({
            needsOnboarding: false,
            nextStepPath: null,
        });
    }
}