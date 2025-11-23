'use client';

import { HubLayout } from '@/components/hub/hub-layout';
import { LayoutDashboard } from 'lucide-react';
import { useUser } from '@/aws/auth';
import { useMemo, useEffect, useState } from 'react';
import { getDashboardData } from './actions';
import type { Profile } from '@/lib/types';

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
    const [agentProfile, setAgentProfile] = useState<Profile | null>(null);

    // Fetch agent profile for the greeting
    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            const result = await getDashboardData(user.id);
            if (result.success && result.data?.agentProfile) {
                setAgentProfile(result.data.agentProfile);
            }
        };

        fetchProfile();
    }, [user]);

    const title = useMemo(() => {
        const greeting = getGreeting();

        if (!agentProfile?.name) return greeting;

        const firstName = agentProfile.name.split(' ')[0];
        return `${greeting}, ${firstName}!`;
    }, [agentProfile?.name]);

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
