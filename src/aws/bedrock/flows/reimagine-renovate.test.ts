/**
 * Tests for virtual renovation visualization
 * 
 * Feature: reimagine-image-toolkit
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { virtualRenovation } from './reimagine-renovate';

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
    renovatedImageData: 'mocked-renovated-image-data',
    imageFormat: 'png',
    description: 'Mocked renovation description',
  })),
  MODEL_CONFIGS: {},
  BEDROCK_MODELS: { TITAN_IMAGE: 'amazon.titan-image-generator-v1' },
}));

describe('Virtual Renovation Flow', () => {
  // Helper to create a simple test image (1x1 pixel PNG)
  const createTestImageData = (): string => {
    // 1x1 transparent PNG in base64
    const pngData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    return pngData;
  };

  it('should return renovated image data with description only', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        description: 'Update the kitchen with new cabinets, countertops, and modern appliances',
      },
    };

    const output = await virtualRenovation(input);

    // Verify structure
    expect(output).toHaveProperty('renovatedImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.renovatedImageData).toBe('string');
    expect(output.renovatedImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000); // 60 second timeout for API calls

  it('should return renovated image data with description and style', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        description: 'Renovate the bathroom with new tile, fixtures, and vanity',
        style: 'modern',
      },
    };

    const output = await virtualRenovation(input);

    // Verify structure
    expect(output).toHaveProperty('renovatedImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.renovatedImageData).toBe('string');
    expect(output.renovatedImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000);

  it('should handle major renovation descriptions', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        description: 'Complete gut renovation with open concept layout, remove wall between kitchen and living room',
        style: 'contemporary',
      },
    };

    const output = await virtualRenovation(input);

    // Verify structure
    expect(output).toHaveProperty('renovatedImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.renovatedImageData).toBe('string');
    expect(output.renovatedImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000);

  it('should handle minor renovation descriptions', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        description: 'Paint walls, replace light fixtures, and update hardware',
        style: 'traditional',
      },
    };

    const output = await virtualRenovation(input);

    // Verify structure
    expect(output).toHaveProperty('renovatedImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.renovatedImageData).toBe('string');
    expect(output.renovatedImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000);

  it('should handle various style presets', async () => {
    const styles = ['modern', 'farmhouse', 'industrial', 'coastal'];

    for (const style of styles) {
      const input = {
        imageData: createTestImageData(),
        imageFormat: 'png' as const,
        params: {
          description: 'Renovate the living room with new flooring and updated finishes',
          style,
        },
      };

      const output = await virtualRenovation(input);
      expect(output).toHaveProperty('renovatedImageData');
      expect(output.renovatedImageData.length).toBeGreaterThan(0);
    }
  }, 240000); // 4 minutes for multiple API calls

  it('should validate input schema - reject description too short', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        description: 'Paint', // Too short (< 10 characters)
      },
    };

    await expect(virtualRenovation(input)).rejects.toThrow();
  });

  it('should validate input schema - reject description too long', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        description: 'A'.repeat(1001), // Too long (> 1000 characters)
      },
    };

    await expect(virtualRenovation(input)).rejects.toThrow();
  });

  it('should validate image format', async () => {
    // Test with invalid image format
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'gif' as any,
      params: {
        description: 'Update the kitchen with modern finishes',
      },
    };

    await expect(virtualRenovation(input)).rejects.toThrow();
  });

  it('should handle empty image data', async () => {
    const input = {
      imageData: '',
      imageFormat: 'png' as const,
      params: {
        description: 'Renovate the bathroom with new fixtures',
      },
    };

    // Should either throw validation error or handle gracefully
    await expect(virtualRenovation(input)).rejects.toThrow();
  });

  it('should accept all supported image formats', async () => {
    const formats: Array<'jpeg' | 'png' | 'webp'> = ['jpeg', 'png', 'webp'];

    for (const format of formats) {
      const input = {
        imageData: createTestImageData(),
        imageFormat: format,
        params: {
          description: 'Update the bedroom with fresh paint and new flooring',
        },
      };

      const output = await virtualRenovation(input);
      expect(output).toHaveProperty('renovatedImageData');
      expect(output.imageFormat).toBe('png'); // Titan always returns PNG
    }
  }, 180000); // 3 minutes for multiple API calls

  it('should handle renovation with custom style not in presets', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        description: 'Renovate the office with built-in shelving and desk',
        style: 'scandinavian', // Not in preset list
      },
    };

    const output = await virtualRenovation(input);

    // Should still work with custom style
    expect(output).toHaveProperty('renovatedImageData');
    expect(output.renovatedImageData.length).toBeGreaterThan(0);
  }, 60000);

  it('should handle detailed architectural renovation description', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        description: 'Add crown molding, wainscoting, and coffered ceiling. Replace windows with larger ones for more natural light. Install hardwood flooring throughout.',
        style: 'craftsman',
      },
    };

    const output = await virtualRenovation(input);

    // Verify structure
    expect(output).toHaveProperty('renovatedImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.renovatedImageData).toBe('string');
    expect(output.renovatedImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000);
});
