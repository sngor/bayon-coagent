'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, Bookmark, BookmarkCheck } from 'lucide-react';
import { cn } from '@/lib/utils/common';
import type { SavedKeyword } from '@/lib/types/common';

interface KeywordSuggestionPanelProps {
    keywords: SavedKeyword[];
    savedKeywordIds?: Set<string>;
    onSave?: (keyword: SavedKeyword) => void;
    isSaving?: boolean;
    className?: string;
}

/**
 * KeywordSuggestionPanel Component
 * 
 * Displays keyword suggestions with metrics (search volume, competition)
 * and allows saving keywords to saved list.
 * 
 * Requirements: 6.3, 6.4
 */
export function KeywordSuggestionPanel({
    keywords,
    savedKeywordIds = new Set(),
    onSave,
    isSaving = false,
    className = '',
}: KeywordSuggestionPanelProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [savingKeywordId, setSavingKeywordId] = useState<string | null>(null);

    const handleSave = async (keyword: SavedKeyword) => {
        if (!onSave) return;

        setSavingKeywordId(keyword.id);
        try {
            await onSave(keyword);
        } finally {
            setSavingKeywordId(null);
        }
    };

    const getCompetitionColor = (competition: SavedKeyword['competition']) => {
        switch (competition) {
            case 'low':
                return 'text-green-600 bg-green-50 dark:bg-green-950/20';
            case 'medium':
                return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
            case 'high':
                return 'text-red-600 bg-red-50 dark:bg-red-950/20';
        }
    };

    const getCompetitionBadgeVariant = (competition: SavedKeyword['competition']): 'default' | 'secondary' | 'destructive' => {
        switch (competition) {
            case 'low':
                return 'default';
            case 'medium':
                return 'secondary';
            case 'high':
                return 'destructive';
        }
    };

    // Filter keywords based on search term
    const filteredKeywords = keywords.filter(keyword =>
        keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
        keyword.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort keywords: low competition first, then by search volume
    const sortedKeywords = [...filteredKeywords].sort((a, b) => {
        const competitionOrder = { low: 0, medium: 1, high: 2 };
        const compDiff = competitionOrder[a.competition] - competitionOrder[b.competition];
        if (compDiff !== 0) return compDiff;
        return b.searchVolume - a.searchVolume;
    });

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Keyword Suggestions</CardTitle>
                <CardDescription>
                    {keywords.length} keyword{keywords.length !== 1 ? 's' : ''} based on your location and market
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search keywords..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Keywords List */}
                {sortedKeywords.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        {searchTerm ? (
                            <p>No keywords match your search</p>
                        ) : (
                            <p>No keyword suggestions available</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sortedKeywords.map((keyword) => {
                            const isSaved = savedKeywordIds.has(keyword.id);
                            const isCurrentlySaving = savingKeywordId === keyword.id;

                            return (
                                <div
                                    key={keyword.id}
                                    className={cn(
                                        'p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors',
                                        isSaved && 'border-primary/50 bg-primary/5'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 space-y-2">
                                            {/* Keyword Text */}
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{keyword.keyword}</h4>
                                                {isSaved && (
                                                    <BookmarkCheck className="h-4 w-4 text-primary" />
                                                )}
                                            </div>

                                            {/* Location */}
                                            <div className="text-sm text-muted-foreground">
                                                📍 {keyword.location}
                                            </div>

                                            {/* Metrics */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                {/* Search Volume */}
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span className="text-muted-foreground">Volume:</span>
                                                    <span className="font-medium">
                                                        {keyword.searchVolume.toLocaleString()}/mo
                                                    </span>
                                                </div>

                                                {/* Competition */}
                                                <Badge
                                                    variant={getCompetitionBadgeVariant(keyword.competition)}
                                                    className="text-xs"
                                                >
                                                    {keyword.competition} competition
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Save Button */}
                                        {onSave && !isSaved && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleSave(keyword)}
                                                disabled={isSaving || isCurrentlySaving}
                                                className="shrink-0"
                                            >
                                                <Bookmark className="h-4 w-4 mr-1" />
                                                {isCurrentlySaving ? 'Saving...' : 'Save'}
                                            </Button>
                                        )}

                                        {isSaved && (
                                            <Badge variant="outline" className="shrink-0">
                                                Saved
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Summary Stats */}
                {sortedKeywords.length > 0 && (
                    <div className="pt-4 border-t">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-green-600">
                                    {sortedKeywords.filter(k => k.competition === 'low').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Low Competition</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {sortedKeywords.filter(k => k.competition === 'medium').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Medium Competition</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-red-600">
                                    {sortedKeywords.filter(k => k.competition === 'high').length}
                                </div>
                                <div className="text-xs text-muted-foreground">High Competition</div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
