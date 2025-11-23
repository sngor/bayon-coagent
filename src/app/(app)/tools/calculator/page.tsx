'use client';

import { ContentSection, FeatureBanner } from '@/components/ui';
import { MortgageCalculator } from '@/components/mortgage-calculator';
import { Button } from '@/components/ui/button';

export default function MortgageCalculatorPage() {
    return (
        <div className="space-y-6">
            <FeatureBanner
                title="🧮 Mortgage Calculator Best Practices"
                description="Help clients understand their buying power and monthly commitments"
                variant="tip"
                dismissible={true}
                tips={[
                    "Include property taxes and insurance for accurate monthly payments",
                    "Show different down payment scenarios to help clients plan",
                    "Use the amortization schedule to explain equity building over time",
                    "Compare 15-year vs 30-year loans to show interest savings"
                ]}
                actions={
                    <Button variant="outline" size="sm">
                        Share Calculator
                    </Button>
                }
            />

            <ContentSection
                title="Payment Calculator"
                description="Enter loan details to calculate monthly payments and view amortization"
                variant="default"
            >
                <MortgageCalculator />
            </ContentSection>
        </div>
    );
}