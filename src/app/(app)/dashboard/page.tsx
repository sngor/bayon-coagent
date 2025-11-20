
'use client';

import Image from 'next/image';
import { useMemo, useActionState, useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { StandardPageLayout, StandardCard, StandardSkeleton, StandardEmptyState } from '@/components/standard';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import {
    GlassCard,
    GlassCardHeader,
    GlassCardTitle,
    GlassCardDescription,
    GlassCardContent,
} from '@/components/ui/glass-card';
import { SubtleGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Star, Award, User, Briefcase, Calendar, TrendingUp, ArrowRight, Newspaper, RefreshCcw, Loader2, MessageSquare } from 'lucide-react';
import {
    ContentIcon,
    AISparkleIcon,
} from '@/components/ui/real-estate-icons';
import { useUser } from '@/aws/auth';
import { ProfileCompletionBanner } from '@/components/profile-completion-banner';
import { SuggestedNextSteps } from '@/components/suggested-next-steps';
import { getSuggestedNextActions } from '@/hooks/use-profile-completion';
import type { Review, Profile, MarketingPlan, MarketingTask, BrandAudit, Competitor as CompetitorType } from '@/lib/types';
import { getRealEstateNewsAction } from '@/app/actions';
import { type GetRealEstateNewsOutput } from '@/aws/bedrock/flows/get-real-estate-news';
import { toast } from '@/hooks/use-toast';
import { MetricCard } from '@/components/ui/metric-card';
import { getDashboardData } from './actions';

type NewsState = {
    message: string;
    data: GetRealEstateNewsOutput | null;
    errors: any;
};

const initialNewsState: NewsState = {
    message: '',
    data: null,
    errors: {},
};


function RefreshNewsButton() {
    const { pending } = useFormStatus();
    return (
        <Button size="sm" variant="outline" type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className={`mr-2 h-4 w-4 ${pending ? 'animate-spin' : ''}`} />}
            {pending ? 'Refreshing...' : 'Refresh News'}
        </Button>
    )
}


export default function DashboardPage() {
    const { user } = useUser();
    const [isPending, startTransition] = useTransition();
    const [newsState, newsFormAction] = useActionState(getRealEstateNewsAction, initialNewsState);
    const [latestNews, setLatestNews] = useState<GetRealEstateNewsOutput | null>(null);
    const [initialLoad, setInitialLoad] = useState(true);

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

    // Effect for the initial news fetch
    useEffect(() => {
        if (initialLoad) {
            startTransition(() => {
                const form = new FormData();
                // Pass location on initial load if available
                if (agentProfile?.address) {
                    form.append('location', agentProfile.address);
                }
                newsFormAction(form);
            });
            setInitialLoad(false);
        }
    }, [initialLoad, newsFormAction, agentProfile?.address]);

    // Effect to handle the result of the news fetch action (both initial and refresh)
    useEffect(() => {
        if (newsState.message === 'success' && newsState.data) {
            setLatestNews(newsState.data);
            if (!initialLoad) { // Don't toast on the very first load
                toast({ title: "News refreshed!", description: "You are viewing the latest headlines." });
            }
        } else if (newsState.message && newsState.message !== 'success') {
            toast({ variant: 'destructive', title: 'Failed to fetch news', description: newsState.message });
        }
    }, [newsState, initialLoad]);

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

    return (
        <div className="space-y-6">
            {/* Profile Completion Banner */}
            {agentProfile && (
                <div className="animate-fade-in-up animate-delay-100">
                    <ProfileCompletionBanner profile={agentProfile} />
                </div>
            )}

            <div className="grid grid-cols-1 tablet:grid-cols-3 lg:grid-cols-3 gap-6 orientation-transition">
                <div className="tablet:col-span-2 lg:col-span-2 space-y-6">

                    <StandardCard
                        title={
                            <span className="flex items-center gap-2">
                                <ContentIcon animated={true} className="text-primary h-5 w-5 md:h-6 md:w-6" />
                                Your Next Steps
                            </span>
                        }
                        description="Here's what to focus on next to grow your business."
                        actions={latestPlanData && latestPlanData.length > 0 ? (
                            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                                <Link href="/brand/strategy">View Full Plan</Link>
                            </Button>
                        ) : undefined}
                        variant="elevated"
                        className="animate-fade-in-up animate-delay-200"
                    >
                        {isPlanLoading || areCompetitorsLoading || isAuditLoading ? (
                            <StandardSkeleton variant="list" count={2} />
                        ) : latestPlanData && latestPlanData.length > 0 ? (
                            <div className="space-y-6">
                                {latestPlanData[0].steps.slice(0, 2).map((task: MarketingTask, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-4 rounded-lg border p-4 bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-all duration-300 hover:shadow-md"
                                    >
                                        <div className="flex-shrink-0 font-bold text-primary text-xl md:text-2xl font-headline mt-0.5">{index + 1}</div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm md:text-base leading-tight">{task.task}</h4>
                                            <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">{task.rationale}</p>
                                        </div>
                                    </div>
                                ))}
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
                        className="animate-fade-in-up animate-delay-300"
                    >
                        {isLoadingStats ? (
                            <StandardSkeleton variant="metric" count={3} className="mb-4 md:mb-6" />
                        ) : (
                            <div className="grid gap-6 grid-cols-3 mb-6 orientation-transition">
                                {/* Average Rating Card */}
                                <MetricCard
                                    value={parseFloat(averageRating as string)}
                                    label="Average Rating"
                                    decimals={1}
                                    icon={<Star className="h-5 w-5 md:h-6 md:w-6" />}
                                    trendData={[4.2, 4.3, 4.4, 4.5, 4.6, 4.7, parseFloat(averageRating as string)]}
                                    changePercent={5.2}
                                    showSparkline={true}
                                    showTrend={true}
                                    variant="primary"
                                />

                                {/* Total Reviews Card */}
                                <MetricCard
                                    value={totalReviews}
                                    label="Total Reviews"
                                    icon={<Award className="h-5 w-5 md:h-6 md:w-6" />}
                                    trendData={[
                                        Math.max(0, totalReviews - 15),
                                        Math.max(0, totalReviews - 12),
                                        Math.max(0, totalReviews - 9),
                                        Math.max(0, totalReviews - 6),
                                        Math.max(0, totalReviews - 3),
                                        totalReviews,
                                    ]}
                                    changePercent={8.5}
                                    showSparkline={true}
                                    showTrend={true}
                                    variant="primary"
                                />

                                {/* Recent Reviews Card */}
                                <MetricCard
                                    value={recentReviewsCount}
                                    label="New (30 days)"
                                    prefix="+"
                                    icon={<TrendingUp className="h-5 w-5 md:h-6 md:w-6" />}
                                    trendData={[
                                        Math.max(0, recentReviewsCount - 5),
                                        Math.max(0, recentReviewsCount - 4),
                                        Math.max(0, recentReviewsCount - 3),
                                        Math.max(0, recentReviewsCount - 2),
                                        Math.max(0, recentReviewsCount - 1),
                                        recentReviewsCount,
                                    ]}
                                    changePercent={15.3}
                                    showSparkline={true}
                                    showTrend={true}
                                    variant="success"
                                />
                            </div>
                        )}
                        <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-2 md:mb-3">Latest Testimonials</h3>
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
                    <StandardCard
                        variant="elevated"
                        className="animate-fade-in-up animate-delay-100 overflow-hidden"
                        contentClassName="p-0"
                    >
                        {isLoadingProfile ? (
                            <div className="p-6">
                                <StandardSkeleton variant="content" count={4} />
                            </div>
                        ) : (
                            <>
                                <div className="items-center text-center pb-3 bg-gradient-to-b from-primary/5 to-transparent p-6">
                                    <div className="relative group inline-block">
                                        <Image
                                            src={agentProfile?.photoURL || 'https://picsum.photos/seed/1/96/96'}
                                            alt={agentProfile?.name || 'Agent Profile'}
                                            width={96}
                                            height={96}
                                            className="rounded-full border-4 border-background shadow-lg group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300"
                                        />
                                        <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                    <h3 className="text-heading-2 mt-4">
                                        {agentProfile?.name}
                                    </h3>
                                    <p className="text-base font-medium text-muted-foreground mt-2">
                                        {agentProfile?.agencyName}
                                    </p>
                                </div>
                                <div className="text-xs md:text-sm space-y-2 p-6 pt-4">
                                    <div className="group flex items-center gap-4 p-3 rounded-lg hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all duration-200 cursor-default">
                                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                                            <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                        </div>
                                        <span className="text-foreground font-medium truncate">
                                            {agentProfile?.licenseNumber}
                                        </span>
                                    </div>
                                    <div className="group flex items-center gap-4 p-3 rounded-lg hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all duration-200 cursor-default">
                                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                                            <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                        </div>
                                        <span className="text-foreground font-medium truncate">
                                            {agentProfile?.certifications?.[0] || 'Real Estate'}
                                        </span>
                                    </div>
                                    <div className="group flex items-center gap-4 p-3 rounded-lg hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all duration-200 cursor-default">
                                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                                            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                        </div>
                                        <span className="text-foreground font-medium">
                                            {agentProfile?.yearsOfExperience} years experience
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </StandardCard>

                    {/* Suggested Next Steps */}
                    {!isLoadingProfile && suggestedSteps.length > 0 && (
                        <div className="animate-fade-in-up animate-delay-200">
                            <SuggestedNextSteps steps={suggestedSteps} />
                        </div>
                    )}

                    <StandardCard
                        title={
                            <span className="flex items-center gap-2">
                                <Newspaper className="text-primary h-5 w-5 flex-shrink-0" />
                                <span className="truncate">Real Estate News</span>
                            </span>
                        }
                        description="Stay on top of what's happening in real estate."
                        actions={
                            <form action={newsFormAction} className="flex-shrink-0">
                                <input type="hidden" name="location" value={agentProfile?.address || ''} />
                                <RefreshNewsButton />
                            </form>
                        }
                        variant="elevated"
                        className="animate-fade-in-up animate-delay-400"
                    >
                        <div className="space-y-6">
                            {(isPending && !latestNews?.articles) || isLoadingProfile ? (
                                <StandardSkeleton variant="list" count={3} />
                            ) : latestNews?.articles && latestNews.articles.length > 0 ? (
                                latestNews.articles.map((article, index) => (
                                    <a
                                        key={index}
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group block rounded-lg border-2 border-transparent p-3 md:p-4 transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent hover:shadow-lg hover:border-primary/20 hover:scale-[1.01]"
                                    >
                                        <h4 className="font-semibold text-sm md:text-base group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                            {article.title}
                                        </h4>
                                        <p className="text-xs md:text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                                            {article.description}
                                        </p>
                                        <div className="flex items-center justify-between mt-3">
                                            <p className="text-xs font-medium text-muted-foreground/80">
                                                {article.source}
                                            </p>
                                            <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                                        </div>
                                    </a>
                                ))
                            ) : (
                                <div className="text-center py-6 md:py-8 bg-secondary/30 rounded-lg border-2 border-dashed border-muted">
                                    <Newspaper className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                                    <p className="text-sm text-muted-foreground">No news to display.</p>
                                </div>
                            )}
                        </div>
                    </StandardCard>
                </div>
            </div>
        </div>
    );
}