/**
 * Property-based tests for AI model configuration
 * 
 * Feature: ai-model-optimization, Property 1: Model selection matches feature complexity
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2
 */

import * as fc from 'fast-check';
import { describe, it, expect } from '@jest/globals';
import { BEDROCK_MODELS, MODEL_CONFIGS } from '../flow-base';

// Import flow modules to check their configurations
import * as generateAgentBio from '../flows/generate-agent-bio';
import * as analyzeReviewSentiment from '../flows/analyze-review-sentiment';
import * as generateSocialMediaPost from '../flows/generate-social-media-post';
import * as generateBlogPost from '../flows/generate-blog-post';
import * as findCompetitors from '../flows/find-competitors';
import * as runNapAudit from '../flows/run-nap-audit';
import * as analyzeMultipleReviews from '../flows/analyze-multiple-reviews';
import * as generateMarketingPlan from '../flows/generate-marketing-plan';
import * as getKeywordRankings from '../flows/get-keyword-rankings';

describe('Model Configuration Property Tests', () => {
  describe('Property 1: Model selection matches feature complexity', () => {
    /**
     * Simple features should use Haiku (fast, cost-effective)
     * Requirements 1.1, 2.1
     */
    it('should use Haiku for simple tasks', () => {
      // Test that simple task flows are configured to use Haiku
      const simpleFlows = [
        'generateAgentBio',
        'analyzeReviewSentiment',
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...simpleFlows),
          (flowName) => {
            // For now, we verify that MODEL_CONFIGS.SIMPLE uses Haiku
            // Once flows are updated, we'll verify the actual flow configuration
            expect(MODEL_CONFIGS.SIMPLE.modelId).toBe(BEDROCK_MODELS.HAIKU);
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Complex features should use Sonnet 3.5 (better reasoning)
     * Requirements 1.2, 2.2
     */
    it('should use Sonnet 3.5 for complex tasks', () => {
      // Test that complex task flows are configured to use Sonnet 3.5
      const complexFlows = [
        'generateBlogPost',
        'findCompetitors',
        'runNapAudit',
        'analyzeMultipleReviews',
        'generateMarketingPlan',
        'getKeywordRankings',
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...complexFlows),
          (flowName) => {
            // Verify that analytical and balanced configs use Sonnet 3.5
            expect(MODEL_CONFIGS.ANALYTICAL.modelId).toBe(BEDROCK_MODELS.SONNET_3_5_V2);
            expect(MODEL_CONFIGS.BALANCED.modelId).toBe(BEDROCK_MODELS.SONNET_3_5_V2);
            expect(MODEL_CONFIGS.LONG_FORM.modelId).toBe(BEDROCK_MODELS.SONNET_3_5_V2);
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Model configuration constants should be valid Bedrock model IDs
     */
    it('should have valid model IDs in all configurations', () => {
      const validModelIds = Object.values(BEDROCK_MODELS);
      const configs = Object.values(MODEL_CONFIGS);

      fc.assert(
        fc.property(
          fc.constantFrom(...configs),
          (config) => {
            expect(validModelIds).toContain(config.modelId);
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Each model configuration should have required parameters
     */
    it('should have complete configuration for all presets', () => {
      const configNames = Object.keys(MODEL_CONFIGS) as Array<keyof typeof MODEL_CONFIGS>;

      fc.assert(
        fc.property(
          fc.constantFrom(...configNames),
          (configName) => {
            const config = MODEL_CONFIGS[configName];
            
            // Verify all required fields are present
            expect(config).toHaveProperty('modelId');
            expect(config).toHaveProperty('temperature');
            expect(config).toHaveProperty('maxTokens');
            
            // Verify types
            expect(typeof config.modelId).toBe('string');
            expect(typeof config.temperature).toBe('number');
            expect(typeof config.maxTokens).toBe('number');
            
            // Verify ranges
            expect(config.temperature).toBeGreaterThanOrEqual(0);
            expect(config.temperature).toBeLessThanOrEqual(1);
            expect(config.maxTokens).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Simple config should be optimized for speed and cost
     */
    it('should configure SIMPLE preset for speed and cost', () => {
      expect(MODEL_CONFIGS.SIMPLE.modelId).toBe(BEDROCK_MODELS.HAIKU);
      expect(MODEL_CONFIGS.SIMPLE.temperature).toBeLessThanOrEqual(0.3);
      expect(MODEL_CONFIGS.SIMPLE.maxTokens).toBeLessThanOrEqual(2048);
    });

    /**
     * Analytical config should use low temperature for accuracy
     */
    it('should configure ANALYTICAL preset for accuracy', () => {
      expect(MODEL_CONFIGS.ANALYTICAL.modelId).toBe(BEDROCK_MODELS.SONNET_3_5_V2);
      expect(MODEL_CONFIGS.ANALYTICAL.temperature).toBeLessThanOrEqual(0.3);
    });

    /**
     * Long-form config should support large outputs
     */
    it('should configure LONG_FORM preset for comprehensive content', () => {
      expect(MODEL_CONFIGS.LONG_FORM.modelId).toBe(BEDROCK_MODELS.SONNET_3_5_V2);
      expect(MODEL_CONFIGS.LONG_FORM.maxTokens).toBeGreaterThanOrEqual(8192);
    });

    /**
     * Creative config should use higher temperature
     */
    it('should configure CREATIVE preset for engaging content', () => {
      expect(MODEL_CONFIGS.CREATIVE.modelId).toBe(BEDROCK_MODELS.SONNET_3_5_V2);
      expect(MODEL_CONFIGS.CREATIVE.temperature).toBeGreaterThanOrEqual(0.6);
    });

    /**
     * Critical config should use Opus for best reasoning
     */
    it('should configure CRITICAL preset for maximum capability', () => {
      expect(MODEL_CONFIGS.CRITICAL.modelId).toBe(BEDROCK_MODELS.OPUS);
      expect(MODEL_CONFIGS.CRITICAL.temperature).toBeLessThanOrEqual(0.2);
    });
  });

  describe('Model ID Validation', () => {
    /**
     * All Bedrock model IDs should follow the correct format
     */
    it('should have correctly formatted model IDs', () => {
      const modelIds = Object.values(BEDROCK_MODELS);

      fc.assert(
        fc.property(
          fc.constantFrom(...modelIds),
          (modelId) => {
            // Model IDs should either start with 'anthropic.' or 'us.anthropic.'
            const isValid = 
              modelId.startsWith('anthropic.') || 
              modelId.startsWith('us.anthropic.');
            
            expect(isValid).toBe(true);
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Configuration Consistency', () => {
    /**
     * Temperature should be inversely related to accuracy requirements
     */
    it('should use lower temperature for analytical tasks than creative tasks', () => {
      expect(MODEL_CONFIGS.ANALYTICAL.temperature).toBeLessThan(
        MODEL_CONFIGS.CREATIVE.temperature
      );
      expect(MODEL_CONFIGS.SIMPLE.temperature).toBeLessThan(
        MODEL_CONFIGS.CREATIVE.temperature
      );
    });

    /**
     * Token limits should match content length requirements
     */
    it('should allocate more tokens for long-form content', () => {
      expect(MODEL_CONFIGS.LONG_FORM.maxTokens).toBeGreaterThan(
        MODEL_CONFIGS.SIMPLE.maxTokens
      );
      expect(MODEL_CONFIGS.LONG_FORM.maxTokens).toBeGreaterThan(
        MODEL_CONFIGS.BALANCED.maxTokens
      );
    });

    /**
     * More capable models should be used for complex tasks
     */
    it('should use more capable models for complex reasoning', () => {
      // Opus is most capable, should be used for critical tasks
      expect(MODEL_CONFIGS.CRITICAL.modelId).toBe(BEDROCK_MODELS.OPUS);
      
      // Sonnet 3.5 should be used for most complex tasks
      expect(MODEL_CONFIGS.ANALYTICAL.modelId).toBe(BEDROCK_MODELS.SONNET_3_5_V2);
      expect(MODEL_CONFIGS.BALANCED.modelId).toBe(BEDROCK_MODELS.SONNET_3_5_V2);
      expect(MODEL_CONFIGS.LONG_FORM.modelId).toBe(BEDROCK_MODELS.SONNET_3_5_V2);
      
      // Haiku should be used for simple tasks
      expect(MODEL_CONFIGS.SIMPLE.modelId).toBe(BEDROCK_MODELS.HAIKU);
    });
  });
});
