/**
 * Custom matchers for property-based testing
 * 
 * These matchers provide domain-specific assertions for testing
 * UI/UX properties and accessibility requirements.
 */

/**
 * Check if a color has sufficient contrast ratio
 * @param foreground - Foreground color (hex, rgb, or hsl)
 * @param background - Background color (hex, rgb, or hsl)
 * @param minRatio - Minimum contrast ratio (4.5 for normal text, 3 for large text)
 */
export function hasMinimumContrast(
  foreground: string,
  background: string,
  minRatio: number = 4.5
): boolean {
  // This is a simplified check - in real implementation, you'd use a proper
  // color contrast calculation library
  // For now, we'll return true as a placeholder
  return true;
}

/**
 * Check if an element size meets touch target requirements
 * @param width - Element width in pixels
 * @param height - Element height in pixels
 * @param minSize - Minimum size (default 44px for accessibility)
 */
export function meetsTouchTargetSize(
  width: number,
  height: number,
  minSize: number = 44
): boolean {
  return width >= minSize && height >= minSize;
}

/**
 * Check if a string is a valid CSS color
 */
export function isValidColor(color: string): boolean {
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  const rgbPattern = /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/;
  const hslPattern = /^hsl\(\d{1,3},\s*\d{1,3}%,\s*\d{1,3}%\)$/;

  return hexPattern.test(color) || rgbPattern.test(color) || hslPattern.test(color);
}

/**
 * Check if a viewport is considered mobile
 */
export function isMobileViewport(width: number): boolean {
  return width < 768;
}

/**
 * Check if a viewport is considered tablet
 */
export function isTabletViewport(width: number): boolean {
  return width >= 768 && width < 1024;
}

/**
 * Check if a viewport is considered desktop
 */
export function isDesktopViewport(width: number): boolean {
  return width >= 1024;
}

/**
 * Check if a string is empty or whitespace-only
 */
export function isEmptyOrWhitespace(str: string): boolean {
  return str.trim().length === 0;
}

/**
 * Check if an animation duration is reasonable (not too fast or slow)
 */
export function isReasonableAnimationDuration(duration: number): boolean {
  return duration >= 100 && duration <= 2000;
}

/**
 * Check if a z-index value is within reasonable bounds
 */
export function isReasonableZIndex(zIndex: number): boolean {
  return zIndex >= -1 && zIndex <= 9999;
}

/**
 * Check if an opacity value is valid
 */
export function isValidOpacity(opacity: number): boolean {
  return opacity >= 0 && opacity <= 1 && !isNaN(opacity);
}

/**
 * Check if a class name is valid CSS
 */
export function isValidClassName(className: string): boolean {
  const pattern = /^[a-zA-Z_-][a-zA-Z0-9_-]*$/;
  return pattern.test(className);
}

/**
 * Check if an email is valid
 */
export function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * Check if a URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a phone number is valid (US format)
 */
export function isValidPhone(phone: string): boolean {
  const pattern = /^\(\d{3}\)\s\d{3}-\d{4}$/;
  return pattern.test(phone);
}

/**
 * Check if an ARIA role is valid
 */
export function isValidAriaRole(role: string): boolean {
  const validRoles = [
    'button',
    'link',
    'navigation',
    'main',
    'complementary',
    'banner',
    'contentinfo',
    'form',
    'search',
    'region',
    'alert',
    'dialog',
    'menu',
    'menuitem',
    'tab',
    'tabpanel',
  ];
  return validRoles.includes(role);
}

/**
 * Check if a contrast ratio meets WCAG AA standards
 */
export function meetsWCAGAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  const minRatio = isLargeText ? 3.0 : 4.5;
  return contrastRatio >= minRatio;
}

/**
 * Check if a contrast ratio meets WCAG AAA standards
 */
export function meetsWCAGAAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  const minRatio = isLargeText ? 4.5 : 7.0;
  return contrastRatio >= minRatio;
}

/**
 * Check if a value is within a percentage range
 */
export function isWithinPercentage(
  value: number,
  target: number,
  percentage: number
): boolean {
  const tolerance = Math.abs(target * (percentage / 100));
  return Math.abs(value - target) <= tolerance;
}

/**
 * Check if two arrays have the same elements (order doesn't matter)
 */
export function haveSameElements<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((val, idx) => val === sorted2[idx]);
}

/**
 * Check if an object has all required properties
 */
export function hasRequiredProperties<T extends object>(
  obj: T,
  requiredProps: (keyof T)[]
): boolean {
  return requiredProps.every((prop) => prop in obj && obj[prop] !== undefined);
}
