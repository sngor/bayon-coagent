'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface PageTransitionProps {
    children: React.ReactNode;
}

/**
 * PageTransition component provides smooth fade transitions between pages
 * and displays a loading state during navigation.
 * 
 * Features:
 * - Smooth fade-in animation when page content loads
 * - Loading indicator during navigation
 * - Respects reduced motion preferences (via CSS)
 * - Minimal performance impact
 * 
 * Requirements:
 * - 10.1: Smooth page transitions
 * - 10.5: Respects reduced motion preferences
 */
export function PageTransition({ children }: PageTransitionProps) {
    const pathname = usePathname();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [displayChildren, setDisplayChildren] = useState(children);
    const previousPathname = useRef(pathname);
    const [isFirstRender, setIsFirstRender] = useState(true);

    useEffect(() => {
        // Skip transition on first render
        if (isFirstRender) {
            setIsFirstRender(false);
            setDisplayChildren(children);
            return;
        }

        // Check if pathname actually changed
        if (previousPathname.current !== pathname) {
            // Start transition
            setIsTransitioning(true);

            // Short delay to show loading state and allow fade out
            const transitionTimer = setTimeout(() => {
                setDisplayChildren(children);
                setIsTransitioning(false);
            }, 150);

            previousPathname.current = pathname;

            return () => clearTimeout(transitionTimer);
        } else {
            // Update children without transition if pathname hasn't changed
            setDisplayChildren(children);
        }
    }, [pathname, children, isFirstRender]);

    return (
        <>
            {isTransitioning && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in"
                    role="status"
                    aria-live="polite"
                    aria-label="Loading page"
                >
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                </div>
            )}
            <div
                className={isTransitioning ? 'animate-fade-out' : 'animate-page-transition'}
                key={pathname}
            >
                {displayChildren}
            </div>
        </>
    );
}
