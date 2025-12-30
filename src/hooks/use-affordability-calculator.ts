import { useState, useEffect, useMemo } from 'react';

export interface AffordabilityInputs {
    monthlyIncome: number;
    monthlyDebts: number;
    downPaymentAmount: number;
    interestRate: number;
    loanTerm: number;
    propertyTaxRate: number;
    insuranceRate: number;
    pmiRate: number;
}

export interface AffordabilityAnalysis {
    maxHomePrice: number;
    recommendedPrice: number;
    monthlyIncome: number;
    debtToIncomeRatio: number;
    frontEndRatio: number;
    backEndRatio: number;
    recommendations: string[];
}

export function useAffordabilityCalculator(inputs: AffordabilityInputs) {
    const [analysis, setAnalysis] = useState<AffordabilityAnalysis | null>(null);

    const calculateAffordability = useMemo(() => {
        const {
            monthlyIncome,
            monthlyDebts,
            downPaymentAmount,
            interestRate,
            loanTerm,
            propertyTaxRate,
            insuranceRate,
            pmiRate
        } = inputs;

        const monthlyRate = interestRate / 100 / 12;
        const numPayments = loanTerm * 12;

        // Calculate maximum monthly housing payment (28% of gross income)
        const maxHousingPayment = monthlyIncome * 0.28;
        
        // Calculate maximum total debt payment (36% of gross income)
        const maxTotalDebt = monthlyIncome * 0.36;
        const maxHousingPaymentWithDebt = maxTotalDebt - monthlyDebts;

        // Use the lower of the two limits
        const maxMonthlyPayment = Math.min(maxHousingPayment, maxHousingPaymentWithDebt);

        // Estimate other costs as percentage of home price
        const estimatedOtherCosts = 0.02; // 2% for taxes, insurance, PMI

        // Calculate maximum loan amount
        const maxLoanAmount = maxMonthlyPayment / (1 + estimatedOtherCosts) * 
                             (Math.pow(1 + monthlyRate, numPayments) - 1) / 
                             (monthlyRate * Math.pow(1 + monthlyRate, numPayments));

        const maxHomePrice = maxLoanAmount + downPaymentAmount;
        const recommendedPrice = maxHomePrice * 0.8; // Conservative recommendation

        const frontEndRatio = (maxHousingPayment / monthlyIncome) * 100;
        const backEndRatio = ((monthlyDebts + maxHousingPayment) / monthlyIncome) * 100;

        const recommendations = [];
        if (frontEndRatio > 28) {
            recommendations.push('Consider increasing your income or reducing the home price target');
        }
        if (backEndRatio > 36) {
            recommendations.push('Pay down existing debts to improve your debt-to-income ratio');
        }
        if (downPaymentAmount < maxHomePrice * 0.2) {
            recommendations.push('Consider saving for a larger down payment to avoid PMI');
        }
        if (recommendations.length === 0) {
            recommendations.push('Your finances look good for homebuying!');
        }

        return {
            maxHomePrice,
            recommendedPrice,
            monthlyIncome,
            debtToIncomeRatio: ((monthlyDebts / monthlyIncome) * 100),
            frontEndRatio,
            backEndRatio,
            recommendations
        };
    }, [inputs]);

    useEffect(() => {
        setAnalysis(calculateAffordability);
    }, [calculateAffordability]);

    return analysis;
}