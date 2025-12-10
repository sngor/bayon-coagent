import {
    Users,
    UserPlus,
    MessageSquare,
    Activity,
    BarChart3,
    Flag,
    Bell,
    Megaphone,
    Settings,
    Zap,
    Wrench,
    Shield,
    DollarSign,
    Key,
    FileText,
    TrendingUp,
    Clock,
    ArrowRight,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';
import { AdminDashboardStats } from '@/types/admin';

export interface MetricConfig {
    key: keyof AdminDashboardStats;
    title: string;
    icon: typeof Users;
    iconColor: string;
    iconBgColor: string;
    getValue: (stats: AdminDashboardStats) => string | number;
    getSubtitle?: (stats: AdminDashboardStats) => string;
    getSubtitleIcon?: (stats: AdminDashboardStats) => typeof Users;
    getSubtitleColor?: (stats: AdminDashboardStats) => string;
    getActionLabel?: (stats: AdminDashboardStats) => string;
    getActionHref?: (stats: AdminDashboardStats) => string;
    getActionColor?: (stats: AdminDashboardStats) => string;
    requiresRole?: 'superadmin';
}

export const METRIC_CONFIGS: MetricConfig[] = [
    {
        key: 'totalUsers',
        title: 'Total Users',
        icon: Users,
        iconColor: 'text-blue-600 dark:text-blue-400',
        iconBgColor: 'bg-blue-100 dark:bg-blue-900/50',
        getValue: (stats) => stats.totalUsers,
        getSubtitle: (stats) => `${stats.activeUsers || 0} active`,
        getSubtitleIcon: () => TrendingUp,
        getSubtitleColor: () => 'text-green-600'
    },
    {
        key: 'newSignups24h',
        title: 'New Signups (24h)',
        icon: UserPlus,
        iconColor: 'text-green-600 dark:text-green-400',
        iconBgColor: 'bg-green-100 dark:bg-green-900/50',
        getValue: (stats) => stats.newSignups24h || 0,
        getSubtitle: () => 'Last 24 hours',
        getSubtitleIcon: () => Clock,
        getSubtitleColor: () => 'text-muted-foreground'
    },
    {
        key: 'openTickets',
        title: 'Open Tickets',
        icon: MessageSquare,
        iconColor: 'text-orange-600 dark:text-orange-400',
        iconBgColor: 'bg-orange-100 dark:bg-orange-900/50',
        getValue: (stats) => stats.openTickets || 0,
        getActionLabel: () => 'View tickets',
        getActionHref: () => '/admin/support',
        getActionColor: () => 'text-orange-600',
        requiresRole: 'superadmin'
    },
    {
        key: 'systemStatus',
        title: 'System Health',
        icon: Activity,
        iconColor: 'text-green-600 dark:text-green-400',
        iconBgColor: 'bg-green-100 dark:bg-green-900/50',
        getValue: (stats) => stats.systemStatus === 'Healthy' ? '100%' : 'Degraded',
        getSubtitle: (stats) => stats.systemStatus === 'Healthy' ? 'All systems operational' : 'View details',
        getSubtitleIcon: (stats) => stats.systemStatus === 'Healthy' ? CheckCircle : AlertTriangle,
        getSubtitleColor: (stats) => stats.systemStatus === 'Healthy' ? 'text-green-600' : 'text-red-600',
        getActionHref: (stats) => stats.systemStatus !== 'Healthy' ? '/admin/system/health' : undefined,
        requiresRole: 'superadmin'
    }
];

export interface ActionCardConfig {
    title: string;
    description: string;
    icon: typeof Users;
    iconColor: string;
    iconBgColor: string;
    actions: Array<{
        label: string;
        href: string;
        icon: typeof Users;
    }>;
    requiresRole?: 'superadmin';
}

export const ACTION_CARD_CONFIGS: ActionCardConfig[] = [
    {
        title: 'Team Analytics',
        description: 'Team performance and insights',
        icon: BarChart3,
        iconColor: 'text-blue-600 dark:text-blue-400',
        iconBgColor: 'bg-blue-100 dark:bg-blue-900/50',
        actions: [
            { label: 'Team Performance', href: '/admin/analytics', icon: BarChart3 },
            { label: 'Team Activity', href: '/admin/users/activity', icon: Activity },
            { label: 'Team Reports', href: '/admin/reports/team', icon: FileText }
        ]
    },
    {
        title: 'Team Management',
        description: 'Manage team members and content',
        icon: Users,
        iconColor: 'text-purple-600 dark:text-purple-400',
        iconBgColor: 'bg-purple-100 dark:bg-purple-900/50',
        actions: [
            { label: 'Team Members', href: '/admin/users', icon: Users },
            { label: 'Content Review', href: '/admin/content/moderation', icon: Flag },
            { label: 'Invite Members', href: '/admin/users/invitations', icon: UserPlus }
        ]
    },
    {
        title: 'Support & Communication',
        description: 'Platform-wide support management',
        icon: MessageSquare,
        iconColor: 'text-orange-600 dark:text-orange-400',
        iconBgColor: 'bg-orange-100 dark:bg-orange-900/50',
        actions: [
            { label: 'Support Tickets', href: '/admin/support', icon: MessageSquare },
            { label: 'User Feedback', href: '/admin/feedback', icon: Bell },
            { label: 'Platform Announcements', href: '/admin/announcements', icon: Megaphone }
        ],
        requiresRole: 'superadmin'
    },
    {
        title: 'Platform Analytics',
        description: 'Platform-wide insights and metrics',
        icon: BarChart3,
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        iconBgColor: 'bg-indigo-100 dark:bg-indigo-900/50',
        actions: [
            { label: 'Platform Metrics', href: '/admin/analytics/platform', icon: BarChart3 },
            { label: 'User Engagement', href: '/admin/analytics/engagement', icon: Activity },
            { label: 'Platform Reports', href: '/admin/reports/platform', icon: FileText }
        ],
        requiresRole: 'superadmin'
    },
    {
        title: 'System Configuration',
        description: 'Platform settings and features',
        icon: Settings,
        iconColor: 'text-green-600 dark:text-green-400',
        iconBgColor: 'bg-green-100 dark:bg-green-900/50',
        actions: [
            { label: 'Feature Flags', href: '/admin/config/features', icon: Zap },
            { label: 'Platform Settings', href: '/admin/config/settings', icon: Settings },
            { label: 'Maintenance Mode', href: '/admin/system/maintenance', icon: Wrench }
        ],
        requiresRole: 'superadmin'
    },
    {
        title: 'System Health',
        description: 'Monitor system performance',
        icon: Activity,
        iconColor: 'text-red-600 dark:text-red-400',
        iconBgColor: 'bg-red-100 dark:bg-red-900/50',
        actions: [
            { label: 'Health Dashboard', href: '/admin/system/health', icon: Activity },
            { label: 'Audit Logs', href: '/admin/audit', icon: Shield }
        ],
        requiresRole: 'superadmin'
    },
    {
        title: 'SuperAdmin',
        description: 'Advanced management tools',
        icon: Shield,
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        iconBgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
        actions: [
            { label: 'Billing Management', href: '/admin/billing', icon: DollarSign },
            { label: 'API & Integrations', href: '/admin/integrations', icon: Key },
            { label: 'Audit Logs', href: '/admin/audit', icon: FileText }
        ],
        requiresRole: 'superadmin'
    }
];