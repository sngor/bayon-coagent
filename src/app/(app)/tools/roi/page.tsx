'use client';

import { StandardPageLayout } from '@/components/standard';
import { RenovationROICalculator } from '@/components/renovation-roi-calculator';

export default function ROIPage() {
    return (
        <StandardPageLayout spacing="none">
            <RenovationROICalculator />
        </StandardPageLayout>
    );
}