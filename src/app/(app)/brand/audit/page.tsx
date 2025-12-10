
'use client';

import { useMemo, useState, useEffect, useTransition, useActionState } from 'react';
import { StandardPageLayout, StandardEmptyState } from '@/components/standard';
import { StandardFormActions } from '@/components/standard/form-actions';
import { StandardLoadingSpinner } from '@/components/standard/loading-spinner';
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
import { CheckCircle2, AlertCircle, ArrowRight, Loader2, ServerCrash, Lightbulb, ExternalLink, Star, Globe, Home, Building, MessageSquareQuote, Bot, Trash2, TrendingUp, Award, Shield, HelpCircle, Info } from 'lucide-react';
import {
    AISparkleIcon,
    SuccessIcon,
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/common';
import Link from 'next/link';
import Image from 'next/image';
import { type OAuthTokenData } from '@/aws/dynamodb';
import { getOAuthTokensAction } from '@/features/integrations/actions/oauth-actions';
import { useUser } from '@/aws/auth';
import type { Profile, Review, BrandAudit as BrandAuditType, ReviewAnalysis } from '@/lib/types/common';
import { runNapAuditAction, getZillowReviewsAction, analyzeReviewSentimentAction, analyzeMultipleReviewsAction, getReviewsAction, deleteReviewAction } from '@/app/actions';
import { toast } from '@/hooks/use-toast';
import { JsonLdDisplay } from '@/components/json-ld-display';
import { useFormStatus } from 'react-dom';
import { FirstTimeUseEmptyState } from '@/components/ui/empty-states';
import { Celebration } from '@/components/ui/celebration';
import { AIOperationProgress, useAIOperation } from '@/components/ui/ai-operation-progress';

import type { WebsiteAnalysisResult } from '@/ai/schemas/website-analysis-schemas';
import { AnalysisResultsDisplay } from '@/components/website-analysis-results-display';
import { WebsiteHistoricalTrendChart } from '@/components/website-historical-trend-chart';


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
    author: string;
    rating: number;
    comment: string;
    date: string;
}

type ZillowReviewState = {
    message: string;
    data: any;
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
        <StandardFormActions
            primaryAction={{
                label: 'Run NAP Audit',
                type: 'submit',
                variant: 'ai',
                loading: pending,
                disabled: disabled,
            }}
            alignment="left"
        />
    )
}

function FetchReviewsButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <StandardFormActions
            primaryAction={{
                label: 'Import Reviews',
                type: 'submit',
                variant: 'default',
                loading: pending,
                disabled: disabled,
            }}
            alignment="left"
        />
    )
}

function AnalyzeAllButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <StandardFormActions
            primaryAction={{
                label: 'Analyze All Reviews',
                type: 'submit',
                variant: 'ai',
                loading: pending,
                disabled: disabled,
            }}
            alignment="left"
        />
    )
}

function AnalyzeSentimentButton() {
    const { pending } = useFormStatus();
    return (
        <StandardFormActions
            primaryAction={{
                label: 'Analyze',
                type: 'submit',
                variant: 'outline',
                loading: pending,
                disabled: pending,
            }}
            alignment="left"
        />
    )
}

function FetchedReviewCard({ review }: { review: ZillowReview }) {
    const [sentimentState, sentimentFormAction] = useActionState(analyzeReviewSentimentAction, initialSentimentState);

    return (
        <Card className="bg-secondary/30">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold">{review.author}</p>
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

    const [auditState, auditFormAction] = useActionState(
        (state: InitialAuditState, payload: FormData) => runNapAuditAction(state, payload),
        initialAuditState
    );
    const [zillowState, zillowFormAction] = useActionState(
        (state: ZillowReviewState, payload: FormData) => getZillowReviewsAction(state, payload),
        initialZillowReviewState
    );
    const [bulkAnalysisState, bulkAnalysisFormAction] = useActionState(
        (state: BulkAnalysisState, payload: FormData) => analyzeMultipleReviewsAction(state, payload),
        initialBulkAnalysisState
    );

    const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);

    // Website Analysis state
    const [websiteAnalysisState, setWebsiteAnalysisState] = useState<{
        message: string;
        data: WebsiteAnalysisResult | null;
        errors: any;
    }>({
        message: '',
        data: null,
        errors: {},
    });
    const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState(false);
    const [websiteAnalysisHistory, setWebsiteAnalysisHistory] = useState<WebsiteAnalysisResult[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // State for profile and audit data
    const [agentProfileData, setAgentProfileData] = useState<Profile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [savedAuditData, setSavedAuditData] = useState<BrandAuditType | null>(null);
    const [savedAnalysisData, setSavedAnalysisData] = useState<ReviewAnalysis | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);

    const [gbpData, setGbpData] = useState<OAuthTokenData | null>(null);

    // AI operation tracking for NAP audit
    const napAuditOperation = useAIOperation('run-nap-audit');

    // AI operation tracking for website analysis
    const websiteAnalysisOperation = useAIOperation('analyze-website');

    // Wrapper for audit form action to track operation
    const handleAuditSubmit = async (formData: FormData) => {
        napAuditOperation.start();
        return auditFormAction(formData);
    };

    // Handler for website analysis
    const handleWebsiteAnalysis = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Check for missing profile data
        if (!user?.id) {
            toast({
                variant: 'destructive',
                title: 'Authentication Required',
                description: 'Please sign in to analyze your website.',
            });
            return;
        }

        if (!agentProfileData?.website) {
            toast({
                variant: 'destructive',
                title: 'Missing Website URL',
                description: 'Please add a website URL to your profile first.',
            });
            return;
        }

        // Check for missing profile fields needed for NAP comparison
        const missingFields: string[] = [];
        if (!agentProfileData.name) missingFields.push('name');
        if (!agentProfileData.address) missingFields.push('address');
        if (!agentProfileData.phone) missingFields.push('phone');

        if (missingFields.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Incomplete Profile',
                description: `Please complete your profile (${missingFields.join(', ')}) before analyzing your website.`,
                action: {
                    label: 'Go to Profile',
                    onClick: () => window.location.href = '/brand/profile',
                },
            });
            return;
        }

        setIsAnalyzingWebsite(true);
        websiteAnalysisOperation.start();

        try {
            const formData = new FormData();
            formData.append('userId', user.id);
            formData.append('websiteUrl', agentProfileData.website);

            // Pass profile data as JSON for NAP comparison
            const profileData = {
                name: agentProfileData.name || '',
                address: agentProfileData.address || '',
                phone: agentProfileData.phone || '',
                email: agentProfileData.email || '',
            };
            formData.append('profileData', JSON.stringify(profileData));

            const { analyzeWebsiteAction } = await import('@/app/actions');
            const result = await analyzeWebsiteAction(null, formData);

            setWebsiteAnalysisState(result);

            if (result.message === 'success' && result.data) {
                websiteAnalysisOperation.complete();

                // Reload history to include the new analysis
                try {
                    const { getWebsiteAnalysisHistoryAction } = await import('@/app/actions');
                    const historyResult = await getWebsiteAnalysisHistoryAction(user.id, 5);
                    if (historyResult.message === 'success' && historyResult.data?.history) {
                        setWebsiteAnalysisHistory(historyResult.data.history);
                    }
                } catch (error) {
                    console.error('Failed to reload history:', error);
                }

                toast({
                    title: 'Analysis Complete',
                    description: `Your website scored ${result.data.overallScore}/100 for AI optimization.`,
                });
            } else {
                websiteAnalysisOperation.fail(result.message || 'Analysis failed');

                // Provide more helpful error messages based on error type
                let errorTitle = 'Analysis Failed';
                let errorDescription = result.message || 'An error occurred during analysis.';

                if (result.errors?.profile) {
                    errorTitle = 'Profile Incomplete';
                    errorDescription = Array.isArray(result.errors.profile)
                        ? result.errors.profile[0]
                        : result.message;
                } else if (result.errors?.network) {
                    errorTitle = 'Website Access Error';
                } else if (result.errors?.ai) {
                    errorTitle = 'AI Service Error';
                } else if (result.errors?.storage) {
                    errorTitle = 'Save Failed';
                    // Still show the results even if save failed
                    if (result.data) {
                        toast({
                            variant: 'default',
                            title: 'Analysis Complete (Not Saved)',
                            description: 'Analysis completed but could not be saved to history.',
                        });
                        return;
                    }
                }

                toast({
                    variant: 'destructive',
                    title: errorTitle,
                    description: errorDescription,
                });
            }
        } catch (error) {
            console.error('Website analysis error:', error);
            websiteAnalysisOperation.fail('An unexpected error occurred');

            const errorMessage = error instanceof Error
                ? error.message
                : 'An unexpected error occurred during analysis.';

            toast({
                variant: 'destructive',
                title: 'Unexpected Error',
                description: errorMessage,
            });
        } finally {
            setIsAnalyzingWebsite(false);
        }
    };

    // Load profile data
    useEffect(() => {
        async function loadProfile() {
            if (!user?.id) {
                setIsProfileLoading(false);
                return;
            }

            try {
                setIsProfileLoading(true);
                const { getProfileAction } = await import('@/app/actions');
                const result = await getProfileAction(user.id);

                if (result.message === 'success' && result.data) {
                    setAgentProfileData(result.data);
                }
            } catch (error) {
                console.error('Failed to load profile:', error);
            } finally {
                setIsProfileLoading(false);
            }
        }

        loadProfile();
    }, [user?.id]);

    // Load saved audit data
    useEffect(() => {
        async function loadAuditData() {
            if (!user?.id) return;

            try {
                const { getAuditDataAction } = await import('@/app/actions');
                const result = await getAuditDataAction(user.id);

                if (result.message === 'success' && result.data) {
                    setSavedAuditData(result.data);
                }
            } catch (error) {
                console.error('Failed to load audit data:', error);
            }
        }

        loadAuditData();
    }, [user?.id]);

    // Load OAuth tokens
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

    // Load reviews
    useEffect(() => {
        async function loadReviews() {
            if (!user?.id) {
                setIsLoadingReviews(false);
                return;
            }

            try {
                setIsLoadingReviews(true);
                const result = await getReviewsAction(user.id);

                if (result.message === 'success' && result.data) {
                    setReviews(result.data);
                }
            } catch (error) {
                console.error('Failed to load reviews:', error);
            } finally {
                setIsLoadingReviews(false);
            }
        }

        loadReviews();
    }, [user?.id]);

    // Load website analysis history
    useEffect(() => {
        async function loadWebsiteAnalysisHistory() {
            if (!user?.id) {
                setIsLoadingHistory(false);
                return;
            }

            try {
                setIsLoadingHistory(true);
                const { getWebsiteAnalysisHistoryAction } = await import('@/app/actions');
                const result = await getWebsiteAnalysisHistoryAction(user.id, 5);

                if (result.message === 'success' && result.data?.history) {
                    setWebsiteAnalysisHistory(result.data.history);
                }
            } catch (error) {
                console.error('Failed to load website analysis history:', error);
            } finally {
                setIsLoadingHistory(false);
            }
        }

        loadWebsiteAnalysisHistory();
    }, [user?.id]);

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
            toast({ variant: 'destructive', title: 'Couldn\'t Import Reviews', description: zillowState.message });
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
            napAuditOperation.complete();

            // Update saved audit data with new results
            setSavedAuditData({
                id: 'main',
                results: auditState.data,
                lastRun: new Date().toISOString(),
            });

            setShowCelebration(true);
            toast({
                title: 'Audit Complete',
                description: "Your NAP consistency results have been updated."
            });
        } else if (auditState.message && auditState.message !== 'success') {
            napAuditOperation.fail(auditState.message);
            toast({
                variant: 'destructive',
                title: 'Audit Failed',
                description: auditState.message,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auditState]);

    const handleDeleteReview = async () => {
        if (!reviewToDelete || !user) return;

        try {
            // Create a FormData object to pass to the action
            const formData = new FormData();
            formData.append('agentId', user.id);
            formData.append('reviewId', reviewToDelete.id);

            // Call the delete action
            const result = await deleteReviewAction(null, formData);

            if (result.message === 'success') {
                // Remove the review from local state
                setReviews(prev => prev.filter(r => r.id !== reviewToDelete.id));

                toast({
                    title: 'Review Deleted',
                    description: `The review from ${reviewToDelete.author.name} has been removed.`,
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to Delete',
                    description: result.message || 'An error occurred while deleting the review.',
                });
            }
        } catch (error) {
            console.error('Delete review error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'An unexpected error occurred while deleting the review.',
            });
        } finally {
            setReviewToDelete(null);
        }
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
        <div className="space-y-8">
            <div className="space-y-8">
                {/* Prominent Brand Score Hero Section */}
                <Card className="bg-gradient-to-br from-primary/5 to-purple-600/5 border-2 border-primary/30">
                    <CardContent className="p-8">
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
                                    <div className="mb-2">
                                        <h3 className="text-2xl font-bold font-headline">Your Brand Score</h3>
                                    </div>
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
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">

                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">NAP Consistency Audit</CardTitle>
                                <CardDescription>
                                    Make sure clients can find you everywhere—with the exact same info.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Hidden form for audit submission */}
                                <form action={handleAuditSubmit} data-audit-form style={{ display: 'none' }}>
                                    <input type="hidden" name="userId" value={user?.id || ''} />
                                    <input type="hidden" name="name" value={agentProfileData?.name || ''} />
                                    <input type="hidden" name="agencyName" value={agentProfileData?.agencyName || ''} />
                                    <input type="hidden" name="address" value={agentProfileData?.address || ''} />
                                    <input type="hidden" name="phone" value={agentProfileData?.phone || ''} />
                                    <input type="hidden" name="website" value={agentProfileData?.website || ''} />
                                </form>

                                {/* Show empty state if no audit has been run */}
                                {!displayAuditData && !napAuditOperation.isRunning ? (
                                    <FirstTimeUseEmptyState
                                        icon={<TrendingUp className="h-8 w-8 text-primary" />}
                                        title="Run Your First NAP Audit"
                                        description="We'll check if your business name, address, and phone number match across Google, Yelp, and Facebook. When they match, clients can find you easier and you rank higher in local searches. Complete your profile first, then run your audit to see how you look online."
                                        action={{
                                            label: isAuditDisabled ? "Complete Profile First" : "Run NAP Audit",
                                            onClick: () => {
                                                if (isAuditDisabled) {
                                                    window.location.href = '/brand/profile';
                                                } else {
                                                    // Start the operation and trigger form submission
                                                    napAuditOperation.start();
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
                                                        window.location.href = '/training';
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
                                    <div className="space-y-4 text-sm">
                                        <div className="flex items-start gap-4 p-3 rounded-md bg-background/50">
                                            <strong className="w-24 font-semibold text-foreground">Name:</strong>
                                            <span className="text-muted-foreground">{agentProfileData?.name || 'Not set'}</span>
                                        </div>
                                        <div className="flex items-start gap-4 p-3 rounded-md bg-background/50">
                                            <strong className="w-24 font-semibold text-foreground">Address:</strong>
                                            <span className="text-muted-foreground">{agentProfileData?.address || 'Not set'}</span>
                                        </div>
                                        <div className="flex items-start gap-4 p-3 rounded-md bg-background/50">
                                            <strong className="w-24 font-semibold text-foreground">Phone:</strong>
                                            <span className="text-muted-foreground">{agentProfileData?.phone || 'Not set'}</span>
                                        </div>
                                        <div className="flex items-start gap-4 p-3 rounded-md bg-background/50">
                                            <strong className="w-24 font-semibold text-foreground">Website:</strong>
                                            <span className="text-muted-foreground">{agentProfileData?.website || 'Not set'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Operation Progress */}
                                {napAuditOperation.isRunning && napAuditOperation.tracker && (
                                    <AIOperationProgress
                                        operationName="run-nap-audit"
                                        tracker={napAuditOperation.tracker}
                                    />
                                )}

                                {/* Show run button if audit has been run before and not currently running */}
                                {displayAuditData && !napAuditOperation.isRunning && (
                                    <div>
                                        <Button
                                            variant="ai"
                                            onClick={() => {
                                                napAuditOperation.start();
                                                const form = document.querySelector('form[data-audit-form]') as HTMLFormElement;
                                                if (form) form.requestSubmit();
                                            }}
                                            disabled={isAuditDisabled}
                                        >
                                            Run NAP Audit
                                        </Button>
                                    </div>
                                )}

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
                            </CardContent>
                        </Card>

                        {/* Website Analysis Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="font-headline">Website AI Optimization Analysis</CardTitle>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                                                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                                            <span className="sr-only">Help</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <p className="font-semibold mb-1">What is AEO?</p>
                                                        <p className="text-sm">
                                                            AI Engine Optimization (AEO) ensures your website is optimized for AI-powered search engines like ChatGPT, Perplexity, and Claude. We analyze schema markup, meta tags, and structured data to help AI systems discover and recommend your services.
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <CardDescription>
                                            Check how well AI search engines can discover and understand your website.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Website Analysis Form */}
                                <form onSubmit={handleWebsiteAnalysis} className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="websiteUrl">Website URL</Label>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <p className="text-sm">
                                                            We'll analyze your website URL from your profile. Make sure your profile includes your name, address, and phone number for accurate NAP consistency checking.
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <Input
                                            id="websiteUrl"
                                            type="url"
                                            placeholder="https://yourwebsite.com"
                                            value={agentProfileData?.website || ''}
                                            disabled
                                            className="bg-muted"
                                        />
                                        {!agentProfileData?.website && (
                                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                                                <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <span>
                                                        Add your website URL in your{' '}
                                                        <Link href="/brand/profile" className="underline font-semibold hover:text-yellow-900 dark:hover:text-yellow-100">
                                                            profile
                                                        </Link>{' '}
                                                        to analyze it.
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Show empty state if no analysis has been run */}
                                    {!websiteAnalysisState.data && !websiteAnalysisOperation.isRunning && (
                                        <Card className="border-dashed border-2">
                                            <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                                    <Globe className="h-10 w-10 text-primary" />
                                                </div>

                                                <h3 className="text-xl font-semibold mb-2">Analyze Your Website for AI</h3>
                                                <p className="text-muted-foreground mb-6 max-w-md">
                                                    We'll check if AI search engines like ChatGPT and Perplexity can easily discover and understand your website. Get actionable recommendations to improve your visibility in AI-powered search results.
                                                </p>

                                                {/* What We Check Section */}
                                                <div className="w-full max-w-2xl mb-8 p-6 bg-gradient-to-br from-primary/5 to-purple-600/5 rounded-lg border border-primary/10">
                                                    <h4 className="font-headline font-semibold text-sm uppercase text-primary mb-4 flex items-center gap-2">
                                                        <Lightbulb className="h-4 w-4" />
                                                        What We Check
                                                    </h4>
                                                    <div className="grid gap-3 text-left text-sm">
                                                        <div className="flex items-start gap-3 p-3 rounded-md bg-background/50">
                                                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                            <div>
                                                                <strong className="text-foreground">Schema Markup:</strong>
                                                                <span className="text-muted-foreground"> Structured data that helps AI understand your business</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 rounded-md bg-background/50">
                                                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                            <div>
                                                                <strong className="text-foreground">Meta Tags:</strong>
                                                                <span className="text-muted-foreground"> Title, description, and social media tags</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 rounded-md bg-background/50">
                                                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                            <div>
                                                                <strong className="text-foreground">NAP Consistency:</strong>
                                                                <span className="text-muted-foreground"> Name, address, and phone match with your profile</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3 p-3 rounded-md bg-background/50">
                                                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                            <div>
                                                                <strong className="text-foreground">AI Discoverability:</strong>
                                                                <span className="text-muted-foreground"> How easily AI can find and recommend you</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                                    {!agentProfileData?.website ? (
                                                        <>
                                                            <Button
                                                                variant="default"
                                                                onClick={() => { window.location.href = '/brand/profile'; }}
                                                                className="min-w-[180px]"
                                                            >
                                                                Add Website First
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                type="button"
                                                                onClick={() => { window.location.href = '/training'; }}
                                                            >
                                                                Learn More About AEO
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                type="submit"
                                                                variant="ai"
                                                                disabled={isAnalyzingWebsite}
                                                                className="min-w-[180px]"
                                                            >
                                                                {isAnalyzingWebsite ? (
                                                                    <>
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        Analyzing...
                                                                    </>
                                                                ) : (
                                                                    'Analyze Website'
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                type="button"
                                                                onClick={() => { window.location.href = '/training'; }}
                                                            >
                                                                Learn More About AEO
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Help Text */}
                                                <p className="text-xs text-muted-foreground max-w-lg">
                                                    💡 Tip: Analysis takes about 30 seconds. We'll crawl your homepage and up to 10 additional pages to give you a comprehensive score.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* AI Operation Progress */}
                                    {websiteAnalysisOperation.isRunning && websiteAnalysisOperation.tracker && (
                                        <AIOperationProgress
                                            operationName="analyze-website"
                                            tracker={websiteAnalysisOperation.tracker}
                                        />
                                    )}

                                    {/* Show analyze button if analysis has been run before and not currently running */}
                                    {websiteAnalysisState.data && !websiteAnalysisOperation.isRunning && (
                                        <div>
                                            <Button
                                                type="submit"
                                                variant="ai"
                                                disabled={isAnalyzingWebsite || !agentProfileData?.website}
                                            >
                                                {isAnalyzingWebsite ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    'Re-analyze Website'
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </form>

                                {/* Display Analysis Results */}
                                {websiteAnalysisState.data && (
                                    <>
                                        <AnalysisResultsDisplay analysis={websiteAnalysisState.data} />

                                        {/* Next Steps Guide */}
                                        <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                                                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-headline font-semibold text-blue-900 dark:text-blue-100 mb-2">What to Do Next</h4>
                                                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                            <span>Review your recommendations below and prioritize high-impact items</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                            <span>Implement the suggested schema markup and meta tag improvements</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                            <span>Re-run the analysis after making changes to track your progress</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                            <span>
                                                                Need help? Visit our{' '}
                                                                <Link href="/training" className="underline font-semibold hover:text-blue-900 dark:hover:text-blue-100">
                                                                    Training Hub
                                                                </Link>
                                                                {' '}for detailed guides
                                                            </span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Error Display */}
                                {websiteAnalysisState.message && websiteAnalysisState.message !== 'success' && (
                                    <div className="mt-6 rounded-lg bg-destructive/10 p-4 border border-destructive/20">
                                        <div className="flex items-start gap-3">
                                            <ServerCrash className="h-5 mt-0.5 text-destructive flex-shrink-0" />
                                            <div>
                                                <h4 className="font-headline font-semibold text-destructive">Analysis Failed</h4>
                                                <p className="text-sm text-destructive/80">
                                                    {websiteAnalysisState.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Historical Trend Chart */}
                        {websiteAnalysisHistory.length > 0 && (
                            <WebsiteHistoricalTrendChart history={websiteAnalysisHistory} />
                        )}

                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Completeness Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Award className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="font-headline">Profile Completeness</CardTitle>
                                        <CardDescription className="text-xs">
                                            Build trust and improve visibility
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                            </CardContent>
                            <CardFooter>
                                <Link href="/brand/profile" className="w-full">
                                    <Button variant="outline" className="w-full">
                                        Edit Profile <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>

                        {/* Google Business Profile Card */}
                        <Card
                            className={cn(
                                gbpConnected && "border-green-200 dark:border-green-800"
                            )}
                        >
                            <CardHeader>
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
                                        <CardTitle className="font-headline">Google Business Profile</CardTitle>
                                        <CardDescription className="text-xs">
                                            Critical for local search
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
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
                            </CardContent>
                            {!gbpConnected && (
                                <CardFooter>
                                    <Link href="/settings?tab=integrations" className="w-full">
                                        <Button variant="default" className="w-full bg-green-600 hover:bg-green-700">
                                            Connect Now <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardFooter>
                            )}
                        </Card>

                        {/* Review Distribution Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="font-headline">
                                            Review Distribution
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Where reviews are coming from
                                        </CardDescription>
                                    </div>
                                </div>
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
                            </CardContent>
                            <CardFooter className="flex-col gap-4 text-sm pt-6">
                                <div className="w-full p-4 rounded-lg bg-primary/5 border border-primary/10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Total Reviews</span>
                                        <span className="text-2xl font-bold text-primary">{totalReviews}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-center text-muted-foreground">
                                    Showing reviews from all sources
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                </div>

                {/* Bottom Section - Zillow Importer and Review Feed */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Bot className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="font-headline">Zillow Review Importer & Analyzer</CardTitle>
                                    <CardDescription>Fetch your latest Zillow reviews and analyze sentiment with AI.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                <form action={zillowFormAction} data-zillow-form>
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
                            {isZillowDisabled && <p className="text-sm text-muted-foreground mt-2">Set your Zillow email in your <Link href="/brand/profile" className="underline">profile</Link> to use this feature.</p>}

                            {displayAnalysisData && (
                                <Card className="mt-6 bg-gradient-to-br from-primary/5 to-purple-600/5">
                                    <CardHeader>
                                        <CardTitle className="font-headline text-lg">Overall Review Analysis</CardTitle>
                                        {'analyzedAt' in displayAnalysisData && displayAnalysisData.analyzedAt && <CardDescription>Last analyzed on {new Date(displayAnalysisData.analyzedAt).toLocaleString()}</CardDescription>}
                                    </CardHeader>
                                    <CardContent className="space-y-4">
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
                                    </CardContent>
                                </Card>
                            )}


                            {fetchedReviews && (
                                <div className="mt-6 space-y-4">
                                    <h3 className="text-lg font-semibold font-headline">Fetched Reviews</h3>
                                    {fetchedReviews.map((review: ZillowReview, index: number) => (
                                        <FetchedReviewCard key={index} review={review} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <MessageSquareQuote className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="font-headline">Client Review Feed</CardTitle>
                                    <CardDescription>Your latest reviews from across the web.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isLoadingReviews && <StandardLoadingSpinner size="md" message="Loading reviews..." />}
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
                                    !isLoadingReviews && (
                                        <StandardEmptyState
                                            icon={MessageSquareQuote}
                                            title="No Reviews Yet"
                                            description="Your imported reviews will appear here. Connect your Google Business Profile or import reviews from Zillow to get started."
                                            action={{
                                                label: "Import from Zillow",
                                                onClick: () => {
                                                    const form = document.querySelector('form[data-zillow-form]') as HTMLFormElement;
                                                    if (form) form.scrollIntoView({ behavior: 'smooth' });
                                                },
                                                variant: 'outline'
                                            }}
                                        />
                                    )
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
