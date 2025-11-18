
'use client';

import { useMemo, useState, useEffect, useTransition, useActionState } from 'react';
import { PageHeader } from '@/components/page-header';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, ArrowRight, Loader2, Sparkles, ServerCrash, Lightbulb, ExternalLink, Star, Globe, Home, Building, MessageSquareQuote, Bot, Trash2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent
} from '@/components/ui/chart';
import { RadialBar, RadialBarChart, Cell } from 'recharts';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { getOAuthTokens, type OAuthTokenData } from '@/aws/dynamodb';
import { useUser } from '@/aws/auth';
import { doc, collection, query } from 'firebase/firestore';
import type { Profile, Review, BrandAudit as BrandAuditType, ReviewAnalysis } from '@/lib/types';
import { runNapAuditAction, getZillowReviewsAction, analyzeReviewSentimentAction, analyzeMultipleReviewsAction } from '@/app/actions';
import { toast } from '@/hooks/use-toast';
import { JsonLdDisplay } from '@/components/json-ld-display';
import { useFormStatus } from 'react-dom';
import { type AnalyzeMultipleReviewsOutput } from '@/ai/flows/analyze-multiple-reviews';


type AuditResult = {
    platform: string;
    platformUrl?: string;
    foundName?: string;
    foundAddress?: string;
    foundPhone?: string;
    status: 'Consistent' | 'Inconsistent' | 'Not Found';
};

type InitialAuditState = {
    message: string;
    data: AuditResult[] | null;
    errors: any;
};

const initialAuditState: InitialAuditState = {
    message: '',
    data: null,
    errors: {},
};

type ZillowReview = {
    authorName: string;
    rating: number;
    comment: string;
    date: string;
}

type ZillowReviewState = {
    message: string;
    data: { reviews: ZillowReview[] } | null;
    errors: any;
};

const initialZillowReviewState: ZillowReviewState = {
    message: '',
    data: null,
    errors: {},
};

type SentimentState = {
    message: string;
    data: { sentiment: string; summary: string } | null;
    errors: any;
};

const initialSentimentState: SentimentState = {
    message: '',
    data: null,
    errors: {},
};

type BulkAnalysisState = {
    message: string;
    data: AnalyzeMultipleReviewsOutput | null;
    errors: any;
}

const initialBulkAnalysisState: BulkAnalysisState = {
    message: '',
    data: null,
    errors: {}
}


const sourceIcons: { [key: string]: React.ReactNode } = {
    Google: <Globe className="w-4 h-4" />,
    Zillow: <Home className="w-4 h-4" />,
    Yelp: <Building className="w-4 h-4" />,
};

const generateReviewSchema = (review: Review) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": "5"
    },
    "author": {
        "@type": "Person",
        "name": review.author.name
    },
    "reviewBody": review.comment,
    "publisher": {
        "@type": "Organization",
        "name": review.source
    }
});


function RunAuditButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant={pending ? 'shimmer' : 'ai'} disabled={pending || disabled}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {pending ? 'Auditing...' : 'Run Audit'}
        </Button>
    )
}

function FetchReviewsButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending || disabled}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {pending ? 'Fetching...' : 'Fetch Reviews'}
        </Button>
    )
}

function AnalyzeAllButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant={pending ? 'shimmer' : 'ai'} disabled={pending || disabled}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
            {pending ? 'Analyzing...' : 'Analyze All Reviews'}
        </Button>
    )
}

function AnalyzeSentimentButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquareQuote className="mr-2 h-4 w-4" />}
            Analyze
        </Button>
    )
}

function FetchedReviewCard({ review }: { review: ZillowReview }) {
    const [sentimentState, sentimentFormAction] = useActionState(analyzeReviewSentimentAction, initialSentimentState);

    return (
        <Card className="bg-secondary/30">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold">{review.authorName}</p>
                        <p className="text-sm text-muted-foreground">{new Date(review.date).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-0.5 pt-2">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground italic">"{review.comment}"</p>
                {sentimentState.data && (
                    <div className="mt-4 p-3 rounded-md bg-background/50 border">
                        <div className="flex items-center gap-2">
                            <Badge
                                variant={sentimentState.data.sentiment === 'Positive' ? 'default' : sentimentState.data.sentiment === 'Negative' ? 'destructive' : 'secondary'}
                                className={cn(
                                    sentimentState.data.sentiment === 'Positive' && 'bg-green-100 text-green-800',
                                    sentimentState.data.sentiment === 'Negative' && 'bg-red-100 text-red-800',
                                )}
                            >
                                {sentimentState.data.sentiment}
                            </Badge>
                            <p className="text-sm text-muted-foreground">{sentimentState.data.summary}</p>
                        </div>
                    </div>
                )}
                {sentimentState.message && sentimentState.message !== 'success' && <p className="text-sm text-destructive mt-2">{sentimentState.message}</p>}
            </CardContent>
            <CardFooter>
                <form action={sentimentFormAction}>
                    <input type="hidden" name="comment" value={review.comment} />
                    <AnalyzeSentimentButton />
                </form>
            </CardFooter>
        </Card>
    )
}


// Helper function for case-insensitive comparison
const isDifferent = (val1?: string, val2?: string) => {
    if (!val1 || !val2) return false; // Don't highlight if one is missing
    return val1.trim().toLowerCase() !== val2.trim().toLowerCase();
}


/**
 * A page for auditing an agent's online brand presence.
 * Displays overall brand score, NAP consistency, and a client review feed.
 */
export default function BrandAuditPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [auditState, auditFormAction] = useActionState(runNapAuditAction, initialAuditState);
    const [zillowState, zillowFormAction] = useActionState(getZillowReviewsAction, initialZillowReviewState);
    const [bulkAnalysisState, bulkAnalysisFormAction] = useActionState(analyzeMultipleReviewsAction, initialBulkAnalysisState);

    const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

    const agentProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, `users/${user.uid}/agentProfiles/main`);
    }, [firestore, user]);

    const { data: agentProfileData, isLoading: isProfileLoading } = useDoc<Profile>(agentProfileRef);

    const brandAuditRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, `users/${user.uid}/brandAudits/main`);
    }, [firestore, user]);

    const { data: savedAuditData } = useDoc<BrandAuditType>(brandAuditRef);

    const reviewAnalysisRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, `users/${user.uid}/reviewAnalyses/main`);
    }, [firestore, user]);

    const { data: savedAnalysisData } = useDoc<ReviewAnalysis>(reviewAnalysisRef);


    const reviewsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'reviews'));
    }, [firestore]);

    const { data: reviews, isLoading: isLoadingReviews } = useCollection<Review>(reviewsQuery);

    const [gbpData, setGbpData] = useState<OAuthTokenData | null>(null);

    useEffect(() => {
        async function loadOAuthTokens() {
            if (!user) return;

            try {
                const tokens = await getOAuthTokens(user.id, 'GOOGLE_BUSINESS');
                setGbpData(tokens);
            } catch (error) {
                console.error('Failed to load OAuth tokens:', error);
                setGbpData(null);
            }
        }

        loadOAuthTokens();
    }, [user]);

    const displayAuditData = auditState.data || savedAuditData?.results || null;
    const fetchedReviews = zillowState.data?.reviews;
    const displayAnalysisData = bulkAnalysisState.data || savedAnalysisData || null;

    const isAuditDisabled = isUserLoading || isProfileLoading || !agentProfileData?.name || !agentProfileData?.address || !agentProfileData?.phone || !agentProfileData.agencyName;
    const isZillowDisabled = isUserLoading || isProfileLoading || !agentProfileData?.zillowEmail;


    useEffect(() => {
        if (zillowState.message === 'success' && zillowState.data) {
            if (zillowState.data.reviews.length > 0) {
                toast({ title: 'Reviews Fetched!', description: `Found ${zillowState.data.reviews.length} reviews from Zillow.` });
            } else {
                toast({ title: 'No New Reviews', description: 'No reviews were found for this Zillow profile.' });
            }
        } else if (zillowState.message && zillowState.message !== 'success') {
            toast({ variant: 'destructive', title: 'Failed to Fetch Reviews', description: zillowState.message });
        }
    }, [zillowState]);

    const { completenessScore, profileCompleteness } = useMemo(() => {
        if (!agentProfileData) return { completenessScore: 0, profileCompleteness: 0 };
        const fields: (keyof Profile)[] = ['name', 'licenseNumber', 'certifications', 'yearsOfExperience', 'bio', 'phone', 'address', 'agencyName', 'website', 'zillowEmail'];
        const filledFields = fields.filter(field => !!agentProfileData[field as keyof typeof agentProfileData]).length;
        const profileCompleteness = filledFields / fields.length;
        return {
            completenessScore: Math.round(profileCompleteness * 100),
            profileCompleteness
        }
    }, [agentProfileData]);

    const gbpConnected = useMemo(() => !!gbpData?.accessToken, [gbpData]);

    const overallScore = useMemo(() => {
        // Weighting: Profile 60%, GBP 40%
        const profileScore = profileCompleteness * 60;
        const gbpScore = (gbpConnected ? 1 : 0) * 40;
        return Math.round(profileScore + gbpScore);
    }, [profileCompleteness, gbpConnected]);

    useEffect(() => {
        if (auditState.message === 'success' && auditState.data && user?.uid && firestore) {
            const auditData = {
                id: 'main',
                results: auditState.data,
                lastRun: new Date().toISOString(),
            }
            const auditDocRef = doc(firestore, `users/${user.uid}/brandAudits/main`);
            setDocumentNonBlocking(auditDocRef, auditData, { merge: true });
            toast({
                title: 'Audit Complete',
                description: "Your NAP consistency results have been updated."
            });
        } else if (auditState.message && auditState.message !== 'success') {
            toast({
                variant: 'destructive',
                title: 'Audit Failed',
                description: auditState.message,
            });
        }
    }, [auditState, user?.uid, firestore]);

    const handleDeleteReview = () => {
        if (!reviewToDelete || !user || !firestore) return;
        const reviewDocRef = doc(firestore, 'reviews', reviewToDelete.id);
        deleteDocumentNonBlocking(reviewDocRef);
        toast({
            title: 'Review Deleted',
            description: `The review from ${reviewToDelete.author.name} has been removed.`,
        });
        setReviewToDelete(null);
    };

    const reviewDistribution = useMemo(() => {
        if (!reviews) return [];
        const distribution: { [key: string]: number } = {
            Google: 0,
            Zillow: 0,
            Yelp: 0,
        };
        reviews.forEach((review) => {
            if (distribution[review.source] !== undefined) {
                distribution[review.source]++;
            }
        });
        return Object.entries(distribution).map(([source, count]) => ({
            source,
            reviews: count,
            fill:
                source === 'Google'
                    ? 'hsl(var(--chart-1))'
                    : source === 'Zillow'
                        ? 'hsl(var(--chart-2))'
                        : 'hsl(var(--chart-3))',
        }));
    }, [reviews]);

    const totalReviews = useMemo(() => {
        return reviewDistribution.reduce((acc, curr) => acc + curr.reviews, 0);
    }, [reviewDistribution]);

    const chartConfig = {
        reviews: {
            label: 'Reviews',
        },
        Google: {
            label: 'Google',
            color: 'hsl(var(--chart-1))',
        },
        Zillow: {
            label: 'Zillow',
            color: 'hsl(var(--chart-2))',
        },
        Yelp: {
            label: 'Yelp',
            color: 'hsl(var(--chart-3))',
        },
    };


    return (
        <div className="animate-fade-in-up space-y-8">
            <PageHeader
                title="Brand Audit"
                description="A unified view of your online presence, authority, and reputation."
            />

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <CardHeader>
                            <CardTitle className="font-headline">Overall Brand Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-6">
                                    <div className="text-6xl font-bold text-primary">{overallScore}</div>
                                    <p className="text-muted-foreground">out of 100</p>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-muted-foreground">
                                        Your Brand Score is a measure of your online authority and consistency. A higher score means a stronger digital presence, making it easier for clients to find and trust you.
                                    </p>
                                    <p className="text-muted-foreground">
                                        This score is based on profile completeness, key integrations like Google Business Profile, and NAP consistency across major platforms.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <CardHeader>
                            <CardTitle className="font-headline">NAP Consistency Audit</CardTitle>
                            <CardDescription>
                                Ensuring your Name, Address, and Phone are consistent is vital for local SEO.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Your Official Business Information</h3>
                                <div className="space-y-2 rounded-lg border p-4 text-sm">
                                    <p><strong className="w-20 inline-block font-medium">Name:</strong> {agentProfileData?.name || 'Not set'}</p>
                                    <p><strong className="w-20 inline-block font-medium">Address:</strong> {agentProfileData?.address || 'Not set'}</p>
                                    <p><strong className="w-20 inline-block font-medium">Phone:</strong> {agentProfileData?.phone || 'Not set'}</p>
                                    <p><strong className="w-20 inline-block font-medium">Website:</strong> {agentProfileData?.website || 'Not set'}</p>
                                </div>
                            </div>

                            <form action={auditFormAction}>
                                <input type="hidden" name="name" value={agentProfileData?.name || ''} />
                                <input type="hidden" name="agencyName" value={agentProfileData?.agencyName || ''} />
                                <input type="hidden" name="address" value={agentProfileData?.address || ''} />
                                <input type="hidden" name="phone" value={agentProfileData?.phone || ''} />
                                <input type="hidden" name="website" value={agentProfileData?.website || ''} />
                                <RunAuditButton disabled={isAuditDisabled} />
                            </form>

                            {displayAuditData && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-medium font-headline mb-4">Audit Results</h3>
                                    <div className="border rounded-lg overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[150px]">Platform</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Found Name</TableHead>
                                                    <TableHead>Found Address</TableHead>
                                                    <TableHead>Found Phone</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {displayAuditData.map((result) => (
                                                    <TableRow key={result.platform}>
                                                        <TableCell className="font-medium">{result.platform}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={result.status === 'Consistent' ? 'default' : result.status === 'Inconsistent' ? 'destructive' : 'secondary'}
                                                                className={cn(result.status === 'Consistent' && 'bg-green-100 text-green-800', result.status === 'Inconsistent' && 'bg-red-100 text-red-800')}
                                                            >
                                                                {result.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className={cn("text-sm", result.status === 'Inconsistent' && isDifferent(result.foundName, agentProfileData?.name) && 'text-destructive font-semibold')}>
                                                            {result.foundName || 'N/A'}
                                                        </TableCell>
                                                        <TableCell className={cn("text-sm", result.status === 'Inconsistent' && isDifferent(result.foundAddress, agentProfileData?.address) && 'text-destructive font-semibold')}>
                                                            {result.foundAddress || 'N/A'}
                                                        </TableCell>
                                                        <TableCell className={cn("text-sm", result.status === 'Inconsistent' && isDifferent(result.foundPhone, agentProfileData?.phone) && 'text-destructive font-semibold')}>
                                                            {result.foundPhone || 'N/A'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {result.platformUrl && (
                                                                <Button variant="outline" size="sm" asChild>
                                                                    <a href={result.platformUrl} target="_blank" rel="noopener noreferrer">
                                                                        Fix Now <ExternalLink className="ml-2 h-3 w-3" />
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <div className="mt-4 p-4 bg-accent/50 rounded-lg text-sm">
                                        <div className="flex items-start gap-3">
                                            <Lightbulb className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-accent-foreground">How to Fix Inconsistencies</h4>
                                                <p className="text-muted-foreground mt-1">
                                                    For any platforms marked 'Inconsistent', use the 'Fix Now' button to go to the page and update your profile information to exactly match your official details. For 'Not Found' results, create a profile on that platform. Consistency is key for local SEO.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {auditState.message && auditState.message !== 'success' && (
                                <div className="mt-6 rounded-lg bg-destructive/10 p-4 border border-destructive/20 animate-shake">
                                    <div className="flex items-start gap-3">
                                        <ServerCrash className="h-5 mt-0.5 text-destructive flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-destructive">Audit Failed</h4>
                                            <p className="text-sm text-destructive/80">
                                                {auditState.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
                <div className="lg:col-span-1 space-y-8">
                    <Card className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <CardHeader>
                            <CardTitle className="font-headline">Profile Completeness</CardTitle>
                            <CardDescription>
                                A complete profile builds trust and improves your visibility.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Progress value={completenessScore} />
                            <div className="text-sm text-muted-foreground">
                                Your profile is {completenessScore}% complete.
                                {completenessScore < 100 && ' Fill out the remaining sections to improve your score.'}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" asChild>
                                <Link href="/profile">
                                    Edit Profile <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                    <Card className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <CardHeader>
                            <CardTitle className="font-headline">Google Business Profile</CardTitle>
                            <CardDescription>
                                Critical for local search visibility.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className={cn(
                                "flex items-center gap-3 rounded-lg p-4 text-lg font-semibold",
                                gbpConnected ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            )}>
                                {gbpConnected ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                                <span>{gbpConnected ? 'Connected' : 'Not Connected'}</span>
                            </div>
                        </CardContent>
                        {!gbpConnected && (
                            <CardFooter>
                                <Button variant="default" asChild>
                                    <Link href="/integrations" >
                                        Connect Now <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                    <Card className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <CardHeader>
                            <CardTitle className="font-headline">
                                Review Distribution
                            </CardTitle>
                            <CardDescription>
                                Where your client reviews are coming from.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-0">
                            <ChartContainer
                                config={chartConfig}
                                className="mx-auto aspect-square max-h-[250px]"
                            >
                                <RadialBarChart
                                    data={reviewDistribution}
                                    innerRadius="30%"
                                    outerRadius="100%"
                                    startAngle={90}
                                    endAngle={-270}
                                    animationDuration={500}
                                >
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <RadialBar dataKey="reviews" background>
                                        {reviewDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </RadialBar>
                                    <ChartLegend content={<ChartLegendContent nameKey="source" />} />
                                </RadialBarChart>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter className="flex-col gap-2 text-sm">
                            <div className="flex items-center gap-2 font-medium leading-none">
                                Total Reviews: {totalReviews}
                            </div>
                            <div className="leading-none text-muted-foreground">
                                Showing total reviews from all sources
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="lg:col-span-1 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                    <CardHeader>
                        <CardTitle className="font-headline">Zillow Review Importer & Analyzer</CardTitle>
                        <CardDescription>Fetch your latest Zillow reviews and analyze sentiment with AI.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            <form action={zillowFormAction}>
                                <input type="hidden" name="agentEmail" value={agentProfileData?.zillowEmail || ''} />
                                <FetchReviewsButton disabled={isZillowDisabled} />
                            </form>
                            {fetchedReviews && fetchedReviews.length > 0 && (
                                <form action={bulkAnalysisFormAction}>
                                    <input type="hidden" name="comments" value={JSON.stringify(fetchedReviews.map(r => r.comment))} />
                                    <input type="hidden" name="userId" value={user?.uid || ''} />
                                    <AnalyzeAllButton />
                                </form>
                            )}
                        </div>
                        {isZillowDisabled && <p className="text-sm text-muted-foreground mt-2">Set your Zillow email in your <Link href="/profile" className="underline">profile</Link> to use this feature.</p>}

                        {displayAnalysisData && (
                            <Card className="mt-6 bg-secondary/30">
                                <CardHeader>
                                    <CardTitle className="font-headline text-lg">Overall Review Analysis</CardTitle>
                                    {'analyzedAt' in displayAnalysisData && displayAnalysisData.analyzedAt && <CardDescription>Last analyzed on {new Date(displayAnalysisData.analyzedAt).toLocaleString()}</CardDescription>}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold">Overall Sentiment</h4>
                                        <Badge
                                            variant={displayAnalysisData.overallSentiment === 'Positive' ? 'default' : displayAnalysisData.overallSentiment === 'Negative' ? 'destructive' : 'secondary'}
                                            className={cn(
                                                'mt-1',
                                                displayAnalysisData.overallSentiment === 'Positive' && 'bg-green-100 text-green-800',
                                                displayAnalysisData.overallSentiment === 'Negative' && 'bg-red-100 text-red-800',
                                            )}
                                        >
                                            {displayAnalysisData.overallSentiment}
                                        </Badge>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Summary</h4>
                                        <p className="text-sm text-muted-foreground mt-1">{displayAnalysisData.summary}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Common Themes</h4>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {displayAnalysisData.commonThemes.map(theme => <Badge key={theme} variant="secondary">{theme}</Badge>)}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Keywords</h4>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {displayAnalysisData.keywords.map(keyword => <Badge key={keyword} variant="outline">{keyword}</Badge>)}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}


                        {fetchedReviews && (
                            <div className="mt-6 space-y-4">
                                <h3 className="text-lg font-medium font-headline">Fetched Reviews</h3>
                                {fetchedReviews.map((review, index) => (
                                    <FetchedReviewCard key={index} review={review} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                    <CardHeader>
                        <CardTitle className="font-headline">Client Review Feed</CardTitle>
                        <CardDescription>Your latest reviews from across the web.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingReviews && <p>Loading reviews...</p>}
                        <AlertDialog>
                            {reviews && reviews.length > 0 ? (
                                reviews.map((review) => (
                                    <Card key={review.id} className="bg-secondary/30 card-interactive group/review">
                                        <CardHeader>
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex items-start gap-4">
                                                    {review.avatarUrl && (
                                                        <Image
                                                            src={review.avatarUrl}
                                                            alt={review.author.name}
                                                            width={48}
                                                            height={48}
                                                            className="rounded-full"
                                                            data-ai-hint="happy person"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="font-semibold">{review.author.name}</p>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            {sourceIcons[review.source] || (
                                                                <Globe className="w-4 h-4" />
                                                            )}
                                                            <span>{review.source}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm text-muted-foreground flex-shrink-0 text-right">
                                                        {new Date(review.date).toLocaleDateString()}
                                                    </p>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="opacity-0 group-hover/review:opacity-100 transition-opacity"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setReviewToDelete(review);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                            <span className="sr-only">Delete review</span>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-0.5 pt-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-5 w-5 ${i < review.rating
                                                            ? 'text-yellow-400 fill-yellow-400'
                                                            : 'text-muted-foreground/30'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground italic">
                                                "{review.comment}"
                                            </p>
                                        </CardContent>
                                        <CardFooter className="flex-col items-start gap-2 pt-4">
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Review Schema</h4>
                                            <JsonLdDisplay schema={generateReviewSchema(review)} />
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                !isLoadingReviews && <p>No reviews found.</p>
                            )}
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the review from "{reviewToDelete?.author.name}".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteReview} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
