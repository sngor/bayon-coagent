'use client';

import { useState, useEffect, useActionState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { getRealEstateNewsAction } from '@/app/actions';
import { NewsArticleCard } from './news-article-card';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface NewsArticle {
    title: string;
    description: string;
    url: string;
    source: string;
    publishedAt: string;
    imageUrl?: string;
}

interface NewsFeedProps {
    location?: string;
}

export function NewsFeed({ location = '' }: NewsFeedProps) {
    const [state, formAction, isPending] = useActionState(getRealEstateNewsAction, {
        message: '',
        data: null,
        errors: {}
    });

    const [isPendingTransition, startTransition] = useTransition();
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastLocation, setLastLocation] = useState(location);

    // Load news when location changes or on mount, but debounce location changes
    useEffect(() => {
        // Only fetch if location actually changed or it's the initial load
        if (location !== lastLocation || (loading && articles.length === 0)) {
            setLastLocation(location);
            setLoading(true);

            // Debounce the API call to avoid rapid requests
            const timeoutId = setTimeout(() => {
                startTransition(() => {
                    const formData = new FormData();
                    formData.append('location', location);
                    formAction(formData);
                });
            }, 300); // 300ms debounce

            return () => clearTimeout(timeoutId);
        }
    }, [location, lastLocation, loading, articles.length, formAction, startTransition]);

    // Update articles when state changes
    useEffect(() => {
        if (state.message === 'success' && state.data) {
            setArticles(state.data.articles || []);
            setLoading(false);
        } else if (state.message && state.message !== '') {
            setLoading(false);
        }
    }, [state]);

    const handleRefresh = () => {
        setLoading(true);
        startTransition(() => {
            const formData = new FormData();
            formData.append('location', location);
            formAction(formData);
        });
    };

    if (loading || isPending || isPendingTransition) {
        return <NewsLoadingSkeleton />;
    }

    // Show warning if we have articles but there was an API error (fallback data)
    const showFallbackWarning = state.message && state.message !== 'success' && articles.length > 0;

    if (state.message && state.message !== 'success' && articles.length === 0) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Failed to load news articles. Please check your internet connection and try again.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Fallback warning */}
            {showFallbackWarning && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Showing cached news articles. Live news may be temporarily unavailable.
                    </AlertDescription>
                </Alert>
            )}

            {/* Header with refresh */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    {articles.length > 0 && (
                        <>
                            Showing {articles.length} article{articles.length !== 1 ? 's' : ''}
                            {location && ` for "${location}"`}
                            {showFallbackWarning && ' (cached)'}
                        </>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Articles */}
            {articles.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-medium">No articles found</h3>
                            <p className="text-muted-foreground">
                                {location
                                    ? `No real estate news found for "${location}". Try a different location.`
                                    : 'No real estate news articles available at the moment.'
                                }
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {articles.map((article, index) => (
                        <NewsArticleCard
                            key={`${article.url}-${index}`}
                            article={article}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function NewsLoadingSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-20" />
            </div>

            {/* Articles skeleton */}
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="flex gap-4">
                                <Skeleton className="h-20 w-32 rounded-lg flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <div className="flex gap-2 mt-3">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}