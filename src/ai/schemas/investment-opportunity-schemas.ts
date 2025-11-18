import { z } from 'zod';

/**
 * Schema for investment opportunity identification
 */
export const investmentOpportunityIdentificatorSchema = z.object({
  market_data: z.string().min(1, 'Market data is required'),
});

export type InvestmentOpportunityInput = z.infer<typeof investmentOpportunityIdentificatorSchema>;
