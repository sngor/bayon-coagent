import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AEOScore } from '@/lib/types/aeo-types';

/**
 * AEOScoreCard - Server Component
 * 
 * Converted from Client Component - no client-side interactivity needed.
 * Pure presentational component that displays AEO score data.
 */
interface AEOScoreCardProps {
    score: AEOScore;
}

export function AEOScoreCard({ score }: AEOScoreCardProps) {
    const getScoreColor = (value: number) => {
        if (value >= 80) return 'text-green-600';
        if (value >= 60) return 'text-blue-600';
        if (value >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreLabel = (value: number) => {
        if (value >= 80) return 'Excellent';
        if (value >= 60) return 'Good';
        if (value >= 40) return 'Fair';
        return 'Needs Work';
    };

    const getTrendIcon = () => {
        if (score.trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
        if (score.trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
        return <Minus className="h-4 w-4 text-gray-400" />;
    };

    const getTrendBadge = () => {
        if (score.trend === 'up') return <Badge variant="default" className="bg-green-100 text-green-800">Improving</Badge>;
        if (score.trend === 'down') return <Badge variant="destructive">Declining</Badge>;
        return <Badge variant="secondary">Stable</Badge>;
    };

    const breakdown = [
        { label: 'Schema Markup', value: score.breakdown.schemaMarkup, max: 20 },
        { label: 'Google Business Profile', value: score.breakdown.googleBusinessProfile, max: 20 },
        { label: 'Reviews & Ratings', value: score.breakdown.reviewsAndRatings, max: 15 },
        { label: 'Social Media', value: score.breakdown.socialMediaPresence, max: 10 },
        { label: 'Content Freshness', value: score.breakdown.contentFreshness, max: 10 },
        { label: 'NAP Consistency', value: score.breakdown.napConsistency, max: 10 },
        { label: 'Backlink Quality', value: score.breakdown.backlinkQuality, max: 10 },
        { label: 'FAQ Content', value: score.breakdown.faqContent, max: 5 },
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>AI Visibility Score</CardTitle>
                        <CardDescription>
                            How discoverable you are in AI search engines
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {getTrendIcon()}
                        {getTrendBadge()}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Overall Score */}
                <div className="text-center">
                    <div className={`text-6xl font-bold ${getScoreColor(score.score)}`}>
                        {score.score}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                        out of 100 • {getScoreLabel(score.score)}
                    </div>
                    {score.previousScore !== undefined && (
                        <div className="text-xs text-muted-foreground mt-2">
                            Previous: {score.previousScore} ({score.score > score.previousScore ? '+' : ''}
                            {score.score - score.previousScore})
                        </div>
                    )}
                </div>

                {/* Score Breakdown */}
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Score Breakdown</h4>
                    {breakdown.map((item) => (
                        <div key={item.label} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{item.label}</span>
                                <span className="font-medium">
                                    {item.value}/{item.max}
                                </span>
                            </div>
                            <Progress value={(item.value / item.max) * 100} className="h-2" />
                        </div>
                    ))}
                </div>

                {/* Last Updated */}
                <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                    Last analyzed: {new Date(score.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
