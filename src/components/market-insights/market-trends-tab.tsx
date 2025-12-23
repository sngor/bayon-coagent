/**
 * Market Trends Tab Component
 * 
 * Displays market trend analysis cards
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Share2 } from 'lucide-react';
import { getTrendIcon, getTrendColor } from '@/lib/utils/market-insights-utils';
import type { MarketTrend } from '@/lib/types/market-insights';

interface MarketTrendsTabProps {
    trends: MarketTrend[];
}

export function MarketTrendsTab({ trends }: MarketTrendsTabProps) {
    return (
        <div className="grid gap-6">
            {trends.map((trend) => {
                const TrendIcon = getTrendIcon(trend.trend);
                const trendColor = getTrendColor(trend.trend);
                
                return (
                    <Card key={trend.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <TrendIcon className="h-4 w-4 text-current" style={{ color: trendColor.replace('text-', '') }} />
                                    <div>
                                        <CardTitle className="text-lg">{trend.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-1">
                                            <MapPin className="h-3 w-3" />
                                            {trend.location}
                                            <span>•</span>
                                            {trend.timeframe}
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-bold ${trendColor}`}>
                                        {trend.trend === 'up' ? '+' : ''}{trend.percentage}%
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {trend.confidence}% confidence
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">{trend.description}</p>
                            <div className="flex items-center gap-4">
                                <Badge variant="outline" className="capitalize">
                                    {trend.category}
                                </Badge>
                                <Button variant="ghost" size="sm">
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share Insight
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}