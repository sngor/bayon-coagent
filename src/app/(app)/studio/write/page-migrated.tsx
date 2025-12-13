'use client';

import { useState, useTransition, useEffect } from 'react';
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
import { analytics, trackAIGeneration, useAnalytics } from '@/lib/analytics';

// Import NEW API client instead of server actions
import { generateBlogPost, generateMarketUpdate } from '@/lib/api-client';

export default function MigratedStudioWritePage() {
    const searchParams = useSearchParams();
    const { trackEvent } = useAnalytics();

    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'blog-post');
    const [blogTopic, setBlogTopic] = useState('');

    // AI operation state management
    const blogOperation = useAIOperation();
    const marketOperation = useAIOperation();

    // Loading states (replacing useActionState)
    const [isBlogPostPending, startBlogTransition] = useTransition();
    const [isMarketUpdatePending, startMarketTransition] = useTransition();

    // Content states
    const [blogPostContent, setBlogPostContent] = useState('');
    const [marketUpdateContent, setMarketUpdateContent] = useState('');

    // Error states
    const [blogPostError, setBlogPostError] = useState<string | null>(null);
    const [marketUpdateError, setMarketUpdateError] = useState<string | null>(null);

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

    // Enhanced blog post generation with API client
    const handleBlogPostGeneration = async (formData: FormData) => {
        const topic = formData.get('topic') as string;
        const audience = formData.get('audience') as string;
        const keywords = formData.get('keywords') as string;
        const tone = formData.get('tone') as string;

        setBlogPostError(null);

        // Track generation start
        trackAIGeneration.started('blog-post', topic.length);

        const startTime = Date.now();

        startBlogTransition(async () => {
            try {
                const result = await generateBlogPost({
                    topic,
                    audience,
                    keywords,
                    tone,
                    includeImage: true,
                });

                const duration = Date.now() - startTime;

                if (result.success && result.data) {
                    setBlogPostContent(result.data.blogPost || '');

                    // Track successful generation
                    trackAIGeneration.completed('blog-post', duration, true, result.data.blogPost?.length);

                    toast({
                        title: "Blog post generated!",
                        description: "Your blog post has been created successfully.",
                    });
                } else {
                    throw new Error(result.error?.message || 'Generation failed');
                }
            } catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                setBlogPostError(errorMessage);
                trackAIGeneration.failed('blog-post', errorMessage, duration);

                toast({
                    title: "Generation failed",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
        });
    };

    // Enhanced market update generation with API client
    const handleMarketUpdateGeneration = async (formData: FormData) => {
        const location = formData.get('location') as string;
        const timeframe = formData.get('timeframe') as string;
        const focus = formData.get('focus') as string;

        setMarketUpdateError(null);

        // Track generation start
        trackAIGeneration.started('market-update', location.length);

        const startTime = Date.now();

        startMarketTransition(async () => {
            try {
                const result = await generateMarketUpdate({
                    location,
                    timeframe,
                    focus,
                });

                const duration = Date.now() - startTime;

                if (result.success && result.data) {
                    setMarketUpdateContent(result.data.marketUpdate || '');

                    // Track successful generation
                    trackAIGeneration.completed('market-update', duration, true, result.data.marketUpdate?.length);

                    toast({
                        title: "Market update generated!",
                        description: "Your market update has been created successfully.",
                    });
                } else {
                    throw new Error(result.error?.message || 'Generation failed');
                }
            } catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                setMarketUpdateError(errorMessage);
                trackAIGeneration.failed('market-update', errorMessage, duration);

                toast({
                    title: "Generation failed",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <ErrorBoundary>
            <div className="container mx-auto p-6 space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Content Studio</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Create compelling content that engages your audience and drives results
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center">
                    <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                        {[
                            { id: 'blog-post', label: 'Blog Post', icon: FileText },
                            { id: 'market-update', label: 'Market Update', icon: TrendingUp },
                            { id: 'social-post', label: 'Social Post', icon: MessageSquare },
                            { id: 'video-script', label: 'Video Script', icon: Video },
                            { id: 'neighborhood-guide', label: 'Neighborhood Guide', icon: MapPin },
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === id
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'hover:bg-background/50'
                                    }`}
                            >
                                <Icon className="w-4 h-4 mr-2" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Blog Post Tab */}
                {activeTab === 'blog-post' && (
                    <AIErrorBoundary>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Blog Post Generator
                                </CardTitle>
                                <CardDescription>
                                    Create engaging blog posts that establish your expertise and attract potential clients
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        handleBlogPostGeneration(formData);
                                    }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="topic">Blog Topic *</Label>
                                            <Input
                                                id="topic"
                                                name="topic"
                                                placeholder="e.g., First-time homebuyer tips"
                                                value={blogTopic}
                                                onChange={(e) => setBlogTopic(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="audience">Target Audience</Label>
                                            <Select name="audience" defaultValue="first-time-buyers">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="first-time-buyers">First-time Buyers</SelectItem>
                                                    <SelectItem value="sellers">Home Sellers</SelectItem>
                                                    <SelectItem value="investors">Real Estate Investors</SelectItem>
                                                    <SelectItem value="general">General Audience</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="tone">Writing Tone</Label>
                                            <Select name="tone" defaultValue="professional">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="professional">Professional</SelectItem>
                                                    <SelectItem value="friendly">Friendly</SelectItem>
                                                    <SelectItem value="authoritative">Authoritative</SelectItem>
                                                    <SelectItem value="conversational">Conversational</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="keywords">SEO Keywords (optional)</Label>
                                            <Input
                                                id="keywords"
                                                name="keywords"
                                                placeholder="e.g., home buying, mortgage rates"
                                            />
                                        </div>
                                    </div>

                                    {blogPostError && (
                                        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                                            <p className="text-red-800 text-sm">{blogPostError}</p>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isBlogPostPending || !blogTopic.trim()}
                                        className="w-full"
                                    >
                                        {isBlogPostPending ? (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                                Generating Blog Post...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Generate Blog Post
                                            </>
                                        )}
                                    </Button>
                                </form>

                                {/* AI Loading State */}
                                {isBlogPostPending && (
                                    <AILoadingState
                                        operation={blogOperation}
                                        estimatedTime={30}
                                        tips={[
                                            "Creating an engaging headline...",
                                            "Researching relevant market data...",
                                            "Structuring your content for SEO...",
                                            "Adding professional insights..."
                                        ]}
                                    />
                                )}

                                {/* Generated Content */}
                                {blogPostContent && (
                                    <div className="mt-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold">Generated Blog Post</h3>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(blogPostContent);
                                                    toast({ title: "Copied to clipboard!" });
                                                }}
                                            >
                                                Copy Content
                                            </Button>
                                        </div>
                                        <Textarea
                                            value={blogPostContent}
                                            onChange={(e) => setBlogPostContent(e.target.value)}
                                            className="min-h-[400px] font-mono text-sm"
                                            placeholder="Your generated blog post will appear here..."
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </AIErrorBoundary>
                )}

                {/* Market Update Tab */}
                {activeTab === 'market-update' && (
                    <AIErrorBoundary>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    Market Update Generator
                                </CardTitle>
                                <CardDescription>
                                    Create timely market updates that showcase your local expertise
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        handleMarketUpdateGeneration(formData);
                                    }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="location">Location *</Label>
                                            <Input
                                                id="location"
                                                name="location"
                                                placeholder="e.g., Seattle, WA"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="timeframe">Timeframe</Label>
                                            <Select name="timeframe" defaultValue="monthly">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                                    <SelectItem value="yearly">Yearly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="focus">Market Focus</Label>
                                            <Select name="focus" defaultValue="general">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="general">General Market</SelectItem>
                                                    <SelectItem value="luxury">Luxury Homes</SelectItem>
                                                    <SelectItem value="first-time">First-time Buyers</SelectItem>
                                                    <SelectItem value="investment">Investment Properties</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {marketUpdateError && (
                                        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                                            <p className="text-red-800 text-sm">{marketUpdateError}</p>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isMarketUpdatePending}
                                        className="w-full"
                                    >
                                        {isMarketUpdatePending ? (
                                            <>
                                                <TrendingUp className="w-4 h-4 mr-2 animate-spin" />
                                                Generating Market Update...
                                            </>
                                        ) : (
                                            <>
                                                <TrendingUp className="w-4 h-4 mr-2" />
                                                Generate Market Update
                                            </>
                                        )}
                                    </Button>
                                </form>

                                {/* Generated Content */}
                                {marketUpdateContent && (
                                    <div className="mt-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold">Generated Market Update</h3>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(marketUpdateContent);
                                                    toast({ title: "Copied to clipboard!" });
                                                }}
                                            >
                                                Copy Content
                                            </Button>
                                        </div>
                                        <Textarea
                                            value={marketUpdateContent}
                                            onChange={(e) => setMarketUpdateContent(e.target.value)}
                                            className="min-h-[400px] font-mono text-sm"
                                            placeholder="Your generated market update will appear here..."
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </AIErrorBoundary>
                )}
            </div>
        </ErrorBoundary>
    );
}