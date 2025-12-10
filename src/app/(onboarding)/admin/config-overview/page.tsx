'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { OnboardingContainer } from '@/components/onboarding';
import { LazySkipConfirmationDialog } from '@/components/onboarding/lazy-components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { onboardingService } from '@/services/onboarding/onboarding-service';
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Settings,
    ToggleLeft,
    Wrench,
    Megaphone,
    Mail,
    ArrowRight,
    AlertCircle
} from 'lucide-react';
import { ICON_SIZES } from '@/lib/constants/icon-sizes';
import { cn } from '@/lib/utils/common';

/**
 * Admin Configuration Page
 * 
 * Fourth step in the admin onboarding flow - introduces platform configuration.
 * 
 * Features:
 * - Overview of configurable platform settings
 * - Critical settings highlighted (feature toggles, maintenance mode, announcements, email)
 * - Indication of settings requiring immediate attention
 * - Navigation to platform configuration page
 * - Guidance on safe configuration practices
 * - Mobile-first responsive design
 * - Analytics tracking
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */
export default function AdminConfigPage() {
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
    } = useOnboardingSkip(userId, 'admin-config');

    // Configuration categories
    const configCategories = [
        {
            icon: ToggleLeft,
            title: 'Feature Toggles',
            description: 'Enable or disable features without code deployment',
            settings: [
                'A/B testing for new features',
                'Gradual rollout controls',
                'Emergency feature disable',
                'Beta feature access'
            ],
            priority: 'medium',
            requiresAttention: false,
        },
        {
            icon: Wrench,
            title: 'Maintenance Mode',
            description: 'Control platform availability during updates',
            settings: [
                'Enable/disable maintenance mode',
                'Custom maintenance messages',
                'Scheduled maintenance windows',
                'Admin-only access during maintenance'
            ],
            priority: 'high',
            requiresAttention: false,
        },
        {
            icon: Megaphone,
            title: 'Announcement System',
            description: 'Communicate important updates to users',
            settings: [
                'Create platform-wide announcements',
                'Schedule announcement visibility',
                'Target specific user groups',
                'Track announcement engagement'
            ],
            priority: 'medium',
            requiresAttention: false,
        },
        {
            icon: Mail,
            title: 'Email Notifications',
            description: 'Configure automated email communications',
            settings: [
                'Email template customization',
                'Notification frequency settings',
                'User preference management',
                'Email delivery monitoring'
            ],
            priority: 'high',
            requiresAttention: true,
        },
    ];

    // Best practices
    const bestPractices = [
        'Always test configuration changes in a staging environment first',
        'Document all configuration changes with reasons and timestamps',
        'Use feature toggles for gradual rollouts to minimize risk',
        'Monitor system metrics after making configuration changes',
        'Keep a backup of critical configuration settings',
    ];

    /**
     * Handle next button click
     * Requirement 14.4: Navigate to completion screen
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
            // Mark admin config step as completed
            await onboardingService.completeStep(userId, 'admin-config');

            // Track analytics
            await onboardingAnalytics.trackStepCompleted(
                userId,
                'admin',
                'admin-config'
            );

            // Navigate to completion screen
            router.push('/onboarding/admin/complete');
        } catch (error) {
            console.error('[ADMIN_CONFIG] Error proceeding to next step:', error);
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
     * Handle navigation to configuration page
     * Requirement 14.5: Navigate to platform configuration page
     */
    const handleViewConfig = () => {
        router.push('/admin/config?onboarding=true');
    };

    const getPriorityBadge = (priority: string) => {
        if (priority === 'high') {
            return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
        }
        return <Badge variant="secondary" className="text-xs">Medium Priority</Badge>;
    };

    return (
        <>
            <OnboardingContainer
                currentStep={4}
                totalSteps={5}
                stepId="admin-config"
                title="Platform Configuration"
                description="Customize system settings to match your platform needs."
                onNext={handleNext}
                onSkip={openSkipDialog}
                nextLabel="Continue"
                isLoading={isLoading}
            >
                <div className="space-y-6">
                    {/* Configuration Categories */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Configuration Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {configCategories.map((category) => (
                                <Card
                                    key={category.title}
                                    className={cn(
                                        "border-border/50",
                                        category.requiresAttention && "border-amber-500/50 bg-amber-500/5"
                                    )}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center",
                                                    isMobile ? "w-10 h-10" : "w-12 h-12"
                                                )}>
                                                    <category.icon
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
                                                        {category.title}
                                                    </CardTitle>
                                                </div>
                                            </div>
                                            {getPriorityBadge(category.priority)}
                                        </div>
                                        <CardDescription className={cn(
                                            isMobile ? "text-xs" : "text-sm"
                                        )}>
                                            {category.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {category.requiresAttention && (
                                            <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-2">
                                                <AlertCircle className={cn("text-amber-600 flex-shrink-0 mt-0.5", ICON_SIZES.sm)} />
                                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                                    Requires immediate attention
                                                </p>
                                            </div>
                                        )}
                                        <ul className="space-y-2">
                                            {category.settings.map((setting, index) => (
                                                <li
                                                    key={index}
                                                    className={cn(
                                                        "flex items-start gap-2 text-muted-foreground",
                                                        isMobile ? "text-xs" : "text-sm"
                                                    )}
                                                >
                                                    <span
                                                        className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="flex-1">{setting}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Best Practices */}
                    <Card className="border-blue-500/20 bg-blue-500/5">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Settings className={ICON_SIZES.md} />
                                Safe Configuration Practices
                            </CardTitle>
                            <CardDescription>
                                Follow these guidelines to ensure safe and effective configuration management
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {bestPractices.map((practice, index) => (
                                    <li
                                        key={index}
                                        className={cn(
                                            "flex items-start gap-2",
                                            isMobile ? "text-xs" : "text-sm"
                                        )}
                                    >
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-semibold mt-0.5">
                                            {index + 1}
                                        </span>
                                        <span className="flex-1 text-foreground">{practice}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Quick Action CTA */}
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-1">
                                        Ready to configure?
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Access the platform configuration page to customize settings.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleViewConfig}
                                    variant="default"
                                    className="w-full sm:w-auto"
                                >
                                    View Configuration
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
