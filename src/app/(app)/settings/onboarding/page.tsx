'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, SkipForward, ArrowRight } from 'lucide-react';
import { ICON_SIZES } from '@/lib/constants/icon-sizes';
import { onboardingService } from '@/services/onboarding/onboarding-service';
import { getStepsForFlow, type OnboardingStep, type OnboardingState } from '@/types/onboarding';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils/common';

/**
 * Onboarding Settings Page
 * 
 * Allows users to access individual onboarding steps after skipping.
 * Displays completion status for each step.
 * 
 * Requirements: 10.5
 */
export default function OnboardingSettingsPage() {
    const isMobile = useIsMobile();
    const [state, setState] = useState<OnboardingState | null>(null);
    const [steps, setSteps] = useState<OnboardingStep[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // TODO: Get actual userId from auth context
    const userId = 'temp-user-id';

    useEffect(() => {
        async function loadOnboardingState() {
            try {
                setIsLoading(true);
                const onboardingState = await onboardingService.getOnboardingState(userId);

                if (onboardingState) {
                    setState(onboardingState);
                    const flowSteps = getStepsForFlow(onboardingState.flowType);
                    setSteps(flowSteps);
                } else {
                    // No onboarding state, show user flow by default
                    const flowSteps = getStepsForFlow('user');
                    setSteps(flowSteps);
                }
            } catch (error) {
                console.error('[ONBOARDING_SETTINGS] Error loading state:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadOnboardingState();
    }, [userId]);

    const getStepStatus = (stepId: string) => {
        if (!state) return 'not_started';
        if (state.completedSteps.includes(stepId)) return 'completed';
        if (state.skippedSteps.includes(stepId)) return 'skipped';
        return 'not_started';
    };

    const getStepIcon = (stepId: string) => {
        const status = getStepStatus(stepId);
        if (status === 'completed') {
            return <CheckCircle2 className={cn("text-success", ICON_SIZES.md)} />;
        }
        if (status === 'skipped') {
            return <SkipForward className={cn("text-muted-foreground", ICON_SIZES.md)} />;
        }
        return <Circle className={cn("text-muted-foreground", ICON_SIZES.md)} />;
    };

    const getStepBadge = (stepId: string) => {
        const status = getStepStatus(stepId);
        if (status === 'completed') {
            return <Badge variant="success">Completed</Badge>;
        }
        if (status === 'skipped') {
            return <Badge variant="secondary">Skipped</Badge>;
        }
        return <Badge variant="outline">Not Started</Badge>;
    };

    if (isLoading) {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="space-y-3 mt-8">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-24 bg-muted rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto px-4 py-8">
            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold font-headline tracking-tight">
                        Onboarding Steps
                    </h1>
                    <p className="text-muted-foreground">
                        Complete or revisit any onboarding step at your own pace.
                    </p>
                </div>

                {/* Completion Status */}
                {state && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Overall Progress</CardTitle>
                            <CardDescription>
                                {state.isComplete
                                    ? 'You have completed the onboarding process!'
                                    : `${state.completedSteps.length} of ${steps.length} steps completed`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${(state.completedSteps.length / steps.length) * 100}%`,
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Steps List */}
                <div className="space-y-3">
                    {steps.map((step, index) => (
                        <Card
                            key={step.id}
                            className={cn(
                                "hover:shadow-md transition-all duration-200",
                                isMobile && "active:scale-[0.98] touch-manipulation"
                            )}
                        >
                            <CardContent className={cn(
                                "p-4 sm:p-6",
                                isMobile && "min-h-[88px]"
                            )}>
                                <div className="flex items-center gap-4">
                                    {/* Step Number & Icon */}
                                    <div className="flex-shrink-0 flex items-center gap-3">
                                        <div className={cn(
                                            "flex items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground",
                                            isMobile ? "w-8 h-8 text-sm" : "w-10 h-10"
                                        )}>
                                            {index + 1}
                                        </div>
                                        {getStepIcon(step.id)}
                                    </div>

                                    {/* Step Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className={cn(
                                                "font-semibold",
                                                isMobile ? "text-base" : "text-lg"
                                            )}>
                                                {step.name}
                                            </h3>
                                            {getStepBadge(step.id)}
                                        </div>
                                        <p className={cn(
                                            "text-muted-foreground",
                                            isMobile ? "text-xs" : "text-sm"
                                        )}>
                                            {step.description}
                                        </p>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex-shrink-0">
                                        <Button
                                            asChild
                                            variant={getStepStatus(step.id) === 'completed' ? 'outline' : 'default'}
                                            size={isMobile ? 'sm' : 'default'}
                                            className={cn(
                                                isMobile && "min-h-[44px] touch-manipulation"
                                            )}
                                        >
                                            <Link href={step.path}>
                                                {getStepStatus(step.id) === 'completed' ? 'Review' : 'Start'}
                                                <ArrowRight className={ICON_SIZES.sm} />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Help Text */}
                <Card className="bg-muted/50">
                    <CardContent className="p-4 sm:p-6">
                        <p className="text-sm text-muted-foreground">
                            <strong>Tip:</strong> You can complete these steps in any order.
                            Your progress is automatically saved, and you can return anytime.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
