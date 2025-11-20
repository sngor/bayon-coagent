'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { Home, TrendingUp, Users, DollarSign, Eye, Heart, MessageSquare, FileText } from 'lucide-react';

export default function MetricCardDemoPage() {
    return (
        <StandardPageLayout
            title="Metric Cards"
            description="Metric card displays with trends and animations"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Metrics</CardTitle>
                        <CardDescription>Simple metric cards with icons</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard
                                title="Total Listings"
                                value={127}
                                icon={Home}
                                description="Active properties"
                            />
                            <MetricCard
                                title="Page Views"
                                value={12543}
                                icon={Eye}
                                description="This month"
                            />
                            <MetricCard
                                title="Leads Generated"
                                value={89}
                                icon={Users}
                                description="Last 30 days"
                            />
                            <MetricCard
                                title="Content Created"
                                value={45}
                                icon={FileText}
                                description="This quarter"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Metrics with Trends</CardTitle>
                        <CardDescription>Cards showing percentage change from previous period</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard
                                title="Average Property Value"
                                value={485000}
                                previousValue={450000}
                                format="currency"
                                icon={DollarSign}
                                trendLabel="vs last month"
                            />
                            <MetricCard
                                title="Engagement Rate"
                                value={8.5}
                                previousValue={7.2}
                                format="percentage"
                                icon={Heart}
                                trendLabel="vs last week"
                            />
                            <MetricCard
                                title="New Followers"
                                value={234}
                                previousValue={289}
                                icon={Users}
                                trendLabel="vs last month"
                            />
                            <MetricCard
                                title="Comments"
                                value={156}
                                previousValue={156}
                                icon={MessageSquare}
                                trendLabel="no change"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Currency Format</CardTitle>
                        <CardDescription>Metrics formatted as currency values</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <MetricCard
                                title="Total Sales"
                                value={2450000}
                                previousValue={2100000}
                                format="currency"
                                icon={DollarSign}
                                trendLabel="vs last quarter"
                            />
                            <MetricCard
                                title="Average Commission"
                                value={12500}
                                previousValue={11800}
                                format="currency"
                                icon={TrendingUp}
                                trendLabel="per transaction"
                            />
                            <MetricCard
                                title="Monthly Revenue"
                                value={85000}
                                previousValue={92000}
                                format="currency"
                                icon={DollarSign}
                                trendLabel="vs last month"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Percentage Format</CardTitle>
                        <CardDescription>Metrics displayed as percentages</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <MetricCard
                                title="Conversion Rate"
                                value={3.8}
                                previousValue={3.2}
                                format="percentage"
                                icon={TrendingUp}
                                trendLabel="vs last month"
                            />
                            <MetricCard
                                title="Open Rate"
                                value={24.5}
                                previousValue={26.1}
                                format="percentage"
                                icon={Eye}
                                trendLabel="email campaigns"
                            />
                            <MetricCard
                                title="Click-Through Rate"
                                value={5.2}
                                format="percentage"
                                icon={MessageSquare}
                                description="Last 7 days"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Forced Trends</CardTitle>
                        <CardDescription>Override automatic trend calculation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <MetricCard
                                title="Market Score"
                                value={85}
                                trend="up"
                                trendLabel="Strong market"
                                icon={TrendingUp}
                            />
                            <MetricCard
                                title="Competition Level"
                                value={42}
                                trend="down"
                                trendLabel="Decreasing"
                                icon={Users}
                            />
                            <MetricCard
                                title="Inventory"
                                value={156}
                                trend="neutral"
                                trendLabel="Stable"
                                icon={Home}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Without Animation</CardTitle>
                        <CardDescription>Static values without animated counting</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <MetricCard
                                title="Static Number"
                                value={1234}
                                icon={Home}
                                animate={false}
                            />
                            <MetricCard
                                title="Static Currency"
                                value={567890}
                                format="currency"
                                icon={DollarSign}
                                animate={false}
                            />
                            <MetricCard
                                title="Static Percentage"
                                value={12.5}
                                format="percentage"
                                icon={TrendingUp}
                                animate={false}
                            />
                            <MetricCard
                                title="Static with Trend"
                                value={89}
                                previousValue={75}
                                icon={Users}
                                animate={false}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { MetricCard } from '@/components/ui/metric-card';
import { DollarSign } from 'lucide-react';

<MetricCard
  title="Total Sales"
  value={2450000}
  previousValue={2100000}
  format="currency"
  icon={DollarSign}
  trendLabel="vs last quarter"
  animate={true}
/>`}</code>
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
