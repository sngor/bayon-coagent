/**
 * Property-based tests for keyword rankings
 * 
 * Feature: ai-model-optimization, Property 14: Keyword rankings return up to 5 results
 * Validates: Requirements 9.2, 9.4
 */

import * as fc from 'fast-check';
import { describe, it, expect } from '@jest/globals';
import { getKeywordRankings } from '../flows/get-keyword-rankings';
import type { GetKeywordRankingsInput } from '../flows/get-keyword-rankings';

/**
 * Generator for valid keyword ranking inputs
 */
const keywordRankingInputArbitrary = (): fc.Arbitrary<GetKeywordRankingsInput> => {
  return fc.record({
    location: fc.constantFrom(
      'New York, NY',
      'Los Angeles, CA',
      'Chicago, IL',
      'Houston, TX',
      'Phoenix, AZ',
      'Miami, FL',
      'Seattle, WA',
      'Boston, MA',
      'Denver, CO',
      'Austin, TX'
    ),
    keyword: fc.constantFrom(
      'real estate agent',
      'homes for sale',
      'luxury real estate',
      'buy house',
      'sell home',
      'property listings',
      'realtor near me',
      'real estate broker',
      'home buyer agent',
      'listing agent'
    )
  });
};

describe('Keyword Rankings Property Tests', () => {
  // Check if required API keys are available
  const hasApiKeys = process.env.TAVILY_API_KEY && 
                     process.env.TAVILY_API_KEY !== 'your-tavily-api-key' &&
                     process.env.AWS_BEDROCK_REGION;
  
  if (!hasApiKeys) {
    console.warn('\n⚠️  Skipping keyword rankings property tests: Missing API keys');
    console.warn('   Set TAVILY_API_KEY and AWS_BEDROCK_REGION to run these tests\n');
  }
  
  const describeOrSkip = hasApiKeys ? describe : describe.skip;
  
  describeOrSkip('Property 14: Keyword rankings return up to 5 results', () => {
    /**
     * For any keyword ranking request, the system should return up to 5 ranked agents
     * with positions 1-5
     * 
     * Requirements 9.2, 9.4
     */
    it('should return up to 5 ranked agents for any valid input', async () => {
      await fc.assert(
        fc.asyncProperty(
          keywordRankingInputArbitrary(),
          async (input) => {
            const output = await getKeywordRankings(input);
            
            // Should have a rankings array
            expect(output).toHaveProperty('rankings');
            expect(Array.isArray(output.rankings)).toBe(true);
            
            // Should return up to 5 results
            expect(output.rankings.length).toBeGreaterThanOrEqual(0);
            expect(output.rankings.length).toBeLessThanOrEqual(5);
            
            return true;
          }
        ),
        { numRuns: 10 } // Reduced runs since this calls real AI
      );
    }, 120000); // 2 minute timeout for AI calls

    /**
     * Each ranking should have all required fields
     * Requirements 9.2, 9.4
     */
    it('should return rankings with all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          keywordRankingInputArbitrary(),
          async (input) => {
            const output = await getKeywordRankings(input);
            
            // Each ranking should have all required fields
            output.rankings.forEach(ranking => {
              expect(ranking).toHaveProperty('rank');
              expect(ranking).toHaveProperty('agentName');
              expect(ranking).toHaveProperty('agency');
              expect(ranking).toHaveProperty('url');
              
              // Fields should be the correct type
              expect(typeof ranking.rank).toBe('number');
              expect(typeof ranking.agentName).toBe('string');
              expect(typeof ranking.agency).toBe('string');
              expect(typeof ranking.url).toBe('string');
              
              // Agent name and agency should not be empty
              expect(ranking.agentName.trim().length).toBeGreaterThan(0);
              expect(ranking.agency.trim().length).toBeGreaterThan(0);
            });
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 120000);

    /**
     * Rank positions should be between 1 and 5
     * Requirements 9.4
     */
    it('should assign rank positions from 1 to 5', async () => {
      await fc.assert(
        fc.asyncProperty(
          keywordRankingInputArbitrary(),
          async (input) => {
            const output = await getKeywordRankings(input);
            
            // Each rank should be between 1 and 5
            output.rankings.forEach(ranking => {
              expect(ranking.rank).toBeGreaterThanOrEqual(1);
              expect(ranking.rank).toBeLessThanOrEqual(5);
            });
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 120000);

    /**
     * Rank positions should be unique (no duplicates)
     * Requirements 9.4
     */
    it('should return unique rank positions without duplicates', async () => {
      await fc.assert(
        fc.asyncProperty(
          keywordRankingInputArbitrary(),
          async (input) => {
            const output = await getKeywordRankings(input);
            
            // Check for duplicate ranks
            const ranks = output.rankings.map(r => r.rank);
            const uniqueRanks = new Set(ranks);
            
            expect(uniqueRanks.size).toBe(ranks.length);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 120000);

    /**
     * Ranks should be in sequential order starting from 1
     * Requirements 9.4
     */
    it('should return ranks in sequential order', async () => {
      await fc.assert(
        fc.asyncProperty(
          keywordRankingInputArbitrary(),
          async (input) => {
            const output = await getKeywordRankings(input);
            
            if (output.rankings.length > 0) {
              // Sort ranks to check if they're sequential
              const sortedRanks = [...output.rankings.map(r => r.rank)].sort((a, b) => a - b);
              
              // First rank should be 1
              expect(sortedRanks[0]).toBe(1);
              
              // Each subsequent rank should be previous + 1
              for (let i = 1; i < sortedRanks.length; i++) {
                expect(sortedRanks[i]).toBe(sortedRanks[i - 1] + 1);
              }
            }
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 120000);

    /**
     * Agent names should be unique (no duplicates)
     * Requirements 9.2
     */
    it('should return unique agents without duplicates', async () => {
      await fc.assert(
        fc.asyncProperty(
          keywordRankingInputArbitrary(),
          async (input) => {
            const output = await getKeywordRankings(input);
            
            // Check for duplicate agent names
            const agentNames = output.rankings.map(r => r.agentName.toLowerCase().trim());
            const uniqueAgentNames = new Set(agentNames);
            
            expect(uniqueAgentNames.size).toBe(agentNames.length);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 120000);
  });

  describeOrSkip('Keyword Rankings Edge Cases', () => {
    /**
     * Should handle common real estate keywords
     */
    it('should handle common real estate keywords', async () => {
      const input: GetKeywordRankingsInput = {
        location: 'New York, NY',
        keyword: 'real estate agent'
      };

      const output = await getKeywordRankings(input);
      
      expect(output).toHaveProperty('rankings');
      expect(Array.isArray(output.rankings)).toBe(true);
      expect(output.rankings.length).toBeGreaterThanOrEqual(0);
      expect(output.rankings.length).toBeLessThanOrEqual(5);
    }, 60000);

    /**
     * Should handle specific niche keywords
     */
    it('should handle specific niche keywords', async () => {
      const input: GetKeywordRankingsInput = {
        location: 'Miami, FL',
        keyword: 'luxury waterfront real estate'
      };

      const output = await getKeywordRankings(input);
      
      expect(output).toHaveProperty('rankings');
      expect(Array.isArray(output.rankings)).toBe(true);
      expect(output.rankings.length).toBeGreaterThanOrEqual(0);
      expect(output.rankings.length).toBeLessThanOrEqual(5);
    }, 60000);

    /**
     * Should handle small markets
     */
    it('should handle small markets gracefully', async () => {
      const input: GetKeywordRankingsInput = {
        location: 'Small Town, WY',
        keyword: 'homes for sale'
      };

      const output = await getKeywordRankings(input);
      
      // In small markets, might return fewer than 5 results
      expect(output).toHaveProperty('rankings');
      expect(Array.isArray(output.rankings)).toBe(true);
      expect(output.rankings.length).toBeGreaterThanOrEqual(0);
      expect(output.rankings.length).toBeLessThanOrEqual(5);
    }, 60000);

    /**
     * Should handle large competitive markets
     */
    it('should handle large competitive markets', async () => {
      const input: GetKeywordRankingsInput = {
        location: 'Los Angeles, CA',
        keyword: 'realtor near me'
      };

      const output = await getKeywordRankings(input);
      
      // In large markets, should return up to 5 results
      expect(output).toHaveProperty('rankings');
      expect(Array.isArray(output.rankings)).toBe(true);
      expect(output.rankings.length).toBeGreaterThanOrEqual(0);
      expect(output.rankings.length).toBeLessThanOrEqual(5);
    }, 60000);

    /**
     * Should handle different keyword formats
     */
    it('should handle different keyword formats', async () => {
      const testCases = [
        { location: 'Chicago, IL', keyword: 'buy house' },
        { location: 'Houston, TX', keyword: 'sell home fast' },
        { location: 'Phoenix, AZ', keyword: 'best realtor' }
      ];

      for (const input of testCases) {
        const output = await getKeywordRankings(input);
        
        expect(output).toHaveProperty('rankings');
        expect(Array.isArray(output.rankings)).toBe(true);
        expect(output.rankings.length).toBeGreaterThanOrEqual(0);
        expect(output.rankings.length).toBeLessThanOrEqual(5);
      }
    }, 120000);
  });
});
