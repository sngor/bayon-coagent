'use client';

import { ContentSection, FeatureBanner } from '@/components/ui';
import { RenovationROICalculator } from '@/components/renovation-roi-calculator';
import { Button } from '@/components/ui/button';

export default function ROIPage() {
    return (
        <div className="space-y-6">
            <FeatureBanner
                title="📈 ROI Calculator Pro Tips"
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
                    <Button variant="outline" size="sm">
                        ROI Guide
                    </Button>
                }
            />

            <ContentSection
                title="Renovation ROI Analysis"
                description="Analyze the potential return on investment for various renovation projects"
                variant="default"
            >
                <RenovationROICalculator />
            </ContentSection>
        </div>
    );
}