'use client';

import { PageHeader } from '@/components/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import {
    Star,
    TrendingUp,
    Users,
    DollarSign,
    Home,
    Calendar,
    Award,
    MessageSquare,
} from 'lucide-react';

export default function MetricCardDemoPage() {
    // Sample data for demonstration
    const sampleData = {
        rating: {
            value: 4.8,
            trendData: [4.2, 4.3, 4.5, 4.6, 4.7, 4.8, 4.8],
            change: 14.3,
        },
        reviews: {
            value: 127,
            trendData: [95, 102, 108, 115, 120, 124, 127],
            change: 33.7,
        },
        clients: {
            value: 45,
            trendData: [32, 35, 38, 40, 42, 44, 45],
            change: 40.6,
        },
        revenue: {
            value: 285000,
            trendData: [180000, 200000, 220000, 245000, 260000, 275000, 285000],
            change: 58.3,
        },
        listings: {
            value: 12,
            trendData: [8, 9, 10, 10, 11, 12, 12],
            change: 50.0,
        },
        appointments: {
            value: 28,
            trendData: [18, 20, 22, 24, 26, 27, 28],
            change: 55.6,
        },
        satisfaction: {
            value: 96,
            trendData: [88, 90, 92, 93, 94, 95, 96],
            change: 9.1,
        },
        engagement: {
            value: 342,
            trendData: [220, 245, 270, 295, 310, 330, 342],
            change: 55.5,
        },
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Interactive Metric Cards"
                description="Showcase of animated metric cards with sparklines, trend indicators, and hover effects"
            />

            {/* Primary Metrics */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold">Primary Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        value={sampleData.rating.value}
                        label="Average Rating"
                        decimals={1}
                        icon={<Star className="h-6 w-6" />}
                        trendData={sampleData.rating.trendData}
                        changePercent={sampleData.rating.change}
                        showSparkline={true}
                        showTrend={true}
                        variant="primary"
                    />

                    <MetricCard
                        value={sampleData.reviews.value}
                        label="Total Reviews"
                        icon={<Award className="h-6 w-6" />}
                        trendData={sampleData.reviews.trendData}
                        changePercent={sampleData.reviews.change}
                        showSparkline={true}
                        showTrend={true}
                        variant="primary"
                    />

                    <MetricCard
                        value={sampleData.clients.value}
                        label="Active Clients"
                        icon={<Users className="h-6 w-6" />}
                        trendData={sampleData.clients.trendData}
                        changePercent={sampleData.clients.change}
                        showSparkline={true}
                        showTrend={true}
                        variant="success"
                    />

                    <MetricCard
                        value={sampleData.revenue.value}
                        label="Total Revenue"
                        format="currency"
                        icon={<DollarSign className="h-6 w-6" />}
                        trendData={sampleData.revenue.trendData}
                        changePercent={sampleData.revenue.change}
                        showSparkline={true}
                        showTrend={true}
                        variant="success"
                    />
                </div>
            </section>

            {/* Secondary Metrics */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold">Secondary Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        value={sampleData.listings.value}
                        label="Active Listings"
                        icon={<Home className="h-6 w-6" />}
                        trendData={sampleData.listings.trendData}
                        changePercent={sampleData.listings.change}
                        showSparkline={true}
                        showTrend={true}
                        variant="default"
                    />

                    <MetricCard
                        value={sampleData.appointments.value}
                        label="This Month"
                        icon={<Calendar className="h-6 w-6" />}
                        trendData={sampleData.appointments.trendData}
                        changePercent={sampleData.appointments.change}
                        showSparkline={true}
                        showTrend={true}
                        variant="default"
                    />

                    <MetricCard
                        value={sampleData.satisfaction.value}
                        label="Client Satisfaction"
                        suffix="%"
                        icon={<TrendingUp className="h-6 w-6" />}
                        trendData={sampleData.satisfaction.trendData}
                        changePercent={sampleData.satisfaction.change}
                        showSparkline={true}
                        showTrend={true}
                        variant="success"
                    />

                    <MetricCard
                        value={sampleData.engagement.value}
                        label="Social Engagement"
                        icon={<MessageSquare className="h-6 w-6" />}
                        trendData={sampleData.engagement.trendData}
                        changePercent={sampleData.engagement.change}
                        showSparkline={true}
                        showTrend={true}
                        variant="primary"
                    />
                </div>
            </section>

            {/* Without Sparklines */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold">Without Sparklines</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        value={sampleData.rating.value}
                        label="Average Rating"
                        decimals={1}
                        icon={<Star className="h-6 w-6" />}
                        changePercent={sampleData.rating.change}
                        showSparkline={false}
                        showTrend={true}
                        variant="primary"
                    />

                    <MetricCard
                        value={sampleData.reviews.value}
                        label="Total Reviews"
                        icon={<Award className="h-6 w-6" />}
                        changePercent={sampleData.reviews.change}
                        showSparkline={false}
                        showTrend={true}
                        variant="primary"
                    />

                    <MetricCard
                        value={sampleData.clients.value}
                        label="Active Clients"
                        icon={<Users className="h-6 w-6" />}
                        changePercent={sampleData.clients.change}
                        showSparkline={false}
                        showTrend={true}
                        variant="success"
                    />

                    <MetricCard
                        value={sampleData.revenue.value}
                        label="Total Revenue"
                        format="currency"
                        icon={<DollarSign className="h-6 w-6" />}
                        changePercent={sampleData.revenue.change}
                        showSparkline={false}
                        showTrend={true}
                        variant="success"
                    />
                </div>
            </section>

            {/* Variant Showcase */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold">Color Variants</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        value={98}
                        label="Success Variant"
                        suffix="%"
                        icon={<TrendingUp className="h-6 w-6" />}
                        trendData={[85, 88, 90, 93, 95, 97, 98]}
                        changePercent={15.3}
                        showSparkline={true}
                        showTrend={true}
                        variant="success"
                    />

                    <MetricCard
                        value={72}
                        label="Warning Variant"
                        suffix="%"
                        icon={<TrendingUp className="h-6 w-6" />}
                        trendData={[80, 78, 76, 75, 74, 73, 72]}
                        changePercent={-10.0}
                        showSparkline={true}
                        showTrend={true}
                        variant="warning"
                    />

                    <MetricCard
                        value={45}
                        label="Error Variant"
                        suffix="%"
                        icon={<TrendingUp className="h-6 w-6" />}
                        trendData={[65, 60, 55, 52, 50, 47, 45]}
                        changePercent={-30.8}
                        showSparkline={true}
                        showTrend={true}
                        variant="error"
                    />

                    <MetricCard
                        value={156}
                        label="Default Variant"
                        icon={<Star className="h-6 w-6" />}
                        trendData={[120, 128, 135, 142, 148, 152, 156]}
                        changePercent={30.0}
                        showSparkline={true}
                        showTrend={true}
                        variant="default"
                    />
                </div>
            </section>
        </div>
    );
}
