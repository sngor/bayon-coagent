'use client';

import { HubLayoutWithFavorites } from '@/components/hub/hub-layout-with-favorites';
import { FeatureGuard } from '@/components/feature-guard';
import { Library, FileText, BarChart3, Image, Bookmark, Home, Calendar } from 'lucide-react';

const libraryTabs = [
    { id: 'content', label: 'Content', href: '/library/content', icon: FileText },
    { id: 'reports', label: 'Reports', href: '/library/reports', icon: BarChart3 },
    { id: 'listings', label: 'Listings', href: '/library/listings', icon: Home },
    { id: 'media', label: 'Media', href: '/library/media', icon: Image },
    { id: 'templates', label: 'Templates', href: '/library/templates', icon: Bookmark },
    { id: 'calendar', label: 'Calendar', href: '/library/calendar', icon: Calendar },
];

export default function LibraryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <FeatureGuard featureId="library">
            <HubLayoutWithFavorites
                title="Content & Knowledge Library"
                description="Everything you've created, ready when you need it - content, reports, media, and templates"
                icon={Library}
                tabs={libraryTabs}
                tabsVariant="pills"
            >
                {children}
            </HubLayoutWithFavorites>
        </FeatureGuard>
    );
}
