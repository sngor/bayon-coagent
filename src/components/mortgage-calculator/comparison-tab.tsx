'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Lightbulb } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/common';
import type { ComparisonResult } from '@/hooks/use-loan-comparison';

interface ComparisonTabProps {
    homePrice: number;
    comparisonResults: ComparisonResult[];
}

export function ComparisonTab({ homePrice, comparisonResults }: ComparisonTabProps) {
    const lowestMonthlyPayment = Math.min(...comparisonResults.map(r => r.monthlyPayment));
    const lowestTotalInterest = Math.min(...comparisonResults.map(r => r.totalInterest));
    
    const bestMonthlyOption = comparisonResults.find(r => r.monthlyPayment === lowestMonthlyPayment);
    const bestInterestOption = comparisonResults.find(r => r.totalInterest === lowestTotalInterest);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Loan Comparison
                    </CardTitle>
                    <CardDescription>
                        Compare different loan scenarios based on your home price of {formatCurrency(homePrice)}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3">Loan Type</th>
                                    <th className="text-right p-3">Rate</th>
                                    <th className="text-right p-3">Term</th>
                                    <th className="text-right p-3">Monthly Payment</th>
                                    <th className="text-right p-3">Total Interest</th>
                                    <th className="text-right p-3">Total Payment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonResults.map((result, index) => (
                                    <tr key={index} className="border-b hover:bg-muted/50">
                                        <td className="p-3 font-medium">{result.name}</td>
                                        <td className="text-right p-3">{result.rate}%</td>
                                        <td className="text-right p-3">{result.term} years</td>
                                        <td className="text-right p-3">{formatCurrency(result.monthlyPayment)}</td>
                                        <td className="text-right p-3">{formatCurrency(result.totalInterest)}</td>
                                        <td className="text-right p-3 font-semibold">{formatCurrency(result.totalPayment)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Comparison Insights */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        Comparison Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Lowest Monthly Payment</h4>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(lowestMonthlyPayment)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {bestMonthlyOption?.name}
                            </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Lowest Total Interest</h4>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(lowestTotalInterest)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {bestInterestOption?.name}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}