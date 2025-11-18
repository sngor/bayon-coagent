/**
 * Property-based tests for model configuration
 * 
 * Feature: ai-model-optimization
 */

import * as fc from 'fast-check';
import { describe, it, expect } from '@jest/globals';
import { BEDROCK_MODELS, MODEL_CONFIGS } from '../flow-base';

describe('Model Configuration', () => {
  describe('Property 2: Temperature configuration matches feature type', () => {
    /**
     * Feature: ai-model-optimization, Property 2: Temperature configuration matches feature type
     * Validates: Requirements 1.3, 1.4, 13.3
     * 
     * For any AI feature invocation, the temperature setting should match the feature type:
     * - low (≤0.3) for analytical features (sentiment, NAP audit, competitors)
     * - moderate (0.4-0.6) for balanced features (marketing plans)
     * - higher (≥0.6) for creative features (social media, blog posts)
     */
    it('should use low temperature for analytical features', () => {
      // Analytical features should use temperature ≤ 0.3
      expect(MODEL_CONFIGS.ANALYTICAL.temperature).toBeLessThanOrEqual(0.3);
      expect(MODEL_CONFIGS.SIMPLE.temperature).toBeLessThanOrEqual(0.3);
    });

    it('should use moderate temperature for balanced features', () => {
      // Balanced features should use temperature between 0.4 and 0.6
      expect(MODEL_CONFIGS.BALANCED.temperature).toBeGreaterThanOrEqual(0.4);
      expect(MODEL_CONFIGS.BALANCED.temperature).toBeLessThanOrEqual(0.6);
    });

    it('should use higher temperature for creative features', () => {
      // Creative features should use temperature ≥ 0.6
      expect(MODEL_CONFIGS.CREATIVE.temperature).toBeGreaterThanOrEqual(0.6);
      expect(MODEL_CONFIGS.LONG_FORM.temperature).toBeGreaterThanOrEqual(0.6);
    });

    it('should verify all temperature values are within valid range', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            MODEL_CONFIGS.SIMPLE,
            MODEL_CONFIGS.BALANCED,
            MODEL_CONFIGS.CREATIVE,
            MODEL_CONFIGS.LONG_FORM,
            MODEL_CONFIGS.ANALYTICAL,
            MODEL_CONFIGS.CRITICAL
          ),
          (config) => {
            // All temperatures must be between 0 and 1
            expect(config.temperature).toBeGreaterThanOrEqual(0);
            expect(config.temperature).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Token limits match content length requirements', () => {
    /**
     * Feature: ai-model-optimization, Property 3: Token limits match content length requirements
     * Validates: Requirements 2.5, 10.3
     * 
     * For any AI feature invocation, the maxTokens setting should be appropriate for the expected output length:
     * - at least 8192 for long-form content (blog posts, research, neighborhood guides)
     * - 4096 for medium content
     * - 2048 for short content
     */
    it('should use at least 8192 tokens for long-form content', () => {
      // Long-form content requires at least 8192 tokens
      expect(MODEL_CONFIGS.LONG_FORM.maxTokens).toBeGreaterThanOrEqual(8192);
    });

    it('should use 4096 tokens for medium content', () => {
      // Medium content uses 4096 tokens
      expect(MODEL_CONFIGS.BALANCED.maxTokens).toBe(4096);
      expect(MODEL_CONFIGS.CREATIVE.maxTokens).toBe(4096);
      expect(MODEL_CONFIGS.ANALYTICAL.maxTokens).toBe(4096);
      expect(MODEL_CONFIGS.CRITICAL.maxTokens).toBe(4096);
    });

    it('should use 2048 tokens for short content', () => {
      // Short content uses 2048 tokens
      expect(MODEL_CONFIGS.SIMPLE.maxTokens).toBe(2048);
    });

    it('should verify token limits are appropriate for content type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            { config: MODEL_CONFIGS.LONG_FORM, minTokens: 8192, name: 'LONG_FORM' },
            { config: MODEL_CONFIGS.BALANCED, minTokens: 4096, name: 'BALANCED' },
            { config: MODEL_CONFIGS.CREATIVE, minTokens: 4096, name: 'CREATIVE' },
            { config: MODEL_CONFIGS.ANALYTICAL, minTokens: 4096, name: 'ANALYTICAL' },
            { config: MODEL_CONFIGS.CRITICAL, minTokens: 4096, name: 'CRITICAL' },
            { config: MODEL_CONFIGS.SIMPLE, minTokens: 2048, name: 'SIMPLE' }
          ),
          ({ config, minTokens }) => {
            // Each config should have at least the minimum tokens for its content type
            expect(config.maxTokens).toBeGreaterThanOrEqual(minTokens);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Model Configuration Consistency', () => {
    it('should have valid model IDs for all configurations', () => {
      const validModelIds = Object.values(BEDROCK_MODELS);
      
      fc.assert(
        fc.property(
          fc.constantFrom(
            MODEL_CONFIGS.SIMPLE,
            MODEL_CONFIGS.BALANCED,
            MODEL_CONFIGS.CREATIVE,
            MODEL_CONFIGS.LONG_FORM,
            MODEL_CONFIGS.ANALYTICAL,
            MODEL_CONFIGS.CRITICAL
          ),
          (config) => {
            expect(validModelIds).toContain(config.modelId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have positive maxTokens for all configurations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            MODEL_CONFIGS.SIMPLE,
            MODEL_CONFIGS.BALANCED,
            MODEL_CONFIGS.CREATIVE,
            MODEL_CONFIGS.LONG_FORM,
            MODEL_CONFIGS.ANALYTICAL,
            MODEL_CONFIGS.CRITICAL
          ),
          (config) => {
            expect(config.maxTokens).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
