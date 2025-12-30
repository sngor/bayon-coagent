'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/common';
import type { AffordabilityInputs, AffordabilityAnalysis } from '@/hooks/use-affordability-calculator';

interface AffordabilityTabProps {
    inputs: AffordabilityInputs;
    onInputsChange: (inputs: AffordabilityInputs) => void;
    analysis: AffordabilityAnalysis | null;
}

export function AffordabilityTab({ inputs, onInputsChange, analysis }: AffordabilityTabProps) {
    const updateInput = (field: keyof AffordabilityInputs, value: number) => {
        onInputsChange({ ...inputs, [field]: value });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Affordability Inputs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Financial Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="monthlyIncome">Monthly Gross Income</Label>
                            <Input
                                id="monthlyIncome"
                                type="number"
                                value={inputs.monthlyIncome}
                                onChange={(e) => updateInput('monthlyIncome', Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="monthlyDebts">Monthly Debt Payments</Label>
                            <Input
                                id="monthlyDebts"
                                type="number"
                                value={inputs.monthlyDebts}
                                onChange={(e) => updateInput('monthlyDebts', Number(e.target.value))}
                            />
                            <div className="text-sm text-muted-foreground mt-1">
                                Include car loans, credit cards, student loans, etc.
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="downPaymentAmount">Available Down Payment</Label>
                            <Input
                                id="downPaymentAmount"
                                type="number"
                                value={inputs.downPaymentAmount}
                                onChange={(e) => updateInput('downPaymentAmount', Number(e.target.value))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="affordabilityRate">Interest Rate (%)</Label>
                                <Input
                                    id="affordabilityRate"
                                    type="number"
                                    step="0.01"
                                    value={inputs.interestRate}
                                    onChange={(e) => updateInput('interestRate', Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="affordabilityTerm">Loan Term (years)</Label>
                                <Select 
                                    value={inputs.loanTerm.toString()} 
                                    onValueChange={(value) => updateInput('loanTerm', Number(value))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 years</SelectItem>
                                        <SelectItem value="20">20 years</SelectItem>
                                        <SelectItem value="25">25 years</SelectItem>
                                        <SelectItem value="30">30 years</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Affordability Results */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Affordability Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {analysis && (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {formatCurrency(analysis.recommendedPrice)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Recommended Home Price</div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Maximum Home Price</span>
                                        <span className="font-medium">
                                            {formatCurrency(analysis.maxHomePrice)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Monthly Income</span>
                                        <span className="font-medium">
                                            {formatCurrency(analysis.monthlyIncome)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm">Front-End Ratio</span>
                                            <span className="text-sm">{analysis.frontEndRatio.toFixed(1)}%</span>
                                        </div>
                                        <Progress 
                                            value={analysis.frontEndRatio} 
                                            className="h-2"
                                        />
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Recommended: ≤ 28%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm">Back-End Ratio</span>
                                            <span className="text-sm">{analysis.backEndRatio.toFixed(1)}%</span>
                                        </div>
                                        <Progress 
                                            value={analysis.backEndRatio} 
                                            className="h-2"
                                        />
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Recommended: ≤ 36%
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Lightbulb className="h-4 w-4" />
                                        Recommendations
                                    </h4>
                                    <div className="space-y-2">
                                        {analysis.recommendations.map((rec, index) => (
                                            <div key={index} className="flex items-start gap-2">
                                                {rec.includes('good') ? (
                                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                )}
                                                <span className="text-sm">{rec}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}