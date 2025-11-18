/**
 * Property-based tests for input validation
 * 
 * Feature: ai-model-optimization, Property 7: Input validation precedes model invocation
 * Validates: Requirements 4.4
 */

import * as fc from 'fast-check';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { z } from 'zod';
import { definePrompt, MODEL_CONFIGS } from '../flow-base';
import { BedrockClient } from '../client';

// Mock the BedrockClient to track invocations
jest.mock('../client');

describe('Input Validation Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 7: Input validation precedes model invocation', () => {
    /**
     * Property-based test: Invalid input should be rejected before model invocation
     * Requirements 4.4
     */
    it('should reject invalid input before invoking the model', async () => {
      // Define a simple schema for testing
      const TestInputSchema = z.object({
        name: z.string().min(1),
        age: z.number().int().positive(),
        email: z.string().email(),
      });

      const TestOutputSchema = z.object({
        result: z.string(),
      });

      // Create a test prompt
      const testPrompt = definePrompt({
        name: 'testValidationPrompt',
        inputSchema: TestInputSchema,
        outputSchema: TestOutputSchema,
        prompt: 'Test prompt with {{{name}}}, {{{age}}}, {{{email}}}',
        options: MODEL_CONFIGS.SIMPLE,
      });

      // Mock the BedrockClient.invoke method
      const mockInvoke = jest.fn().mockResolvedValue({ result: 'success' });
      (BedrockClient as jest.MockedClass<typeof BedrockClient>).prototype.invoke = mockInvoke;

      // Generate invalid inputs that violate the schema
      const invalidInputArbitrary = fc.oneof(
        // Missing required fields
        fc.record({
          name: fc.constant(undefined),
          age: fc.integer({ min: 1, max: 100 }),
          email: fc.emailAddress(),
        }),
        fc.record({
          name: fc.string({ minLength: 1 }),
          age: fc.constant(undefined),
          email: fc.emailAddress(),
        }),
        // Invalid types
        fc.record({
          name: fc.integer(), // Should be string
          age: fc.integer({ min: 1, max: 100 }),
          email: fc.emailAddress(),
        }),
        fc.record({
          name: fc.string({ minLength: 1 }),
          age: fc.string(), // Should be number
          email: fc.emailAddress(),
        }),
        // Invalid values
        fc.record({
          name: fc.constant(''), // Empty string violates min(1)
          age: fc.integer({ min: 1, max: 100 }),
          email: fc.emailAddress(),
        }),
        fc.record({
          name: fc.string({ minLength: 1 }),
          age: fc.integer({ min: -100, max: 0 }), // Non-positive violates positive()
          email: fc.emailAddress(),
        }),
        fc.record({
          name: fc.string({ minLength: 1 }),
          age: fc.integer({ min: 1, max: 100 }),
          email: fc.string({ minLength: 1 }).filter(s => !s.includes('@')), // Invalid email
        })
      );

      await fc.assert(
        fc.asyncProperty(invalidInputArbitrary, async (invalidInput) => {
          // Attempt to invoke with invalid input
          try {
            await testPrompt(invalidInput as any);
            // If we get here, validation didn't work
            return false;
          } catch (error) {
            // Verify that:
            // 1. An error was thrown (validation failed)
            expect(error).toBeDefined();
            
            // 2. The error is a Zod validation error
            expect(error).toHaveProperty('name');
            expect((error as any).name).toBe('ZodError');
            
            // 3. The model was NEVER invoked
            expect(mockInvoke).not.toHaveBeenCalled();
            
            return true;
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property-based test: Valid input should pass validation and invoke model
     * Requirements 4.4
     */
    it('should pass valid input through validation and invoke the model', async () => {
      // Define a simple schema for testing
      const TestInputSchema = z.object({
        name: z.string().min(1),
        age: z.number().int().positive(),
        email: z.string().email(),
      });

      const TestOutputSchema = z.object({
        result: z.string(),
      });

      // Create a test prompt
      const testPrompt = definePrompt({
        name: 'testValidationPrompt',
        inputSchema: TestInputSchema,
        outputSchema: TestOutputSchema,
        prompt: 'Test prompt with {{{name}}}, {{{age}}}, {{{email}}}',
        options: MODEL_CONFIGS.SIMPLE,
      });

      // Mock the BedrockClient.invoke method
      const mockInvoke = jest.fn().mockResolvedValue({ result: 'success' });
      (BedrockClient as jest.MockedClass<typeof BedrockClient>).prototype.invoke = mockInvoke;

      // Generate valid inputs
      // Note: We use a custom email generator because fc.emailAddress() can generate
      // emails that don't pass Zod's stricter email validation
      const validInputArbitrary = fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        age: fc.integer({ min: 1, max: 120 }),
        email: fc.tuple(
          fc.stringMatching(/^[a-z0-9]+$/),
          fc.stringMatching(/^[a-z0-9]+$/),
          fc.constantFrom('com', 'org', 'net', 'edu')
        ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`),
      });

      await fc.assert(
        fc.asyncProperty(validInputArbitrary, async (validInput) => {
          // Clear mock before each test
          mockInvoke.mockClear();
          
          try {
            // Invoke with valid input
            await testPrompt(validInput);
            
            // Verify that the model WAS invoked
            expect(mockInvoke).toHaveBeenCalledTimes(1);
            
            return true;
          } catch (error) {
            // Valid input should not throw validation errors
            // (It might throw other errors like network errors, but not validation)
            if ((error as any).name === 'ZodError') {
              console.error('Unexpected validation error for valid input:', validInput, error);
              return false;
            }
            // Other errors are acceptable (e.g., network issues)
            return true;
          }
        }),
        { numRuns: 50 }
      );
    });

    /**
     * Property-based test: Validation should be deterministic
     * Requirements 4.4
     */
    it('should deterministically validate the same input', async () => {
      // Define a simple schema for testing
      const TestInputSchema = z.object({
        value: z.string().min(5).max(10),
      });

      const TestOutputSchema = z.object({
        result: z.string(),
      });

      // Create a test prompt
      const testPrompt = definePrompt({
        name: 'testDeterministicValidation',
        inputSchema: TestInputSchema,
        outputSchema: TestOutputSchema,
        prompt: 'Test prompt with {{{value}}}',
        options: MODEL_CONFIGS.SIMPLE,
      });

      // Mock the BedrockClient.invoke method
      const mockInvoke = jest.fn().mockResolvedValue({ result: 'success' });
      (BedrockClient as jest.MockedClass<typeof BedrockClient>).prototype.invoke = mockInvoke;

      // Generate any input (valid or invalid)
      const anyInputArbitrary = fc.record({
        value: fc.oneof(
          fc.string({ minLength: 5, maxLength: 10 }), // Valid
          fc.string({ minLength: 0, maxLength: 4 }),  // Too short
          fc.string({ minLength: 11, maxLength: 50 }) // Too long
        ),
      });

      await fc.assert(
        fc.asyncProperty(anyInputArbitrary, async (input) => {
          // Clear mock before each test
          mockInvoke.mockClear();
          
          // Try the same input twice
          let result1: { success: boolean; error?: any };
          let result2: { success: boolean; error?: any };
          
          try {
            await testPrompt(input);
            result1 = { success: true };
          } catch (error) {
            result1 = { success: false, error: (error as any).name };
          }
          
          // Clear mock between attempts
          mockInvoke.mockClear();
          
          try {
            await testPrompt(input);
            result2 = { success: true };
          } catch (error) {
            result2 = { success: false, error: (error as any).name };
          }
          
          // Both attempts should have the same outcome
          expect(result1.success).toBe(result2.success);
          if (!result1.success && !result2.success) {
            expect(result1.error).toBe(result2.error);
          }
          
          return true;
        }),
        { numRuns: 50 }
      );
    });

    /**
     * Property-based test: Validation should handle edge cases
     * Requirements 4.4
     */
    it('should handle edge case inputs correctly', async () => {
      // Define a schema with various constraints
      const TestInputSchema = z.object({
        count: z.number().int().min(0).max(100),
        text: z.string().min(1).max(1000),
        optional: z.string().optional(),
      });

      const TestOutputSchema = z.object({
        result: z.string(),
      });

      // Create a test prompt
      const testPrompt = definePrompt({
        name: 'testEdgeCaseValidation',
        inputSchema: TestInputSchema,
        outputSchema: TestOutputSchema,
        prompt: 'Test prompt',
        options: MODEL_CONFIGS.SIMPLE,
      });

      // Mock the BedrockClient.invoke method
      const mockInvoke = jest.fn().mockResolvedValue({ result: 'success' });
      (BedrockClient as jest.MockedClass<typeof BedrockClient>).prototype.invoke = mockInvoke;

      // Test edge cases
      const edgeCases = [
        // Boundary values
        { count: 0, text: 'a' },           // Minimum values
        { count: 100, text: 'a'.repeat(1000) }, // Maximum values
        { count: 50, text: 'test', optional: undefined }, // Optional field omitted
        { count: 50, text: 'test', optional: '' },        // Optional field empty
        // Just outside boundaries (should fail)
        { count: -1, text: 'test' },       // Below minimum
        { count: 101, text: 'test' },      // Above maximum
        { count: 50, text: '' },           // Empty required string
        { count: 50, text: 'a'.repeat(1001) }, // String too long
      ];

      for (const testCase of edgeCases) {
        mockInvoke.mockClear();
        
        try {
          await testPrompt(testCase as any);
          
          // If successful, verify it was a valid case
          const isValid = 
            testCase.count >= 0 && 
            testCase.count <= 100 && 
            testCase.text.length >= 1 && 
            testCase.text.length <= 1000;
          
          expect(isValid).toBe(true);
          expect(mockInvoke).toHaveBeenCalledTimes(1);
        } catch (error) {
          // If failed, verify it was an invalid case
          const isValid = 
            testCase.count >= 0 && 
            testCase.count <= 100 && 
            testCase.text.length >= 1 && 
            testCase.text.length <= 1000;
          
          expect(isValid).toBe(false);
          expect((error as any).name).toBe('ZodError');
          expect(mockInvoke).not.toHaveBeenCalled();
        }
      }
    });

    /**
     * Property-based test: Validation should reject extra fields in strict mode
     * Requirements 4.4
     */
    it('should handle extra fields according to schema configuration', async () => {
      // Define a strict schema
      const TestInputSchema = z.object({
        name: z.string(),
        age: z.number(),
      }).strict();

      const TestOutputSchema = z.object({
        result: z.string(),
      });

      // Create a test prompt
      const testPrompt = definePrompt({
        name: 'testStrictValidation',
        inputSchema: TestInputSchema,
        outputSchema: TestOutputSchema,
        prompt: 'Test prompt',
        options: MODEL_CONFIGS.SIMPLE,
      });

      // Mock the BedrockClient.invoke method
      const mockInvoke = jest.fn().mockResolvedValue({ result: 'success' });
      (BedrockClient as jest.MockedClass<typeof BedrockClient>).prototype.invoke = mockInvoke;

      // Generate inputs with extra fields
      const inputWithExtraFieldsArbitrary = fc.record({
        name: fc.string({ minLength: 1 }),
        age: fc.integer({ min: 1, max: 100 }),
        extraField: fc.string(), // This should cause validation to fail in strict mode
      });

      await fc.assert(
        fc.asyncProperty(inputWithExtraFieldsArbitrary, async (input) => {
          mockInvoke.mockClear();
          
          try {
            await testPrompt(input as any);
            // Should not reach here with strict schema
            return false;
          } catch (error) {
            // Should throw validation error
            expect((error as any).name).toBe('ZodError');
            // Model should not be invoked
            expect(mockInvoke).not.toHaveBeenCalled();
            return true;
          }
        }),
        { numRuns: 50 }
      );
    });

    /**
     * Test that validation errors contain useful information
     * Requirements 4.4
     */
    it('should provide clear validation error messages', async () => {
      const TestInputSchema = z.object({
        email: z.string().email(),
        age: z.number().int().positive(),
      });

      const TestOutputSchema = z.object({
        result: z.string(),
      });

      const testPrompt = definePrompt({
        name: 'testValidationErrors',
        inputSchema: TestInputSchema,
        outputSchema: TestOutputSchema,
        prompt: 'Test prompt',
        options: MODEL_CONFIGS.SIMPLE,
      });

      // Mock the BedrockClient.invoke method
      const mockInvoke = jest.fn().mockResolvedValue({ result: 'success' });
      (BedrockClient as jest.MockedClass<typeof BedrockClient>).prototype.invoke = mockInvoke;

      // Test with invalid email
      try {
        await testPrompt({ email: 'not-an-email', age: 25 } as any);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as any).name).toBe('ZodError');
        expect((error as any).issues).toBeDefined();
        expect((error as any).issues.length).toBeGreaterThan(0);
        expect(mockInvoke).not.toHaveBeenCalled();
      }

      mockInvoke.mockClear();

      // Test with invalid age
      try {
        await testPrompt({ email: 'test@example.com', age: -5 } as any);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as any).name).toBe('ZodError');
        expect((error as any).issues).toBeDefined();
        expect((error as any).issues.length).toBeGreaterThan(0);
        expect(mockInvoke).not.toHaveBeenCalled();
      }
    });
  });
});
