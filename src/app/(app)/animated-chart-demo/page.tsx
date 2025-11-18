"use client";

import { useState } from "react";
import { AnimatedChart, Sparkline } from "@/components/ui/animated-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function AnimatedChartDemoPage() {
    const [chartType, setChartType] = useState<"line" | "bar" | "area">("area");

    // Sample data for charts
    const monthlyData = [
        { month: "Jan", revenue: 4200, leads: 24 },
        { month: "Feb", revenue: 5100, leads: 32 },
        { month: "Mar", revenue: 4800, leads: 28 },
        { month: "Apr", revenue: 6200, leads: 38 },
        { month: "May", revenue: 7100, leads: 45 },
        { month: "Jun", revenue: 8300, leads: 52 },
        { month: "Jul", revenue: 7800, leads: 48 },
        { month: "Aug", revenue: 9200, leads: 58 },
        { month: "Sep", revenue: 8900, leads: 54 },
        { month: "Oct", revenue: 10100, leads: 62 },
        { month: "Nov", revenue: 11200, leads: 68 },
        { month: "Dec", revenue: 12500, leads: 75 },
    ];

    const weeklyData = [
        { day: "Mon", views: 120 },
        { day: "Tue", views: 145 },
        { day: "Wed", views: 132 },
        { day: "Thu", views: 168 },
        { day: "Fri", views: 195 },
        { day: "Sat", views: 210 },
        { day: "Sun", views: 185 },
    ];

    const sparklineData = [45, 52, 48, 61, 58, 72, 68, 85, 92, 88, 95, 102];

    const chartConfig = {
        revenue: {
            label: "Revenue ($)",
            color: "hsl(var(--primary))",
        },
        leads: {
            label: "Leads",
            color: "hsl(var(--accent-start))",
        },
        views: {
            label: "Page Views",
            color: "hsl(var(--primary))",
        },
    };

    const handleDataPointClick = (data: any) => {
        console.log("Clicked data point:", data);
    };

    return (
        <div className="container mx-auto space-y-8 p-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Animated Charts</h1>
                <p className="text-lg text-muted-foreground">
                    Interactive data visualizations with smooth animations, gradient fills, and zoom/pan
                    capabilities
                </p>
            </div>

            {/* Chart Type Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Chart Type</CardTitle>
                    <CardDescription>Select a chart type to see different visualizations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Button
                            variant={chartType === "area" ? "default" : "outline"}
                            onClick={() => setChartType("area")}
                        >
                            Area Chart
                        </Button>
                        <Button
                            variant={chartType === "line" ? "default" : "outline"}
                            onClick={() => setChartType("line")}
                        >
                            Line Chart
                        </Button>
                        <Button
                            variant={chartType === "bar" ? "default" : "outline"}
                            onClick={() => setChartType("bar")}
                        >
                            Bar Chart
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Main Chart Examples */}
            <Tabs defaultValue="revenue" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
                    <TabsTrigger value="leads">Lead Generation</TabsTrigger>
                    <TabsTrigger value="views">Page Views</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Monthly Revenue</CardTitle>
                                    <CardDescription>Revenue performance over the last 12 months</CardDescription>
                                </div>
                                <Badge variant="outline" className="gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    +24.5%
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <AnimatedChart
                                data={monthlyData}
                                type={chartType}
                                dataKey="revenue"
                                xAxisKey="month"
                                config={chartConfig}
                                gradient={true}
                                interactive={true}
                                animated={true}
                                height={400}
                                showGrid={true}
                                showBrush={true}
                                onDataPointClick={handleDataPointClick}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="leads" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Lead Generation</CardTitle>
                                    <CardDescription>New leads acquired each month</CardDescription>
                                </div>
                                <Badge variant="outline" className="gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    +18.2%
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <AnimatedChart
                                data={monthlyData}
                                type={chartType}
                                dataKey="leads"
                                xAxisKey="month"
                                config={chartConfig}
                                gradient={true}
                                interactive={true}
                                animated={true}
                                height={400}
                                showGrid={true}
                                showBrush={true}
                                colors={{
                                    primary: "hsl(142 71% 45%)",
                                    secondary: "hsl(142 71% 65%)",
                                    gradient: {
                                        start: "hsl(142 71% 45%)",
                                        end: "hsl(142 71% 65%)",
                                    },
                                }}
                                onDataPointClick={handleDataPointClick}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="views" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Weekly Page Views</CardTitle>
                                    <CardDescription>Website traffic for the current week</CardDescription>
                                </div>
                                <Badge variant="outline" className="gap-1">
                                    <Activity className="h-3 w-3" />
                                    1,305 total
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <AnimatedChart
                                data={weeklyData}
                                type={chartType}
                                dataKey="views"
                                xAxisKey="day"
                                config={chartConfig}
                                gradient={true}
                                interactive={true}
                                animated={true}
                                height={400}
                                showGrid={true}
                                colors={{
                                    primary: "hsl(260 60% 55%)",
                                    secondary: "hsl(220 60% 50%)",
                                    gradient: {
                                        start: "hsl(260 60% 55%)",
                                        end: "hsl(220 60% 50%)",
                                    },
                                }}
                                onDataPointClick={handleDataPointClick}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Sparkline Examples */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold">$94,200</span>
                                <Badge variant="outline" className="gap-1 text-green-600">
                                    <TrendingUp className="h-3 w-3" />
                                    12.5%
                                </Badge>
                            </div>
                            <Sparkline
                                data={sparklineData}
                                height={60}
                                color="hsl(var(--primary))"
                                gradient={true}
                                showTooltip={true}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold">127</span>
                                <Badge variant="outline" className="gap-1 text-green-600">
                                    <TrendingUp className="h-3 w-3" />
                                    8.3%
                                </Badge>
                            </div>
                            <Sparkline
                                data={[32, 38, 35, 42, 45, 48, 52, 58, 62, 68, 75, 82]}
                                height={60}
                                color="hsl(142 71% 45%)"
                                gradient={true}
                                showTooltip={true}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold">3.8%</span>
                                <Badge variant="outline" className="gap-1 text-red-600">
                                    <TrendingDown className="h-3 w-3" />
                                    2.1%
                                </Badge>
                            </div>
                            <Sparkline
                                data={[4.2, 4.5, 4.3, 4.1, 3.9, 3.8, 3.7, 3.9, 3.8, 3.6, 3.7, 3.8]}
                                height={60}
                                color="hsl(0 84% 60%)"
                                gradient={true}
                                showTooltip={true}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Features List */}
            <Card>
                <CardHeader>
                    <CardTitle>Features</CardTitle>
                    <CardDescription>What makes these charts special</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>
                                <strong>Smooth Animations:</strong> Charts animate in with spring physics and ease-out
                                timing
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>
                                <strong>Gradient Fills:</strong> Beautiful gradient fills for area and bar charts
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>
                                <strong>Interactive Tooltips:</strong> Hover over data points to see detailed information
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>
                                <strong>Zoom & Pan:</strong> Use the brush component to zoom into specific time ranges
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>
                                <strong>Responsive:</strong> Charts adapt to container size automatically
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>
                                <strong>Sparklines:</strong> Compact inline charts for dashboard metrics
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>
                                <strong>Click Events:</strong> Handle data point clicks for drill-down interactions
                            </span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
