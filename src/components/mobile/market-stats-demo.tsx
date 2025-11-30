'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    MapPin,
    Search,
    Star,
    StarOff,
    Database,
    Trash2,
    Info
} from 'lucide-react';
import { MarketStats, MarketStatsProps } from './market-stats';
import {
    fetchMarketStatsAction
} from '@/features/client-dashboards/actions/mobile-actions';
import { useUser } from '@/aws/auth/use-user';

/**
 * Market Stats Demo Component
 * 
 * Demonstrates the market stats functionality including:
 * - Fetching market stats for locations
 * - Caching and offline support
 * - Favorited locations pre-caching
 * - Cache management
 */
export function MarketStatsDemo() {
    const { user } = useUser();
    const [location, setLocation] = useState('');
    const [currentStats, setCurrentStats] = useState<MarketStatsProps['stats']>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [isOnline, setIsOnline] = useState(true);
    const [favoritedLocations, setFavoritedLocations] = useState<string[]>([
        'Downtown Seattle, WA',
        'Beverly Hills, CA',
        'Austin, TX',
        'Miami Beach, FL'
    ]);
    // const [cacheStats, setCacheStats] = useState<any>();
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Monitor online status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Load cache stats on mount
    // useEffect(() => {
    //     if (user) {
    //         loadCacheStats();
    //     }
    // }, [user]);

    /* const loadCacheStats = async () => {
        if (!user) return;

        try {
            const result = await getMarketStatsCacheStatsAction({ userId: user.id });
            if (result.success && result.stats) {
                setCacheStats(result.stats);
            }
        } catch (error) {
            console.error('Failed to load cache stats:', error);
        }
    }; */

    const handleSearch = async (searchLocation?: string) => {
        const targetLocation = searchLocation || location.trim();

        if (!targetLocation || !user) {
            setError('Please enter a location');
            return;
        }

        setLoading(true);
        setError(undefined);

        try {
            const formData = new FormData();
            formData.append('location', targetLocation);

            const result = await fetchMarketStatsAction(null, formData);

            if (result.data?.stats) {
                setCurrentStats({
                    ...result.data.stats,
                    location: targetLocation,
                    timestamp: Date.parse(result.data.stats.timestamp)
                });

                // Add to recent searches
                setRecentSearches(prev => {
                    const updated = [targetLocation, ...prev.filter(l => l !== targetLocation)];
                    return updated.slice(0, 5); // Keep only 5 recent searches
                });

                // Clear location input if it was a manual search
                if (!searchLocation) {
                    setLocation('');
                }
            } else {
                setError(result.message || 'Failed to fetch market stats');
            }
        } catch (error: any) {
            setError(error.message || 'Failed to fetch market stats');
        } finally {
            setLoading(false);
            // await loadCacheStats(); // Refresh cache stats
        }
    };

    const handleRefresh = async () => {
        if (currentStats && user) {
            setLoading(true);
            try {
                const formData = new FormData();
                formData.append('location', currentStats.location);


                const result = await fetchMarketStatsAction(null, formData);

                if (result.data?.stats) {
                    setCurrentStats({
                        ...result.data.stats,
                        location: currentStats.location
                    });
                } else {
                    setError(result.message || 'Failed to refresh market stats');
                }
            } catch (error: any) {
                setError(error.message || 'Failed to refresh market stats');
            } finally {
                setLoading(false);
                // await loadCacheStats();
            }
        }
    };

    const handleToggleFavorite = (targetLocation: string) => {
        setFavoritedLocations(prev => {
            if (prev.includes(targetLocation)) {
                return prev.filter(l => l !== targetLocation);
            } else {
                return [...prev, targetLocation];
            }
        });
    };

    const handlePreCacheFavorites = async () => {
        // TODO: Implement preCacheFavoritedLocationsAction server action
        console.log('Pre-cache functionality not yet implemented');
        /*
        if (!user || favoritedLocations.length === 0) return;

        setLoading(true);
        try {
            const result = await preCacheFavoritedLocationsAction({
                favoritedLocations,
                userId: user.id
            });

            if (result.success) {
                console.log(`Pre-cached ${result.successCount} locations`);
            }
        } catch (error) {
            console.error('Failed to pre-cache favorites:', error);
        } finally {
            setLoading(false);
            await loadCacheStats();
        }
        */
    };

    const handleClearCache = async () => {
        // TODO: Implement clearMarketStatsCacheAction server action
        console.log('Clear cache functionality not yet implemented');
        /*
        if (!user) return;

        try {
            const result = await clearMarketStatsCacheAction({
                userId: user.id
            });

            if (result.success) {
                console.log(`Cleared ${result.clearedCount} cache entries`);
                setCacheStats(undefined);
                await loadCacheStats();
            }
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
        */
    };

    if (!user) {
        return (
            <Card className="w-full max-w-4xl mx-auto">
                <CardContent className="p-6">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Please sign in to use the market stats feature.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Search Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Market Stats Lookup
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Enter city, neighborhood, or ZIP code"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={() => handleSearch()}
                                disabled={loading || !location.trim()}
                            >
                                <Search className="h-4 w-4 mr-2" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                        <div>
                            <Label className="text-sm text-muted-foreground">Recent Searches</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {recentSearches.map((search, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSearch(search)}
                                        className="h-7 text-xs"
                                    >
                                        {search}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Market Stats Display */}
            {
                (currentStats || loading || error) && (
                    <MarketStats
                        location={currentStats?.location || location}
                        onRefresh={handleRefresh}
                        loading={loading}
                        stats={currentStats}
                        error={error}
                        isOnline={isOnline}
                    />
                )
            }

            {/* Favorited Locations */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5" />
                            Favorited Locations
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreCacheFavorites}
                            disabled={loading || favoritedLocations.length === 0}
                        >
                            <Database className="h-4 w-4 mr-2" />
                            Pre-Cache All
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {favoritedLocations.map((favLocation, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{favLocation}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSearch(favLocation)}
                                    disabled={loading}
                                >
                                    View Stats
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleFavorite(favLocation)}
                                >
                                    <StarOff className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {currentStats && !favoritedLocations.includes(currentStats.location) && (
                        <>
                            <Separator />
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{currentStats.location}</span>
                                    <Badge variant="secondary">Current</Badge>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleFavorite(currentStats.location)}
                                >
                                    <Star className="h-4 w-4" />
                                    Add to Favorites
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Cache Management */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Cache Management
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearCache}
                            disabled={!cacheStats || cacheStats.totalCached === 0}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear Cache
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {false ? ( // cacheStats disabled until server actions are implemented
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold">{cacheStats.totalCached}</div>
                                <div className="text-sm text-muted-foreground">Total Cached</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{cacheStats.freshData}</div>
                                <div className="text-sm text-muted-foreground">Fresh Data</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{cacheStats.staleData}</div>
                                <div className="text-sm text-muted-foreground">Stale Data</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{cacheStats.favoritedLocations}</div>
                                <div className="text-sm text-muted-foreground">Favorited</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{Math.round(cacheStats.newestCacheAge)}h</div>
                                <div className="text-sm text-muted-foreground">Newest</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{Math.round(cacheStats.oldestCacheAge)}h</div>
                                <div className="text-sm text-muted-foreground">Oldest</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            No cache data available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Connection Status */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm">
                            {isOnline ? 'Online - Live data available' : 'Offline - Using cached data'}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}

export default MarketStatsDemo;