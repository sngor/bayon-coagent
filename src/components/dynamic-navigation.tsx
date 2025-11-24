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
    BarChart3,
    Settings,
    Activity,
    Shield,
    GraduationCap,
    Library,
    Target,
    Wand2,
    Calculator,
} from 'lucide-react';
import {
    HouseIcon,
    AISparkleIcon,
} from '@/components/ui/real-estate-icons';
import { useAdmin } from '@/contexts/admin-context';

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
        href: '/assistant',
        icon: MessageSquare,
        filledIcon: FilledIcons.MessageSquare,
        label: 'Chat',
        featureId: 'assistant'
    },
    {
        href: '/studio',
        icon: Wand2,
        filledIcon: FilledIcons.Wand2,
        label: 'Studio',
        featureId: 'studio'
    },
    {
        href: '/brand',
        icon: Target,
        filledIcon: FilledIcons.Target,
        label: 'Brand',
        featureId: 'brand'
    },
    {
        href: '/research',
        icon: AISparkleIcon,
        filledIcon: FilledIcons.AISparkleIcon,
        label: 'Research',
        customIcon: true,
        featureId: 'research'
    },
    {
        href: '/market',
        icon: BarChart3,
        filledIcon: FilledIcons.BarChart3,
        label: 'Market',
        featureId: 'market'
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
        href: '/training',
        icon: GraduationCap,
        filledIcon: FilledIcons.GraduationCap,
        label: 'Training',
        featureId: 'training'
    },
];

// Admin navigation
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
        label: 'User Management',
        customIcon: false
    },
    {
        href: '/admin/feedback',
        icon: MessageSquare,
        filledIcon: FilledIcons.MessageSquare,
        label: 'Feedback',
        customIcon: false
    },
    {
        href: '/admin/analytics',
        icon: BarChart3,
        filledIcon: FilledIcons.BarChart3,
        label: 'Analytics',
        customIcon: false
    },
    {
        href: '/admin/health',
        icon: Activity,
        filledIcon: FilledIcons.Activity,
        label: 'System Health',
        customIcon: false
    },
    {
        href: '/admin/features',
        icon: Settings,
        filledIcon: FilledIcons.Settings,
        label: 'Features',
        customIcon: false
    },
];

export function DynamicNavigation() {
    const pathname = usePathname();
    const { isAdminMode } = useAdmin();

    const navItems = isAdminMode ? adminNavItems : regularNavItems;

    return (
        <>


            {/* Navigation Items */}
            <SidebarMenu>
                {navItems.map((item) => {
                    // More precise active state logic
                    const isActive = item.href === '/admin'
                        ? pathname === '/admin' // Exact match for admin dashboard
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
                                        item.customIcon ? (
                                            <item.filledIcon animated={false} className="w-5 h-5" />
                                        ) : (
                                            <item.filledIcon className="w-5 h-5" />
                                        )
                                    ) : (
                                        // Show outlined icon when inactive
                                        item.customIcon ? (
                                            <item.icon animated={false} className="w-5 h-5" />
                                        ) : (
                                            <item.icon className="w-5 h-5" />
                                        )
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