'use client';

import { useActionState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { runRenovationROIAction } from '@/app/actions';
import { type RenovationROIOutput } from '@/aws/bedrock/flows';
import {
    Calculator,
    DollarSign,
    Home,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Copy,
    MapPin,
    Wrench,
    Lightbulb,
    Star,
    Loader2,
    Clock,
    Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const renovationTypes = [
    { value: 'minor-kitchen', label: 'Minor Kitchen Remodel', description: 'Countertops, cabinet refacing, appliances' },
    { value: 'major-kitchen', label: 'Major Kitchen Remodel', description: 'Complete kitchen renovation' },
    { value: 'bathroom-remodel', label: 'Bathroom Remodel', description: 'Mid-range bathroom renovation' },
    { value: 'master-suite', label: 'Master Suite Addition', description: 'Bedroom and bathroom addition' },
    { value: 'deck-addition', label: 'Deck Addition', description: 'Wood deck addition' },
    { value: 'window-replacement', label: 'Window Replacement', description: 'Vinyl or wood windows' },
    { value: 'siding-replacement', label: 'Siding Replacement', description: 'Vinyl or fiber cement siding' },
    { value: 'roof-replacement', label: 'Roof Replacement', description: 'Asphalt shingle roof' },
    { value: 'basement-remodel', label: 'Basement Remodel', description: 'Finished basement space' },
    { value: 'attic-bedroom', label: 'Attic Bedroom', description: 'Convert attic to bedroom' },
    { value: 'garage-door', label: 'Garage Door Replacement', description: 'Upscale garage door' },
    { value: 'entry-door', label: 'Entry Door Replacement', description: 'Steel entry door' },
    { value: 'hardwood-floors', label: 'Hardwood Floor Refinishing', description: 'Sand and refinish existing floors' },
    { value: 'insulation', label: 'Insulation Upgrade', description: 'Attic and wall insulation' },
    { value: 'hvac-system', label: 'HVAC System', description: 'New heating and cooling system' },
];

const propertyTypes = [
    { value: 'single-family', label: 'Single Family Home' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'condo', label: 'Condominium' },
    { value: 'multi-family', label: 'Multi-Family' },
];

const marketConditions = [
    { value: 'hot', label: 'Hot Market', description: 'High demand, low inventory' },
    { value: 'balanced', label: 'Balanced Market', description: 'Normal supply and demand' },
    { value: 'cool', label: 'Cool Market', description: 'High inventory, slower sales' },
];

const renovationROIInitialState = {
    message: '',
    data: null as RenovationROIOutput | null,
    errors: {},
};

export function RenovationROICalculator() {
    const [state, formAction, isPending] = useActionState(
        runRenovationROIAction,
        renovationROIInitialState
    );

    const copyResults = () => {
        if (!state.data) return;

        const results = `
Renovation ROI Analysis

Property Details:
Current Value: ${formatCurrency(state.data.estimatedNewValue - state.data.valueIncrease)}
Renovation Cost: ${formatCurrency(state.data.estimatedNewValue - state.data.valueIncrease - state.data.valueIncrease + (state.data.valueIncrease / (state.data.roi / 100)))}

ROI Analysis:
New Estimated Value: ${formatCurrency(state.data.estimatedNewValue)}
Value Increase: +${formatCurrency(state.data.valueIncrease)}
Estimated ROI: ${state.data.roi.toFixed(0)}%
ROI Category: ${state.data.roiCategory.toUpperCase()}
Confidence: ${state.data.confidence.toUpperCase()}

Market Factors:
${state.data.marketFactors.locationImpact}
${state.data.marketFactors.marketConditionImpact}
Demand Level: ${state.data.marketFactors.demandLevel}

AI Analysis:
${state.data.analysis}

Key Factors:
${state.data.keyFactors.map(factor => `• ${factor}`).join('\n')}

Recommendations:
${state.data.recommendations.map(rec => `• ${rec}`).join('\n')}

Timeline:
Duration: ${state.data.timeline.estimatedDuration}
Best Timing: ${state.data.timeline.bestTiming}

${state.data.disclaimer}
        `.trim();

        navigator.clipboard.writeText(results);
        toast({ title: 'Results Copied', description: 'Renovation ROI analysis copied to clipboard.' });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getROIColor = (category: string) => {
        switch (category) {
            case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
            case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'poor': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getROIIcon = (category: string) => {
        switch (category) {
            case 'excellent': return <Star className="h-4 w-4" />;
            case 'good': return <CheckCircle className="h-4 w-4" />;
            case 'fair': return <AlertTriangle className="h-4 w-4" />;
            case 'poor': return <TrendingDown className="h-4 w-4" />;
            default: return <Calculator className="h-4 w-4" />;
        }
    };

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case 'high': return 'text-green-600 bg-green-50';
            case 'medium': return 'text-yellow-600 bg-yellow-50';
            case 'low': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Input Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wrench className="h-5 w-5" />
                            Renovation ROI Calculator
                        </CardTitle>
                        <CardDescription>
                            Get AI-powered estimates of your renovation's financial impact
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={formAction} className="space-y-6">
                            {/* Current Property Value */}
                            <div className="space-y-2">
                                <Label htmlFor="currentValue" className="flex items-center gap-2">
                                    <Home className="h-4 w-4" />
                                    Current Property Value
                                </Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="currentValue"
                                        name="currentValue"
                                        type="number"
                                        defaultValue="500000"
                                        className="pl-10"
                                        placeholder="500000"
                                        required
                                    />
                                </div>
                                {state.errors?.currentValue && (
                                    <p className="text-sm text-red-600">{state.errors.currentValue[0]}</p>
                                )}
                            </div>

                            {/* Renovation Type */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Wrench className="h-4 w-4" />
                                    Renovation Type
                                </Label>
                                <Select name="renovationType" defaultValue="minor-kitchen" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select renovation type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {renovationTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                <div>
                                                    <div className="font-medium">{type.label}</div>
                                                    <div className="text-xs text-muted-foreground">{type.description}</div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {state.errors?.renovationType && (
                                    <p className="text-sm text-red-600">{state.errors.renovationType[0]}</p>
                                )}
                            </div>

                            {/* Renovation Cost */}
                            <div className="space-y-2">
                                <Label htmlFor="renovationCost" className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Projected Renovation Cost
                                </Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="renovationCost"
                                        name="renovationCost"
                                        type="number"
                                        defaultValue="25000"
                                        className="pl-10"
                                        placeholder="25000"
                                        required
                                    />
                                </div>
                                {state.errors?.renovationCost && (
                                    <p className="text-sm text-red-600">{state.errors.renovationCost[0]}</p>
                                )}
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <Label htmlFor="location" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Property Location (Optional)
                                </Label>
                                <Input
                                    id="location"
                                    name="location"
                                    type="text"
                                    placeholder="e.g., Austin, TX"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Location helps adjust ROI estimates for local market conditions
                                </p>
                            </div>

                            <Separator />

                            {/* Property Type */}
                            <div className="space-y-2">
                                <Label>Property Type</Label>
                                <Select name="propertyType" defaultValue="single-family" required>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {propertyTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {state.errors?.propertyType && (
                                    <p className="text-sm text-red-600">{state.errors.propertyType[0]}</p>
                                )}
                            </div>

                            {/* Market Condition */}
                            <div className="space-y-2">
                                <Label>Current Market Condition</Label>
                                <Select name="marketCondition" defaultValue="balanced" required>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {marketConditions.map((condition) => (
                                            <SelectItem key={condition.value} value={condition.value}>
                                                <div>
                                                    <div className="font-medium">{condition.label}</div>
                                                    <div className="text-xs text-muted-foreground">{condition.description}</div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {state.errors?.marketCondition && (
                                    <p className="text-sm text-red-600">{state.errors.marketCondition[0]}</p>
                                )}
                            </div>

                            {/* Additional Details */}
                            <div className="space-y-2">
                                <Label htmlFor="additionalDetails">Additional Details (Optional)</Label>
                                <Textarea
                                    id="additionalDetails"
                                    name="additionalDetails"
                                    placeholder="Any specific details about the renovation or property..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Calculator className="h-4 w-4 mr-2" />
                                            Analyze ROI
                                        </>
                                    )}
                                </Button>
                                <Button type="button" onClick={copyResults} variant="outline" disabled={!state.data}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Results
                                </Button>
                            </div>

                            {state.message && state.message !== 'success' && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{state.message}</AlertDescription>
                                </Alert>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Results */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            AI-Powered ROI Analysis
                        </CardTitle>
                        <CardDescription>
                            Comprehensive renovation return on investment analysis
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isPending ? (
                            <div className="text-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Analyzing renovation ROI with AI...</p>
                                <p className="text-xs text-muted-foreground mt-2">This may take 10-30 seconds</p>
                            </div>
                        ) : state.data ? (
                            <>
                                {/* New Estimated Value */}
                                <div className="text-center p-6 bg-primary/5 rounded-lg border">
                                    <div className="text-sm text-muted-foreground mb-1">New Estimated Value</div>
                                    <div className="text-3xl font-bold text-primary">
                                        {formatCurrency(state.data.estimatedNewValue)}
                                    </div>
                                </div>

                                {/* Value Increase and ROI */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                        <div className="text-sm text-green-600 mb-1">Value Increase</div>
                                        <div className="text-xl font-bold text-green-700">
                                            +{formatCurrency(state.data.valueIncrease)}
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="text-sm text-blue-600 mb-1">Estimated ROI</div>
                                        <div className="text-xl font-bold text-blue-700">
                                            {state.data.roi.toFixed(0)}%
                                        </div>
                                    </div>
                                </div>

                                {/* ROI Category and Confidence */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={cn(
                                        "flex items-center gap-2 p-3 rounded-lg border",
                                        getROIColor(state.data.roiCategory)
                                    )}>
                                        {getROIIcon(state.data.roiCategory)}
                                        <div>
                                            <div className="font-medium capitalize">
                                                {state.data.roiCategory} ROI
                                            </div>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-2 p-3 rounded-lg border",
                                        getConfidenceColor(state.data.confidence)
                                    )}>
                                        <Target className="h-4 w-4" />
                                        <div>
                                            <div className="font-medium capitalize">
                                                {state.data.confidence} Confidence
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Market Factors */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Market Factors</h4>
                                    <div className="space-y-3">
                                        <div className="text-sm">
                                            <div className="font-medium text-muted-foreground mb-1">Location Impact</div>
                                            <div>{state.data.marketFactors.locationImpact}</div>
                                        </div>
                                        <div className="text-sm">
                                            <div className="font-medium text-muted-foreground mb-1">Market Condition Impact</div>
                                            <div>{state.data.marketFactors.marketConditionImpact}</div>
                                        </div>
                                        <div className="text-sm">
                                            <div className="font-medium text-muted-foreground mb-1">Demand Level</div>
                                            <div>{state.data.marketFactors.demandLevel}</div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* AI Analysis */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Lightbulb className="h-4 w-4" />
                                        AI Analysis
                                    </h4>
                                    <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                                        {state.data.analysis}
                                    </div>
                                </div>

                                {/* Key Factors */}
                                {state.data.keyFactors.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">Key Factors</h4>
                                        <div className="space-y-2">
                                            {state.data.keyFactors.map((factor, index) => (
                                                <div key={index} className="flex items-start gap-2 text-sm">
                                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>{factor}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {state.data.recommendations.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">Recommendations</h4>
                                        <div className="space-y-2">
                                            {state.data.recommendations.map((rec, index) => (
                                                <Alert key={index}>
                                                    <Lightbulb className="h-4 w-4" />
                                                    <AlertDescription>{rec}</AlertDescription>
                                                </Alert>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Timeline */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Timeline Considerations
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <div className="text-sm text-muted-foreground">Estimated Duration</div>
                                            <div className="font-medium">{state.data.timeline.estimatedDuration}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-sm text-muted-foreground">Best Timing</div>
                                            <div className="font-medium">{state.data.timeline.bestTiming}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Risk Factors */}
                                {state.data.riskFactors.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            Risk Factors
                                        </h4>
                                        <div className="space-y-2">
                                            {state.data.riskFactors.map((risk, index) => (
                                                <Alert key={index} variant="destructive">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <AlertDescription>{risk}</AlertDescription>
                                                </Alert>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Comparable Renovations */}
                                {state.data.comparableRenovations.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">Comparable Renovations</h4>
                                        <div className="space-y-3">
                                            {state.data.comparableRenovations.map((comp, index) => (
                                                <div key={index} className="p-3 border rounded-lg">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="font-medium">{comp.renovationType}</div>
                                                        <Badge variant="outline">{comp.roi.toFixed(0)}% ROI</Badge>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Cost: {formatCurrency(comp.cost)} • Value Added: {formatCurrency(comp.valueAdded)}
                                                        {comp.location && ` • ${comp.location}`}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Disclaimer */}
                                <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded border">
                                    {state.data.disclaimer}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Enter renovation details and click "Analyze ROI" to get AI-powered insights
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}