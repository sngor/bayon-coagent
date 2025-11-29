'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Minus,
    MapPin,
    DollarSign,
    Home,
    Calendar,
    Clock,
    Wifi,
    WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils/common';

export interface MarketStats {
    location: string;
    medianPrice: number;
    inventoryLevel: number;
    daysOnMarket: number;
    priceTrend: 'up' | 'down' | 'stable';
    timestamp: number;
    cached: boolean;
    dataAge?: number; // Age in hours
    stale?: boolean; // True if data is older than 24 hours
}

export interface MarketStatsProps {
    location: string;
    onRefresh: () => void;
    loading?: boolean;
    stats?: MarketStats;
    error?: string;
    isOnline?: boolean;
}

/**
 * Market Stats Component for Mobile
 * 
 * Displays market statistics including median price, inventory, days on market,
 * and price trends. Shows data age and cache status with refresh capability.
 */
export function MarketStats({
    location,
    onRefresh,
    loading = false,
    stats,
    error,
    isOnline = true
}: MarketStatsProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (!isOnline || loading) return;

        setIsRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setIsRefreshing(false);
        }
    };

    const formatPrice = (price: number): string => {
        if (price >= 1000000) {
            return `$${(price / 1000000).toFixed(1)}M`;
        } else if (price >= 1000) {
            return `$${(price / 1000).toFixed(0)}K`;
        }
        return `$${price.toLocaleString()}`;
    };

    const formatDataAge = (timestamp: number): string => {
        const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60);

        if (ageInHours < 1) {
            const minutes = Math.floor(ageInHours * 60);
            return `${minutes}m ago`;
        } else if (ageInHours < 24) {
            return `${Math.floor(ageInHours)}h ago`;
        } else {
            const days = Math.floor(ageInHours / 24);
            return `${days}d ago`;
        }
    };

    const getTrendIcon = (trend: MarketStats['priceTrend']) => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="h-4 w-4 text-green-600" />;
            case 'down':
                return <TrendingDown className="h-4 w-4 text-red-600" />;
            case 'stable':
                return <Minus className="h-4 w-4 text-gray-600" />;
            default:
                return <Minus className="h-4 w-4 text-gray-600" />;
        }
    };

    const getTrendColor = (trend: MarketStats['priceTrend']) => {
        switch (trend) {
            case 'up':
                return 'text-green-600';
            case 'down':
                return 'text-red-600';
            case 'stable':
                return 'text-gray-600';
            default:
                return 'text-gray-600';
        }
    };

    const getTrendText = (trend: MarketStats['priceTrend']) => {
        switch (trend) {
            case 'up':
                return 'Rising';
            case 'down':
                return 'Declining';
            case 'stable':
                return 'Stable';
            default:
                return 'Unknown';
        }
    };

    if (error) {
        return (
            <Card className="w-full">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Market Stats
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={!isOnline || isRefreshing}
                            className="h-8"
                        >
                            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{location}</p>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (loading && !stats) {
        return (
            <Card className="w-full">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Market Stats
                        </CardTitle>
                        <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-4 w-32 mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!stats) {
        return (
            <Card className="w-full">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Market Stats
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={!isOnline || isRefreshing}
                            className="h-8"
                        >
                            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{location}</p>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No market data available. Tap refresh to load data.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const isStale = stats.stale || (stats.dataAge && stats.dataAge > 24);

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Market Stats
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={!isOnline || isRefreshing}
                        className="h-8"
                    >
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{stats.location}</p>
                    <div className="flex items-center gap-2">
                        {/* Online/Offline indicator */}
                        {isOnline ? (
                            <Wifi className="h-4 w-4 text-green-600" />
                        ) : (
                            <WifiOff className="h-4 w-4 text-red-600" />
                        )}

                        {/* Cache status */}
                        {stats.cached && (
                            <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Cached
                            </Badge>
                        )}

                        {/* Stale data warning */}
                        {isStale && (
                            <Badge variant="destructive" className="text-xs">
                                Stale
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Data age */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Updated {formatDataAge(stats.timestamp)}</span>
                    {isStale && isOnline && (
                        <span className="text-orange-600">
                            Data is older than 24 hours
                        </span>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Main stats grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Median Price */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            Median Price
                        </div>
                        <div className="text-xl font-semibold">
                            {formatPrice(stats.medianPrice)}
                        </div>
                    </div>

                    {/* Inventory Level */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Home className="h-4 w-4" />
                            Inventory
                        </div>
                        <div className="text-xl font-semibold">
                            {stats.inventoryLevel.toLocaleString()}
                        </div>
                    </div>

                    {/* Days on Market */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Days on Market
                        </div>
                        <div className="text-xl font-semibold">
                            {stats.daysOnMarket}
                        </div>
                    </div>

                    {/* Price Trend */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {getTrendIcon(stats.priceTrend)}
                            Price Trend
                        </div>
                        <div className={cn("text-xl font-semibold", getTrendColor(stats.priceTrend))}>
                            {getTrendText(stats.priceTrend)}
                        </div>
                    </div>
                </div>

                {/* Refresh prompt for stale data */}
                {isStale && isOnline && (
                    <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                            This data is older than 24 hours. Tap refresh to get the latest market information.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Offline notice */}
                {!isOnline && (
                    <Alert>
                        <WifiOff className="h-4 w-4" />
                        <AlertDescription>
                            You're offline. Showing cached data from {formatDataAge(stats.timestamp)}.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}

export default MarketStats;