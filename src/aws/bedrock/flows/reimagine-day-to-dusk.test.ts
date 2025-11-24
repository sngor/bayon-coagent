/**
 * Tests for day-to-dusk lighting transformation
 * 
 * Feature: reimagine-image-toolkit
 */

import { describe, it, expect } from '@jest/globals';
import { dayToDusk } from './reimagine-day-to-dusk';

describe('Day-to-Dusk Transformation Flow', () => {
  // Helper to create a simple test image (1x1 pixel PNG)
  const createTestImageData = (): string => {
    // 1x1 transparent PNG in base64
    const pngData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    return pngData;
  };

  it('should return transformed image data with subtle intensity (day-to-dusk)', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        intensity: 'subtle' as const,
        direction: 'day-to-dusk' as const,
      },
    };

    const output = await dayToDusk(input);

    // Verify structure
    expect(output).toHaveProperty('duskImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.duskImageData).toBe('string');
    expect(output.duskImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000); // 60 second timeout for API calls

  it('should return transformed image data with moderate intensity (day-to-dusk)', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        intensity: 'moderate' as const,
        direction: 'day-to-dusk' as const,
      },
    };

    const output = await dayToDusk(input);

    // Verify structure
    expect(output).toHaveProperty('duskImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.duskImageData).toBe('string');
    expect(output.duskImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000);

  it('should return transformed image data with dramatic intensity (day-to-dusk)', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        intensity: 'dramatic' as const,
        direction: 'day-to-dusk' as const,
      },
    };

    const output = await dayToDusk(input);

    // Verify structure
    expect(output).toHaveProperty('duskImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.duskImageData).toBe('string');
    expect(output.duskImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000);

  it('should return transformed image data with moderate intensity (dusk-to-day)', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        intensity: 'moderate' as const,
        direction: 'dusk-to-day' as const,
      },
    };

    const output = await dayToDusk(input);

    // Verify structure
    expect(output).toHaveProperty('duskImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.duskImageData).toBe('string');
    expect(output.duskImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000);

  it('should default to day-to-dusk when direction is not specified', async () => {
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        intensity: 'moderate' as const,
      },
    };

    const output = await dayToDusk(input);

    // Verify structure
    expect(output).toHaveProperty('duskImageData');
    expect(output).toHaveProperty('imageFormat');

    // Verify output format
    expect(typeof output.duskImageData).toBe('string');
    expect(output.duskImageData.length).toBeGreaterThan(0);
    expect(output.imageFormat).toBe('png');
  }, 60000);

  it('should validate input schema', async () => {
    // Test with invalid intensity
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'png' as const,
      params: {
        intensity: 'invalid' as any,
        direction: 'day-to-dusk' as const,
      },
    };

    await expect(dayToDusk(input)).rejects.toThrow();
  });

  it('should validate image format', async () => {
    // Test with invalid image format
    const input = {
      imageData: createTestImageData(),
      imageFormat: 'gif' as any,
      params: {
        intensity: 'moderate' as const,
        direction: 'day-to-dusk' as const,
      },
    };

    await expect(dayToDusk(input)).rejects.toThrow();
  });

  it('should handle empty image data', async () => {
    const input = {
      imageData: '',
      imageFormat: 'png' as const,
      params: {
        intensity: 'moderate' as const,
        direction: 'day-to-dusk' as const,
      },
    };

    // Should either throw validation error or handle gracefully
    await expect(dayToDusk(input)).rejects.toThrow();
  });

  it('should accept all supported image formats', async () => {
    const formats: Array<'jpeg' | 'png' | 'webp'> = ['jpeg', 'png', 'webp'];

    for (const format of formats) {
      const input = {
        imageData: createTestImageData(),
        imageFormat: format,
        params: {
          intensity: 'moderate' as const,
          direction: 'day-to-dusk' as const,
        },
      };

      const output = await dayToDusk(input);
      expect(output).toHaveProperty('duskImageData');
      expect(output.imageFormat).toBe('png'); // SDXL always returns PNG
    }
  }, 180000); // 3 minutes for multiple API calls
});
