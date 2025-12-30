import { cn } from '@/lib/utils/common';

export type TabVariant = 'default' | 'pills' | 'underline';

interface TabStyles {
    readonly base: string;
    readonly tab: string;
    readonly container: string;
    readonly wrapper: string;
}

interface VariantConfig {
    readonly tab: string;
    readonly container: string;
    readonly wrapper: string;
}

// Color constants for consistency and maintainability
const COLORS = {
    blue: {
        50: 'blue-50',
        100: 'blue-100', 
        900: 'blue-900',
        950: 'blue-950'
    }
} as const;

// Semantic color tokens for better maintainability
const ACTIVE_COLORS = {
    light: {
        background: `bg-${COLORS.blue[50]}`,
        text: `text-${COLORS.blue[900]}`,
        border: `hub-tab-active`
    },
    dark: {
        background: `dark:bg-${COLORS.blue[950]}/50`,
        text: `dark:text-${COLORS.blue[100]}`,
        border: ``
    }
} as const;

const BASE_STYLES = 'inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50' as const;

const VARIANT_STYLES: Record<TabVariant, VariantConfig> = {
    default: {
        tab: 'px-4 py-2 rounded-md bg-transparent whitespace-nowrap',
        container: 'overflow-x-auto scrollbar-thin rounded-md p-1.5 transition-all duration-200',
        wrapper: 'mx-0 sm:mx-4 md:mx-6'
    },
    pills: {
        tab: 'px-4 py-2 rounded-md bg-transparent whitespace-nowrap',
        container: 'overflow-x-auto scrollbar-thin rounded-md p-1.5 transition-all duration-200',
        wrapper: 'mx-0 sm:mx-4 md:mx-6'
    },
    underline: {
        tab: 'px-4 py-2 rounded-none border-b-2 border-transparent bg-transparent whitespace-nowrap',
        container: 'overflow-x-auto scrollbar-thin border-b border-border px-1.5',
        wrapper: 'mx-0 sm:mx-4 md:mx-6'
    }
} as const;

// Style factory functions for better maintainability
function createActiveStyles(variant: TabVariant): string[] {
    const baseStyles = [
        ACTIVE_COLORS.light.text,
        ACTIVE_COLORS.dark.text,
        'font-extrabold'
    ];

    switch (variant) {
        case 'underline':
            return [
                ...baseStyles,
                'border-b-2',
                ACTIVE_COLORS.light.border,
                ACTIVE_COLORS.dark.border
            ];
        case 'default':
        case 'pills':
            return [
                ...baseStyles,
                ACTIVE_COLORS.light.background,
                ACTIVE_COLORS.dark.background,
                ACTIVE_COLORS.light.border,
                ACTIVE_COLORS.dark.border
            ];
        default:
            return baseStyles;
    }
}

const ACTIVE_STYLES = {
    underline: createActiveStyles('underline').join(' '),
    default: createActiveStyles('default').join(' '),
    pills: createActiveStyles('pills').join(' ')
} as const;

const INACTIVE_STYLES = {
    underline: 'border-transparent hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground',
    default: 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
    pills: 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
} as const;

export function getTabStyles(variant: TabVariant): TabStyles {
    const config = VARIANT_STYLES[variant];
    
    if (!config) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`Invalid tab variant: ${variant}. Falling back to 'default'.`);
        }
        return {
            base: BASE_STYLES,
            ...VARIANT_STYLES.default
        };
    }
    
    return {
        base: BASE_STYLES,
        tab: config.tab,
        container: config.container,
        wrapper: config.wrapper
    };
}

// Memoized style cache for performance
const styleCache = new Map<string, string>();

export function getTabClasses(variant: TabVariant, isActive: boolean): string {
    // Create cache key
    const cacheKey = `${variant}-${isActive}`;
    
    // Return cached result if available
    if (styleCache.has(cacheKey)) {
        return styleCache.get(cacheKey)!;
    }
    
    // Validate variant
    if (!VARIANT_STYLES[variant]) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`Invalid tab variant: ${variant}. Using 'default'.`);
        }
        variant = 'default';
    }
    
    const styles = getTabStyles(variant);
    const baseClasses = [styles.base, styles.tab];
    
    const stateStyle = isActive 
        ? ACTIVE_STYLES[variant]
        : INACTIVE_STYLES[variant];
    
    baseClasses.push(stateStyle);
    
    const result = cn(...baseClasses);
    
    // Cache the result
    styleCache.set(cacheKey, result);
    
    return result;
}