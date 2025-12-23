/**
 * Mock Data for Market Insights
 * 
 * Sample data for development and testing
 */

import type { MarketTrend, LifeEvent } from '@/lib/types/market-insights';

export const MOCK_TRENDS: MarketTrend[] = [
    {
        id: '1',
        title: 'Home Prices Rising',
        description: 'Median home prices have increased due to low inventory and high demand from millennials entering the market.',
        trend: 'up',
        percentage: 8.5,
        timeframe: 'Last 3 months',
        category: 'pricing',
        location: 'Seattle, WA',
        confidence: 92
    },
    {
        id: '2',
        title: 'Inventory Shortage',
        description: 'Available homes for sale have decreased significantly, creating a competitive buyer market.',
        trend: 'down',
        percentage: -15.2,
        timeframe: 'Last 6 months',
        category: 'inventory',
        location: 'Seattle, WA',
        confidence: 88
    },
    {
        id: '3',
        title: 'First-Time Buyer Activity',
        description: 'Increased activity from first-time homebuyers taking advantage of assistance programs.',
        trend: 'up',
        percentage: 12.3,
        timeframe: 'Last month',
        category: 'demand',
        location: 'Seattle, WA',
        confidence: 85
    }
];

export const MOCK_LIFE_EVENTS: LifeEvent[] = [
    {
        id: '1',
        type: 'marriage',
        location: 'King County, WA',
        predictedCount: 1250,
        timeframe: 'Next 6 months',
        confidence: 78,
        marketImpact: 'high',
        description: 'Newlyweds typically purchase their first home within 2 years of marriage'
    },
    {
        id: '2',
        type: 'job_change',
        location: 'Seattle Metro',
        predictedCount: 3400,
        timeframe: 'Next 3 months',
        confidence: 82,
        marketImpact: 'medium',
        description: 'Job relocations often trigger home purchases in new areas'
    },
    {
        id: '3',
        type: 'retirement',
        location: 'Eastside',
        predictedCount: 890,
        timeframe: 'Next 12 months',
        confidence: 75,
        marketImpact: 'medium',
        description: 'Retirees often downsize or relocate to retirement-friendly communities'
    }
];

export const LOCATION_OPTIONS = [
    { value: 'Seattle, WA', label: 'Seattle, WA' },
    { value: 'Bellevue, WA', label: 'Bellevue, WA' },
    { value: 'Tacoma, WA', label: 'Tacoma, WA' },
    { value: 'King County, WA', label: 'King County, WA' },
    { value: 'Pierce County, WA', label: 'Pierce County, WA' },
];

export const TIMEFRAME_OPTIONS = [
    { value: '1month', label: 'Last Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
];