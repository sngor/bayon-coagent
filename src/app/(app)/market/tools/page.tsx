'use client';

import { useState } from 'react';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { StandardPageLayout } from '@/components/standard';
import { RenovationROICalculator } from '@/components/renovation-roi-calculator';
import { Wrench, Home } from 'lucide-react';

// Import the valuation page content
import PropertyValuationContent from './valuation-content';

export default function MarketToolsPage() {
    const [activeTab, setActiveTab] = useState('renovation-roi');

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="renovation-roi" className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Renovation ROI
                    </TabsTrigger>
                    <TabsTrigger value="valuation" className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Valuation
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="renovation-roi" className="mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold">Renovation ROI Calculator</h2>
                            <p className="text-sm text-muted-foreground">
                                Analyze the return on investment for home renovation projects and improvements.
                            </p>
                        </div>
                        <StandardPageLayout spacing="none">
                            <RenovationROICalculator />
                        </StandardPageLayout>
                    </div>
                </TabsContent>

                <TabsContent value="valuation" className="mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold">Property Valuation</h2>
                            <p className="text-sm text-muted-foreground">
                                Get AI-powered property valuations based on market data and comparable properties.
                            </p>
                        </div>
                        <PropertyValuationContent />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}