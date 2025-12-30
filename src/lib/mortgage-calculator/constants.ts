export const LOAN_TERMS = [15, 20, 25, 30] as const;
export type LoanTerm = typeof LOAN_TERMS[number];

export const MORTGAGE_DEFAULTS = {
    homePrice: 400000,
    downPayment: 80000,
    loanTerm: 30 as LoanTerm,
    interestRate: 6.5,
    propertyTax: 1.2,
    homeInsurance: 0.5,
    pmi: 0.5,
    hoaFees: 0
} as const;

export const AFFORDABILITY_DEFAULTS = {
    monthlyIncome: 8000,
    monthlyDebts: 500,
    downPaymentAmount: 80000,
    interestRate: 6.5,
    loanTerm: 30 as LoanTerm,
    propertyTaxRate: 1.2,
    insuranceRate: 0.5,
    pmiRate: 0.5
} as const;

export const DEFAULT_SCENARIOS = [
    { name: '30-Year Fixed', rate: 6.5, term: 30 },
    { name: '15-Year Fixed', rate: 6.0, term: 15 },
    { name: '5/1 ARM', rate: 5.8, term: 30 }
] as const;

export const DEBT_TO_INCOME_RATIOS = {
    FRONT_END_MAX: 0.28,
    BACK_END_MAX: 0.36,
    CONSERVATIVE_MULTIPLIER: 0.8
} as const;