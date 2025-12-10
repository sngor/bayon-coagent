import {
    Users,
    MessageSquare,
    BarChart3,
    Settings,
    Activity,
    Shield,
    FileText,
    Flag,
    Bell,
    Megaphone,
    DollarSign,
    Key,
    UserPlus,
    TrendingUp,
    AlertTriangle,
    Wrench,
    Zap,
    Eye,
    Target,
} from 'lucide-react';

export const ADMIN_CONFIG = {
    // Auto-refresh interval in milliseconds
    REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes

    // Maximum activity items to display
    MAX_ACTIVITY_ITEMS: 8,

    // Activity skeleton count
    ACTIVITY_SKELETON_COUNT: 5,
} as const;

export const METRIC_CARDS = {
    teamMembers: {
        title: 'Team Members',
        icon: Users,
        iconColor: 'text-blue-600 dark:text-blue-400',
        iconBgColor: 'bg-blue-100 dark:bg-blue-900/50',
        progressColor: 'bg-blue-600',
    },
    newMembers: {
        title: 'New Members (24h)',
        icon: UserPlus,
        iconColor: 'text-green-600 dark:text-green-400',
        iconBgColor: 'bg-green-100 dark:bg-green-900/50',
    },
    openTickets: {
        title: 'Open Tickets',
        icon: MessageSquare,
        iconColor: 'text-orange-600 dark:text-orange-400',
        iconBgColor: 'bg-orange-100 dark:bg-orange-900/50',
    },
    systemHealth: {
        title: 'System Health',
        icon: Activity,
        iconColor: 'text-green-600 dark:text-green-400',
        iconBgColor: 'bg-green-100 dark:bg-green-900/50',
        iconColorDegraded: 'text-red-600 dark:text-red-400',
        iconBgColorDegraded: 'bg-red-100 dark:bg-red-900/50',
    },
} as const;

export const ACTION_CARDS = {
    teamAnalytics: {
        title: 'Team Analytics',
        description: 'Performance insights & reports',
        icon: BarChart3,
        iconColor: 'text-blue-600 dark:text-blue-400',
        iconBgColor: 'bg-blue-100 dark:bg-blue-900/50',
        hoverColor: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
        badge: '3 Tools',
        actions: [
            {
                href: '/admin/analytics',
                icon: BarChart3,
                title: 'Team Performance',
                description: 'View metrics & KPIs',
            },
            {
                href: '/admin/users/activity',
                icon: Activity,
                title: 'Team Activity',
                description: 'Recent actions & logs',
            },
            {
                href: '/admin/reports/team',
                icon: FileText,
                title: 'Team Reports',
                description: 'Generate & export',
            },
        ],
    },
    teamManagement: {
        title: 'Team Management',
        description: 'Manage members & content',
        icon: Users,
        iconColor: 'text-purple-600 dark:text-purple-400',
        iconBgColor: 'bg-purple-100 dark:bg-purple-900/50',
        hoverColor: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
        badge: '3 Tools',
        actions: [
            {
                href: '/admin/users',
                icon: Users,
                title: 'Team Members',
                description: 'Manage user accounts',
            },
            {
                href: '/admin/content/moderation',
                icon: Flag,
                title: 'Content Review',
                description: 'Moderate & approve',
            },
            {
                href: '/admin/users/invitations',
                icon: UserPlus,
                title: 'Invite Members',
                description: 'Send invitations',
            },
        ],
    },
    supportHub: {
        title: 'Support Hub',
        description: 'Platform-wide support',
        icon: MessageSquare,
        iconColor: 'text-orange-600 dark:text-orange-400',
        iconBgColor: 'bg-orange-100 dark:bg-orange-900/50',
        hoverColor: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
        badge: 'Super Admin',
        badgeColor: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
        actions: [
            {
                href: '/admin/support',
                icon: MessageSquare,
                title: 'Support Tickets',
                description: 'Manage user issues',
            },
            {
                href: '/admin/feedback',
                icon: Bell,
                title: 'User Feedback',
                description: 'Review suggestions',
            },
            {
                href: '/admin/announcements',
                icon: Megaphone,
                title: 'Announcements',
                description: 'Platform updates',
            },
        ],
    },
    platformAnalytics: {
        title: 'Platform Analytics',
        description: 'Platform-wide insights',
        icon: Target,
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        iconBgColor: 'bg-indigo-100 dark:bg-indigo-900/50',
        hoverColor: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
        badge: 'Super Admin',
        badgeColor: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300',
        actions: [
            {
                href: '/admin/analytics/platform',
                icon: BarChart3,
                title: 'Platform Metrics',
                description: 'Global performance',
            },
            {
                href: '/admin/analytics/engagement',
                icon: Activity,
                title: 'User Engagement',
                description: 'Usage patterns',
            },
            {
                href: '/admin/reports/platform',
                icon: FileText,
                title: 'Platform Reports',
                description: 'Comprehensive data',
            },
        ],
    },
    systemConfig: {
        title: 'System Config',
        description: 'Platform settings & features',
        icon: Settings,
        iconColor: 'text-green-600 dark:text-green-400',
        iconBgColor: 'bg-green-100 dark:bg-green-900/50',
        hoverColor: 'hover:bg-green-50 dark:hover:bg-green-900/20',
        badge: 'Super Admin',
        badgeColor: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
        actions: [
            {
                href: '/admin/config/features',
                icon: Zap,
                title: 'Feature Flags',
                description: 'Control rollouts',
            },
            {
                href: '/admin/config/settings',
                icon: Settings,
                title: 'Platform Settings',
                description: 'Global configuration',
            },
            {
                href: '/admin/system/maintenance',
                icon: Wrench,
                title: 'Maintenance Mode',
                description: 'System maintenance',
            },
        ],
    },
    advancedManagement: {
        title: 'Advanced Management',
        description: 'Platform-wide management tools',
        icon: Shield,
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        iconBgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
        hoverColor: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
        badge: 'Super Admin',
        badgeColor: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
        actions: [
            {
                href: '/admin/billing',
                icon: DollarSign,
                title: 'Billing Management',
                description: 'Revenue & subscriptions',
            },
            {
                href: '/admin/integrations',
                icon: Key,
                title: 'API & Integrations',
                description: 'External services',
            },
            {
                href: '/admin/audit',
                icon: FileText,
                title: 'Audit Logs',
                description: 'Security & compliance',
            },
        ],
    },
} as const;