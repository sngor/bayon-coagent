'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { OnboardingContainer } from '@/components/onboarding';
import { LazySkipConfirmationDialog } from '@/components/onboarding/lazy-components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { onboardingService } from '@/services/onboarding/onboarding-service';
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';
import { useOnboardingSkip } from '@/hooks/use-onboarding-skip';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    TrendingUp,
    Activity,
    Zap,
    AlertTriangle,
    BarChart3,
    PieChart,
    LineChart,
    ExternalLink
} from 'lucide-react';
import { ICON_SIZES } from '@/lib/constants/icon-sizes';
import { cn } from '@/lib/utils/common';

/**
 * Admin Analytics Page
 * 
 * Third step in the admin onboarding flow - introduces analytics and monitoring.
 * 
 * Features:
 * - Overview of available analytics and monitoring tools
 * - Key metrics highlighted (user engagement, system health, feature usage, error rates)
 * - Explanation of CloudWatch dashboards and custom reports
 * - Links to detailed analytics documentation
 * - Mobile-first responsive design
 * - Analytics tracking
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */
export default function AdminAnalyticsPage() {
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
    } = useOnboardingSkip(userId, 'admin-analytics');

    // Key metrics categories
    const metricsCategories = [
        {
            icon: TrendingUp,
            title: 'User Engagement',
            description: 'Track how users interact with the platform',
            metrics: [
                'Daily/Weekly/Monthly Active Users',
                'Session duration and frequency',
                'Feature adoption rates',
                'User retention and churn'
            ],
            badge: 'Core Metric',
        },
        {
            icon: Activity,
            title: 'System Health',
            description: 'Monitor platform performance and reliability',
            metrics: [
                'API response times',
                'Database query performance',
                'Service uptime and availability',
                'Resource utilization (CPU, memory)'
            ],
            badge: 'Critical',
        },
        {
            icon: Zap,
            title: 'Feature Usage',
            description: 'Understand which features drive value',
            metrics: [
                'Most used hubs and features',
                'Content creation volume',
                'AI model usage patterns',
                'Integration activity'
            ],
            badge: 'Insights',
        },
        {
            icon: AlertTriangle,
            title: 'Error Rates',
            description: 'Identify and resolve issues quickly',
            metrics: [
                'Error frequency by type',
                'Failed API requests',
                'User-reported issues',
                'System exceptions and warnings'
            ],
            badge: 'Monitoring',
        },
    ];

    // Analytics tools
    const analyticsTools = [
        {
            icon: BarChart3,
            name: 'CloudWatch Dashboards',
            description: 'Real-time metrics visualization with customizable widgets',
        },
        {
            icon: PieChart,
            name: 'Custom Reports',
            description: 'Generate detailed reports for specific time periods and metrics',
        },
        {
            icon: LineChart,
            name: 'Trend Analysis',
            description: 'Identify patterns and trends in user behavior and system performance',
        },
    ];

    /**
     * Handle next button click
     * Requirement 13.4: Navigate to configuration overview
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
            // Mark admin analytics step as completed
            await onboardingService.completeStep(userId, 'admin-analytics');

            // Track analytics
            await onboardingAnalytics.trackStepCompleted(
                userId,
                'admin',
                'admin-analytics'
            );

            // Navigate to next step (configuration)
            router.push('/onboarding/admin/config-overview');
        } catch (error) {
            console.error('[ADMIN_ANALYTICS] Error proceeding to next step:', error);
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
                currentStep={3}
                totalSteps={5}
                stepId="admin-analytics"
                title="Analytics & Monitoring"
                description="Track system health and user engagement with powerful analytics tools."
                onNext={handleNext}
                onSkip={openSkipDialog}
                nextLabel="Continue"
                isLoading={isLoading}
            >
                <div className="space-y-6">
                    {/* Key Metrics Grid */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {metricsCategories.map((category) => (
                                <Card key={category.title} className="border-border/50">
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
                                            <Badge variant="secondary" className="text-xs">
                                                {category.badge}
                                            </Badge>
                                        </div>
                                        <CardDescription className={cn(
                                            isMobile ? "text-xs" : "text-sm"
                                        )}>
                                            {category.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {category.metrics.map((metric, index) => (
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
                                                    <span className="flex-1">{metric}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Analytics Tools */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Analytics Tools</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {analyticsTools.map((tool) => (
                                <Card key={tool.name} className="border-border/50">
                                    <CardContent className="p-4">
                                        <div className="flex flex-col items-center text-center space-y-3">
                                            <div className={cn(
                                                "rounded-lg bg-primary/10 flex items-center justify-center",
                                                isMobile ? "w-12 h-12" : "w-14 h-14"
                                            )}>
                                                <tool.icon
                                                    className={cn(
                                                        "text-primary",
                                                        ICON_SIZES.md
                                                    )}
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            <div>
                                                <h4 className={cn(
                                                    "font-semibold mb-1",
                                                    isMobile ? "text-sm" : "text-base"
                                                )}>
                                                    {tool.name}
                                                </h4>
                                                <p className={cn(
                                                    "text-muted-foreground",
                                                    isMobile ? "text-xs" : "text-sm"
                                                )}>
                                                    {tool.description}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Documentation Link */}
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-1">
                                        Need more details?
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Access comprehensive analytics documentation for detailed guides and best practices.
                                    </p>
                                </div>
                                <a
                                    href="/docs/admin/analytics"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                                >
                                    View Documentation
                                    <ExternalLink className={ICON_SIZES.sm} />
                                </a>
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
