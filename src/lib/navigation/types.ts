import { LucideIcon } from 'lucide-react';

export interface NavigationItem {
    href: string;
    icon: LucideIcon | React.ComponentType<any>;
    filledIcon: LucideIcon | React.ComponentType<any>;
    label: string;
    customIcon?: boolean;
    featureId?: string | null;
    adminOnly?: boolean;
    superAdminOnly?: boolean;
}

export type NavigationSection = 'regular' | 'admin' | 'superAdmin';

export interface NavigationConfig {
    regular: NavigationItem[];
    admin: NavigationItem[];
    superAdmin: NavigationItem[];
}