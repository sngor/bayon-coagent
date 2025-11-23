'use client';

import React from 'react';
import { MarketStatsDemo } from './market-stats-demo';

/**
 * Simple test page for Market Stats functionality
 * This can be used to verify the implementation works correctly
 */
export function MarketStatsTest() {
    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold">Market Stats Test</h1>
                <p className="text-muted-foreground mt-2">
                    Testing the market stats lookup functionality with caching and offline support.
                </p>
            </div>

            <MarketStatsDemo />
        </div>
    );
}

export default MarketStatsTest;