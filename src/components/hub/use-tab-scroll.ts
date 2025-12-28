import { useRef, useState, useCallback, useEffect, useMemo } from 'react';

const SCROLL_THRESHOLD = 10;
const SCROLL_BEHAVIOR = 'smooth' as const;
const RAF_THROTTLE_MS = 16; // ~60fps

interface UseTabScrollProps {
    tabs: Array<{ id: string }>;
    currentTab: string;
}

interface ScrollIndicators {
    showLeft: boolean;
    showRight: boolean;
}

export function useTabScroll({ tabs, currentTab }: UseTabScrollProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [indicators, setIndicators] = useState<ScrollIndicators>({ showLeft: false, showRight: false });
    const rafRef = useRef<number>();
    const lastCheckTime = useRef<number>(0);

    // Memoize current tab index for performance
    const currentTabIndex = useMemo(() => 
        tabs.findIndex(tab => tab.id === currentTab), 
        [tabs, currentTab]
    );

    // Check scroll position to show/hide indicators
    const checkScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        
        const newIndicators: ScrollIndicators = {
            showLeft: scrollLeft > SCROLL_THRESHOLD,
            showRight: scrollLeft < scrollWidth - clientWidth - SCROLL_THRESHOLD
        };

        // Only update if indicators actually changed
        setIndicators(prev => 
            prev.showLeft !== newIndicators.showLeft || prev.showRight !== newIndicators.showRight
                ? newIndicators 
                : prev
        );
    }, []);

    // Throttled scroll check with RAF and time-based throttling
    const throttledCheckScroll = useCallback(() => {
        const now = performance.now();
        if (now - lastCheckTime.current < RAF_THROTTLE_MS) {
            return;
        }
        
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }
        
        rafRef.current = requestAnimationFrame(() => {
            checkScroll();
            lastCheckTime.current = now;
        });
    }, [checkScroll]);

    // Scroll to active tab when it changes
    const scrollToActiveTab = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container || currentTabIndex === -1) return;

        const activeTabElement = container.children[currentTabIndex] as HTMLElement;
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
                behavior: SCROLL_BEHAVIOR
            });
        }
    }, [currentTabIndex]);

    // Setup scroll listeners
    useEffect(() => {
        checkScroll();
        scrollToActiveTab();
        const container = scrollContainerRef.current;
        if (!container) return;

        container.addEventListener('scroll', throttledCheckScroll, { passive: true });
        window.addEventListener('resize', checkScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', throttledCheckScroll);
            window.removeEventListener('resize', checkScroll);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [checkScroll, scrollToActiveTab, throttledCheckScroll]);

    return {
        scrollContainerRef,
        showLeftIndicator: indicators.showLeft,
        showRightIndicator: indicators.showRight
    };
}