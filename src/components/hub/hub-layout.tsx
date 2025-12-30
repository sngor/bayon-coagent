'use client';

import { HubLayoutProps } from './types';
import { PageHeader } from '@/components/ui/page-header';
import { HubTabs } from './hub-tabs';
import { memo, useRef, useEffect, useState } from 'react';
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
    const layoutRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const [isHeaderCovered, setIsHeaderCovered] = useState(false);

    // Use sticky header hook to sync with topbar
    const { setHeaderInfo } = useStickyHeader();



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
    }, [title, setHeaderInfo]);

    // Clear sticky header when component unmounts
    useEffect(() => {
        return () => {
            setHeaderInfo({ title: '', isVisible: false });
        };
    }, [setHeaderInfo]);

    return (
        <div ref={layoutRef} className="space-y-4">
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

            {/* Hub Tabs */}
            {tabs && tabs.length > 0 && (
                <div className="sticky top-24 z-50 -mt-2">
                    <div className={isHeaderCovered ? 'animate-in fade-in slide-in-from-top-2 duration-200' : ''}>
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
