
'use client';

import { useMemo, useState, useEffect, useTransition, useActionState } from 'react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import {
    EnhancedCard,
    EnhancedCardHeader,
    EnhancedCardTitle,
    EnhancedCardDescription,
    EnhancedCardContent,
    EnhancedCardFooter,
} from '@/components/ui/enhanced-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, ArrowRight, Loader2, ServerCrash, Lightbulb, ExternalLink, Star, Globe, Home, Building, MessageSquareQuote, Bot, Trash2, TrendingUp, Award, Shield } from 'lucide-react';
import {
    AISparkleIcon,
    SuccessIcon,
    ChartIcon,
} from '@/components/ui/real-estate-icons';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ResponsiveTableWrapper } from '@/components/ui/responsive-table';
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
import { type OAuthTokenData } from '@/aws/dynamodb';
import { getOAuthTokensAction } from '@/app/oauth-actions';
import { useUser } from '@/aws/auth';
import { useItem, useQuery } from '@/aws/dynamodb/hooks';
import type { Profile, Review, BrandAudit as BrandAuditType, ReviewAnalysis } from '@/lib/types';
import { runNapAuditAction, getZillowReviewsAction, analyzeReviewSentimentAction, analyzeMultipleReviewsAction } from '@/app/actions';
import { toast } from '@/hooks/use-toast';
import { JsonLdDisplay } from '@/components/json-ld-display';
import { useFormStatus } from 'react-dom';
import { FirstTimeUseEmptyState } from '@/components/ui/empty-states';
import { Celebration } from '@/components/ui/celebration';


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
    data: ReviewAnalysis | null;
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

const generateReviewSchema = (review: any) => ({
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
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AISparkleIcon className="mr-2 h-4 w-4" />}
            {pending ? 'Auditing...' : 'Run Audit'}
        </Button>
    )
}

function FetchReviewsButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending || disabled}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AISparkleIcon className="mr-2 h-4 w-4" />}
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

    const [auditState, auditFormAction] = useActionState(runNapAuditAction, initialAuditState);
    const [zillowState, zillowFormAction] = useActionState(getZillowReviewsAction, initialZillowReviewState);
    const [bulkAnalysisState, bulkAnalysisFormAction] = useActionState(analyzeMultipleReviewsAction, initialBulkAnalysisState);

    const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);

    // Memoize keys for DynamoDB queries
    const agentProfilePK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const agentProfileSK = useMemo(() => 'PROFILE', []);

    const brandAuditPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const brandAuditSK = useMemo(() => 'AUDIT#main', []);

    const reviewAnalysisPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const reviewAnalysisSK = useMemo(() => 'ANALYSIS#main', []);

    const reviewsPK = useMemo(() => user ? `REVIEW#${user.id}` : null, [user]);
    const reviewsSKPrefix = useMemo(() => 'REVIEW#', []);

    // Fetch data using DynamoDB hooks
    const { data: agentProfileData, isLoading: isProfileLoading } = useItem<Profile>(agentProfilePK, agentProfileSK);
    const { data: savedAuditData } = useItem<BrandAuditType>(brandAuditPK, brandAuditSK);
    const { data: savedAnalysisData } = useItem<ReviewAnalysis>(reviewAnalysisPK, reviewAnalysisSK);
    const { data: reviews, isLoading: isLoadingReviews } = useQuery<Review>(reviewsPK, reviewsSKPrefix);

    const [gbpData, setGbpData] = useState<OAuthTokenData | null>(null);

    useEffect(() => {
        async function loadOAuthTokens() {
            if (!user) return;

            try {
                const tokens = await getOAuthTokensAction(user.id, 'GOOGLE_BUSINESS');
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
        if (auditState.message === 'success' && auditState.data) {
            setShowCelebration(true);
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
    }, [auditState]);

    const handleDeleteReview = () => {
        if (!reviewToDelete || !user) return;
        // TODO: Implement delete review functionality with DynamoDB
        toast({
            title: 'Review Deleted',
            description: `The review from ${reviewToDelete.author.name} has been removed.`,
        });
        setReviewToDelete(null);
    };

    const reviewDistribution = useMemo(() => {
        if (!reviews || reviews.length === 0) return [];
        const distribution: { [key: string]: number } = {
            Google: 0,
            Zillow: 0,
            Yelp: 0,
        };
        reviews.forEach((review: Review) => {
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
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold font-headline">Brand Audit</h1>
                            <p className="text-muted-foreground">A unified view of your online presence, authority, and reputation.</p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Prominent Brand Score Hero Section */}
            <EnhancedCard
                variant="gradient"
                className="animate-fade-in-up border-2 border-primary/30"
                style={{ animationDelay: '0.05s' }}
            >
                <EnhancedCardContent className="p-8">
                    <div className="grid gap-8 md:grid-cols-[auto_1fr] items-center">
                        {/* Large Score Display */}
                        <div className="flex flex-col items-center justify-center">
                            <div className="relative">
                                {/* Circular background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-full blur-2xl" />
                                <div className="relative bg-background/95 backdrop-blur-sm rounded-full p-8 border-4 border-primary/30 shadow-2xl">
                                    <div className="flex flex-col items-center">
                                        <div className="text-7xl font-bold bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">
                                            {overallScore}
                                        </div>
                                        <div className="text-sm font-medium text-muted-foreground mt-1">
                                            out of 100
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Score Badge */}
                            <Badge
                                className={cn(
                                    "mt-4 text-sm px-4 py-1",
                                    overallScore >= 80 && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                                    overallScore >= 60 && overallScore < 80 && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
                                    overallScore < 60 && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                )}
                            >
                                {overallScore >= 80 ? "Excellent" : overallScore >= 60 ? "Good" : "Needs Improvement"}
                            </Badge>
                        </div>

                        {/* Score Explanation */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold font-headline mb-2">Your Brand Score</h3>
                                <p className="text-muted-foreground">
                                    Your Brand Score is a comprehensive measure of your online authority and consistency.
                                    A higher score means a stronger digital presence, making it easier for clients to find and trust you.
                                </p>
                            </div>

                            {/* Score Breakdown */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50 border">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Award className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-semibold">Profile Completeness</div>
                                        <div className="text-2xl font-bold text-primary">{completenessScore}%</div>
                                        <div className="text-xs text-muted-foreground mt-1">60% weight</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50 border">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Shield className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-semibold">GBP Connection</div>
                                        <div className="text-2xl font-bold text-primary">{gbpConnected ? '100%' : '0%'}</div>
                                        <div className="text-xs text-muted-foreground mt-1">40% weight</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </EnhancedCardContent>
            </EnhancedCard>

            <div className="grid gap-6 tablet:gap-8 tablet:grid-cols-3 lg:grid-cols-3 orientation-transition">
                <div className="tablet:col-span-2 lg:col-span-2 space-y-6 tablet:space-y-8">

                    <EnhancedCard variant="elevated" className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <EnhancedCardHeader>
                            <EnhancedCardTitle className="font-headline text-2xl">NAP Consistency Audit</EnhancedCardTitle>
                            <EnhancedCardDescription>
                                Ensuring your Name, Address, and Phone are consistent is vital for local SEO.
                            </EnhancedCardDescription>
                        </EnhancedCardHeader>
                        <EnhancedCardContent className="space-y-6">
                            {/* Show empty state if no audit has been run */}
                            {!displayAuditData ? (
                                <FirstTimeUseEmptyState
                                    icon={<ChartIcon animated={true} className="h-8 w-8 text-primary" />}
                                    title="Run Your First Brand Audit"
                                    description="A Brand Audit checks your Name, Address, and Phone (NAP) consistency across major platforms like Google, Yelp, and Facebook. Consistent NAP information is crucial for local SEO and helps potential clients find you easily. Complete your profile information below, then run your first audit to see how your business appears online."
                                    action={{
                                        label: isAuditDisabled ? "Complete Profile First" : "Run Your First Audit",
                                        onClick: () => {
                                            if (isAuditDisabled) {
                                                window.location.href = '/brand/profile';
                                            } else {
                                                // Trigger the form submission
                                                const form = document.querySelector('form[data-audit-form]') as HTMLFormElement;
                                                if (form) form.requestSubmit();
                                            }
                                        },
                                        variant: isAuditDisabled ? "outline" : "ai",
                                    }}
                                    secondaryAction={
                                        isAuditDisabled
                                            ? undefined
                                            : {
                                                label: "Learn More About NAP",
                                                onClick: () => {
                                                    window.open('https://moz.com/learn/seo/nap', '_blank');
                                                },
                                            }
                                    }
                                />
                            ) : null}

                            {/* Official Business Info */}
                            <div className="bg-gradient-to-br from-primary/5 to-purple-600/5 rounded-lg p-5 border border-primary/10">
                                <h3 className="font-headline text-sm font-semibold uppercase text-primary mb-3 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Your Official Business Information
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start gap-3 p-3 rounded-md bg-background/50">
                                        <strong className="w-24 font-semibold text-foreground">Name:</strong>
                                        <span className="text-muted-foreground">{agentProfileData?.name || 'Not set'}</span>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-md bg-background/50">
                                        <strong className="w-24 font-semibold text-foreground">Address:</strong>
                                        <span className="text-muted-foreground">{agentProfileData?.address || 'Not set'}</span>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-md bg-background/50">
                                        <strong className="w-24 font-semibold text-foreground">Phone:</strong>
                                        <span className="text-muted-foreground">{agentProfileData?.phone || 'Not set'}</span>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-md bg-background/50">
                                        <strong className="w-24 font-semibold text-foreground">Website:</strong>
                                        <span className="text-muted-foreground">{agentProfileData?.website || 'Not set'}</span>
                                    </div>
                                </div>
                            </div>

                            <form action={auditFormAction} data-audit-form>
                                <input type="hidden" name="name" value={agentProfileData?.name || ''} />
                                <input type="hidden" name="agencyName" value={agentProfileData?.agencyName || ''} />
                                <input type="hidden" name="address" value={agentProfileData?.address || ''} />
                                <input type="hidden" name="phone" value={agentProfileData?.phone || ''} />
                                <input type="hidden" name="website" value={agentProfileData?.website || ''} />
                                <RunAuditButton disabled={isAuditDisabled} />
                            </form>

                            {displayAuditData && (
                                <div className="mt-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold font-headline">Audit Results</h3>
                                        {/* Summary badges */}
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300">
                                                {displayAuditData.filter((r: AuditResult) => r.status === 'Consistent').length} Consistent
                                            </Badge>
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300">
                                                {displayAuditData.filter((r: AuditResult) => r.status === 'Inconsistent').length} Issues
                                            </Badge>
                                        </div>
                                    </div>

                                    <ResponsiveTableWrapper mobileLayout="scroll" showScrollIndicator={true}>
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead className="w-[140px] font-semibold">Platform</TableHead>
                                                    <TableHead className="font-semibold">Status</TableHead>
                                                    <TableHead className="font-semibold">Found Name</TableHead>
                                                    <TableHead className="font-semibold">Found Address</TableHead>
                                                    <TableHead className="font-semibold">Found Phone</TableHead>
                                                    <TableHead className="text-right font-semibold">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {displayAuditData.map((result: AuditResult) => (
                                                    <TableRow
                                                        key={result.platform}
                                                        className={cn(
                                                            "transition-colors",
                                                            result.status === 'Inconsistent' && "bg-red-50/50 dark:bg-red-900/10",
                                                            result.status === 'Consistent' && "bg-green-50/50 dark:bg-green-900/10"
                                                        )}
                                                    >
                                                        <TableCell className="font-semibold whitespace-nowrap">{result.platform}</TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            <Badge
                                                                variant={result.status === 'Consistent' ? 'default' : result.status === 'Inconsistent' ? 'destructive' : 'secondary'}
                                                                className={cn(
                                                                    "font-medium",
                                                                    result.status === 'Consistent' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200',
                                                                    result.status === 'Inconsistent' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200',
                                                                    result.status === 'Not Found' && 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                                                )}
                                                            >
                                                                {result.status === 'Consistent' && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                                                                {result.status === 'Inconsistent' && <AlertCircle className="h-3 w-3 mr-1 inline" />}
                                                                {result.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className={cn(
                                                            "text-sm min-w-[150px]",
                                                            result.status === 'Inconsistent' && isDifferent(result.foundName, agentProfileData?.name) && 'text-red-700 dark:text-red-400 font-bold bg-red-100/50 dark:bg-red-900/20'
                                                        )}>
                                                            {result.foundName || <span className="text-muted-foreground italic">N/A</span>}
                                                        </TableCell>
                                                        <TableCell className={cn(
                                                            "text-sm min-w-[200px]",
                                                            result.status === 'Inconsistent' && isDifferent(result.foundAddress, agentProfileData?.address) && 'text-red-700 dark:text-red-400 font-bold bg-red-100/50 dark:bg-red-900/20'
                                                        )}>
                                                            {result.foundAddress || <span className="text-muted-foreground italic">N/A</span>}
                                                        </TableCell>
                                                        <TableCell className={cn(
                                                            "text-sm whitespace-nowrap",
                                                            result.status === 'Inconsistent' && isDifferent(result.foundPhone, agentProfileData?.phone) && 'text-red-700 dark:text-red-400 font-bold bg-red-100/50 dark:bg-red-900/20'
                                                        )}>
                                                            {result.foundPhone || <span className="text-muted-foreground italic">N/A</span>}
                                                        </TableCell>
                                                        <TableCell className="text-right whitespace-nowrap">
                                                            {result.platformUrl && (
                                                                <Button
                                                                    variant={result.status === 'Inconsistent' ? 'default' : 'outline'}
                                                                    size="sm"
                                                                    asChild
                                                                    className={cn(
                                                                        result.status === 'Inconsistent' && "bg-red-600 hover:bg-red-700 text-white"
                                                                    )}
                                                                >
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
                                    </ResponsiveTableWrapper>

                                    {/* Help Section */}
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                                                <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-headline font-semibold text-blue-900 dark:text-blue-100">How to Fix Inconsistencies</h4>
                                                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
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
                                            <h4 className="font-headline font-semibold text-destructive">Audit Failed</h4>
                                            <p className="text-sm text-destructive/80">
                                                {auditState.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </EnhancedCardContent>
                    </EnhancedCard>

                </div>
                <div className="tablet:col-span-1 lg:col-span-1 space-y-6">
                    {/* Profile Completeness Card */}
                    <EnhancedCard variant="bordered" className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <EnhancedCardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Award className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <EnhancedCardTitle className="font-headline">Profile Completeness</EnhancedCardTitle>
                                    <EnhancedCardDescription className="text-xs">
                                        Build trust and improve visibility
                                    </EnhancedCardDescription>
                                </div>
                            </div>
                        </EnhancedCardHeader>
                        <EnhancedCardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className="font-bold text-2xl text-primary">{completenessScore}%</span>
                                </div>
                                <Progress value={completenessScore} className="h-3" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {completenessScore === 100
                                    ? '🎉 Your profile is complete!'
                                    : `Fill out ${Math.ceil((100 - completenessScore) / 10)} more sections to improve your score.`
                                }
                            </p>
                        </EnhancedCardContent>
                        <EnhancedCardFooter>
                            <Link href="/profile" className="w-full">
                                <Button variant="outline" className="w-full">
                                    Edit Profile <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </EnhancedCardFooter>
                    </EnhancedCard>

                    {/* Google Business Profile Card */}
                    <EnhancedCard
                        variant={gbpConnected ? "elevated" : "bordered"}
                        className={cn(
                            "animate-fade-in-up",
                            gbpConnected && "border-green-200 dark:border-green-800"
                        )}
                        style={{ animationDelay: '0.4s' }}
                    >
                        <EnhancedCardHeader>
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    gbpConnected ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                                )}>
                                    <Globe className={cn(
                                        "h-5 w-5",
                                        gbpConnected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    )} />
                                </div>
                                <div>
                                    <EnhancedCardTitle className="font-headline">Google Business Profile</EnhancedCardTitle>
                                    <EnhancedCardDescription className="text-xs">
                                        Critical for local search
                                    </EnhancedCardDescription>
                                </div>
                            </div>
                        </EnhancedCardHeader>
                        <EnhancedCardContent>
                            <div className={cn(
                                "flex items-center justify-center gap-3 rounded-lg p-6 text-lg font-semibold border-2",
                                gbpConnected
                                    ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                                    : "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                            )}>
                                {gbpConnected ? (
                                    <>
                                        <CheckCircle2 className="h-7 w-7" />
                                        <span>Connected</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-7 w-7" />
                                        <span>Not Connected</span>
                                    </>
                                )}
                            </div>
                        </EnhancedCardContent>
                        {!gbpConnected && (
                            <EnhancedCardFooter>
                                <Link href="/settings" className="w-full">
                                    <Button variant="default" className="w-full bg-green-600 hover:bg-green-700">
                                        Connect Now <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </EnhancedCardFooter>
                        )}
                    </EnhancedCard>

                    {/* Review Distribution Card */}
                    <EnhancedCard variant="glass" className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <EnhancedCardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <EnhancedCardTitle className="font-headline">
                                        Review Distribution
                                    </EnhancedCardTitle>
                                    <EnhancedCardDescription className="text-xs">
                                        Where reviews are coming from
                                    </EnhancedCardDescription>
                                </div>
                            </div>
                        </EnhancedCardHeader>
                        <EnhancedCardContent className="flex-1 pb-0">
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
                                >
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <RadialBar dataKey="reviews" background>
                                        {reviewDistribution.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </RadialBar>
                                    <ChartLegend content={<ChartLegendContent nameKey="source" />} />
                                </RadialBarChart>
                            </ChartContainer>
                        </EnhancedCardContent>
                        <EnhancedCardFooter className="flex-col gap-3 text-sm pt-6">
                            <div className="w-full p-4 rounded-lg bg-primary/5 border border-primary/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Total Reviews</span>
                                    <span className="text-2xl font-bold text-primary">{totalReviews}</span>
                                </div>
                            </div>
                            <p className="text-xs text-center text-muted-foreground">
                                Showing reviews from all sources
                            </p>
                        </EnhancedCardFooter>
                    </EnhancedCard>
                </div>
            </div>

            {/* Bottom Section - Zillow Importer and Review Feed */}
            <div className="grid gap-6 tablet:gap-8 tablet:grid-cols-2 lg:grid-cols-2 orientation-transition">
                <EnhancedCard variant="elevated" className="lg:col-span-1 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                    <EnhancedCardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Bot className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <EnhancedCardTitle className="font-headline">Zillow Review Importer & Analyzer</EnhancedCardTitle>
                                <EnhancedCardDescription>Fetch your latest Zillow reviews and analyze sentiment with AI.</EnhancedCardDescription>
                            </div>
                        </div>
                    </EnhancedCardHeader>
                    <EnhancedCardContent>
                        <div className="flex flex-wrap gap-2">
                            <form action={zillowFormAction}>
                                <input type="hidden" name="agentEmail" value={agentProfileData?.zillowEmail || ''} />
                                <FetchReviewsButton disabled={isZillowDisabled} />
                            </form>
                            {fetchedReviews && fetchedReviews.length > 0 && (
                                <form action={bulkAnalysisFormAction}>
                                    <input type="hidden" name="comments" value={JSON.stringify(fetchedReviews.map((r: ZillowReview) => r.comment))} />
                                    <input type="hidden" name="userId" value={user?.id || ''} />
                                    <AnalyzeAllButton />
                                </form>
                            )}
                        </div>
                        {isZillowDisabled && <p className="text-sm text-muted-foreground mt-2">Set your Zillow email in your <Link href="/profile" className="underline">profile</Link> to use this feature.</p>}

                        {displayAnalysisData && (
                            <EnhancedCard variant="gradient" className="mt-6">
                                <EnhancedCardHeader>
                                    <EnhancedCardTitle className="font-headline text-lg">Overall Review Analysis</EnhancedCardTitle>
                                    {'analyzedAt' in displayAnalysisData && displayAnalysisData.analyzedAt && <EnhancedCardDescription>Last analyzed on {new Date(displayAnalysisData.analyzedAt).toLocaleString()}</EnhancedCardDescription>}
                                </EnhancedCardHeader>
                                <EnhancedCardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-headline font-semibold">Overall Sentiment</h4>
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
                                        <h4 className="font-headline font-semibold">Summary</h4>
                                        <p className="text-sm text-muted-foreground mt-1">{displayAnalysisData.summary}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-headline font-semibold">Common Themes</h4>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {displayAnalysisData.commonThemes.map((theme: string) => <Badge key={theme} variant="secondary">{theme}</Badge>)}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-headline font-semibold">Keywords</h4>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {displayAnalysisData.keywords.map((keyword: string) => <Badge key={keyword} variant="outline">{keyword}</Badge>)}
                                        </div>
                                    </div>
                                </EnhancedCardContent>
                            </EnhancedCard>
                        )}


                        {fetchedReviews && (
                            <div className="mt-6 space-y-4">
                                <h3 className="text-lg font-semibold font-headline">Fetched Reviews</h3>
                                {fetchedReviews.map((review: ZillowReview, index: number) => (
                                    <FetchedReviewCard key={index} review={review} />
                                ))}
                            </div>
                        )}
                    </EnhancedCardContent>
                </EnhancedCard>

                <EnhancedCard variant="elevated" className="lg:col-span-1 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                    <EnhancedCardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <MessageSquareQuote className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <EnhancedCardTitle className="font-headline">Client Review Feed</EnhancedCardTitle>
                                <EnhancedCardDescription>Your latest reviews from across the web.</EnhancedCardDescription>
                            </div>
                        </div>
                    </EnhancedCardHeader>
                    <EnhancedCardContent className="space-y-4">
                        {isLoadingReviews && <p className="text-muted-foreground">Loading reviews...</p>}
                        <AlertDialog>
                            {reviews && reviews.length > 0 ? (
                                reviews.map((review: Review) => (
                                    <Card key={review.id} className="bg-secondary/30 hover:shadow-md transition-shadow group/review">
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
                                            <h4 className="font-headline text-xs font-semibold text-muted-foreground uppercase tracking-wider">Review Schema</h4>
                                            <JsonLdDisplay schema={generateReviewSchema(review)} />
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                !isLoadingReviews && <p className="text-muted-foreground">No reviews found.</p>
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
                    </EnhancedCardContent>
                </EnhancedCard>
            </div>

            {/* Celebration animation for successful audit completion */}
            <Celebration
                show={showCelebration}
                type="success"
                message="✅ Brand Audit Complete!"
                onComplete={() => setShowCelebration(false)}
            />
        </div>
    );
}
