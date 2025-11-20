'use client';

import { HubLayoutProps } from './types';
import { HubHeader } from './hub-header';
import { HubTabs } from './hub-tabs';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

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

    // Extract the base hub path (e.g., /studio, /intelligence)
    // Only re-render when switching between hubs, not between tabs
    const hubPath = useMemo(() => {
        const segments = pathname.split('/').filter(Boolean);
        return segments.length > 0 ? `/${segments[0]}` : pathname;
    }, [pathname]);

    return (
        <div className="space-y-6">
            {/* Hub Header - Static, doesn't re-render on tab changes */}
            <HubHeader
                title={title}
                description={description}
                icon={icon}
                actions={actions}
            />

            {/* Hub Tabs - Static, doesn't re-render on tab changes */}
            {tabs.length > 0 && (
                <div className="sticky top-20 z-10 -mx-4 md:-mx-8 lg:-mx-10 px-4 md:px-8 lg:px-10 py-3 bg-background/95 backdrop-blur-sm">
                    <HubTabs tabs={tabs} activeTab="" variant={tabsVariant} />
                </div>
            )}

            {/* Hub Content with Animation - Only animates on hub change, not tab change */}
            <motion.div
                key={hubPath}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
            >
                {children}
            </motion.div>
        </div>
    );
}
