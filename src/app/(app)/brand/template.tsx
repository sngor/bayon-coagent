'use client';

import { HubLayout } from '@/components/hub';
import { Target, User, ShieldCheck, Lightbulb, Users } from 'lucide-react';

const tabs = [
    { id: 'profile', label: 'Profile', href: '/brand/profile', icon: User },
    { id: 'audit', label: 'Audit', href: '/brand/audit', icon: ShieldCheck },
    { id: 'competitors', label: 'Competitors', href: '/brand/competitors', icon: Users },
    { id: 'strategy', label: 'Strategy', href: '/brand/strategy', icon: Lightbulb },
];

export default function BrandTemplate({ children }: { children: React.ReactNode }) {
    return (
        <HubLayout
            title="Brand"
            description="Own your market position and outshine the competition"
            icon={Target}
            tabs={tabs}
            tabsVariant="pills"
        >
            {children}
        </HubLayout>
    );
}