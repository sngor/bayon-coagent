/**
 * Onboarding Type Definitions
 * 
 * Defines TypeScript types for the user onboarding system.
 */

/**
 * Onboarding flow types
 */
export type OnboardingFlowType = 'user' | 'admin' | 'both';

/**
 * Onboarding step status
 */
export type OnboardingStepStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

/**
 * Main onboarding state stored in DynamoDB
 */
export interface OnboardingState {
    /** User ID */
    userId: string;
    /** Type of onboarding flow */
    flowType: OnboardingFlowType;
    /** Current step number (0-indexed) */
    currentStep: number;
    /** Array of completed step IDs */
    completedSteps: string[];
    /** Array of skipped step IDs */
    skippedSteps: string[];
    /** Whether the entire onboarding is complete */
    isComplete: boolean;
    /** ISO timestamp when onboarding started */
    startedAt: string;
    /** ISO timestamp when onboarding completed (if complete) */
    completedAt?: string;
    /** ISO timestamp of last access */
    lastAccessedAt: string;
    /** Additional metadata */
    metadata?: {
        /** Selected hub from hub selection step */
        selectedHub?: string;
        /** Whether user dismissed resume banner in current session */
        bannerDismissed?: boolean;
        /** Profile completion percentage */
        profileCompletion?: number;
        /** Tour completion status */
        tourCompleted?: boolean;
        /** Admin flow completion (for dual role users) */
        adminFlowComplete?: boolean;
        /** User flow completion (for dual role users) */
        userFlowComplete?: boolean;
        /** Profile form data */
        profileData?: any; // ProfileFormData from profile-schema.ts
    };
}

/**
 * Analytics event types for onboarding
 */
export type OnboardingEventType =
    | 'onboarding_started'
    | 'step_completed'
    | 'step_skipped'
    | 'onboarding_completed'
    | 'onboarding_abandoned'
    | 'onboarding_resumed'
    | 'flow_switched'; // For dual role users switching between flows

/**
 * Analytics event for onboarding tracking
 */
export interface OnboardingAnalyticsEvent {
    /** Event type */
    eventType: OnboardingEventType;
    /** User ID */
    userId: string;
    /** Flow type */
    flowType: OnboardingFlowType;
    /** Step ID (if applicable) */
    stepId?: string;
    /** ISO timestamp */
    timestamp: string;
    /** Session ID for tracking user sessions */
    sessionId?: string;
    /** Additional metadata */
    metadata?: {
        /** User agent string */
        userAgent?: string;
        /** Device type (mobile, tablet, desktop) */
        deviceType?: string;
        /** Time spent on step (milliseconds) */
        timeSpent?: number;
        /** Reason for skipping (if applicable) */
        skipReason?: string;
        /** Previous step (for navigation tracking) */
        previousStep?: string;
        /** Next step (for navigation tracking) */
        nextStep?: string;
        /** Total time to complete onboarding (milliseconds) */
        totalTime?: number;
    };
}

/**
 * Onboarding step definition
 */
export interface OnboardingStep {
    /** Unique step identifier */
    id: string;
    /** Display name */
    name: string;
    /** Step description */
    description: string;
    /** Route path */
    path: string;
    /** Step order */
    order: number;
    /** Whether step is required */
    required: boolean;
    /** Flow type this step belongs to */
    flowType: OnboardingFlowType;
}

/**
 * User onboarding flow steps
 */
export const USER_ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'welcome',
        name: 'Welcome',
        description: 'Introduction to Bayon Coagent',
        path: '/onboarding/welcome',
        order: 0,
        required: true,
        flowType: 'user',
    },
    {
        id: 'profile',
        name: 'Profile Setup',
        description: 'Set up your professional profile',
        path: '/onboarding/user/profile',
        order: 1,
        required: true,
        flowType: 'user',
    },
    {
        id: 'tour',
        name: 'Feature Tour',
        description: 'Explore the platform features',
        path: '/onboarding/user/tour',
        order: 2,
        required: false,
        flowType: 'user',
    },
    {
        id: 'selection',
        name: 'Hub Selection',
        description: 'Choose where to start',
        path: '/onboarding/user/selection',
        order: 3,
        required: false,
        flowType: 'user',
    },
    {
        id: 'complete',
        name: 'Complete',
        description: 'Onboarding complete',
        path: '/onboarding/user/complete',
        order: 4,
        required: true,
        flowType: 'user',
    },
];

/**
 * Admin onboarding flow steps
 */
export const ADMIN_ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'admin-welcome',
        name: 'Admin Welcome',
        description: 'Introduction to admin features',
        path: '/onboarding/admin/overview',
        order: 0,
        required: false,
        flowType: 'admin',
    },
    {
        id: 'admin-users',
        name: 'User Management',
        description: 'Learn about user management',
        path: '/onboarding/admin/users-overview',
        order: 1,
        required: false,
        flowType: 'admin',
    },
    {
        id: 'admin-analytics',
        name: 'Analytics',
        description: 'Platform analytics overview',
        path: '/onboarding/admin/analytics-overview',
        order: 2,
        required: false,
        flowType: 'admin',
    },
    {
        id: 'admin-config',
        name: 'Configuration',
        description: 'Platform configuration',
        path: '/onboarding/admin/config-overview',
        order: 3,
        required: false,
        flowType: 'admin',
    },
    {
        id: 'admin-complete',
        name: 'Complete',
        description: 'Admin onboarding complete',
        path: '/onboarding/admin/complete',
        order: 4,
        required: true,
        flowType: 'admin',
    },
];

/**
 * Get all steps for a given flow type
 */
export function getStepsForFlow(flowType: OnboardingFlowType): OnboardingStep[] {
    if (flowType === 'admin') {
        return ADMIN_ONBOARDING_STEPS;
    } else if (flowType === 'user') {
        return USER_ONBOARDING_STEPS;
    } else {
        // For 'both', return admin steps first, then user steps
        return [...ADMIN_ONBOARDING_STEPS, ...USER_ONBOARDING_STEPS];
    }
}

/**
 * Get step by ID
 */
export function getStepById(stepId: string): OnboardingStep | undefined {
    return [...USER_ONBOARDING_STEPS, ...ADMIN_ONBOARDING_STEPS].find(
        (step) => step.id === stepId
    );
}

/**
 * Get next step in flow
 */
export function getNextStep(
    currentStepId: string,
    flowType: OnboardingFlowType,
    completedSteps: string[]
): OnboardingStep | null {
    const steps = getStepsForFlow(flowType);
    const currentIndex = steps.findIndex((step) => step.id === currentStepId);

    if (currentIndex === -1) {
        // Current step not found, return first incomplete step
        return steps.find((step) => !completedSteps.includes(step.id)) || null;
    }

    // Find next incomplete step
    for (let i = currentIndex + 1; i < steps.length; i++) {
        if (!completedSteps.includes(steps[i].id)) {
            return steps[i];
        }
    }

    return null; // All steps completed
}

/**
 * Get previous step in flow
 */
export function getPreviousStep(
    currentStepId: string,
    flowType: OnboardingFlowType
): OnboardingStep | null {
    const steps = getStepsForFlow(flowType);
    const currentIndex = steps.findIndex((step) => step.id === currentStepId);

    if (currentIndex <= 0) {
        return null;
    }

    return steps[currentIndex - 1];
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(
    completedSteps: string[],
    flowType: OnboardingFlowType
): number {
    const steps = getStepsForFlow(flowType);
    if (steps.length === 0) return 0;

    const completed = completedSteps.filter((stepId) =>
        steps.some((step) => step.id === stepId)
    ).length;

    return Math.round((completed / steps.length) * 100);
}

/**
 * Check if onboarding is complete
 */
export function isOnboardingComplete(
    completedSteps: string[],
    flowType: OnboardingFlowType
): boolean {
    const steps = getStepsForFlow(flowType);
    const requiredSteps = steps.filter((step) => step.required);

    return requiredSteps.every((step) => completedSteps.includes(step.id));
}
