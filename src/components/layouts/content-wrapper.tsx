'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/common';

/**
 * ContentWrapper - Consistent content container with max-width and padding
 *
 * @example
 * <ContentWrapper maxWidth="default">
 *   {/* Content */}
 * </ContentWrapper >
 *
 * @requirements 8.1
    */
export interface ContentWrapperProps {
    children: React.ReactNode;
    maxWidth?: 'default' | 'wide' | 'narrow' | 'full';
    fullWidth?: boolean;
    className?: string;
}

export function ContentWrapper({
    children,
    maxWidth = 'default',
    fullWidth = false,
    className,
}: ContentWrapperProps) {
    const maxWidthClasses = {
        narrow: 'max-w-3xl',
        default: 'max-w-7xl',
        wide: 'max-w-[1600px]',
        full: 'max-w-none',
    };

    return (
        <div
            className={cn(
                'mx-auto w-full',
                !fullWidth && 'px-4 sm:px-6 lg:px-8',
                !fullWidth && maxWidthClasses[maxWidth],
                className
            )}
        >
            {children}
        </div>
    );
}
