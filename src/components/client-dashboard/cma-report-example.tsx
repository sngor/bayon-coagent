'use client';

import { CMAReport } from './cma-report';

/**
 * CMA Report Example Component
 * 
 * Demonstrates the CMA Report component with sample data
 * This can be used for testing and development purposes
 */
export function CMAReportExample() {
    const sampleData = {
        subjectProperty: {
            address: '123 Main Street, San Francisco, CA 94102',
            beds: 3,
            baths: 2,
            sqft: 1850,
            yearBuilt: 2015,
        },
        comparables: [
            {
                address: '456 Oak Avenue, San Francisco, CA 94102',
                soldPrice: 1250000,
                soldDate: '2024-01-15',
                beds: 3,
                baths: 2,
                sqft: 1800,
                distance: 0.3,
            },
            {
                address: '789 Pine Street, San Francisco, CA 94102',
                soldPrice: 1320000,
                soldDate: '2024-02-20',
                beds: 3,
                baths: 2.5,
                sqft: 1900,
                distance: 0.5,
            },
            {
                address: '321 Elm Drive, San Francisco, CA 94102',
                soldPrice: 1180000,
                soldDate: '2024-03-10',
                beds: 3,
                baths: 2,
                sqft: 1750,
                distance: 0.4,
            },
            {
                address: '654 Maple Court, San Francisco, CA 94102',
                soldPrice: 1290000,
                soldDate: '2024-04-05',
                beds: 3,
                baths: 2,
                sqft: 1825,
                distance: 0.6,
            },
            {
                address: '987 Cedar Lane, San Francisco, CA 94102',
                soldPrice: 1350000,
                soldDate: '2024-05-12',
                beds: 4,
                baths: 2.5,
                sqft: 2000,
                distance: 0.7,
            },
        ],
        marketTrends: {
            medianPrice: 1280000,
            daysOnMarket: 28,
            inventoryLevel: 'low' as const,
        },
        priceRecommendation: {
            low: 1220000,
            mid: 1285000,
            high: 1350000,
        },
        agentNotes: `Based on the current market analysis, this property is well-positioned in a highly desirable neighborhood. The recent comparable sales show strong demand with properties selling quickly.

Key factors supporting the recommended price range:
• Recent renovations and modern finishes
• Excellent location with walkability to amenities
• Low inventory creating competitive market conditions
• Strong buyer demand in this price range

I recommend listing at the mid-range price of $1,285,000 to attract serious buyers while leaving room for negotiation. The property's condition and location should generate multiple offers within the first two weeks.`,
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    CMA Report Example
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    This is a demonstration of the CMA Report component with sample data
                </p>
            </div>

            <CMAReport
                subjectProperty={sampleData.subjectProperty}
                comparables={sampleData.comparables}
                marketTrends={sampleData.marketTrends}
                priceRecommendation={sampleData.priceRecommendation}
                agentNotes={sampleData.agentNotes}
                primaryColor="#3b82f6"
            />
        </div>
    );
}
