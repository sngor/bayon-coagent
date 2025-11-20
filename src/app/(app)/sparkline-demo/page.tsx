'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkline, SparklineBar } from '@/components/ui/sparkline';

export default function SparklineDemoPage() {
    // Sample data
    const trendingUp = [20, 25, 22, 30, 28, 35, 40, 38, 45, 50];
    const trendingDown = [50, 48, 45, 42, 40, 38, 35, 32, 30, 28];
    const volatile = [30, 45, 25, 50, 20, 55, 30, 60, 25, 65];
    const stable = [40, 41, 40, 42, 41, 40, 41, 42, 41, 40];
    const largeDataset = Array.from({ length: 50 }, (_, i) =>
        30 + Math.sin(i / 5) * 20 + Math.random() * 10
    );

    return (
        <StandardPageLayout
            title="Sparklines"
            description="Compact inline charts for data visualization"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Line Sparklines</CardTitle>
                        <CardDescription>Simple line charts showing trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <div className="text-sm font-medium">Trending Up</div>
                                    <div className="text-2xl font-bold">50</div>
                                </div>
                                <Sparkline data={trendingUp} width={120} height={40} color="rgb(34, 197, 94)" />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <div className="text-sm font-medium">Trending Down</div>
                                    <div className="text-2xl font-bold">28</div>
                                </div>
                                <Sparkline data={trendingDown} width={120} height={40} color="rgb(239, 68, 68)" />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <div className="text-sm font-medium">Volatile</div>
                                    <div className="text-2xl font-bold">65</div>
                                </div>
                                <Sparkline data={volatile} width={120} height={40} color="rgb(234, 179, 8)" />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <div className="text-sm font-medium">Stable</div>
                                    <div className="text-2xl font-bold">40</div>
                                </div>
                                <Sparkline data={stable} width={120} height={40} color="rgb(59, 130, 246)" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sparklines with Fill</CardTitle>
                        <CardDescription>Area charts with gradient fill</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg">
                                <div className="text-sm font-medium mb-2">Page Views</div>
                                <div className="text-2xl font-bold mb-2">12,543</div>
                                <Sparkline
                                    data={trendingUp}
                                    width={200}
                                    height={60}
                                    color="rgb(34, 197, 94)"
                                    showFill={true}
                                />
                            </div>

                            <div className="p-4 border rounded-lg">
                                <div className="text-sm font-medium mb-2">Engagement Rate</div>
                                <div className="text-2xl font-bold mb-2">8.5%</div>
                                <Sparkline
                                    data={volatile}
                                    width={200}
                                    height={60}
                                    color="rgb(168, 85, 247)"
                                    showFill={true}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sparklines with Dots</CardTitle>
                        <CardDescription>Show data points along the line</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg">
                                <div className="text-sm font-medium mb-2">Weekly Sales</div>
                                <div className="text-2xl font-bold mb-2">$45,230</div>
                                <Sparkline
                                    data={trendingUp}
                                    width={200}
                                    height={60}
                                    color="rgb(34, 197, 94)"
                                    showDots={true}
                                />
                            </div>

                            <div className="p-4 border rounded-lg">
                                <div className="text-sm font-medium mb-2">Conversion Rate</div>
                                <div className="text-2xl font-bold mb-2">3.8%</div>
                                <Sparkline
                                    data={stable}
                                    width={200}
                                    height={60}
                                    color="rgb(59, 130, 246)"
                                    showDots={true}
                                    showFill={true}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Bar Sparklines</CardTitle>
                        <CardDescription>Compact bar charts for quick comparisons</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <div className="text-sm font-medium">Daily Activity</div>
                                    <div className="text-2xl font-bold">50 actions</div>
                                </div>
                                <SparklineBar data={trendingUp} width={120} height={40} color="rgb(34, 197, 94)" />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <div className="text-sm font-medium">Monthly Revenue</div>
                                    <div className="text-2xl font-bold">$85,000</div>
                                </div>
                                <SparklineBar data={volatile} width={120} height={40} color="rgb(59, 130, 246)" />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <div className="text-sm font-medium">Lead Generation</div>
                                    <div className="text-2xl font-bold">89 leads</div>
                                </div>
                                <SparklineBar data={trendingDown} width={120} height={40} color="rgb(239, 68, 68)" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Large Dataset</CardTitle>
                        <CardDescription>Sparklines handle many data points efficiently</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 border rounded-lg">
                            <div className="text-sm font-medium mb-2">50 Data Points</div>
                            <div className="text-2xl font-bold mb-2">Yearly Trend</div>
                            <Sparkline
                                data={largeDataset}
                                width={400}
                                height={80}
                                color="rgb(168, 85, 247)"
                                showFill={true}
                                strokeWidth={2}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Size Variations</CardTitle>
                        <CardDescription>Different sizes for different contexts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground w-20">Small</span>
                                <Sparkline data={trendingUp} width={80} height={20} />
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground w-20">Medium</span>
                                <Sparkline data={trendingUp} width={120} height={40} />
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground w-20">Large</span>
                                <Sparkline data={trendingUp} width={200} height={60} />
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground w-20">Extra Large</span>
                                <Sparkline data={trendingUp} width={300} height={80} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { Sparkline, SparklineBar } from '@/components/ui/sparkline';

const data = [20, 25, 22, 30, 28, 35, 40, 38, 45, 50];

// Line sparkline
<Sparkline 
  data={data} 
  width={120} 
  height={40} 
  color="rgb(34, 197, 94)"
  showFill={true}
  showDots={false}
  animate={true}
/>

// Bar sparkline
<SparklineBar 
  data={data} 
  width={120} 
  height={40} 
  color="rgb(59, 130, 246)"
  animate={true}
/>`}</code>
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
