'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect when a page title has scrolled out of view
 * Returns whether the title should be shown in the sticky header
 */
export function useStickyTitle() {
    const [showInHeader, setShowInHeader] = useState(false);

    useEffect(() => {
        const checkTitleVisibility = () => {
            // Find the h1 inside the actual content (not in header)
            const contentArea = document.querySelector('main > div:not(header)');
            const h1 = contentArea?.querySelector('h1');

            if (!h1) {
                setShowInHeader(false);
                return;
            }

            const rect = h1.getBoundingClientRect();
            // Show in header if title's bottom is above the header bottom (80px)
            const shouldShow = rect.bottom < 100;

            console.log('🔍 Sticky title check:', {
                bottom: rect.bottom,
                shouldShow,
                h1Text: h1.textContent?.substring(0, 30)
            });

            setShowInHeader(shouldShow);
        };

        // Initial check
        const timeoutId = setTimeout(checkTitleVisibility, 300);

        // SidebarInset renders as <main> with overflow-y-auto, so it's the scroll container
        const scrollContainer = document.querySelector('main');

        if (!scrollContainer) {
            console.warn('⚠️ Main scroll container not found');
            return () => clearTimeout(timeoutId);
        }

        console.log('✅ Listening to scroll on main element');

        scrollContainer.addEventListener('scroll', checkTitleVisibility, { passive: true });

        return () => {
            clearTimeout(timeoutId);
            scrollContainer.removeEventListener('scroll', checkTitleVisibility);
        };
    }, []);

    return showInHeader;
}
