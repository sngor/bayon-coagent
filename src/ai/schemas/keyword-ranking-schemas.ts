import { z } from 'zod';

/**
 * Schema for getting keyword rankings
 * Aligned with the actual implementation interface
 */
export const GetKeywordRankingsInputSchema = z.object({
  keywords: z.array(z.string()).describe('Array of keywords to check rankings for'),
  location: z.string().describe('The location to search for rankings'),
  domain: z.string().optional().describe('Optional domain to check rankings for'),
  competitors: z.array(z.string()).optional().describe('Optional competitor domains to compare against'),
});

export const KeywordRankingSchema = z.object({
  keyword: z.string().describe('The keyword'),
  position: z.number().describe('The ranking position'),
  url: z.string().describe('The URL that ranks for this keyword'),
  searchVolume: z.number().describe('Monthly search volume'),
  difficulty: z.number().describe('Keyword difficulty score (0-100)'),
  trend: z.enum(['up', 'down', 'stable']).describe('Ranking trend'),
});

export const GetKeywordRankingsOutputSchema = z.object({
  rankings: z.array(KeywordRankingSchema).describe('Array of keyword rankings'),
  totalKeywords: z.number().describe('Total number of keywords analyzed'),
  averagePosition: z.number().describe('Average ranking position'),
  topRankingKeywords: z.array(KeywordRankingSchema).describe('Keywords ranking in top 10'),
  improvementOpportunities: z.array(KeywordRankingSchema).describe('Keywords with improvement potential'),
  competitorComparison: z.array(z.object({
    domain: z.string(),
    rankings: z.array(KeywordRankingSchema),
  })).optional().describe('Competitor ranking comparison'),
});

export type GetKeywordRankingsInput = z.infer<typeof GetKeywordRankingsInputSchema>;
export type GetKeywordRankingsOutput = z.infer<typeof GetKeywordRankingsOutputSchema>;
export type KeywordRanking = z.infer<typeof KeywordRankingSchema>;
