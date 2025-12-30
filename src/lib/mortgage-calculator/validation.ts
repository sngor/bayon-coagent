import { z } from 'zod';

export const mortgageInputsSchema = z.object({
    homePrice: z.number().min(1000, 'Home price must be at least $1,000').max(50000000, 'Home price too high'),
    downPayment: z.number().min(0, 'Down payment cannot be negative'),
    loanTerm: z.number().min(1).max(50),
    interestRate: z.number().min(0.1, 'Interest rate must be at least 0.1%').max(30, 'Interest rate too high'),
    propertyTax: z.number().min(0).max(10),
    homeInsurance: z.number().min(0).max(5),
    pmi: z.number().min(0).max(5),
    hoaFees: z.number().min(0).max(10000)
}).refine(
    (data) => data.downPayment <= data.homePrice,
    {
        message: "Down payment cannot exceed home price",
        path: ["downPayment"]
    }
);

export const affordabilityInputsSchema = z.object({
    monthlyIncome: z.number().min(1000, 'Monthly income must be at least $1,000'),
    monthlyDebts: z.number().min(0, 'Monthly debts cannot be negative'),
    downPaymentAmount: z.number().min(0, 'Down payment cannot be negative'),
    interestRate: z.number().min(0.1).max(30),
    loanTerm: z.number().min(1).max(50),
    propertyTaxRate: z.number().min(0).max(10),
    insuranceRate: z.number().min(0).max(5),
    pmiRate: z.number().min(0).max(5)
});

export type MortgageInputs = z.infer<typeof mortgageInputsSchema>;
export type AffordabilityInputs = z.infer<typeof affordabilityInputsSchema>;

export function validateMortgageInputs(inputs: unknown): MortgageInputs {
    return mortgageInputsSchema.parse(inputs);
}

export function validateAffordabilityInputs(inputs: unknown): AffordabilityInputs {
    return affordabilityInputsSchema.parse(inputs);
}