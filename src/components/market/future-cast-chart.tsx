'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { GenerateFutureCastOutput } from '@/ai/schemas/market-update-schemas';

export function FutureCastChart({ data }: { data: GenerateFutureCastOutput }) {
    const { forecasts, summary, actionableAdvice } = data;

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'down':
                return <TrendingDown className="w-4 h-4 text-red-500" />;
            default:
                return <Minus className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>FutureCast Market Forecast</CardTitle>
                    <CardDescription>Predicted median price trends for the next 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={forecasts} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis
                                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Predicted Price']}
                                    labelFormatter={(label) => `Date: ${label}`}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="price"
                                    name="Predicted Median Price"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Market Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{summary}</p>
                    </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-primary text-primary-foreground">Actionable Advice</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-medium text-primary">{actionableAdvice}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
