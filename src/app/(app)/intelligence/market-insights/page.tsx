'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { StandardPageLayout } from '@/components/standard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
            title="Market Intelligence Tools"
            description="Advanced AI tools for investment analysis and life event predictions"
            spacing="default"
        >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="investment" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Investment Opportunities
                    </TabsTrigger>
                    <TabsTrigger value="life-events" className="flex items-center gap-2">
                        <HeartPulse className="h-4 w-4" />
                        Life Event Predictor
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
