'use client';

import { StandardEmptyState } from '@/components/standard';
import { Image } from 'lucide-react';

export default function LibraryMediaPage() {
    return (
        <div className="space-y-6">
            <StandardEmptyState
                icon={Image}
                title="Media Library Coming Soon"
                description="Manage your images, videos, and documents all in one place. This feature is currently in development."
            />
        </div>
    );
}
