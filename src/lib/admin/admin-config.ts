import {
    Users,
    Settings,
    BarChart3,
    MessageSquare,
    FileText,
    Activity,
    Flag,
    Bell,
    Megaphone,
    DollarSign,
    Key,
    Wrench,
    Zap,
    Shield
} from 'lucide-react';

import { LucideIcon } from 'lucide-react';

export interface AdminQuickActionItem {
    href: string;
    icon: LucideIcon;
    label: string;
}

export interface AdminQuickActionConfig {
    title: string;
    description: string;
    icon: LucideIcon;
    iconColor: string;
    iconBgColor: string;
    actions: AdminQuickActionItem[];
    superAdminOnly?: boolean;
}

export const ADMIN_QUICK_ACTIONS: Record<string, AdminQuickActionConfig> = {
    teamAnalytics: {
        title: 'Team Analytics',
        description: 'Team performance and insights',
        icon: BarChart3,
        iconColor: 'text-blue-600 dark:text-blue-400',
        iconBgColor: 'bg-blue-100 dark:bg-blue-900/50',
        actions: [
            { href: '/admin/analytics', icon: BarChart3, label: 'Team Performance' },
            { href: '/admin/users/activity', icon: Activity, label: 'Team Activity' },
            { href: '/admin/reports/team', icon: FileText, label: 'Team Reports' }
        ]
    },
    userContent: {
        title: 'User & Content',
        description: 'Manage users and content',
        icon: Users,
        iconColor: 'text-purple-600 dark:text-purple-400',
        iconBgColor: 'bg-purple-100 dark:bg-purple-900/50',
        actions: [
            { href: '/admin/users', icon: Users, label: 'User Management' },
            { href: '/admin/content/moderation', icon: Flag, label: 'Content Moderation' }
        ]
    },
    supportCommunication: {
        title: 'Support & Communication',
        description: 'Platform-wide support management',
        icon: MessageSquare,
        iconColor: 'text-orange-600 dark:text-orange-400',
        iconBgColor: 'bg-orange-100 dark:bg-orange-900/50',
        actions: [
            { href: '/admin/support', icon: MessageSquare, label: 'Support Tickets' },
            { href: '/admin/feedback', icon: Bell, label: 'User Feedback' },
            { href: '/admin/announcements', icon: Megaphone, label: 'Platform Announcements' }
        ],
        superAdminOnly: true
    },
    systemConfig: {
        title: 'System Configuration',
        description: 'Platform settings and features',
        icon: Settings,
        iconColor: 'text-green-600 dark:text-green-400',
        iconBgColor: 'bg-green-100 dark:bg-green-900/50',
        actions: [
            { href: '/admin/config/features', icon: Zap, label: 'Feature Flags' },
            { href: '/admin/config/settings', icon: Settings, label: 'Platform Settings' },
            { href: '/admin/system/maintenance', icon: Wrench, label: 'Maintenance Mode' }
        ],
        superAdminOnly: true
    },
    systemHealth: {
        title: 'System Health',
        description: 'Monitor system performance',
        icon: Activity,
        iconColor: 'text-red-600 dark:text-red-400',
        iconBgColor: 'bg-red-100 dark:bg-red-900/50',
        actions: [
            { href: '/admin/system/health', icon: Activity, label: 'Health Dashboard' },
            { href: '/admin/audit', icon: Shield, label: 'Audit Logs' }
        ],
        superAdminOnly: true
    },
    superAdmin: {
        title: 'SuperAdmin',
        description: 'Advanced management tools',
        icon: Shield,
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        iconBgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
        actions: [
            { href: '/admin/billing', icon: DollarSign, label: 'Billing Management' },
            { href: '/admin/integrations', icon: Key, label: 'API & Integrations' },
            { href: '/admin/audit', icon: FileText, label: 'Audit Logs' }
        ],
        superAdminOnly: true
    }
};

export const ADMIN_METRICS_CONFIG = {
    totalUsers: {
        title: 'Total Users',
        icon: Users,
        iconColor: 'text-blue-600 dark:text-blue-400',
        iconBgColor: 'bg-blue-100 dark:bg-blue-900/50',
        trendColor: 'text-green-600'
    },
    newSignups: {
        title: 'New Signups (24h)',
        icon: Users,
        iconColor: 'text-green-600 dark:text-green-400',
        iconBgColor: 'bg-green-100 dark:bg-green-900/50'
    },
    openTickets: {
        title: 'Open Tickets',
        icon: MessageSquare,
        iconColor: 'text-orange-600 dark:text-orange-400',
        iconBgColor: 'bg-orange-100 dark:bg-orange-900/50',
        superAdminOnly: true
    },
    systemHealth: {
        title: 'System Health',
        icon: Activity,
        iconColor: 'text-red-600 dark:text-red-400',
        iconBgColor: 'bg-red-100 dark:bg-red-900/50',
        superAdminOnly: true
    }
} as const;