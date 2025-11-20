'use client';

import { usePathname } from 'next/navigation';

export interface PageTransitionProps {
    children: React.ReactNode;
}

/**
 * PageTransition component provides smooth fade transitions between pages
 * without affecting the sidebar and topbar.
 * 
 * Features:
 * - Smooth fade-in animation when page content loads
 * - Only animates the main content area
 * - Sidebar and topbar remain static (no flash)
 * - Respects reduced motion preferences (via CSS)
 * - Minimal performance impact with CSS-only transitions
 * 
 * Requirements:
 * - 10.1: Smooth page transitions
 * - 10.5: Respects reduced motion preferences
 */
export function PageTransition({ children }: PageTransitionProps) {
    const pathname = usePathname();

    return (
        <div
            className="animate-page-transition"
            key={pathname}
            style={{ willChange: 'opacity' }}
        >
            {children}
        </div>
    );
}
