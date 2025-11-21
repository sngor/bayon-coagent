'use client';

import { useEffect, useState } from 'react';

/**
 * Debug hook to help troubleshoot sticky title issues
 * Only use in development
 */
export function useStickyTitleDebug() {
    const [debugInfo, setDebugInfo] = useState({
        h1Found: false,
        h1Text: '',
        h1Position: { top: 0, bottom: 0 },
        mainElement: false,
        scrollTop: 0,
    });

    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return;

        const updateDebugInfo = () => {
            const mainElement = document.querySelector('main');
            const h1 = mainElement?.querySelector('h1');

            setDebugInfo({
                h1Found: !!h1,
                h1Text: h1?.textContent?.substring(0, 30) || '',
                h1Position: h1 ? {
                    top: h1.getBoundingClientRect().top,
                    bottom: h1.getBoundingClientRect().bottom
                } : { top: 0, bottom: 0 },
                mainElement: !!mainElement,
                scrollTop: mainElement?.scrollTop || 0,
            });
        };

        // Update every 500ms
        const interval = setInterval(updateDebugInfo, 500);
        updateDebugInfo(); // Initial call

        return () => clearInterval(interval);
    }, []);

    return debugInfo;
}