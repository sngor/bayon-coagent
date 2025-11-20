'use client';

import { HubLayout } from '@/components/hub';
import { Wand2, FileText, Home } from 'lucide-react';

const tabs = [
    { id: 'write', label: 'Write', href: '/studio/write', icon: FileText },
    { id: 'describe', label: 'Listing', href: '/studio/describe', icon: Home },
    { id: 'reimagine', label: 'Reimagine', href: '/studio/reimagine', icon: Wand2 },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
    return (
        <HubLayout
            title="Studio"
            description="Create and edit all your marketing content"
            icon={Wand2}
            tabs={tabs}
            tabsVariant="pills"
        >
            {children}
        </HubLayout>
    );
}
