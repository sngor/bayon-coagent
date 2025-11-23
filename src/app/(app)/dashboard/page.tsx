
'use client';

import Image from 'next/image';
import { useMemo, useActionState, useEffect, useState, useTransition, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import {
    ContentSection,
    DataGrid,
    StatCard,
    LoadingSection,
    EmptySection,
    ActionBar
} from '@/components/ui';
import { StandardCard, StandardSkeleton, StandardEmptyState } from '@/components/standard';
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
                <StandardCard variant="elevated">
                    <StandardEmptyState
                        icon={<AlertCircle className="h-12 w-12 text-destructive" />}
                        title="Unable to Load Dashboard"
                        description={dashboardError}
                        action={{
                            label: "Try Again",
                            onClick: () => window.location.reload(),
                            variant: "default"
                        }}
                    />
                </StandardCard>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Message for New Users */}
            {!isLoadingProfile && (!agentProfile?.name || completionPercentage < 50) && (
                <div className="animate-fade-in-up animate-delay-50">
                    <StandardCard variant="elevated" className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-primary/20">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-2">
                                    Welcome to Bayon Coagent! 🎉
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    Let's get you set up for success. Complete your profile to unlock personalized strategies and AI-powered tools.
                                </p>
                                <Button asChild>
                                    <Link href="/brand/profile">
                                        <Target className="w-4 h-4 mr-2" />
                                        Complete Your Profile
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </StandardCard>
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
                    <StandardCard variant="elevated" className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg text-green-700 dark:text-green-300">
                                    🎉 Profile Complete!
                                </h3>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    Your profile is now complete and all AI features are unlocked. You're ready to maximize your marketing potential!
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900">
                                    <Link href="/brand/strategy">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate Strategy
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </StandardCard>
                </div>
            )}

            {/* Show Profile Completion Button (when banner is dismissed) */}
            {agentProfile && completionPercentage >= 50 && completionPercentage < 100 && isBannerDismissed && (
                <div className="animate-fade-in-up animate-delay-100">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-dashed">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Target className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Profile {completionPercentage}% complete</p>
                                <p className="text-xs text-muted-foreground">Complete your profile to unlock more features</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/brand/profile">
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
                                className="text-xs"
                            >
                                Show Details
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <DashboardQuickActions />

            <DataGrid columns={3} className="orientation-transition">
                <div className="tablet:col-span-2 lg:col-span-2 space-y-8">

                    {/* Performance Overview */}
                    <StandardCard
                        title={
                            <span className="flex items-center gap-2">
                                <BarChart3 className="text-primary h-5 w-5 md:h-6 md:w-6" />
                                Performance Overview
                            </span>
                        }
                        description="Track your progress and key metrics at a glance."
                        variant="elevated"
                        className="animate-fade-in-up animate-delay-200"
                    >
                        {isLoadingProfile ? (
                            <StandardSkeleton variant="metric" count={2} />
                        ) : (
                            <div className="space-y-6">
                                {/* Profile Completion */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Profile Completion</span>
                                        <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
                                    </div>
                                    <Progress value={completionPercentage} className="h-2" />
                                    <p className="text-xs text-muted-foreground">
                                        {completionPercentage === 100
                                            ? "🎉 Your profile is complete!"
                                            : `${9 - Math.ceil((completionPercentage / 100) * 9)} more fields to complete`
                                        }
                                    </p>
                                </div>

                                {/* Key Metrics Grid */}
                                <DataGrid columns={3} gap="spacious">
                                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {latestPlanData.length > 0 ? latestPlanData[0].steps.length : 0}
                                        </div>
                                        <div className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
                                            Strategy Tasks
                                        </div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {competitorsData.length}
                                        </div>
                                        <div className="text-xs text-green-600/80 dark:text-green-400/80 font-medium">
                                            Competitors Tracked
                                        </div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                            {brandAuditData ? '✓' : '○'}
                                        </div>
                                        <div className="text-xs text-purple-600/80 dark:text-purple-400/80 font-medium">
                                            Brand Audit
                                        </div>
                                    </div>
                                </DataGrid>
                            </div>
                        )}
                    </StandardCard>

                    <StandardCard
                        title={
                            <span className="flex items-center gap-2">
                                <Target className="text-primary h-5 w-5 md:h-6 md:w-6" />
                                Priority Actions
                            </span>
                        }
                        description="Focus on these high-impact activities to accelerate your growth."
                        actions={latestPlanData && latestPlanData.length > 0 ? (
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/brand/strategy">View Full Plan</Link>
                                </Button>
                                <Badge variant="secondary" className="text-xs">
                                    <Activity className="w-3 h-3 mr-1" />
                                    Active
                                </Badge>
                            </div>
                        ) : undefined}
                        variant="elevated"
                        className="animate-fade-in-up animate-delay-300"
                    >
                        {isPlanLoading || areCompetitorsLoading || isAuditLoading ? (
                            <StandardSkeleton variant="list" count={2} />
                        ) : latestPlanData && latestPlanData.length > 0 ? (
                            <div className="space-y-4">
                                {latestPlanData[0].steps.slice(0, 3).map((task: MarketingTask, index: number) => (
                                    <div
                                        key={index}
                                        className="group relative flex items-start gap-4 rounded-xl border p-5 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent hover:from-primary/10 hover:via-primary/5 hover:to-primary/5 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
                                    >
                                        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h4 className="font-headline font-semibold text-sm md:text-base leading-tight group-hover:text-primary transition-colors">
                                                    {task.task}
                                                </h4>
                                                <Badge variant="outline" className="text-xs shrink-0">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {index === 0 ? 'This Week' : index === 1 ? 'Next Week' : 'Later'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                {task.rationale}
                                            </p>
                                            <div className="flex items-center gap-2 mt-3">
                                                <Button size="sm" variant="ghost" className="h-7 px-3 text-xs">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Mark Complete
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-7 px-3 text-xs">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    Schedule
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {latestPlanData[0].steps.length > 3 && (
                                    <div className="text-center pt-2">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href="/brand/strategy">
                                                View {latestPlanData[0].steps.length - 3} more tasks
                                                <ArrowRight className="w-4 h-4 ml-1" />
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <StandardEmptyState
                                icon={<AISparkleIcon animated={true} className="h-8 w-8 text-primary" />}
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
                    </StandardCard>

                    <StandardCard
                        title={
                            <span className="flex items-center gap-2">
                                <Star className="text-primary h-5 w-5 md:h-6 md:w-6" />
                                Reputation Snapshot
                            </span>
                        }
                        description="See what clients are saying about you online."
                        variant="elevated"
                        className="animate-fade-in-up animate-delay-400"
                    >
                        {isLoadingStats ? (
                            <StandardSkeleton variant="metric" count={3} className="mb-4 md:mb-6" />
                        ) : (
                            <div className="space-y-6">
                                <DataGrid columns={3} gap="spacious">
                                    {/* Average Rating Card */}
                                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border border-yellow-200 dark:border-yellow-800">
                                        <div className="flex items-center justify-center mb-2">
                                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                        </div>
                                        <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                                            {averageRating}
                                        </div>
                                        <div className="text-xs text-yellow-600/80 dark:text-yellow-400/80 font-medium">
                                            Average Rating
                                        </div>
                                        <div className="flex items-center justify-center mt-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3 h-3 ${i < Math.floor(parseFloat(averageRating))
                                                        ? 'text-yellow-400 fill-current'
                                                        : 'text-yellow-200'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Total Reviews Card */}
                                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center justify-center mb-2">
                                            <Award className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                            {totalReviews}
                                        </div>
                                        <div className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
                                            Total Reviews
                                        </div>
                                        {totalReviews > 0 && (
                                            <Badge variant="secondary" className="text-xs mt-1">
                                                <TrendingUp className="w-3 h-3 mr-1" />
                                                Growing
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Recent Reviews Card */}
                                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800">
                                        <div className="flex items-center justify-center mb-2">
                                            <TrendingUp className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                            {recentReviewsCount}
                                        </div>
                                        <div className="text-xs text-green-600/80 dark:text-green-400/80 font-medium">
                                            This Month
                                        </div>
                                        {recentReviewsCount > 0 && (
                                            <Badge variant="secondary" className="text-xs mt-1">
                                                <Activity className="w-3 h-3 mr-1" />
                                                Active
                                            </Badge>
                                        )}
                                    </div>
                                </DataGrid>

                                {/* Quick Actions for Reviews */}
                                <div className="flex gap-2 justify-center">
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href="/brand/audit">
                                            <Search className="w-4 h-4 mr-2" />
                                            Import Reviews
                                        </Link>
                                    </Button>
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href="/brand/audit">
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            View Analytics
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                        <h3 className="font-headline text-xs md:text-sm font-medium text-muted-foreground mb-2 md:mb-3">Latest Testimonials</h3>
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
                                            <div className="p-1 h-full">
                                                <Link href="/brand/audit">
                                                    <div className="h-full flex flex-col p-4 md:p-6 bg-secondary/30 hover:bg-secondary/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] rounded-lg border">
                                                        <div className="flex items-start gap-4 pb-3">
                                                            {review.avatarUrl && <Image
                                                                src={review.avatarUrl}
                                                                alt={review.author.name}
                                                                width={32}
                                                                height={32}
                                                                className="rounded-full md:w-10 md:h-10"
                                                                data-ai-hint="happy person"
                                                            />}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-xs md:text-sm truncate">{review.author.name || 'Anonymous'}</p>
                                                                <p className="text-xs text-muted-foreground">{review.source}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex-grow">
                                                            <p className="text-xs md:text-sm text-muted-foreground italic line-clamp-3">
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
                    </StandardCard>

                </div>

                <div className="tablet:col-span-1 lg:col-span-1 space-y-6">
                    {/* Today's Focus */}
                    <StandardCard
                        title={
                            <span className="flex items-center gap-2">
                                <Calendar className="text-primary h-5 w-5" />
                                Today's Focus
                            </span>
                        }
                        description="Your most important tasks for today."
                        variant="elevated"
                        className="animate-fade-in-up animate-delay-200"
                    >
                        {isLoadingProfile ? (
                            <StandardSkeleton variant="list" count={2} />
                        ) : suggestedSteps.length > 0 ? (
                            <div className="space-y-3">
                                {suggestedSteps.slice(0, 3).map((step, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-tight">{step.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{step.description}</p>
                                        </div>
                                    </div>
                                ))}
                                <Button size="sm" variant="ghost" className="w-full mt-3" asChild>
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
                                className="bg-green-50 dark:bg-green-950"
                            />
                        )}
                    </StandardCard>

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