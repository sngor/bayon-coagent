'use client';

import { useState, useEffect } from 'react';
import {
    ContentSection,
    FeatureBanner
} from '@/components/ui';
import { NewsFeed } from '@/components/news-feed';
import { NewsFilters } from '@/components/news-filters';
import { NewsServiceMonitor } from '@/components/news-service-monitor';
import { Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NEWS_CONFIG } from '@/lib/news-config';

import { useToast } from '@/hooks/use-toast';

export default function MarketNewsPage() {
    const { toast } = useToast();
    const [newsLocation, setNewsLocation] = useState('');

    const handleGuideClick = () => {
        toast({
            title: "Coming Soon",
            description: "The News Guide is currently being updated. Please check back later.",
            variant: "default",
        });
    };

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
            {/* Feature Banner */}
            <FeatureBanner
                title="Stay Ahead with Market News"
                description="Get the latest real estate news and market insights to inform your strategy"
                variant="onboarding"
                dismissible={true}
                tips={[
                    "Filter news by location to focus on your target markets",
                    "Use market news to identify emerging trends and opportunities",
                    "Share relevant news articles with clients to demonstrate market expertise",
                    "Monitor national trends that may impact your local market"
                ]}
                actions={
                    <Button onClick={handleGuideClick}>
                        News Guide
                    </Button>
                }
            />

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
    );
}