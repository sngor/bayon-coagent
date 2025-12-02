'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DashboardAnalytics } from '@/lib/open-house/types';
import { Badge } from '@/components/ui/badge';

interface ComparisonViewProps {
    analytics: DashboardAnalytics;
}

export function ComparisonView({ analytics }: ComparisonViewProps) {
    // Prepare data for bar chart from top performing properties
    const chartData = analytics.topPerformingProperties.map(property => ({
        property: property.propertyAddress.length > 30
            ? property.propertyAddress.substring(0, 30) + '...'
            : property.propertyAddress,
        fullAddress: property.propertyAddress,
        visitors: property.totalVisitors,
        sessions: property.sessionCount,
        avgInterest: property.averageInterestLevel,
    }));

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Property Performance Comparison</CardTitle>
                    <CardDescription>
                        Compare visitor engagement across properties
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No property data available for comparison</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Find the top performer
    const topProperty = chartData.reduce((max, property) =>
        property.visitors > max.visitors ? property : max
        , chartData[0]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Property Performance Comparison</CardTitle>
                <CardDescription>
                    Compare visitor engagement across your top properties
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                type="number"
                                className="text-xs"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                allowDecimals={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="property"
                                className="text-xs"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                width={150}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                formatter={(value: number, name: string) => {
                                    if (name === 'visitors') return [value, 'Total Visitors'];
                                    if (name === 'sessions') return [value, 'Sessions'];
                                    if (name === 'avgInterest') return [value.toFixed(2), 'Avg Interest'];
                                    return [value, name];
                                }}
                            />
                            <Legend />
                            <Bar
                                dataKey="visitors"
                                fill="hsl(var(--primary))"
                                name="Total Visitors"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Performer Highlight */}
                {topProperty && (
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="default">Top Performer</Badge>
                                    <span className="text-sm font-medium">
                                        {topProperty.fullAddress}
                                    </span>
                                </div>
                                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Visitors:</span>
                                        <span className="ml-2 font-semibold">{topProperty.visitors}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Sessions:</span>
                                        <span className="ml-2 font-semibold">{topProperty.sessions}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Avg Interest:</span>
                                        <span className="ml-2 font-semibold">
                                            {topProperty.avgInterest.toFixed(2)}/3.0
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Property List */}
                <div className="mt-6 space-y-3">
                    <h4 className="text-sm font-medium">All Properties</h4>
                    {chartData.map((property, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="font-medium text-sm">{property.fullAddress}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {property.sessions} {property.sessions === 1 ? 'session' : 'sessions'}
                                </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                                <div className="text-right">
                                    <div className="font-semibold">{property.visitors}</div>
                                    <div className="text-xs text-muted-foreground">visitors</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold">{property.avgInterest.toFixed(1)}</div>
                                    <div className="text-xs text-muted-foreground">avg interest</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
