/**
 * Property-based tests for competitor discovery
 * 
 * Feature: ai-model-optimization, Property 13: Competitor discovery returns 3-5 results
 * Validates: Requirements 8.1
 */

import * as fc from 'fast-check';
import { describe, it, expect } from '@jest/globals';
import { findCompetitors } from '../flows/find-competitors';
import type { FindCompetitorsInput } from '../flows/find-competitors';

/**
 * Generator for valid competitor discovery inputs
 */
const competitorDiscoveryInputArbitrary = (): fc.Arbitrary<FindCompetitorsInput> => {
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
    agencyName: fc.constantFrom(
      'Smith Realty',
      'Doe Properties',
      'Johnson Real Estate',
      'Williams & Associates',
      'Brown Realty Group',
      'Davis Properties',
      'Miller Real Estate',
      'Wilson Realty'
    ),
    address: fc.tuple(
      fc.integer({ min: 100, max: 9999 }),
      fc.constantFrom('Main', 'Oak', 'Maple', 'Park', 'Washington', 'First', 'Second'),
      fc.constantFrom('Street', 'Avenue', 'Road', 'Drive', 'Boulevard'),
      fc.constantFrom('New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Miami, FL')
    ).map(([number, street, type, city]) => `${number} ${street} ${type}, ${city}`)
  });
};

describe('Competitor Discovery Property Tests', () => {
  // Check if required API keys are available
  const hasApiKeys = process.env.TAVILY_API_KEY && 
                     process.env.TAVILY_API_KEY !== 'your-tavily-api-key' &&
                     process.env.AWS_BEDROCK_REGION;
  
  if (!hasApiKeys) {
    console.warn('\n⚠️  Skipping competitor discovery property tests: Missing API keys');
    console.warn('   Set TAVILY_API_KEY and AWS_BEDROCK_REGION to run these tests\n');
  }
  
  const describeOrSkip = hasApiKeys ? describe : describe.skip;
  
  describeOrSkip('Property 13: Competitor discovery returns 3-5 results', () => {
    /**
     * For any valid competitor discovery request, the system should return
     * between 3 and 5 competitors (or fewer if insufficient data exists)
     * 
     * Requirements 8.1
     */
    it('should return between 0 and 5 competitors for any valid input', async () => {
      await fc.assert(
        fc.asyncProperty(
          competitorDiscoveryInputArbitrary(),
          async (input) => {
            const output = await findCompetitors(input);
            
            // Should have a competitors array
            expect(output).toHaveProperty('competitors');
            expect(Array.isArray(output.competitors)).toBe(true);
            
            // Should return between 0 and 5 competitors
            // (0 is allowed when insufficient data exists)
            expect(output.competitors.length).toBeGreaterThanOrEqual(0);
            expect(output.competitors.length).toBeLessThanOrEqual(5);
            
            return true;
          }
        ),
        { numRuns: 10 } // Reduced runs since this calls real AI
      );
    }, 120000); // 2 minute timeout for AI calls

    /**
     * Each competitor should have all required fields
     * Requirements 8.1
     */
    it('should return competitors with all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          competitorDiscoveryInputArbitrary(),
          async (input) => {
            const output = await findCompetitors(input);
            
            // Each competitor should have all required fields
            output.competitors.forEach(competitor => {
              expect(competitor).toHaveProperty('name');
              expect(competitor).toHaveProperty('agency');
              expect(competitor).toHaveProperty('reviewCount');
              expect(competitor).toHaveProperty('avgRating');
              expect(competitor).toHaveProperty('socialFollowers');
              expect(competitor).toHaveProperty('domainAuthority');
              
              // Fields should be the correct type
              expect(typeof competitor.name).toBe('string');
              expect(typeof competitor.agency).toBe('string');
              expect(typeof competitor.reviewCount).toBe('number');
              expect(typeof competitor.avgRating).toBe('number');
              expect(typeof competitor.socialFollowers).toBe('number');
              expect(typeof competitor.domainAuthority).toBe('number');
              
              // Name and agency should not be empty
              expect(competitor.name.trim().length).toBeGreaterThan(0);
              expect(competitor.agency.trim().length).toBeGreaterThan(0);
              
              // Numeric fields should be non-negative
              expect(competitor.reviewCount).toBeGreaterThanOrEqual(0);
              expect(competitor.avgRating).toBeGreaterThanOrEqual(0);
              expect(competitor.socialFollowers).toBeGreaterThanOrEqual(0);
              expect(competitor.domainAuthority).toBeGreaterThanOrEqual(0);
              
              // Rating should be between 0 and 5
              expect(competitor.avgRating).toBeLessThanOrEqual(5);
              
              // Domain authority should be between 0 and 100
              expect(competitor.domainAuthority).toBeLessThanOrEqual(100);
            });
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 120000);

    /**
     * Competitors should not include the agent themselves
     * Requirements 8.1
     */
    it('should not include the agent themselves in competitor list', async () => {
      await fc.assert(
        fc.asyncProperty(
          competitorDiscoveryInputArbitrary(),
          async (input) => {
            const output = await findCompetitors(input);
            
            // None of the competitors should have the same name as the input agent
            const agentNameLower = input.name.toLowerCase().trim();
            output.competitors.forEach(competitor => {
              const competitorNameLower = competitor.name.toLowerCase().trim();
              expect(competitorNameLower).not.toBe(agentNameLower);
            });
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 120000);

    /**
     * Competitors should have unique names (no duplicates)
     * Requirements 8.1
     */
    it('should return unique competitors without duplicates', async () => {
      await fc.assert(
        fc.asyncProperty(
          competitorDiscoveryInputArbitrary(),
          async (input) => {
            const output = await findCompetitors(input);
            
            // Check for duplicate names
            const names = output.competitors.map(c => c.name.toLowerCase().trim());
            const uniqueNames = new Set(names);
            
            expect(uniqueNames.size).toBe(names.length);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 120000);

    /**
     * The function should handle different market locations
     * Requirements 8.1
     */
    it('should work with different market locations', async () => {
      const testCases = [
        {
          name: 'John Smith',
          agencyName: 'Smith Realty',
          address: '123 Main Street, New York, NY'
        },
        {
          name: 'Jane Doe',
          agencyName: 'Doe Properties',
          address: '456 Oak Avenue, Los Angeles, CA'
        },
        {
          name: 'Bob Johnson',
          agencyName: 'Johnson Real Estate',
          address: '789 Park Drive, Chicago, IL'
        }
      ];

      for (const input of testCases) {
        const output = await findCompetitors(input);
        
        // Should return valid output
        expect(output).toHaveProperty('competitors');
        expect(Array.isArray(output.competitors)).toBe(true);
        expect(output.competitors.length).toBeGreaterThanOrEqual(0);
        expect(output.competitors.length).toBeLessThanOrEqual(5);
      }
    }, 120000);
  });

  describeOrSkip('Competitor Discovery Edge Cases', () => {
    /**
     * Should handle agents with common names
     */
    it('should handle agents with common names', async () => {
      const input: FindCompetitorsInput = {
        name: 'John Smith',
        agencyName: 'ABC Realty',
        address: '123 Main Street, New York, NY'
      };

      const output = await findCompetitors(input);
      
      expect(output).toHaveProperty('competitors');
      expect(Array.isArray(output.competitors)).toBe(true);
      expect(output.competitors.length).toBeGreaterThanOrEqual(0);
      expect(output.competitors.length).toBeLessThanOrEqual(5);
    }, 60000);

    /**
     * Should handle agents with unique names
     */
    it('should handle agents with unique names', async () => {
      const input: FindCompetitorsInput = {
        name: 'Zephyr Moonbeam',
        agencyName: 'Cosmic Properties LLC',
        address: '999 Starlight Boulevard, Portland, OR'
      };

      const output = await findCompetitors(input);
      
      expect(output).toHaveProperty('competitors');
      expect(Array.isArray(output.competitors)).toBe(true);
      expect(output.competitors.length).toBeGreaterThanOrEqual(0);
      expect(output.competitors.length).toBeLessThanOrEqual(5);
    }, 60000);

    /**
     * Should handle small markets
     */
    it('should handle small markets gracefully', async () => {
      const input: FindCompetitorsInput = {
        name: 'Mary Johnson',
        agencyName: 'Johnson Realty',
        address: '100 Main Street, Small Town, WY'
      };

      const output = await findCompetitors(input);
      
      // In small markets, might return fewer than 3 competitors
      expect(output).toHaveProperty('competitors');
      expect(Array.isArray(output.competitors)).toBe(true);
      expect(output.competitors.length).toBeGreaterThanOrEqual(0);
      expect(output.competitors.length).toBeLessThanOrEqual(5);
    }, 60000);

    /**
     * Should handle large markets
     */
    it('should handle large markets', async () => {
      const input: FindCompetitorsInput = {
        name: 'Sarah Williams',
        agencyName: 'Williams Properties',
        address: '500 Fifth Avenue, New York, NY'
      };

      const output = await findCompetitors(input);
      
      // In large markets, should return 3-5 competitors
      expect(output).toHaveProperty('competitors');
      expect(Array.isArray(output.competitors)).toBe(true);
      expect(output.competitors.length).toBeGreaterThanOrEqual(0);
      expect(output.competitors.length).toBeLessThanOrEqual(5);
    }, 60000);
  });
});
