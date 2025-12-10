/**
 * Management Areas Configuration
 * Centralized configuration for admin dashboard management cards
 */

import { ManagementArea } from '@/lib/types/admin';
import {
    Users,
    BarChart3,
    Settings,
    MessageSquare,
    Zap
} from 'lucide-react';

export function getManagementAreas(stats: any): ManagementArea[] {
    return [
        {
            id: 'users',
            title: 'User Management',
            description: 'Accounts & analytics',
            icon: 'Users',
            iconBgColor: 'bg-blue-100 dark:bg-blue-900/50',
            hoverBgColor: 'group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50',
            metrics: [
                {
                    label: 'Total',
                    value: stats.totalUsers,
                    bgColor: 'bg-blue-50 dark:bg-blue-950/50'
                },
                {
                    label: 'Active',
                    value: stats.totalUsers,
                    bgColor: 'bg-green-50 dark:bg-green-950/50'
                }
            ],
            actions: [
                {
                    label: 'Manage Users',
                    href: '/super-admin/users'
                }
            ]
        },
        {
            id: 'teams',
            title: 'Team Management',
            description: 'Groups & assignments',
            icon: 'Users',
            iconBgColor: 'bg-orange-100 dark:bg-orange-900/50',
            hoverBgColor: 'group-hover:bg-orange-50 dark:group-hover:bg-orange-950/50',
            metrics: [
                {
                    label: 'Total',
                    value: stats.totalTeams || 0,
                    bgColor: 'bg-orange-50 dark:bg-orange-950/50'
                },
                {
                    label: 'Members',
                    value: stats.totalUsers,
                    bgColor: 'bg-amber-50 dark:bg-amber-950/50'
                }
            ],
            actions: [
                {
                    label: 'Manage Teams',
                    href: '/super-admin/teams'
                }
            ]
        },
        {
            id: 'analytics',
            title: 'Analytics & Insights',
            description: 'Metrics & costs',
            icon: 'BarChart3',
            iconBgColor: 'bg-purple-100 dark:bg-purple-900/50',
            hoverBgColor: 'group-hover:bg-purple-50 dark:group-hover:bg-purple-950/50',
            metrics: [
                {
                    label: 'AI Costs',
                    value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalAiCosts || 0),
                    bgColor: 'bg-purple-50 dark:bg-purple-950/50'
                },
                {
                    label: 'Requests',
                    value: stats.totalAiRequests,
                    bgColor: 'bg-indigo-50 dark:bg-indigo-950/50'
                }
            ],
            actions: [
                {
                    label: 'View Analytics',
                    href: '/super-admin/analytics'
                }
            ]
        },
        {
            id: 'features',
            title: 'Feature Control',
            description: 'Flags & rollouts',
            icon: 'Settings',
            iconBgColor: 'bg-green-100 dark:bg-green-900/50',
            hoverBgColor: 'group-hover:bg-green-50 dark:group-hover:bg-green-950/50',
            metrics: [
                {
                    label: 'Active',
                    value: stats.activeFeatures,
                    bgColor: 'bg-green-50 dark:bg-green-950/50'
                },
                {
                    label: 'Beta',
                    value: stats.betaFeatures,
                    bgColor: 'bg-yellow-50 dark:bg-yellow-950/50'
                }
            ],
            actions: [
                {
                    label: 'Manage Features',
                    href: '/super-admin/features'
                }
            ]
        },
        {
            id: 'support',
            title: 'Support & Communication',
            description: 'Tickets & announcements',
            icon: 'MessageSquare',
            iconBgColor: 'bg-red-100 dark:bg-red-900/50',
            hoverBgColor: 'group-hover:bg-red-50 dark:group-hover:bg-red-950/50',
            metrics: [
                {
                    label: 'Tickets',
                    value: stats.pendingFeedback,
                    bgColor: 'bg-red-50 dark:bg-red-950/50'
                },
                {
                    label: 'Announcements',
                    value: 3,
                    bgColor: 'bg-pink-50 dark:bg-pink-950/50'
                }
            ],
            actions: [
                {
                    label: 'Support Tickets',
                    href: '/super-admin/support'
                },
                {
                    label: 'Announcements',
                    href: '/super-admin/announcements'
                }
            ]
        },
        {
            id: 'system',
            title: 'System & Integrations',
            description: 'APIs & system health',
            icon: 'Zap',
            iconBgColor: 'bg-indigo-100 dark:bg-indigo-900/50',
            hoverBgColor: 'group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50',
            metrics: [
                {
                    label: 'APIs',
                    value: 6,
                    bgColor: 'bg-indigo-50 dark:bg-indigo-950/50'
                },
                {
                    label: 'Uptime',
                    value: '100%',
                    bgColor: 'bg-cyan-50 dark:bg-cyan-950/50'
                }
            ],
            actions: [
                {
                    label: 'API Integrations',
                    href: '/super-admin/integrations'
                },
                {
                    label: 'System Health',
                    href: '/super-admin/health'
                }
            ]
        }
    ];
}