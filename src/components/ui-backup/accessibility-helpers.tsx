'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/common';

/**
 * Accessibility helper components following WCAG 2.1 AA standards
 */

interface SkipLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
    return (
        <a
            href={href}
            className={cn(
                "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
                "bg-primary text-primary-foreground px-4 py-2 rounded-md",
                "font-medium z-50 transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                className
            )}
        >
            {children}
        </a>
    );
}

interface LiveRegionProps {
    children: React.ReactNode;
    politeness?: 'polite' | 'assertive' | 'off';
    atomic?: boolean;
    relevant?: 'additions' | 'removals' | 'text' | 'all';
    className?: string;
}

export function LiveRegion({
    children,
    politeness = 'polite',
    atomic = false,
    relevant = 'additions',
    className
}: LiveRegionProps) {
    return (
        <div
            aria-live={politeness}
            aria-atomic={atomic}
            aria-relevant={relevant}
            className={cn("sr-only", className)}
        >
            {children}
        </div>
    );
}

interface FocusTrapProps {
    children: React.ReactNode;
    isActive: boolean;
    restoreFocus?: boolean;
    className?: string;
}

export function FocusTrap({ children, isActive, restoreFocus = true, className }: FocusTrapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isActive) return;

        // Store the previously focused element
        previousActiveElement.current = document.activeElement as HTMLElement;

        const container = containerRef.current;
        if (!container) return;

        // Get all focusable elements
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        // Focus the first element
        if (firstElement) {
            firstElement.focus();
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('keydown', handleKeyDown);

            // Restore focus to the previously focused element
            if (restoreFocus && previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        };
    }, [isActive, restoreFocus]);

    return (
        <div ref={containerRef} className={className}>
            {children}
        </div>
    );
}

interface VisuallyHiddenProps {
    children: React.ReactNode;
    className?: string;
}

export function VisuallyHidden({ children, className }: VisuallyHiddenProps) {
    return (
        <span className={cn("sr-only", className)}>
            {children}
        </span>
    );
}

interface ProgressAnnouncerProps {
    value: number;
    max: number;
    label?: string;
    description?: string;
    className?: string;
}

export function ProgressAnnouncer({
    value,
    max,
    label = "Progress",
    description,
    className
}: ProgressAnnouncerProps) {
    const percentage = Math.round((value / max) * 100);

    return (
        <div className={className}>
            <div
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={label}
                aria-describedby={description ? `${label}-description` : undefined}
            >
                <VisuallyHidden>
                    {label}: {percentage}% complete
                </VisuallyHidden>
            </div>
            {description && (
                <div id={`${label}-description`} className="sr-only">
                    {description}
                </div>
            )}
        </div>
    );
}

interface KeyboardShortcutProps {
    keys: string[];
    description: string;
    onActivate: () => void;
    disabled?: boolean;
}

export function useKeyboardShortcut({ keys, description, onActivate, disabled = false }: KeyboardShortcutProps) {
    useEffect(() => {
        if (disabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const pressedKeys: string[] = [];

            if (e.ctrlKey || e.metaKey) pressedKeys.push('cmd');
            if (e.shiftKey) pressedKeys.push('shift');
            if (e.altKey) pressedKeys.push('alt');

            // Add the main key
            if (!['Control', 'Meta', 'Shift', 'Alt'].includes(e.key)) {
                pressedKeys.push(e.key.toLowerCase());
            }

            // Check if pressed keys match the shortcut
            const normalizedKeys = keys.map(k => k.toLowerCase());
            const matches = normalizedKeys.every(key => pressedKeys.includes(key)) &&
                pressedKeys.length === normalizedKeys.length;

            if (matches) {
                e.preventDefault();
                onActivate();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [keys, onActivate, disabled]);
}

interface AriaDescriptionProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

export function AriaDescription({ id, children, className }: AriaDescriptionProps) {
    return (
        <div id={id} className={cn("sr-only", className)}>
            {children}
        </div>
    );
}

interface HighContrastModeProps {
    children: React.ReactNode;
    className?: string;
}

export function HighContrastMode({ children, className }: HighContrastModeProps) {
    return (
        <div
            className={cn(
                "forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]",
                "forced-colors:border-[ButtonBorder]",
                className
            )}
        >
            {children}
        </div>
    );
}

interface ReducedMotionProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    className?: string;
}

export function ReducedMotion({ children, fallback, className }: ReducedMotionProps) {
    return (
        <div className={className}>
            <div className="motion-safe:block motion-reduce:hidden">
                {children}
            </div>
            {fallback && (
                <div className="motion-safe:hidden motion-reduce:block">
                    {fallback}
                </div>
            )}
        </div>
    );
}

// Hook for managing focus within a component
export function useFocusManagement() {
    const focusableElementsRef = useRef<HTMLElement[]>([]);
    const currentFocusIndex = useRef(0);

    const registerFocusableElement = (element: HTMLElement | null) => {
        if (element && !focusableElementsRef.current.includes(element)) {
            focusableElementsRef.current.push(element);
        }
    };

    const focusNext = () => {
        const elements = focusableElementsRef.current;
        if (elements.length === 0) return;

        currentFocusIndex.current = (currentFocusIndex.current + 1) % elements.length;
        elements[currentFocusIndex.current]?.focus();
    };

    const focusPrevious = () => {
        const elements = focusableElementsRef.current;
        if (elements.length === 0) return;

        currentFocusIndex.current = currentFocusIndex.current === 0
            ? elements.length - 1
            : currentFocusIndex.current - 1;
        elements[currentFocusIndex.current]?.focus();
    };

    const focusFirst = () => {
        const elements = focusableElementsRef.current;
        if (elements.length === 0) return;

        currentFocusIndex.current = 0;
        elements[0]?.focus();
    };

    const focusLast = () => {
        const elements = focusableElementsRef.current;
        if (elements.length === 0) return;

        currentFocusIndex.current = elements.length - 1;
        elements[currentFocusIndex.current]?.focus();
    };

    return {
        registerFocusableElement,
        focusNext,
        focusPrevious,
        focusFirst,
        focusLast
    };
}

// Hook for announcing dynamic content changes
export function useAnnouncer() {
    const announcerRef = useRef<HTMLDivElement>(null);

    const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (!announcerRef.current) return;

        // Clear previous message
        announcerRef.current.textContent = '';

        // Set new message after a brief delay to ensure screen readers pick it up
        setTimeout(() => {
            if (announcerRef.current) {
                announcerRef.current.setAttribute('aria-live', priority);
                announcerRef.current.textContent = message;
            }
        }, 100);
    };

    const AnnouncerComponent = () => (
        <div
            ref={announcerRef}
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
        />
    );

    return { announce, AnnouncerComponent };
}

// Color contrast utilities
export const colorContrastClasses = {
    // High contrast text combinations
    highContrast: {
        light: "text-gray-900 bg-white",
        dark: "text-white bg-gray-900"
    },
    // WCAG AA compliant combinations
    wcagAA: {
        primary: "text-blue-700 bg-blue-50",
        secondary: "text-gray-700 bg-gray-100",
        success: "text-green-800 bg-green-100",
        warning: "text-amber-800 bg-amber-100",
        error: "text-red-800 bg-red-100"
    }
};

// Focus visible utilities
export const focusVisibleClasses = {
    default: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    button: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    input: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
    card: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
};