import { useState, useEffect, useMemo } from 'react';

export interface MortgageInputs {
    homePrice: number;
    downPayment: number;
    loanTerm: number;
    interestRate: number;
    propertyTax: number;
    homeInsurance: number;
    pmi: number;
    hoaFees: number;
}

export interface MortgageCalculation {
    loanAmount: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
    paymentBreakdown: {
        principal: number;
        interest: number;
        taxes: number;
        insurance: number;
        pmi: number;
        hoa: number;
    };
    amortizationSchedule: Array<{
        month: number;
        payment: number;
        principal: number;
        interest: number;
        balance: number;
    }>;
}

export function useMortgageCalculator(inputs: MortgageInputs) {
    const [calculation, setCalculation] = useState<MortgageCalculation | null>(null);

    const calculateMortgage = useMemo(() => {
        const {
            homePrice,
            downPayment,
            loanTerm,
            interestRate,
            propertyTax,
            homeInsurance,
            pmi,
            hoaFees
        } = inputs;

        const loanAmount = homePrice - downPayment;
        const monthlyRate = interestRate / 100 / 12;
        const numPayments = loanTerm * 12;

        // Calculate monthly principal and interest
        const monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                         (Math.pow(1 + monthlyRate, numPayments) - 1);

        // Calculate other monthly costs
        const monthlyTaxes = (homePrice * propertyTax / 100) / 12;
        const monthlyInsurance = (homePrice * homeInsurance / 100) / 12;
        const monthlyPMI = downPayment < homePrice * 0.2 ? (loanAmount * pmi / 100) / 12 : 0;
        const monthlyHOA = hoaFees;

        const totalMonthlyPayment = monthlyPI + monthlyTaxes + monthlyInsurance + monthlyPMI + monthlyHOA;
        const totalInterest = (monthlyPI * numPayments) - loanAmount;
        const totalPayment = loanAmount + totalInterest;

        // Generate amortization schedule (first 12 months)
        const amortizationSchedule = [];
        let remainingBalance = loanAmount;

        for (let month = 1; month <= Math.min(12, numPayments); month++) {
            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = monthlyPI - interestPayment;
            remainingBalance -= principalPayment;

            amortizationSchedule.push({
                month,
                payment: monthlyPI,
                principal: principalPayment,
                interest: interestPayment,
                balance: remainingBalance
            });
        }

        return {
            loanAmount,
            monthlyPayment: totalMonthlyPayment,
            totalInterest,
            totalPayment,
            paymentBreakdown: {
                principal: monthlyPI - (loanAmount * monthlyRate),
                interest: loanAmount * monthlyRate,
                taxes: monthlyTaxes,
                insurance: monthlyInsurance,
                pmi: monthlyPMI,
                hoa: monthlyHOA
            },
            amortizationSchedule
        };
    }, [inputs]);

    useEffect(() => {
        setCalculation(calculateMortgage);
    }, [calculateMortgage]);

    return calculation;
}