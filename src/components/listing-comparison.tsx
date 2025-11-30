'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getListingsForComparison, compareListingsMetrics } from '@/services/monitoring/performance-metrics-actions';
import { ComparativeMetrics, TimePeriod, PerformanceMetrics } from '@/lib/types/performance-metrics-types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useUser } from '@/aws/auth';

interface ListingComparisonProps {
    userId?: string;
    className?: string;
}

interface ListingOption {
    listingId: string;
    address: string;
    price: number;
    image?: string;
}

export function ListingComparison({ userId: propUserId, className }: ListingComparisonProps) {
    const { user } = useUser();
    const userId = propUserId || user?.id;
    const [listings, setListings] = useState<ListingOption[]>([]);
    const [listing1Id, setListing1Id] = useState<string>('');
    const [listing2Id, setListing2Id] = useState<string>('');
    const [period, setPeriod] = useState<TimePeriod>('weekly');
    const [comparisonData, setComparisonData] = useState<ComparativeMetrics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchListings() {
            if (!userId) return;
            const result = await getListingsForComparison(userId);
            if (result.listings) {
                setListings(result.listings);
                // Pre-select first two if available
                if (result.listings.length > 0) setListing1Id(result.listings[0].listingId);
                if (result.listings.length > 1) setListing2Id(result.listings[1].listingId);
            }
        }
        fetchListings();
    }, [userId]);

    const handleCompare = async () => {
        if (!listing1Id || !listing2Id || !userId) return;

        setLoading(true);
        setError(null);

        try {
            const result = await compareListingsMetrics(userId, listing1Id, listing2Id, period);
            if (result.error) {
                setError(result.error);
            } else {
                setComparisonData(result.metrics);
            }
        } catch (err) {
            setError('Failed to compare listings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getListingName = (id: string) => listings.find(l => l.listingId === id)?.address || 'Unknown Listing';

    const renderMetricRow = (label: string, value1: number, value2: number, format: (v: number) => string = (v) => v.toString()) => {
        const diff = value1 - value2;
        const better = value1 > value2 ? 'left' : value2 > value1 ? 'right' : 'equal';

        return (
            <div className="grid grid-cols-3 gap-4 py-3 border-b last:border-0 items-center">
                <div className={`text-center ${better === 'left' ? 'font-bold text-green-600' : ''}`}>
                    {format(value1)}
                </div>
                <div className="text-center text-sm text-muted-foreground font-medium flex flex-col items-center">
                    {label}
                    {better !== 'equal' && (
                        <span className={`text-xs flex items-center mt-1 ${better === 'left' ? 'text-green-600' : 'text-blue-600'}`}>
                            {better === 'left' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {better === 'left' ? 'Leading' : 'Trailing'}
                        </span>
                    )}
                </div>
                <div className={`text-center ${better === 'right' ? 'font-bold text-blue-600' : ''}`}>
                    {format(value2)}
                </div>
            </div>
        );
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5" />
                    Compare Listings
                </CardTitle>
                <CardDescription>
                    Analyze performance metrics side-by-side
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Listing A</label>
                            <Select value={listing1Id} onValueChange={setListing1Id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select listing" />
                                </SelectTrigger>
                                <SelectContent>
                                    {listings.map(l => (
                                        <SelectItem key={l.listingId} value={l.listingId}>
                                            {l.address}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Listing B</label>
                            <Select value={listing2Id} onValueChange={setListing2Id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select listing" />
                                </SelectTrigger>
                                <SelectContent>
                                    {listings.map(l => (
                                        <SelectItem key={l.listingId} value={l.listingId}>
                                            {l.address}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2">
                            <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)} className="flex-1">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="daily">Day</TabsTrigger>
                                    <TabsTrigger value="weekly">Week</TabsTrigger>
                                    <TabsTrigger value="monthly">Month</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Button onClick={handleCompare} disabled={loading || !listing1Id || !listing2Id}>
                                {loading ? 'Comparing...' : 'Compare'}
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Comparison Results */}
                    {comparisonData && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-3 gap-4 bg-muted/50 p-4 border-b">
                                <div className="text-center font-semibold truncate px-2">
                                    {getListingName(comparisonData.listing1.listingId)}
                                </div>
                                <div className="text-center text-sm text-muted-foreground">Metric</div>
                                <div className="text-center font-semibold truncate px-2">
                                    {getListingName(comparisonData.listing2.listingId)}
                                </div>
                            </div>

                            <div className="p-4 space-y-1">
                                {renderMetricRow('Total Views', comparisonData.listing1.metrics.totalViews, comparisonData.listing2.metrics.totalViews)}
                                {renderMetricRow('Total Shares', comparisonData.listing1.metrics.totalShares, comparisonData.listing2.metrics.totalShares)}
                                {renderMetricRow('Total Inquiries', comparisonData.listing1.metrics.totalInquiries, comparisonData.listing2.metrics.totalInquiries)}
                                {renderMetricRow('Conversion Rate',
                                    comparisonData.listing1.metrics.conversionRate || 0,
                                    comparisonData.listing2.metrics.conversionRate || 0,
                                    (v) => `${v.toFixed(1)}%`
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
