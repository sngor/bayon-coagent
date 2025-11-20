'use client';

import { StandardPageLayout } from '@/components/standard';
import { AITrainingPlan } from '@/components/ai-training-plan';

export default function AITrainingPlanPage() {
    return (
        <StandardPageLayout
            spacing="default"
        >
            <AITrainingPlan />
        </StandardPageLayout>
    );
}
