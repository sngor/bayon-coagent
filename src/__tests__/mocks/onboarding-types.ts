/**
 * Mock onboarding types for testing
 */

export type OnboardingFlowType = 'user' | 'admin' | 'both';

export interface OnboardingState {
    userId: string;
    flowType: OnboardingFlowType;
    currentStep: number;
    completedSteps: string[];
    skippedSteps: string[];
    isComplete: boolean;
    startedAt: string;
    completedAt?: string;
    lastAccessedAt: string;
    metadata?: Record<string, any>;
}

export interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    path: string;
    required: boolean;
    order: number;
}

export interface OnboardingAnalyticsEvent {
    eventType: 'onboarding_started' | 'step_completed' | 'step_skipped' | 'onboarding_completed' | 'onboarding_abandoned' | 'onboarding_resumed' | 'flow_switched';
    userId: string;
    flowType: OnboardingFlowType;
    stepId?: string;
    timestamp: string;
    sessionId: string;
    metadata?: Record<string, any>;
}

// Mock step definitions
export const mockUserSteps: OnboardingStep[] = [
    { id: 'welcome', title: 'Welcome', description: 'Welcome to Bayon Coagent', path: '/onboarding/welcome', required: true, order: 0 },
    { id: 'profile', title: 'Profile Setup', description: 'Set up your profile', path: '/onboarding/user/profile', required: true, order: 1 },
    { id: 'tour', title: 'Feature Tour', description: 'Tour of features', path: '/onboarding/user/tour', required: true, order: 2 },
    { id: 'selection', title: 'Hub Selection', description: 'Choose your starting hub', path: '/onboarding/user/selection', required: true, order: 3 },
    { id: 'complete', title: 'Complete', description: 'Onboarding complete', path: '/onboarding/user/complete', required: true, order: 4 },
];

export const mockAdminSteps: OnboardingStep[] = [
    { id: 'admin-welcome', title: 'Admin Welcome', description: 'Welcome admin', path: '/onboarding/admin/overview', required: true, order: 0 },
    { id: 'user-management', title: 'User Management', description: 'Manage users', path: '/onboarding/admin/users-overview', required: true, order: 1 },
    { id: 'analytics', title: 'Analytics', description: 'View analytics', path: '/onboarding/admin/analytics-overview', required: true, order: 2 },
    { id: 'configuration', title: 'Configuration', description: 'Configure platform', path: '/onboarding/admin/config-overview', required: true, order: 3 },
    { id: 'admin-complete', title: 'Admin Complete', description: 'Admin setup complete', path: '/onboarding/admin/complete', required: true, order: 4 },
];

export const getStepsForFlow = (flowType: OnboardingFlowType): OnboardingStep[] => {
    switch (flowType) {
        case 'user':
            return mockUserSteps;
        case 'admin':
            return mockAdminSteps;
        case 'both':
            return [...mockAdminSteps, ...mockUserSteps];
        default:
            return [];
    }
};

export const calculateProgress = (completedSteps: string[], flowType: OnboardingFlowType): number => {
    const steps = getStepsForFlow(flowType);
    const requiredSteps = steps.filter(s => s.required);

    if (requiredSteps.length === 0) return 100;

    const completedRequired = requiredSteps.filter(s => completedSteps.includes(s.id));
    return Math.round((completedRequired.length / requiredSteps.length) * 100);
};