'use client';

import { useState, useEffect } from 'react';
import { StandardPageLayout } from '@/components/standard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { useUser } from '@/aws/auth';
import { useToast } from '@/hooks/use-toast';
import {
    runAEOAnalysis,
    getAEOScore,
    getAEOHistory,
    getAEORecommendationsAction,
} from '@/app/aeo-actions';
import { AEOScoreCard } from '@/components/aeo/aeo-score-card';
import { AEORecommendationsList } from '@/components/aeo/aeo-recommendations-list';
import { AEOScoreHistoryChart } from '@/components/aeo/aeo-score-history-chart';
import { SchemaMarkupGenerator } from '@/components/aeo/schema-markup-generator';
import { FirstTimeUseEmptyState } from '@/components/ui/empty-states';
import type { AEOScore, AEORecommendation, AEOHistoryEntry } from '@/lib/types/aeo-types';
import type { Profile } from '@/lib/types/common/common';

export default function AIVisibilityPage() {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [score, setScore] = useState<AEOScore | null>(null);
    const [recommendations, setRecommendations] = useState<AEORecommendation[]>([]);
    const [history, setHistory] = useState<AEOHistoryEntry[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);

    // Load existing data
    useEffect(() => {
        async function loadData() {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                // Load profile
                const { getProfileAction } = await import('@/app/actions');
                const profileResult = await getProfileAction(user.id);
                if (profileResult.message === 'success' && profileResult.data) {
                    setProfile(profileResult.data);
                }

                const [scoreResult, recommendationsResult, historyResult] = await Promise.all([
                    getAEOScore(user.id),
                    getAEORecommendationsAction(user.id),
                    getAEOHistory(user.id, 10),
                ]);

                if (scoreResult.success && scoreResult.data) {
                    setScore(scoreResult.data);
                }

                if (recommendationsResult.success && recommendationsResult.data) {
                    setRecommendations(recommendationsResult.data);
                }

                if (historyResult.success && historyResult.data) {
                    setHistory(historyResult.data);
                }
            } catch (error) {
                console.error('Failed to load AEO data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [user?.id]);

    const handleRunAnalysis = async () => {
        if (!user?.id) return;

        setIsAnalyzing(true);

        try {
            const result = await runAEOAnalysis(user.id);

            if (result.success && result.data) {
                setScore(result.data.score);

                // Reload recommendations and history
                const [recommendationsResult, historyResult] = await Promise.all([
                    getAEORecommendationsAction(user.id),
                    getAEOHistory(user.id, 10),
                ]);

                if (recommendationsResult.success && recommendationsResult.data) {
                    setRecommendations(recommendationsResult.data);
                }

                if (historyResult.success && historyResult.data) {
                    setHistory(historyResult.data);
                }

                toast({
                    title: 'Analysis Complete',
                    description: `Your AI visibility score is ${result.data.score.score}/100 with ${result.data.recommendationsCount} recommendations.`,
                });
            } else {
                toast({
                    title: 'Analysis Failed',
                    description: result.error || 'Failed to run AEO analysis',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            console.error('Analysis error:', error);
            toast({
                title: 'Error',
                description: error.message || 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (isUserLoading || isLoading) {
        return (
            <StandardPageLayout
                title="AI Visibility"
                description="Optimize your presence in AI search engines"
            >
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </StandardPageLayout>
        );
    }

    // Show empty state if no analysis has been run
    if (!score && !isAnalyzing) {
        return (
            <StandardPageLayout
                title="AI Visibility"
                description="Optimize your presence in AI search engines"
            >
                <FirstTimeUseEmptyState
                    icon={<Sparkles className="h-8 w-8 text-primary" />}
                    title="Discover Your AI Visibility"
                    description="Find out how discoverable you are in AI search engines like ChatGPT, Perplexity, and Claude. When potential clients ask AI chatbots for real estate agent recommendations, you want to be mentioned. Run your first analysis to see where you stand and get personalized recommendations to improve your AI visibility."
                    action={{
                        label: 'Run AI Visibility Analysis',
                        onClick: handleRunAnalysis,
                        variant: 'ai',
                    }}
                    secondaryAction={{
                        label: 'Learn About AEO',
                        onClick: () => {
                            window.open('https://optimancer.com/', '_blank');
                        },
                    }}
                />
            </StandardPageLayout>
        );
    }

    return (
        <StandardPageLayout
            title="AI Visibility"
            description="Optimize your presence in AI search engines"
            actions={
                <Button
                    onClick={handleRunAnalysis}
                    disabled={isAnalyzing}
                    variant="ai"
                    size="default"
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Run Analysis
                        </>
                    )}
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Info Banner */}
                <Card className="bg-gradient-to-br from-primary/5 to-purple-600/5 border-primary/20">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold mb-1">What is AI Visibility?</h3>
                                <p className="text-sm text-muted-foreground">
                                    AI Visibility (AEO - Answer Engine Optimization) measures how discoverable you are when potential clients ask AI chatbots like ChatGPT, Perplexity, or Claude for real estate agent recommendations. A higher score means you're more likely to be recommended by AI assistants.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Score and History */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {score && <AEOScoreCard score={score} />}
                    {history.length > 0 && <AEOScoreHistoryChart history={history} />}
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && user && (
                    <AEORecommendationsList recommendations={recommendations} userId={user.id} />
                )}

                {/* What's Next */}
                {score && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                What's Next?
                            </CardTitle>
                            <CardDescription>
                                Take action to improve your AI visibility
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="p-4 rounded-lg border bg-card">
                                    <h4 className="font-semibold mb-2">1. Complete Recommendations</h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Work through your personalized recommendations to improve your score.
                                    </p>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href="#recommendations">View Recommendations</a>
                                    </Button>
                                </div>

                                <div className="p-4 rounded-lg border bg-card">
                                    <h4 className="font-semibold mb-2">2. Optimize Your Profile</h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Ensure your profile has all the information AI needs to recommend you.
                                    </p>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href="/brand/profile">Edit Profile</a>
                                    </Button>
                                </div>

                                <div className="p-4 rounded-lg border bg-card">
                                    <h4 className="font-semibold mb-2">3. Create AEO-Optimized Content</h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Generate content that's optimized for AI search engines.
                                    </p>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href="/studio/write">Create Content</a>
                                    </Button>
                                </div>

                                <div className="p-4 rounded-lg border bg-card">
                                    <h4 className="font-semibold mb-2">4. Track Your Progress</h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Run regular analyses to monitor your improvement over time.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRunAnalysis}
                                        disabled={isAnalyzing}
                                    >
                                        {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Schema Markup Generator */}
                {profile && <SchemaMarkupGenerator profile={profile} />}
            </div>
        </StandardPageLayout>
    );
}
