'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { OnboardingContainer } from '@/components/onboarding';
import { FlowChoiceCard } from '@/components/onboarding/flow-choice-card';
import { onboardingService } from '@/services/onboarding/onboarding-service';
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';
import {
    detectOnboardingFlow,
    getFlowChoiceOptions,
    type FlowChoiceOption,
} from '@/services/onboarding/role-detection';
import { useToast } from '@/hooks/use-toast';
import type { OnboardingFlowType } from '@/types/onboarding';

/**
 * Flow Choice Page
 * 
 * Allows users with both admin and user roles to choose which onboarding flow(s) to complete.
 * 
 * Features:
 * - Display flow options with descriptions
 * - Recommend "both" flows for dual role users
 * - Initialize onboarding with selected flow type
 * - Navigate to first step of selected flow
 * 
 * Requirements: 15.2
 */
export default function FlowChoicePage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedFlow, setSelectedFlow] = useState<OnboardingFlowType | null>(null);
    const [flowOptions, setFlowOptions] = useState<FlowChoiceOption[]>([]);
    const [isDualRole, setIsDualRole] = useState(false);

    const userId = user?.id || '';

    // Load role detection and flow options
    useEffect(() => {
        const loadRoleInfo = async () => {
            if (!userId) return;

            try {
                setIsLoading(true);

                // Detect user roles
                const roleDetection = await detectOnboardingFlow(userId);
                setIsDualRole(roleDetection.isDualRole);

                // If not dual role, redirect to welcome
                if (!roleDetection.isDualRole) {
                    console.log('[FLOW_CHOICE] User is not dual role, redirecting to welcome');
                    router.push('/onboarding/welcome');
                    return;
                }

                // Get flow choice options
                const options = getFlowChoiceOptions();
                setFlowOptions(options);

                // Pre-select recommended option (both)
                const recommended = options.find(opt => opt.recommended);
                if (recommended) {
                    setSelectedFlow(recommended.flowType);
                }
            } catch (error) {
                console.error('[FLOW_CHOICE] Error loading role info:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load flow options. Please try again.',
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadRoleInfo();
    }, [userId, router, toast]);

    /**
     * Handle flow selection
     */
    const handleFlowSelect = (flowType: OnboardingFlowType) => {
        setSelectedFlow(flowType);
    };

    /**
     * Handle next button click
     * Initialize onboarding with selected flow and navigate to first step
     */
    const handleNext = async () => {
        if (!userId || !selectedFlow) {
            toast({
                title: 'Error',
                description: 'Please select a flow option to continue.',
                variant: 'destructive',
            });
            return;
        }

        setIsSelecting(true);

        try {
            // Initialize onboarding with selected flow type
            const state = await onboardingService.initializeOnboarding(userId, selectedFlow);

            // Track analytics
            await onboardingAnalytics.trackOnboardingStarted(userId, selectedFlow);

            // Navigate to first step based on flow type
            if (selectedFlow === 'both' || selectedFlow === 'admin') {
                // Admin flow comes first for both
                router.push('/onboarding/admin/overview');
            } else {
                // User flow
                router.push('/onboarding/welcome');
            }
        } catch (error) {
            console.error('[FLOW_CHOICE] Error initializing onboarding:', error);
            toast({
                title: 'Error',
                description: 'Failed to start onboarding. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSelecting(false);
        }
    };

    if (isLoading) {
        return (
            <OnboardingContainer
                currentStep={0}
                totalSteps={1}
                stepId="flow-choice"
                title="Choose Your Onboarding Path"
                description="Loading your options..."
                showProgress={false}
            >
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </OnboardingContainer>
        );
    }

    if (!isDualRole) {
        return null; // Will redirect in useEffect
    }

    return (
        <OnboardingContainer
            currentStep={0}
            totalSteps={1}
            stepId="flow-choice"
            title="Choose Your Onboarding Path"
            description="You have both admin and user access. Choose how you'd like to experience the platform."
            onNext={handleNext}
            nextLabel="Continue"
            isLoading={isSelecting}
            allowSkip={false}
            showProgress={false}
        >
            <div className="space-y-4">
                {flowOptions.map((option) => (
                    <FlowChoiceCard
                        key={option.flowType}
                        option={option}
                        selected={selectedFlow === option.flowType}
                        onSelect={() => handleFlowSelect(option.flowType)}
                    />
                ))}
            </div>

            {/* Additional context */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                    <strong>Recommended:</strong> Complete both flows to fully understand the platform from both perspectives.
                    Admin onboarding will be presented first, followed by the user onboarding.
                </p>
            </div>
        </OnboardingContainer>
    );
}
