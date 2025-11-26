/**
 * Listing Metrics Display Component
 * 
 * Displays performance metrics for a listing with time period selection.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
    Eye,
    Share2,
    MessageSquare,
    TrendingUp,
    Facebook,
    Instagram,
    Linkedin,
    Download,
    RefreshCw,
    Activity,
    ArrowRightLeft,
} from 'lucide-react';
import { getAggregatedMetrics } from '@/app/performance-metrics-actions';
import { AggregatedMetrics, TimePeriod } from '@/lib/performance-metrics-types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ListingMetricsDisplayProps {
    userId: string;
    listingId: string;
    className?: string;
}

export function ListingMetricsDisplay({
    userId,
    listingId,
    className,
}: ListingMetricsDisplayProps) {
    const [period, setPeriod] = useState<TimePeriod>('weekly');
    const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLive, setIsLive] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        loadMetrics();
    }, [userId, listingId, period]);

    // Polling for live updates
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLive) {
            interval = setInterval(() => {
                loadMetrics(true);
            }, 30000); // Poll every 30 seconds
        }
        return () => clearInterval(interval);
    }, [isLive, userId, listingId, period]);

    const loadMetrics = async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);

        const result = await getAggregatedMetrics(userId, listingId, period);

        if (result.error) {
            setError(result.error);
        } else {
            setMetrics(result.metrics);
        }

        if (!silent) setLoading(false);
    };

    const handleExportCSV = () => {
        if (!metrics) return;

        const headers = ['Date', 'Views', 'Shares', 'Inquiries'];
        const rows = metrics.dailyBreakdown?.map(day => [
            day.date,
            day.views,
            day.shares,
            day.inquiries
        ]) || [];

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `metrics-${listingId}-${period}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = async () => {
        const element = document.getElementById('metrics-display');
        if (!element) return;

        setIsExporting(true);
        try {
            const canvas = await html2canvas(element);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`metrics-${listingId}-${period}.pdf`);
        } catch (err) {
            console.error('Failed to export PDF:', err);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Loading metrics...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription className="text-destructive">{error}</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!metrics) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>No metrics available</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'facebook':
                return <Facebook className="h-4 w-4" />;
            case 'instagram':
                return <Instagram className="h-4 w-4" />;
            case 'linkedin':
                return <Linkedin className="h-4 w-4" />;
            default:
                return null;
        }
    };

    return (
        <Card className={className} id="metrics-display">
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Performance Metrics
                            {isLive && (
                                <Badge variant="outline" className="animate-pulse text-green-600 border-green-600">
                                    <Activity className="h-3 w-3 mr-1" />
                                    Live
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {metrics.startDate} to {metrics.endDate}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2 mr-4">
                            <Switch
                                id="live-mode"
                                checked={isLive}
                                onCheckedChange={setIsLive}
                            />
                            <Label htmlFor="live-mode" className="text-sm cursor-pointer">
                                Live Updates
                            </Label>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" disabled={isExporting}>
                                    {isExporting ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4 mr-2" />
                                    )}
                                    Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExportCSV}>
                                    Save as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportPDF}>
                                    Save as PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
                            <TabsList>
                                <TabsTrigger value="daily">Today</TabsTrigger>
                                <TabsTrigger value="weekly">7 Days</TabsTrigger>
                                <TabsTrigger value="monthly">30 Days</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Overall Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-3 p-4 border rounded-lg">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Views</p>
                                <p className="text-2xl font-bold">{metrics.totalViews}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border rounded-lg">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                <Share2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Shares</p>
                                <p className="text-2xl font-bold">{metrics.totalShares}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border rounded-lg">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Inquiries</p>
                                <p className="text-2xl font-bold">{metrics.totalInquiries}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border rounded-lg">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Conversion</p>
                                <p className="text-2xl font-bold">
                                    {metrics.conversionRate ? metrics.conversionRate.toFixed(1) : '0.0'}%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Platform Breakdown */}
                    {Object.keys(metrics.byPlatform).length > 0 && (
                        <div>
                            <h3 className="font-headline text-sm font-medium mb-3 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                By Platform
                            </h3>
                            <div className="space-y-3">
                                {Object.entries(metrics.byPlatform).map(([platform, platformMetrics]) => (
                                    <div
                                        key={platform}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            {getPlatformIcon(platform)}
                                            <span className="font-medium capitalize">{platform}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Eye className="h-3 w-3 text-muted-foreground" />
                                                <span>{platformMetrics.views}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Share2 className="h-3 w-3 text-muted-foreground" />
                                                <span>{platformMetrics.shares}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                                <span>{platformMetrics.inquiries}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Daily Breakdown (for weekly/monthly views) */}
                    {period !== 'daily' && metrics.dailyBreakdown && metrics.dailyBreakdown.length > 0 && (
                        <div>
                            <h3 className="font-headline text-sm font-medium mb-3">Daily Breakdown</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {metrics.dailyBreakdown
                                    .filter((day) => day.views > 0 || day.shares > 0 || day.inquiries > 0)
                                    .map((day) => (
                                        <div
                                            key={day.date}
                                            className="flex items-center justify-between p-2 text-sm border-b last:border-b-0"
                                        >
                                            <span className="text-muted-foreground">{day.date}</span>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="secondary" className="gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    {day.views}
                                                </Badge>
                                                <Badge variant="secondary" className="gap-1">
                                                    <Share2 className="h-3 w-3" />
                                                    {day.shares}
                                                </Badge>
                                                <Badge variant="secondary" className="gap-1">
                                                    <MessageSquare className="h-3 w-3" />
                                                    {day.inquiries}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
