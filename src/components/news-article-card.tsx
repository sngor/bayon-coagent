'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar, Building } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NewsArticle {
    title: string;
    description: string;
    url: string;
    source: string;
    publishedAt: string;
    imageUrl?: string;
}

interface NewsArticleCardProps {
    article: NewsArticle;
}

export function NewsArticleCard({ article }: NewsArticleCardProps) {
    const publishedDate = new Date(article.publishedAt);
    const timeAgo = formatDistanceToNow(publishedDate, { addSuffix: true });

    const handleReadMore = () => {
        window.open(article.url, '_blank', 'noopener,noreferrer');
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex gap-4">
                    {/* Article Image */}
                    {article.imageUrl && (
                        <div className="flex-shrink-0">
                            <img
                                src={article.imageUrl}
                                alt={article.title}
                                className="h-20 w-32 rounded-lg object-cover"
                                onError={(e) => {
                                    // Hide image if it fails to load
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    {/* Article Content */}
                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h3 className="font-semibold text-lg leading-tight mb-2 line-clamp-2">
                            {article.title}
                        </h3>

                        {/* Description */}
                        {article.description && (
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                {article.description}
                            </p>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span>{article.source}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{timeAgo}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                                Real Estate News
                            </Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleReadMore}
                                className="flex items-center gap-2"
                            >
                                Read More
                                <ExternalLink className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}