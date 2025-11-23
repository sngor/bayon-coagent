/**
 * Tests for image enhancement
 * 
 * Feature: reimagine-image-toolkit
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { enhanceImage } from './reimagine-enhance';

// Mock the Bedrock client to avoid real API calls
jest.mock('../client', () => ({
  invokeBedrock: jest.fn(),
}));

// Mock the flow-base module
jest.mock('../flow-base', () => ({
  defineFlow: jest.fn((config, fn) => ({
    execute: fn,
  })),
  definePrompt: jest.fn(() => jest.fn().mockResolvedValue({
    enhancedImageData: 'mocked-enhanced-image-data',
    imageFormat: 'png',
  })),
  MODEL_CONFIGS: {},
  BEDROCK_MODELS: { TITAN_IMAGE: 'amazon.titan-image-generator-v1' },
}));

describe('Image Enhancement Flow', () => {
  // Helper to create a test image that meets Bedrock requirements (64x64 = 4096 pixels minimum)
  const createTestImageData = (): string => {
    // Skip actual image processing tests in unit tests - these require real AWS Bedrock
    // Return a placeholder that would represent a valid 64x64 PNG
    const validImagePlaceholder = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVHic7ZtPaBNBFMafJBsT';
    return validImagePlaceholder;
  };

  it('should return enhanced image data with auto-adjust', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        autoAdjust: true,
      },
    };

    const output = await enhanceImage(input);

    // Verify structure
    expect(output).toHaveProperty('enhancedImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.enhancedImageData).toBe('string');
    expect(output.enhancedImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000); // 60 second timeout for API calls

  it('should return enhanced image data with manual brightness adjustment', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        autoAdjust: false,
        brightness: 50,
      },
    };

    const output = await enhanceImage(input);

    // Verify structure
    expect(output).toHaveProperty('enhancedImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.enhancedImageData).toBe('string');
    expect(output.enhancedImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000);

  it('should return enhanced image data with manual contrast adjustment', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        autoAdjust: false,
        contrast: -30,
      },
    };

    const output = await enhanceImage(input);

    // Verify structure
    expect(output).toHaveProperty('enhancedImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.enhancedImageData).toBe('string');
    expect(output.enhancedImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000);

  it('should return enhanced image data with manual saturation adjustment', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        autoAdjust: false,
        saturation: 40,
      },
    };

    const output = await enhanceImage(input);

    // Verify structure
    expect(output).toHaveProperty('enhancedImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.enhancedImageData).toBe('string');
    expect(output.enhancedImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000);

  it('should return enhanced image data with multiple manual adjustments', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        autoAdjust: false,
        brightness: 20,
        contrast: 15,
        saturation: -10,
      },
    };

    const output = await enhanceImage(input);

    // Verify structure
    expect(output).toHaveProperty('enhancedImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.enhancedImageData).toBe('string');
    expect(output.enhancedImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000);

  it('should validate input schema - reject brightness out of range', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        autoAdjust: false,
        brightness: 150, // Out of range
      },
    };

    await expect(enhanceImage(input)).rejects.toThrow();
  });

  it('should validate input schema - reject contrast out of range', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        autoAdjust: false,
        contrast: -150, // Out of range
      },
    };

    await expect(enhanceImage(input)).rejects.toThrow();
  });

  it('should validate input schema - reject saturation out of range', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        autoAdjust: false,
        saturation: 200, // Out of range
      },
    };

    await expect(enhanceImage(input)).rejects.toThrow();
  });

  it('should validate image format', async () => {
    // Test with invalid image format
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'gif' as any,
      params: {
        autoAdjust: true,
      },
    };

    await expect(enhanceImage(input)).rejects.toThrow();
  });

  it('should handle empty image data', async () => {
    const input = {
      imageData: '',
      imageFormat: 'png' as const,
      params: {
        autoAdjust: true,
      },
    };

    // Should either throw validation error or handle gracefully
    await expect(enhanceImage(input)).rejects.toThrow();
  });

  it('should accept all supported image formats', async () => {
    const formats: Array<'jpeg' | 'png' | 'webp'> = ['jpeg', 'png', 'webp'];

    for (const format of formats) {
      const input = {
        imageData: createTestImageData(),
        imageFormat: format,
        params: {
          autoAdjust: true,
        },
      };

      const output = await enhanceImage(input);
      expect(output).toHaveProperty('enhancedImageData');
      expect(output.imageFormat).toBe('png'); // Titan always returns PNG
    }
  }, 180000); // 3 minutes for multiple API calls

  it('should handle zero adjustments by using auto-enhance', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        autoAdjust: false,
        brightness: 0,
        contrast: 0,
        saturation: 0,
      },
    };

    const output = await enhanceImage(input);

    // Should still return enhanced image (falls back to auto-enhance)
    expect(output).toHaveProperty('enhancedImageData');
    expect(output.enhancedImageData.length).toBeGreaterThan(0);
  }, 60000);
});
