'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    AnimatedTabs as Tabs,
    AnimatedTabsContent as TabsContent,
    AnimatedTabsList as TabsList,
    AnimatedTabsTrigger as TabsTrigger,
} from '@/components/ui/animated-tabs';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Home,
    Calendar,
    MapPin,
    Sparkles,
    RefreshCw,
    Filter,
    Download,
    Share2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';

import { MarketInsightsFilters } from '@/components/market-insights/market-insights-filters';
import { MarketTrendsTab } from '@/components/market-insights/market-trends-tab';
import { LifeEventsTab } from '@/components/market-insights/life-events-tab';
import { MarketStatsCards } from '@/components/market-insights/market-stats-cards';
import { useMarketInsights } from '@/hooks/use-market-insights';
import type { MarketInsightsFilters as FiltersType, MarketInsightsTab } from '@/lib/types/market-insights';

export default function ResearchInsightsPage() {
    const { trends, lifeEvents, isLoading, refreshData, exportData, analyzeMarket } = useMarketInsights();
    const [filters, setFilters] = useState<FiltersType>({
        location: 'Seattle, WA',
        timeframe: '3months'
    });
    const [activeTab, setActiveTab] = useState<MarketInsightsTab>('trends');

    const handleAnalyze = async () => {
        await analyzeMarket(filters);
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value as MarketInsightsTab);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Market Insights</h1>
                    <p className="text-muted-foreground">
                        Track market trends and life event predictions to identify opportunities
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={exportData}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="outline" onClick={refreshData} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <MarketInsightsFilters
                filters={filters}
                onFiltersChange={setFilters}
                onAnalyze={handleAnalyze}
            />

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="trends">Market Trends</TabsTrigger>
                    <TabsTrigger value="life-events">Life Event Predictions</TabsTrigger>
                </TabsList>

                <TabsContent value="trends" className="space-y-6">
                    <MarketTrendsTab trends={trends} />
                </TabsContent>

                <TabsContent value="life-events" className="space-y-6">
                    <LifeEventsTab lifeEvents={lifeEvents} />
                </TabsContent>
            </Tabs>

            {/* Quick Stats */}
            <MarketStatsCards />
        </div>
    );
}