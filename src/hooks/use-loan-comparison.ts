import { useMemo } from 'react';
import type { MortgageInputs } from './use-mortgage-calculator';

export interface LoanScenario {
    name: string;
    rate: number;
    term: number;
}

export interface ComparisonResult extends LoanScenario {
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
}

export function useLoanComparison(
    scenarios: LoanScenario[],
    homePrice: number,
    downPayment: number
) {
    return useMemo(() => {
        const loanAmount = homePrice - downPayment;
        
        return scenarios.map(scenario => {
            const monthlyRate = scenario.rate / 100 / 12;
            const numPayments = scenario.term * 12;

            const monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                             (Math.pow(1 + monthlyRate, numPayments) - 1);

            const totalInterest = (monthlyPI * numPayments) - loanAmount;

            return {
                ...scenario,
                monthlyPayment: monthlyPI,
                totalInterest,
                totalPayment: loanAmount + totalInterest
            };
        });
    }, [scenarios, homePrice, downPayment]);
}