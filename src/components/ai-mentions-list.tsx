'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    ChevronDown,
    ChevronUp,
    MessageSquare,
    Calendar,
    Filter,
    X,
} from 'lucide-react';
import type { AIMention } from '@/lib/types/common/common';
import { cn } from '@/lib/utils/common';

interface AIMentionsListProps {
    userId: string;
    mentions: AIMention[];
    limit?: number;
}

const PLATFORM_COLORS = {
    chatgpt: 'bg-[#10a37f] text-white',
    perplexity: 'bg-[#6366f1] text-white',
    claude: 'bg-[#8b5cf6] text-white',
    gemini: 'bg-[#3b82f6] text-white',
};

const SENTIMENT_VARIANTS = {
    positive: 'default' as const,
    neutral: 'secondary' as const,
    negative: 'destructive' as const,
};

const ITEMS_PER_PAGE = 10;

export function AIMentionsList({ userId, mentions, limit }: AIMentionsListProps) {
    const [expandedMentions, setExpandedMentions] = useState<Set<string>>(new Set());
    const [platformFilter, setPlatformFilter] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // Filter mentions based on platform and date range
    const filteredMentions = useMemo(() => {
        let filtered = [...mentions];

        // Platform filter
        if (platformFilter !== 'all') {
            filtered = filtered.filter(mention => mention.platform === platformFilter);
        }

        // Date range filter
        if (startDate) {
            filtered = filtered.filter(mention => {
                const mentionDate = new Date(mention.timestamp);
                return mentionDate >= new Date(startDate);
            });
        }

        if (endDate) {
            filtered = filtered.filter(mention => {
                const mentionDate = new Date(mention.timestamp);
                return mentionDate <= new Date(endDate);
            });
        }

        // Sort by timestamp (most recent first)
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return filtered;
    }, [mentions, platformFilter, startDate, endDate]);

    // Pagination
    const totalPages = Math.ceil(filteredMentions.length / ITEMS_PER_PAGE);
    const paginatedMentions = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredMentions.slice(start, end);
    }, [filteredMentions, currentPage]);

    // Reset to page 1 when filters change
    const handleFilterChange = () => {
        setCurrentPage(1);
    };

    const toggleMention = (mentionId: string) => {
        setExpandedMentions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(mentionId)) {
                newSet.delete(mentionId);
            } else {
                newSet.add(mentionId);
            }
            return newSet;
        });
    };

    const clearFilters = () => {
        setPlatformFilter('all');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const hasActiveFilters = platformFilter !== 'all' || startDate || endDate;

    // Highlight agent name in text
    const highlightAgentName = (text: string, agentName?: string) => {
        if (!agentName) return text;

        const parts = text.split(new RegExp(`(${agentName})`, 'gi'));
        return parts.map((part, index) => {
            if (part.toLowerCase() === agentName.toLowerCase()) {
                return (
                    <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/50 font-semibold">
                        {part}
                    </mark>
                );
            }
            return part;
        });
    };

    // Extract agent name from first mention (simplified - in production, this would come from user profile)
    const agentName = mentions.length > 0 ? extractAgentNameFromSnippet(mentions[0].snippet) : '';

    if (mentions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        AI Mentions
                    </CardTitle>
                    <CardDescription>
                        Recent mentions of you in AI search results
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-2">
                            No mentions found yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Start monitoring to see how AI platforms mention you
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            AI Mentions
                        </CardTitle>
                        <CardDescription>
                            {filteredMentions.length} mention{filteredMentions.length !== 1 ? 's' : ''} found
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                    </Button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Platform Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="platform-filter">Platform</Label>
                                <Select
                                    value={platformFilter}
                                    onValueChange={(value) => {
                                        setPlatformFilter(value);
                                        handleFilterChange();
                                    }}
                                >
                                    <SelectTrigger id="platform-filter">
                                        <SelectValue placeholder="All platforms" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All platforms</SelectItem>
                                        <SelectItem value="chatgpt">ChatGPT</SelectItem>
                                        <SelectItem value="perplexity">Perplexity</SelectItem>
                                        <SelectItem value="claude">Claude</SelectItem>
                                        <SelectItem value="gemini">Gemini</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Start Date Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="start-date">Start Date</Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        handleFilterChange();
                                    }}
                                />
                            </div>

                            {/* End Date Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="end-date">End Date</Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        handleFilterChange();
                                    }}
                                />
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <div className="flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                >
                                    <X className="h-4 w-4" />
                                    Clear filters
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardHeader>

            <CardContent>
                {filteredMentions.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">
                            No mentions match your filters
                        </p>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={clearFilters}
                            className="mt-2"
                        >
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Mentions List */}
                        <div className="space-y-4">
                            {paginatedMentions.map((mention) => {
                                const isExpanded = expandedMentions.has(mention.id);

                                return (
                                    <Collapsible
                                        key={mention.id}
                                        open={isExpanded}
                                        onOpenChange={() => toggleMention(mention.id)}
                                    >
                                        <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                            {/* Mention Header */}
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <Badge
                                                            className={cn(
                                                                'text-xs',
                                                                PLATFORM_COLORS[mention.platform]
                                                            )}
                                                        >
                                                            {mention.platform}
                                                        </Badge>
                                                        <Badge
                                                            variant={SENTIMENT_VARIANTS[mention.sentiment]}
                                                            className="text-xs"
                                                        >
                                                            {mention.sentiment}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {mention.prominence} prominence
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                                        Query: {mention.query}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(mention.timestamp).toLocaleDateString()}
                                                </div>
                                            </div>

                                            {/* Snippet Preview */}
                                            <div className="mb-3">
                                                <p className="text-sm text-foreground line-clamp-2">
                                                    {highlightAgentName(mention.snippet, agentName)}
                                                </p>
                                            </div>

                                            {/* Expand/Collapse Button */}
                                            <CollapsibleTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-center"
                                                >
                                                    {isExpanded ? (
                                                        <>
                                                            <ChevronUp className="h-4 w-4" />
                                                            Show less
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="h-4 w-4" />
                                                            Show full response
                                                        </>
                                                    )}
                                                </Button>
                                            </CollapsibleTrigger>

                                            {/* Expanded Content - Lazy loaded */}
                                            <CollapsibleContent className="mt-4 space-y-4">
                                                {isExpanded && (
                                                    <>
                                                        <div className="border-t pt-4">
                                                            <h4 className="text-sm font-semibold mb-2">Full Response</h4>
                                                            <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md max-h-96 overflow-y-auto">
                                                                {highlightAgentName(mention.response, agentName)}
                                                            </div>
                                                        </div>

                                                        {mention.sentimentReason && (
                                                            <div>
                                                                <h4 className="text-sm font-semibold mb-2">Sentiment Analysis</h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {mention.sentimentReason}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {mention.topics.length > 0 && (
                                                            <div>
                                                                <h4 className="text-sm font-semibold mb-2">Topics</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {mention.topics.map((topic, index) => (
                                                                        <Badge key={index} variant="outline" className="text-xs">
                                                                            {topic}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {mention.expertiseAreas.length > 0 && (
                                                            <div>
                                                                <h4 className="text-sm font-semibold mb-2">Expertise Areas</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {mention.expertiseAreas.map((area, index) => (
                                                                        <Badge key={index} variant="secondary" className="text-xs">
                                                                            {area}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </CollapsibleContent>
                                        </div>
                                    </Collapsible>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// Helper function to extract agent name from snippet (simplified)
// In production, this would come from the user's profile
function extractAgentNameFromSnippet(snippet: string): string {
    // This is a simplified implementation
    // In production, you would get the agent name from the user profile
    const match = snippet.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/);
    return match ? match[0] : '';
}
