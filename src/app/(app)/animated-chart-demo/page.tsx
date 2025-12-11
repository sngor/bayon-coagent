'use client';

import { StandardPageLayout } from '@/components/standard/page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedChart } from '@/components/ui/animated-chart';

export default function AnimatedChartDemoPage() {
    const lineData = [
        { month: 'Jan', value: 400 },
        { month: 'Feb', value: 300 },
        { month: 'Mar', value: 600 },
        { month: 'Apr', value: 800 },
        { month: 'May', value: 500 },
        { month: 'Jun', value: 900 },
    ];

    const barData = [
        { name: 'Listings', value: 45 },
        { name: 'Sales', value: 32 },
        { name: 'Leads', value: 78 },
        { name: 'Views', value: 234 },
    ];

    const areaData = [
        { date: 'Week 1', views: 120, clicks: 45 },
        { date: 'Week 2', views: 180, clicks: 67 },
        { date: 'Week 3', views: 150, clicks: 52 },
        { date: 'Week 4', views: 220, clicks: 89 },
    ];

    return (
        <StandardPageLayout
            title="Animated Charts Demo"
            description="Smooth animated charts with Recharts"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Line Chart</CardTitle>
                        <CardDescription>Animated line chart showing trends over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AnimatedChart
                            data={lineData}
                            type="line"
                            dataKey="value"
                            xAxisKey="month"
                            height={300}
                            config={{
                                value: {
                                    label: "Value",
                                    color: "hsl(var(--chart-1))",
                                },
                            }}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Bar Chart</CardTitle>
                        <CardDescription>Animated bar chart for comparisons</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AnimatedChart
                            data={barData}
                            type="bar"
                            dataKey="value"
                            xAxisKey="name"
                            height={300}
                            config={{
                                value: {
                                    label: "Value",
                                    color: "hsl(var(--chart-2))",
                                },
                            }}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Area Chart</CardTitle>
                        <CardDescription>Multi-series area chart with smooth animations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AnimatedChart
                            data={areaData}
                            type="area"
                            dataKey="views"
                            xAxisKey="date"
                            height={300}
                            config={{
                                views: {
                                    label: "Views",
                                    color: "hsl(var(--chart-3))",
                                },
                                clicks: {
                                    label: "Clicks",
                                    color: "hsl(var(--chart-4))",
                                },
                            }}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { AnimatedChart } from '@/components/ui/animated-chart';

const data = [
  { month: 'Jan', value: 400 },
  { month: 'Feb', value: 300 },
  { month: 'Mar', value: 600 },
];

<AnimatedChart
  data={data}
  type="line"
  dataKey="value"
  xAxisKey="month"
  height={300}
/>`}</code>
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
