/**
 * Tests for image analysis and suggestion generation
 * 
 * Feature: reimagine-image-toolkit
 */

import { describe, it, expect } from '@jest/globals';
import { analyzeImage } from './reimagine-analyze';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Image Analysis Flow', () => {
  // Helper to create a simple test image (1x1 pixel PNG)
  const createTestImageData = (): string => {
    // 1x1 transparent PNG in base64
    const pngData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    return pngData;
  };

  it('should return suggestions array and analysis', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
    };

    const output = await analyzeImage(input);

    // Verify structure
    expect(output).toHaveProperty('suggestions');
    expect(output).toHaveProperty('analysis');
    
    // Verify suggestions is an array
    expect(Array.isArray(output.suggestions)).toBe(true);
    expect(output.suggestions.length).toBeGreaterThan(0);
    
    // Verify analysis is a string
    expect(typeof output.analysis).toBe('string');
    expect(output.analysis.length).toBeGreaterThan(0);
  }, 60000); // 60 second timeout for API calls

  it('should return valid suggestion structure', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
    };

    const output = await analyzeImage(input);

    // Check first suggestion has required fields
    const suggestion = output.suggestions[0];
    expect(suggestion).toHaveProperty('editType');
    expect(suggestion).toHaveProperty('priority');
    expect(suggestion).toHaveProperty('reason');
    expect(suggestion).toHaveProperty('confidence');
    
    // Verify types
    expect(['virtual-staging', 'day-to-dusk', 'enhance', 'item-removal', 'virtual-renovation']).toContain(suggestion.editType);
    expect(['high', 'medium', 'low']).toContain(suggestion.priority);
    expect(typeof suggestion.reason).toBe('string');
    expect(typeof suggestion.confidence).toBe('number');
    expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
    expect(suggestion.confidence).toBeLessThanOrEqual(1);
  }, 60000);

  it('should handle errors gracefully and return fallback suggestions', async () => {
    // Test with invalid base64 data
    const input = {
      imageData: 'invalid-base64-data',
      imageFormat: 'png' as const,
    };

    const output = await analyzeImage(input);

    // Should still return valid structure with fallback
    expect(output).toHaveProperty('suggestions');
    expect(output).toHaveProperty('analysis');
    expect(Array.isArray(output.suggestions)).toBe(true);
    expect(output.suggestions.length).toBeGreaterThan(0);
    
    // Fallback should suggest enhancement
    expect(output.suggestions[0].editType).toBe('enhance');
  }, 60000);
});

