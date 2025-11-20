'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { StandardPageLayout } from '@/components/standard';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { TrendingUp, HeartPulse } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the tool components
const InvestmentOpportunity = dynamic(() => import('./investment'), {
    loading: () => <div className="p-6">Loading...</div>
});

const LifeEventPredictor = dynamic(() => import('./life-events'), {
    loading: () => <div className="p-6">Loading...</div>
});

export default function IntelligenceMarketInsightsPage() {
    const searchParams = useSearchParams();
    const toolParam = searchParams.get('tool');
    const [activeTab, setActiveTab] = useState(toolParam || 'investment');

    useEffect(() => {
        if (toolParam) {
            setActiveTab(toolParam);
        }
    }, [toolParam]);

    return (
        <StandardPageLayout
            spacing="default"
        >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="investment">
                        <TrendingUp className="h-4 w-4" />
                        <span className="whitespace-nowrap">Investment Opportunities</span>
                    </TabsTrigger>
                    <TabsTrigger value="life-events">
                        <HeartPulse className="h-4 w-4" />
                        <span className="whitespace-nowrap">Life Event Predictor</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="investment" className="mt-6">
                    <InvestmentOpportunity />
                </TabsContent>

                <TabsContent value="life-events" className="mt-6">
                    <LifeEventPredictor />
                </TabsContent>
            </Tabs>
        </StandardPageLayout>
    );
}
