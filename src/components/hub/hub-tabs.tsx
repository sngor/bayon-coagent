'use client';

import { usePathname, useRouter } from 'next/navigation';
import { HubTabsProps } from './types';
import { cn } from '@/lib/utils/common';
import { Badge } from '@/components/ui/badge';
import { useMemo, useCallback } from 'react';
import { ICON_SIZES } from '@/lib/constants/icon-sizes';
import { useTabScroll } from './use-tab-scroll';
import { getTabStyles, getTabClasses } from './tab-styles';

export function HubTabs({ tabs, activeTab, onChange, variant = 'default', isSticky = false }: HubTabsProps) {
    const pathname = usePathname();
    const router = useRouter();

    // Early return for empty tabs with better error handling
    if (!tabs || tabs.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('HubTabs: No tabs provided');
        }
        return null;
    }

    // Validate tabs structure with better type checking
    const isValidTabs = useMemo(() => {
        return tabs.every(tab => 
            tab && 
            typeof tab.id === 'string' && 
            tab.id.length > 0 &&
            typeof tab.label === 'string' && 
            tab.label.length > 0 &&
            typeof tab.href === 'string' && 
            tab.href.length > 0 &&
            (!tab.badge || typeof tab.badge === 'number' || typeof tab.badge === 'string')
        );
    }, [tabs]);
    
    if (!isValidTabs) {
        if (process.env.NODE_ENV === 'development') {
            console.error('HubTabs: Invalid tab structure. Each tab must have id, label, and href properties.');
        }
        return null;
    }

    // Memoize the current tab calculation to prevent unnecessary re-renders
    const currentTab = useMemo(() => {
        return activeTab || tabs.find(tab => pathname.startsWith(tab.href))?.id || tabs[0]?.id;
    }, [activeTab, tabs, pathname]);

    // Use custom hook for scroll logic
    const { scrollContainerRef, showLeftIndicator, showRightIndicator } = useTabScroll({
        tabs,
        currentTab
    });



    // Memoize the tab click handler with stable reference
    const handleTabClick = useCallback((tabId: string, tabHref: string) => {
        if (onChange) {
            onChange(tabId);
        } else {
            router.push(tabHref);
        }
    }, [onChange, router]);

    // Memoize the keyboard handler with better navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
        const { key } = e;
        let targetIndex = -1;
        
        switch (key) {
            case 'ArrowLeft':
                targetIndex = index > 0 ? index - 1 : tabs.length - 1; // Wrap to end
                break;
            case 'ArrowRight':
                targetIndex = index < tabs.length - 1 ? index + 1 : 0; // Wrap to start
                break;
            case 'Home':
                targetIndex = 0;
                break;
            case 'End':
                targetIndex = tabs.length - 1;
                break;
            default:
                return; // Don't prevent default for other keys
        }
        
        e.preventDefault();
        const targetTab = tabs[targetIndex];
        if (targetTab) {
            handleTabClick(targetTab.id, targetTab.href);
            // Focus the target tab
            const targetButton = scrollContainerRef.current?.children[targetIndex] as HTMLButtonElement;
            targetButton?.focus();
        }
    }, [tabs, handleTabClick, scrollContainerRef]);

    // Memoize styles to prevent recalculation
    const styles = useMemo(() => getTabStyles(variant), [variant]);

    return (
        <div className={cn("relative flex", styles.wrapper)}>
            {/* Left scroll indicator */}
            {showLeftIndicator && (
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 rounded-l-md" />
            )}

            {/* Scrollable tabs container with proper ARIA structure */}
            <div
                ref={scrollContainerRef}
                className={cn(
                    styles.container,
                    'scroll-smooth touch-pan-x min-w-0 flex-1 max-w-fit inline-flex items-center gap-1 min-w-max', // Responsive: fit content but allow overflow scrolling
                    isSticky
                        ? 'bg-background/95 backdrop-blur-xl border border-border/20 shadow-sm'
                        : 'bg-transparent'
                )}
                role="tablist" 
                aria-label="Hub navigation tabs"
            >
                {tabs.map((tab, index) => {
                    const isActive = tab.id === currentTab;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-controls={`tabpanel-${tab.id}`}
                            id={`tab-${tab.id}`}
                            tabIndex={isActive ? 0 : -1}
                            data-active={isActive}
                            {...(isActive ? { 'aria-selected': 'true' } : { 'aria-selected': 'false' })}
                            aria-label={`${tab.label}${tab.badge ? ` (${tab.badge} items)` : ''}`}
                            onClick={() => handleTabClick(tab.id, tab.href)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={getTabClasses(variant, isActive)}
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
                })}
            </div>

            {/* Right scroll indicator */}
            {showRightIndicator && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 rounded-r-md" />
            )}
        </div>
    );
}