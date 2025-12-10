'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { OnboardingContainer } from '@/components/onboarding';
import { LazySkipConfirmationDialog } from '@/components/onboarding/lazy-components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { onboardingService } from '@/services/onboarding/onboarding-service';
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Users,
    UserCheck,
    Activity,
    MessageSquare,
    ArrowRight
} from 'lucide-react';
import { ICON_SIZES } from '@/lib/constants/icon-sizes';
import { cn } from '@/lib/utils/common';

/**
 * Admin User Management Page
 * 
 * Second step in the admin onboarding flow - introduces user management capabilities.
 * 
 * Features:
 * - Overview of user administration features
 * - Key actions highlighted (view users, manage roles, monitor activity, handle support)
 * - Example scenarios for common administrative tasks
 * - Quick action to view user list
 * - Mobile-first responsive design
 * - Analytics tracking
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
export default function AdminUsersPage() {
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
    } = useOnboardingSkip(userId, 'admin-users');

    // Key user management actions
    const keyActions = [
        {
            icon: Users,
            title: 'View All Users',
            description: 'Access a comprehensive list of all platform users with their profiles and activity status.',
            example: 'Quickly find a user by name, email, or brokerage to review their account details.',
        },
        {
            icon: UserCheck,
            title: 'Manage Roles',
            description: 'Assign and modify user roles and permissions to control access to platform features.',
            example: 'Promote a user to admin status or adjust permissions for specific features.',
        },
        {
            icon: Activity,
            title: 'Monitor Activity',
            description: 'Track user engagement, feature usage, and login history to understand platform adoption.',
            example: 'Identify inactive users who may need re-engagement or support.',
        },
        {
            icon: MessageSquare,
            title: 'Handle Support',
            description: 'Manage support tickets, respond to user feedback, and resolve account issues.',
            example: 'Review and respond to user-reported bugs or feature requests.',
        },
    ];

    /**
     * Handle next button click
     * Requirement 12.4: Navigate to analytics overview
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
            // Mark admin users step as completed
            await onboardingService.completeStep(userId, 'admin-users');

            // Track analytics
            await onboardingAnalytics.trackStepCompleted(
                userId,
                'admin',
                'admin-users'
            );

            // Navigate to next step (analytics)
            router.push('/onboarding/admin/analytics-overview');
        } catch (error) {
            console.error('[ADMIN_USERS] Error proceeding to next step:', error);
            toast({
                title: 'Error',
                description: 'Failed to proceed. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle quick action to view user list
     * Requirement 12.5: Navigate to user management page with contextual tooltips
     */
    const handleViewUsers = () => {
        router.push('/admin/users?onboarding=true');
    };

    return (
        <>
            <OnboardingContainer
                currentStep={2}
                totalSteps={5}
                stepId="admin-users"
                title="User Management"
                description="Learn how to effectively oversee and manage platform users."
                onNext={handleNext}
                onSkip={openSkipDialog}
                nextLabel="Continue"
                isLoading={isLoading}
            >
                <div className="space-y-6">
                    {/* Key Actions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {keyActions.map((action) => (
                            <Card key={action.title} className="border-border/50">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center",
                                            isMobile ? "w-10 h-10" : "w-12 h-12"
                                        )}>
                                            <action.icon
                                                className={cn(
                                                    "text-primary",
                                                    isMobile ? ICON_SIZES.sm : ICON_SIZES.md
                                                )}
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className={cn(
                                                isMobile ? "text-base" : "text-lg"
                                            )}>
                                                {action.title}
                                            </CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <CardDescription className={cn(
                                        isMobile ? "text-xs" : "text-sm"
                                    )}>
                                        {action.description}
                                    </CardDescription>
                                    <div className="pt-2 border-t border-border/50">
                                        <p className={cn(
                                            "text-muted-foreground italic",
                                            isMobile ? "text-xs" : "text-sm"
                                        )}>
                                            <span className="font-medium text-foreground">Example: </span>
                                            {action.example}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Quick Action CTA */}
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-1">
                                        Ready to explore?
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        View the user management page to see these features in action.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleViewUsers}
                                    variant="default"
                                    className="w-full sm:w-auto"
                                >
                                    View User List
                                    <ArrowRight className={cn("ml-2", ICON_SIZES.sm)} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
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
