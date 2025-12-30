'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, PieChart, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/common';
import type { MortgageInputs, MortgageCalculation } from '@/hooks/use-mortgage-calculator';

interface PaymentCalculatorTabProps {
    inputs: MortgageInputs;
    onInputsChange: (inputs: MortgageInputs) => void;
    calculation: MortgageCalculation | null;
}

export function PaymentCalculatorTab({ inputs, onInputsChange, calculation }: PaymentCalculatorTabProps) {
    const updateInput = (field: keyof MortgageInputs, value: number) => {
        onInputsChange({ ...inputs, [field]: value });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Loan Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="homePrice">Home Price</Label>
                            <Input
                                id="homePrice"
                                type="number"
                                value={inputs.homePrice}
                                onChange={(e) => updateInput('homePrice', Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="downPayment">Down Payment</Label>
                            <Input
                                id="downPayment"
                                type="number"
                                value={inputs.downPayment}
                                onChange={(e) => updateInput('downPayment', Number(e.target.value))}
                            />
                            <div className="text-sm text-muted-foreground mt-1">
                                {((inputs.downPayment / inputs.homePrice) * 100).toFixed(1)}% of home price
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="loanTerm">Loan Term (years)</Label>
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
                            <div>
                                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                                <Input
                                    id="interestRate"
                                    type="number"
                                    step="0.01"
                                    value={inputs.interestRate}
                                    onChange={(e) => updateInput('interestRate', Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="propertyTax">Property Tax (%)</Label>
                                <Input
                                    id="propertyTax"
                                    type="number"
                                    step="0.01"
                                    value={inputs.propertyTax}
                                    onChange={(e) => updateInput('propertyTax', Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="homeInsurance">Home Insurance (%)</Label>
                                <Input
                                    id="homeInsurance"
                                    type="number"
                                    step="0.01"
                                    value={inputs.homeInsurance}
                                    onChange={(e) => updateInput('homeInsurance', Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="pmi">PMI (%)</Label>
                                <Input
                                    id="pmi"
                                    type="number"
                                    step="0.01"
                                    value={inputs.pmi}
                                    onChange={(e) => updateInput('pmi', Number(e.target.value))}
                                    disabled={inputs.downPayment >= inputs.homePrice * 0.2}
                                />
                            </div>
                            <div>
                                <Label htmlFor="hoaFees">HOA Fees (monthly)</Label>
                                <Input
                                    id="hoaFees"
                                    type="number"
                                    value={inputs.hoaFees}
                                    onChange={(e) => updateInput('hoaFees', Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Monthly Payment Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {calculation && (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-primary">
                                        {formatCurrency(calculation.monthlyPayment)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Total Monthly Payment</div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Principal & Interest</span>
                                        <span className="font-medium">
                                            {formatCurrency(calculation.paymentBreakdown.principal + calculation.paymentBreakdown.interest)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Property Taxes</span>
                                        <span className="font-medium">
                                            {formatCurrency(calculation.paymentBreakdown.taxes)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Home Insurance</span>
                                        <span className="font-medium">
                                            {formatCurrency(calculation.paymentBreakdown.insurance)}
                                        </span>
                                    </div>
                                    {calculation.paymentBreakdown.pmi > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">PMI</span>
                                            <span className="font-medium">
                                                {formatCurrency(calculation.paymentBreakdown.pmi)}
                                            </span>
                                        </div>
                                    )}
                                    {calculation.paymentBreakdown.hoa > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">HOA Fees</span>
                                            <span className="font-medium">
                                                {formatCurrency(calculation.paymentBreakdown.hoa)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Loan Amount</span>
                                        <span>{formatCurrency(calculation.loanAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Total Interest</span>
                                        <span>{formatCurrency(calculation.totalInterest)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Total Payment</span>
                                        <span className="font-semibold">{formatCurrency(calculation.totalPayment)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Amortization Schedule */}
            {calculation && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            First Year Amortization Schedule
                        </CardTitle>
                        <CardDescription>
                            See how your payments are split between principal and interest
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                    {calculation.amortizationSchedule.map((row) => (
                                        <tr key={row.month} className="border-b">
                                            <td className="p-2">{row.month}</td>
                                            <td className="text-right p-2">{formatCurrency(row.payment)}</td>
                                            <td className="text-right p-2">{formatCurrency(row.principal)}</td>
                                            <td className="text-right p-2">{formatCurrency(row.interest)}</td>
                                            <td className="text-right p-2">{formatCurrency(row.balance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}