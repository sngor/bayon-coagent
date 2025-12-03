'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
    Users,
    MessageSquare,
    MessagesSquare,
    BarChart3,
    Settings,
    Activity,
    Shield,
    GraduationCap,
    Library,
    Target,
    Wand2,
    Calculator,
    FileText,
    DoorOpen,
} from 'lucide-react';
import {
    HouseIcon,
    AISparkleIcon,
} from '@/components/ui/real-estate-icons';
import { useFeatureToggles } from '@/lib/feature-toggles';
import { ICON_SIZES } from '@/lib/constants/icon-sizes';

// Filled icon variants for active states - matching the exact shapes of outlined icons
const FilledIcons = {
    HouseIcon: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M3 12l9-9 9 9" />
            <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
            <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
        </svg>
    ),
    MessageSquare: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    MessagesSquare: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M14 9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9l-3-3h-3a2 2 0 0 1-2-2V9Z" />
            <path d="M5 5a2 2 0 0 0-2 2v9l3-3h5a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5Z" />
        </svg>
    ),
    Wand2: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72Z" />
            <path d="m14 7 3 3" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M5 6v4" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M19 14v4" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M10 2v2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M7 8H3" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M21 16h-4" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M11 3H9" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    ),
    Target: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" fill="rgba(255,255,255,0.3)" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
    ),
    AISparkleIcon: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    BarChart3: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="7" y="12" width="3" height="8" />
            <rect x="12" y="8" width="3" height="12" />
            <rect x="17" y="5" width="3" height="15" />
        </svg>
    ),
    Calculator: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <rect x="4" y="2" width="16" height="20" rx="2" />
            {/* Display screen */}
            <rect x="6" y="6" width="12" height="3" fill="rgba(255,255,255,0.2)" stroke="currentColor" strokeWidth="1" />
            {/* Calculator buttons - filled with slight transparency to show on filled background */}
            <rect x="6" y="11" width="2" height="2" fill="rgba(255,255,255,0.3)" />
            <rect x="10" y="11" width="2" height="2" fill="rgba(255,255,255,0.3)" />
            <rect x="14" y="11" width="2" height="2" fill="rgba(255,255,255,0.3)" />
            <rect x="6" y="15" width="2" height="2" fill="rgba(255,255,255,0.3)" />
            <rect x="10" y="15" width="2" height="2" fill="rgba(255,255,255,0.3)" />
            <rect x="14" y="15" width="2" height="6" fill="rgba(255,255,255,0.3)" />
            <rect x="6" y="19" width="6" height="2" fill="rgba(255,255,255,0.3)" />
        </svg>
    ),
    Library: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    ),
    GraduationCap: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M22 10v6M6 12H2l10-5 10 5-10 5z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="currentColor" strokeWidth="2" fill="none" />
            <polygon points="2,12 12,7 22,12 12,17" />
        </svg>
    ),
    Shield: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
    ),
    Users: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    ),
    Activity: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="1" y="11" width="22" height="2" />
        </svg>
    ),
    Settings: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    FileText: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" fill="none" />
            <line x1="16" y1="13" x2="8" y2="13" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
            <line x1="16" y1="17" x2="8" y2="17" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
            <line x1="10" y1="9" x2="8" y2="9" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        </svg>
    ),
    DoorOpen: ({ ...props }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M13 4h3a2 2 0 0 1 2 2v14" />
            <path d="M2 20h3" />
            <path d="M13 20h9" />
            <path d="M10 12v.01" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M13 4.562v15.157a1 1 0 0 1-.553.894l-4.553 2.277a1 1 0 0 1-1.447-.894V5.562a2 2 0 0 1 1.105-1.788l4.553-2.277a1 1 0 0 1 1.447.894" />
        </svg>
    ),
};

// Regular user navigation
const regularNavItems = [
    {
        href: '/dashboard',
        icon: HouseIcon,
        filledIcon: FilledIcons.HouseIcon,
        label: 'Dashboard',
        customIcon: true,
        featureId: null
    },
    {
        href: '/brand',
        icon: Target,
        filledIcon: FilledIcons.Target,
        label: 'Brand',
        featureId: 'brand'
    },
    {
        href: '/studio',
        icon: Wand2,
        filledIcon: FilledIcons.Wand2,
        label: 'Studio',
        featureId: 'studio'
    },
    {
        href: '/intelligence',
        icon: AISparkleIcon,
        filledIcon: FilledIcons.AISparkleIcon,
        label: 'Intelligence', // Matches URL /intelligence
        customIcon: true,
        featureId: 'research'
    },
    {
        href: '/tools',
        icon: Calculator,
        filledIcon: FilledIcons.Calculator,
        label: 'Tools',
        featureId: 'tools'
    },
    {
        href: '/library',
        icon: Library,
        filledIcon: FilledIcons.Library,
        label: 'Library',
        featureId: 'library'
    },
    {
        href: '/client-dashboards',
        icon: Users,
        filledIcon: FilledIcons.Users,
        label: 'Clients',
        featureId: 'client-dashboards'
    },
    {
        href: '/learning',
        icon: GraduationCap,
        filledIcon: FilledIcons.GraduationCap,
        label: 'Learning', // Matches URL /learning
        featureId: 'training'
    },
    {
        href: '/assistant',
        icon: MessagesSquare,
        filledIcon: FilledIcons.MessagesSquare,
        label: 'Assistant', // Changed from 'Chat' to match URL
        featureId: 'assistant'
    },
    {
        href: '/open-house',
        icon: DoorOpen,
        filledIcon: FilledIcons.DoorOpen,
        label: 'Open House',
        featureId: 'open-house'
    },
];

// Super Admin navigation
const superAdminNavItems = [
    {
        href: '/super-admin',
        icon: Shield,
        filledIcon: FilledIcons.Shield,
        label: 'Super Admin Dashboard',
        customIcon: false
    },
    {
        href: '/super-admin/users',
        icon: Users,
        filledIcon: FilledIcons.Users,
        label: 'User Management',
        customIcon: false
    },
    {
        href: '/super-admin/teams',
        icon: Users,
        filledIcon: FilledIcons.Users,
        label: 'Teams',
        customIcon: false
    },
    {
        href: '/super-admin/feedback',
        icon: MessageSquare,
        filledIcon: FilledIcons.MessageSquare,
        label: 'Feedback',
        customIcon: false
    },
    {
        href: '/super-admin/analytics',
        icon: BarChart3,
        filledIcon: FilledIcons.BarChart3,
        label: 'Analytics',
        customIcon: false
    },
    {
        href: '/super-admin/health',
        icon: Activity,
        filledIcon: FilledIcons.Activity,
        label: 'System Health',
        customIcon: false
    },
    {
        href: '/super-admin/features',
        icon: Settings,
        filledIcon: FilledIcons.Settings,
        label: 'Features',
        customIcon: false
    },
    {
        href: '/super-admin/audit-logs',
        icon: FileText,
        filledIcon: FilledIcons.FileText,
        label: 'Audit Logs',
        customIcon: false
    },
];

// Normal Admin navigation
const adminNavItems = [
    {
        href: '/admin',
        icon: Shield,
        filledIcon: FilledIcons.Shield,
        label: 'Admin Dashboard',
        customIcon: false
    },
    {
        href: '/admin/users',
        icon: Users,
        filledIcon: FilledIcons.Users,
        label: 'Team Members',
        customIcon: false
    },

    {
        href: '/admin/settings',
        icon: Settings,
        filledIcon: FilledIcons.Settings,
        label: 'Settings',
        customIcon: false
    },
    {
        href: '/admin/resources',
        icon: Library,
        filledIcon: FilledIcons.Library,
        label: 'Resources',
        customIcon: false
    },
];

export function DynamicNavigation() {
    const pathname = usePathname();
    const { features } = useFeatureToggles();

    // Create a map of enabled features for quick lookup
    const enabledFeatures = new Set(
        features.filter(f => f.enabled).map(f => f.id)
    );

    // Determine sidebar content based on URL path
    const isSuperAdminPath = pathname?.startsWith('/super-admin');
    const isAdminPath = pathname?.startsWith('/admin');

    // Select navigation items based on path
    let navItems;
    if (isSuperAdminPath) {
        navItems = superAdminNavItems;
    } else if (isAdminPath) {
        navItems = adminNavItems;
    } else {
        navItems = regularNavItems.filter(item => {
            // Dashboard has no featureId, always show it
            if (!item.featureId) return true;
            // Check if the feature is enabled
            return enabledFeatures.has(item.featureId);
        });
    }

    return (
        <>


            {/* Navigation Items */}
            <SidebarMenu>
                {navItems.map((item) => {
                    // More precise active state logic
                    const isActive = (item.href === '/super-admin' || item.href === '/dashboard' || item.href === '/admin')
                        ? pathname === item.href // Exact match for dashboards
                        : pathname.startsWith(item.href); // Prefix match for other routes

                    return (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={item.label}
                            >
                                <Link href={item.href}>
                                    {isActive ? (
                                        // Show filled icon when active
                                        <item.filledIcon className={ICON_SIZES.md} />
                                    ) : (
                                        // Show outlined icon when inactive
                                        <item.icon className={ICON_SIZES.md} />
                                    )}
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>


        </>
    );
}