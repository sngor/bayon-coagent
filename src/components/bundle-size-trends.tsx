'use client';

/**
 * Bundle Size Trends Component
 * 
 * Displays historical bundle size data and trends over time.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, TrendingDown, TrendingUp } from 'lucide-react';

interface BundleSizeEntry {
    timestamp: string;
    commit: string;
    branch: string;
    totalJS: number;
    totalCSS: number;
    total: number;
    jsFileCount: number;
    cssFileCount: number;
}

export function BundleSizeTrends() {
    const [history, setHistory] = useState<BundleSizeEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadHistory() {
            try {
                const response = await fetch('/api/analytics/bundle-size');
                if (response.ok) {
                    const data = await response.json();
                    setHistory(data);
                }
            } catch (error) {
                console.error('Failed to load bundle size history:', error);
            } finally {
                setLoading(false);
            }
        }

        loadHistory();
    }, []);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Bundle Size Trends
                    </CardTitle>
                    <CardDescription>Loading bundle size history...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (history.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Bundle Size Trends
                    </CardTitle>
                    <CardDescription>No bundle size data available yet</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Run <code className="bg-muted px-1 py-0.5 rounded">npm run bundle:track</code> after builds to start tracking bundle sizes.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const current = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : null;

    const jsDiff = previous ? current.totalJS - previous.totalJS : 0;
    const cssDiff = previous ? current.totalCSS - previous.totalCSS : 0;
    const totalDiff = previous ? current.total - previous.total : 0;

    // Format data for chart
    const chartData = history.slice(-20).map((entry) => ({
        date: new Date(entry.timestamp).toLocaleDateString(),
        JS: entry.totalJS,
        CSS: entry.totalCSS,
        Total: entry.total,
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Bundle Size Trends
                </CardTitle>
                <CardDescription>
                    Historical bundle size data (last {Math.min(20, history.length)} builds)
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Current sizes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">JavaScript</h3>
                            {jsDiff !== 0 && (
                                <div className={`flex items-center gap-1 text-sm ${jsDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {jsDiff > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                    {Math.abs(jsDiff)} KB
                                </div>
                            )}
                        </div>
                        <div className="text-2xl font-bold">{current.totalJS} KB</div>
                        <div className="text-sm text-muted-foreground">{current.jsFileCount} files</div>
                    </div>

                    <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">CSS</h3>
                            {cssDiff !== 0 && (
                                <div className={`flex items-center gap-1 text-sm ${cssDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {cssDiff > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                    {Math.abs(cssDiff)} KB
                                </div>
                            )}
                        </div>
                        <div className="text-2xl font-bold">{current.totalCSS} KB</div>
                        <div className="text-sm text-muted-foreground">{current.cssFileCount} files</div>
                    </div>

                    <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">Total</h3>
                            {totalDiff !== 0 && (
                                <div className={`flex items-center gap-1 text-sm ${totalDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {totalDiff > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                    {Math.abs(totalDiff)} KB
                                </div>
                            )}
                        </div>
                        <div className="text-2xl font-bold">{current.total} KB</div>
                        <div className="text-sm text-muted-foreground">Combined</div>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis label={{ value: 'Size (KB)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="JS" stroke="#3b82f6" strokeWidth={2} />
                            <Line type="monotone" dataKey="CSS" stroke="#10b981" strokeWidth={2} />
                            <Line type="monotone" dataKey="Total" stroke="#8b5cf6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Thresholds */}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Bundle Size Thresholds</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>Initial JS: ≤ 200 KB</div>
                        <div>Initial CSS: ≤ 50 KB</div>
                        <div>Page JS: ≤ 150 KB</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
