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

const BASE_STYLES = 'inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50' as const;

const VARIANT_STYLES: Record<TabVariant, VariantConfig> = {
    default: {
        tab: 'px-4 py-2 rounded-md bg-transparent whitespace-nowrap',
        container: 'overflow-x-auto scrollbar-hide rounded-md p-1.5 transition-all duration-200',
        wrapper: 'mx-0 sm:mx-4 md:mx-6'
    },
    pills: {
        tab: 'px-4 py-2 rounded-md bg-transparent whitespace-nowrap',
        container: 'overflow-x-auto scrollbar-hide rounded-md p-1.5 transition-all duration-200',
        wrapper: 'mx-0 sm:mx-4 md:mx-6'
    },
    underline: {
        tab: 'px-4 py-2 rounded-none border-b-2 border-transparent bg-transparent whitespace-nowrap',
        container: 'overflow-x-auto scrollbar-hide border-b border-border px-1.5',
        wrapper: 'mx-0 sm:mx-4 md:mx-6'
    }
} as const;

const ACTIVE_STYLES = {
    underline: 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-extrabold',
    default: 'bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100 shadow-sm font-extrabold border border-blue-900 dark:border-blue-100'
} as const;

const INACTIVE_STYLES = {
    underline: 'border-transparent hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground',
    default: 'text-muted-foreground hover:text-foreground'
} as const;

export function getTabStyles(variant: TabVariant): TabStyles {
    const config = VARIANT_STYLES[variant];
    return {
        base: BASE_STYLES,
        tab: config.tab,
        container: config.container,
        wrapper: config.wrapper
    };
}

export function getTabClasses(variant: TabVariant, isActive: boolean): string {
    const styles = getTabStyles(variant);
    const baseClasses = [styles.base, styles.tab];
    
    const stateStyle = isActive 
        ? ACTIVE_STYLES[variant === 'underline' ? 'underline' : 'default']
        : INACTIVE_STYLES[variant === 'underline' ? 'underline' : 'default'];
    
    baseClasses.push(stateStyle);
    
    return cn(...baseClasses);
}