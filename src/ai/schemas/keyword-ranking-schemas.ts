import { z } from 'zod';

/**
 * Schema for getting keyword rankings
 */
export const GetKeywordRankingsInputSchema = z.object({
  location: z.string().describe('The location to search for rankings'),
  keyword: z.string().describe('The keyword to check rankings for'),
});

export const GetKeywordRankingsOutputSchema = z.object({
  rankings: z.array(z.object({
    rank: z.number().describe('The ranking position'),
    agentName: z.string().describe('The agent name'),
    agency: z.string().describe('The agency name'),
    url: z.string().describe('The agent website URL'),
  })).describe('Array of top ranking agents'),
});

export type GetKeywordRankingsInput = z.infer<typeof GetKeywordRankingsInputSchema>;
export type GetKeywordRankingsOutput = z.infer<typeof GetKeywordRankingsOutputSchema>;
