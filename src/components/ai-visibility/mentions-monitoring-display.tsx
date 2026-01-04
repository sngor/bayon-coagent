'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    MessageSquare, 
    TrendingUp, 
    TrendingDown, 
    Calendar, 
    Clock, 
    Brain, 
    Users, 
    Target, 
    BarChart3,
    ThumbsUp,
    ThumbsDown,
    Minus,
    ExternalLink,
    Filter,
    Search,
    ChevronDown,
    Eye,
    Zap
} from 'lucide-react';
import type { AIMention, AIPlatform } from '@/lib/ai-visibility/types';

interface MentionsMonitoringDisplayProps {
    mentions: AIMention[];
    competitorData?: {
        name: string;
        mentionCount: number;
        averagePosition: number;
        sentimentScore: number;
    }[];
}

export function MentionsMonitoringDisplay({ mentions, competitorData = [] }: MentionsMonitoringDisplayProps) {
    const [selectedPlatform, setSelectedPlatform] = useState<AIPlatform | 'all'>('all');
    const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
    const [selectedSentiment, setSelectedSentiment] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');

    // Filter mentions based on selected filters
    const filteredMentions = mentions.filter(mention => {
        const platformMatch = selectedPlatform === 'all' || mention.platform === selectedPlatform;
        const sentimentMatch = selectedSentiment === 'all' || mention.sentiment === selectedSentiment;
        
        // Time filter
        const timeframeDays = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90;
        const cutoffDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
        const timeMatch = new Date(mention.timestamp) >= cutoffDate;
        
        return platformMatch && sentimentMatch && timeMatch;
    });

    // Calculate analytics
    const analytics = {
        totalMentions: filteredMentions.length,
        averagePosition: filteredMentions.length > 0 
            ? Math.round(filteredMentions.reduce((sum, m) => sum + m.position, 0) / filteredMentions.length)
            : 0,
        sentimentBreakdown: {
            positive: filteredMentions.filter(m => m.sentiment === 'positive').length,
            neutral: filteredMentions.filter(m => m.sentiment === 'neutral').length,
            negative: filteredMentions.filter(m => m.sentiment === 'negative').length,
        },
        platformBreakdown: {
            chatgpt: filteredMentions.filter(m => m.platform === 'chatgpt').length,
            claude: filteredMentions.filter(m => m.platform === 'claude').length,
            perplexity: filteredMentions.filter(m => m.platform === 'perplexity').length,
            gemini: filteredMentions.filter(m => m.platform === 'gemini').length,
            'bing-chat': filteredMentions.filter(m => m.platform === 'bing-chat').length,
        }
    };

    // Group mentions by week for trend analysis
    const weeklyTrends = (() => {
        const weeks: { [key: string]: number } = {};
        filteredMentions.forEach(mention => {
            const weekStart = new Date(mention.timestamp);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            weeks[weekKey] = (weeks[weekKey] || 0) + 1;
        });
        return Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b));
    })();

    const getSentimentIcon = (sentiment: AIMention['sentiment']) => {
        switch (sentiment) {
            case 'positive': return <ThumbsUp className="h-4 w-4 text-green-600" />;
            case 'negative': return <ThumbsDown className="h-4 w-4 text-red-600" />;
            default: return <Minus className="h-4 w-4 text-gray-600" />;
        }
    };

    const getSentimentColor = (sentiment: AIMention['sentiment']) => {
        switch (sentiment) {
            case 'positive': return 'text-green-600 bg-green-50 border-green-200';
            case 'negative': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getPlatformIcon = (platform: AIPlatform) => {
        // Return appropriate icon for each platform
        return <Brain className="h-4 w-4" />;
    };

    const MentionCard = ({ mention }: { mention: AIMention }) => (
        <Card className="mb-4">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        {getPlatformIcon(mention.platform)}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-sm font-medium capitalize">
                                    {mention.platform.replace('-', ' ')}
                                </CardTitle>
                                <Badge variant="outline" className="text-xs">
                                    Position #{mention.position}
                                </Badge>
                                <Badge variant="outline" className={`text-xs ${getSentimentColor(mention.sentiment)}`}>
                                    {getSentimentIcon(mention.sentiment)}
                                    <span className="ml-1 capitalize">{mention.sentiment}</span>
                                </Badge>
                            </div>
                            <CardDescription className="text-xs text-muted-foreground mb-2">
                                Query: "{mention.query}"
                            </CardDescription>
                            <div className="text-sm bg-muted p-3 rounded-md mb-2">
                                <p className="font-medium mb-1">AI Response Context:</p>
                                <p className="text-muted-foreground">{mention.mentionContext}</p>
                            </div>
                            {mention.competitorsAlsoMentioned.length > 0 && (
                                <div className="text-xs">
                                    <span className="font-medium">Also mentioned: </span>
                                    <span className="text-muted-foreground">
                                        {mention.competitorsAlsoMentioned.join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                        <div>{new Date(mention.timestamp).toLocaleDateString()}</div>
                        <div>{new Date(mention.timestamp).toLocaleTimeString()}</div>
                        <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                                {Math.round(mention.confidence * 100)}% confidence
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );

    const AnalyticsOverview = () => (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Total Mentions</span>
                    </div>
                    <div className="text-2xl font-bold">{analytics.totalMentions}</div>
                    <div className="text-xs text-muted-foreground">
                        Last {selectedTimeframe === '7d' ? '7 days' : selectedTimeframe === '30d' ? '30 days' : '90 days'}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Avg Position</span>
                    </div>
                    <div className="text-2xl font-bold">#{analytics.averagePosition || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">
                        In AI responses
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Positive Sentiment</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                        {analytics.sentimentBreakdown.positive}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {analytics.totalMentions > 0 
                            ? Math.round((analytics.sentimentBreakdown.positive / analytics.totalMentions) * 100)
                            : 0}% of mentions
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Platform Coverage</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {Object.values(analytics.platformBreakdown).filter(count => count > 0).length}/5
                    </div>
                    <div className="text-xs text-muted-foreground">
                        AI platforms active
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const TrendAnalysis = () => (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Mention Trends
                </CardTitle>
                <CardDescription>
                    Weekly mention frequency over time
                </CardDescription>
            </CardHeader>
            <CardContent>
                {weeklyTrends.length > 0 ? (
                    <div className="space-y-3">
                        {weeklyTrends.map(([week, count]) => (
                            <div key={week} className="flex items-center gap-3">
                                <div className="text-sm font-medium w-24">
                                    {new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                                <div className="flex-1">
                                    <Progress value={(count / Math.max(...weeklyTrends.map(([, c]) => c))) * 100} className="h-2" />
                                </div>
                                <div className="text-sm font-medium w-8">{count}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        No trend data available for the selected timeframe
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const CompetitorComparison = () => (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Competitive Positioning
                </CardTitle>
                <CardDescription>
                    How you compare to competitors in AI mentions
                </CardDescription>
            </CardHeader>
            <CardContent>
                {competitorData.length > 0 ? (
                    <div className="space-y-4">
                        {competitorData.map((competitor, index) => (
                            <div key={competitor.name} className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <div className="text-sm font-medium">#{index + 1}</div>
                                    <div>
                                        <div className="font-medium">{competitor.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            Avg position: #{competitor.averagePosition}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{competitor.mentionCount}</div>
                                    <div className="text-xs text-muted-foreground">mentions</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        Run competitive analysis to see competitor data
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const PlatformBreakdown = () => (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Platform Performance
                </CardTitle>
                <CardDescription>
                    Mentions across different AI platforms
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {Object.entries(analytics.platformBreakdown).map(([platform, count]) => (
                        <div key={platform} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {getPlatformIcon(platform as AIPlatform)}
                                <span className="text-sm font-medium capitalize">
                                    {platform.replace('-', ' ')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Progress 
                                    value={analytics.totalMentions > 0 ? (count / analytics.totalMentions) * 100 : 0} 
                                    className="w-20" 
                                />
                                <span className="text-sm font-medium w-8">{count}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );

    if (mentions.length === 0) {
        return (
            <div id="mentions" className="space-y-6">
                <Card>
                    <CardContent className="p-8 text-center">
                        <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">No AI Mentions Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            We haven't detected any mentions of you in AI platform responses yet. This could mean:
                        </p>
                        <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-1">
                            <li>• Your AI visibility optimization is still in progress</li>
                            <li>• AI platforms haven't indexed your updated information yet</li>
                            <li>• You need to improve your online presence and schema markup</li>
                        </ul>
                        <Button className="mt-4" variant="outline">
                            View Recommendations
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div id="mentions" className="space-y-6">
            {/* Analytics Overview */}
            <AnalyticsOverview />

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filter Mentions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Platform</label>
                            <select
                                value={selectedPlatform}
                                onChange={(e) => setSelectedPlatform(e.target.value as AIPlatform | 'all')}
                                className="px-3 py-2 border rounded-md text-sm"
                                aria-label="Filter by platform"
                            >
                                <option value="all">All Platforms</option>
                                <option value="chatgpt">ChatGPT</option>
                                <option value="claude">Claude</option>
                                <option value="perplexity">Perplexity</option>
                                <option value="gemini">Gemini</option>
                                <option value="bing-chat">Bing Chat</option>
                            </select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Timeframe</label>
                            <select
                                value={selectedTimeframe}
                                onChange={(e) => setSelectedTimeframe(e.target.value as '7d' | '30d' | '90d')}
                                className="px-3 py-2 border rounded-md text-sm"
                                aria-label="Filter by timeframe"
                            >
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                                <option value="90d">Last 90 days</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sentiment</label>
                            <select
                                value={selectedSentiment}
                                onChange={(e) => setSelectedSentiment(e.target.value as 'all' | 'positive' | 'neutral' | 'negative')}
                                className="px-3 py-2 border rounded-md text-sm"
                                aria-label="Filter by sentiment"
                            >
                                <option value="all">All Sentiments</option>
                                <option value="positive">Positive</option>
                                <option value="neutral">Neutral</option>
                                <option value="negative">Negative</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for different views */}
            <Tabs defaultValue="mentions" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="mentions">
                        Recent Mentions ({filteredMentions.length})
                    </TabsTrigger>
                    <TabsTrigger value="trends">
                        Trends
                    </TabsTrigger>
                    <TabsTrigger value="platforms">
                        Platforms
                    </TabsTrigger>
                    <TabsTrigger value="competitors">
                        Competitors
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="mentions" className="space-y-4">
                    {filteredMentions.length > 0 ? (
                        <div className="space-y-4">
                            {filteredMentions
                                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                .map((mention) => (
                                    <MentionCard key={mention.id} mention={mention} />
                                ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">No mentions found for the selected filters</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="trends">
                    <TrendAnalysis />
                </TabsContent>

                <TabsContent value="platforms">
                    <PlatformBreakdown />
                </TabsContent>

                <TabsContent value="competitors">
                    <CompetitorComparison />
                </TabsContent>
            </Tabs>
        </div>
    );
}