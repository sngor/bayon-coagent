'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Newspaper,
    Search,
    Filter,
    ExternalLink,
    Clock,
    MapPin,
    TrendingUp,
    RefreshCw,
    Bookmark,
    Share2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth/use-user';

interface NewsArticle {
    id: string;
    title: string;
    summary: string;
    source: string;
    publishedAt: string;
    url: string;
    category: 'market' | 'policy' | 'rates' | 'local' | 'national';
    location?: string;
    relevanceScore: number;
    isBookmarked?: boolean;
}

const mockNews: NewsArticle[] = [
    {
        id: '1',
        title: 'Seattle Home Prices Rise 8.5% Year-Over-Year Despite Market Cooling',
        summary: 'Despite a cooling market nationwide, Seattle continues to see strong price growth driven by tech industry demand and limited inventory.',
        source: 'Seattle Times',
        publishedAt: '2024-01-15T10:30:00Z',
        url: 'https://example.com/news/1',
        category: 'local',
        location: 'Seattle, WA',
        relevanceScore: 95
    },
    {
        id: '2',
        title: 'Federal Reserve Signals Potential Rate Cuts in 2024',
        summary: 'The Federal Reserve hints at possible interest rate reductions later this year, which could boost homebuying activity.',
        source: 'Wall Street Journal',
        publishedAt: '2024-01-15T08:15:00Z',
        url: 'https://example.com/news/2',
        category: 'rates',
        relevanceScore: 88
    },
    {
        id: '3',
        title: 'New Housing Development Approved for Bellevue Eastside',
        summary: 'City council approves 500-unit mixed-use development that could help address housing shortage in the region.',
        source: 'Bellevue Reporter',
        publishedAt: '2024-01-14T16:45:00Z',
        url: 'https://example.com/news/3',
        category: 'local',
        location: 'Bellevue, WA',
        relevanceScore: 82
    },
    {
        id: '4',
        title: 'First-Time Homebuyer Programs Expanded Statewide',
        summary: 'Washington State announces expanded down payment assistance programs to help first-time buyers enter the market.',
        source: 'Washington State Housing Finance Commission',
        publishedAt: '2024-01-14T14:20:00Z',
        url: 'https://example.com/news/4',
        category: 'policy',
        location: 'Washington State',
        relevanceScore: 78
    },
    {
        id: '5',
        title: 'National Housing Market Shows Signs of Stabilization',
        summary: 'After months of volatility, national housing market indicators suggest a return to more balanced conditions.',
        source: 'National Association of Realtors',
        publishedAt: '2024-01-14T12:00:00Z',
        url: 'https://example.com/news/5',
        category: 'national',
        relevanceScore: 75
    }
];

export default function MarketNewsPage() {
    const { user } = useUser();
    const [news, setNews] = useState<NewsArticle[]>(mockNews);
    const [filteredNews, setFilteredNews] = useState<NewsArticle[]>(mockNews);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedLocation, setSelectedLocation] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        filterNews();
    }, [searchQuery, selectedCategory, selectedLocation, news]);

    const filterNews = () => {
        let filtered = news;

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(article =>
                article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                article.summary.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(article => article.category === selectedCategory);
        }

        // Filter by location
        if (selectedLocation !== 'all') {
            filtered = filtered.filter(article =>
                article.location?.toLowerCase().includes(selectedLocation.toLowerCase())
            );
        }

        // Sort by relevance score and date
        filtered.sort((a, b) => {
            const scoreA = a.relevanceScore;
            const scoreB = b.relevanceScore;
            if (scoreA !== scoreB) return scoreB - scoreA;
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });

        setFilteredNews(filtered);
    };

    const refreshNews = async () => {
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            toast({
                title: 'News Updated',
                description: 'Latest real estate news has been fetched.',
            });
        } catch (error) {
            toast({
                title: 'Refresh Failed',
                description: 'Unable to fetch latest news. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleBookmark = (articleId: string) => {
        setNews(prev => prev.map(article =>
            article.id === articleId
                ? { ...article, isBookmarked: !article.isBookmarked }
                : article
        ));

        const article = news.find(a => a.id === articleId);
        toast({
            title: article?.isBookmarked ? 'Bookmark Removed' : 'Article Bookmarked',
            description: article?.isBookmarked
                ? 'Article removed from your bookmarks.'
                : 'Article saved to your bookmarks.',
        });
    };

    const shareArticle = (article: NewsArticle) => {
        navigator.clipboard.writeText(article.url);
        toast({
            title: 'Link Copied',
            description: 'Article link copied to clipboard.',
        });
    };

    const getCategoryColor = (category: NewsArticle['category']) => {
        switch (category) {
            case 'market':
                return 'bg-blue-100 text-blue-800';
            case 'policy':
                return 'bg-purple-100 text-purple-800';
            case 'rates':
                return 'bg-green-100 text-green-800';
            case 'local':
                return 'bg-orange-100 text-orange-800';
            case 'national':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getCategoryLabel = (category: NewsArticle['category']) => {
        switch (category) {
            case 'market':
                return 'Market Analysis';
            case 'policy':
                return 'Policy & Regulation';
            case 'rates':
                return 'Interest Rates';
            case 'local':
                return 'Local News';
            case 'national':
                return 'National News';
            default:
                return category;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Market News</h1>
                    <p className="text-muted-foreground">
                        Stay updated with the latest real estate news and market trends
                    </p>
                </div>
                <Button onClick={refreshNews} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh News
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search news..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="market">Market Analysis</SelectItem>
                                    <SelectItem value="policy">Policy & Regulation</SelectItem>
                                    <SelectItem value="rates">Interest Rates</SelectItem>
                                    <SelectItem value="local">Local News</SelectItem>
                                    <SelectItem value="national">National News</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Location</label>
                            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All locations" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    <SelectItem value="seattle">Seattle</SelectItem>
                                    <SelectItem value="bellevue">Bellevue</SelectItem>
                                    <SelectItem value="tacoma">Tacoma</SelectItem>
                                    <SelectItem value="washington">Washington State</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                    setSelectedLocation('all');
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* News Articles */}
            <div className="space-y-4">
                {filteredNews.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No News Found</h3>
                            <p className="text-muted-foreground text-center">
                                No articles match your current filters. Try adjusting your search criteria.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredNews.map((article) => (
                        <Card key={article.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge className={getCategoryColor(article.category)}>
                                                {getCategoryLabel(article.category)}
                                            </Badge>
                                            {article.location && (
                                                <Badge variant="outline" className="text-xs">
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    {article.location}
                                                </Badge>
                                            )}
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <TrendingUp className="h-3 w-3" />
                                                {article.relevanceScore}% relevant
                                            </div>
                                        </div>
                                        <CardTitle className="text-xl leading-tight hover:text-primary cursor-pointer">
                                            <a href={article.url} target="_blank" rel="noopener noreferrer">
                                                {article.title}
                                            </a>
                                        </CardTitle>
                                        <CardDescription className="mt-2 text-base">
                                            {article.summary}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="font-medium">{article.source}</span>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(article.publishedAt)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleBookmark(article.id)}
                                            className={article.isBookmarked ? 'text-yellow-600' : ''}
                                        >
                                            <Bookmark className={`h-4 w-4 ${article.isBookmarked ? 'fill-current' : ''}`} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => shareArticle(article)}
                                        >
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={article.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Read Full Article
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Load More */}
            {filteredNews.length > 0 && (
                <div className="text-center">
                    <Button variant="outline" onClick={refreshNews}>
                        Load More Articles
                    </Button>
                </div>
            )}
        </div>
    );
}