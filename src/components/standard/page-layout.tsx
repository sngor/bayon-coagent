'use client';

import { cn } from '@/lib/utils/common';
import { motion } from 'framer-motion';

export interface StandardPageLayoutProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    maxWidth?: 'default' | 'wide' | 'full';
    spacing?: 'default' | 'compact' | 'spacious';
    className?: string;
}

const maxWidthClasses = {
    default: 'max-w-7xl',
    wide: 'max-w-[1600px]',
    full: 'max-w-none',
};

const spacingClasses = {
    compact: 'space-y-4',
    default: 'space-y-6',
    spacious: 'space-y-8',
};

export function StandardPageLayout({
    title,
    description,
    actions,
    children,
    maxWidth = 'default',
    spacing = 'default',
    className,
}: StandardPageLayoutProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(spacingClasses[spacing], className)}
        >
            {/* Page Header */}
            <header className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="font-headline text-display-large text-gradient-primary">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-2 text-lg text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex-shrink-0" role="group" aria-label="Page actions">
                        {actions}
                    </div>
                )}
            </header>

            {/* Page Content */}
            <main className={cn(maxWidthClasses[maxWidth], 'mx-auto')}>
                {children}
            </main>
        </motion.div>
    );
}
