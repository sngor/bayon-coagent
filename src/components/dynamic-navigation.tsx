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

// Regular user navigation
const regularNavItems = [
    { href: '/dashboard', icon: HouseIcon, label: 'Dashboard', customIcon: true, featureId: null },
    { href: '/assistant', icon: MessageSquare, label: 'Chat', featureId: 'assistant' },
    { href: '/studio', icon: Wand2, label: 'Studio', featureId: 'studio' },
    { href: '/brand', icon: Target, label: 'Brand', featureId: 'brand' },
    { href: '/research', icon: AISparkleIcon, label: 'Research', customIcon: true, featureId: 'research' },
    { href: '/market', icon: BarChart3, label: 'Market', featureId: 'market' },
    { href: '/tools', icon: Calculator, label: 'Tools', featureId: 'tools' },
    { href: '/library', icon: Library, label: 'Library', featureId: 'library' },
    { href: '/training', icon: GraduationCap, label: 'Training', featureId: 'training' },
];

// Admin navigation
const adminNavItems = [
    { href: '/admin', icon: Shield, label: 'Admin Dashboard', customIcon: false },
    { href: '/admin/users', icon: Users, label: 'User Management', customIcon: false },
    { href: '/admin/feedback', icon: MessageSquare, label: 'Feedback', customIcon: false },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics', customIcon: false },
    { href: '/admin/health', icon: Activity, label: 'System Health', customIcon: false },
    { href: '/admin/features', icon: Settings, label: 'Features', customIcon: false },
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
                                    {item.customIcon ? (
                                        <item.icon animated={false} className="w-5 h-5" />
                                    ) : (
                                        <item.icon />
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