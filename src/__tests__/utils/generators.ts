/**
 * Custom generators for property-based testing
 * 
 * These generators create random test data that matches the domain
 * constraints of the application.
 */

import * as fc from 'fast-check';

/**
 * Generate valid CSS color values (hex, rgb, hsl)
 */
export const colorArbitrary = () =>
  fc.oneof(
    // Hex colors - generate 6 hex digits
    fc
      .tuple(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 })
      )
      .map(([r, g, b]) => {
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }),
    // RGB colors
    fc
      .tuple(fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }))
      .map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`),
    // HSL colors
    fc
      .tuple(fc.integer({ min: 0, max: 360 }), fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }))
      .map(([h, s, l]) => `hsl(${h}, ${s}%, ${l}%)`)
  );

/**
 * Generate valid viewport sizes
 */
export const viewportArbitrary = () =>
  fc.record({
    width: fc.integer({ min: 320, max: 3840 }), // Mobile to 4K
    height: fc.integer({ min: 568, max: 2160 }),
  });

/**
 * Generate valid breakpoint names
 */
export const breakpointArbitrary = () =>
  fc.constantFrom('mobile', 'tablet', 'desktop', 'wide');

/**
 * Generate non-empty strings (useful for required fields)
 */
export const nonEmptyStringArbitrary = () =>
  fc.string({ minLength: 1, maxLength: 100 });

/**
 * Generate valid email addresses
 */
export const emailArbitrary = () =>
  fc
    .tuple(
      fc.stringMatching(/^[a-z0-9]+$/),
      fc.stringMatching(/^[a-z0-9]+$/),
      fc.constantFrom('com', 'org', 'net', 'io')
    )
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/**
 * Generate valid phone numbers (US format)
 */
export const phoneArbitrary = () =>
  fc
    .tuple(
      fc.integer({ min: 200, max: 999 }),
      fc.integer({ min: 200, max: 999 }),
      fc.integer({ min: 1000, max: 9999 })
    )
    .map(([area, prefix, line]) => `(${area}) ${prefix}-${line}`);

/**
 * Generate valid URLs
 */
export const urlArbitrary = () =>
  fc
    .tuple(
      fc.constantFrom('http', 'https'),
      fc.stringMatching(/^[a-z0-9-]+$/),
      fc.constantFrom('com', 'org', 'net', 'io'),
      fc.option(fc.stringMatching(/^[a-z0-9/-]+$/), { nil: undefined })
    )
    .map(([protocol, domain, tld, path]) =>
      path ? `${protocol}://${domain}.${tld}/${path}` : `${protocol}://${domain}.${tld}`
    );

/**
 * Generate valid CSS class names
 */
export const classNameArbitrary = () =>
  fc.stringMatching(/^[a-z][a-z0-9-]*$/);

/**
 * Generate arrays with a minimum length
 */
export const nonEmptyArrayArbitrary = <T>(itemArbitrary: fc.Arbitrary<T>) =>
  fc.array(itemArbitrary, { minLength: 1, maxLength: 20 });

/**
 * Generate valid animation durations (in milliseconds)
 */
export const animationDurationArbitrary = () =>
  fc.integer({ min: 100, max: 2000 });

/**
 * Generate valid opacity values (0-1)
 */
export const opacityArbitrary = () =>
  fc.double({ min: 0, max: 1, noNaN: true });

/**
 * Generate valid z-index values
 */
export const zIndexArbitrary = () =>
  fc.integer({ min: -1, max: 9999 });

/**
 * Generate valid percentage strings
 */
export const percentageArbitrary = () =>
  fc.integer({ min: 0, max: 100 }).map((n) => `${n}%`);

/**
 * Generate valid pixel values
 */
export const pixelArbitrary = () =>
  fc.integer({ min: 0, max: 1000 }).map((n) => `${n}px`);

/**
 * Generate valid touch target sizes (minimum 44x44px for accessibility)
 */
export const touchTargetArbitrary = () =>
  fc.record({
    width: fc.integer({ min: 44, max: 200 }),
    height: fc.integer({ min: 44, max: 200 }),
  });

/**
 * Generate valid contrast ratios
 */
export const contrastRatioArbitrary = () =>
  fc.double({ min: 1, max: 21, noNaN: true });

/**
 * Generate valid ARIA roles
 */
export const ariaRoleArbitrary = () =>
  fc.constantFrom(
    'button',
    'link',
    'navigation',
    'main',
    'complementary',
    'banner',
    'contentinfo',
    'form',
    'search',
    'region'
  );

/**
 * Generate valid theme names
 */
export const themeArbitrary = () =>
  fc.constantFrom('light', 'dark', 'system');

/**
 * Generate valid loading states
 */
export const loadingStateArbitrary = () =>
  fc.constantFrom('idle', 'loading', 'success', 'error');

/**
 * Generate valid toast notification types
 */
export const toastTypeArbitrary = () =>
  fc.constantFrom('default', 'success', 'error', 'warning', 'info');

/**
 * Generate valid button variants
 */
export const buttonVariantArbitrary = () =>
  fc.constantFrom(
    'default',
    'premium',
    'glass',
    'outline',
    'ghost',
    'magnetic',
    'shimmer',
    'success'
  );

/**
 * Generate valid card variants
 */
export const cardVariantArbitrary = () =>
  fc.constantFrom('default', 'elevated', 'bordered', 'glass', 'gradient');

/**
 * Generate whitespace-only strings (for testing validation)
 */
export const whitespaceStringArbitrary = () =>
  fc
    .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 10 })
    .map((chars) => chars.join(''));

/**
 * Generate valid user IDs
 */
export const userIdArbitrary = () =>
  fc.uuid();

/**
 * Generate valid timestamps
 */
export const timestampArbitrary = () =>
  fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') });

/**
 * Generate valid metric values
 */
export const metricArbitrary = () =>
  fc.record({
    value: fc.integer({ min: 0, max: 1000000 }),
    label: nonEmptyStringArbitrary(),
    change: fc.double({ min: -100, max: 100, noNaN: true }),
  });
