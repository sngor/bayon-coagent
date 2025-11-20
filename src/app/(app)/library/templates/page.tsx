'use client';

import { StandardEmptyState } from '@/components/standard';
import { FileStack } from 'lucide-react';

export default function LibraryTemplatesPage() {
    return (
        <div className="space-y-6">
            <StandardEmptyState
                icon={<FileStack className="h-12 w-12 text-primary" />}
                title="Templates Coming Soon"
                description="Save and reuse your best-performing content templates. This feature is currently in development."
                variant="card"
            />
        </div>
    );
}
