/**
 * Rate Limiter Tests
 * 
 * Tests for the rate limiting functionality
 */

import { describe, it, expect } from '@jest/globals';
import { formatRateLimitError, RATE_LIMITS } from '../rate-limiter';

describe('Rate Limiter', () => {
  describe('RATE_LIMITS configuration', () => {
    it('should have correct upload limits', () => {
      expect(RATE_LIMITS.upload.maxRequests).toBe(10);
      expect(RATE_LIMITS.upload.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });

    it('should have correct edit limits', () => {
      expect(RATE_LIMITS.edit.maxRequests).toBe(20);
      expect(RATE_LIMITS.edit.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });
  });

  describe('formatRateLimitError', () => {
    it('should format error message with hours and minutes', () => {
      const retryAfter = 3661; // 1 hour, 1 minute, 1 second
      const message = formatRateLimitError('upload', retryAfter);

      expect(message).toContain('1 hour');
      expect(message).toContain('1 minute');
      expect(message).toContain('10 image uploads per hour');
    });

    it('should format error message with minutes only', () => {
      const retryAfter = 125; // 2 minutes, 5 seconds
      const message = formatRateLimitError('edit', retryAfter);

      expect(message).toContain('2 minutes');
      expect(message).toContain('5 seconds');
      expect(message).toContain('20 edit operations per hour');
    });

    it('should format error message with seconds only', () => {
      const retryAfter = 45; // 45 seconds
      const message = formatRateLimitError('upload', retryAfter);

      expect(message).toContain('45 seconds');
      expect(message).not.toContain('minute');
      // Note: message contains "per hour" so we check for time duration format
      expect(message).not.toMatch(/\d+ hour/); // No hour duration in retry time
    });
  });
});
