/**
 * Property-based tests for search failure handling
 * 
 * Feature: ai-model-optimization, Property 9: Search failures don't crash flows
 * Validates: Requirements 5.1
 */

import * as fc from 'fast-check';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { runNapAudit } from '../flows/run-nap-audit';
import { findCompetitors, enrichCompetitorData } from '../flows/find-competitors';
import { getKeywordRankings } from '../flows/get-keyword-rankings';
import type { RunNapAuditInput } from '../flows/run-nap-audit';
import type { FindCompetitorsInput, EnrichCompetitorDataInput } from '../flows/find-competitors';
import type { GetKeywordRankingsInput } from '../flows/get-keyword-rankings';
import * as searchModule from '@/aws/search';

/**
 * Generator for NAP audit inputs
 */
const napAuditInputArbitrary = (): fc.Arbitrary<RunNapAuditInput> => {
  return fc.record({
    name: fc.string({ minLength: 5, maxLength: 50 }),
    address: fc.string({ minLength: 10, maxLength: 100 }),
    phone: fc.string({ minLength: 10, maxLength: 15 }),
    agencyName: fc.string({ minLength: 5, maxLength: 50 }),
    website: fc.webUrl(),
  });
};

/**
 * Generator for competitor discovery inputs
 */
const findCompetitorsInputArbitrary = (): fc.Arbitrary<FindCompetitorsInput> => {
  return fc.record({
    name: fc.string({ minLength: 5, maxLength: 50 }),
    agencyName: fc.string({ minLength: 5, maxLength: 50 }),
    address: fc.string({ minLength: 10, maxLength: 100 }),
  });
};

/**
 * Generator for competitor enrichment inputs
 */
const enrichCompetitorInputArbitrary = (): fc.Arbitrary<EnrichCompetitorDataInput> => {
  return fc.record({
    name: fc.string({ minLength: 5, maxLength: 50 }),
    agency: fc.string({ minLength: 5, maxLength: 50 }),
  });
};

/**
 * Generator for keyword ranking inputs
 */
const keywordRankingsInputArbitrary = (): fc.Arbitrary<GetKeywordRankingsInput> => {
  return fc.record({
    keyword: fc.string({ minLength: 5, maxLength: 50 }),
    location: fc.string({ minLength: 5, maxLength: 50 }),
  });
};

describe('Search Failure Handling Property Tests', () => {
  // Check if required API keys are available
  const hasApiKeys = process.env.TAVILY_API_KEY && 
                     process.env.TAVILY_API_KEY !== 'your-tavily-api-key' &&
                     process.env.AWS_BEDROCK_REGION;
  
  if (!hasApiKeys) {
    console.warn('\n⚠️  Skipping search failure handling property tests: Missing API keys');
    console.warn('   Set TAVILY_API_KEY and AWS_BEDROCK_REGION to run these tests\n');
  }
  
  const describeOrSkip = hasApiKeys ? describe : describe.skip;
  
  describeOrSkip('Property 9: Search failures don\'t crash flows', () => {
    let originalGetSearchClient: typeof searchModule.getSearchClient;
    
    beforeEach(() => {
      // Save the original function
      originalGetSearchClient = searchModule.getSearchClient;
    });
    
    afterEach(() => {
      // Restore the original function
      if (originalGetSearchClient) {
        (searchModule as any).getSearchClient = originalGetSearchClient;
      }
    });

    /**
     * NAP audit should handle search failures gracefully
     * Requirements 5.1
     */
    it('should not crash NAP audit when search fails', async () => {
      // Mock the search client to throw an error
      const mockSearchClient = {
        search: jest.fn().mockRejectedValue(new Error('Search service unavailable')),
        formatResultsForAI: jest.fn().mockReturnValue(''),
      };
      
      (searchModule as any).getSearchClient = jest.fn().mockReturnValue(mockSearchClient);

      await fc.assert(
        fc.asyncProperty(
          napAuditInputArbitrary(),
          async (input) => {
            // The flow should not throw an error
            const output = await runNapAudit(input);
            
            // Should return valid output structure
            expect(output).toHaveProperty('overallScore');
            expect(output).toHaveProperty('inconsistencies');
            expect(output).toHaveProperty('recommendations');
            
            // Verify types
            expect(typeof output.overallScore).toBe('number');
            expect(Array.isArray(output.inconsistencies)).toBe(true);
            expect(Array.isArray(output.recommendations)).toBe(true);
            
            // Score should be between 0 and 100
            expect(output.overallScore).toBeGreaterThanOrEqual(0);
            expect(output.overallScore).toBeLessThanOrEqual(100);
            
            // Each inconsistency should have required fields
            output.inconsistencies.forEach(inconsistency => {
              expect(inconsistency).toHaveProperty('platform');
              expect(inconsistency).toHaveProperty('field');
              expect(inconsistency).toHaveProperty('expected');
              expect(inconsistency).toHaveProperty('found');
            });
            
            return true;
          }
        ),
        { numRuns: 5 } // Reduced runs since this calls real AI
      );
    }, 120000); // 2 minute timeout

    /**
     * Competitor discovery should handle search failures gracefully
     * Requirements 5.1
     */
    it('should not crash competitor discovery when search fails', async () => {
      // Mock the search client to throw an error
      const mockSearchClient = {
        search: jest.fn().mockRejectedValue(new Error('Search service unavailable')),
        formatResultsForAI: jest.fn().mockReturnValue(''),
      };
      
      (searchModule as any).getSearchClient = jest.fn().mockReturnValue(mockSearchClient);

      await fc.assert(
        fc.asyncProperty(
          findCompetitorsInputArbitrary(),
          async (input) => {
            // The flow should not throw an error
            const output = await findCompetitors(input);
            
            // Should return valid output structure
            expect(output).toHaveProperty('competitors');
            expect(Array.isArray(output.competitors)).toBe(true);
            
            // Each competitor should have required fields
            output.competitors.forEach(competitor => {
              expect(competitor).toHaveProperty('name');
              expect(competitor).toHaveProperty('agency');
              expect(competitor).toHaveProperty('reviewCount');
              expect(competitor).toHaveProperty('avgRating');
              expect(competitor).toHaveProperty('socialFollowers');
              expect(competitor).toHaveProperty('domainAuthority');
              
              // All metrics should be non-negative
              expect(competitor.reviewCount).toBeGreaterThanOrEqual(0);
              expect(competitor.avgRating).toBeGreaterThanOrEqual(0);
              expect(competitor.socialFollowers).toBeGreaterThanOrEqual(0);
              expect(competitor.domainAuthority).toBeGreaterThanOrEqual(0);
            });
            
            return true;
          }
        ),
        { numRuns: 5 }
      );
    }, 120000);

    /**
     * Competitor enrichment should handle search failures gracefully
     * Requirements 5.1
     */
    it('should not crash competitor enrichment when search fails', async () => {
      // Mock the search client to throw an error
      const mockSearchClient = {
        search: jest.fn().mockRejectedValue(new Error('Search service unavailable')),
        formatResultsForAI: jest.fn().mockReturnValue(''),
      };
      
      (searchModule as any).getSearchClient = jest.fn().mockReturnValue(mockSearchClient);

      await fc.assert(
        fc.asyncProperty(
          enrichCompetitorInputArbitrary(),
          async (input) => {
            // The flow should not throw an error
            const output = await enrichCompetitorData(input);
            
            // Should return valid output structure with zeros
            expect(output).toHaveProperty('reviewCount');
            expect(output).toHaveProperty('avgRating');
            expect(output).toHaveProperty('socialFollowers');
            expect(output).toHaveProperty('domainAuthority');
            
            // When search fails, should return zeros
            expect(output.reviewCount).toBe(0);
            expect(output.avgRating).toBe(0);
            expect(output.socialFollowers).toBe(0);
            expect(output.domainAuthority).toBe(0);
            
            return true;
          }
        ),
        { numRuns: 5 }
      );
    }, 120000);

    /**
     * Keyword rankings should handle search failures gracefully
     * Requirements 5.1
     */
    it('should not crash keyword rankings when search fails', async () => {
      // Mock the search client to throw an error
      const mockSearchClient = {
        search: jest.fn().mockRejectedValue(new Error('Search service unavailable')),
        formatResultsForAI: jest.fn().mockReturnValue(''),
      };
      
      (searchModule as any).getSearchClient = jest.fn().mockReturnValue(mockSearchClient);

      await fc.assert(
        fc.asyncProperty(
          keywordRankingsInputArbitrary(),
          async (input) => {
            // The flow should not throw an error
            const output = await getKeywordRankings(input);
            
            // Should return valid output structure
            expect(output).toHaveProperty('rankings');
            expect(Array.isArray(output.rankings)).toBe(true);
            
            // Each ranking should have required fields
            output.rankings.forEach(ranking => {
              expect(ranking).toHaveProperty('rank');
              expect(ranking).toHaveProperty('agentName');
              expect(ranking).toHaveProperty('agency');
              expect(ranking).toHaveProperty('url');
              
              // Rank should be between 1 and 5
              expect(ranking.rank).toBeGreaterThanOrEqual(1);
              expect(ranking.rank).toBeLessThanOrEqual(5);
            });
            
            return true;
          }
        ),
        { numRuns: 5 }
      );
    }, 120000);
  });

  describeOrSkip('Search Failure Edge Cases', () => {
    let originalGetSearchClient: typeof searchModule.getSearchClient;
    
    beforeEach(() => {
      originalGetSearchClient = searchModule.getSearchClient;
    });
    
    afterEach(() => {
      if (originalGetSearchClient) {
        (searchModule as any).getSearchClient = originalGetSearchClient;
      }
    });

    /**
     * Should handle network timeout errors
     */
    it('should handle network timeout errors', async () => {
      const mockSearchClient = {
        search: jest.fn().mockRejectedValue(new Error('ETIMEDOUT')),
        formatResultsForAI: jest.fn().mockReturnValue(''),
      };
      
      (searchModule as any).getSearchClient = jest.fn().mockReturnValue(mockSearchClient);

      const input: EnrichCompetitorDataInput = {
        name: 'John Smith',
        agency: 'Test Realty',
      };

      const output = await enrichCompetitorData(input);
      
      // Should return zeros when search times out
      expect(output.reviewCount).toBe(0);
      expect(output.avgRating).toBe(0);
      expect(output.socialFollowers).toBe(0);
      expect(output.domainAuthority).toBe(0);
    }, 60000);

    /**
     * Should handle API rate limit errors
     */
    it('should handle API rate limit errors', async () => {
      const mockSearchClient = {
        search: jest.fn().mockRejectedValue(new Error('Rate limit exceeded')),
        formatResultsForAI: jest.fn().mockReturnValue(''),
      };
      
      (searchModule as any).getSearchClient = jest.fn().mockReturnValue(mockSearchClient);

      const input: GetKeywordRankingsInput = {
        keyword: 'real estate agent',
        location: 'San Francisco, CA',
      };

      const output = await getKeywordRankings(input);
      
      // Should return valid structure even with rate limit error
      expect(output).toHaveProperty('rankings');
      expect(Array.isArray(output.rankings)).toBe(true);
    }, 60000);

    /**
     * Should handle malformed search responses
     */
    it('should handle malformed search responses', async () => {
      const mockSearchClient = {
        search: jest.fn().mockResolvedValue({ results: null }),
        formatResultsForAI: jest.fn().mockReturnValue(''),
      };
      
      (searchModule as any).getSearchClient = jest.fn().mockReturnValue(mockSearchClient);

      const input: FindCompetitorsInput = {
        name: 'Jane Doe',
        agencyName: 'Test Realty',
        address: '123 Main St, San Francisco, CA',
      };

      const output = await findCompetitors(input);
      
      // Should return valid structure even with malformed response
      expect(output).toHaveProperty('competitors');
      expect(Array.isArray(output.competitors)).toBe(true);
    }, 60000);

    /**
     * Should handle search client initialization failures
     */
    it('should handle search client initialization failures', async () => {
      // Mock getSearchClient to throw an error
      (searchModule as any).getSearchClient = jest.fn().mockImplementation(() => {
        throw new Error('Failed to initialize search client');
      });

      const input: RunNapAuditInput = {
        name: 'John Smith',
        address: '123 Main St, San Francisco, CA',
        phone: '415-555-0100',
        agencyName: 'Test Realty',
        website: 'https://example.com',
      };

      // Should throw an error since we can't recover from client initialization failure
      await expect(runNapAudit(input)).rejects.toThrow();
    }, 60000);

    /**
     * Should handle empty search results
     */
    it('should handle empty search results', async () => {
      const mockSearchClient = {
        search: jest.fn().mockResolvedValue({ results: [] }),
        formatResultsForAI: jest.fn().mockReturnValue('No results found'),
      };
      
      (searchModule as any).getSearchClient = jest.fn().mockReturnValue(mockSearchClient);

      const input: EnrichCompetitorDataInput = {
        name: 'Nonexistent Agent',
        agency: 'Nonexistent Realty',
      };

      const output = await enrichCompetitorData(input);
      
      // Should return valid structure with zeros for empty results
      expect(output).toHaveProperty('reviewCount');
      expect(output).toHaveProperty('avgRating');
      expect(output).toHaveProperty('socialFollowers');
      expect(output).toHaveProperty('domainAuthority');
      
      // All values should be non-negative
      expect(output.reviewCount).toBeGreaterThanOrEqual(0);
      expect(output.avgRating).toBeGreaterThanOrEqual(0);
      expect(output.socialFollowers).toBeGreaterThanOrEqual(0);
      expect(output.domainAuthority).toBeGreaterThanOrEqual(0);
    }, 60000);
  });
});
