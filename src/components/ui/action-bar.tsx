'use client';

import { cn } from '@/lib/utils/common';

export interface ActionBarProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'sticky' | 'floating' | 'inline';
    alignment?: 'left' | 'center' | 'right' | 'between' | 'around';
    spacing?: 'default' | 'compact' | 'spacious';
}

export function ActionBar({
    children,
    className,
    variant = 'default',
    alignment = 'right',
    spacing = 'default'
}: ActionBarProps) {
    const variants = {
        default: 'flex items-center',
        sticky: 'sticky top-20 z-10 flex items-center bg-background/80 backdrop-blur-xl border-b p-4 -mx-4 md:-mx-8 lg:-mx-10 px-4 md:px-8 lg:px-10',
        floating: 'fixed bottom-6 right-6 z-50 flex items-center bg-background/90 backdrop-blur-xl border rounded-lg shadow-lg p-3',
        inline: 'inline-flex items-center'
    };

    const alignments = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
        between: 'justify-between',
        around: 'justify-around'
    };

    const spacingClasses = {
        compact: 'gap-2',
        default: 'gap-3',
        spacious: 'gap-4'
    };

    return (
        <div className={cn(
            variants[variant],
            alignments[alignment],
            spacingClasses[spacing],
            className
        )}>
            {children}
        </div>
    );
}