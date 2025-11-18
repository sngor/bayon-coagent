/**
 * Property-based tests for marketing plan generation
 * 
 * Feature: ai-model-optimization
 */

import * as fc from 'fast-check';
import { describe, it, expect } from '@jest/globals';
import { generateMarketingPlan } from './generate-marketing-plan';

describe('Marketing Plan Generation', () => {
  describe('Property 16: Marketing plans have exactly 3 tasks', () => {
    /**
     * Feature: ai-model-optimization, Property 16: Marketing plans have exactly 3 tasks
     * Validates: Requirements 14.2, 14.3
     * 
     * For any marketing plan generation, the output should contain exactly 3 tasks,
     * each with task, rationale, tool, and toolLink fields
     */
    it('should generate exactly 3 tasks with all required fields', async () => {
      // Generator for brand audit data
      const brandAuditArbitrary = fc.record({
        napConsistency: fc.record({
          consistent: fc.boolean(),
          issues: fc.array(fc.string(), { maxLength: 5 }),
        }),
        reviewCount: fc.integer({ min: 0, max: 500 }),
        averageRating: fc.double({ min: 0, max: 5, noNaN: true }),
        socialPresence: fc.record({
          facebook: fc.boolean(),
          instagram: fc.boolean(),
          linkedin: fc.boolean(),
        }),
      });

      // Generator for competitor data
      const competitorArbitrary = fc.record({
        name: fc.string({ minLength: 5, maxLength: 50 }),
        reviewCount: fc.integer({ min: 0, max: 1000 }),
        rating: fc.double({ min: 0, max: 5, noNaN: true }),
        socialFollowers: fc.integer({ min: 0, max: 50000 }),
        domainAuthority: fc.integer({ min: 0, max: 100 }),
      });

      // Generator for marketing plan input
      const inputArbitrary = fc.record({
        brandAudit: brandAuditArbitrary,
        competitors: fc.array(competitorArbitrary, { minLength: 3, maxLength: 5 }),
      });

      await fc.assert(
        fc.asyncProperty(inputArbitrary, async (input) => {
          const output = await generateMarketingPlan(input);

          // Property: Output must have exactly 3 tasks
          expect(output.plan).toHaveLength(3);

          // Each task must have all required fields
          output.plan.forEach((task) => {
            expect(task).toHaveProperty('task');
            expect(task).toHaveProperty('rationale');
            expect(task).toHaveProperty('tool');
            expect(task).toHaveProperty('toolLink');

            // Fields must be non-empty strings
            expect(typeof task.task).toBe('string');
            expect(task.task.length).toBeGreaterThan(0);
            expect(typeof task.rationale).toBe('string');
            expect(task.rationale.length).toBeGreaterThan(0);
            expect(typeof task.tool).toBe('string');
            expect(task.tool.length).toBeGreaterThan(0);
            expect(typeof task.toolLink).toBe('string');
            expect(task.toolLink.length).toBeGreaterThan(0);
          });
        }),
        { numRuns: 5 } // Limited runs due to API calls
      );
    }, 60000); // 60 second timeout for API calls
  });
});
