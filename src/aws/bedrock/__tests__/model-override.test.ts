/**
 * Property-based tests for model configuration override
 * 
 * Feature: ai-model-optimization, Property 5: Model configuration is overridable
 * Feature: ai-model-optimization, Property 6: Default model fallback works
 * Validates: Requirements 3.1, 3.2, 3.5
 */

import * as fc from 'fast-check';
import { describe, it, expect } from '@jest/globals';
import { 
  BEDROCK_MODELS, 
  MODEL_CONFIGS,
  mergeFlowOptions,
  type FlowOptions,
  type FlowExecutionOptions
} from '../flow-base';
import { getConfig } from '@/aws/config';

describe('Model Override Property Tests', () => {

  describe('Property 5: Model configuration is overridable', () => {
    /**
     * Runtime model override should take precedence over config
     * Requirements 3.1, 3.5
     */
    it('should allow runtime model ID override', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(BEDROCK_MODELS)),
          fc.constantFrom(...Object.values(BEDROCK_MODELS)),
          (configModelId, runtimeModelId) => {
            const merged = mergeFlowOptions(
              { modelId: configModelId },
              { modelId: runtimeModelId }
            );
            
            // Runtime override should take precedence
            expect(merged.modelId).toBe(runtimeModelId);
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Runtime temperature override should take precedence
     * Requirements 3.1, 3.5
     */
    it('should allow runtime temperature override', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1, noNaN: true }),
          fc.double({ min: 0, max: 1, noNaN: true }),
          (configTemp, runtimeTemp) => {
            const merged = mergeFlowOptions(
              { temperature: configTemp },
              { temperature: runtimeTemp }
            );
            
            // Runtime override should take precedence
            expect(merged.temperature).toBeCloseTo(runtimeTemp, 10);
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Runtime maxTokens override should take precedence
     * Requirements 3.1, 3.5
     */
    it('should allow runtime maxTokens override', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(1024, 2048, 4096, 8192),
          fc.constantFrom(1024, 2048, 4096, 8192),
          (configMaxTokens, runtimeMaxTokens) => {
            const merged = mergeFlowOptions(
              { maxTokens: configMaxTokens },
              { maxTokens: runtimeMaxTokens }
            );
            
            // Runtime override should take precedence
            expect(merged.maxTokens).toBe(runtimeMaxTokens);
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Runtime topP override should take precedence
     * Requirements 3.1, 3.5
     */
    it('should allow runtime topP override', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1, noNaN: true }),
          fc.double({ min: 0, max: 1, noNaN: true }),
          (configTopP, runtimeTopP) => {
            const merged = mergeFlowOptions(
              { topP: configTopP },
              { topP: runtimeTopP }
            );
            
            // Runtime override should take precedence
            expect(merged.topP).toBeCloseTo(runtimeTopP, 10);
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Multiple runtime overrides should all take precedence
     * Requirements 3.1, 3.5
     */
    it('should allow multiple runtime overrides simultaneously', () => {
      fc.assert(
        fc.property(
          fc.record({
            modelId: fc.constantFrom(...Object.values(BEDROCK_MODELS)),
            temperature: fc.double({ min: 0, max: 1, noNaN: true }),
            maxTokens: fc.constantFrom(1024, 2048, 4096, 8192),
            topP: fc.double({ min: 0, max: 1, noNaN: true }),
          }),
          fc.record({
            modelId: fc.constantFrom(...Object.values(BEDROCK_MODELS)),
            temperature: fc.double({ min: 0, max: 1, noNaN: true }),
            maxTokens: fc.constantFrom(1024, 2048, 4096, 8192),
            topP: fc.double({ min: 0, max: 1, noNaN: true }),
          }),
          (configOptions, runtimeOptions) => {
            const merged = mergeFlowOptions(configOptions, runtimeOptions);
            
            // All runtime overrides should be applied
            expect(merged.modelId).toBe(runtimeOptions.modelId);
            expect(merged.temperature).toBeCloseTo(runtimeOptions.temperature, 10);
            expect(merged.maxTokens).toBe(runtimeOptions.maxTokens);
            expect(merged.topP).toBeCloseTo(runtimeOptions.topP, 10);
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Partial runtime overrides should only override specified values
     * Requirements 3.1, 3.5
     */
    it('should preserve config values when runtime override is partial', () => {
      const configModelId = BEDROCK_MODELS.HAIKU;
      const configTemp = 0.3;
      const configMaxTokens = 2048;
      const configTopP = 0.9;
      
      // Override only temperature
      const merged1 = mergeFlowOptions(
        {
          modelId: configModelId,
          temperature: configTemp,
          maxTokens: configMaxTokens,
          topP: configTopP,
        },
        { temperature: 0.8 }
      );
      
      expect(merged1.modelId).toBe(configModelId);
      expect(merged1.temperature).toBe(0.8);
      expect(merged1.maxTokens).toBe(configMaxTokens);
      expect(merged1.topP).toBe(configTopP);

      // Override only modelId
      const merged2 = mergeFlowOptions(
        {
          modelId: configModelId,
          temperature: configTemp,
          maxTokens: configMaxTokens,
          topP: configTopP,
        },
        { modelId: BEDROCK_MODELS.SONNET_3_5_V2 }
      );
      
      expect(merged2.modelId).toBe(BEDROCK_MODELS.SONNET_3_5_V2);
      expect(merged2.temperature).toBe(configTemp);
      expect(merged2.maxTokens).toBe(configMaxTokens);
      expect(merged2.topP).toBe(configTopP);

      // Override modelId and maxTokens
      const merged3 = mergeFlowOptions(
        {
          modelId: configModelId,
          temperature: configTemp,
          maxTokens: configMaxTokens,
          topP: configTopP,
        },
        {
          modelId: BEDROCK_MODELS.OPUS,
          maxTokens: 4096,
        }
      );
      
      expect(merged3.modelId).toBe(BEDROCK_MODELS.OPUS);
      expect(merged3.temperature).toBe(configTemp);
      expect(merged3.maxTokens).toBe(4096);
      expect(merged3.topP).toBe(configTopP);
    });
  });

  describe('Property 6: Default model fallback works', () => {
    /**
     * When no model is specified, should use default from config
     * Requirements 3.2
     */
    it('should use default model when no options provided', () => {
      const config = getConfig();
      const merged = mergeFlowOptions();
      
      // Should use default model from config
      expect(merged.modelId).toBe(config.bedrock.modelId);
      expect(merged.temperature).toBe(0.7); // Default temperature
      expect(merged.maxTokens).toBe(4096); // Default maxTokens
      expect(merged.topP).toBe(1); // Default topP
    });

    /**
     * When config has model but no runtime override, should use config model
     * Requirements 3.2
     */
    it('should use config model when no runtime override provided', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(BEDROCK_MODELS)),
          (configModelId) => {
            const merged = mergeFlowOptions(
              { modelId: configModelId },
              undefined // No runtime override
            );
            
            // Should use config model
            expect(merged.modelId).toBe(configModelId);
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * mergeFlowOptions should correctly apply fallback logic
     * Requirements 3.2
     */
    it('should merge options with correct precedence', () => {
      const config = getConfig();
      
      // Test 1: No options at all - should use defaults
      const merged1 = mergeFlowOptions();
      expect(merged1.modelId).toBe(config.bedrock.modelId);
      expect(merged1.temperature).toBe(0.7);
      expect(merged1.maxTokens).toBe(4096);
      expect(merged1.topP).toBe(1);

      // Test 2: Config options only - should use config
      const merged2 = mergeFlowOptions({
        modelId: BEDROCK_MODELS.HAIKU,
        temperature: 0.3,
        maxTokens: 2048,
      });
      expect(merged2.modelId).toBe(BEDROCK_MODELS.HAIKU);
      expect(merged2.temperature).toBe(0.3);
      expect(merged2.maxTokens).toBe(2048);

      // Test 3: Runtime override - should use runtime
      const merged3 = mergeFlowOptions(
        {
          modelId: BEDROCK_MODELS.HAIKU,
          temperature: 0.3,
        },
        {
          modelId: BEDROCK_MODELS.SONNET_3_5_V2,
          temperature: 0.8,
        }
      );
      expect(merged3.modelId).toBe(BEDROCK_MODELS.SONNET_3_5_V2);
      expect(merged3.temperature).toBe(0.8);

      // Test 4: Partial runtime override - should merge
      const merged4 = mergeFlowOptions(
        {
          modelId: BEDROCK_MODELS.HAIKU,
          temperature: 0.3,
          maxTokens: 2048,
        },
        {
          temperature: 0.8,
        }
      );
      expect(merged4.modelId).toBe(BEDROCK_MODELS.HAIKU);
      expect(merged4.temperature).toBe(0.8);
      expect(merged4.maxTokens).toBe(2048);
    });

    /**
     * Default fallback should work for all configuration parameters
     * Requirements 3.2
     */
    it('should provide sensible defaults for all parameters', () => {
      fc.assert(
        fc.property(
          fc.record({
            hasConfigModelId: fc.boolean(),
            hasConfigTemp: fc.boolean(),
            hasConfigMaxTokens: fc.boolean(),
            hasRuntimeModelId: fc.boolean(),
            hasRuntimeTemp: fc.boolean(),
            hasRuntimeMaxTokens: fc.boolean(),
          }),
          (flags) => {
            const configOptions: FlowOptions = {
              ...(flags.hasConfigModelId && { modelId: BEDROCK_MODELS.HAIKU }),
              ...(flags.hasConfigTemp && { temperature: 0.3 }),
              ...(flags.hasConfigMaxTokens && { maxTokens: 2048 }),
            };

            const runtimeOptions: FlowExecutionOptions = {
              ...(flags.hasRuntimeModelId && { modelId: BEDROCK_MODELS.SONNET_3_5_V2 }),
              ...(flags.hasRuntimeTemp && { temperature: 0.8 }),
              ...(flags.hasRuntimeMaxTokens && { maxTokens: 4096 }),
            };

            const merged = mergeFlowOptions(configOptions, runtimeOptions);

            // All fields should have values (no undefined)
            expect(merged.modelId).toBeDefined();
            expect(merged.temperature).toBeDefined();
            expect(merged.maxTokens).toBeDefined();
            expect(merged.topP).toBeDefined();

            // Values should be valid
            expect(typeof merged.modelId).toBe('string');
            expect(merged.temperature).toBeGreaterThanOrEqual(0);
            expect(merged.temperature).toBeLessThanOrEqual(1);
            expect(merged.maxTokens).toBeGreaterThan(0);
            expect(merged.topP).toBeGreaterThanOrEqual(0);
            expect(merged.topP).toBeLessThanOrEqual(1);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Override Precedence', () => {
    /**
     * Runtime overrides should always take highest precedence
     */
    it('should follow correct precedence: runtime > config > default', () => {
      const config = getConfig();
      
      // Precedence test with all three levels
      const merged = mergeFlowOptions(
        {
          modelId: BEDROCK_MODELS.HAIKU,
          temperature: 0.3,
          maxTokens: 2048,
          topP: 0.9,
        },
        {
          modelId: BEDROCK_MODELS.SONNET_3_5_V2,
          temperature: 0.8,
          // maxTokens not specified - should use config
          // topP not specified - should use config
        }
      );

      expect(merged.modelId).toBe(BEDROCK_MODELS.SONNET_3_5_V2); // runtime
      expect(merged.temperature).toBe(0.8); // runtime
      expect(merged.maxTokens).toBe(2048); // config
      expect(merged.topP).toBe(0.9); // config
    });
  });
});
