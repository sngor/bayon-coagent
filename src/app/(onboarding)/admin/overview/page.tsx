'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { OnboardingContainer } from '@/components/onboarding';
import { LazySkipConfirmationDialog } from '@/components/onboarding/lazy-components';
import { WelcomeCard } from '@/components/onboarding/welcome-card';
import { onboardingService } from '@/services/onboarding/onboarding-service';
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Users,
    BarChart3,
    Settings,
    Shield
} from 'lucide-react';

/**
 * Admin Overview Page
 * 
 * First step in the admin onboarding flow - introduces admin features.
 * 
 * Features:
 * - Admin-specific welcome screen highlighting platform management capabilities
 * - Overview of admin features (user management, analytics, system health, configuration)
 * - Clear call-to-action to begin admin setup
 * - Skip option with state preservation
 * - Mobile-first responsive design
 * - Analytics tracking
 * 
 * Requirements: 11.2, 11.3, 11.4, 11.5
 */
export default function AdminOverviewPage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [isLoading, setIsLoading] = useState(false);

    const userId = user?.id || '';

    const {
        showSkipDialog,
        isSkipping,
        openSkipDialog,
        closeSkipDialog,
        handleSkipConfirm,
    } = useOnboardingSkip(userId, 'admin-welcome');

    // Admin features organized by category
    const adminFeatures = [
        {
            icon: Users,
            name: 'User Management',
            description: 'Oversee and manage platform users',
            features: [
                'View all users and their activity',
                'Manage user roles and permissions',
                'Monitor user engagement metrics',
                'Handle support tickets and user issues'
            ],
        },
        {
            icon: BarChart3,
            name: 'Analytics & Monitoring',
            description: 'Track system health and user engagement',
            features: [
                'Real-time system health monitoring',
                'User engagement and feature usage metrics',
                'CloudWatch dashboards and custom reports',
                'Error tracking and performance metrics'
            ],
        },
        {
            icon: Settings,
            name: 'Platform Configuration',
            description: 'Customize system settings and features',
            features: [
                'Feature toggles and A/B testing',
                'Maintenance mode management',
                'Announcement system for user communications',
                'Email notification configuration'
            ],
        },
        {
            icon: Shield,
            name: 'Security & Compliance',
            description: 'Ensure platform security and data protection',
            features: [
                'API key management and rotation',
                'Audit logging for compliance',
                'User access control and permissions',
                'Data privacy and security settings'
            ],
        },
    ];

    /**
     * Handle next button click
     * Requirement 11.2: Navigate to user management intro
     */
    const handleNext = async () => {
        if (!userId) {
            toast({
                title: 'Error',
                description: 'User not authenticated. Please sign in again.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            // Mark admin welcome step as completed
            await onboardingService.completeStep(userId, 'admin-welcome');

            // Track analytics
            await onboardingAnalytics.trackStepCompleted(
                userId,
                'admin',
                'admin-welcome'
            );

            // Navigate to next step (user management)
            router.push('/onboarding/admin/users-overview');
        } catch (error) {
            console.error('[ADMIN_OVERVIEW] Error proceeding to next step:', error);
            toast({
                title: 'Error',
                description: 'Failed to proceed. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <OnboardingContainer
                currentStep={1}
                totalSteps={5}
                stepId="admin-welcome"
                title="Welcome to Admin Dashboard"
                description="Manage your platform with powerful admin tools. Let's explore what you can do."
                onNext={handleNext}
                onSkip={openSkipDialog}
                nextLabel="Explore Admin Features"
                isLoading={isLoading}
            >
                {/* Responsive grid: 1 column on mobile, 2 on tablet+ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    {adminFeatures.map((feature) => (
                        <WelcomeCard
                            key={feature.name}
                            icon={feature.icon}
                            name={feature.name}
                            description={feature.description}
                            features={feature.features}
                        />
                    ))}
                </div>

                {/* Additional context for mobile users */}
                {isMobile && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground text-center">
                            Swipe through the cards above to explore all admin features
                        </p>
                    </div>
                )}
            </OnboardingContainer>

            {/* Skip confirmation dialog */}
            {showSkipDialog && (
                <LazySkipConfirmationDialog
                    open={showSkipDialog}
                    onOpenChange={closeSkipDialog}
                    onConfirm={handleSkipConfirm}
                    isLoading={isSkipping}
                />
            )}
        </>
    );
}
