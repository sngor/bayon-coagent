import { useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useFeatureToggles } from '@/lib/feature-toggles';
import { useAdmin } from '@/contexts/admin-context';
import { useUserRole } from '@/hooks/use-user-role';
import { NAVIGATION_CONFIG } from './config';
import { NavigationItem, NavigationSection } from './types';

export function useNavigation() {
    const pathname = usePathname();
    const { features } = useFeatureToggles();
    const { isAdmin, isSuperAdmin } = useAdmin();
    const { isSuperAdmin: isSuperAdminRole } = useUserRole();

    // Create a set of enabled features for quick lookup
    const enabledFeatures = useMemo(() =>
        new Set(features.filter(f => f.enabled).map(f => f.id)),
        [features]
    );

    // Determine current navigation section
    const currentSection: NavigationSection = useMemo(() => {
        if (pathname?.startsWith('/super-admin')) return 'superAdmin';
        if (pathname?.startsWith('/admin')) return 'admin';
        return 'regular';
    }, [pathname]);

    // Memoize permission check function
    const hasPermission = useCallback((item: NavigationItem): boolean => {
        // Check super admin only items
        if (item.superAdminOnly && !isSuperAdminRole) {
            return false;
        }

        // Check admin only items
        if (item.adminOnly && !isAdmin && !isSuperAdmin) {
            return false;
        }

        // Check feature toggles (null featureId means always show)
        if (item.featureId && !enabledFeatures.has(item.featureId)) {
            return false;
        }

        return true;
    }, [enabledFeatures, isAdmin, isSuperAdmin, isSuperAdminRole]);

    // Get current navigation items with memoized filtering
    const navigationItems = useMemo(() => {
        const items = NAVIGATION_CONFIG[currentSection];
        return items.filter(hasPermission);
    }, [currentSection, hasPermission]);

    // Memoize active route check function
    const isActiveRoute = useCallback((href: string): boolean => {
        if (!pathname) return false;

        // Exact match for dashboard routes
        if (href === '/super-admin' || href === '/dashboard' || href === '/admin') {
            return pathname === href;
        }

        // Prefix match for other routes
        return pathname.startsWith(href);
    }, [pathname]);

    return {
        navigationItems,
        currentSection,
        isActiveRoute,
        enabledFeatures
    };
}