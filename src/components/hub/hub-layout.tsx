'use client';

import { HubLayoutProps } from './types';
import { PageHeader } from '@/components/ui/page-header';
import { HubTabs } from './hub-tabs';
import { usePathname } from 'next/navigation';
import { useMemo, memo, useRef, useEffect, useState } from 'react';
import { useStickyHeader } from '@/hooks/use-sticky-header';

// Static tabs that don't re-render
const StaticHubTabs = memo(HubTabs);

export function HubLayout({
    title,
    description,
    icon,
    tabs,
    children,
    actions,
    tabsVariant = 'default',
}: HubLayoutProps) {
    const pathname = usePathname();
    const layoutRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const [isHeaderCovered, setIsHeaderCovered] = useState(false);

    // Use sticky header hook to sync with topbar
    const { setHeaderInfo } = useStickyHeader();

    // Get the current hub path
    const hubPath = useMemo(() => {
        const segments = pathname.split('/').filter(Boolean);
        return segments.length > 0 ? segments[0] : '';
    }, [pathname]);

    // Get the current tab path
    const tabPath = useMemo(() => {
        const segments = pathname.split('/').filter(Boolean);
        return segments.length > 1 ? segments[1] : '';
    }, [pathname]);

    // Prevent layout shift by maintaining consistent structure
    useEffect(() => {
        if (layoutRef.current) {
            layoutRef.current.style.minHeight = 'calc(100vh - 200px)';
        }
    }, []);

    // Use IntersectionObserver to detect when header is covered
    useEffect(() => {
        if (!headerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                // Header is covered when it's not intersecting with the viewport
                // We use a small threshold to trigger slightly before it's completely hidden
                const isCovered = !entry.isIntersecting;
                setIsHeaderCovered(isCovered);

                // Update sticky header state
                setHeaderInfo({
                    title,
                    icon,
                    isVisible: isCovered
                });
            },
            {
                // Trigger when header is 20px from being completely hidden
                rootMargin: '-20px 0px 0px 0px',
                threshold: 0
            }
        );

        observer.observe(headerRef.current);

        return () => observer.disconnect();
    }, [title, icon, setHeaderInfo]);

    // Clear sticky header when component unmounts
    useEffect(() => {
        return () => {
            setHeaderInfo({ title: '', icon: undefined, isVisible: false });
        };
    }, [setHeaderInfo]);

    return (
        <div ref={layoutRef} className="space-y-6">
            {/* Hub Header using consistent PageHeader component */}
            <div ref={headerRef}>
                <PageHeader
                    title={title}
                    description={description}
                    icon={icon}
                    actions={actions}
                    variant="hub"
                />
            </div>

            {/* Static Hub Tabs - Wrapped around content */}
            {tabs && tabs.length > 0 && (
                <div className="sticky top-20 z-50 pt-0 pb-3 bg-transparent -mt-6 flex pointer-events-none">
                    <div className="border-t border-border/20 pt-3 inline-flex pointer-events-auto">
                        <StaticHubTabs tabs={tabs} activeTab="" variant={tabsVariant} isSticky={isHeaderCovered} />
                    </div>
                </div>
            )}

            {/* Content area with minimal transitions */}
            <div className="min-h-0 animate-in fade-in duration-200">
                {children}
            </div>
        </div>
    );
}
