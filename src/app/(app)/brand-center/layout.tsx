'use client';

import { HubLayout } from '@/components/hub';
import { Target, User, ShieldCheck, Lightbulb } from 'lucide-react';

const tabs = [
    { id: 'profile', label: 'Profile', href: '/brand-center/profile', icon: User },
    { id: 'audit', label: 'Audit', href: '/brand-center/audit', icon: ShieldCheck },
    { id: 'strategy', label: 'Strategy', href: '/brand-center/strategy', icon: Lightbulb },
];

export default function BrandCenterLayout({ children }: { children: React.ReactNode }) {
    return (
        <HubLayout
            title="Brand Center"
            description="Your brand identity and marketing strategy"
            icon={Target}
            tabs={tabs}
        >
            {children}
        </HubLayout>
    );
}
