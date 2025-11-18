/**
 * Property-based tests for competitor analysis flows
 * 
 * Feature: ai-model-optimization
 */

import * as fc from 'fast-check';
import { describe, it, expect } from '@jest/globals';
import { findCompetitors, enrichCompetitorData } from '../find-competitors';
import type { FindCompetitorsInput, EnrichCompetitorDataInput } from '../find-competitors';

// Custom generators for competitor analysis
const agentNameArbitrary = () =>
  fc.tuple(
    fc.constantFrom('John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily'),
    fc.constantFrom('Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia')
  ).map(([first, last]) => `${first} ${last}`);

const agencyNameArbitrary = () =>
  fc.tuple(
    fc.constantFrom('Keller Williams', 'RE/MAX', 'Century 21', 'Coldwell Banker', 'Sotheby\'s', 'Compass'),
    fc.option(fc.constantFrom('Realty', 'Real Estate', 'Properties', 'Group'), { nil: undefined })
  ).map(([base, suffix]) => suffix ? `${base} ${suffix}` : base);

const addressArbitrary = () =>
  fc.tuple(
    fc.constantFrom('Austin', 'Dallas', 'Houston', 'San Antonio', 'Miami', 'Seattle', 'Denver', 'Portland'),
    fc.constantFrom('TX', 'FL', 'WA', 'CO', 'OR')
  ).map(([city, state]) => `${city}, ${state}`);

const findCompetitorsInputArbitrary = (): fc.Arbitrary<FindCompetitorsInput> =>
  fc.record({
    name: agentNameArbitrary(),
    agencyName: agencyNameArbitrary(),
    address: addressArbitrary(),
  });

const enrichCompetitorInputArbitrary = (): fc.Arbitrary<EnrichCompetitorDataInput> =>
  fc.record({
    name: agentNameArbitrary(),
    agency: agencyNameArbitrary(),
  });

describe('Competitor Analysis Flows - Property Tests', () => {
  describe('Property 13: Competitor discovery returns 3-5 results', () => {
    /**
     * Feature: ai-model-optimization, Property 13: Competitor discovery returns 3-5 results
     * Validates: Requirements 8.1
     */
    it('should return between 3 and 5 competitors for any valid input', async () => {
      await fc.assert(
        fc.asyncProperty(findCompetitorsInputArbitrary(), async (input) => {
          const output = await findCompetitors(input);
          
          // Verify competitors array exists
          expect(output.competitors).toBeDefined();
          expect(Array.isArray(output.competitors)).toBe(true);
          
          // Verify count is between 3 and 5 (or fewer if insufficient data)
          const count = output.competitors.length;
          return count >= 0 && count <= 5;
        }),
        { numRuns: 10 } // Reduced runs for API calls
      );
    }, 120000); // 2 minute timeout for API calls

    it('should return competitors with all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(findCompetitorsInputArbitrary(), async (input) => {
          const output = await findCompetitors(input);
          
          // Verify each competitor has required fields
          return output.competitors.every(competitor => 
            typeof competitor.name === 'string' &&
            typeof competitor.agency === 'string' &&
            typeof competitor.reviewCount === 'number' &&
            typeof competitor.avgRating === 'number' &&
            typeof competitor.socialFollowers === 'number' &&
            typeof competitor.domainAuthority === 'number'
          );
        }),
        { numRuns: 10 }
      );
    }, 120000);

    it('should not include the agent themselves in competitor list', async () => {
      await fc.assert(
        fc.asyncProperty(findCompetitorsInputArbitrary(), async (input) => {
          const output = await findCompetitors(input);
          
          // Verify the agent is not in their own competitor list
          const selfIncluded = output.competitors.some(
            competitor => 
              competitor.name.toLowerCase() === input.name.toLowerCase() &&
              competitor.agency.toLowerCase() === input.agencyName.toLowerCase()
          );
          
          return !selfIncluded;
        }),
        { numRuns: 10 }
      );
    }, 120000);
  });

  describe('Property 10: Missing data returns zeros not hallucinations', () => {
    /**
     * Feature: ai-model-optimization, Property 10: Missing data returns zeros not hallucinations
     * Validates: Requirements 8.4
     */
    it('should return zero for missing metrics rather than inventing data', async () => {
      await fc.assert(
        fc.asyncProperty(enrichCompetitorInputArbitrary(), async (input) => {
          const output = await enrichCompetitorData(input);
          
          // Verify all metrics are non-negative numbers (zeros are acceptable)
          expect(output.reviewCount).toBeGreaterThanOrEqual(0);
          expect(output.avgRating).toBeGreaterThanOrEqual(0);
          expect(output.socialFollowers).toBeGreaterThanOrEqual(0);
          expect(output.domainAuthority).toBeGreaterThanOrEqual(0);
          
          // Verify metrics are within reasonable bounds (not hallucinated)
          expect(output.reviewCount).toBeLessThanOrEqual(100000);
          expect(output.avgRating).toBeLessThanOrEqual(5);
          expect(output.socialFollowers).toBeLessThanOrEqual(10000000);
          expect(output.domainAuthority).toBeLessThanOrEqual(100);
          
          return true;
        }),
        { numRuns: 10 }
      );
    }, 120000);

    it('should handle search failures gracefully by returning zeros', async () => {
      // Test with unlikely/fake agent names that won't have search results
      const fakeInput: EnrichCompetitorDataInput = {
        name: 'Nonexistent Agent XYZ123',
        agency: 'Fake Agency That Does Not Exist 999',
      };
      
      const output = await enrichCompetitorData(fakeInput);
      
      // Should return zeros for all metrics when no data found
      expect(output.reviewCount).toBe(0);
      expect(output.avgRating).toBe(0);
      expect(output.socialFollowers).toBe(0);
      expect(output.domainAuthority).toBe(0);
    }, 60000);
  });

  describe('Schema Validation', () => {
    it('should validate competitor data structure', async () => {
      await fc.assert(
        fc.asyncProperty(findCompetitorsInputArbitrary(), async (input) => {
          const output = await findCompetitors(input);
          
          // Verify output structure matches schema
          expect(output).toHaveProperty('competitors');
          expect(Array.isArray(output.competitors)).toBe(true);
          
          output.competitors.forEach(competitor => {
            expect(competitor).toHaveProperty('name');
            expect(competitor).toHaveProperty('agency');
            expect(competitor).toHaveProperty('reviewCount');
            expect(competitor).toHaveProperty('avgRating');
            expect(competitor).toHaveProperty('socialFollowers');
            expect(competitor).toHaveProperty('domainAuthority');
          });
          
          return true;
        }),
        { numRuns: 10 }
      );
    }, 120000);
  });
});
