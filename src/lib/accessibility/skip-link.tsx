/**
 * Skip Link Component
 * 
 * Provides a skip link for keyboard users to bypass navigation and jump to main content.
 * The link is visually hidden until focused, meeting WCAG accessibility guidelines.
 * 
 * Requirements: 7.1, 7.3
 */

'use client';

import { cn } from '../utils/common';

export interface SkipLinkProps {
    /** The ID of the target element to skip to */
    targetId: string;
    /** The text to display in the skip link */
    text?: string;
    /** Additional CSS classes */
    className?: string;
}

/**
 * SkipLink Component
 * 
 * A visually hidden link that becomes visible when focused.
 * Allows keyboard users to skip repetitive navigation and jump directly to main content.
 */
export function SkipLink({
    targetId,
    text = 'Skip to main content',
    className,
}: SkipLinkProps) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();

        const target = document.getElementById(targetId);
        if (target) {
            // Make the target focusable
            target.setAttribute('tabindex', '-1');
            target.focus();

            // Scroll into view
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Remove tabindex after blur
            target.addEventListener('blur', () => {
                target.removeAttribute('tabindex');
            }, { once: true });
        }
    };

    return (
        <a
            href={`#${targetId}`}
            onClick={handleClick}
            className={cn(
                // Visually hidden by default
                'sr-only',
                // Visible when focused
                'focus:not-sr-only',
                'focus:absolute',
                'focus:top-4',
                'focus:left-4',
                'focus:z-[100]',
                'focus:px-4',
                'focus:py-2',
                'focus:bg-primary',
                'focus:text-primary-foreground',
                'focus:rounded-md',
                'focus:shadow-lg',
                'focus:outline-none',
                'focus:ring-2',
                'focus:ring-ring',
                'focus:ring-offset-2',
                // Ensure minimum touch target size
                'focus:min-h-[44px]',
                'focus:min-w-[44px]',
                'focus:flex',
                'focus:items-center',
                'focus:justify-center',
                'focus:font-medium',
                'focus:text-sm',
                className
            )}
        >
            {text}
        </a>
    );
}
