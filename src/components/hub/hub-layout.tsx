'use client';

import { HubLayoutProps } from './types';
import { HubHeader } from './hub-header';
import { HubTabs } from './hub-tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useMemo, memo, useRef, useEffect } from 'react';

// Static header and tabs that don't re-render
const StaticHubHeader = memo(HubHeader);
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

    return (
        <div ref={layoutRef} className="space-y-6">
            {/* Static Hub Header - Never re-renders within the same hub */}
            <StaticHubHeader
                title={title}
                description={description}
                icon={icon}
                actions={actions}
            />

            {/* Static Hub Tabs - Never re-renders within the same hub */}
            {tabs.length > 0 && (
                <div className="sticky top-20 z-10 -mx-4 md:-mx-8 lg:-mx-10 px-4 md:px-8 lg:px-10 py-3 bg-background/80 dark:bg-background/40 backdrop-blur-xl border-b border-border/40 -mt-6">
                    <StaticHubTabs tabs={tabs} activeTab="" variant={tabsVariant} />
                </div>
            )}

            {/* Content area with smooth transitions only for content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${hubPath}-${tabPath}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{
                        duration: 0.2,
                        ease: 'easeInOut',
                        opacity: { duration: 0.15 }
                    }}
                    className="min-h-0"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
