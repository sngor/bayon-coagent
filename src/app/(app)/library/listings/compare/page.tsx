'use client';

import { ListingComparison } from '@/components/listing-comparison';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ListingComparisonPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/library/listings">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">Compare Listings</h1>
                    <p className="text-muted-foreground mt-2">
                        Analyze performance metrics side-by-side to identify trends and top performers.
                    </p>
                </div>
            </div>

            <ListingComparison />
        </div>
    );
}
