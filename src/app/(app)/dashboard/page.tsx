
'use client';

import Image from 'next/image';
import { useMemo, useActionState, useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from '@/components/ui/card';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-states';
import { Star, Award, User, Briefcase, Calendar, TrendingUp, Megaphone, ArrowRight, Newspaper, RefreshCcw, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { useUser } from '@/aws/auth';
import { useItem, useQuery } from '@/aws/dynamodb/hooks';
import type { Review, Profile, MarketingPlan, BrandAudit, Competitor as CompetitorType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getRealEstateNewsAction } from '@/app/actions';
import { type GetRealEstateNewsOutput } from '@/aws/bedrock/flows/get-real-estate-news';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
    const [newsState, newsFormAction] = useActionState(getRealEstateNewsAction, initialNewsState);
    const [latestNews, setLatestNews] = useState<GetRealEstateNewsOutput | null>(null);
    const [initialLoad, setInitialLoad] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Memoize keys for DynamoDB queries
    const agentProfilePK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const agentProfileSK = useMemo(() => 'AGENT#main', []);

    const brandAuditPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const brandAuditSK = useMemo(() => 'AUDIT#main', []);

    const competitorsPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const competitorsSKPrefix = useMemo(() => 'COMPETITOR#', []);

    const plansPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const plansSKPrefix = useMemo(() => 'PLAN#', []);

    // Note: Reviews are stored with PK: REVIEW#<agentId>, so we need the user's agentId
    // For now, we'll use the user.id as the agentId
    const reviewsPK = useMemo(() => user ? `REVIEW#${user.id}` : null, [user]);
    const reviewsSKPrefix = useMemo(() => 'REVIEW#', []);

    // Fetch data using DynamoDB hooks
    const { data: agentProfile, isLoading: isLoadingProfile } = useItem<Profile>(agentProfilePK, agentProfileSK);
    const { data: allReviews, isLoading: isLoadingAllReviews } = useQuery<Review>(reviewsPK, reviewsSKPrefix);
    const { data: recentReviews, isLoading: isLoadingRecentReviews } = useQuery<Review>(reviewsPK, reviewsSKPrefix, {
        limit: 3,
        scanIndexForward: false, // descending order
    });
    const { data: latestPlanData, isLoading: isPlanLoading } = useQuery<MarketingPlan>(plansPK, plansSKPrefix, {
        limit: 1,
        scanIndexForward: false, // descending order
    });
    const { data: brandAuditData, isLoading: isAuditLoading } = useItem<BrandAudit>(brandAuditPK, brandAuditSK);
    const { data: competitorsData, isLoading: areCompetitorsLoading } = useQuery<CompetitorType>(competitorsPK, competitorsSKPrefix);

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
        if (!allReviews || allReviews.length === 0 || !user) return { averageRating: '0.0', totalReviews: 0, recentReviewsCount: 0 };

        // Since we're querying with REVIEW#<userId>, all reviews are already filtered to this user
        const myReviews = allReviews;
        if (myReviews.length === 0) return { averageRating: '0.0', totalReviews: 0, recentReviewsCount: 0 };

        const total = myReviews.reduce((acc, review) => acc + review.rating, 0);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recent = myReviews.filter(review => new Date(review.date) > thirtyDaysAgo).length;

        return {
            averageRating: (total / myReviews.length).toFixed(1),
            totalReviews: myReviews.length,
            recentReviewsCount: recent,
        };
    }, [allReviews, user]);

    const isLoadingStats = isLoadingAllReviews;
    const isLoadingCarousel = isLoadingRecentReviews;

    return (
        <div className="space-y-6 md:space-y-8">
            <div className="animate-fade-in-up">
                <PageHeader
                    title="Dashboard"
                    description={isLoadingProfile ? "Welcome back..." : `Welcome back, ${agentProfile?.name || 'Agent'}. Here's a snapshot of your authority.`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                <div className="lg:col-span-2 space-y-4 md:space-y-6 lg:space-y-8">

                    <Card className="animate-fade-in-up animate-delay-200 shadow-md hover:shadow-lg transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardTitle className="font-headline flex items-center gap-2 text-xl md:text-2xl">
                                <Megaphone className="text-primary h-5 w-5 md:h-6 md:w-6" />
                                Your Next Steps
                            </CardTitle>
                            <CardDescription className="text-sm md:text-base">
                                Your AI-generated marketing plan is ready.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isPlanLoading || areCompetitorsLoading || isAuditLoading ? (
                                <div className="space-y-3 md:space-y-4">
                                    <Skeleton className="h-20 md:h-24 w-full rounded-lg" />
                                    <Skeleton className="h-20 md:h-24 w-full rounded-lg" />
                                </div>
                            ) : latestPlanData && latestPlanData.length > 0 ? (
                                <div className="space-y-3 md:space-y-4">
                                    {latestPlanData[0].plan.slice(0, 2).map((task, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 md:gap-4 rounded-lg border p-3 md:p-4 bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-all duration-300 hover:shadow-md"
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
                                <EmptyState
                                    icon={<Sparkles className="h-8 w-8 text-primary" />}
                                    title="No Marketing Plan Yet"
                                    description="Let AI create a personalized marketing strategy tailored to your business goals and market position."
                                    action={{
                                        label: "Generate Your Plan",
                                        onClick: () => window.location.href = '/marketing-plan',
                                        variant: "ai"
                                    }}
                                    className="py-8 border-0 bg-gradient-to-br from-primary/5 to-purple-600/5"
                                />
                            )}
                        </CardContent>
                        {latestPlanData && latestPlanData.length > 0 && (
                            <CardFooter className="pt-3">
                                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                                    <Link href="/marketing-plan">View Full Plan</Link>
                                </Button>
                            </CardFooter>
                        )}
                    </Card>

                    <Card className="animate-fade-in-up animate-delay-300 shadow-md hover:shadow-lg transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardTitle className="font-headline flex items-center gap-2 text-xl md:text-2xl">
                                <Star className="text-primary h-5 w-5 md:h-6 md:w-6" />
                                Reputation Snapshot
                            </CardTitle>
                            <CardDescription className="text-sm md:text-base">
                                Your latest client feedback from across the web.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-3 mb-4 md:mb-6">
                                {/* Average Rating Card */}
                                <div className="group flex flex-col items-center justify-center rounded-xl border-2 p-4 md:p-6 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent hover:from-primary/10 hover:via-primary/5 hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300">
                                    {isLoadingStats ? (
                                        <div className="flex flex-col items-center w-full">
                                            <Skeleton className="h-10 md:h-12 w-20 md:w-24 mb-3 rounded-lg" />
                                            <div className="flex items-center gap-1 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Skeleton key={i} className="h-4 w-4 md:h-5 md:w-5 rounded-sm" />
                                                ))}
                                            </div>
                                            <Skeleton className="h-4 w-24 md:w-28 rounded" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                                                {averageRating}
                                            </div>
                                            <div className="flex items-center gap-0.5 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={cn(
                                                            "h-4 w-4 md:h-5 md:w-5 transition-all duration-300",
                                                            i < parseFloat(averageRating as string)
                                                                ? 'text-yellow-400 fill-yellow-400 group-hover:scale-110'
                                                                : 'text-muted-foreground/30'
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs md:text-sm font-medium text-muted-foreground text-center">
                                                Average Rating
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Total Reviews Card */}
                                <div className="group flex flex-col items-center justify-center rounded-xl border-2 p-4 md:p-6 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent hover:from-primary/10 hover:via-primary/5 hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 transition-all duration-300">
                                    {isLoadingStats ? (
                                        <div className="flex flex-col items-center w-full">
                                            <Skeleton className="h-10 md:h-12 w-16 md:w-20 mb-3 rounded-lg" />
                                            <Skeleton className="h-4 w-20 md:w-24 rounded" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                                                {totalReviews}
                                            </div>
                                            <p className="text-xs md:text-sm font-medium text-muted-foreground text-center">
                                                Total Reviews
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Recent Reviews Card */}
                                <div className="group flex flex-col items-center justify-center rounded-xl border-2 p-4 md:p-6 bg-gradient-to-br from-success/5 via-success/3 to-transparent hover:from-success/10 hover:via-success/5 hover:shadow-lg hover:scale-[1.02] hover:border-success/30 transition-all duration-300">
                                    {isLoadingStats ? (
                                        <div className="flex flex-col items-center w-full">
                                            <Skeleton className="h-10 md:h-12 w-20 md:w-24 mb-3 rounded-lg" />
                                            <Skeleton className="h-4 w-24 md:w-28 rounded" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2 flex items-center group-hover:scale-110 transition-transform duration-300">
                                                <span>+{recentReviewsCount}</span>
                                                <TrendingUp className="h-5 w-5 md:h-7 md:w-7 ml-2 text-success group-hover:translate-y-[-2px] transition-transform duration-300" />
                                            </div>
                                            <p className="text-xs md:text-sm font-medium text-muted-foreground text-center">
                                                New (30 days)
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-2 md:mb-3">Latest Testimonials</h3>
                            <Carousel
                                opts={{
                                    align: 'start',
                                }}
                                className="w-full"
                            >
                                <CarouselContent>
                                    {isLoadingCarousel ? (
                                        [...Array(2)].map((_, i) => (
                                            <CarouselItem key={`skeleton-${i}`} className="md:basis-full lg:basis-1/2">
                                                <div className="p-1 h-full">
                                                    <Card className="h-full flex flex-col justify-between p-3 md:p-4 bg-secondary/30">
                                                        <Skeleton className="h-5 md:h-6 w-20 md:w-24 rounded-full" />
                                                        <Skeleton className="h-3 md:h-4 w-full mt-2" />
                                                        <Skeleton className="h-3 md:h-4 w-3/4 mt-1" />
                                                    </Card>
                                                </div>
                                            </CarouselItem>
                                        ))
                                    ) : recentReviews && recentReviews.length > 0 ? (
                                        recentReviews.map((review) => (
                                            <CarouselItem key={review.id} className="md:basis-full lg:basis-1/2">
                                                <div className="p-1 h-full">
                                                    <Link href="/brand-audit">
                                                        <Card className="h-full flex flex-col bg-secondary/30 hover:bg-secondary/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                                                            <CardHeader className="flex-row items-start gap-3 md:gap-4 space-y-0 pb-2">
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
                                                            </CardHeader>
                                                            <CardContent className="flex-grow pt-2">
                                                                <p className="text-xs md:text-sm text-muted-foreground italic line-clamp-3">
                                                                    "{review.comment}"
                                                                </p>
                                                            </CardContent>
                                                        </Card>
                                                    </Link>
                                                </div>
                                            </CarouselItem>
                                        ))
                                    ) : (
                                        <CarouselItem>
                                            <div className="p-1 h-full">
                                                <EmptyState
                                                    icon={<MessageSquare className="h-8 w-8 text-primary" />}
                                                    title="No Reviews Yet"
                                                    description="Start building your online reputation by collecting client testimonials and reviews from various platforms."
                                                    action={{
                                                        label: "Run Brand Audit",
                                                        onClick: () => window.location.href = '/brand-audit',
                                                        variant: "default"
                                                    }}
                                                    className="py-6 border-0 bg-secondary/30"
                                                />
                                            </div>
                                        </CarouselItem>
                                    )}
                                </CarouselContent>
                                <CarouselPrevious className="hidden sm:flex -left-4" />
                                <CarouselNext className="hidden sm:flex -right-4" />
                            </Carousel>
                        </CardContent>
                    </Card>

                </div>

                <div className="lg:col-span-1 space-y-4 md:space-y-6 lg:space-y-8">
                    <Card className="animate-fade-in-up animate-delay-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                        {isLoadingProfile ? (
                            <div className="flex flex-col items-center p-4 md:p-6 space-y-3 md:space-y-4">
                                <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full" />
                                <Skeleton className="h-6 md:h-7 w-36 md:w-48 rounded-lg" />
                                <Skeleton className="h-4 md:h-5 w-28 md:w-36 rounded" />
                                <div className="w-full space-y-3 pt-4">
                                    <Skeleton className="h-10 w-full rounded-lg" />
                                    <Skeleton className="h-10 w-full rounded-lg" />
                                    <Skeleton className="h-10 w-full rounded-lg" />
                                </div>
                            </div>
                        ) : (
                            <>
                                <CardHeader className="items-center text-center pb-3 bg-gradient-to-b from-primary/5 to-transparent">
                                    <div className="relative group">
                                        <Image
                                            src={agentProfile?.photoURL || 'https://picsum.photos/seed/1/96/96'}
                                            alt={agentProfile?.name || 'Agent Profile'}
                                            width={96}
                                            height={96}
                                            className="rounded-full border-4 border-background shadow-lg group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300"
                                        />
                                        <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                    <CardTitle className="font-headline text-xl md:text-2xl mt-4 tracking-tight">
                                        {agentProfile?.name}
                                    </CardTitle>
                                    <CardDescription className="text-sm md:text-base font-medium">
                                        {agentProfile?.agencyName}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-xs md:text-sm space-y-2 md:space-y-3 pt-4">
                                    <div className="group flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all duration-200 cursor-default">
                                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                                            <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                        </div>
                                        <span className="text-foreground font-medium truncate">
                                            {agentProfile?.licenseNumber}
                                        </span>
                                    </div>
                                    <div className="group flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all duration-200 cursor-default">
                                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                                            <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                        </div>
                                        <span className="text-foreground font-medium truncate">
                                            {agentProfile?.certifications?.[0] || 'Real Estate'}
                                        </span>
                                    </div>
                                    <div className="group flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all duration-200 cursor-default">
                                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                                            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                        </div>
                                        <span className="text-foreground font-medium">
                                            {agentProfile?.yearsOfExperience} years experience
                                        </span>
                                    </div>
                                </CardContent>
                            </>
                        )}
                    </Card>

                    <Card className="animate-fade-in-up animate-delay-400 shadow-md hover:shadow-lg transition-all duration-300">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="font-headline flex items-center gap-2 text-lg md:text-xl">
                                    <Newspaper className="text-primary h-5 w-5 flex-shrink-0" />
                                    <span className="truncate">Real Estate News</span>
                                </CardTitle>
                                <CardDescription className="text-xs md:text-sm">The latest market headlines.</CardDescription>
                            </div>
                            <form action={newsFormAction} className="flex-shrink-0">
                                <input type="hidden" name="location" value={agentProfile?.address || ''} />
                                <RefreshNewsButton />
                            </form>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 md:space-y-4">
                                {(isPending && !latestNews?.articles) || isLoadingProfile ? (
                                    [...Array(3)].map((_, i) => (
                                        <div key={i} className="space-y-2 rounded-lg border-2 p-3 md:p-4 bg-gradient-to-r from-muted/50 to-transparent">
                                            <Skeleton className="h-5 md:h-6 w-3/4 rounded-lg" />
                                            <Skeleton className="h-4 w-full rounded" />
                                            <Skeleton className="h-4 w-5/6 rounded" />
                                            <div className="flex items-center justify-between pt-1">
                                                <Skeleton className="h-3 w-24 rounded" />
                                            </div>
                                        </div>
                                    ))
                                ) : latestNews?.articles && latestNews.articles.length > 0 ? (
                                    latestNews.articles.map((article: { title: string; url: string; source: string; summary: string }, index: number) => (
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
                                                {article.summary}
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}