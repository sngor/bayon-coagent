
'use client';

import Image from 'next/image';
import { useMemo, useActionState, useEffect, useState, useTransition, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Typewriter, LoadingDots, SuccessAnimation, StaggeredText, GradientText } from '@/components/ui/text-animations';
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
import { StandardEmptyState, StandardSkeleton } from '@/components/ui/reusable';


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
    Sparkles
} from 'lucide-react';
import {
    ContentIcon,
    AISparkleIcon,
} from '@/components/ui/real-estate-icons';
import { useUser } from '@/aws/auth';
import { ProfileCompletionBanner } from '@/components/profile-completion-banner';
import { SuggestedNextSteps } from '@/components/suggested-next-steps';
import { getSuggestedNextActions } from '@/hooks/use-profile-completion';
import type { Review, Profile, MarketingPlan, MarketingTask, BrandAudit, Competitor as CompetitorType } from '@/lib/types';

import { toast } from '@/hooks/use-toast';
import { getDashboardData } from './actions';
import { DashboardQuickActions } from '@/components/dashboard-quick-actions';




export default function DashboardPage() {
    const { user } = useUser();
    const [isBannerDismissed, setIsBannerDismissed] = useState(false);


    // Dashboard data state
    const [dashboardData, setDashboardData] = useState<{
        agentProfile: Profile | null;
        allReviews: Review[];
        recentReviews: Review[];
        latestPlan: MarketingPlan | null;
        brandAudit: BrandAudit | null;
        competitors: CompetitorType[];
    } | null>(null);
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
    const [dashboardError, setDashboardError] = useState<string | null>(null);

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
                });
            } else {
                setDashboardError(result.error || 'Failed to load dashboard');
            }
            setIsLoadingDashboard(false);
        };

        fetchData();
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
        <div className="space-y-6 md:space-y-8">
            {/* Welcome Message for New Users */}
            {!isLoadingProfile && (!agentProfile?.name || completionPercentage < 50) && (
                <div className="animate-fade-in-up animate-delay-50">
                    <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-lg rounded-lg border bg-card text-card-foreground">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 opacity-50" />
                        <div className="relative flex items-start gap-4 p-6">
                            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                                <Zap className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-xl mb-3">
                                    <StaggeredText
                                        text="Welcome to Bayon Coagent! 🎉"
                                        staggerBy="word"
                                        delay={300}
                                        staggerDelay={150}
                                        animation="slideUp"
                                        className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                                    />
                                </h3>
                                <p className="text-muted-foreground mb-6 text-base leading-relaxed">
                                    <Typewriter
                                        text="Let's get you set up for success. Complete your profile to unlock personalized strategies and AI-powered tools."
                                        speed={25}
                                        delay={2000}
                                        cursor={false}
                                    />
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button asChild size="lg" className="shadow-md">
                                        <Link href="/brand/profile">
                                            <Target className="w-5 h-5 mr-2" />
                                            Complete Your Profile
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="lg" asChild>
                                        <Link href="/assistant">
                                            <MessageSquare className="w-5 h-5 mr-2" />
                                            Get Help
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
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

            {/* Profile Complete Celebration Banner */}
            {agentProfile && completionPercentage === 100 && (
                <div className="animate-fade-in-up animate-delay-100">
                    <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-green-950 dark:via-emerald-950 dark:to-green-900 border-green-200 dark:border-green-800 shadow-lg rounded-lg border bg-card text-card-foreground">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10" />
                        <div className="relative flex items-center gap-4 p-6">
                            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-xl text-green-700 dark:text-green-300 mb-2">
                                    <StaggeredText
                                        text="🎉 Profile Complete!"
                                        staggerBy="word"
                                        delay={200}
                                        staggerDelay={100}
                                        animation="bounce"
                                    />
                                </h3>
                                <p className="text-green-600 dark:text-green-400 leading-relaxed">
                                    <Typewriter
                                        text="Your profile is now complete and all AI features are unlocked. You're ready to maximize your marketing potential!"
                                        speed={20}
                                        delay={1200}
                                        cursor={false}
                                    />
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button variant="outline" size="sm" asChild className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900 shadow-sm">
                                    <Link href="/brand/strategy">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate Strategy
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="sm" asChild className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900">
                                    <Link href="/studio/write">
                                        <PenTool className="w-4 h-4 mr-2" />
                                        Create Content
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
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
                <DashboardQuickActions />
            </div>

            <DataGrid columns={3} className="orientation-transition gap-6">
                <div className="tablet:col-span-2 lg:col-span-2 space-y-6">

                    {/* Performance Overview */}
                    <Card className="animate-fade-in-up animate-delay-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-purple-600/10">
                                    <BarChart3 className="text-primary h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg">Performance Overview</div>
                                    <div className="text-sm text-muted-foreground font-normal">Track your progress and key metrics</div>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingProfile ? (
                                <StandardSkeleton variant="metric" count={2} />
                            ) : (
                                <div className="space-y-8">
                                    {/* Profile Completion */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-base">Profile Completion</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-primary">
                                                    {completionPercentage}%
                                                </span>
                                                {completionPercentage === 100 && (
                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Progress value={completionPercentage} className="h-3 bg-muted/50" />
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-purple-600/20 opacity-50" />
                                        </div>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            {completionPercentage === 100 ? (
                                                <>
                                                    <Sparkles className="w-4 h-4 text-green-500" />
                                                    Your profile is complete and all features are unlocked!
                                                </>
                                            ) : (
                                                <>
                                                    <Target className="w-4 h-4 text-primary" />
                                                    {9 - Math.ceil((completionPercentage / 100) * 9)} more fields to complete
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    {/* Key Metrics Grid */}
                                    <DataGrid columns={3} gap="spacious">
                                        <div className="group relative overflow-hidden text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 dark:from-blue-950 dark:via-blue-900 dark:to-blue-950 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="relative">
                                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                                                    {planStepsCount}
                                                </div>
                                                <div className="text-sm text-blue-600/80 dark:text-blue-400/80 font-medium">
                                                    Strategy Tasks
                                                </div>
                                                <div className="mt-2 w-8 h-1 bg-blue-500 rounded-full mx-auto" />
                                            </div>
                                        </div>
                                        <div className="group relative overflow-hidden text-center p-6 rounded-xl bg-gradient-to-br from-green-50 via-green-100 to-green-50 dark:from-green-950 dark:via-green-900 dark:to-green-950 border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="relative">
                                                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                                                    {competitorsData.length}
                                                </div>
                                                <div className="text-sm text-green-600/80 dark:text-green-400/80 font-medium">
                                                    Competitors Tracked
                                                </div>
                                                <div className="mt-2 w-8 h-1 bg-green-500 rounded-full mx-auto" />
                                            </div>
                                        </div>
                                        <div className="group relative overflow-hidden text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 dark:from-purple-950 dark:via-purple-900 dark:to-purple-950 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="relative">
                                                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                                                    {brandAuditData ? '✓' : '○'}
                                                </div>
                                                <div className="text-sm text-purple-600/80 dark:text-purple-400/80 font-medium">
                                                    Brand Audit
                                                </div>
                                                <div className="mt-2 w-8 h-1 bg-purple-500 rounded-full mx-auto" />
                                            </div>
                                        </div>
                                    </DataGrid>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up animate-delay-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900">
                                        <Target className="text-orange-600 dark:text-orange-400 h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg">Priority Actions</div>
                                        <div className="text-sm text-muted-foreground font-normal">High-impact activities to accelerate growth</div>
                                    </div>
                                </CardTitle>
                                {latestPlanData && latestPlanData.length > 0 && (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button variant="outline" size="sm" asChild className="shadow-sm">
                                            <Link href="/brand/strategy">
                                                <BarChart3 className="w-4 h-4 mr-2" />
                                                View Full Plan
                                            </Link>
                                        </Button>
                                        <Badge variant="secondary" className="text-xs px-3 py-1">
                                            <Activity className="w-3 h-3 mr-1" />
                                            {latestPlanData[0].steps.length} Active Tasks
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isPlanLoading || areCompetitorsLoading || isAuditLoading ? (
                                <StandardSkeleton variant="list" count={2} />
                            ) : latestPlanData && latestPlanData.length > 0 ? (
                                <div className="space-y-4">
                                    {latestPlanData[0].steps.slice(0, 3).map((task: MarketingTask, index: number) => (
                                        <div
                                            key={index}
                                            className="group relative overflow-hidden rounded-xl border-2 border-transparent bg-gradient-to-r from-primary/5 via-primary/3 to-transparent hover:border-primary/20 hover:from-primary/10 hover:via-primary/5 hover:to-primary/5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="relative flex items-start gap-4 p-6">
                                                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                        <h4 className="font-headline font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                                                            {task.task}
                                                        </h4>
                                                        <Badge
                                                            variant={index === 0 ? "default" : "outline"}
                                                            className={`text-xs shrink-0 ${index === 0 ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}`}
                                                        >
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {index === 0 ? 'This Week' : index === 1 ? 'Next Week' : 'Later'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                                                        {task.rationale}
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <Button size="sm" variant="ghost" className="h-8 px-4 text-xs hover:bg-primary/10 hover:text-primary">
                                                            <CheckCircle2 className="w-3 h-3 mr-2" />
                                                            Mark Complete
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-8 px-4 text-xs hover:bg-secondary">
                                                            <Calendar className="w-3 h-3 mr-2" />
                                                            Schedule
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {latestPlanData[0].steps.length > 3 && (
                                        <div className="text-center pt-4">
                                            <Button variant="outline" size="sm" asChild className="shadow-sm">
                                                <Link href="/brand/strategy">
                                                    View {latestPlanData[0].steps.length - 3} more tasks
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <StandardEmptyState
                                    icon={<AISparkleIcon className="h-8 w-8 text-primary" />}
                                    title="No Strategy Yet"
                                    description="Get a personalized game plan built around your strengths and opportunities."
                                    action={{
                                        label: "Create Your Strategy",
                                        onClick: () => window.location.href = '/brand/strategy',
                                        variant: "ai"
                                    }}
                                    variant="compact"
                                    className="bg-gradient-to-br from-primary/5 to-purple-600/5"
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up animate-delay-400 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900">
                                    <Star className="text-yellow-600 dark:text-yellow-400 h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg">Reputation Snapshot</div>
                                    <div className="text-sm text-muted-foreground font-normal">Client testimonials and reviews</div>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <StandardSkeleton variant="metric" count={3} className="mb-4 md:mb-6" />
                            ) : (
                                <div className="space-y-8">
                                    <DataGrid columns={3} gap="spacious">
                                        {/* Average Rating Card */}
                                        <div className="group relative overflow-hidden text-center p-6 rounded-xl bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-50 dark:from-yellow-950 dark:via-yellow-900 dark:to-orange-950 border border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="relative">
                                                <div className="flex items-center justify-center mb-3">
                                                    <div className="p-2 rounded-full bg-yellow-500/20">
                                                        <Star className="w-6 h-6 text-yellow-500 fill-current" />
                                                    </div>
                                                </div>
                                                <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mb-2">
                                                    {parsedAverageRating.toFixed(1)}
                                                </div>
                                                <div className="text-sm text-yellow-600/80 dark:text-yellow-400/80 font-medium mb-3">
                                                    Average Rating
                                                </div>
                                                <div className="flex items-center justify-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 transition-colors duration-200 ${i < Math.floor(parsedAverageRating)
                                                                ? 'text-yellow-400 fill-current'
                                                                : 'text-yellow-200 dark:text-yellow-700'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Total Reviews Card */}
                                        <div className="group relative overflow-hidden text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 dark:from-blue-950 dark:via-blue-900 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="relative">
                                                <div className="flex items-center justify-center mb-3">
                                                    <div className="p-2 rounded-full bg-blue-500/20">
                                                        <Award className="w-6 h-6 text-blue-500" />
                                                    </div>
                                                </div>
                                                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                                                    {totalReviews}
                                                </div>
                                                <div className="text-sm text-blue-600/80 dark:text-blue-400/80 font-medium mb-3">
                                                    Total Reviews
                                                </div>
                                                {totalReviews > 0 && (
                                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                        Growing
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Recent Reviews Card */}
                                        <div className="group relative overflow-hidden text-center p-6 rounded-xl bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 dark:from-green-950 dark:via-green-900 dark:to-emerald-950 border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="relative">
                                                <div className="flex items-center justify-center mb-3">
                                                    <div className="p-2 rounded-full bg-green-500/20">
                                                        <TrendingUp className="w-6 h-6 text-green-500" />
                                                    </div>
                                                </div>
                                                <div className="text-3xl font-bold text-green-700 dark:text-green-300 mb-2">
                                                    {recentReviewsCount}
                                                </div>
                                                <div className="text-sm text-green-600/80 dark:text-green-400/80 font-medium mb-3">
                                                    This Month
                                                </div>
                                                {recentReviewsCount > 0 && (
                                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                                                        <Activity className="w-3 h-3 mr-1" />
                                                        Active
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </DataGrid>

                                    {/* Quick Actions for Reviews */}
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Button size="sm" variant="outline" asChild className="shadow-sm hover:shadow-md transition-shadow">
                                            <Link href="/brand/audit">
                                                <Search className="w-4 h-4 mr-2" />
                                                Import Reviews
                                            </Link>
                                        </Button>
                                        <Button size="sm" variant="outline" asChild className="shadow-sm hover:shadow-md transition-shadow">
                                            <Link href="/brand/audit">
                                                <BarChart3 className="w-4 h-4 mr-2" />
                                                View Analytics
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Reviews Carousel */}
                            {!isLoadingStats && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-headline text-base font-semibold">Latest Testimonials</h3>
                                        <Button variant="ghost" size="sm" asChild className="text-xs">
                                            <Link href="/brand/audit">
                                                View All
                                                <ArrowRight className="w-3 h-3 ml-1" />
                                            </Link>
                                        </Button>
                                    </div>
                                    <Carousel
                                        opts={{
                                            align: 'start',
                                        }}
                                        className="w-full"
                                    >
                                        <CarouselContent>
                                            {isLoadingCarousel ? (
                                                <CarouselItem className="md:basis-full">
                                                    <div className="p-1 h-full">
                                                        <StandardSkeleton variant="list" count={2} />
                                                    </div>
                                                </CarouselItem>
                                            ) : recentReviews && recentReviews.length > 0 ? (
                                                recentReviews.map((review) => (
                                                    <CarouselItem key={review.id} className="md:basis-full lg:basis-1/2">
                                                        <div className="p-2 h-full">
                                                            <Link href="/brand/audit">
                                                                <div className="group relative overflow-hidden h-full flex flex-col p-6 bg-gradient-to-br from-secondary/20 via-secondary/30 to-secondary/20 hover:from-primary/10 hover:via-primary/5 hover:to-purple-600/10 hover:shadow-xl transition-all duration-300 hover:scale-[1.03] rounded-xl border border-secondary/50 hover:border-primary/20">
                                                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                                    <div className="relative flex items-start gap-4 pb-4">
                                                                        <div className="flex-shrink-0">
                                                                            {review.avatarUrl ? (
                                                                                <Image
                                                                                    src={review.avatarUrl}
                                                                                    alt={review.author.name}
                                                                                    width={40}
                                                                                    height={40}
                                                                                    className="rounded-full ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300"
                                                                                    data-ai-hint="happy person"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                                                                                    <Users className="w-5 h-5 text-primary" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{review.author.name || 'Anonymous'}</p>
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <p className="text-xs text-muted-foreground">{review.source}</p>
                                                                                <div className="flex items-center">
                                                                                    {[...Array(5)].map((_, i) => (
                                                                                        <Star
                                                                                            key={i}
                                                                                            className={`w-3 h-3 ${i < review.rating
                                                                                                ? 'text-yellow-400 fill-current'
                                                                                                : 'text-gray-200'
                                                                                                }`}
                                                                                        />
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="relative flex-grow">
                                                                        <p className="text-sm text-foreground/90 italic line-clamp-3 leading-relaxed">
                                                                            "{review.comment}"
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                    </CarouselItem>
                                                ))
                                            ) : (
                                                <CarouselItem>
                                                    <div className="p-1 h-full">
                                                        <StandardEmptyState
                                                            icon={<MessageSquare className="h-8 w-8 text-primary" />}
                                                            title="No Reviews Yet"
                                                            description="Import your reviews from Zillow and other platforms to track your reputation."
                                                            action={{
                                                                label: "Import Reviews",
                                                                onClick: () => window.location.href = '/brand/audit',
                                                                variant: "default"
                                                            }}
                                                            variant="compact"
                                                            className="bg-secondary/30"
                                                        />
                                                    </div>
                                                </CarouselItem>
                                            )}
                                        </CarouselContent>
                                        <CarouselPrevious className="hidden sm:flex -left-4" />
                                        <CarouselNext className="hidden sm:flex -right-4" />
                                    </Carousel>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>

                <div className="tablet:col-span-1 lg:col-span-1 space-y-6">
                    {/* Today's Focus */}
                    <Card className="animate-fade-in-up animate-delay-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900">
                                    <Calendar className="text-indigo-600 dark:text-indigo-400 h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg">Today's Focus</div>
                                    <div className="text-sm text-muted-foreground font-normal">Most important tasks</div>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingProfile ? (
                                <StandardSkeleton variant="list" count={2} />
                            ) : suggestedSteps.length > 0 ? (
                                <div className="space-y-4">
                                    {suggestedSteps.slice(0, 3).map((step, index) => (
                                        <div key={index} className="group relative overflow-hidden rounded-xl border bg-gradient-to-r from-secondary/20 to-secondary/10 hover:from-primary/10 hover:to-purple-600/10 hover:border-primary/20 transition-all duration-300 hover:shadow-md">
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="relative flex items-start gap-4 p-4">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center mt-0.5 group-hover:scale-110 transition-transform duration-300">
                                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-purple-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">{step.title}</p>
                                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{step.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button size="sm" variant="default" className="w-full mt-4 shadow-sm" asChild>
                                        <Link href={suggestedSteps[0]?.href || '/brand/profile'}>
                                            <Target className="w-4 h-4 mr-2" />
                                            Start First Task
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <StandardEmptyState
                                    icon={<CheckCircle2 className="h-8 w-8 text-green-500" />}
                                    title="All Caught Up!"
                                    description="You're doing great. Check back later for new suggestions."
                                    variant="compact"
                                    className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800"
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Suggested Next Steps */}
                    {!isLoadingProfile && suggestedSteps.length > 3 && (
                        <div className="animate-fade-in-up animate-delay-250">
                            <SuggestedNextSteps steps={suggestedSteps.slice(3)} />
                        </div>
                    )}


                </div>
            </DataGrid>
        </div>
    );
}