/**
 * Property-based tests for multiple review analysis
 * 
 * Feature: ai-model-optimization
 */

import * as fc from 'fast-check';
import { describe, it, expect } from '@jest/globals';
import { analyzeMultipleReviews } from './analyze-multiple-reviews';

describe('Multiple Review Analysis', () => {
  describe('Property 17: Review analysis extracts keywords and themes', () => {
    /**
     * Feature: ai-model-optimization, Property 17: Review analysis extracts keywords and themes
     * Validates: Requirements 13.4
     * 
     * For any multiple review analysis, the output should include both keywords (5-7 items)
     * and commonThemes (3-4 items) arrays
     */
    it('should extract 5-7 keywords and 3-4 common themes', async () => {
      // Generator for review comments
      const reviewArbitrary = fc.oneof(
        fc.constant('Great agent! Very responsive and knowledgeable about the market.'),
        fc.constant('Excellent communication throughout the entire process.'),
        fc.constant('Helped us find our dream home. Highly recommend!'),
        fc.constant('Professional and attentive to our needs.'),
        fc.constant('Made the buying process smooth and stress-free.'),
        fc.constant('Very patient and understanding with first-time buyers.'),
        fc.constant('Expert negotiator, got us a great deal.'),
        fc.constant('Always available to answer questions.'),
        fc.constant('Knowledgeable about local neighborhoods and schools.'),
        fc.constant('Went above and beyond to help us.'),
      );

      // Generator for multiple reviews input
      const inputArbitrary = fc.record({
        comments: fc.array(reviewArbitrary, { minLength: 3, maxLength: 10 }),
      });

      await fc.assert(
        fc.asyncProperty(inputArbitrary, async (input) => {
          const output = await analyzeMultipleReviews(input);

          // Property: Output must have keywords array with 5-7 items
          expect(Array.isArray(output.keywords)).toBe(true);
          expect(output.keywords.length).toBeGreaterThanOrEqual(5);
          expect(output.keywords.length).toBeLessThanOrEqual(7);

          // Property: Output must have commonThemes array with 3-4 items
          expect(Array.isArray(output.commonThemes)).toBe(true);
          expect(output.commonThemes.length).toBeGreaterThanOrEqual(3);
          expect(output.commonThemes.length).toBeLessThanOrEqual(4);

          // All keywords must be non-empty strings
          output.keywords.forEach((keyword) => {
            expect(typeof keyword).toBe('string');
            expect(keyword.length).toBeGreaterThan(0);
          });

          // All themes must be non-empty strings
          output.commonThemes.forEach((theme) => {
            expect(typeof theme).toBe('string');
            expect(theme.length).toBeGreaterThan(0);
          });

          // Output must have valid sentiment
          expect(['Positive', 'Negative', 'Mixed']).toContain(output.overallSentiment);

          // Output must have a summary
          expect(typeof output.summary).toBe('string');
          expect(output.summary.length).toBeGreaterThan(0);
        }),
        { numRuns: 5 } // Limited runs due to API calls
      );
    }, 60000); // 60 second timeout for API calls
  });
});
