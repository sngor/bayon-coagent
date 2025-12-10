'use client';

import { TrendingUp, BarChart3, PieChart, LineChart, Activity, Target } from 'lucide-react';
import { ComingSoonGrid, StepList } from '@/components/ui/reusable';


export default function MarketAnalyticsPage() {

    const analyticsFeatures = [
        {
            icon: TrendingUp,
            title: 'Price Trends',
            description: 'Track property price movements and market trends over time',
            timeline: 'Q2 2025',
            priority: 'high' as const,
        },
        {
            icon: BarChart3,
            title: 'Sales Volume',
            description: 'Analyze sales volume patterns and seasonal variations',
            timeline: 'Q2 2025',
            priority: 'high' as const,
        },
        {
            icon: PieChart,
            title: 'Market Share',
            description: 'View market share distribution by property type and area',
            timeline: 'Q3 2025',
            priority: 'medium' as const,
        },
        {
            icon: LineChart,
            title: 'Inventory Levels',
            description: 'Monitor housing inventory and days on market statistics',
            timeline: 'Q2 2025',
            priority: 'high' as const,
        },
        {
            icon: Activity,
            title: 'Market Activity',
            description: 'Real-time market activity and transaction monitoring',
            timeline: 'Q3 2025',
            priority: 'medium' as const,
        },
        {
            icon: Target,
            title: 'Performance Metrics',
            description: 'Track your market performance against key benchmarks',
            timeline: 'Q4 2025',
            priority: 'low' as const,
        },
    ];

    const analyticsSteps = [
        {
            title: 'Data Collection',
            description: 'Automated collection of market data from multiple sources',
            status: 'active' as const,
        },
        {
            title: 'Analysis & Processing',
            description: 'AI-powered analysis to identify trends and patterns',
            status: 'pending' as const,
        },
        {
            title: 'Actionable Insights',
            description: 'Generate reports and recommendations for strategic decisions',
            status: 'pending' as const,
        },
    ];

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Market Analytics</h1>
                <p className="text-muted-foreground">Advanced market analysis and performance tracking</p>
            </div>

            <ComingSoonGrid cards={analyticsFeatures} />

            <StepList
                title="Market Analytics Dashboard"
                description="Comprehensive analytics tools for market intelligence"
                steps={analyticsSteps}
                variant="card"
            />
        </div>
    );
}