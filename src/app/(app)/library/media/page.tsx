'use client';

import { StandardEmptyState } from '@/components/standard';
import { Image } from 'lucide-react';

export default function LibraryMediaPage() {
    return (
        <div className="space-y-6">
            <StandardEmptyState
                icon={<Image className="h-12 w-12 text-primary" />}
                title="Media Library Coming Soon"
                description="Manage your images, videos, and documents all in one place. This feature is currently in development."
                variant="card"
            />
        </div>
    );
}
