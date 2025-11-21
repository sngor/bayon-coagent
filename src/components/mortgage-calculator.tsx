'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, DollarSign, Percent, Calendar, Home, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Copy, Share, Plus, X, BarChart3, Settings, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface MortgageCalculation {
    monthlyPayment: number;
    totalPayment: number;
    totalInterest: number;
    principalAndInterest: number;
    monthlyTaxes: number;
    monthlyInsurance: number;
    monthlyPMI: number;
    loanAmount: number;
    downPaymentAmount: number;
    debtToIncomeRatio?: number;
    affordabilityScore?: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations?: string[];
}

interface MortgageInputs {
    homePrice: number;
    downPayment: number;
    loanTerm: number;
    interestRate: number;
    propertyTax: number;
    homeInsurance: number;
    pmi: number;
    monthlyIncome?: number;
    monthlyDebts?: number;
}

interface ComparisonScenario {
    id: string;
    name: string;
    inputs: MortgageInputs;
    calculation: MortgageCalculation;
}

const defaultInputs: MortgageInputs = {
    homePrice: 500000,
    downPayment: 20,
    loanTerm: 30,
    interestRate: 7.0,
    propertyTax: 1.2,
    homeInsurance: 0.35,
    pmi: 0.5,
    monthlyIncome: 8000,
    monthlyDebts: 1200,
};

const commonScenarios = [
    { name: '15-Year Fixed', interestRate: 6.5, loanTerm: 15 },
    { name: '30-Year Fixed', interestRate: 7.0, loanTerm: 30 },
    { name: 'High Down Payment', downPayment: 30, interestRate: 6.8 },
    { name: 'Low Down Payment', downPayment: 5, interestRate: 7.2 },
];

export function MortgageCalculator() {
    const [inputs, setInputs] = useState<MortgageInputs>(defaultInputs);
    const [calculation, setCalculation] = useState<MortgageCalculation | null>(null);
    const [comparisons, setComparisons] = useState<ComparisonScenario[]>([]);
    const [activeTab, setActiveTab] = useState('calculator');
    const [savedCalculations, setSavedCalculations] = useState<ComparisonScenario[]>([]);
    const [clientName, setClientName] = useState('');
    const [showAmortization, setShowAmortization] = useState(false);

    const calculateMortgage = (inputs: MortgageInputs): MortgageCalculation => {
        const { homePrice, downPayment, loanTerm, interestRate, propertyTax, homeInsurance, pmi, monthlyIncome, monthlyDebts } = inputs;

        // Calculate loan amount
        const downPaymentAmount = (homePrice * downPayment) / 100;
        const loanAmount = homePrice - downPaymentAmount;

        // Monthly interest rate
        const monthlyRate = interestRate / 100 / 12;

        // Number of payments
        const numPayments = loanTerm * 12;

        // Calculate monthly principal and interest payment
        let principalAndInterest = 0;
        if (monthlyRate > 0) {
            principalAndInterest = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                (Math.pow(1 + monthlyRate, numPayments) - 1);
        } else {
            principalAndInterest = loanAmount / numPayments;
        }

        // Calculate other monthly costs
        const monthlyTaxes = (homePrice * propertyTax / 100) / 12;
        const monthlyInsurance = (homePrice * homeInsurance / 100) / 12;
        const monthlyPMI = downPayment < 20 ? (loanAmount * pmi / 100) / 12 : 0;

        // Total monthly payment
        const monthlyPayment = principalAndInterest + monthlyTaxes + monthlyInsurance + monthlyPMI;

        // Total payment over life of loan
        const totalPayment = monthlyPayment * numPayments;
        const totalInterest = (principalAndInterest * numPayments) - loanAmount;

        // Calculate affordability metrics
        let debtToIncomeRatio: number | undefined;
        let affordabilityScore: 'excellent' | 'good' | 'fair' | 'poor' | undefined;
        let recommendations: string[] = [];

        if (monthlyIncome && monthlyDebts !== undefined) {
            const totalMonthlyDebt = monthlyPayment + monthlyDebts;
            debtToIncomeRatio = (totalMonthlyDebt / monthlyIncome) * 100;

            if (debtToIncomeRatio <= 28) {
                affordabilityScore = 'excellent';
                recommendations.push('Excellent debt-to-income ratio! You have room for additional expenses.');
            } else if (debtToIncomeRatio <= 36) {
                affordabilityScore = 'good';
                recommendations.push('Good debt-to-income ratio. Consider building an emergency fund.');
            } else if (debtToIncomeRatio <= 43) {
                affordabilityScore = 'fair';
                recommendations.push('Consider a lower home price or increase your down payment.');
                recommendations.push('Pay down existing debts before purchasing.');
            } else {
                affordabilityScore = 'poor';
                recommendations.push('This home may be too expensive for your current income.');
                recommendations.push('Consider increasing income or reducing the home price significantly.');
            }
        }

        // Additional recommendations
        if (downPayment < 20) {
            recommendations.push(`Consider saving for a ${20 - downPayment}% larger down payment to avoid PMI.`);
        }

        if (interestRate > 7.5) {
            recommendations.push('Shop around for better interest rates to reduce monthly payments.');
        }

        if (loanTerm === 30 && monthlyIncome && monthlyPayment < monthlyIncome * 0.2) {
            recommendations.push('Consider a 15-year loan to save significantly on interest.');
        }

        return {
            monthlyPayment,
            totalPayment,
            totalInterest,
            principalAndInterest,
            monthlyTaxes,
            monthlyInsurance,
            monthlyPMI,
            loanAmount,
            downPaymentAmount,
            debtToIncomeRatio,
            affordabilityScore,
            recommendations,
        };
    };

    useEffect(() => {
        setCalculation(calculateMortgage(inputs));
    }, [inputs]);

    const handleInputChange = (field: keyof MortgageInputs, value: string) => {
        const numValue = parseFloat(value) || 0;
        setInputs(prev => ({ ...prev, [field]: numValue }));
    };

    const addComparison = (scenarioName?: string) => {
        const scenario = commonScenarios.find(s => s.name === scenarioName);
        const newInputs = scenario ? { ...inputs, ...scenario } : { ...inputs };
        const newCalculation = calculateMortgage(newInputs);

        const newComparison: ComparisonScenario = {
            id: Date.now().toString(),
            name: scenarioName || `Scenario ${comparisons.length + 1}`,
            inputs: newInputs,
            calculation: newCalculation,
        };

        setComparisons(prev => [...prev, newComparison]);
        setActiveTab('comparison');
    };

    const removeComparison = (id: string) => {
        setComparisons(prev => prev.filter(c => c.id !== id));
    };

    const generateAmortizationSchedule = (inputs: MortgageInputs, calculation: MortgageCalculation) => {
        const { loanTerm, interestRate } = inputs;
        const { loanAmount, principalAndInterest } = calculation;

        const monthlyRate = interestRate / 100 / 12;
        const numPayments = loanTerm * 12;
        const schedule = [];

        let remainingBalance = loanAmount;

        for (let month = 1; month <= Math.min(numPayments, 360); month++) {
            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = principalAndInterest - interestPayment;
            remainingBalance = Math.max(0, remainingBalance - principalPayment);

            schedule.push({
                month,
                payment: principalAndInterest,
                principal: principalPayment,
                interest: interestPayment,
                balance: remainingBalance,
            });

            if (remainingBalance <= 0) break;
        }

        return schedule;
    };

    const saveCalculation = () => {
        if (!calculation) return;

        const savedCalc: ComparisonScenario = {
            id: Date.now().toString(),
            name: clientName || `Calculation ${savedCalculations.length + 1}`,
            inputs: { ...inputs },
            calculation: { ...calculation },
        };

        setSavedCalculations(prev => [...prev, savedCalc]);
        toast({ title: 'Calculation Saved', description: 'Mortgage calculation saved successfully.' });
    };

    const generatePDF = () => {
        if (!calculation) return;

        // This would integrate with a PDF generation library
        toast({ title: 'PDF Generation', description: 'PDF generation feature coming soon!' });
    };

    const copyResults = () => {
        if (!calculation) return;

        const clientInfo = clientName ? `Client: ${clientName}\n` : '';
        const results = `
${clientInfo}Mortgage Calculator Results
Home Price: ${formatCurrency(inputs.homePrice)}
Down Payment: ${formatCurrency(calculation.downPaymentAmount)} (${inputs.downPayment}%)
Loan Amount: ${formatCurrency(calculation.loanAmount)}
Interest Rate: ${inputs.interestRate}%
Loan Term: ${inputs.loanTerm} years

Monthly Payment: ${formatCurrency(calculation.monthlyPayment)}
- Principal & Interest: ${formatCurrency(calculation.principalAndInterest)}
- Property Taxes: ${formatCurrency(calculation.monthlyTaxes)}
- Home Insurance: ${formatCurrency(calculation.monthlyInsurance)}
${calculation.monthlyPMI > 0 ? `- PMI: ${formatCurrency(calculation.monthlyPMI)}` : ''}

Total Interest: ${formatCurrency(calculation.totalInterest)}
Total Paid: ${formatCurrency(calculation.totalPayment)}
${calculation.debtToIncomeRatio ? `Debt-to-Income Ratio: ${calculation.debtToIncomeRatio.toFixed(1)}%` : ''}

Break-even vs Rent: ${Math.ceil(calculation.monthlyPayment / 1500)} months at $1500/month rent
Interest Savings with 15-year: ${formatCurrency(calculation.totalInterest * 0.4)} (estimated)
    `.trim();

        navigator.clipboard.writeText(results);
        toast({ title: 'Results Copied', description: 'Mortgage calculation results copied to clipboard.' });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatPercent = (amount: number) => {
        return `${amount.toFixed(2)}%`;
    };

    const getAffordabilityColor = (score?: string) => {
        switch (score) {
            case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
            case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'poor': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getAffordabilityIcon = (score?: string) => {
        switch (score) {
            case 'excellent': return <CheckCircle className="h-4 w-4" />;
            case 'good': return <CheckCircle className="h-4 w-4" />;
            case 'fair': return <AlertTriangle className="h-4 w-4" />;
            case 'poor': return <AlertTriangle className="h-4 w-4" />;
            default: return <Calculator className="h-4 w-4" />;
        }
    };

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
                <TabsTrigger value="calculator">
                    <Calculator className="h-4 w-4" />
                    <span className="whitespace-nowrap">Calculator</span>
                </TabsTrigger>
                <TabsTrigger value="comparison">
                    <BarChart3 className="h-4 w-4" />
                    <span className="whitespace-nowrap">Compare ({comparisons.length})</span>
                </TabsTrigger>
                <TabsTrigger value="affordability">
                    <DollarSign className="h-4 w-4" />
                    <span className="whitespace-nowrap">Affordability</span>
                </TabsTrigger>
                <TabsTrigger value="amortization">
                    <FileText className="h-4 w-4" />
                    <span className="whitespace-nowrap">Schedule</span>
                </TabsTrigger>
                <TabsTrigger value="tools">
                    <Settings className="h-4 w-4" />
                    <span className="whitespace-nowrap">Tools</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Input Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Mortgage Calculator
                            </CardTitle>
                            <CardDescription>
                                Calculate monthly payments and total costs for your mortgage
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Home Price */}
                            <div className="space-y-2">
                                <Label htmlFor="homePrice" className="flex items-center gap-2">
                                    <Home className="h-4 w-4" />
                                    Home Price
                                </Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="homePrice"
                                        type="number"
                                        value={inputs.homePrice}
                                        onChange={(e) => handleInputChange('homePrice', e.target.value)}
                                        className="pl-10"
                                        placeholder="500000"
                                    />
                                </div>
                            </div>

                            {/* Down Payment */}
                            <div className="space-y-2">
                                <Label htmlFor="downPayment" className="flex items-center gap-2">
                                    <Percent className="h-4 w-4" />
                                    Down Payment (%)
                                </Label>
                                <Input
                                    id="downPayment"
                                    type="number"
                                    value={inputs.downPayment}
                                    onChange={(e) => handleInputChange('downPayment', e.target.value)}
                                    placeholder="20"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                            </div>

                            {/* Loan Term */}
                            <div className="space-y-2">
                                <Label htmlFor="loanTerm" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Loan Term (Years)
                                </Label>
                                <Input
                                    id="loanTerm"
                                    type="number"
                                    value={inputs.loanTerm}
                                    onChange={(e) => handleInputChange('loanTerm', e.target.value)}
                                    placeholder="30"
                                    min="1"
                                    max="50"
                                />
                            </div>

                            {/* Interest Rate */}
                            <div className="space-y-2">
                                <Label htmlFor="interestRate" className="flex items-center gap-2">
                                    <Percent className="h-4 w-4" />
                                    Interest Rate (%)
                                </Label>
                                <Input
                                    id="interestRate"
                                    type="number"
                                    value={inputs.interestRate}
                                    onChange={(e) => handleInputChange('interestRate', e.target.value)}
                                    placeholder="7.0"
                                    min="0"
                                    max="20"
                                    step="0.01"
                                />
                            </div>

                            <Separator />

                            {/* Property Tax */}
                            <div className="space-y-2">
                                <Label htmlFor="propertyTax">Property Tax (% annually)</Label>
                                <Input
                                    id="propertyTax"
                                    type="number"
                                    value={inputs.propertyTax}
                                    onChange={(e) => handleInputChange('propertyTax', e.target.value)}
                                    placeholder="1.2"
                                    min="0"
                                    max="10"
                                    step="0.01"
                                />
                            </div>

                            {/* Home Insurance */}
                            <div className="space-y-2">
                                <Label htmlFor="homeInsurance">Home Insurance (% annually)</Label>
                                <Input
                                    id="homeInsurance"
                                    type="number"
                                    value={inputs.homeInsurance}
                                    onChange={(e) => handleInputChange('homeInsurance', e.target.value)}
                                    placeholder="0.35"
                                    min="0"
                                    max="5"
                                    step="0.01"
                                />
                            </div>

                            {/* PMI */}
                            <div className="space-y-2">
                                <Label htmlFor="pmi">PMI (% annually)</Label>
                                <Input
                                    id="pmi"
                                    type="number"
                                    value={inputs.pmi}
                                    onChange={(e) => handleInputChange('pmi', e.target.value)}
                                    placeholder="0.5"
                                    min="0"
                                    max="2"
                                    step="0.01"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Applied when down payment is less than 20%
                                </p>
                            </div>

                            {/* Client Name */}
                            <div className="space-y-2">
                                <Label htmlFor="clientName">Client Name (Optional)</Label>
                                <Input
                                    id="clientName"
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    placeholder="Enter client name for reports"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    onClick={() => setInputs(defaultInputs)}
                                    variant="outline"
                                >
                                    Reset
                                </Button>
                                <Button onClick={saveCalculation} variant="outline">
                                    Save
                                </Button>
                                <Button onClick={copyResults} variant="outline">
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy
                                </Button>
                                <Button onClick={generatePDF} variant="outline">
                                    PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Payment Breakdown
                                    </CardTitle>
                                    <CardDescription>
                                        Monthly payment and loan summary
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => addComparison()} variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Compare
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {calculation && (
                                <>
                                    {/* Monthly Payment */}
                                    <div className="text-center p-6 bg-primary/5 rounded-lg border">
                                        <div className="text-3xl font-bold text-primary">
                                            {formatCurrency(calculation.monthlyPayment)}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Total Monthly Payment
                                        </div>
                                    </div>

                                    {/* Affordability Score */}
                                    {calculation.affordabilityScore && (
                                        <div className={cn(
                                            "flex items-center gap-2 p-3 rounded-lg border",
                                            getAffordabilityColor(calculation.affordabilityScore)
                                        )}>
                                            {getAffordabilityIcon(calculation.affordabilityScore)}
                                            <div>
                                                <div className="font-medium capitalize">
                                                    {calculation.affordabilityScore} Affordability
                                                </div>
                                                {calculation.debtToIncomeRatio && (
                                                    <div className="text-sm">
                                                        Debt-to-Income: {calculation.debtToIncomeRatio.toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Breakdown */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">Monthly Payment Breakdown</h4>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Principal & Interest</span>
                                                <span className="font-medium">{formatCurrency(calculation.principalAndInterest)}</span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Property Taxes</span>
                                                <span className="font-medium">{formatCurrency(calculation.monthlyTaxes)}</span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Home Insurance</span>
                                                <span className="font-medium">{formatCurrency(calculation.monthlyInsurance)}</span>
                                            </div>

                                            {calculation.monthlyPMI > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm">PMI</span>
                                                    <span className="font-medium">{formatCurrency(calculation.monthlyPMI)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Loan Summary */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">Loan Summary</h4>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Loan Amount</span>
                                                <span className="font-medium">{formatCurrency(calculation.loanAmount)}</span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Down Payment</span>
                                                <span className="font-medium">
                                                    {formatCurrency(calculation.downPaymentAmount)} ({formatPercent(inputs.downPayment)})
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Total Interest</span>
                                                <span className="font-medium">{formatCurrency(calculation.totalInterest)}</span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Total Paid</span>
                                                <span className="font-medium">{formatCurrency(calculation.totalPayment)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="text-center p-3 bg-muted/50 rounded">
                                            <div className="text-lg font-semibold">
                                                {formatPercent((calculation.monthlyPayment * 12 / inputs.homePrice) * 100)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Annual Payment %</div>
                                        </div>

                                        <div className="text-center p-3 bg-muted/50 rounded">
                                            <div className="text-lg font-semibold">
                                                {Math.round(calculation.totalInterest / calculation.loanAmount * 100)}%
                                            </div>
                                            <div className="text-xs text-muted-foreground">Interest vs Principal</div>
                                        </div>
                                    </div>

                                    {/* Quick Scenario Buttons */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold">Quick Comparisons</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {commonScenarios.map((scenario) => (
                                                <Button
                                                    key={scenario.name}
                                                    onClick={() => addComparison(scenario.name)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                >
                                                    {scenario.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Mortgage Comparison</CardTitle>
                        <CardDescription>
                            Compare different mortgage scenarios side by side
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {comparisons.length === 0 ? (
                            <div className="text-center py-8">
                                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Comparisons Yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Add scenarios from the calculator to compare different mortgage options
                                </p>
                                <Button onClick={() => addComparison()}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Current Scenario
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Comparison Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-3 font-semibold">Scenario</th>
                                                <th className="text-right p-3 font-semibold">Monthly Payment</th>
                                                <th className="text-right p-3 font-semibold">Total Interest</th>
                                                <th className="text-right p-3 font-semibold">Total Paid</th>
                                                <th className="text-center p-3 font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {comparisons.map((comparison) => (
                                                <tr key={comparison.id} className="border-b hover:bg-muted/50">
                                                    <td className="p-3">
                                                        <div>
                                                            <div className="font-medium">{comparison.name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {comparison.inputs.interestRate}% • {comparison.inputs.loanTerm}yr • {comparison.inputs.downPayment}% down
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-right p-3 font-medium">
                                                        {formatCurrency(comparison.calculation.monthlyPayment)}
                                                    </td>
                                                    <td className="text-right p-3">
                                                        {formatCurrency(comparison.calculation.totalInterest)}
                                                    </td>
                                                    <td className="text-right p-3">
                                                        {formatCurrency(comparison.calculation.totalPayment)}
                                                    </td>
                                                    <td className="text-center p-3">
                                                        <Button
                                                            onClick={() => removeComparison(comparison.id)}
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Best Option Highlight */}
                                {comparisons.length > 1 && (
                                    <Alert>
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            <strong>Best Option:</strong> {
                                                comparisons.reduce((best, current) =>
                                                    current.calculation.totalPayment < best.calculation.totalPayment ? current : best
                                                ).name
                                            } saves you the most money over the life of the loan.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="affordability" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Affordability Analysis</CardTitle>
                        <CardDescription>
                            Enter your income and debts for personalized affordability insights
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Income and Debt Inputs */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="monthlyIncome">Monthly Gross Income</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="monthlyIncome"
                                        type="number"
                                        value={inputs.monthlyIncome || ''}
                                        onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                                        className="pl-10"
                                        placeholder="8000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="monthlyDebts">Monthly Debt Payments</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="monthlyDebts"
                                        type="number"
                                        value={inputs.monthlyDebts || ''}
                                        onChange={(e) => handleInputChange('monthlyDebts', e.target.value)}
                                        className="pl-10"
                                        placeholder="1200"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Include car loans, credit cards, student loans, etc.
                                </p>
                            </div>
                        </div>

                        {/* Affordability Results */}
                        {calculation && calculation.debtToIncomeRatio && (
                            <div className="space-y-6">
                                <Separator />

                                {/* DTI Ratio Display */}
                                <div className="text-center">
                                    <div className="text-4xl font-bold mb-2">
                                        {calculation.debtToIncomeRatio.toFixed(1)}%
                                    </div>
                                    <div className="text-muted-foreground">Debt-to-Income Ratio</div>
                                    <Badge
                                        variant="outline"
                                        className={cn("mt-2", getAffordabilityColor(calculation.affordabilityScore))}
                                    >
                                        {calculation.affordabilityScore?.toUpperCase()}
                                    </Badge>
                                </div>

                                {/* DTI Guidelines */}
                                <div className="grid gap-4 md:grid-cols-4">
                                    <div className={cn("p-4 rounded-lg border text-center",
                                        calculation.debtToIncomeRatio <= 28 ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                                    )}>
                                        <div className="font-semibold text-green-600">≤ 28%</div>
                                        <div className="text-sm">Excellent</div>
                                    </div>
                                    <div className={cn("p-4 rounded-lg border text-center",
                                        calculation.debtToIncomeRatio > 28 && calculation.debtToIncomeRatio <= 36 ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                                    )}>
                                        <div className="font-semibold text-blue-600">29-36%</div>
                                        <div className="text-sm">Good</div>
                                    </div>
                                    <div className={cn("p-4 rounded-lg border text-center",
                                        calculation.debtToIncomeRatio > 36 && calculation.debtToIncomeRatio <= 43 ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"
                                    )}>
                                        <div className="font-semibold text-yellow-600">37-43%</div>
                                        <div className="text-sm">Fair</div>
                                    </div>
                                    <div className={cn("p-4 rounded-lg border text-center",
                                        calculation.debtToIncomeRatio > 43 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
                                    )}>
                                        <div className="font-semibold text-red-600">&gt; 43%</div>
                                        <div className="text-sm">Poor</div>
                                    </div>
                                </div>

                                {/* Recommendations */}
                                {calculation.recommendations && calculation.recommendations.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold">Recommendations</h4>
                                        <div className="space-y-2">
                                            {calculation.recommendations.map((rec, index) => (
                                                <Alert key={index}>
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <AlertDescription>{rec}</AlertDescription>
                                                </Alert>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Affordability Breakdown */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Monthly Budget Breakdown</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Gross Monthly Income</span>
                                            <span className="font-medium">{formatCurrency(inputs.monthlyIncome || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Housing Payment</span>
                                            <span className="font-medium">{formatCurrency(calculation.monthlyPayment)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Other Debt Payments</span>
                                            <span className="font-medium">{formatCurrency(inputs.monthlyDebts || 0)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-center font-semibold">
                                            <span>Remaining Income</span>
                                            <span className={cn(
                                                (inputs.monthlyIncome || 0) - calculation.monthlyPayment - (inputs.monthlyDebts || 0) > 0
                                                    ? "text-green-600" : "text-red-600"
                                            )}>
                                                {formatCurrency((inputs.monthlyIncome || 0) - calculation.monthlyPayment - (inputs.monthlyDebts || 0))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="amortization" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Amortization Schedule</CardTitle>
                        <CardDescription>
                            See how your payments break down over time
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {calculation ? (
                            <div className="space-y-6">
                                {/* Schedule Summary */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-muted/50 rounded">
                                        <div className="text-2xl font-bold">{inputs.loanTerm * 12}</div>
                                        <div className="text-sm text-muted-foreground">Total Payments</div>
                                    </div>
                                    <div className="text-center p-4 bg-muted/50 rounded">
                                        <div className="text-2xl font-bold">{formatCurrency(calculation.principalAndInterest)}</div>
                                        <div className="text-sm text-muted-foreground">Monthly P&I</div>
                                    </div>
                                    <div className="text-center p-4 bg-muted/50 rounded">
                                        <div className="text-2xl font-bold">{Math.round((calculation.totalInterest / calculation.loanAmount) * 100)}%</div>
                                        <div className="text-sm text-muted-foreground">Interest Rate</div>
                                    </div>
                                    <div className="text-center p-4 bg-muted/50 rounded">
                                        <div className="text-2xl font-bold">{Math.round(inputs.loanTerm / 2)}</div>
                                        <div className="text-sm text-muted-foreground">Years to 50% Equity</div>
                                    </div>
                                </div>

                                {/* First Year Breakdown */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold">First Year Payment Breakdown</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-2">Month</th>
                                                    <th className="text-right p-2">Payment</th>
                                                    <th className="text-right p-2">Principal</th>
                                                    <th className="text-right p-2">Interest</th>
                                                    <th className="text-right p-2">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {generateAmortizationSchedule(inputs, calculation).slice(0, 12).map((payment) => (
                                                    <tr key={payment.month} className="border-b hover:bg-muted/50">
                                                        <td className="p-2">{payment.month}</td>
                                                        <td className="text-right p-2">{formatCurrency(payment.payment)}</td>
                                                        <td className="text-right p-2">{formatCurrency(payment.principal)}</td>
                                                        <td className="text-right p-2">{formatCurrency(payment.interest)}</td>
                                                        <td className="text-right p-2">{formatCurrency(payment.balance)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Key Milestones */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Key Milestones</h4>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Alert>
                                            <Calendar className="h-4 w-4" />
                                            <AlertDescription>
                                                <strong>PMI Removal:</strong> {inputs.downPayment < 20 ? `Month ${Math.ceil((0.2 * inputs.homePrice - calculation.downPaymentAmount) / (calculation.principalAndInterest * 0.7))} (estimated)` : 'Not applicable'}
                                            </AlertDescription>
                                        </Alert>
                                        <Alert>
                                            <TrendingUp className="h-4 w-4" />
                                            <AlertDescription>
                                                <strong>50% Equity:</strong> Month {Math.round(inputs.loanTerm * 12 * 0.6)} (estimated)
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setShowAmortization(!showAmortization)}
                                    variant="outline"
                                    className="w-full"
                                >
                                    {showAmortization ? 'Hide' : 'Show'} Full Schedule
                                </Button>

                                {showAmortization && (
                                    <div className="max-h-96 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-background">
                                                <tr className="border-b">
                                                    <th className="text-left p-2">Year</th>
                                                    <th className="text-right p-2">Principal Paid</th>
                                                    <th className="text-right p-2">Interest Paid</th>
                                                    <th className="text-right p-2">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({ length: inputs.loanTerm }, (_, year) => {
                                                    const yearSchedule = generateAmortizationSchedule(inputs, calculation)
                                                        .slice(year * 12, (year + 1) * 12);
                                                    const principalPaid = yearSchedule.reduce((sum, p) => sum + p.principal, 0);
                                                    const interestPaid = yearSchedule.reduce((sum, p) => sum + p.interest, 0);
                                                    const endBalance = yearSchedule[yearSchedule.length - 1]?.balance || 0;

                                                    return (
                                                        <tr key={year + 1} className="border-b hover:bg-muted/50">
                                                            <td className="p-2">{year + 1}</td>
                                                            <td className="text-right p-2">{formatCurrency(principalPaid)}</td>
                                                            <td className="text-right p-2">{formatCurrency(interestPaid)}</td>
                                                            <td className="text-right p-2">{formatCurrency(endBalance)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Enter mortgage details to see amortization schedule
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="tools" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Saved Calculations */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Saved Calculations</CardTitle>
                            <CardDescription>
                                Your saved mortgage calculations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {savedCalculations.length === 0 ? (
                                <div className="text-center py-8">
                                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No saved calculations yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {savedCalculations.map((calc) => (
                                        <div key={calc.id} className="flex items-center justify-between p-3 border rounded">
                                            <div>
                                                <div className="font-medium">{calc.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {formatCurrency(calc.calculation.monthlyPayment)}/month
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setInputs(calc.inputs);
                                                    setClientName(calc.name.includes('Calculation') ? '' : calc.name);
                                                    setActiveTab('calculator');
                                                }}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Load
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Tools */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Tools</CardTitle>
                            <CardDescription>
                                Helpful calculators and insights
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {calculation && (
                                <>
                                    {/* Rent vs Buy */}
                                    <div className="p-4 border rounded">
                                        <h4 className="font-semibold mb-2">Rent vs Buy Analysis</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Monthly Payment:</span>
                                                <span>{formatCurrency(calculation.monthlyPayment)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Break-even Rent:</span>
                                                <span>{formatCurrency(calculation.monthlyPayment * 0.8)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>5-Year Cost:</span>
                                                <span>{formatCurrency(calculation.monthlyPayment * 60)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Refinance Analysis */}
                                    <div className="p-4 border rounded">
                                        <h4 className="font-semibold mb-2">Refinance Potential</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Current Rate:</span>
                                                <span>{inputs.interestRate}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>1% Lower Rate Saves:</span>
                                                <span>{formatCurrency(calculation.loanAmount * 0.01 / 12)}/month</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Break-even Cost:</span>
                                                <span>{formatCurrency(calculation.loanAmount * 0.02)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Extra Payment Impact */}
                                    <div className="p-4 border rounded">
                                        <h4 className="font-semibold mb-2">Extra Payment Impact</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>+$100/month saves:</span>
                                                <span>{Math.round(inputs.loanTerm * 0.15)} years</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>+$200/month saves:</span>
                                                <span>{Math.round(inputs.loanTerm * 0.25)} years</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Interest savings:</span>
                                                <span>{formatCurrency(calculation.totalInterest * 0.2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Market Insights */}
                                    <div className="p-4 border rounded">
                                        <h4 className="font-semibold mb-2">Market Context</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Rate vs 2023 Avg (7.8%):</span>
                                                <span className={inputs.interestRate < 7.8 ? 'text-green-600' : 'text-red-600'}>
                                                    {inputs.interestRate < 7.8 ? 'Below' : 'Above'} Average
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Payment % of Income:</span>
                                                <span className={
                                                    inputs.monthlyIncome && (calculation.monthlyPayment / inputs.monthlyIncome) < 0.28
                                                        ? 'text-green-600' : 'text-yellow-600'
                                                }>
                                                    {inputs.monthlyIncome
                                                        ? `${((calculation.monthlyPayment / inputs.monthlyIncome) * 100).toFixed(1)}%`
                                                        : 'N/A'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    );
}