'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, TrendingUp, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
    PostingTimeRecommendation,
    ContentTypeRecommendation,
    ContentIdea,
} from '@/lib/ai-content-suggestions';

interface AIContentSuggestionsProps {
    userId: string;
    marketFocus?: string[];
    onSelectContentType?: (contentType: string) => void;
    onSelectIdea?: (idea: ContentIdea) => void;
}

/**
 * AI Content Suggestions Component
 * 
 * Displays AI-powered recommendations for:
 * - Optimal posting times
 * - Content types to create
 * - Specific content ideas
 */
export function AIContentSuggestions({
    userId,
    marketFocus,
    onSelectContentType,
    onSelectIdea,
}: AIContentSuggestionsProps) {
    const [loading, setLoading] = useState(true);
    const [postingTimes, setPostingTimes] = useState<PostingTimeRecommendation[]>([]);
    const [contentTypes, setContentTypes] = useState<ContentTypeRecommendation[]>([]);
    const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadSuggestions() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch('/api/content-suggestions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, marketFocus }),
                });

                if (!response.ok) {
                    throw new Error('Failed to load suggestions');
                }

                const data = await response.json();
                setPostingTimes(data.postingTimes || []);
                setContentTypes(data.contentTypes || []);
                setContentIdeas(data.contentIdeas || []);
            } catch (err) {
                console.error('Failed to load AI suggestions:', err);
                setError('Unable to load AI suggestions. Please try again later.');
            } finally {
                setLoading(false);
            }
        }

        if (userId) {
            loadSuggestions();
        }
    }, [userId, marketFocus]);

    if (loading) {
        return (
            <Card className="border-2 border-primary/20">
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground">Loading AI suggestions...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-2 border-destructive/20">
                <CardContent className="py-8 text-center">
                    <p className="text-sm text-destructive">{error}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* AI Suggestions Header */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-600/5">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white animate-pulse" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-headline">AI Content Suggestions</CardTitle>
                            <CardDescription>
                                Personalized recommendations to optimize your content strategy
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Optimal Posting Times */}
            {postingTimes.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">Optimal Posting Times</CardTitle>
                        </div>
                        <CardDescription>
                            Best times to publish content for maximum engagement
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {postingTimes.map((time, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow duration-200"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-semibold">{time.dayOfWeek}</p>
                                            <p className="text-sm text-muted-foreground">{time.timeOfDay}</p>
                                        </div>
                                        <Badge
                                            variant={
                                                time.confidence === 'high'
                                                    ? 'default'
                                                    : time.confidence === 'medium'
                                                        ? 'secondary'
                                                        : 'outline'
                                            }
                                            className="text-xs"
                                        >
                                            {time.confidence}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">{time.reason}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recommended Content Types */}
            {contentTypes.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">Recommended Content Types</CardTitle>
                        </div>
                        <CardDescription>
                            Content types that will perform well based on your history
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {contentTypes.map((type, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        'p-4 rounded-lg border bg-card hover:shadow-lg transition-shadow duration-200 group cursor-pointer',
                                        type.priority === 'high' && 'border-primary/50'
                                    )}
                                    onClick={() => onSelectContentType?.(type.type)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-headline font-semibold group-hover:text-primary transition-colors">
                                                    {type.title}
                                                </h4>
                                                <Badge
                                                    variant={
                                                        type.priority === 'high'
                                                            ? 'default'
                                                            : type.priority === 'medium'
                                                                ? 'secondary'
                                                                : 'outline'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {type.priority}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {type.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground italic">
                                                {type.reason}
                                            </p>
                                            {type.estimatedTime && (
                                                <p className="text-xs text-primary mt-2">
                                                    ⏱️ {type.estimatedTime}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Content Ideas */}
            {contentIdeas.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">Fresh Content Ideas</CardTitle>
                        </div>
                        <CardDescription>
                            AI-generated ideas tailored to your market and audience
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {contentIdeas.map((idea, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg border bg-card hover:shadow-lg transition-shadow duration-200 group cursor-pointer"
                                    onClick={() => onSelectIdea?.(idea)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-headline font-semibold group-hover:text-primary transition-colors">
                                                    {idea.title}
                                                </h4>
                                                <Badge variant="outline" className="text-xs">
                                                    {idea.contentType}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                {idea.description}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {idea.keywords.map((keyword, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                                                    >
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Target: {idea.targetAudience}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
