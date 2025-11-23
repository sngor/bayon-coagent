'use client';

import { usePathname } from 'next/navigation';

import {
    LayoutDashboard,
    Users,
    MessageSquare,
    BarChart3,
    Activity,
    Settings,
    Shield
} from 'lucide-react';

const pageHeaders = {
    '/admin': {
        title: 'Admin Dashboard',
        description: 'Manage feedback, users, and system settings',
        icon: LayoutDashboard
    },
    '/admin/users': {
        title: 'User Management',
        description: 'View and manage all user accounts',
        icon: Users
    },
    '/admin/feedback': {
        title: 'Feedback Management',
        description: 'Review and respond to user feedback',
        icon: MessageSquare
    },
    '/admin/analytics': {
        title: 'System Analytics',
        description: 'Usage metrics, costs, and performance monitoring',
        icon: BarChart3
    },
    '/admin/health': {
        title: 'System Health',
        description: 'Monitor AWS services and system status',
        icon: Activity
    },
    '/admin/features': {
        title: 'Feature Management',
        description: 'Control feature flags and A/B testing',
        icon: Settings
    },
    '/admin/setup': {
        title: 'Admin Setup',
        description: 'Create and manage admin accounts',
        icon: Shield
    }
};

export function AdminPageHeader() {
    const pathname = usePathname();
    const header = pageHeaders[pathname as keyof typeof pageHeaders] || pageHeaders['/admin'];
    const IconComponent = header.icon;

    return (
        <div className="flex items-start justify-between border-b pb-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">{header.title}</h1>
                    <p className="text-muted-foreground text-lg mt-1">
                        {header.description}
                    </p>
                </div>
            </div>

        </div>
    );
}