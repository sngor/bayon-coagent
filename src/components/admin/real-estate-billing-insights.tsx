/**
 * Real Estate Billing Insights Component
 * 
 * Provides real estate-specific billing analytics and recommendations
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    TrendingUp,
    Calendar,
    Users,
    Target,
    Lightbulb,
    Home,
    DollarSign
} from 'lucide-react';

interface SeasonalInsight {
    currentSeason: string;
    seasonalTrends: Array<{
        season: string;
        months: string[];
        expectedGrowth: number;
        description: string;
    }>;
    recommendations: string[];
}

interface RealEstateBillingInsightsProps {
    className?: string;
}

export function RealEstateBillingInsights({ className }: RealEstateBillingInsightsProps) {
    const [insights, setInsights] = useState<SeasonalInsight | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data - replace with actual API call
        const mockInsights: SeasonalInsight = {
            currentSeason: 'Winter Planning',
            seasonalTrends: [
                {
                    season: 'Spring Buying Season',
                    months: ['March', 'April', 'May'],
                    expectedGrowth: 25,
                    description: 'Peak home buying activity drives agent subscriptions'
                },
                {
                    season: 'Summer Peak',
                    months: ['June', 'July', 'August'],
                    expectedGrowth: 15,
                    description: 'Maximum listing activity and content creation needs'
                },
                {
                    season: 'Fall Market',
                    months: ['September', 'October', 'November'],
                    expectedGrowth: 10,
                    description: 'Opportunity capture and year-end planning'
                },
                {
                    season: 'Winter Planning',
                    months: ['December', 'January', 'February'],
                    expectedGrowth: -5,
                    description: 'Strategic planning and preparation for spring'
                }
            ],
            recommendations: [
                'Launch spring promotion campaigns in February',
                'Focus on content creation tools during summer peak',
                'Emphasize market analysis features in fall',
                'Promote annual plans during winter planning season'
            ]
        };

        setTimeout(() => {
            setInsights(mockInsights);
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        Real Estate Market Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!insights) return null;

    const getCurrentSeasonTrend = () => {
        return insights.seasonalTrends.find(trend => trend.season === insights.currentSeason);
    };

    const currentTrend = getCurrentSeasonTrend();

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Current Season Alert */}
            <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                    <strong>Current Season: {insights.currentSeason}</strong>
                    {currentTrend && (
                        <span className="block mt-1 text-sm">
                            {currentTrend.description}
                            <Badge
                                variant={currentTrend.expectedGrowth > 0 ? "default" : "secondary"}
                                className="ml-2"
                            >
                                {currentTrend.expectedGrowth > 0 ? '+' : ''}{currentTrend.expectedGrowth}% expected
                            </Badge>
                        </span>
                    )}
                </AlertDescription>
            </Alert>

            {/* Seasonal Trends */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Real Estate Seasonal Trends
                    </CardTitle>
                    <CardDescription>
                        Billing patterns aligned with real estate market cycles
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {insights.seasonalTrends.map((trend, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border ${trend.season === insights.currentSeason
                                        ? 'border-primary bg-primary/5'
                                        : 'border-muted'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold">{trend.season}</h4>
                                    <Badge
                                        variant={trend.expectedGrowth > 0 ? "default" : "secondary"}
                                    >
                                        {trend.expectedGrowth > 0 ? '+' : ''}{trend.expectedGrowth}%
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {trend.description}
                                </p>
                                <div className="text-xs text-muted-foreground">
                                    {trend.months.join(', ')}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Strategic Recommendations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        Strategic Recommendations
                    </CardTitle>
                    <CardDescription>
                        Actionable insights for optimizing agent acquisition and retention
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {insights.recommendations.map((recommendation, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <Target className="h-4 w-4 mt-0.5 text-primary" />
                                <span className="text-sm">{recommendation}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Agent Segment Insights */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Agent Segment Opportunities
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center p-4 border rounded-lg">
                            <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                            <h4 className="font-semibold">Solo Agents</h4>
                            <p className="text-sm text-muted-foreground">
                                Focus on content creation and lead generation tools
                            </p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                            <h4 className="font-semibold">Top Producers</h4>
                            <p className="text-sm text-muted-foreground">
                                Emphasize advanced analytics and market insights
                            </p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                            <h4 className="font-semibold">Team Leaders</h4>
                            <p className="text-sm text-muted-foreground">
                                Highlight collaboration and team management features
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}