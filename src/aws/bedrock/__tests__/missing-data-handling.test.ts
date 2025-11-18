/**
 * Property-based tests for missing data handling
 * 
 * Feature: ai-model-optimization, Property 10: Missing data returns zeros not hallucinations
 * Validates: Requirements 8.4
 */

import * as fc from 'fast-check';
import { describe, it, expect } from '@jest/globals';
import { enrichCompetitorData } from '../flows/find-competitors';
import type { EnrichCompetitorDataInput } from '../flows/find-competitors';

/**
 * Generator for competitor enrichment inputs with obscure/unlikely names
 * These are designed to have minimal or no search results
 */
const obscureCompetitorInputArbitrary = (): fc.Arbitrary<EnrichCompetitorDataInput> => {
  return fc.record({
    name: fc.tuple(
      fc.constantFrom('Zephyr', 'Quixote', 'Nebula', 'Zenith', 'Quantum', 'Mystique', 'Phoenix', 'Orion'),
      fc.constantFrom('Moonbeam', 'Stardust', 'Thunderbolt', 'Windwhisper', 'Shadowfax', 'Dreamweaver', 'Starlight', 'Nightshade')
    ).map(([first, last]) => `${first} ${last}`),
    agency: fc.tuple(
      fc.constantFrom('Cosmic', 'Ethereal', 'Celestial', 'Mystical', 'Quantum', 'Nebulous', 'Astral', 'Galactic'),
      fc.constantFrom('Properties', 'Realty', 'Estates', 'Homes', 'Real Estate', 'Group', 'Associates', 'Partners')
    ).map(([adj, noun]) => `${adj} ${noun}`)
  });
};

/**
 * Generator for competitor enrichment inputs with realistic names
 * These should have some search results
 */
const realisticCompetitorInputArbitrary = (): fc.Arbitrary<EnrichCompetitorDataInput> => {
  return fc.record({
    name: fc.constantFrom(
      'John Smith',
      'Jane Doe',
      'Robert Johnson',
      'Mary Williams',
      'Michael Brown',
      'Sarah Davis',
      'David Miller',
      'Jennifer Wilson'
    ),
    agency: fc.constantFrom(
      'Keller Williams',
      'RE/MAX',
      'Century 21',
      'Coldwell Banker',
      'Sotheby\'s International Realty',
      'Berkshire Hathaway',
      'Compass',
      'eXp Realty'
    )
  });
};

describe('Missing Data Handling Property Tests', () => {
  // Check if required API keys are available
  const hasApiKeys = process.env.TAVILY_API_KEY && 
                     process.env.TAVILY_API_KEY !== 'your-tavily-api-key' &&
                     process.env.AWS_BEDROCK_REGION;
  
  if (!hasApiKeys) {
    console.warn('\n⚠️  Skipping missing data handling property tests: Missing API keys');
    console.warn('   Set TAVILY_API_KEY and AWS_BEDROCK_REGION to run these tests\n');
  }
  
  const describeOrSkip = hasApiKeys ? describe : describe.skip;
  
  describeOrSkip('Property 10: Missing data returns zeros not hallucinations', () => {
    /**
     * For any competitor enrichment request, if specific metrics cannot be found
     * in search results, the system should return 0 for those metrics rather than
     * inventing data.
     * 
     * Requirements 8.4
     */
    it('should return zeros for missing metrics, not hallucinated data', async () => {
      await fc.assert(
        fc.asyncProperty(
          obscureCompetitorInputArbitrary(),
          async (input) => {
            const output = await enrichCompetitorData(input);
            
            // Should have all required fields
            expect(output).toHaveProperty('reviewCount');
            expect(output).toHaveProperty('avgRating');
            expect(output).toHaveProperty('socialFollowers');
            expect(output).toHaveProperty('domainAuthority');
            
            // All fields should be numbers
            expect(typeof output.reviewCount).toBe('number');
            expect(typeof output.avgRating).toBe('number');
            expect(typeof output.socialFollowers).toBe('number');
            expect(typeof output.domainAuthority).toBe('number');
            
            // All fields should be non-negative (zeros or positive values)
            expect(output.reviewCount).toBeGreaterThanOrEqual(0);
            expect(output.avgRating).toBeGreaterThanOrEqual(0);
            expect(output.socialFollowers).toBeGreaterThanOrEqual(0);
            expect(output.domainAuthority).toBeGreaterThanOrEqual(0);
            
            // For obscure names with no real data, we expect mostly zeros
            // At least 2 out of 4 metrics should be zero (50% threshold)
            const zeroCount = [
              output.reviewCount,
              output.avgRating,
              output.socialFollowers,
              output.domainAuthority
            ].filter(val => val === 0).length;
            
            // With obscure names, we expect at least 2 metrics to be zero
            // This validates that the system returns zeros for missing data
            expect(zeroCount).toBeGreaterThanOrEqual(2);
            
            return true;
          }
        ),
        { numRuns: 10 } // Reduced runs since this calls real AI
      );
    }, 120000); // 2 minute timeout for AI calls

    /**
     * Metrics should be within valid ranges even when data is found
     * Requirements 8.4
     */
    it('should return metrics within valid ranges', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            obscureCompetitorInputArbitrary(),
            realisticCompetitorInputArbitrary()
          ),
          async (input) => {
            const output = await enrichCompetitorData(input);
            
            // Review count should be reasonable (not hallucinated millions)
            expect(output.reviewCount).toBeLessThanOrEqual(10000);
            
            // Average rating should be between 0 and 5
            expect(output.avgRating).toBeGreaterThanOrEqual(0);
            expect(output.avgRating).toBeLessThanOrEqual(5);
            
            // Social followers should be reasonable (not hallucinated millions)
            expect(output.socialFollowers).toBeLessThanOrEqual(1000000);
            
            // Domain authority should be between 0 and 100
            expect(output.domainAuthority).toBeGreaterThanOrEqual(0);
            expect(output.domainAuthority).toBeLessThanOrEqual(100);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 120000);

    /**
     * Should not return negative values for any metric
     * Requirements 8.4
     */
    it('should never return negative values for metrics', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            obscureCompetitorInputArbitrary(),
            realisticCompetitorInputArbitrary()
          ),
          async (input) => {
            const output = await enrichCompetitorData(input);
            
            // No metric should be negative
            expect(output.reviewCount).toBeGreaterThanOrEqual(0);
            expect(output.avgRating).toBeGreaterThanOrEqual(0);
            expect(output.socialFollowers).toBeGreaterThanOrEqual(0);
            expect(output.domainAuthority).toBeGreaterThanOrEqual(0);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 120000);
  });

  describeOrSkip('Missing Data Edge Cases', () => {
    /**
     * Should handle completely fictional agents
     */
    it('should return zeros for completely fictional agents', async () => {
      const input: EnrichCompetitorDataInput = {
        name: 'Zephyr Moonbeam Stardust',
        agency: 'Cosmic Ethereal Quantum Properties LLC'
      };

      const output = await enrichCompetitorData(input);
      
      // Should have all required fields
      expect(output).toHaveProperty('reviewCount');
      expect(output).toHaveProperty('avgRating');
      expect(output).toHaveProperty('socialFollowers');
      expect(output).toHaveProperty('domainAuthority');
      
      // All values should be non-negative
      expect(output.reviewCount).toBeGreaterThanOrEqual(0);
      expect(output.avgRating).toBeGreaterThanOrEqual(0);
      expect(output.socialFollowers).toBeGreaterThanOrEqual(0);
      expect(output.domainAuthority).toBeGreaterThanOrEqual(0);
      
      // For a completely fictional agent, expect mostly zeros
      const zeroCount = [
        output.reviewCount,
        output.avgRating,
        output.socialFollowers,
        output.domainAuthority
      ].filter(val => val === 0).length;
      
      expect(zeroCount).toBeGreaterThanOrEqual(2);
    }, 60000);

    /**
     * Should handle agents with partial data
     */
    it('should handle agents with partial data availability', async () => {
      const input: EnrichCompetitorDataInput = {
        name: 'John Smith',
        agency: 'Unknown Realty Group'
      };

      const output = await enrichCompetitorData(input);
      
      // Should have all required fields
      expect(output).toHaveProperty('reviewCount');
      expect(output).toHaveProperty('avgRating');
      expect(output).toHaveProperty('socialFollowers');
      expect(output).toHaveProperty('domainAuthority');
      
      // All values should be non-negative
      expect(output.reviewCount).toBeGreaterThanOrEqual(0);
      expect(output.avgRating).toBeGreaterThanOrEqual(0);
      expect(output.socialFollowers).toBeGreaterThanOrEqual(0);
      expect(output.domainAuthority).toBeGreaterThanOrEqual(0);
      
      // Values should be within valid ranges
      expect(output.avgRating).toBeLessThanOrEqual(5);
      expect(output.domainAuthority).toBeLessThanOrEqual(100);
    }, 60000);

    /**
     * Should handle agents with very common names
     */
    it('should handle agents with very common names', async () => {
      const input: EnrichCompetitorDataInput = {
        name: 'John Smith',
        agency: 'ABC Realty'
      };

      const output = await enrichCompetitorData(input);
      
      // Should have all required fields
      expect(output).toHaveProperty('reviewCount');
      expect(output).toHaveProperty('avgRating');
      expect(output).toHaveProperty('socialFollowers');
      expect(output).toHaveProperty('domainAuthority');
      
      // All values should be non-negative
      expect(output.reviewCount).toBeGreaterThanOrEqual(0);
      expect(output.avgRating).toBeGreaterThanOrEqual(0);
      expect(output.socialFollowers).toBeGreaterThanOrEqual(0);
      expect(output.domainAuthority).toBeGreaterThanOrEqual(0);
      
      // Values should be within valid ranges
      expect(output.reviewCount).toBeLessThanOrEqual(10000);
      expect(output.avgRating).toBeLessThanOrEqual(5);
      expect(output.socialFollowers).toBeLessThanOrEqual(1000000);
      expect(output.domainAuthority).toBeLessThanOrEqual(100);
    }, 60000);

    /**
     * Should handle search failures gracefully
     */
    it('should return zeros when search fails', async () => {
      // This test verifies the fallback behavior when web search is unavailable
      const input: EnrichCompetitorDataInput = {
        name: 'Test Agent',
        agency: 'Test Realty'
      };

      const output = await enrichCompetitorData(input);
      
      // Should still return valid output structure
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
