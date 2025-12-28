import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useCallback, useRef, useState, useEffect } from 'react';

interface UseHubTabsProps {
    tabs: Array<{ id: string; href: string; label: string; icon?: any; badge?: number }>;
    activeTab?: string;
    onChange?: (tabId: string) => void;
}

export function useHubTabs({ tabs, activeTab, onChange }: UseHubTabsProps) {
    const pathname = usePathname();
    const router = useRouter();
    const tabsRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftIndicator, setShowLeftIndicator] = useState(false);
    const [showRightIndicator, setShowRightIndicator] = useState(false);

    // Memoize current tab calculation
    const currentTab = useMemo(() => {
        return activeTab || tabs.find(tab => pathname.startsWith(tab.href))?.id || tabs[0]?.id;
    }, [activeTab, tabs, pathname]);

    // Optimized scroll detection
    const checkScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        const threshold = 10;
        
        setShowLeftIndicator(scrollLeft > threshold);
        setShowRightIndicator(scrollLeft < scrollWidth - clientWidth - threshold);
    }, []);

    // Throttled scroll handler
    const throttledCheckScroll = useMemo(() => {
        let timeoutId: NodeJS.Timeout;
        return () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(checkScroll, 16);
        };
    }, [checkScroll]);

    // Auto-scroll to active tab
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
        
        const isTabVisible = 
            tabRect.left >= containerRect.left && 
            tabRect.right <= containerRect.right;

        if (!isTabVisible) {
            const scrollLeft = activeTabElement.offsetLeft - (container.clientWidth / 2) + (activeTabElement.clientWidth / 2);
            container.scrollTo({
                left: Math.max(0, scrollLeft),
                behavior: 'smooth'
            });
        }
    }, [tabs, currentTab]);

    // Tab click handler
    const handleTabClick = useCallback((tab: typeof tabs[0]) => {
        if (onChange) {
            onChange(tab.id);
        } else {
            router.push(tab.href);
        }
    }, [onChange, router]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            const prevTab = tabs[index - 1];
            handleTabClick(prevTab);
            const prevButton = tabsRef.current?.children[index - 1] as HTMLButtonElement;
            prevButton?.focus();
        } else if (e.key === 'ArrowRight' && index < tabs.length - 1) {
            e.preventDefault();
            const nextTab = tabs[index + 1];
            handleTabClick(nextTab);
            const nextButton = tabsRef.current?.children[index + 1] as HTMLButtonElement;
            nextButton?.focus();
        }
    }, [tabs, handleTabClick]);

    // Setup scroll listeners
    useEffect(() => {
        checkScroll();
        scrollToActiveTab();
        const container = scrollContainerRef.current;
        if (!container) return;

        container.addEventListener('scroll', throttledCheckScroll, { passive: true });
        window.addEventListener('resize', throttledCheckScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', throttledCheckScroll);
            window.removeEventListener('resize', throttledCheckScroll);
        };
    }, [checkScroll, scrollToActiveTab, throttledCheckScroll, tabs, currentTab]);

    return {
        currentTab,
        tabsRef,
        scrollContainerRef,
        showLeftIndicator,
        showRightIndicator,
        handleTabClick,
        handleKeyDown
    };
}