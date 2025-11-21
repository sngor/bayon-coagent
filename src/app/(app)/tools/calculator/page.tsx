import { StandardPageLayout } from '@/components/standard';
import { MortgageCalculator } from '@/components/mortgage-calculator';

export default function MortgageCalculatorPage() {
    return (
        <StandardPageLayout spacing="default">
            <MortgageCalculator />
        </StandardPageLayout>
    );
}