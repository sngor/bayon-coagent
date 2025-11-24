'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Responsive design helpers and mobile optimizations
 * Following mobile-first design principles
 */

interface ResponsiveContainerProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function ResponsiveContainer({
    children,
    className,
    maxWidth = 'full',
    padding = 'md'
}: ResponsiveContainerProps) {
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-full'
    };

    const paddingClasses = {
        none: '',
        sm: 'px-2 sm:px-4',
        md: 'px-4 sm:px-6 lg:px-8',
        lg: 'px-6 sm:px-8 lg:px-12'
    };

    return (
        <div className={cn(
            'mx-auto w-full',
            maxWidthClasses[maxWidth],
            paddingClasses[padding],
            className
        )}>
            {children}
        </div>
    );
}

interface ResponsiveGridProps {
    children: React.ReactNode;
    className?: string;
    cols?: {
        default: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
    gap?: 'sm' | 'md' | 'lg';
}

export function ResponsiveGrid({
    children,
    className,
    cols = { default: 1, sm: 2, lg: 3 },
    gap = 'md'
}: ResponsiveGridProps) {
    const gapClasses = {
        sm: 'gap-2 sm:gap-3',
        md: 'gap-4 sm:gap-6',
        lg: 'gap-6 sm:gap-8'
    };

    const gridClasses = [
        `grid-cols-${cols.default}`,
        cols.sm && `sm:grid-cols-${cols.sm}`,
        cols.md && `md:grid-cols-${cols.md}`,
        cols.lg && `lg:grid-cols-${cols.lg}`,
        cols.xl && `xl:grid-cols-${cols.xl}`
    ].filter(Boolean).join(' ');

    return (
        <div className={cn(
            'grid',
            gridClasses,
            gapClasses[gap],
            className
        )}>
            {children}
        </div>
    );
}

interface MobileOptimizedTableProps {
    headers: string[];
    data: Array<Record<string, any>>;
    className?: string;
    mobileCardView?: boolean;
    keyField?: string;
}

export function MobileOptimizedTable({
    headers,
    data,
    className,
    mobileCardView = true,
    keyField = 'id'
}: MobileOptimizedTableProps) {
    const isMobile = useIsMobile();

    if (isMobile && mobileCardView) {
        return (
            <div className={cn('space-y-4', className)}>
                {data.map((row, index) => (
                    <div key={row[keyField] || index} className="bg-card border rounded-lg p-4">
                        {headers.map((header, headerIndex) => (
                            <div key={headerIndex} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                <span className="font-medium text-sm text-muted-foreground">{header}</span>
                                <span className="text-sm">{row[header.toLowerCase()] || '-'}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={cn('overflow-x-auto', className)}>
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b">
                        {headers.map((header, index) => (
                            <th key={index} className="text-left p-4 font-medium text-sm">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={row[keyField] || index} className="border-b hover:bg-muted/50">
                            {headers.map((header, headerIndex) => (
                                <td key={headerIndex} className="p-4 text-sm">
                                    {row[header.toLowerCase()] || '-'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

interface TouchOptimizedButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
}

export function TouchOptimizedButton({
    children,
    onClick,
    className,
    variant = 'default',
    size = 'md',
    disabled = false
}: TouchOptimizedButtonProps) {
    const variantClasses = {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground'
    };

    const sizeClasses = {
        sm: 'h-10 px-4 text-sm min-h-[44px]', // Minimum 44px for touch targets
        md: 'h-12 px-6 text-base min-h-[48px]',
        lg: 'h-14 px-8 text-lg min-h-[52px]'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'inline-flex items-center justify-center rounded-md font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                'touch-manipulation', // Optimizes for touch
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
        >
            {children}
        </button>
    );
}

interface SwipeableCardProps {
    children: React.ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    className?: string;
    swipeThreshold?: number;
}

export function SwipeableCard({
    children,
    onSwipeLeft,
    onSwipeRight,
    className,
    swipeThreshold = 100
}: SwipeableCardProps) {
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.touches[0].clientX);
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        setCurrentX(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;

        const deltaX = currentX - startX;

        if (Math.abs(deltaX) > swipeThreshold) {
            if (deltaX > 0 && onSwipeRight) {
                onSwipeRight();
            } else if (deltaX < 0 && onSwipeLeft) {
                onSwipeLeft();
            }
        }

        setIsDragging(false);
        setCurrentX(0);
        setStartX(0);
    };

    const transform = isDragging ? `translateX(${currentX - startX}px)` : 'translateX(0)';

    return (
        <div
            className={cn(
                'transition-transform duration-200 ease-out touch-pan-y',
                className
            )}
            style={{ transform }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {children}
        </div>
    );
}

interface VirtualizedListProps {
    items: any[];
    renderItem: (item: any, index: number) => React.ReactNode;
    itemHeight: number;
    containerHeight: number;
    className?: string;
    overscan?: number;
}

export function VirtualizedList({
    items,
    renderItem,
    itemHeight,
    containerHeight,
    className,
    overscan = 5
}: VirtualizedListProps) {
    const [scrollTop, setScrollTop] = useState(0);

    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
        visibleStart + Math.ceil(containerHeight / itemHeight) + overscan,
        items.length
    );

    const visibleItems = items.slice(
        Math.max(0, visibleStart - overscan),
        visibleEnd
    );

    const totalHeight = items.length * itemHeight;
    const offsetY = Math.max(0, visibleStart - overscan) * itemHeight;

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    return (
        <div
            className={cn('overflow-auto', className)}
            style={{ height: containerHeight }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                    {visibleItems.map((item, index) => (
                        <div
                            key={Math.max(0, visibleStart - overscan) + index}
                            style={{ height: itemHeight }}
                        >
                            {renderItem(item, Math.max(0, visibleStart - overscan) + index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface ResponsiveModalProps {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    className?: string;
    fullScreenOnMobile?: boolean;
}

export function ResponsiveModal({
    children,
    isOpen,
    onClose,
    className,
    fullScreenOnMobile = true
}: ResponsiveModalProps) {
    const isMobile = useIsMobile();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal content */}
            <div className={cn(
                'relative bg-background border shadow-lg',
                isMobile && fullScreenOnMobile
                    ? 'w-full h-full rounded-none'
                    : 'max-w-lg w-full mx-4 rounded-lg max-h-[90vh] overflow-y-auto',
                className
            )}>
                {children}
            </div>
        </div>
    );
}

// Breakpoint utilities
export const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
};

// Hook for responsive values
export function useResponsiveValue<T>(values: {
    default: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
}): T {
    const [currentValue, setCurrentValue] = useState(values.default);

    useEffect(() => {
        const updateValue = () => {
            const width = window.innerWidth;

            if (width >= 1280 && values.xl !== undefined) {
                setCurrentValue(values.xl);
            } else if (width >= 1024 && values.lg !== undefined) {
                setCurrentValue(values.lg);
            } else if (width >= 768 && values.md !== undefined) {
                setCurrentValue(values.md);
            } else if (width >= 640 && values.sm !== undefined) {
                setCurrentValue(values.sm);
            } else {
                setCurrentValue(values.default);
            }
        };

        updateValue();
        window.addEventListener('resize', updateValue);
        return () => window.removeEventListener('resize', updateValue);
    }, [values]);

    return currentValue;
}

// Touch-friendly spacing utilities
export const touchSpacing = {
    minTouchTarget: 'min-h-[44px] min-w-[44px]', // iOS HIG minimum
    comfortableTouch: 'min-h-[48px] min-w-[48px]', // Comfortable for most users
    generousTouch: 'min-h-[56px] min-w-[56px]', // Material Design recommendation
    padding: {
        touch: 'p-3 sm:p-4', // Extra padding on mobile
        comfortable: 'p-4 sm:p-6',
        generous: 'p-6 sm:p-8'
    },
    margin: {
        touch: 'm-2 sm:m-3',
        comfortable: 'm-3 sm:m-4',
        generous: 'm-4 sm:m-6'
    }
};

// Responsive text utilities
export const responsiveText = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
    '3xl': 'text-3xl sm:text-4xl'
};