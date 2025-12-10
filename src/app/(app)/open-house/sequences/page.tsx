/**
 * Follow-up Sequences Page
 * 
 * Manages automated follow-up sequences for open house visitors.
 * Allows creating, editing, and monitoring sequence performance.
 * 
 * Validates Requirements: 15.1, 15.6
 */

import { Suspense } from 'react';
import { SequencesContent } from './sequences-content';

export const metadata = {
    title: 'Follow-up Sequences | Open House',
    description: 'Manage automated follow-up sequences for open house visitors',
};

export default function SequencesPage() {
    return (
        <div className="space-y-6">
            <Suspense fallback={<SequencesLoadingSkeleton />}>
                <SequencesContent />
            </Suspense>
        </div>
    );
}

function SequencesLoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <div className="h-10 w-40 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                ))}
            </div>
        </div>
    );
}
