'use client';

import { HubLayoutProps } from './types';
import { HubHeader } from './hub-header';
import { HubTabs } from './hub-tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function HubLayout({
    title,
    description,
    icon,
    tabs,
    children,
    actions,
}: HubLayoutProps) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            {/* Hub Header */}
            <HubHeader
                title={title}
                description={description}
                icon={icon}
                actions={actions}
            />

            {/* Hub Tabs */}
            {tabs.length > 0 && (
                <div className="sticky top-20 z-10 -mx-4 md:-mx-8 lg:-mx-10 px-4 md:px-8 lg:px-10 py-3 bg-background/95 backdrop-blur-sm">
                    <HubTabs tabs={tabs} activeTab="" />
                </div>
            )}

            {/* Hub Content with Animation */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.08 }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
