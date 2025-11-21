import { StandardPageLayout } from '@/components/standard';
import { RenovationROICalculator } from '@/components/renovation-roi-calculator';

export default function RenovationROIPage() {
    return (
        <StandardPageLayout spacing="default">
            <RenovationROICalculator />
        </StandardPageLayout>
    );
}