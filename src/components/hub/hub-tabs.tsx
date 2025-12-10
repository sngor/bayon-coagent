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

    // Check scroll position to show/hide indicators
    const checkScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setShowLeftIndicator(scrollLeft > 10);
        setShowRightIndicator(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    // Check scroll on mount and when tabs change
    useEffect(() => {
        checkScroll();
        const container = scrollContainerRef.current;
        if (!container) return;

        container.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);

        return () => {
            container.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [checkScroll, tabs]);

    // Memoize the current tab calculation to prevent unnecessary re-renders
    const currentTab = useMemo(() => {
        return activeTab || tabs.find(tab => pathname.startsWith(tab.href))?.id || tabs[0]?.id;
    }, [activeTab, tabs, pathname]);

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
        const baseStyles = 'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

        const variantStyles = {
            default: {
                tab: 'border-b-2 border-transparent hover:border-muted-foreground/50 data-[active=true]:border-[#535353] data-[active=true]:text-[#535353] dark:data-[active=true]:border-white dark:data-[active=true]:text-white',
                container: ''
            },
            pills: {
                tab: 'rounded-full hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-[#535353] data-[active=true]:text-white dark:data-[active=true]:bg-white dark:data-[active=true]:text-[#535353]',
                container: ''
            },
            underline: {
                tab: 'border-b-2 border-transparent hover:text-foreground data-[active=true]:border-[#535353] data-[active=true]:text-foreground dark:data-[active=true]:border-white',
                container: ''
            }
        };

        return {
            base: baseStyles,
            variant: variantStyles[variant]
        };
    }, [variant]);

    return (
        <div className="relative">
            {/* Left scroll indicator */}
            {showLeftIndicator && (
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 rounded-l-full" />
            )}

            {/* Scrollable tabs container */}
            <div
                ref={scrollContainerRef}
                className={cn(
                    'inline-flex items-center gap-2 overflow-x-auto scrollbar-hide rounded-full p-2 transition-all duration-300 ease-in-out',
                    isSticky ? 'bg-background/30 backdrop-blur-xl border border-border/50 shadow-sm shadow-primary/10 ring-1 ring-white/10' : 'bg-transparent',
                    styles.variant.container
                )}
            >
                <div ref={tabsRef} className="flex items-center gap-2" role="tablist">
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
                                    styles.variant.tab,
                                    !isActive && 'text-muted-foreground',
                                    isSticky && 'backdrop-blur-sm bg-background/20',
                                    isSticky && isActive && 'border border-border/30'
                                )}
                            >
                                {Icon && <Icon className={ICON_SIZES.sm} aria-hidden="true" />}
                                <span className="whitespace-nowrap">{tab.label}</span>
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