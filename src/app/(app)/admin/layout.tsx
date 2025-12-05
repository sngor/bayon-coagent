'use client';

import { HubLayout } from '@/components/hub/hub-layout';
import { Shield, BarChart3, Users, MessageSquare, Flag, Settings, Activity, DollarSign, Key, FileText, Megaphone, Bell } from 'lucide-react';
import { useUserRole } from '@/hooks/use-user-role';
import { useMemo } from 'react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSuperAdmin } = useUserRole();

    // Define admin tabs with role-based visibility
    const adminTabs = useMemo(() => {
        const baseTabs = [
            {
                id: 'overview',
                label: 'Overview',
                href: '/admin',
                icon: Shield,
            },
            {
                id: 'analytics',
                label: 'Analytics',
                href: '/admin/analytics',
                icon: BarChart3,
            },
            {
                id: 'users',
                label: 'Users',
                href: '/admin/users',
                icon: Users,
            },
            {
                id: 'support',
                label: 'Support',
                href: '/admin/support',
                icon: MessageSquare,
            },
            {
                id: 'content',
                label: 'Content',
                href: '/admin/content/moderation',
                icon: Flag,
            },
            {
                id: 'feedback',
                label: 'Feedback',
                href: '/admin/feedback',
                icon: Bell,
            },
            {
                id: 'announcements',
                label: 'Announcements',
                href: '/admin/announcements',
                icon: Megaphone,
            },
            {
                id: 'system',
                label: 'System',
                href: '/admin/system/health',
                icon: Activity,
            },
            {
                id: 'config',
                label: 'Config',
                href: '/admin/config/features',
                icon: Settings,
            },
        ];

        // Add SuperAdmin-only tabs
        if (isSuperAdmin) {
            baseTabs.push(
                {
                    id: 'billing',
                    label: 'Billing',
                    href: '/admin/billing',
                    icon: DollarSign,
                },
                {
                    id: 'integrations',
                    label: 'Integrations',
                    href: '/admin/integrations',
                    icon: Key,
                },
                {
                    id: 'audit',
                    label: 'Audit',
                    href: '/admin/audit',
                    icon: FileText,
                }
            );
        }

        return baseTabs;
    }, [isSuperAdmin]);

    return (
        <HubLayout
            title="Admin Hub"
            description="Platform management and monitoring"
            icon={Shield}
            tabs={adminTabs}
        >
            {children}
        </HubLayout>
    );
}
