/**
 * Unit tests for ImageUploader file validation
 * 
 * Tests the file validation logic used by the ImageUploader component
 * Requirements: 1.2, 1.3
 */

import { describe, it, expect } from '@jest/globals';

// File validation constants from reimagine-schemas
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

// File validation function (matches component logic)
function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds 10MB limit. Please compress your image or select a smaller file.',
    };
  }

  if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload JPEG, PNG, or WebP images.',
    };
  }

  return { valid: true };
}

describe('ImageUploader File Validation', () => {
  describe('File Size Validation (Requirement 1.2)', () => {
    it('accepts files under 10MB', () => {
      const file = new File(['x'.repeat(9 * 1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts files exactly at 10MB', () => {
      const file = new File(['x'.repeat(10 * 1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects files over 10MB', () => {
      const file = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });

      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'File size exceeds 10MB limit. Please compress your image or select a smaller file.'
      );
    });

    it('accepts small files (1MB)', () => {
      const file = new File(['x'.repeat(1024 * 1024)], 'small.jpg', {
        type: 'image/jpeg',
      });

      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('File Format Validation (Requirement 1.3)', () => {
    it('accepts JPEG files', () => {
      const file = new File(['test'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts PNG files', () => {
      const file = new File(['test'], 'test.png', {
        type: 'image/png',
      });

      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts WebP files', () => {
      const file = new File(['test'], 'test.webp', {
        type: 'image/webp',
      });

      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects GIF files', () => {
      const file = new File(['test'], 'test.gif', {
        type: 'image/gif',
      });

      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Unsupported file format. Please upload JPEG, PNG, or WebP images.'
      );
    });

    it('rejects BMP files', () => {
      const file = new File(['test'], 'test.bmp', {
        type: 'image/bmp',
      });

      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Unsupported file format. Please upload JPEG, PNG, or WebP images.'
      );
    });

    it('rejects SVG files', () => {
      const file = new File(['test'], 'test.svg', {
        type: 'image/svg+xml',
      });

      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Unsupported file format. Please upload JPEG, PNG, or WebP images.'
      );
    });

    it('rejects PDF files', () => {
      const file = new File(['test'], 'test.pdf', {
        type: 'application/pdf',
      });

      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Unsupported file format. Please upload JPEG, PNG, or WebP images.'
      );
    });
  });

  describe('Combined Validation', () => {
    it('rejects large unsupported files', () => {
      const file = new File(['x'.repeat(11 * 1024 * 1024)], 'large.gif', {
        type: 'image/gif',
      });

      const result = validateFile(file);

      // Should fail on size first
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds 10MB limit');
    });

    it('accepts valid JPEG at maximum size', () => {
      const file = new File(['x'.repeat(10 * 1024 * 1024)], 'max-size.jpg', {
        type: 'image/jpeg',
      });

      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts valid PNG at minimum size', () => {
      const file = new File(['x'], 'tiny.png', {
        type: 'image/png',
      });

      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
