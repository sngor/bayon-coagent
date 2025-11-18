/**
 * Example property-based test demonstrating fast-check setup
 * 
 * This test file shows how to use the testing utilities and
 * serves as a verification that fast-check is properly configured.
 */

import * as fc from 'fast-check';
import { describe, it, expect } from '@jest/globals';
import {
  colorArbitrary,
  viewportArbitrary,
  nonEmptyStringArbitrary,
  emailArbitrary,
  isValidColor,
  isMobileViewport,
  isTabletViewport,
  isDesktopViewport,
  isValidEmail,
  mockViewport,
} from './utils';

describe('fast-check setup verification', () => {
  describe('Basic Properties', () => {
    it('should verify addition is commutative', () => {
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (a, b) => {
          return a + b === b + a;
        }),
        { numRuns: 100 }
      );
    });

    it('should verify string concatenation length', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (a, b) => {
          const result = a + b;
          return result.length === a.length + b.length;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Custom Generators', () => {
    it('should generate valid colors', () => {
      fc.assert(
        fc.property(colorArbitrary(), (color) => {
          return isValidColor(color);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid viewports', () => {
      fc.assert(
        fc.property(viewportArbitrary(), (viewport) => {
          return (
            viewport.width >= 320 &&
            viewport.width <= 3840 &&
            viewport.height >= 568 &&
            viewport.height <= 2160
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should generate non-empty strings', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary(), (str) => {
          return str.length > 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid emails', () => {
      fc.assert(
        fc.property(emailArbitrary(), (email) => {
          return isValidEmail(email);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Viewport Classification', () => {
    it('should correctly classify mobile viewports', () => {
      fc.assert(
        fc.property(fc.integer({ min: 320, max: 767 }), (width) => {
          return isMobileViewport(width);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly classify tablet viewports', () => {
      fc.assert(
        fc.property(fc.integer({ min: 768, max: 1023 }), (width) => {
          return isTabletViewport(width);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly classify desktop viewports', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1024, max: 3840 }), (width) => {
          return isDesktopViewport(width);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Mock Helpers', () => {
    it('should create valid viewport mocks', () => {
      const viewport = mockViewport(375, 667);
      expect(viewport.width).toBe(375);
      expect(viewport.height).toBe(667);
      expect(viewport.isMobile).toBe(true);
      expect(viewport.isTablet).toBe(false);
      expect(viewport.isDesktop).toBe(false);
    });

    it('should classify viewport correctly in mock', () => {
      fc.assert(
        fc.property(viewportArbitrary(), (vp) => {
          const mock = mockViewport(vp.width, vp.height);
          const expectedMobile = vp.width < 768;
          const expectedTablet = vp.width >= 768 && vp.width < 1024;
          const expectedDesktop = vp.width >= 1024;

          return (
            mock.isMobile === expectedMobile &&
            mock.isTablet === expectedTablet &&
            mock.isDesktop === expectedDesktop
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Invariant Properties', () => {
    it('should maintain viewport width after mock creation', () => {
      fc.assert(
        fc.property(viewportArbitrary(), (viewport) => {
          const mock = mockViewport(viewport.width, viewport.height);
          return mock.width === viewport.width && mock.height === viewport.height;
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure exactly one viewport classification is true', () => {
      fc.assert(
        fc.property(fc.integer({ min: 320, max: 3840 }), (width) => {
          const mock = mockViewport(width, 800);
          const trueCount = [mock.isMobile, mock.isTablet, mock.isDesktop].filter(
            Boolean
          ).length;
          return trueCount === 1;
        }),
        { numRuns: 100 }
      );
    });
  });
});
