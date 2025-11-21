'use client';

import { useState } from 'react';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { StandardEmptyState } from '@/components/standard';
import { InvestmentOpportunityIdentificationForm } from '@/components/investment-opportunity-identification/investment-opportunity-identification-form';
import { LifeEventPredictorForm } from '@/components/life-event-predictor/life-event-predictor-form';
import { Target, TrendingUp, BarChart3 } from 'lucide-react';

export default function MarketInsightsPage() {
    const [activeTab, setActiveTab] = useState('opportunities');

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="opportunities" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Opportunities
                    </TabsTrigger>
                    <TabsTrigger value="trends" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Trends
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="opportunities" className="mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold">Investment Opportunities</h2>
                            <p className="text-sm text-muted-foreground">
                                Identify high-potential investment opportunities in your market using AI-powered analysis.
                            </p>
                        </div>
                        <InvestmentOpportunityIdentificationForm />
                    </div>
                </TabsContent>

                <TabsContent value="trends" className="mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold">Market Trends & Life Events</h2>
                            <p className="text-sm text-muted-foreground">
                                Predict life events and market patterns to anticipate client needs and market shifts.
                            </p>
                        </div>
                        <LifeEventPredictorForm />
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold">Market Analytics</h2>
                            <p className="text-sm text-muted-foreground">
                                Track market metrics, neighborhood data, and pricing trends with comprehensive analytics.
                            </p>
                        </div>
                        <StandardEmptyState
                            icon={<BarChart3 className="h-12 w-12 text-primary" />}
                            title="Market Analytics Coming Soon"
                            description="Track market metrics, neighborhood data, pricing trends, and more. This feature is currently in development."
                            variant="card"
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}