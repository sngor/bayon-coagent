'use client';

import { useState, useCallback } from 'react';
import { FeatureBanner } from '@/components/ui';
import { PageHeader } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { 
    Calculator, 
    Share2, 
    Download, 
    DollarSign,
    BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMortgageCalculator, type MortgageInputs } from '@/hooks/use-mortgage-calculator';
import { useAffordabilityCalculator, type AffordabilityInputs } from '@/hooks/use-affordability-calculator';
import { useLoanComparison } from '@/hooks/use-loan-comparison';
import { PaymentCalculatorTab } from '@/components/mortgage-calculator/payment-calculator-tab';
import { AffordabilityTab } from '@/components/mortgage-calculator/affordability-tab';
import { ComparisonTab } from '@/components/mortgage-calculator/comparison-tab';
import { MORTGAGE_DEFAULTS, AFFORDABILITY_DEFAULTS, DEFAULT_SCENARIOS } from '@/lib/mortgage-calculator/constants';

type TabType = 'calculator' | 'affordability' | 'comparison';

export default function MortgageCalculatorPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<TabType>('calculator');
    
    // Calculator state with proper defaults
    const [calculatorInputs, setCalculatorInputs] = useState<MortgageInputs>(MORTGAGE_DEFAULTS);
    const [affordabilityInputs, setAffordabilityInputs] = useState<AffordabilityInputs>(AFFORDABILITY_DEFAULTS);
    const [comparisonScenarios] = useState(DEFAULT_SCENARIOS);

    // Use custom hooks for calculations
    const mortgageCalculation = useMortgageCalculator(calculatorInputs);
    const affordabilityAnalysis = useAffordabilityCalculator(affordabilityInputs);
    const comparisonResults = useLoanComparison(
        [...comparisonScenarios], // Convert readonly array to mutable
        calculatorInputs.homePrice, 
        calculatorInputs.downPayment
    );

    // Memoized handlers to prevent unnecessary re-renders
    const handleShare = useCallback(() => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        toast({
            title: "Link copied",
            description: "The mortgage calculator link has been copied to your clipboard.",
            variant: "success",
        });
    }, [toast]);

    const handleExport = useCallback(() => {
        if (!mortgageCalculation) return;

        const data = {
            inputs: calculatorInputs,
            results: mortgageCalculation,
            generatedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mortgage-calculation.json';
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: "Calculation exported",
            description: "Your mortgage calculation has been downloaded.",
            variant: "success",
        });
    }, [mortgageCalculation, calculatorInputs, toast]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Mortgage Calculator"
                description="Calculate payments, analyze affordability, and compare loan options for your clients"
                icon={Calculator}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button onClick={handleShare}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share Calculator
                        </Button>
                    </div>
                }
            />

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
            />

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="calculator">
                        <Calculator className="mr-2 h-4 w-4" />
                        Payment Calculator
                    </TabsTrigger>
                    <TabsTrigger value="affordability">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Affordability Analysis
                    </TabsTrigger>
                    <TabsTrigger value="comparison">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Loan Comparison
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="calculator" className="space-y-6">
                    <PaymentCalculatorTab
                        inputs={calculatorInputs}
                        onInputsChange={setCalculatorInputs}
                        calculation={mortgageCalculation}
                    />
                </TabsContent>

                <TabsContent value="affordability" className="space-y-6">
                    <AffordabilityTab
                        inputs={affordabilityInputs}
                        onInputsChange={setAffordabilityInputs}
                        analysis={affordabilityAnalysis}
                    />
                </TabsContent>

                <TabsContent value="comparison" className="space-y-6">
                    <ComparisonTab
                        homePrice={calculatorInputs.homePrice}
                        comparisonResults={comparisonResults}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}