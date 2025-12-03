/**
 * Standardized Icon Size System
 * 
 * Use these constants throughout the application for consistent icon sizing.
 * Each size is 4px (1 Tailwind unit) larger than the previous for clear visual hierarchy.
 */

export const ICON_SIZES = {
    // Inline icons in badges, chips, or small text
    xs: 'w-3 h-3', // 12px

    // Button icons, form inputs, small UI elements
    sm: 'w-4 h-4', // 16px

    // Navigation items, cards, list items
    md: 'w-5 h-5', // 20px

    // Section headers, tabs, medium emphasis
    lg: 'w-6 h-6', // 24px

    // Page headers, feature cards, high emphasis
    xl: 'w-8 h-8', // 32px

    // Hero sections, empty states, maximum emphasis
    '2xl': 'w-12 h-12', // 48px
} as const;

/**
 * Usage Guidelines:
 * 
 * - xs (12px): Badges, inline text icons, status indicators
 * - sm (16px): Buttons, form fields, dropdowns, tooltips
 * - md (20px): Navigation sidebar, card icons, list items
 * - lg (24px): Section headers, tab icons, stat cards
 * - xl (32px): Page headers, hub headers, feature highlights
 * - 2xl (48px): Hero sections, empty states, onboarding
 * 
 * Examples:
 * ```tsx
 * import { ICON_SIZES } from '@/lib/constants/icon-sizes';
 * 
 * // Button icon
 * <Button><Icon className={ICON_SIZES.sm} />Click me</Button>
 * 
 * // Navigation item
 * <NavItem><Icon className={ICON_SIZES.md} />Dashboard</NavItem>
 * 
 * // Page header
 * <PageHeader icon={Icon} /> // Uses xl (32px) internally
 * ```
 */

export type IconSize = keyof typeof ICON_SIZES;

/**
 * Helper function to get icon size class
 */
export function getIconSize(size: IconSize): string {
    return ICON_SIZES[size];
}
