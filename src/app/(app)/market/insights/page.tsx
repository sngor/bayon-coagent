'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    ContentSection,
    EmptySection,
    FeatureBanner
} from '@/components/ui';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { StandardEmptyState } from '@/components/standard';
import { LifeEventPredictorForm } from '@/components/life-event-predictor/life-event-predictor-form';
import { AlertsContent } from '@/components/alerts/alerts-content';
import { NewsFeed } from '@/components/news-feed';
import { NewsFilters } from '@/components/news-filters';
import { NewsServiceMonitor } from '@/components/news-service-monitor';
import { TrendingUp, BarChart3, Bell, Newspaper } from 'lucide-react';
import { useUnreadAlertCount } from '@/hooks/use-unread-alert-count';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NEWS_CONFIG } from '@/lib/news-config';

export default function MarketInsightsPage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('trends');
    const [newsLocation, setNewsLocation] = useState('');
    const { unreadCount } = useUnreadAlertCount();

    // Check URL parameters to set initial tab
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['trends', 'analytics', 'alerts', 'news'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // Prefetch news on page load to improve performance
    useEffect(() => {
        const prefetchNews = async () => {
            try {
                const { newsService } = await import('@/services/news-service');
                await newsService.prefetchCommonLocations();
            } catch (error) {
                console.warn('News prefetch failed:', error);
            }
        };

        // Prefetch after a short delay to not block initial render
        const timeoutId = setTimeout(prefetchNews, NEWS_CONFIG.PREFETCH_DELAY_MS);
        return () => clearTimeout(timeoutId);
    }, []);

    return (
        <div className="space-y-6">
            {/* Feature Banner with Market Intelligence Tips */}
            <FeatureBanner
                title="🎯 Market Intelligence Pro Tips"
                description="Maximize your market advantage with these data-driven strategies"
                variant="onboarding"
                dismissible={true}
                tips={[
                    "Use Trends to identify life events and target potential clients proactively",
                    "Monitor News for market shifts that create opportunities for your listings",
                    "Set up Alerts for price changes and new listings in your target areas",
                    "Analytics help you understand seasonal patterns and pricing strategies"
                ]}
                actions={
                    <Button variant="outline" size="sm">
                        Quick Tour
                    </Button>
                }
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="trends" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Trends
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                    <TabsTrigger value="news" className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4" />
                        News
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Alerts
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                                {unreadCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>



                <TabsContent value="trends" className="mt-6">
                    <ContentSection
                        title="Market Trends & Predictions"
                        description="Identify potential clients through life event predictions and market trends"
                        icon={TrendingUp}
                        variant="default"
                    >
                        <LifeEventPredictorForm />
                    </ContentSection>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                    <EmptySection
                        title="Market Analytics Coming Soon"
                        description="Track market metrics, neighborhood data, pricing trends, and more. This feature is currently in development."
                        icon={BarChart3}
                        variant="card"
                    />
                </TabsContent>

                <TabsContent value="news" className="mt-6">
                    <div className="space-y-6">
                        {/* News Filters */}
                        <ContentSection
                            title="Real Estate News Feed"
                            description="Stay updated with the latest real estate news and market trends"
                            icon={Newspaper}
                            variant="card"
                        >
                            <NewsFilters
                                onFilterChange={setNewsLocation}
                                defaultLocation={newsLocation}
                            />
                        </ContentSection>

                        {/* News Feed */}
                        <ContentSection
                            title="Latest News"
                            description="Curated real estate news for your market"
                            variant="default"
                        >
                            <NewsFeed location={newsLocation} />
                        </ContentSection>

                        {/* Development Monitor */}
                        <ContentSection
                            title="Service Monitor"
                            description="News service status and performance"
                            variant="card"
                        >
                            <NewsServiceMonitor />
                        </ContentSection>
                    </div>
                </TabsContent>

                <TabsContent value="alerts" className="mt-6">
                    <ContentSection
                        title="Market Alerts"
                        description="Stay informed about important market changes and opportunities"
                        icon={Bell}
                        variant="default"
                    >
                        <AlertsContent />
                    </ContentSection>
                </TabsContent>
            </Tabs>
        </div>
    );
}