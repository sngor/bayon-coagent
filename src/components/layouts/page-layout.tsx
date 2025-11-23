'use client';

import { cn } from '@/lib/utils';
import { PageHeader, PageHeaderProps } from '@/components/ui/page-header';
import { motion } from 'framer-motion';

export interface PageLayoutProps {
    header?: PageHeaderProps;
    children: React.ReactNode;
    className?: string;
    maxWidth?: 'default' | 'wide' | 'full';
    spacing?: 'default' | 'compact' | 'spacious';
    animate?: boolean;
}

export function PageLayout({
    header,
    children,
    className,
    maxWidth = 'default',
    spacing = 'default',
    animate = true
}: PageLayoutProps) {
    const maxWidthClasses = {
        default: 'max-w-7xl mx-auto',
        wide: 'max-w-[1600px] mx-auto',
        full: 'max-w-none'
    };

    const spacingClasses = {
        compact: 'space-y-4',
        default: 'space-y-6',
        spacious: 'space-y-8'
    };

    const content = (
        <div className={cn(
            maxWidthClasses[maxWidth],
            spacingClasses[spacing],
            className
        )}>
            {header && <PageHeader {...header} />}
            {children}
        </div>
    );

    if (!animate) {
        return content;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {content}
        </motion.div>
    );
}