
'use client';

import Image from 'next/image';
import { useMemo, useActionState, useEffect, useState, useTransition, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { InvitationBanner } from '@/components/invitation-banner';
import { Typewriter, LoadingDots, SuccessAnimation, StaggeredText, GradientText } from '@/components/ui/text-animations';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import '@/styles/text-animations.css';
import {
    ContentSection,
    DataGrid,
    StatCard,
    LoadingSection,
    EmptySection,
    ActionBar,
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from '@/components/ui';
import { StandardEmptyState } from '@/components/ui/reusable';
import { LoadingState } from '@/components/ui/loading-state';


import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Star,
    Award,
    TrendingUp,
    ArrowRight,
    MessageSquare,
    PenTool,
    Search,
    Calculator,
    Users,
    Target,
    Zap,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    Activity,

    Sparkles,
    Megaphone
} from 'lucide-react';
import {
    ContentIcon,
    AISparkleIcon,
} from '@/components/ui/real-estate-icons';
import { useUser } from '@/aws/auth';
import { ProfileCompletionBanner } from '@/components/profile-completion-banner';
import { SuggestedNextSteps } from '@/components/suggested-next-steps';
import { getSuggestedNextActions } from '@/hooks/use-profile-completion';
import type { Review, Profile, MarketingPlan, MarketingTask, BrandAudit, Competitor as CompetitorType } from '@/lib/types/common';

import { toast } from '@/hooks/use-toast';
import { getDashboardData } from './actions';
import { DashboardQuickActions } from '@/components/dashboard-quick-actions';
import { DashboardWorkflowSection } from '@/components/dashboard-workflow-section';
import { getUserWorkflowInstances } from '@/app/workflow-actions';
import { WorkflowStatus } from '@/types/workflows';
import { ProactiveSuggestionsPanel } from '@/components/enhanced-agents';




export default function DashboardPage() {
    const { user } = useUser();
    const [isBannerDismissed, setIsBannerDismissed] = useState(false);


    // Dashboard data state
    const [dashboardData, setDashboardData] = useState<{
        agentProfile: any;
        allReviews: any[];
        recentReviews: any[];
        latestPlan: any;
        brandAudit: any;
        competitors: any[];
        announcements: any[];
    } | null>(null);
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
    const [dashboardError, setDashboardError] = useState<string | null>(null);

    // Workflow instances state
    const [workflowInstances, setWorkflowInstances] = useState<any[]>([]);
    const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);

    // Load dismissed banner state from localStorage
    useEffect(() => {
        if (!user) return;

        const dismissedKey = `profile-banner-dismissed-${user.id}`;
        const dismissed = localStorage.getItem(dismissedKey) === 'true';
        setIsBannerDismissed(dismissed);
    }, [user]);

    // Fetch dashboard data
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoadingDashboard(true);
            const result = await getDashboardData(user.id);

            if (result.success && result.data) {
                setDashboardData({
                    agentProfile: result.data.agentProfile,
                    allReviews: result.data.allReviews,
                    recentReviews: result.data.recentReviews,
                    latestPlan: result.data.latestPlan,
                    brandAudit: result.data.brandAudit,
                    competitors: result.data.competitors,
                    announcements: result.data.announcements || [],
                });
            } else {
                setDashboardError(result.error || 'Failed to load dashboard');
            }
            setIsLoadingDashboard(false);
        };

        fetchData();
    }, [user]);

    // Fetch workflow instances
    useEffect(() => {
        if (!user) return;

        const fetchWorkflows = async () => {
            setIsLoadingWorkflows(true);
            try {
                // Fetch all workflow instances (no filter to get all statuses)
                const result = await getUserWorkflowInstances();

                if (result.message === 'success' && result.data) {
                    // Filter out archived workflows
                    const filteredInstances = result.data.filter(
                        instance => instance.status !== WorkflowStatus.ARCHIVED
                    );
                    setWorkflowInstances(filteredInstances);
                }
            } catch (error) {
                console.error('Error fetching workflow instances:', error);
            } finally {
                setIsLoadingWorkflows(false);
            }
        };

        fetchWorkflows();
    }, [user]);

    // Extract data from state
    const agentProfile = dashboardData?.agentProfile || null;
    const allReviews = dashboardData?.allReviews || [];
    const recentReviews = dashboardData?.recentReviews || [];
    const latestPlanData = dashboardData?.latestPlan ? [dashboardData.latestPlan] : [];
    const brandAuditData = dashboardData?.brandAudit || null;
    const competitorsData = dashboardData?.competitors || [];

    // Loading states
    const isLoadingProfile = isLoadingDashboard;
    const isLoadingAllReviews = isLoadingDashboard;
    const isLoadingRecentReviews = isLoadingDashboard;
    const isPlanLoading = isLoadingDashboard;
    const isAuditLoading = isLoadingDashboard;
    const areCompetitorsLoading = isLoadingDashboard;



    const { averageRating, totalReviews, recentReviewsCount } = useMemo(() => {
        if (!allReviews || allReviews.length === 0) return { averageRating: '0.0', totalReviews: 0, recentReviewsCount: 0 };

        const total = allReviews.reduce((acc, review) => acc + review.rating, 0);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recent = allReviews.filter(review => new Date(review.date) > thirtyDaysAgo).length;

        return {
            averageRating: (total / allReviews.length).toFixed(1),
            totalReviews: allReviews.length,
            recentReviewsCount: recent,
        };
    }, [allReviews]);

    // Parsed rating for display
    const parsedAverageRating = useMemo(() => parseFloat(averageRating), [averageRating]);

    // Plan steps count for display
    const planStepsCount = useMemo(() => {
        return latestPlanData.length > 0 ? latestPlanData[0].steps.length : 0;
    }, [latestPlanData]);

    const isLoadingStats = isLoadingAllReviews;
    const isLoadingCarousel = isLoadingRecentReviews;

    // Calculate suggested next steps
    const suggestedSteps = useMemo(() => {
        return getSuggestedNextActions(
            agentProfile,
            !!(latestPlanData && latestPlanData.length > 0),
            !!brandAuditData,
            !!(competitorsData && competitorsData.length > 0)
        );
    }, [agentProfile, latestPlanData, brandAuditData, competitorsData]);

    // Get time-based greeting
    const getTimeOfDayGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const firstName = agentProfile?.name ? agentProfile.name.split(' ')[0] : null;

    // Calculate completion percentage for progress tracking (matching ProfileCompletionBanner logic)
    const completionPercentage = useMemo(() => {
        if (!agentProfile) return 0;

        const profileFields = [
            { key: 'name', required: true },
            { key: 'agencyName', required: true },
            { key: 'phone', required: true },
            { key: 'address', required: true },
            { key: 'bio', required: true },
            { key: 'yearsOfExperience', required: false },
            { key: 'licenseNumber', required: false },
            { key: 'website', required: false },
            { key: 'photoURL', required: false },
        ];

        const completed = profileFields.filter((field) => {
            const value = agentProfile[field.key as keyof Profile];
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            if (typeof value === 'string') {
                return value.trim() !== '';
            }
            if (typeof value === 'number') {
                return value > 0;
            }
            return !!value;
        });

        return Math.round((completed.length / profileFields.length) * 100);
    }, [agentProfile]);

    // Handle banner dismiss
    const handleBannerDismiss = useCallback(() => {
        if (!user) return;

        const dismissedKey = `profile-banner-dismissed-${user.id}`;
        localStorage.setItem(dismissedKey, 'true');
        setIsBannerDismissed(true);

        toast({
            title: "Banner dismissed",
            description: "You can always complete your profile later from the Brand section.",
        });
    }, [user]);

    // Auto-clear dismissed state and show congratulations when profile is complete
    useEffect(() => {
        if (!user || !agentProfile) return;

        if (completionPercentage === 100) {
            const dismissedKey = `profile-banner-dismissed-${user.id}`;
            const wasEverDismissed = localStorage.getItem(dismissedKey) === 'true';

            // Clear the dismissed state since profile is now complete
            localStorage.removeItem(dismissedKey);
            setIsBannerDismissed(false);

            // Show congratulations toast if this is the first time reaching 100%
            const congratulatedKey = `profile-completed-${user.id}`;
            const hasBeenCongratulated = localStorage.getItem(congratulatedKey) === 'true';

            if (!hasBeenCongratulated) {
                localStorage.setItem(congratulatedKey, 'true');
                toast({
                    title: "🎉 Profile Complete!",
                    description: "Your profile is now complete and all AI features are unlocked!",
                });
            }
        }
    }, [user, agentProfile, completionPercentage]);



    // Show error state if dashboard failed to load
    if (dashboardError && !dashboardData) {
        return (
            <div className="space-y-6">
                <div className="rounded-lg border bg-card text-card-foreground shadow-lg p-6">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Unable to Load Dashboard</h3>
                        <p className="text-muted-foreground mb-4">{dashboardError}</p>
                        <Button onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }



    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
                <InvitationBanner />

                {/* Welcome Message for New Users */}
                {!isLoadingProfile && completionPercentage < 100 && (
                    <div className="animate-fade-in-up animate-delay-50">
                        <Card className="relative overflow-hidden border-primary/20 shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-gradient-to-br from-primary/5 via-purple-500/5 to-background">
                            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
                            <div className="relative flex flex-col md:flex-row items-start gap-6 p-6 md:p-8 z-10">
                                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-purple-700 flex items-center justify-center shadow-xl ring-4 ring-primary/10">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-2xl mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                        Welcome to Bayon Coagent! 🎉
                                    </h3>
                                    <p className="text-muted-foreground mb-6 text-base leading-relaxed">
                                        You're {completionPercentage}% of the way there. Complete your profile to unlock personalized AI strategies, market insights, and powerful content creation tools.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button asChild size="lg" className="shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
                                            <Link href="/brand/profile">
                                                <Target className="w-5 h-5 mr-2" />
                                                Complete Your Profile
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="lg" asChild className="bg-background/50 backdrop-blur-sm hover:bg-background/80 shadow-sm hover:shadow-md transition-all duration-300">
                                            <Link href="/assistant">
                                                <MessageSquare className="w-5 h-5 mr-2" />
                                                Get Help from AI
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Profile Completion Banner */}
                {agentProfile && completionPercentage >= 50 && completionPercentage < 100 && !isBannerDismissed && (
                    <div className="animate-fade-in-up animate-delay-100">
                        <ProfileCompletionBanner
                            profile={agentProfile}
                            onDismiss={handleBannerDismiss}
                        />
                    </div>
                )}



                {/* Show Profile Completion Button (when banner is dismissed) */}
                {agentProfile && completionPercentage >= 50 && completionPercentage < 100 && isBannerDismissed && (
                    <div className="animate-fade-in-up animate-delay-100">
                        <div className="group relative overflow-hidden flex items-center justify-between p-4 bg-gradient-to-r from-muted/40 via-muted/30 to-muted/40 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/5 hover:via-primary/3 hover:to-primary/5 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Target className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Profile {completionPercentage}% complete</p>
                                    <p className="text-xs text-muted-foreground">Complete your profile to unlock more features</p>
                                </div>
                            </div>
                            <div className="relative flex items-center gap-3">
                                <Button variant="outline" size="sm" asChild className="shadow-sm">
                                    <Link href="/brand/profile">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Complete Profile
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (!user) return;
                                        const dismissedKey = `profile-banner-dismissed-${user.id}`;
                                        localStorage.removeItem(dismissedKey);
                                        setIsBannerDismissed(false);
                                    }}
                                    className="text-xs hover:bg-primary/10"
                                >
                                    Show Details
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="animate-fade-in-up animate-delay-100">
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/30 overflow-hidden" role="region" aria-label="Quick Actions">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
                        <CardContent className="relative p-6 z-10">
                            <DashboardQuickActions />
                        </CardContent>
                    </Card>
                </div>

                {/* Guided Workflows */}
                {user && (
                    <div className="animate-fade-in-up animate-delay-150">
                        <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-purple-500/5 overflow-hidden" role="region" aria-label="Guided Workflows">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/5 to-transparent rounded-full blur-3xl" />
                            <CardContent className="relative p-6 z-10">
                                {isLoadingWorkflows ? (
                                    <LoadingState variant="dashboard" count={2} />
                                ) : (
                                    <DashboardWorkflowSection
                                        userId={user.id}
                                        initialInstances={workflowInstances}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                <DataGrid columns={3} className="orientation-transition gap-6 md:gap-8">
                    <div className="col-span-3 tablet:col-span-2 lg:col-span-2 space-y-6 md:space-y-8">

                        {/* Performance Overview */}
                        <Card className="animate-fade-in-up animate-delay-150 border-0 shadow-xl bg-gradient-to-br from-card to-muted/20 overflow-hidden" role="region" aria-label="Performance Overview">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-3xl" />
                            <CardContent className="relative p-6 z-10">
                                <ContentSection
                                    title="Performance Overview"
                                    description="Track your progress and key metrics"
                                    icon={Activity}
                                    className="bg-gradient-to-br to-muted/20"
                                >
                                    {isLoadingProfile ? (
                                        <LoadingState variant="dashboard" count={1} className="mb-4" />
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Profile Completion Card */}
                                            <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 via-purple-500/5 to-background p-6">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-3xl" />
                                                <div className="relative space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                                                                <Target className="w-5 h-5 text-white" />
                                                            </div>
                                                            <span className="font-semibold text-lg">Profile Completion</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                                                {completionPercentage}%
                                                            </span>
                                                            {completionPercentage === 100 && (
                                                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="relative">
                                                        <Progress value={completionPercentage} className="h-3 bg-muted/50" />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                            {completionPercentage === 100 ? (
                                                                <>
                                                                    <Sparkles className="w-4 h-4 text-green-500" />
                                                                    All features unlocked!
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <AlertCircle className="w-4 h-4 text-primary" />
                                                                    {9 - Math.ceil((completionPercentage / 100) * 9)} fields remaining
                                                                </>
                                                            )}
                                                        </p>
                                                        {completionPercentage < 100 && (
                                                            <Button variant="ghost" size="sm" asChild className="text-xs">
                                                                <Link href="/brand/profile">
                                                                    Complete Now
                                                                    <ArrowRight className="w-3 h-3 ml-1" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Key Metrics Grid */}
                                            <DataGrid columns={3} gap="spacious">
                                                <div className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all duration-300 p-5">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="relative">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <Badge variant="secondary" className="text-xs">Active</Badge>
                                                        </div>
                                                        <div className="text-3xl font-bold mb-1">{planStepsCount}</div>
                                                        <div className="text-sm font-medium mb-1">Strategy Tasks</div>
                                                        <div className="text-xs text-muted-foreground">In your marketing plan</div>
                                                    </div>
                                                </div>

                                                <div className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all duration-300 p-5">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="relative">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                                                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                            </div>
                                                            <Badge variant="secondary" className="text-xs">Tracking</Badge>
                                                        </div>
                                                        <div className="text-3xl font-bold mb-1">{competitorsData.length}</div>
                                                        <div className="text-sm font-medium mb-1">Competitors</div>
                                                        <div className="text-xs text-muted-foreground">Being monitored</div>
                                                    </div>
                                                </div>

                                                <div className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all duration-300 p-5">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="relative">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                                                <Search className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                            </div>
                                                            <Badge
                                                                variant={brandAuditData ? "default" : "outline"}
                                                                className="text-xs"
                                                            >
                                                                {brandAuditData ? 'Done' : 'Pending'}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-3xl font-bold mb-1">
                                                            {brandAuditData ? '✓' : '—'}
                                                        </div>
                                                        <div className="text-sm font-medium mb-1">Brand Audit</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {brandAuditData ? 'Completed' : 'Not started'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </DataGrid>
                                        </div>
                                    )}
                                </ContentSection>
                            </CardContent>
                        </Card>

                        <Card className="animate-fade-in-up animate-delay-200 border-0 shadow-xl bg-gradient-to-br from-card to-orange-500/5 overflow-hidden" role="region" aria-label="Priority Actions">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-3xl" />
                            <CardContent className="relative p-6 z-10">
                                <ContentSection
                                    title="Priority Actions"
                                    description="High-impact activities to accelerate your growth"
                                    icon={Zap}
                                    actions={latestPlanData && latestPlanData.length > 0 ? (
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button variant="outline" size="sm" asChild className="shadow-sm hover:shadow-md transition-shadow">
                                                <Link href="/brand/strategy">
                                                    <BarChart3 className="w-4 h-4 mr-2" />
                                                    View Full Plan
                                                </Link>
                                            </Button>
                                            <Badge variant="secondary" className="text-xs px-3 py-1.5">
                                                <Activity className="w-3 h-3 mr-1" />
                                                {latestPlanData[0].steps.length} Tasks
                                            </Badge>
                                        </div>
                                    ) : undefined}
                                    className="bg-gradient-to-br to-orange-500/5"
                                >
                                    {isPlanLoading || areCompetitorsLoading || isAuditLoading ? (
                                        <LoadingState variant="list" count={2} />
                                    ) : latestPlanData && latestPlanData.length > 0 ? (
                                        <div className="space-y-4">
                                            {latestPlanData[0].steps.slice(0, 3).map((task: MarketingTask, index: number) => (
                                                <div
                                                    key={index}
                                                    className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-muted/20 hover:shadow-lg transition-all duration-300 hover:border-primary/30"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="relative flex items-start gap-4 p-6">
                                                        <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 text-orange-600 dark:text-orange-400 font-bold text-lg shadow-sm">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                                <h4 className="font-headline font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                                                                    {task.task}
                                                                </h4>
                                                                <Badge
                                                                    variant={index === 0 ? "default" : "outline"}
                                                                    className="text-xs shrink-0 shadow-sm"
                                                                >
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                    {index === 0 ? 'This Week' : index === 1 ? 'Next Week' : 'Later'}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                                                                {task.rationale}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <Button size="sm" variant="ghost" className="h-8 px-3 text-xs hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                                                    Complete
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="h-8 px-3 text-xs hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400">
                                                                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                                                    Schedule
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {latestPlanData[0].steps.length > 3 && (
                                                <div className="text-center pt-2">
                                                    <Button variant="outline" size="sm" asChild className="shadow-sm hover:shadow-md transition-shadow">
                                                        <Link href="/brand/strategy">
                                                            View {latestPlanData[0].steps.length - 3} more tasks
                                                            <ArrowRight className="w-4 h-4 ml-2" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative overflow-hidden rounded-xl border-2 border-dashed bg-gradient-to-br from-muted/30 to-muted/10 p-8 text-center">
                                            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-600/10 flex items-center justify-center mx-auto mb-4">
                                                    <Sparkles className="w-8 h-8 text-primary" />
                                                </div>
                                                <h4 className="font-semibold text-lg mb-2">No Strategy Yet</h4>
                                                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                                                    Get a personalized game plan built around your strengths and market opportunities.
                                                </p>
                                                <Button asChild className="shadow-md">
                                                    <Link href="/brand/strategy">
                                                        <Sparkles className="w-4 h-4 mr-2" />
                                                        Create Your Strategy
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </ContentSection>
                            </CardContent>
                        </Card>

                        <Card className="animate-fade-in-up animate-delay-250 border-0 shadow-xl bg-gradient-to-br from-card to-yellow-500/5 overflow-hidden" role="region" aria-label="Reputation Snapshot">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-3xl" />
                            <CardContent className="relative p-6 z-10">
                                <ContentSection
                                    title="Reputation Snapshot"
                                    description="Your client testimonials and reviews"
                                    icon={Star}
                                    className="bg-gradient-to-br to-yellow-500/5"
                                >
                                    {isLoadingStats ? (
                                        <LoadingState variant="card" count={3} className="mb-4 md:mb-6" />
                                    ) : (
                                        <div className="space-y-6">
                                            <DataGrid columns={3} gap="spacious">
                                                <div className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all duration-300 p-5">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="relative">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                                                <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400 fill-current" />
                                                            </div>
                                                            <div className="flex items-center gap-0.5">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        className={`w-3 h-3 ${i < Math.floor(parsedAverageRating)
                                                                            ? 'text-yellow-400 fill-current'
                                                                            : 'text-gray-300 dark:text-gray-600'
                                                                            }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="text-3xl font-bold mb-1">{parsedAverageRating.toFixed(1)}</div>
                                                        <div className="text-sm font-medium mb-1">Average Rating</div>
                                                        <div className="text-xs text-muted-foreground">From {totalReviews} reviews</div>
                                                    </div>
                                                </div>

                                                <div className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all duration-300 p-5">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="relative">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                            </div>
                                                            <Badge variant={totalReviews > 0 ? "default" : "outline"} className="text-xs">
                                                                {totalReviews > 0 ? 'Active' : 'Start'}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-3xl font-bold mb-1">{totalReviews}</div>
                                                        <div className="text-sm font-medium mb-1">Total Reviews</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {totalReviews > 0 ? "Building credibility" : "Import to start"}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all duration-300 p-5">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="relative">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <Badge variant={recentReviewsCount > 0 ? "default" : "secondary"} className="text-xs">
                                                                30 days
                                                            </Badge>
                                                        </div>
                                                        <div className="text-3xl font-bold mb-1">+{recentReviewsCount}</div>
                                                        <div className="text-sm font-medium mb-1">Recent Reviews</div>
                                                        <div className="text-xs text-muted-foreground">Last 30 days</div>
                                                    </div>
                                                </div>
                                            </DataGrid>

                                            {/* Quick Actions for Reviews */}
                                            {totalReviews === 0 ? (
                                                <div className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-muted bg-muted/20">
                                                    <Award className="w-12 h-12 text-muted-foreground/50 mb-3" />
                                                    <p className="text-sm font-medium mb-4 text-center">Import your reviews to showcase your reputation</p>
                                                    <Button size="sm" asChild className="shadow-sm">
                                                        <Link href="/brand/audit">
                                                            <Search className="w-4 h-4 mr-2" />
                                                            Import Reviews
                                                        </Link>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                                    <Button size="sm" variant="outline" asChild className="shadow-sm hover:shadow-md transition-shadow">
                                                        <Link href="/brand/audit">
                                                            <Search className="w-4 h-4 mr-2" />
                                                            Import More
                                                        </Link>
                                                    </Button>
                                                    <Button size="sm" variant="outline" asChild className="shadow-sm hover:shadow-md transition-shadow">
                                                        <Link href="/brand/audit">
                                                            <BarChart3 className="w-4 h-4 mr-2" />
                                                            View All Reviews
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Reviews Carousel */}
                                    {!isLoadingStats && recentReviews && recentReviews.length > 0 && (
                                        <div className="mt-8 pt-8 border-t">
                                            <div className="flex items-center justify-between mb-5">
                                                <div>
                                                    <h3 className="font-headline text-lg font-semibold mb-1">Latest Testimonials</h3>
                                                    <p className="text-xs text-muted-foreground">What your clients are saying</p>
                                                </div>
                                                <Button variant="ghost" size="sm" asChild className="text-xs hover:bg-accent">
                                                    <Link href="/brand/audit">
                                                        View All
                                                        <ArrowRight className="w-3 h-3 ml-1" />
                                                    </Link>
                                                </Button>
                                            </div>
                                            <Carousel
                                                opts={{
                                                    align: 'start',
                                                    loop: true,
                                                }}
                                                className="w-full"
                                            >
                                                <CarouselContent className="-ml-4">
                                                    {isLoadingCarousel ? (
                                                        <CarouselItem className="pl-4 md:basis-full">
                                                            <LoadingState variant="list" count={2} />
                                                        </CarouselItem>
                                                    ) : (
                                                        recentReviews.map((review) => (
                                                            <CarouselItem key={review.id} className="pl-4 md:basis-full lg:basis-1/2">
                                                                <Link href="/brand/audit">
                                                                    <div className="group relative overflow-hidden h-full flex flex-col p-6 rounded-xl border bg-gradient-to-br from-card to-muted/20 hover:shadow-lg transition-all duration-300 hover:border-primary/30">
                                                                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        <div className="relative flex items-start gap-4 pb-4">
                                                                            <div className="flex-shrink-0">
                                                                                {review.avatarUrl ? (
                                                                                    <Image
                                                                                        src={review.avatarUrl}
                                                                                        alt={review.author.name}
                                                                                        width={48}
                                                                                        height={48}
                                                                                        className="rounded-full ring-2 ring-yellow-400/20 group-hover:ring-yellow-400/40 transition-all duration-300"
                                                                                        data-ai-hint="happy person"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/10 to-orange-500/10 flex items-center justify-center ring-2 ring-yellow-400/20 group-hover:ring-yellow-400/40 transition-all duration-300">
                                                                                        <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="font-semibold text-base group-hover:text-primary transition-colors">
                                                                                    {review.author.name || 'Anonymous'}
                                                                                </p>
                                                                                <div className="flex items-center gap-2 mt-1.5">
                                                                                    <Badge variant="secondary" className="text-xs">
                                                                                        {review.source}
                                                                                    </Badge>
                                                                                    <div className="flex items-center gap-0.5">
                                                                                        {[...Array(5)].map((_, i) => (
                                                                                            <Star
                                                                                                key={i}
                                                                                                className={`w-3.5 h-3.5 ${i < review.rating
                                                                                                    ? 'text-yellow-400 fill-current'
                                                                                                    : 'text-gray-300 dark:text-gray-600'
                                                                                                    }`}
                                                                                            />
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="relative flex-grow mt-2">
                                                                            <p className="text-sm text-foreground/90 italic line-clamp-4 leading-relaxed">
                                                                                "{review.comment}"
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </Link>
                                                            </CarouselItem>
                                                        ))
                                                    )}
                                                </CarouselContent>
                                                <CarouselPrevious className="hidden md:flex -left-4 hover:bg-primary hover:text-primary-foreground" />
                                                <CarouselNext className="hidden md:flex -right-4 hover:bg-primary hover:text-primary-foreground" />
                                            </Carousel>
                                        </div>
                                    )}
                                </ContentSection>
                            </CardContent>
                        </Card>

                    </div>

                    <div className="col-span-3 tablet:col-span-1 lg:col-span-1 space-y-6 md:space-y-8">
                        {/* AI Suggestions Panel */}
                        <div className="animate-fade-in-up animate-delay-100">
                            <ProactiveSuggestionsPanel
                                maxHeight="500px"
                                showFilters={true}
                                autoRefresh={true}
                                refreshInterval={300}
                                className="border-0 shadow-xl bg-gradient-to-br from-card to-purple-500/5"
                            />
                        </div>

                        {/* Team Announcements */}
                        {dashboardData?.announcements && dashboardData.announcements.length > 0 && (
                            <Card className="animate-fade-in-up animate-delay-150 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-orange-500/10 via-card to-card" role="region" aria-label="Announcements">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl" />
                                <CardHeader className="relative z-10 pb-4">
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                                            <Megaphone className="text-white h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg">Announcements</div>
                                            <div className="text-sm text-muted-foreground font-normal">Latest updates</div>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="space-y-3">
                                        {dashboardData.announcements.map((announcement: any) => (
                                            <div key={announcement.id} className="group relative overflow-hidden p-4 rounded-xl bg-background/80 backdrop-blur-sm border hover:border-orange-500/30 hover:shadow-md transition-all duration-300">
                                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <h4 className="font-semibold text-sm leading-tight">{announcement.title}</h4>
                                                        <Badge
                                                            variant={announcement.priority === 'high' ? 'destructive' : 'secondary'}
                                                            className="text-xs shrink-0"
                                                        >
                                                            {announcement.priority}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap leading-relaxed">
                                                        {announcement.message}
                                                    </p>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span className="font-medium">{announcement.senderName}</span>
                                                        <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Today's Focus */}
                        <Card className="animate-fade-in-up animate-delay-200 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-primary/10 via-purple-500/5 to-card" role="region" aria-label="Today's Focus">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
                            <CardHeader className="relative z-10 pb-4">
                                <CardTitle className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg">
                                        <Target className="text-white h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg">Today's Focus</div>
                                        <div className="text-sm text-muted-foreground font-normal">Your top priorities</div>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                {isLoadingProfile ? (
                                    <LoadingState variant="list" count={2} />
                                ) : suggestedSteps.length > 0 ? (
                                    <div className="space-y-3">
                                        {suggestedSteps.slice(0, 3).map((step, index) => (
                                            <Link key={index} href={step.href}>
                                                <div className="group relative overflow-hidden rounded-xl border bg-background/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    <div className="relative flex items-start gap-3 p-4">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-purple-600/10 flex items-center justify-center mt-0.5 group-hover:scale-110 transition-transform duration-300">
                                                            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-primary to-purple-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors mb-1.5">
                                                                {step.title}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                                {step.description}
                                                            </p>
                                                        </div>
                                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" />
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                        <Button size="sm" variant="default" className="w-full mt-4 shadow-sm hover:shadow-md transition-shadow" asChild>
                                            <Link href={suggestedSteps[0]?.href || '/brand/profile'}>
                                                <Zap className="w-4 h-4 mr-2" />
                                                Start First Task
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800/50 p-6 text-center">
                                        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                                                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                            </div>
                                            <h4 className="font-semibold text-sm mb-2">All Caught Up!</h4>
                                            <p className="text-xs text-muted-foreground">You're doing great. Check back later for new suggestions.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Suggested Next Steps */}
                        {!isLoadingProfile && suggestedSteps.length > 3 && (
                            <Card className="animate-fade-in-up animate-delay-300 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-slate-500/5 via-card to-card" role="region" aria-label="More Tasks">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-slate-500/10 to-transparent rounded-full blur-3xl" />
                                <CardHeader className="relative z-10 pb-4">
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg">
                                            <CheckCircle2 className="text-white h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg">More Tasks</div>
                                            <div className="text-sm text-muted-foreground font-normal">Additional suggestions</div>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="space-y-2">
                                        {suggestedSteps.slice(3, 6).map((step, index) => (
                                            <Link key={index} href={step.href}>
                                                <div className="group flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-accent/50 border border-transparent hover:border-primary/20 transition-all duration-300 cursor-pointer hover:shadow-md">
                                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-500/10 to-slate-600/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-slate-500 to-slate-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">
                                                            {step.title}
                                                        </p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </DataGrid>
            </div>
        </div>
    );
}