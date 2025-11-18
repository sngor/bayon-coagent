"use client";

import { Sparkline, SparklineCard } from "@/components/ui/sparkline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SparklineDemoPage() {
    // Sample data sets
    const revenueData = [1200, 1350, 1280, 1450, 1620, 1580, 1750, 1690, 1820, 1900];
    const usersData = [450, 520, 480, 580, 620, 590, 680, 650, 720, 750];
    const conversionsData = [45, 52, 48, 58, 62, 59, 68, 65, 72, 78];
    const engagementData = [65, 68, 64, 70, 73, 71, 76, 74, 79, 82];

    const negativeData = [1000, 950, 980, 920, 880, 900, 850, 870, 820, 800];
    const neutralData = [500, 502, 499, 501, 500, 503, 501, 498, 500, 502];

    const tableData = [
        { product: "Marketing Plan Generator", views: 2345, trend: [100, 120, 115, 130, 145, 140, 160] },
        { product: "Brand Audit Tool", views: 1876, trend: [80, 85, 82, 88, 92, 89, 95] },
        { product: "Content Engine", views: 3421, trend: [150, 165, 160, 175, 185, 180, 195] },
        { product: "Research Agent", views: 1543, trend: [70, 75, 72, 78, 82, 79, 85] },
        { product: "Competitor Analysis", views: 987, trend: [45, 48, 46, 50, 53, 51, 55] },
    ];

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Sparkline Component Demo</h1>
                <p className="text-lg text-muted-foreground">
                    Lightweight inline charts for displaying trends and metrics
                </p>
            </div>

            <Tabs defaultValue="cards" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="cards">Dashboard Cards</TabsTrigger>
                    <TabsTrigger value="inline">Inline Sparklines</TabsTrigger>
                    <TabsTrigger value="table">Table Integration</TabsTrigger>
                    <TabsTrigger value="variants">Variants</TabsTrigger>
                </TabsList>

                {/* Dashboard Cards Tab */}
                <TabsContent value="cards" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <SparklineCard
                            title="Revenue"
                            value="$18,450"
                            data={revenueData}
                            color="hsl(142, 71%, 45%)"
                            formatValue={(value) => `$${value.toLocaleString()}`}
                        />

                        <SparklineCard
                            title="Active Users"
                            value="7,234"
                            data={usersData}
                            color="hsl(220, 60%, 50%)"
                            formatValue={(value) => value.toLocaleString()}
                        />

                        <SparklineCard
                            title="Conversions"
                            value="682"
                            data={conversionsData}
                            color="hsl(260, 60%, 55%)"
                            formatValue={(value) => value.toLocaleString()}
                        />

                        <SparklineCard
                            title="Engagement Rate"
                            value="78%"
                            data={engagementData}
                            color="hsl(38, 92%, 50%)"
                            formatValue={(value) => `${value}%`}
                        />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Dashboard Cards with Sparklines</CardTitle>
                            <CardDescription>
                                Perfect for displaying key metrics with trend visualization
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Each card shows the current value, a sparkline of historical data, and an
                                automatic trend indicator. Hover over the sparkline to see exact values.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Inline Sparklines Tab */}
                <TabsContent value="inline" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Sparkline</CardTitle>
                                <CardDescription>Simple inline trend visualization</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Default Style</p>
                                    <Sparkline data={revenueData} height={60} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">With Trend Indicator</p>
                                    <Sparkline data={revenueData} height={60} showTrend={true} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Custom Colors</CardTitle>
                                <CardDescription>Different colors for different metrics</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Success (Green)</p>
                                    <Sparkline
                                        data={revenueData}
                                        height={60}
                                        color="hsl(142, 71%, 45%)"
                                        showTrend={true}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Primary (Blue)</p>
                                    <Sparkline
                                        data={usersData}
                                        height={60}
                                        color="hsl(220, 60%, 50%)"
                                        showTrend={true}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Different Trends</CardTitle>
                                <CardDescription>Positive, negative, and neutral trends</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Positive Trend ↗</p>
                                    <Sparkline
                                        data={revenueData}
                                        height={50}
                                        color="hsl(142, 71%, 45%)"
                                        showTrend={true}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Negative Trend ↘</p>
                                    <Sparkline
                                        data={negativeData}
                                        height={50}
                                        color="hsl(0, 84%, 60%)"
                                        showTrend={true}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Neutral Trend →</p>
                                    <Sparkline
                                        data={neutralData}
                                        height={50}
                                        color="hsl(var(--muted-foreground))"
                                        showTrend={true}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Size Variations</CardTitle>
                                <CardDescription>Different heights for different contexts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Small (30px)</p>
                                    <Sparkline data={revenueData} height={30} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Medium (50px)</p>
                                    <Sparkline data={revenueData} height={50} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Large (80px)</p>
                                    <Sparkline data={revenueData} height={80} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Table Integration Tab */}
                <TabsContent value="table" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Performance</CardTitle>
                            <CardDescription>
                                Sparklines integrated into table rows for quick trend visualization
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Views</TableHead>
                                        <TableHead className="text-right">Trend (Last 7 Days)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tableData.map((row) => (
                                        <TableRow key={row.product}>
                                            <TableCell className="font-medium">{row.product}</TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {row.views.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end">
                                                    <Sparkline
                                                        data={row.trend}
                                                        height={30}
                                                        width={120}
                                                        showTooltip={true}
                                                        showTrend={true}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Variants Tab */}
                <TabsContent value="variants" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>With Gradient</CardTitle>
                                <CardDescription>Gradient fill enabled (default)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Sparkline data={revenueData} height={80} gradient={true} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Without Gradient</CardTitle>
                                <CardDescription>Solid fill only</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Sparkline data={revenueData} height={80} gradient={false} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Smooth Curves</CardTitle>
                                <CardDescription>Monotone interpolation (default)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Sparkline data={revenueData} height={80} smooth={true} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Sharp Lines</CardTitle>
                                <CardDescription>Linear interpolation</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Sparkline data={revenueData} height={80} smooth={false} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Thick Line</CardTitle>
                                <CardDescription>Increased stroke width</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Sparkline data={revenueData} height={80} strokeWidth={4} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Thin Line</CardTitle>
                                <CardDescription>Decreased stroke width</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Sparkline data={revenueData} height={80} strokeWidth={1} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>With Tooltip</CardTitle>
                                <CardDescription>Hover to see values</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Sparkline
                                    data={revenueData}
                                    height={80}
                                    showTooltip={true}
                                    formatValue={(value) => `$${value.toLocaleString()}`}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Without Tooltip</CardTitle>
                                <CardDescription>Static display only</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Sparkline data={revenueData} height={80} showTooltip={false} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Usage Example */}
            <Card>
                <CardHeader>
                    <CardTitle>Usage Example</CardTitle>
                    <CardDescription>How to use the Sparkline component in your code</CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code className="text-sm">{`import { Sparkline, SparklineCard } from "@/components/ui/sparkline";

// Basic sparkline
<Sparkline data={[10, 15, 13, 18, 22, 20, 25]} height={60} />

// Sparkline with trend indicator
<Sparkline 
  data={[10, 15, 13, 18, 22, 20, 25]} 
  height={60}
  showTrend={true}
  color="hsl(142, 71%, 45%)"
/>

// Dashboard card with sparkline
<SparklineCard
  title="Revenue"
  value="$18,450"
  data={[1200, 1350, 1280, 1450, 1620]}
  color="hsl(142, 71%, 45%)"
  formatValue={(value) => \`$\${value.toLocaleString()}\`}
/>`}</code>
                    </pre>
                </CardContent>
            </Card>
        </div>
    );
}
