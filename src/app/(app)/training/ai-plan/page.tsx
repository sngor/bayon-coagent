'use client';

import { StandardPageLayout } from '@/components/standard';
import { AITrainingPlan } from '@/components/ai-training-plan';

export default function AITrainingPlanPage() {
    return (
        <StandardPageLayout
            title="AI Training Plan"
            description="Get a personalized training plan tailored to your specific challenges and growth areas"
            spacing="default"
        >
            <AITrainingPlan />
        </StandardPageLayout>
    );
}
