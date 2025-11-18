/**
 * Mobile Optimization Tests
 * 
 * Tests for mobile responsiveness utilities
 * Requirements: 4.1, 4.5, 16.1, 16.3
 */

import { describe, it, expect } from '@jest/globals';
import {
  getInputType,
  MIN_TOUCH_TARGET_SIZE,
  BREAKPOINTS,
  INPUT_TYPES,
  getMobileClasses,
  TOUCH_FRIENDLY_CLASSES,
} from '../mobile-optimization';

describe('Mobile Optimization Utilities', () => {
  describe('getInputType', () => {
    it('should return email type for email fields', () => {
      expect(getInputType('email')).toBe(INPUT_TYPES.email);
      expect(getInputType('userEmail')).toBe(INPUT_TYPES.email);
      expect(getInputType('contact-email')).toBe(INPUT_TYPES.email);
    });

    it('should return tel type for phone fields', () => {
      expect(getInputType('phone')).toBe(INPUT_TYPES.phone);
      expect(getInputType('telephone')).toBe(INPUT_TYPES.phone);
      expect(getInputType('phoneNumber')).toBe(INPUT_TYPES.phone);
      expect(getInputType('tel')).toBe(INPUT_TYPES.phone);
    });

    it('should return url type for website fields', () => {
      expect(getInputType('website')).toBe(INPUT_TYPES.url);
      expect(getInputType('url')).toBe(INPUT_TYPES.url);
      expect(getInputType('siteUrl')).toBe(INPUT_TYPES.url);
    });

    it('should return number type for numeric fields', () => {
      expect(getInputType('yearsOfExperience')).toBe(INPUT_TYPES.number);
      expect(getInputType('age')).toBe(INPUT_TYPES.number);
      expect(getInputType('count')).toBe(INPUT_TYPES.number);
    });

    it('should return text type for unknown fields', () => {
      expect(getInputType('name')).toBe('text');
      expect(getInputType('description')).toBe('text');
      expect(getInputType('unknown')).toBe('text');
    });
  });

  describe('Touch Target Constants', () => {
    it('should have minimum touch target size of 44px', () => {
      expect(MIN_TOUCH_TARGET_SIZE).toBe(44);
    });

    it('should have correct breakpoints', () => {
      expect(BREAKPOINTS.mobile).toBe(768);
      expect(BREAKPOINTS.tablet).toBe(1024);
      expect(BREAKPOINTS.desktop).toBe(1280);
    });
  });

  describe('getMobileClasses', () => {
    it('should return base classes for button', () => {
      const classes = getMobileClasses('button');
      expect(classes).toContain('min-h-[44px]');
      expect(classes).toContain('min-w-[44px]');
      expect(classes).toContain('touch-manipulation');
    });

    it('should return base classes for input', () => {
      const classes = getMobileClasses('input');
      expect(classes).toContain('min-h-[44px]');
      expect(classes).toContain('touch-manipulation');
      expect(classes).toContain('text-base');
    });

    it('should combine with additional classes', () => {
      const classes = getMobileClasses('button', 'bg-primary text-white');
      expect(classes).toContain('min-h-[44px]');
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-white');
    });
  });

  describe('Touch Friendly Classes', () => {
    it('should have touch-friendly classes for all interactive elements', () => {
      expect(TOUCH_FRIENDLY_CLASSES.button).toContain('min-h-[44px]');
      expect(TOUCH_FRIENDLY_CLASSES.input).toContain('min-h-[44px]');
      expect(TOUCH_FRIENDLY_CLASSES.select).toContain('min-h-[44px]');
      expect(TOUCH_FRIENDLY_CLASSES.link).toContain('min-h-[44px]');
    });

    it('should include touch-manipulation for all elements', () => {
      Object.values(TOUCH_FRIENDLY_CLASSES).forEach(classes => {
        expect(classes).toContain('touch-manipulation');
      });
    });
  });
});
