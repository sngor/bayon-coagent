'use client';

import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, TrendingUp, Loader2, AlertCircle, Brain, Search, Globe, Network, Users, Zap, RefreshCw, Eye, Target, BarChart3, Download } from 'lucide-react';
import { useUser } from '@/aws/auth';
import { useToast } from '@/hooks/use-toast';
import { FirstTimeUseEmptyState } from '@/components/ui/empty-states';
import { RecommendationsInterface } from '@/components/ai-visibility/recommendations-interface';
import { MentionsMonitoringDisplay } from '@/components/ai-visibility/mentions-monitoring-display';
import { AnalyticsDashboard } from '@/components/ai-visibility/analytics-dashboard';
import { PerformanceReport } from '@/components/ai-visibility/performance-report';
import type { AIVisibilityScore, AIVisibilityAnalysis, OptimizationRecommendation, AIMention } from '@/lib/ai-visibility/types';
import type { Profile } from '@/lib/types/common/common';

// AI Visibility Score Card Component
function AIVisibilityScoreCard({ score }: { score: AIVisibilityScore }) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Improvement';
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving':
                return <TrendingUp className="h-4 w-4 text-green-600" />;
            case 'declining':
                return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
            default:
                return <BarChart3 className="h-4 w-4 text-gray-600" />;
        }
    };

    return (
        <Card className="bg-gradient-to-br from-primary/5 to-purple-600/5 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Visibility Score
                </CardTitle>
                <CardDescription>
                    Your overall discoverability across AI platforms
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`text-4xl font-bold ${getScoreColor(score.overall)}`}>
                                {score.overall}
                            </span>
                            <span className="text-2xl text-muted-foreground">/100</span>
                            {getTrendIcon(score.trend)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {getScoreLabel(score.overall)} • Last updated {new Date(score.calculatedAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="text-right">
                        <Badge variant={score.overall >= 60 ? 'default' : 'secondary'}>
                            {getScoreLabel(score.overall)}
                        </Badge>
                        {score.previousScore && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {score.overall > score.previousScore ? '+' : ''}
                                {score.overall - score.previousScore} from last analysis
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Score Breakdown</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Schema Markup (25%)</span>
                            <div className="flex items-center gap-2">
                                <Progress value={score.breakdown.schemaMarkup} className="w-20" />
                                <span className="text-sm font-medium w-8">{score.breakdown.schemaMarkup}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Content Optimization (20%)</span>
                            <div className="flex items-center gap-2">
                                <Progress value={score.breakdown.contentOptimization} className="w-20" />
                                <span className="text-sm font-medium w-8">{score.breakdown.contentOptimization}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">AI Search Presence (20%)</span>
                            <div className="flex items-center gap-2">
                                <Progress value={score.breakdown.aiSearchPresence} className="w-20" />
                                <span className="text-sm font-medium w-8">{score.breakdown.aiSearchPresence}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Knowledge Graph (15%)</span>
                            <div className="flex items-center gap-2">
                                <Progress value={score.breakdown.knowledgeGraphIntegration} className="w-20" />
                                <span className="text-sm font-medium w-8">{score.breakdown.knowledgeGraphIntegration}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Social Signals (10%)</span>
                            <div className="flex items-center gap-2">
                                <Progress value={score.breakdown.socialSignals} className="w-20" />
                                <span className="text-sm font-medium w-8">{score.breakdown.socialSignals}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Technical SEO (10%)</span>
                            <div className="flex items-center gap-2">
                                <Progress value={score.breakdown.technicalSEO} className="w-20" />
                                <span className="text-sm font-medium w-8">{score.breakdown.technicalSEO}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Platform Breakdown Component
function PlatformBreakdownCard({ score }: { score: AIVisibilityScore }) {
    const platforms = [
        { 
            name: 'SEO', 
            icon: Search, 
            score: Math.round((score.breakdown.schemaMarkup + score.breakdown.technicalSEO) / 2),
            description: 'Traditional search engines'
        },
        { 
            name: 'AEO', 
            icon: Brain, 
            score: score.breakdown.aiSearchPresence,
            description: 'AI answer engines'
        },
        { 
            name: 'AIO', 
            icon: Zap, 
            score: score.breakdown.contentOptimization,
            description: 'AI optimization platforms'
        },
        { 
            name: 'GEO', 
            icon: Globe, 
            score: score.breakdown.knowledgeGraphIntegration,
            description: 'Generative engine optimization'
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Platform Breakdown
                </CardTitle>
                <CardDescription>
                    Performance across different AI optimization categories
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    {platforms.map((platform) => {
                        const Icon = platform.icon;
                        return (
                            <div key={platform.name} className="p-4 rounded-lg border bg-card">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="h-4 w-4 text-primary" />
                                    <span className="font-semibold">{platform.name}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl font-bold">{platform.score}</span>
                                    <span className="text-sm text-muted-foreground">/100</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{platform.description}</p>
                                <Progress value={platform.score} className="mt-2" />
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

// Monitoring Status Component
function MonitoringStatusCard({ lastAnalysis, isMonitoring }: { lastAnalysis?: Date; isMonitoring: boolean }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Monitoring Status
                </CardTitle>
                <CardDescription>
                    Real-time AI platform monitoring
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                        {isMonitoring ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
                
                {lastAnalysis && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Last Analysis</span>
                        <span className="text-sm text-muted-foreground">
                            {new Date(lastAnalysis).toLocaleDateString()}
                        </span>
                    </div>
                )}

                <div className="space-y-2">
                    <span className="text-sm font-medium">Monitored Platforms</span>
                    <div className="flex flex-wrap gap-2">
                        {['ChatGPT', 'Claude', 'Perplexity', 'Gemini', 'Bing Chat'].map((platform) => (
                            <Badge key={platform} variant="outline" className="text-xs">
                                {platform}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="h-3 w-3" />
                        Next check in 24 hours
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AIVisibilityPage() {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [analysis, setAnalysis] = useState<AIVisibilityAnalysis | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'performance'>('overview');

    // Mock competitor data for demonstration
    const mockCompetitorData = [
        {
            name: 'Jane Doe Real Estate',
            mentionCount: 12,
            averagePosition: 1.8,
            sentimentScore: 0.85
        },
        {
            name: 'You (John Smith)',
            mentionCount: 8,
            averagePosition: 2.1,
            sentimentScore: 0.78
        },
        {
            name: 'Metro Properties Group',
            mentionCount: 6,
            averagePosition: 2.5,
            sentimentScore: 0.72
        },
        {
            name: 'Premium Properties LLC',
            mentionCount: 4,
            averagePosition: 3.2,
            sentimentScore: 0.68
        }
    ];

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

                // TODO: Load AI visibility analysis data
                // This would call the AI visibility services to get current analysis
                // For now, we'll simulate loading state
                
                // Simulate loading delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error('Failed to load AI visibility data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [user?.id]);

    const handleUpdateRecommendation = async (id: string, status: OptimizationRecommendation['status']) => {
        if (!analysis) return;

        // Update the recommendation status in the local state
        const updatedRecommendations = analysis.recommendations.map(rec => 
            rec.id === id 
                ? { ...rec, status, completedAt: status === 'completed' ? new Date() : rec.completedAt }
                : rec
        );

        setAnalysis({
            ...analysis,
            recommendations: updatedRecommendations
        });

        // TODO: Persist the update to the backend
        toast({
            title: 'Recommendation Updated',
            description: `Recommendation marked as ${status.replace('-', ' ')}.`,
        });
    };

    const handleTrackImpact = async (id: string) => {
        // TODO: Implement impact tracking
        toast({
            title: 'Impact Tracking',
            description: 'Impact tracking will be available after the next analysis run.',
        });
    };

    const handleExportReport = async () => {
        toast({
            title: 'Exporting Report',
            description: 'Your AI visibility report is being generated...',
        });
        
        // TODO: Implement actual report export
        setTimeout(() => {
            toast({
                title: 'Report Exported',
                description: 'Your report has been downloaded successfully.',
            });
        }, 2000);
    };

    const handleRefreshData = async () => {
        toast({
            title: 'Refreshing Data',
            description: 'Updating AI visibility analytics...',
        });
        
        // TODO: Implement actual data refresh
        setTimeout(() => {
            toast({
                title: 'Data Refreshed',
                description: 'Analytics data has been updated.',
            });
        }, 1500);
    };

    const handleRunAnalysis = async () => {
        if (!user?.id) return;

        setIsAnalyzing(true);

        try {
            // TODO: Implement AI visibility analysis
            // This would call the optimization engine to run a full analysis
            
            // Simulate analysis
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Mock analysis result for now
            const mockRecommendations: OptimizationRecommendation[] = [
                {
                    id: 'rec-1',
                    category: 'schema',
                    priority: 'high',
                    title: 'Add RealEstateAgent Schema Markup',
                    description: 'Implement comprehensive RealEstateAgent schema markup to help AI systems understand your professional credentials and services.',
                    actionItems: [
                        'Add JSON-LD script to your website header',
                        'Include your certifications and specializations',
                        'Add service area geographic coordinates',
                        'Include aggregate rating from testimonials'
                    ],
                    estimatedImpact: 15,
                    implementationDifficulty: 'medium',
                    codeExample: `{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "Your Name",
  "jobTitle": "Real Estate Agent",
  "worksFor": {
    "@type": "RealEstateAgency",
    "name": "Your Brokerage"
  },
  "areaServed": {
    "@type": "City",
    "name": "Your City"
  }
}`,
                    resources: [
                        'https://schema.org/RealEstateAgent',
                        'https://developers.google.com/search/docs/appearance/structured-data'
                    ],
                    status: 'pending',
                    createdAt: new Date(),
                },
                {
                    id: 'rec-2',
                    category: 'content',
                    priority: 'high',
                    title: 'Create AI-Optimized FAQ Content',
                    description: 'Develop FAQ pages that answer common real estate questions in a format that AI systems can easily parse and recommend.',
                    actionItems: [
                        'Research common real estate questions in your market',
                        'Create structured FAQ pages with clear headings',
                        'Add FAQPage schema markup',
                        'Optimize for conversational AI queries'
                    ],
                    estimatedImpact: 12,
                    implementationDifficulty: 'easy',
                    resources: [
                        'https://schema.org/FAQPage'
                    ],
                    status: 'pending',
                    createdAt: new Date(),
                },
                {
                    id: 'rec-3',
                    category: 'technical',
                    priority: 'medium',
                    title: 'Optimize Website Loading Speed',
                    description: 'Improve your website\'s Core Web Vitals to enhance both user experience and AI crawler efficiency.',
                    actionItems: [
                        'Compress and optimize images',
                        'Minimize CSS and JavaScript files',
                        'Enable browser caching',
                        'Use a Content Delivery Network (CDN)'
                    ],
                    estimatedImpact: 8,
                    implementationDifficulty: 'medium',
                    status: 'in-progress',
                    createdAt: new Date(),
                },
                {
                    id: 'rec-4',
                    category: 'social',
                    priority: 'low',
                    title: 'Enhance Social Media Profiles',
                    description: 'Optimize your social media profiles with consistent NAP information and professional descriptions.',
                    actionItems: [
                        'Update all social profiles with consistent business information',
                        'Add professional headshots and cover images',
                        'Include links to your website and contact information',
                        'Post regular market updates and client testimonials'
                    ],
                    estimatedImpact: 5,
                    implementationDifficulty: 'easy',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                }
            ];

            // Mock mentions data
            const mockMentions: AIMention[] = [
                {
                    id: 'mention-1',
                    platform: 'chatgpt',
                    query: 'best real estate agents in downtown area',
                    response: 'Based on client reviews and market expertise, I recommend several top agents including John Smith who specializes in downtown properties...',
                    mentionContext: 'John Smith who specializes in downtown properties and has excellent client reviews',
                    position: 2,
                    sentiment: 'positive',
                    competitorsAlsoMentioned: ['Jane Doe Real Estate', 'Metro Properties Group'],
                    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                    confidence: 0.92
                },
                {
                    id: 'mention-2',
                    platform: 'perplexity',
                    query: 'real estate agent recommendations for first time buyers',
                    response: 'For first-time buyers, I suggest working with experienced agents like John Smith who provides comprehensive guidance...',
                    mentionContext: 'John Smith who provides comprehensive guidance through the buying process',
                    position: 1,
                    sentiment: 'positive',
                    competitorsAlsoMentioned: ['First Time Buyer Specialists'],
                    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                    confidence: 0.88
                },
                {
                    id: 'mention-3',
                    platform: 'claude',
                    query: 'luxury real estate agents in the area',
                    response: 'Several agents handle luxury properties well, including John Smith, though his focus is more on mid-range properties...',
                    mentionContext: 'John Smith, though his focus is more on mid-range properties',
                    position: 3,
                    sentiment: 'neutral',
                    competitorsAlsoMentioned: ['Luxury Estates Inc', 'Premium Properties LLC'],
                    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                    confidence: 0.75
                },
                {
                    id: 'mention-4',
                    platform: 'gemini',
                    query: 'real estate agents with good customer service',
                    response: 'Agents known for excellent customer service include John Smith, who consistently receives positive feedback...',
                    mentionContext: 'John Smith, who consistently receives positive feedback from clients',
                    position: 1,
                    sentiment: 'positive',
                    competitorsAlsoMentioned: ['Customer First Realty'],
                    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
                    confidence: 0.91
                }
            ];

            const mockAnalysis: AIVisibilityAnalysis = {
                userId: user.id,
                score: {
                    overall: 72,
                    breakdown: {
                        schemaMarkup: 85,
                        contentOptimization: 68,
                        aiSearchPresence: 75,
                        knowledgeGraphIntegration: 60,
                        socialSignals: 70,
                        technicalSEO: 80
                    },
                    calculatedAt: new Date(),
                    trend: 'improving',
                    previousScore: 68
                },
                mentions: mockMentions,
                recommendations: mockRecommendations,
                schemaAnalysis: {
                    current: [],
                    missing: [],
                    errors: []
                },
                knowledgeGraph: [],
                analyzedAt: new Date()
            };

            setAnalysis(mockAnalysis);

            toast({
                title: 'Analysis Complete',
                description: `Your AI visibility score is ${mockAnalysis.score.overall}/100. Check your recommendations below.`,
            });
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
            <PageLayout
                title="AI Visibility"
                description="Optimize your presence across AI search engines and platforms"
            >
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </PageLayout>
        );
    }

    // Show empty state if no analysis has been run
    if (!analysis && !isAnalyzing) {
        return (
            <PageLayout
                title="AI Visibility"
                description="Optimize your presence across AI search engines and platforms"
            >
                <FirstTimeUseEmptyState
                    icon={<Sparkles className="h-8 w-8 text-primary" />}
                    title="Discover Your AI Visibility"
                    description="Find out how discoverable you are across AI platforms like ChatGPT, Claude, Perplexity, and Gemini. When potential clients ask AI assistants for real estate agent recommendations, you want to be mentioned. Run your first analysis to see where you stand and get personalized recommendations to improve your AI visibility across SEO, AEO, AIO, and GEO platforms."
                    action={{
                        label: 'Run AI Visibility Analysis',
                        onClick: handleRunAnalysis,
                        variant: 'ai',
                    }}
                    secondaryAction={{
                        label: 'Learn About AI Optimization',
                        onClick: () => {
                            window.open('https://optimancer.com/', '_blank');
                        },
                    }}
                />
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="AI Visibility"
            description="Optimize your presence across AI search engines and platforms"
            actions={
                <div className="flex items-center gap-2">
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
                    {analysis && (
                        <Button
                            onClick={handleExportReport}
                            variant="outline"
                            size="default"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export Report
                        </Button>
                    )}
                </div>
            }
        >
            <div className="space-y-6">
                {/* Tab Navigation */}
                {analysis && (
                    <div className="border-b">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'overview'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                                }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'analytics'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                                }`}
                            >
                                Analytics
                            </button>
                            <button
                                onClick={() => setActiveTab('performance')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'performance'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                                }`}
                            >
                                Performance Report
                            </button>
                        </nav>
                    </div>
                )}

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <>
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
                                            AI Visibility optimization ensures you're discoverable across traditional search engines (SEO), AI answer engines (AEO), AI optimization platforms (AIO), and generative engine optimization (GEO). When potential clients ask AI assistants for real estate recommendations, you want to be mentioned and recommended.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Main Dashboard Grid */}
                        {analysis && (
                            <>
                                {/* Score and Platform Breakdown */}
                                <div className="grid gap-6 lg:grid-cols-2">
                                    <AIVisibilityScoreCard score={analysis.score} />
                                    <PlatformBreakdownCard score={analysis.score} />
                                </div>

                                {/* Monitoring Status */}
                                <MonitoringStatusCard 
                                    lastAnalysis={analysis.analyzedAt} 
                                    isMonitoring={true} 
                                />

                                {/* Quick Actions */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5" />
                                            Quick Actions
                                        </CardTitle>
                                        <CardDescription>
                                            Take immediate steps to improve your AI visibility
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2" asChild>
                                                <a href="#recommendations">
                                                    <Users className="h-5 w-5 text-primary" />
                                                    <div className="text-left">
                                                        <div className="font-semibold">View Recommendations</div>
                                                        <div className="text-xs text-muted-foreground">Get personalized optimization tips</div>
                                                    </div>
                                                </a>
                                            </Button>

                                            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2" asChild>
                                                <a href="/brand/profile">
                                                    <Network className="h-5 w-5 text-primary" />
                                                    <div className="text-left">
                                                        <div className="font-semibold">Optimize Profile</div>
                                                        <div className="text-xs text-muted-foreground">Complete your professional profile</div>
                                                    </div>
                                                </a>
                                            </Button>

                                            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2" asChild>
                                                <a href="/studio/write">
                                                    <Zap className="h-5 w-5 text-primary" />
                                                    <div className="text-left">
                                                        <div className="font-semibold">Create AI Content</div>
                                                        <div className="text-xs text-muted-foreground">Generate optimized content</div>
                                                    </div>
                                                </a>
                                            </Button>

                                            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2" asChild>
                                                <a href="#mentions">
                                                    <Eye className="h-5 w-5 text-primary" />
                                                    <div className="text-left">
                                                        <div className="font-semibold">View Mentions</div>
                                                        <div className="text-xs text-muted-foreground">See AI platform mentions</div>
                                                    </div>
                                                </a>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Recommendations Interface */}
                                <RecommendationsInterface 
                                    recommendations={analysis.recommendations}
                                    onUpdateRecommendation={handleUpdateRecommendation}
                                    onTrackImpact={handleTrackImpact}
                                />

                                {/* AI Mentions and Monitoring Display */}
                                <MentionsMonitoringDisplay 
                                    mentions={analysis.mentions}
                                    competitorData={mockCompetitorData}
                                />
                            </>
                        )}
                    </>
                )}

                {activeTab === 'analytics' && analysis && (
                    <AnalyticsDashboard 
                        userId={user?.id || ''}
                        onExportReport={handleExportReport}
                        onRefreshData={handleRefreshData}
                    />
                )}

                {activeTab === 'performance' && analysis && (
                    <PerformanceReport 
                        userId={user?.id || ''}
                        timeRange="90d"
                        onExportReport={(format) => {
                            toast({
                                title: 'Exporting Report',
                                description: `Generating ${format.toUpperCase()} report...`,
                            });
                        }}
                    />
                )}
            </div>
        </PageLayout>
    );
}
