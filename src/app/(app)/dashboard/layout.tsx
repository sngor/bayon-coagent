'use client';

import { HubLayout } from '@/components/hub/hub-layout';
import { LayoutDashboard } from 'lucide-react';
import { useUser } from '@/aws/auth';
import { useMemo } from 'react';

function getGreeting(): string {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
        return 'Good morning';
    } else if (hour >= 12 && hour < 18) {
        return 'Good afternoon';
    } else {
        return 'Welcome back';
    }
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useUser();

    const title = useMemo(() => {
        if (!user?.name) return 'Dashboard';

        const firstName = user.name.split(' ')[0];
        const greeting = getGreeting();

        return `${greeting}, ${firstName}`;
    }, [user?.name]);

    return (
        <HubLayout
            title={title}
            description="Your real estate success at a glance"
            icon={LayoutDashboard}
            tabs={[]}
        >
            {children}
        </HubLayout>
    );
}
