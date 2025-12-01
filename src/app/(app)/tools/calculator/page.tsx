'use client';

import { ContentSection, FeatureBanner } from '@/components/ui';
import { MortgageCalculator } from '@/features/calculators/components/mortgage-calculator';
import { Button } from '@/components/ui/button';

import { useToast } from '@/hooks/use-toast';

import { FavoritesButton } from '@/components/favorites-button';
import { getPageConfig } from '@/components/dashboard-quick-actions';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function MortgageCalculatorPage() {
    const { toast } = useToast();

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        toast({
            title: "Link copied",
            description: "The link to the mortgage calculator has been copied to your clipboard.",
            variant: "success",
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="font-headline text-2xl">Mortgage Calculator</CardTitle>
                            <CardDescription>Calculate payments and rates</CardDescription>
                        </div>
                        {(() => {
                            const pageConfig = getPageConfig('/tools/calculator');
                            return pageConfig ? <FavoritesButton item={pageConfig} /> : null;
                        })()}
                    </div>
                </CardHeader>
            </Card>
            <FeatureBanner
                title="Mortgage Calculator Best Practices"
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
                    <Button onClick={handleShare}>
                        Share Calculator
                    </Button>
                }
            />

            <MortgageCalculator />
        </div>
    );
}