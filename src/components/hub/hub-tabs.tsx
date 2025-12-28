'use client';

import { usePathname, useRouter } from 'next/navigation';
import { HubTabsProps } from './types';
import { cn } from '@/lib/utils/common';
import { Badge } from '@/components/ui/badge';
import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { ICON_SIZES } from '@/lib/constants/icon-sizes';

export function HubTabs({ tabs, activeTab, onChange, variant = 'default', isSticky = false }: HubTabsProps) {
    const pathname = usePathname();
    const router = useRouter();
    const tabsRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftIndicator, setShowLeftIndicator] = useState(false);
    const [showRightIndicator, setShowRightIndicator] = useState(false);

    // Memoize the current tab calculation to prevent unnecessary re-renders
    const currentTab = useMemo(() => {
        return activeTab || tabs.find(tab => pathname.startsWith(tab.href))?.id || tabs[0]?.id;
    }, [activeTab, tabs, pathname]);

    // Check scroll position to show/hide indicators
    const checkScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setShowLeftIndicator(scrollLeft > 10);
        setShowRightIndicator(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    // Scroll to active tab when it changes
    const scrollToActiveTab = useCallback(() => {
        const container = scrollContainerRef.current;
        const tabsContainer = tabsRef.current;
        if (!container || !tabsContainer) return;

        const activeTabIndex = tabs.findIndex(tab => tab.id === currentTab);
        if (activeTabIndex === -1) return;

        const activeTabElement = tabsContainer.children[activeTabIndex] as HTMLElement;
        if (!activeTabElement) return;

        const containerRect = container.getBoundingClientRect();
        const tabRect = activeTabElement.getBoundingClientRect();
        
        // Check if tab is fully visible
        const isTabVisible = 
            tabRect.left >= containerRect.left && 
            tabRect.right <= containerRect.right;

        if (!isTabVisible) {
            // Scroll to center the active tab
            const scrollLeft = activeTabElement.offsetLeft - (container.clientWidth / 2) + (activeTabElement.clientWidth / 2);
            container.scrollTo({
                left: Math.max(0, scrollLeft),
                behavior: 'smooth'
            });
        }
    }, [tabs, currentTab]);

    // Check scroll on mount and when tabs change
    useEffect(() => {
        checkScroll();
        scrollToActiveTab();
        const container = scrollContainerRef.current;
        if (!container) return;

        container.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);

        return () => {
            container.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [checkScroll, scrollToActiveTab, tabs, currentTab]);

    // Memoize the tab click handler
    const handleTabClick = useCallback((tab: typeof tabs[0]) => {
        if (onChange) {
            onChange(tab.id);
        } else {
            router.push(tab.href);
        }
    }, [onChange, router]);

    // Memoize the keyboard handler
    const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            const prevTab = tabs[index - 1];
            handleTabClick(prevTab);
            // Focus previous tab
            const prevButton = tabsRef.current?.children[index - 1] as HTMLButtonElement;
            prevButton?.focus();
        } else if (e.key === 'ArrowRight' && index < tabs.length - 1) {
            e.preventDefault();
            const nextTab = tabs[index + 1];
            handleTabClick(nextTab);
            // Focus next tab
            const nextButton = tabsRef.current?.children[index + 1] as HTMLButtonElement;
            nextButton?.focus();
        }
    }, [tabs, handleTabClick]);

    // Memoize styles to prevent recalculation
    const styles = useMemo(() => {
        const baseStyles = 'inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

        const variantStyles = {
            default: {
                tab: 'px-4 py-2 rounded-full border-none bg-transparent whitespace-nowrap',
                container: 'overflow-x-auto scrollbar-hide rounded-full p-1.5 transition-all duration-200',
                wrapper: 'mx-4 sm:mx-6'
            },
            pills: {
                tab: 'px-4 py-2 rounded-full border-none bg-transparent whitespace-nowrap',
                container: 'overflow-x-auto scrollbar-hide rounded-full p-1.5 transition-all duration-200',
                wrapper: 'mx-4 sm:mx-6'
            },
            underline: {
                tab: 'px-4 py-2 rounded-none border-b-2 border-transparent bg-transparent whitespace-nowrap',
                container: 'overflow-x-auto scrollbar-hide border-b border-border px-1.5',
                wrapper: 'mx-4 sm:mx-6'
            }
        };

        return {
            base: baseStyles,
            tab: variantStyles[variant].tab,
            container: variantStyles[variant].container,
            wrapper: variantStyles[variant].wrapper
        };
    }, [variant]);

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
                    'scroll-smooth touch-pan-x', // Add smooth scrolling via CSS
                    isSticky
                        ? 'bg-background/95 backdrop-blur-xl border border-border/20 shadow-sm'
                        : 'bg-transparent'
                )}
            >
                <div ref={tabsRef} className="inline-flex items-center gap-1 min-w-max" role="tablist">
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
                                onClick={() => handleTabClick(tab)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
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
                    })}
                </div>
            </div>

            {/* Right scroll indicator */}
            {showRightIndicator && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 rounded-r-full" />
            )}
        </div>
    );
}