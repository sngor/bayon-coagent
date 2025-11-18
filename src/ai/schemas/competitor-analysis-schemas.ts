import { z } from 'zod';

/**
 * Schema for finding and analyzing competitors
 */
export const FindCompetitorsInputSchema = z.object({
  name: z.string().describe('The agent name'),
  agencyName: z.string().describe('The agency name'),
  address: z.string().describe('The agent primary market address'),
});

export const EnrichCompetitorDataInputSchema = z.object({
  name: z.string().describe('The competitor agent name'),
  agency: z.string().describe('The competitor agency name'),
});

export const EnrichCompetitorDataOutputSchema = z.object({
  reviewCount: z.number().describe('Total number of online reviews'),
  avgRating: z.number().describe('Average review rating out of 5'),
  socialFollowers: z.number().describe('Total social media followers'),
  domainAuthority: z.number().describe('Domain authority score 0-100'),
});

const CompetitorSchema = z.object({
  name: z.string().describe('The competitor agent name'),
  agency: z.string().describe('The competitor agency name'),
  reviewCount: z.number().describe('Total number of online reviews'),
  avgRating: z.number().describe('Average review rating out of 5'),
  socialFollowers: z.number().describe('Total social media followers'),
  domainAuthority: z.number().describe('Domain authority score 0-100'),
});

export const FindCompetitorsOutputSchema = z.object({
  competitors: z.array(CompetitorSchema).describe('Array of competitor data'),
});

export type FindCompetitorsInput = z.infer<typeof FindCompetitorsInputSchema>;
export type FindCompetitorsOutput = z.infer<typeof FindCompetitorsOutputSchema>;
export type EnrichCompetitorDataInput = z.infer<typeof EnrichCompetitorDataInputSchema>;
export type EnrichCompetitorDataOutput = z.infer<typeof EnrichCompetitorDataOutputSchema>;
