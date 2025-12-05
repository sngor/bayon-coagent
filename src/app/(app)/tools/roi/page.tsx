'use client';

import { ContentSection, FeatureBanner } from '@/components/ui';
import { RenovationROICalculator } from '@/features/calculators/components/renovation-roi-calculator';
import { Button } from '@/components/ui/button';

import { useToast } from '@/hooks/use-toast';

import { FavoritesButton } from '@/components/favorites-button';
import { getPageMetadata } from '@/lib/page-metadata';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ROIPage() {
    const { toast } = useToast();

    const handleGuideClick = () => {
        toast({
            title: "Coming Soon",
            description: "The ROI Guide is currently being updated. Please check back later.",
            variant: "default",
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="font-headline text-2xl">ROI Calculator</CardTitle>
                            <CardDescription>Analyze investment returns</CardDescription>
                        </div>
                        {(() => {
                            const pageMetadata = getPageMetadata('/tools/roi');
                            return pageMetadata ? <FavoritesButton item={pageMetadata} /> : null;
                        })()}
                    </div>
                </CardHeader>
            </Card>
            <FeatureBanner
                title="ROI Calculator Pro Tips"
                description="Help clients make smart renovation decisions with data-driven insights"
                variant="success"
                dismissible={true}
                tips={[
                    "Focus on kitchen and bathroom renovations for highest ROI",
                    "Consider local market preferences when recommending improvements",
                    "Factor in both immediate value and long-term market appeal",
                    "Use these calculations to justify listing price increases"
                ]}
                actions={
                    <Button onClick={handleGuideClick}>
                        ROI Guide
                    </Button>
                }
            />

            <RenovationROICalculator />
        </div>
    );
}