/**
 * Tests for image enhancement
 * 
 * Feature: reimagine-image-toolkit
 */

import { describe, it, expect } from '@jest/globals';
import { enhanceImage } from './reimagine-enhance';

describe('Image Enhancement Flow', () => {
  // Helper to create a simple test image (1x1 pixel PNG)
  const createTestImageData = (): string => {
    // 1x1 transparent PNG in base64
    const pngData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    return pngData;
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
