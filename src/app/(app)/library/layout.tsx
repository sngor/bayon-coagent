'use client';

import { HubLayout } from '@/components/hub/hub-layout';
import { Library, FileText, FileSearch, Image, FileStack, Home } from 'lucide-react';

const tabs = [
    { id: 'content', label: 'Content', href: '/library/content', icon: FileText },
    { id: 'reports', label: 'Reports', href: '/library/reports', icon: FileSearch },
    { id: 'listings', label: 'Listings', href: '/library/listings', icon: Home },
    { id: 'media', label: 'Media', href: '/library/media', icon: Image },
    { id: 'templates', label: 'Templates', href: '/library/templates', icon: FileStack },
];

export default function LibraryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <HubLayout
            title="Library"
            description="Everything you've created, ready when you need it"
            icon={Library}
            tabs={tabs}
            tabsVariant="pills"
        >
            {children}
        </HubLayout>
    );
}
