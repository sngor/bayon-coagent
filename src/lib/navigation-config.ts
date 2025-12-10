import {
    Target,
} from 'lucide-react';
import {
    HouseIcon,
} from '@/components/ui/real-estate-icons';
import { FilledNavigationIcons } from '@/components/ui/navigation-icons';

export interface NavigationItem {
    href: string;
    icon: React.ComponentType<any>;
    filledIcon: React.ComponentType<any>;
    label: string;
    customIcon?: boolean;
    featureId?: string | null;
    adminOnly?: boolean;
}

export const REGULAR_NAV_ITEMS: NavigationItem[] = [
    {
        href: '/dashboard',
        icon: HouseIcon,
        filledIcon: FilledNavigationIcons.HouseIcon,
        label: 'Dashboard',
        customIcon: true,
        featureId: null
    },
    {
        href: '/brand',
        icon: Target,
        filledIcon: FilledNavigationIcons.Target,
        label: 'Brand',
        featureId: 'brand'
    },
    // ... rest of navigation items
] as const;

export const SUPER_ADMIN_NAV_ITEMS: NavigationItem[] = [
    // ... super admin items
] as const;

export const ADMIN_NAV_ITEMS: NavigationItem[] = [
    // ... admin items
] as const;