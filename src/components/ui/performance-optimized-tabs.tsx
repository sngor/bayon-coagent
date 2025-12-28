'use client';

import React, { memo, useMemo } from 'react';
import { HubTabsProps } from '@/components/hub/types';
import { useHubTabs } from '@/hooks/use-hub-tabs';
import { cn } from '@/lib/utils/common';
import { Badge } from '@/components/ui/badge';
import { ICON_SIZES } from '@/lib/constants/icon-sizes';

// Memoized tab button to prevent unnecessary re-renders
const TabButton = memo(function TabButton({
    tab,
    index,
    isActive,
    variant,
    styles,
    onTabClick,
    onKeyDown
}: {
    tab: any;
    index: number;
    isActive: boolean;
    variant: string;
    styles: any;
    onTabClick: (tab: any) => void;
    onKeyDown: (e: React.KeyboardEvent, index: number) => void;
}) {
    const Icon = tab.icon;

    return (
        <button
            type="button"
            role="tab"
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            data-active={isActive}
            onClick={() => onTabClick(tab)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
                styles.base,
                styles.tab,
                // Variant-specific active/inactive styling
                variant === 'underline' && isActive && 'border-blue-600 dark:border-blue-400',
                variant === 'underline' && !isActive && 'border-transparent hover:border-muted-foreground/50',
                variant !== 'underline' && !isActive && 'text-muted-foreground hover:text-foreground',
                variant !== 'underline' && isActive && 'bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100 shadow-sm font-extrabold',
                variant === 'underline' && isActive && 'text-blue-600 dark:text-blue-400 font-extrabold',
                variant === 'underline' && !isActive && 'text-muted-foreground hover:text-foreground'
            )}
        >
            {Icon && <Icon className={ICON_SIZES.sm} aria-hidden="true" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5" aria-label={`${tab.badge} items`}>
                    {tab.badge}
                </Badge>
            )}
        </button>
    );
});

// Performance optimized version of HubTabs
export const PerformanceOptimizedHubTabs = memo(function PerformanceOptimizedHubTabs({ 
    tabs, 
    activeTab, 
    onChange, 
    variant = 'default', 
    isSticky = false 
}: HubTabsProps) {
    const {
        currentTab,
        tabsRef,
        scrollContainerRef,
        showLeftIndicator,
        showRightIndicator,
        handleTabClick,
        handleKeyDown
    } = useHubTabs({ tabs, activeTab, onChange });

    // Memoize styles to prevent recalculation
    const styles = useMemo(() => {
        const baseStyles = 'inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
        
        const commonStyles = {
            tab: 'px-4 py-2 border-none bg-transparent whitespace-nowrap',
            container: 'overflow-x-auto scrollbar-hide transition-all duration-200',
            wrapper: 'mx-4 sm:mx-6'
        };

        const variantSpecificStyles = {
            default: {
                tab: 'rounded-full',
                container: 'rounded-full p-1.5'
            },
            pills: {
                tab: 'rounded-full',
                container: 'rounded-full p-1.5'
            },
            underline: {
                tab: 'rounded-none border-b-2 border-transparent',
                container: 'border-b border-border px-1.5'
            }
        };

        const currentVariant = variantSpecificStyles[variant];

        return {
            base: baseStyles,
            tab: cn(commonStyles.tab, currentVariant.tab),
            container: cn(commonStyles.container, currentVariant.container),
            wrapper: commonStyles.wrapper
        };
    }, [variant]);

    // Memoize tab buttons to prevent unnecessary re-renders
    const tabButtons = useMemo(() => 
        tabs.map((tab, index) => (
            <TabButton
                key={tab.id}
                tab={tab}
                index={index}
                isActive={tab.id === currentTab}
                variant={variant}
                styles={styles}
                onTabClick={handleTabClick}
                onKeyDown={handleKeyDown}
            />
        )), 
        [tabs, currentTab, variant, styles, handleTabClick, handleKeyDown]
    );

    return (
        <div className={cn("relative", styles.wrapper)}>
            {/* Left scroll indicator */}
            {showLeftIndicator && (
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 rounded-l-full" />
            )}

            {/* Scrollable tabs container */}
            <div
                ref={scrollContainerRef}
                className={cn(
                    styles.container,
                    'scroll-smooth touch-pan-x',
                    isSticky
                        ? 'bg-background/95 backdrop-blur-xl border border-border/20 shadow-sm'
                        : 'bg-transparent'
                )}
            >
                <div ref={tabsRef} className="inline-flex items-center gap-1 min-w-max" role="tablist">
                    {tabButtons}
                </div>
            </div>

            {/* Right scroll indicator */}
            {showRightIndicator && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 rounded-r-full" />
            )}
        </div>
    );
});

// Export with display name for debugging
PerformanceOptimizedHubTabs.displayName = 'PerformanceOptimizedHubTabs';