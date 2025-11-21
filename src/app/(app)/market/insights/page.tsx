'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { StandardEmptyState } from '@/components/standard';
import { LifeEventPredictorForm } from '@/components/life-event-predictor/life-event-predictor-form';
import { AlertsContent } from '@/components/alerts/alerts-content';
import { TrendingUp, BarChart3, Bell } from 'lucide-react';
import { useUnreadAlertCount } from '@/hooks/use-unread-alert-count';
import { Badge } from '@/components/ui/badge';

export default function MarketInsightsPage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('trends');
    const { unreadCount } = useUnreadAlertCount();

    // Check URL parameters to set initial tab
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['trends', 'analytics', 'alerts'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    return (
        <div className="space-y-6">
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
                    <div className="space-y-8">
                        {/* Neighborhood Trend Alerts will be added here */}
                        <LifeEventPredictorForm />
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                    <StandardEmptyState
                        icon={<BarChart3 className="h-12 w-12 text-primary" />}
                        title="Market Analytics Coming Soon"
                        description="Track market metrics, neighborhood data, pricing trends, and more. This feature is currently in development."
                    />
                </TabsContent>

                <TabsContent value="alerts" className="mt-6">
                    <AlertsContent />
                </TabsContent>
            </Tabs>
        </div>
    );
}