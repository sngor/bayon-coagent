/**
 * Library Hub - Listings Page
 * 
 * Displays imported MLS listings with publishing capabilities.
 * Allows users to select listings and publish to social media platforms.
 * 
 * Requirements:
 * - 2.2: Display imported listings
 * - 4.4: Display performance metrics
 * - 5.2: Show MLS sync status
 * - 7.1: Listing selection interface for publishing
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { ListingsContent } from './listings-content';

export const metadata: Metadata = {
    title: 'Listings | Library | Bayon Coagent',
    description: 'Manage your MLS listings and social media posts',
};

export default function ListingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Listings</h1>
                <p className="text-muted-foreground mt-2">
                    View and manage your imported MLS listings. Publish to social media platforms with one click.
                </p>
            </div>

            <Suspense fallback={<ListingsLoadingSkeleton />}>
                <ListingsContent />
            </Suspense>
        </div>
    );
}

function ListingsLoadingSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="h-10 w-64 bg-gray-200 animate-pulse rounded" />
                <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-lg" />
                ))}
            </div>
        </div>
    );
}
