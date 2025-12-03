'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Trophy,
    TrendingUp,
    TrendingDown,
    Users,
    Crown,
    Medal,
    Award,
} from 'lucide-react';
import type { AIVisibilityScore } from '@/lib/types/common/common';
import { cn } from '@/lib/utils/common';

interface CompetitorAIComparisonProps {
    userId: string;
    userScore: AIVisibilityScore | null;
    competitorScores: Array<{
        userId: string;
        name: string;
        score: AIVisibilityScore;
    }>;
}

interface RankedAgent {
    userId: string;
    name: string;
    score: number;
    mentionCount: number;
    sentimentDistribution: {
        positive: number;
        neutral: number;
        negative: number;
    };
    rank: number;
    isCurrentUser: boolean;
    percentageDifference: number;
}

export function CompetitorAIComparison({
    userId,
    userScore,
    competitorScores,
}: CompetitorAIComparisonProps) {
    // Prepare ranked list of agents
    const rankedAgents = useMemo<RankedAgent[]>(() => {
        const allAgents: Array<{
            userId: string;
            name: string;
            score: AIVisibilityScore;
        }> = [];

        // Add user if they have a score
        if (userScore) {
            allAgents.push({
                userId,
                name: 'You',
                score: userScore,
            });
        }

        // Add competitors
        allAgents.push(...competitorScores);

        // Sort by score (highest first)
        allAgents.sort((a, b) => b.score.score - a.score.score);

        // Calculate user's score for percentage difference
        const userScoreValue = userScore?.score ?? 0;

        // Map to ranked agents with additional data
        return allAgents.map((agent, index) => ({
            userId: agent.userId,
            name: agent.name,
            score: agent.score.score,
            mentionCount: agent.score.mentionCount,
            sentimentDistribution: agent.score.sentimentDistribution,
            rank: index + 1,
            isCurrentUser: agent.userId === userId,
            percentageDifference: userScoreValue > 0
                ? ((agent.score.score - userScoreValue) / userScoreValue) * 100
                : 0,
        }));
    }, [userId, userScore, competitorScores]);

    const userRank = rankedAgents.find(agent => agent.isCurrentUser)?.rank;
    const topScore = rankedAgents[0]?.score ?? 0;

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="h-5 w-5 text-yellow-500" />;
            case 2:
                return <Medal className="h-5 w-5 text-slate-400" />;
            case 3:
                return <Award className="h-5 w-5 text-amber-600" />;
            default:
                return null;
        }
    };

    const getRankBadgeVariant = (rank: number) => {
        if (rank === 1) return 'default';
        if (rank <= 3) return 'secondary';
        return 'outline';
    };

    if (rankedAgents.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Competitor AI Comparison
                    </CardTitle>
                    <CardDescription>
                        Compare your AI visibility with competitors
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-2">
                            No competitor data available
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Add competitors to see how your AI visibility compares
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Trophy className="h-6 w-6" />
                    Competitor AI Comparison
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    See how your AI visibility ranks against competitors
                </p>
            </div>

            {/* User Position Summary */}
            {userRank && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                                    {getRankIcon(userRank) || (
                                        <span className="text-xl font-bold text-primary">
                                            #{userRank}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Your Position</div>
                                    <div className="text-2xl font-bold">
                                        {userRank === 1 ? '1st Place' : `${userRank}${getOrdinalSuffix(userRank)} Place`}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-muted-foreground">Your Score</div>
                                <div className="text-3xl font-bold">{userScore?.score ?? 0}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Ranked List */}
            <Card>
                <CardHeader>
                    <CardTitle>Rankings</CardTitle>
                    <CardDescription>
                        Agents ranked by AI visibility score
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {rankedAgents.map((agent) => {
                            const scorePercentage = topScore > 0 ? (agent.score / topScore) * 100 : 0;
                            const totalMentions = agent.mentionCount;
                            const positivePercentage = totalMentions > 0
                                ? (agent.sentimentDistribution.positive / totalMentions) * 100
                                : 0;

                            return (
                                <div
                                    key={agent.userId}
                                    className={cn(
                                        'p-4 rounded-lg border transition-all',
                                        agent.isCurrentUser
                                            ? 'bg-primary/5 border-primary/50 shadow-sm'
                                            : 'bg-muted/30 hover:bg-muted/50'
                                    )}
                                >
                                    {/* Agent Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {/* Rank Badge */}
                                            <div className="flex items-center gap-2">
                                                {getRankIcon(agent.rank)}
                                                <Badge
                                                    variant={getRankBadgeVariant(agent.rank)}
                                                    className="text-sm font-semibold"
                                                >
                                                    #{agent.rank}
                                                </Badge>
                                            </div>

                                            {/* Agent Name */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-lg truncate">
                                                        {agent.name}
                                                    </h3>
                                                    {agent.isCurrentUser && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            You
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className="text-right ml-4">
                                            <div className="text-2xl font-bold">{agent.score}</div>
                                            <div className="text-xs text-muted-foreground">score</div>
                                        </div>
                                    </div>

                                    {/* Score Progress Bar */}
                                    <div className="mb-3">
                                        <Progress value={scorePercentage} className="h-2" />
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {/* Mention Count */}
                                        <div className="text-center p-2 bg-background/50 rounded">
                                            <div className="text-lg font-semibold">
                                                {agent.mentionCount}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Mentions
                                            </div>
                                        </div>

                                        {/* Positive Sentiment */}
                                        <div className="text-center p-2 bg-background/50 rounded">
                                            <div className="text-lg font-semibold text-green-600">
                                                {agent.sentimentDistribution.positive}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Positive
                                            </div>
                                        </div>

                                        {/* Neutral Sentiment */}
                                        <div className="text-center p-2 bg-background/50 rounded">
                                            <div className="text-lg font-semibold text-slate-600">
                                                {agent.sentimentDistribution.neutral}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Neutral
                                            </div>
                                        </div>

                                        {/* Negative Sentiment */}
                                        <div className="text-center p-2 bg-background/50 rounded">
                                            <div className="text-lg font-semibold text-red-600">
                                                {agent.sentimentDistribution.negative}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Negative
                                            </div>
                                        </div>
                                    </div>

                                    {/* Percentage Difference (only show for non-current users) */}
                                    {!agent.isCurrentUser && userScore && (
                                        <div className="mt-3 pt-3 border-t">
                                            <div className="flex items-center justify-center gap-2 text-sm">
                                                {agent.percentageDifference > 0 ? (
                                                    <>
                                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                                        <span className="text-green-600 font-medium">
                                                            {agent.percentageDifference.toFixed(1)}% higher than you
                                                        </span>
                                                    </>
                                                ) : agent.percentageDifference < 0 ? (
                                                    <>
                                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                                        <span className="text-red-600 font-medium">
                                                            {Math.abs(agent.percentageDifference).toFixed(1)}% lower than you
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground font-medium">
                                                        Same score as you
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Sentiment Comparison Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Sentiment Comparison</CardTitle>
                    <CardDescription>
                        How sentiment distribution compares across agents
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {rankedAgents.map((agent) => {
                            const total = agent.mentionCount;
                            const positivePercent = total > 0
                                ? (agent.sentimentDistribution.positive / total) * 100
                                : 0;
                            const neutralPercent = total > 0
                                ? (agent.sentimentDistribution.neutral / total) * 100
                                : 0;
                            const negativePercent = total > 0
                                ? (agent.sentimentDistribution.negative / total) * 100
                                : 0;

                            return (
                                <div
                                    key={agent.userId}
                                    className={cn(
                                        'p-3 rounded-lg',
                                        agent.isCurrentUser ? 'bg-primary/5' : 'bg-muted/30'
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{agent.name}</span>
                                            {agent.isCurrentUser && (
                                                <Badge variant="secondary" className="text-xs">
                                                    You
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {total} mention{total !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="flex h-4 rounded-full overflow-hidden">
                                        {positivePercent > 0 && (
                                            <div
                                                className="bg-green-500"
                                                style={{ width: `${positivePercent}%` }}
                                                title={`${positivePercent.toFixed(1)}% positive`}
                                            />
                                        )}
                                        {neutralPercent > 0 && (
                                            <div
                                                className="bg-slate-400"
                                                style={{ width: `${neutralPercent}%` }}
                                                title={`${neutralPercent.toFixed(1)}% neutral`}
                                            />
                                        )}
                                        {negativePercent > 0 && (
                                            <div
                                                className="bg-red-500"
                                                style={{ width: `${negativePercent}%` }}
                                                title={`${negativePercent.toFixed(1)}% negative`}
                                            />
                                        )}
                                    </div>
                                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                        <span>{positivePercent.toFixed(0)}% positive</span>
                                        <span>{neutralPercent.toFixed(0)}% neutral</span>
                                        <span>{negativePercent.toFixed(0)}% negative</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Helper function to get ordinal suffix
function getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
}
