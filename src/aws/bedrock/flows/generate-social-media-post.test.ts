/**
 * Property-based tests for social media post generation
 * 
 * Feature: ai-model-optimization
 */

import * as fc from 'fast-check';
import { describe, it, expect } from '@jest/globals';
import { generateSocialMediaPost } from './generate-social-media-post';

describe('Social Media Post Generation', () => {
  describe('Property 15: Twitter posts respect character limits', () => {
    /**
     * Feature: ai-model-optimization, Property 15: Twitter posts respect character limits
     * Validates: Requirements 11.5
     * 
     * For any social media post generation, the Twitter post should be 280 characters or fewer
     */
    it('should generate Twitter posts within 280 character limit', async () => {
      // Generator for real estate topics
      const realEstateTopics = [
        'Tips for first-time homebuyers',
        'How to stage your home for a quick sale',
        'Understanding mortgage rates',
        'Benefits of working with a real estate agent',
        'Spring home buying season trends',
        'Investment property strategies',
        'Home inspection checklist',
        'Negotiating in a seller\'s market',
      ];

      // Generator for social media post input
      const inputArbitrary = fc.record({
        topic: fc.constantFrom(...realEstateTopics),
        tone: fc.constantFrom('professional', 'casual', 'enthusiastic', 'friendly', 'authoritative'),
      });

      await fc.assert(
        fc.asyncProperty(inputArbitrary, async (input) => {
          const output = await generateSocialMediaPost(input);

          // Property: Twitter post must be 280 characters or fewer
          expect(output.twitter.length).toBeLessThanOrEqual(280);
          
          // Additional validation: Twitter post should not be empty
          expect(output.twitter.length).toBeGreaterThan(0);
        }),
        { numRuns: 5 } // Limited runs due to API calls
      );
    }, 60000); // 60 second timeout for API calls

    it('should generate all required platform posts', async () => {
      const input = {
        topic: 'Tips for first-time homebuyers in a competitive market',
        tone: 'professional',
      };

      const output = await generateSocialMediaPost(input);

      // Verify all platforms are present
      expect(output).toHaveProperty('linkedin');
      expect(output).toHaveProperty('twitter');
      expect(output).toHaveProperty('facebook');

      // Verify all posts are non-empty strings
      expect(typeof output.linkedin).toBe('string');
      expect(output.linkedin.length).toBeGreaterThan(0);
      
      expect(typeof output.twitter).toBe('string');
      expect(output.twitter.length).toBeGreaterThan(0);
      expect(output.twitter.length).toBeLessThanOrEqual(280);
      
      expect(typeof output.facebook).toBe('string');
      expect(output.facebook.length).toBeGreaterThan(0);
    }, 30000);
  });
});
