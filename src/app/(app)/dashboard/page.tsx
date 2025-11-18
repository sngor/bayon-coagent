
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
import { Star, Award, User, Briefcase, Calendar, TrendingUp, Megaphone, ArrowRight, Newspaper, RefreshCcw, Loader2 } from 'lucide-react';
import { useUser } from '@/aws/auth';
import { useItem, useQuery } from '@/aws/dynamodb/hooks';
import type { Review, Profile, MarketingPlan, BrandAudit, Competitor as CompetitorType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getRealEstateNewsAction } from '@/app/actions';
import { type GetRealEstateNewsOutput } from '@/ai/flows/get-real-estate-news';
import { toast } from '@/hooks/use-toast';

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
        <div className="animate-fade-in-up space-y-8">
            <PageHeader
                title="Dashboard"
                description={isLoadingProfile ? "Welcome back..." : `Welcome back, ${agentProfile?.name || 'Agent'}. Here's a snapshot of your authority.`}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">

                    <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <Megaphone className="text-primary" />
                                Your Next Steps
                            </CardTitle>
                            <CardDescription>
                                Your AI-generated marketing plan is ready.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isPlanLoading || areCompetitorsLoading || isAuditLoading ? (
                                <Skeleton className="h-24 w-full" />
                            ) : latestPlanData && latestPlanData.length > 0 ? (
                                <div className="space-y-4">
                                    {latestPlanData[0].plan.slice(0, 2).map((task, index) => (
                                        <div key={index} className="flex items-center gap-4 rounded-lg border p-4">
                                            <div className="flex-shrink-0 font-bold text-primary text-2xl font-headline">{index + 1}</div>
                                            <div>
                                                <h4 className="font-semibold">{task.task}</h4>
                                                <p className="text-sm text-muted-foreground">{task.rationale}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground p-8">
                                    <p>You haven't generated a marketing plan yet.</p>
                                    <Button asChild size="sm" className="mt-4">
                                        <Link href="/marketing-plan">
                                            Generate Your Plan Now
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/marketing-plan">View Full Plan</Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <Star className="text-primary" />
                                Reputation Snapshot
                            </CardTitle>
                            <CardDescription>
                                Your latest client feedback from across the web.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 sm:grid-cols-3 mb-6">
                                <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                                    {isLoadingStats ? (
                                        <>
                                            <Skeleton className="h-10 w-24 mb-2" />
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-4 w-24 mt-2" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-4xl font-bold text-primary">{averageRating}</div>
                                            <div className="flex items-center gap-0.5 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`h-5 w-5 ${i < parseFloat(averageRating as string) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                                                ))}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2">Average Rating</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                                    {isLoadingStats ? (
                                        <>
                                            <Skeleton className="h-10 w-12 mb-2" />
                                            <Skeleton className="h-4 w-24 mt-2" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-4xl font-bold text-primary">{totalReviews}</div>
                                            <p className="text-sm text-muted-foreground mt-2">Total Reviews</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                                    {isLoadingStats ? (
                                        <>
                                            <Skeleton className="h-10 w-16 mb-2" />
                                            <Skeleton className="h-4 w-28 mt-2" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-4xl font-bold text-primary flex items-center">
                                                +{recentReviewsCount}
                                                <TrendingUp className="h-6 w-6 ml-2 text-green-500" />
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2">New Reviews (30d)</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Latest Testimonials</h3>
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
                                                <div className="p-1 h-full"><Card className="h-full flex flex-col justify-between p-4 bg-secondary/30"><Skeleton className="h-6 w-24 rounded-full" /><Skeleton className="h-4 w-full mt-2" /><Skeleton className="h-4 w-3/4 mt-1" /></Card></div>
                                            </CarouselItem>
                                        ))
                                    ) : recentReviews && recentReviews.length > 0 ? (
                                        recentReviews.map((review) => (
                                            <CarouselItem key={review.id} className="md:basis-full lg:basis-1/2">
                                                <div className="p-1 h-full">
                                                    <Link href="/brand-audit">
                                                        <Card className="h-full flex flex-col bg-secondary/30 card-interactive">
                                                            <CardHeader className="flex-row items-start gap-4 space-y-0 pb-2">
                                                                {review.avatarUrl && <Image
                                                                    src={review.avatarUrl}
                                                                    alt={review.author.name}
                                                                    width={40}
                                                                    height={40}
                                                                    className="rounded-full"
                                                                    data-ai-hint="happy person"
                                                                />}
                                                                <div>
                                                                    <p className="font-semibold text-sm">{review.author.name || 'Anonymous'}</p>
                                                                    <p className="text-xs text-muted-foreground">{review.source}</p>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent className="flex-grow pt-2">
                                                                <p className="text-sm text-muted-foreground italic line-clamp-3">
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
                                            <div className="p-1 h-full"><Card className="h-full flex items-center justify-center bg-secondary/30"><p>No reviews yet.</p></Card></div>
                                        </CarouselItem>
                                    )}
                                </CarouselContent>
                                <CarouselPrevious className="hidden sm:flex -left-4" />
                                <CarouselNext className="hidden sm:flex -right-4" />
                            </Carousel>
                        </CardContent>
                    </Card>

                </div>

                <div className="lg:col-span-1 space-y-8">
                    <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        {isLoadingProfile ? (
                            <div className="flex flex-col items-center p-6 space-y-4">
                                <Skeleton className="w-24 h-24 rounded-full" />
                                <Skeleton className="h-7 w-48" />
                                <Skeleton className="h-5 w-36" />
                            </div>
                        ) : (
                            <CardHeader className="items-center text-center">
                                <Image
                                    src={agentProfile?.photoURL || 'https://picsum.photos/seed/1/96/96'}
                                    alt={agentProfile?.name || 'Agent Profile'}
                                    width={96}
                                    height={96}
                                    className="rounded-full border-4 border-background shadow-md"
                                />
                                <CardTitle className="font-headline text-2xl">{agentProfile?.name}</CardTitle>
                                <CardDescription>{agentProfile?.agencyName}</CardDescription>
                            </CardHeader>
                        )}
                        <CardContent className="text-sm space-y-4">
                            {isLoadingProfile ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-5 w-full" />
                                    <Skeleton className="h-5 w-4/5" />
                                    <Skeleton className="h-5 w-3/4" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-muted-foreground">{agentProfile?.licenseNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Briefcase className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-muted-foreground">Specializes in {agentProfile?.certifications?.[0]}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-muted-foreground">{agentProfile?.yearsOfExperience} years of experience</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-headline flex items-center gap-2">
                                    <Newspaper className="text-primary" />
                                    Real Estate News
                                </CardTitle>
                                <CardDescription>The latest market headlines.</CardDescription>
                            </div>
                            <form action={newsFormAction}>
                                <input type="hidden" name="location" value={agentProfile?.address || ''} />
                                <RefreshNewsButton />
                            </form>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {(isPending && !latestNews?.articles) || isLoadingProfile ? (
                                    [...Array(3)].map((_, i) => (
                                        <li key={i} className="space-y-2 rounded-lg border p-4">
                                            <Skeleton className="h-5 w-3/4" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-3 w-1/4" />
                                        </li>
                                    ))
                                ) : latestNews?.articles && latestNews.articles.length > 0 ? (
                                    latestNews.articles.map((article, index) => (
                                        <li key={index}>
                                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="group block rounded-lg border p-4 transition-all hover:bg-secondary/50">
                                                <h4 className="font-semibold group-hover:text-primary">{article.title}</h4>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
                                                <p className="text-xs text-muted-foreground/80 mt-2">{article.source}</p>
                                            </a>
                                        </li>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No news to display.</p>
                                )}
                                {newsState.message && newsState.message !== 'success' && <p className="text-sm text-destructive">{newsState.message}</p>}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}