'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigationPrefetch, PrefetchContext } from '@/lib/mobile/performance';

export interface NavigationPrefetchProviderProps {
    children: React.ReactNode;
    userRole?: string;
}

/**
 * Provider component for navigation prefetching
 * Implements Requirements 7.4: Navigation prefetching based on context
 */
export function NavigationPrefetchProvider({
    children,
    userRole,
}: NavigationPrefetchProviderProps) {
    const pathname = usePathname();
    const [recentRoutes, setRecentRoutes] = useState<string[]>([]);

    // Track recent routes
    useEffect(() => {
        setRecentRoutes((prev) => {
            const updated = [pathname, ...prev.filter((r) => r !== pathname)].slice(0, 5);
            return updated;
        });
    }, [pathname]);

    // Determine time of day
    const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        return 'evening';
    };

    // Create prefetch context
    const context: PrefetchContext = {
        currentRoute: pathname,
        userRole,
        recentRoutes,
        timeOfDay: getTimeOfDay(),
    };

    // Use prefetch hook
    useNavigationPrefetch(context);

    return <>{children}</>;
}
