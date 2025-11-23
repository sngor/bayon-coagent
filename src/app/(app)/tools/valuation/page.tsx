'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { StandardPageLayout } from '@/components/standard';
import { StandardFormActions } from '@/components/standard/form-actions';
import { StandardFormField } from '@/components/standard/form-field';
import { StandardCard } from '@/components/standard/card';
import { AIOperationProgress, useAIOperation } from '@/components/ui/ai-operation-progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { runPropertyValuationAction } from '@/app/actions';
import { Home, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Copy, Download } from 'lucide-react';
import { type PropertyValuationOutput } from '@/aws/bedrock/flows';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';
import { cn } from '@/lib/utils';

type ValuationInitialState = {
    message: string;
    data: PropertyValuationOutput | null;
    errors: any;
};

const valuationInitialState: ValuationInitialState = {
    message: '',
    data: null,
    errors: {},
};

function SubmitButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <StandardFormActions
            primaryAction={{
                label: 'Get Property Valuation',
                type: 'submit',
                variant: 'ai',
                loading: pending,
                disabled: disabled,
            }}
            alignment="left"
            className="w-full md:w-auto"
        />
    );
}

export default function PropertyValuationPage() {
    const [state, formAction, isPending] = useActionState(
        runPropertyValuationAction,
        valuationInitialState
    );
    const { user, isUserLoading } = useUser();

    // AI Operation Progress tracking
    const valuationOperation = useAIOperation('run-property-valuation');

    // Track operation progress
    useEffect(() => {
        if (isPending) {
            const tracker = valuationOperation.start();
            valuationOperation.updateProgress(0, 'Analyzing property description...');
            setTimeout(() => valuationOperation.updateProgress(25, 'Searching for comparable properties...'), 3000);
            setTimeout(() => valuationOperation.updateProgress(50, 'Analyzing market trends...'), 8000);
            setTimeout(() => valuationOperation.updateProgress(75, 'Generating valuation report...'), 12000);
        } else if (valuationOperation.isRunning) {
            valuationOperation.complete();
        }
    }, [isPending]);

    useEffect(() => {
        if (state.message === 'success' && state.data) {
            toast({
                title: 'Valuation Complete!',
                description: 'Your AI property valuation has been generated successfully.'
            });
        } else if (state.message && state.message !== 'success') {
            toast({
                variant: 'destructive',
                title: 'Valuation Failed',
                description: state.message,
            });
        }
    }, [state]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case 'high': return 'text-green-600 bg-green-50 border-green-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getConfidenceIcon = (confidence: string) => {
        switch (confidence) {
            case 'high': return <CheckCircle className="h-4 w-4" />;
            case 'medium': return <AlertTriangle className="h-4 w-4" />;
            case 'low': return <AlertTriangle className="h-4 w-4" />;
            default: return <Home className="h-4 w-4" />;
        }
    };

    const handleCopyResults = () => {
        if (!state.data) return;

        const results = `
AI Property Valuation Report

Estimated Value: ${formatCurrency(state.data.estimatedValue)}
Value Range: ${formatCurrency(state.data.valueRange.low)} - ${formatCurrency(state.data.valueRange.high)}
Confidence Level: ${state.data.confidence.toUpperCase()}

Key Factors:
${state.data.keyFactors.map(factor => `• ${factor}`).join('\n')}

Market Analysis:
${state.data.marketAnalysis}

Recommendations:
${state.data.recommendations.map(rec => `• ${rec}`).join('\n')}

${state.data.disclaimer}
    `.trim();

        navigator.clipboard.writeText(results);
        toast({ title: 'Results Copied', description: 'Property valuation results copied to clipboard.' });
    };

    const handleDownload = () => {
        if (!state.data) return;

        const content = `# AI Property Valuation Report

## Estimated Value
**${formatCurrency(state.data.estimatedValue)}**

**Value Range:** ${formatCurrency(state.data.valueRange.low)} - ${formatCurrency(state.data.valueRange.high)}

**Confidence Level:** ${state.data.confidence.toUpperCase()}

## Key Factors
${state.data.keyFactors.map(factor => `- ${factor}`).join('\n')}

## Comparable Properties
${state.data.comparableProperties.map(comp =>
            `- **${comp.address}** - ${formatCurrency(comp.price)}${comp.sqft ? ` (${comp.sqft} sqft)` : ''}${comp.beds && comp.baths ? ` - ${comp.beds}bd/${comp.baths}ba` : ''}${comp.saleDate ? ` - Sold: ${comp.saleDate}` : ''}`
        ).join('\n')}

## Market Analysis
${state.data.marketAnalysis}

## Recommendations
${state.data.recommendations.map(rec => `- ${rec}`).join('\n')}

---
${state.data.disclaimer}
`;

        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'property-valuation-report.md';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: 'Report Downloaded', description: 'Saved as property-valuation-report.md' });
    };

    return (
        <div className="space-y-8">
            <StandardCard
                title={<span className="font-headline">AI Property Valuation</span>}
                description="Get an instant, AI-powered market valuation based on a property description or address."
            >
                <form action={formAction} className="space-y-4">
                    <StandardFormField
                        label="Property Description or Address"
                        id="propertyDescription"
                        error={state.errors?.propertyDescription?.[0]}
                        hint="Provide a detailed property description or address. Include features like bedrooms, bathrooms, square footage, location, and condition for more accurate results."
                    >
                        <Textarea
                            id="propertyDescription"
                            name="propertyDescription"
                            placeholder="e.g., A beautiful 3-bedroom, 2-bathroom single-family home in a quiet suburban neighborhood of Sunnyvale, CA. Features a large backyard, newly renovated kitchen with granite countertops, and hardwood floors throughout. The property is approximately 1,800 sqft and was built in 1995. It's located close to excellent schools and parks."
                            rows={4}
                        />
                    </StandardFormField>
                    <SubmitButton disabled={isUserLoading} />
                    {state.message && state.message !== 'success' && (
                        <p className="text-sm text-destructive mt-4">{state.message}</p>
                    )}
                </form>
            </StandardCard>

            {/* AI Operation Progress */}
            {isPending && valuationOperation.tracker && (
                <AIOperationProgress
                    operationName="run-property-valuation"
                    tracker={valuationOperation.tracker}
                />
            )}

            {/* Valuation Results */}
            {state.data && (
                <div className="space-y-6">
                    {/* Main Valuation */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Home className="h-5 w-5" />
                                        Property Valuation
                                    </CardTitle>
                                    <CardDescription>
                                        AI-powered market valuation based on current data
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleCopyResults} variant="outline" size="sm">
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy
                                    </Button>
                                    <Button onClick={handleDownload} variant="outline" size="sm">
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Estimated Value */}
                            <div className="text-center p-6 bg-primary/5 rounded-lg border">
                                <div className="text-4xl font-bold text-primary mb-2">
                                    {formatCurrency(state.data.estimatedValue)}
                                </div>
                                <div className="text-lg text-muted-foreground mb-3">
                                    Estimated Market Value
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Range: {formatCurrency(state.data.valueRange.low)} - {formatCurrency(state.data.valueRange.high)}
                                </div>
                            </div>

                            {/* Confidence Level */}
                            <div className={cn(
                                "flex items-center gap-2 p-3 rounded-lg border",
                                getConfidenceColor(state.data.confidence)
                            )}>
                                {getConfidenceIcon(state.data.confidence)}
                                <div>
                                    <div className="font-medium capitalize">
                                        {state.data.confidence} Confidence
                                    </div>
                                    <div className="text-sm">
                                        Based on available market data and comparable properties
                                    </div>
                                </div>
                            </div>

                            {/* Key Factors */}
                            <div className="space-y-3">
                                <h4 className="font-headline font-semibold">Key Valuation Factors</h4>
                                <div className="grid gap-2">
                                    {state.data.keyFactors.map((factor, index) => (
                                        <div key={index} className="flex items-start gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                            <span className="text-sm">{factor}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comparable Properties */}
                    {state.data.comparableProperties.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Comparable Properties</CardTitle>
                                <CardDescription>
                                    Recent sales used in the valuation analysis
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {state.data.comparableProperties.map((comp, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-medium">{comp.address}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {comp.beds && comp.baths && `${comp.beds}bd/${comp.baths}ba`}
                                                    {comp.sqft && ` • ${comp.sqft.toLocaleString()} sqft`}
                                                    {comp.saleDate && ` • Sold: ${comp.saleDate}`}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold">{formatCurrency(comp.price)}</div>
                                                {comp.sqft && (
                                                    <div className="text-sm text-muted-foreground">
                                                        ${Math.round(comp.price / comp.sqft)}/sqft
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Market Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Market Analysis</CardTitle>
                            <CardDescription>
                                Current market conditions and trends
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm max-w-none">
                                <p className="text-sm leading-relaxed">{state.data.marketAnalysis}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recommendations */}
                    {state.data.recommendations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Recommendations</CardTitle>
                                <CardDescription>
                                    Actionable insights for property owners and buyers
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {state.data.recommendations.map((rec, index) => (
                                        <Alert key={index}>
                                            <CheckCircle className="h-4 w-4" />
                                            <AlertDescription>{rec}</AlertDescription>
                                        </Alert>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Disclaimer */}
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Important Disclaimer:</strong> {state.data.disclaimer}
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    );
}