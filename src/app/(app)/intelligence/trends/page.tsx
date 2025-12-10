'use client';

import {
    ContentSection,
    FeatureBanner
} from '@/components/ui';
import { LifeEventPredictorForm } from '@/components/life-event-predictor/life-event-predictor-form';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function MarketTrendsPage() {
    const { toast } = useToast();

    const handleGuideClick = () => {
        toast({
            title: "Coming Soon",
            description: "The Trends Guide is currently being updated. Please check back later.",
            variant: "default",
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle className="font-headline text-2xl">Market Trends</CardTitle>
                        <CardDescription>Life event predictions and market trends</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <LifeEventPredictorForm />
                </CardContent>
            </Card>

            {/* Feature Banner */}
            <FeatureBanner
                title="Market Trends & Predictions"
                description="Identify potential clients through life event predictions and market trends"
                variant="onboarding"
                dismissible={true}
                tips={[
                    "Use life event predictions to identify potential clients proactively",
                    "Target homeowners likely to move based on demographic data",
                    "Focus on high-probability leads to maximize your conversion rate",
                    "Combine trend data with your local market knowledge for best results"
                ]}
                actions={
                    <Button onClick={handleGuideClick}>
                        Trends Guide
                    </Button>
                }
            />
        </div>
    );
}