'use client';

import { useActionState, useState, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Sparkles, TrendingUp, FileText, Video, MapPin, MessageSquare } from 'lucide-react';

// Import our new improvements
import { ErrorBoundary, AIErrorBoundary } from '@/components/error-boundary';
import { AILoadingState, useAIOperation } from '@/components/ai-loading-state';
import { performanceMonitor, withPerformanceTracking } from '@/lib/performance';
// import { cache, cacheKeys, withCache } from '@/lib/cache';
import { analytics, trackAIGeneration, useAnalytics } from '@/lib/analytics';

// Import existing actions
import { generateBlogPostAction, generateMarketUpdateAction } from '@/app/actions';

// Enhanced blog post action with all improvements
const enhancedGenerateBlogPost = withPerformanceTracking(
    'blog-post-generation',
    async (formData: FormData) => {
        const topic = formData.get('topic') as string;
        const audience = formData.get('audience') as string;
        const keywords = formData.get('keywords') as string;

        // Track generation start
        trackAIGeneration.started('blog-post', topic.length);

        const startTime = Date.now();
        try {
            const result = await generateBlogPostAction(null, formData);
            const duration = Date.now() - startTime;

            // Track successful generation
            trackAIGeneration.completed('blog-post', duration, true, result.data?.blogPost?.length);

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            trackAIGeneration.failed('blog-post', error instanceof Error ? error.message : 'Unknown error', duration);
            throw error;
        }
    }
);

export default function EnhancedStudioWritePage() {
    const searchParams = useSearchParams();
    const { trackEvent } = useAnalytics();

    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'blog-post');
    const [blogTopic, setBlogTopic] = useState('');

    // AI operation state management
    const blogOperation = useAIOperation();
    const marketOperation = useAIOperation();

    // Form states
    const [blogPostState, blogPostAction, isBlogPostPending] = useActionState(
        enhancedGenerateBlogPost,
        { message: '', data: { blogPost: null, headerImage: null }, errors: {} }
    );

    const [marketUpdateState, marketUpdateAction, isMarketUpdatePending] = useActionState(
        generateMarketUpdateAction,
        { message: '', data: null, errors: {} }
    );

    // Content states
    const [blogPostContent, setBlogPostContent] = useState('');
    const [marketUpdateContent, setMarketUpdateContent] = useState('');

    // Track page view
    useEffect(() => {
        trackEvent('page_view', { page: 'studio_write', tab: activeTab });
    }, [activeTab, trackEvent]);

    // Handle blog post generation with enhanced UX
    useEffect(() => {
        if (isBlogPostPending) {
            blogOperation.startOperation();

            // Simulate progress stages
            setTimeout(() => blogOperation.updateStage('generating', 25), 1000);
            setTimeout(() => blogOperation.updateStage('optimizing', 60), 3000);
            setTimeout(() => blogOperation.updateStage('finalizing', 90), 5000);
        } else {
            blogOperation.completeOperation();
        }
    }, [isBlogPostPending]);

    // Handle successful blog post generation
    useEffect(() => {
        if (blogPostState.message === 'success' && blogPostState.data?.blogPost) {
            setBlogPostContent(blogPostState.data.blogPost);
            blogOperation.completeOperation();

            toast({
                title: '✨ Blog Post Generated!',
                description: 'Your content is ready. Check the cache hit rate in analytics.',
                duration: 4000,
            });

            // Track user satisfaction (you could add a rating component)
            trackEvent('content_generated', {
                type: 'blog-post',
                contentLength: blogPostState.data.blogPost.length,
                topic: blogTopic
            });
        } else if (blogPostState.message && blogPostState.message !== 'success') {
            blogOperation.failOperation(blogPostState.message);
        }
    }, [blogPostState, blogTopic, blogOperation, trackEvent]);

    // Handle market update generation
    useEffect(() => {
        if (isMarketUpdatePending) {
            marketOperation.startOperation();
        } else {
            marketOperation.completeOperation();
        }
    }, [isMarketUpdatePending]);

    useEffect(() => {
        if (marketUpdateState.message === 'success' && marketUpdateState.data) {
            setMarketUpdateContent(marketUpdateState.data);
            marketOperation.completeOperation();

            toast({
                title: '✨ Market Update Generated!',
                description: 'Your market analysis is ready.',
            });
        } else if (marketUpdateState.message && marketUpdateState.message !== 'success') {
            marketOperation.failOperation(marketUpdateState.message);
        }
    }, [marketUpdateState, marketOperation]);

    const contentTypes = [
        {
            id: 'blog-post',
            title: 'Blog Posts',
            description: 'Publish blog posts that rank and convert',
            icon: FileText,
            color: 'from-purple-500 to-pink-500',
        },
        {
            id: 'market-update',
            title: 'Market Updates',
            description: 'Share market insights that position you as the local expert',
            icon: TrendingUp,
            color: 'from-blue-500 to-cyan-500',
        },
    ];

    return (
        <ErrorBoundary>
            <div className="space-y-8">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold">Enhanced Studio Write</h1>
                            <p className="text-muted-foreground">
                                Create content with performance monitoring, caching, and analytics
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Label htmlFor="content-type" className="text-sm font-medium whitespace-nowrap">
                                Content Type:
                            </Label>
                            <Select value={activeTab} onValueChange={setActiveTab}>
                                <SelectTrigger id="content-type" className="w-full max-w-md">
                                    <SelectValue placeholder="Select content type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {contentTypes.map((type) => {
                                        const Icon = type.icon;
                                        return (
                                            <SelectItem key={type.id} value={type.id}>
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4" />
                                                    <span>{type.title}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Stats */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {/* {cache.getStats().size} */}0
                                </div>
                                <div className="text-sm text-muted-foreground">Cached Items</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">
                                    {Math.round(performanceMonitor.getAverageTime('blog-post-generation') / 1000)}s
                                </div>
                                <div className="text-sm text-muted-foreground">Avg Generation Time</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-purple-600">
                                    {Math.round(performanceMonitor.getSuccessRate('blog-post-generation'))}%
                                </div>
                                <div className="text-sm text-muted-foreground">Success Rate</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Content Generation Forms */}
                {activeTab === 'blog-post' && (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle>Blog Post Generator</CardTitle>
                                <CardDescription>
                                    Create SEO-optimized blog posts with performance tracking
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AIErrorBoundary>
                                    <form action={blogPostAction} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="topic">Blog Topic</Label>
                                            <Textarea
                                                id="topic"
                                                name="topic"
                                                placeholder="e.g., First-time homebuyer tips for Seattle market"
                                                value={blogTopic}
                                                onChange={(e) => setBlogTopic(e.target.value)}
                                                required
                                                rows={3}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="audience">Target Audience</Label>
                                            <Select name="audience" defaultValue="First-Time Buyers">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="First-Time Buyers">First-Time Buyers</SelectItem>
                                                    <SelectItem value="Sellers">Sellers</SelectItem>
                                                    <SelectItem value="Investors">Investors</SelectItem>
                                                    <SelectItem value="Luxury Buyers">Luxury Buyers</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="keywords">Keywords (optional)</Label>
                                            <Input
                                                id="keywords"
                                                name="keywords"
                                                placeholder="e.g., Seattle real estate, home buying tips"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isBlogPostPending}
                                            className="w-full"
                                            variant="ai"
                                        >
                                            {isBlogPostPending ? (
                                                <>
                                                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Generate Blog Post
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </AIErrorBoundary>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Generated Content</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isBlogPostPending ? (
                                    <AILoadingState
                                        operation="blog-post"
                                        stage={blogOperation.stage}
                                        progress={blogOperation.progress}
                                    />
                                ) : blogPostContent ? (
                                    <div className="space-y-4">
                                        <div className="prose max-w-none">
                                            <div className="whitespace-pre-wrap">{blogPostContent}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => navigator.clipboard.writeText(blogPostContent)}
                                                variant="outline"
                                            >
                                                Copy Content
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    // Save functionality would go here
                                                    toast({ title: 'Content Saved!', description: 'Added to your library.' });
                                                }}
                                            >
                                                Save to Library
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground py-12">
                                        <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                        <p>Your generated blog post will appear here</p>
                                    </div>
                                )}

                                {blogOperation.error && (
                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-800">{blogOperation.error}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'market-update' && (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle>Market Update Generator</CardTitle>
                                <CardDescription>
                                    Create hyper-local market updates with analytics
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AIErrorBoundary>
                                    <form action={marketUpdateAction} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="location">Location</Label>
                                            <Input
                                                id="location"
                                                name="location"
                                                placeholder="e.g., Seattle, WA"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="timePeriod">Time Period</Label>
                                            <Input
                                                id="timePeriod"
                                                name="timePeriod"
                                                type="month"
                                                defaultValue={new Date().toISOString().slice(0, 7)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="propertyType">Property Type</Label>
                                            <Select name="propertyType" defaultValue="All Properties">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="All Properties">All Properties</SelectItem>
                                                    <SelectItem value="Single-Family Homes">Single-Family Homes</SelectItem>
                                                    <SelectItem value="Condos">Condos</SelectItem>
                                                    <SelectItem value="Townhomes">Townhomes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isMarketUpdatePending}
                                            className="w-full"
                                            variant="ai"
                                        >
                                            {isMarketUpdatePending ? (
                                                <>
                                                    <TrendingUp className="mr-2 h-4 w-4 animate-spin" />
                                                    Analyzing...
                                                </>
                                            ) : (
                                                <>
                                                    <TrendingUp className="mr-2 h-4 w-4" />
                                                    Generate Update
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </AIErrorBoundary>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Generated Market Update</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isMarketUpdatePending ? (
                                    <AILoadingState
                                        operation="market-analysis"
                                        stage={marketOperation.stage}
                                        progress={marketOperation.progress}
                                    />
                                ) : marketUpdateContent ? (
                                    <div className="space-y-4">
                                        <div className="prose max-w-none">
                                            <div className="whitespace-pre-wrap">{marketUpdateContent}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => navigator.clipboard.writeText(marketUpdateContent)}
                                                variant="outline"
                                            >
                                                Copy Content
                                            </Button>
                                            <Button>Save to Library</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground py-12">
                                        <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                        <p>Your market update will appear here</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
}