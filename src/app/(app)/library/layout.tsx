'use client';

import { HubLayoutWithFavorites } from '@/components/hub/hub-layout-with-favorites';
import { FeatureGuard } from '@/components/feature-guard';
import { Library, FileText, BarChart3, Image, Bookmark, Home, Calendar } from 'lucide-react';

const libraryTabs = [
    { id: 'content', label: 'Content', href: '/library/content', icon: FileText },
    { id: 'listings', label: 'My Listings', href: '/library/listings', icon: Home },
    { id: 'media', label: 'Media', href: '/library/media', icon: Image },
    { id: 'templates', label: 'Templates', href: '/library/templates', icon: Bookmark },
];

export default function LibraryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <FeatureGuard featureId="library">
            <HubLayoutWithFavorites
                title="My Library"
                description="Everything you've created, ready when you need it - content, listings, media, and templates"
                icon={Library}
                tabs={libraryTabs}
                tabsVariant="pills"
            >
                {children}
            </HubLayoutWithFavorites>
        </FeatureGuard>
    );
}
