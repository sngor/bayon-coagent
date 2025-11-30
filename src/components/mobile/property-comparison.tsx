'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Save, ArrowLeft, ArrowRight, MapPin, Bed, Bath, Square, Star, Heart, Share2, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/common';
import { TOUCH_FRIENDLY_CLASSES, MOBILE_LAYOUT_CLASSES } from '@/lib/mobile-optimization';
import { OfflineSyncManager } from '@/lib/offline-sync-manager';
import { savePropertyComparisonAction } from '@/features/client-dashboards/actions/mobile-actions';
import { cacheProperties, getCachedProperties, CachedProperty } from '@/lib/property-cache';
import { useSwipeGesture } from '@/hooks/use-gesture-handler';

export interface Property {
    id: string;
    address: string;
    price: number;
    size: number;
    beds: number;
    baths: number;
    features: string[];
    photos: string[];
}

export interface SavedComparison {
    id: string;
    properties: Property[];
    notes: string;
    createdAt: number;
}

export interface PropertyComparisonProps {
    properties: Property[];
    onSave: (comparison: SavedComparison) => void;
    userId: string;
    className?: string;
}

export function PropertyComparison({
    properties,
    onSave,
    userId,
    className
}: PropertyComparisonProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'side-by-side' | 'stacked'>('stacked');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncManager] = useState(() => new OfflineSyncManager());
    const [cachedProperties, setCachedProperties] = useState<Property[]>([]);
    const [usingCachedData, setUsingCachedData] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    // Auto-detect view mode based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setViewMode('side-by-side');
            } else {
                setViewMode('stacked');
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Monitor connectivity status
    useEffect(() => {
        const unsubscribe = syncManager.onConnectivityChange((online) => {
            setIsOnline(online);
        });

        return unsubscribe;
    }, [syncManager]);

    // Cache properties when online and load cached data when offline
    useEffect(() => {
        const handlePropertyCaching = async () => {
            if (properties.length === 0) return;

            if (isOnline) {
                // Cache current properties for offline use
                try {
                    const cachedProps: CachedProperty[] = properties.map(prop => ({
                        ...prop,
                        status: 'active' as const,
                        propertyType: 'residential'
                    }));
                    await cacheProperties(cachedProps);
                    setUsingCachedData(false);
                } catch (error) {
                    console.error('Failed to cache properties:', error);
                }
            } else {
                // Load cached properties when offline
                try {
                    const propertyIds = properties.map(p => p.id);
                    const cached = await getCachedProperties(propertyIds);

                    if (cached.length > 0) {
                        setCachedProperties(cached);
                        setUsingCachedData(true);
                        console.log(`Using ${cached.length} cached properties for offline comparison`);
                    } else {
                        setUsingCachedData(false);
                        console.warn('No cached properties available for offline comparison');
                    }
                } catch (error) {
                    console.error('Failed to load cached properties:', error);
                    setUsingCachedData(false);
                }
            }
        };

        handlePropertyCaching();
    }, [properties, isOnline]);

    // Handle swipe gestures for mobile using the gesture handler
    const handleSwipe = (direction: 'left' | 'right') => {
        if (viewMode === 'stacked') {
            if (direction === 'left' && currentIndex < displayProperties.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else if (direction === 'right' && currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
            }
        }
    };

    // Use the gesture handler hook for swipe detection
    const { ref: swipeRef } = useSwipeGesture((gesture) => {
        if (gesture.direction === 'left') {
            handleSwipe('left');
        } else if (gesture.direction === 'right') {
            handleSwipe('right');
        }
    }, {
        swipeThreshold: 50,
        swipeVelocityThreshold: 0.3,
        hapticFeedback: true,
        visualFeedback: false, // Disable visual feedback since we have our own animation
    });

    // Save comparison
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const comparison: SavedComparison = {
                id: `comparison-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                properties: displayProperties,
                notes,
                createdAt: Date.now()
            };

            if (isOnline) {
                // Save directly when online
                try {
                    const result = await savePropertyComparisonAction({
                        id: comparison.id,
                        properties: comparison.properties,
                        notes: comparison.notes,
                        createdAt: comparison.createdAt,
                        userId
                    });

                    if (result.success) {
                        console.log('Property comparison saved successfully');
                        await onSave(comparison);
                    } else {
                        throw new Error(result.error || 'Failed to save comparison');
                    }
                } catch (error) {
                    console.error('Online save failed, queuing for offline sync:', error);
                    // Fall back to offline queue
                    await syncManager.queueOperation({
                        type: 'comparison',
                        data: {
                            id: comparison.id,
                            properties: comparison.properties,
                            notes: comparison.notes,
                            createdAt: comparison.createdAt,
                            userId
                        },
                        timestamp: Date.now()
                    });
                    await onSave(comparison);
                }
            } else {
                // Queue for sync when offline
                await syncManager.queueOperation({
                    type: 'comparison',
                    data: {
                        id: comparison.id,
                        properties: comparison.properties,
                        notes: comparison.notes,
                        createdAt: comparison.createdAt,
                        userId
                    },
                    timestamp: Date.now()
                });
                console.log('Property comparison queued for sync when online');
                await onSave(comparison);
            }
        } catch (error) {
            console.error('Failed to save comparison:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Format price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    // Format size
    const formatSize = (size: number) => {
        return new Intl.NumberFormat('en-US').format(size);
    };

    // Render property card
    const renderPropertyCard = (property: Property, index: number) => (
        <Card key={property.id} className="w-full flex-shrink-0">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold truncate">
                            {formatPrice(property.price)}
                        </CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{property.address}</span>
                        </div>
                    </div>
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                        {index + 1} of {displayProperties.length}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Property Image */}
                {property.photos.length > 0 && (
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                        <img
                            src={property.photos[0]}
                            alt={property.address}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Bed className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-lg font-semibold">{property.beds}</div>
                        <div className="text-xs text-muted-foreground">Beds</div>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Bath className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-lg font-semibold">{property.baths}</div>
                        <div className="text-xs text-muted-foreground">Baths</div>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Square className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-lg font-semibold">{formatSize(property.size)}</div>
                        <div className="text-xs text-muted-foreground">Sq Ft</div>
                    </div>
                </div>

                {/* Features */}
                {property.features.length > 0 && (
                    <div>
                        <h4 className="font-headline text-sm font-medium mb-2">Features</h4>
                        <div className="flex flex-wrap gap-1">
                            {property.features.slice(0, 6).map((feature, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                    {feature}
                                </Badge>
                            ))}
                            {property.features.length > 6 && (
                                <Badge variant="outline" className="text-xs">
                                    +{property.features.length - 6} more
                                </Badge>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    // Use cached properties when offline, otherwise use provided properties
    const displayProperties = !isOnline && usingCachedData ? cachedProperties : properties;

    if (displayProperties.length === 0) {
        return (
            <Card className={cn("w-full", className)}>
                <CardContent className="p-8 text-center">
                    <div className="text-muted-foreground">
                        <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="font-headline text-lg font-medium mb-2">
                            {!isOnline ? 'No Cached Properties Available' : 'No Properties to Compare'}
                        </h3>
                        <p className="text-sm">
                            {!isOnline
                                ? 'Properties need to be viewed online first to be available offline.'
                                : 'Add properties to start comparing them side by side.'
                            }
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={cn("w-full space-y-4", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="font-headline text-xl font-semibold">Property Comparison</h2>
                    {!isOnline && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <WifiOff className="w-3 h-3" />
                            Offline
                        </Badge>
                    )}
                    {usingCachedData && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Square className="w-3 h-3" />
                            Cached Data
                        </Badge>
                    )}
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={TOUCH_FRIENDLY_CLASSES.button}
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : isOnline ? 'Save' : 'Save Offline'}
                </Button>
            </div>

            {/* Properties Display */}
            {viewMode === 'side-by-side' ? (
                // Side-by-side view for larger screens
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayProperties.map((property, index) => renderPropertyCard(property, index))}
                </div>
            ) : (
                // Stacked view for mobile with swipe support
                <div className="relative">
                    <div
                        ref={(el) => {
                            scrollContainerRef.current = el;
                            // Apply swipe ref using type assertion to work around readonly
                            if (el && swipeRef) {
                                (swipeRef as any).current = el;
                            }
                        }}
                        className="overflow-hidden"
                    >
                        <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{
                                transform: `translateX(-${currentIndex * 100}%)`,
                                width: `${displayProperties.length * 100}%`
                            }}
                        >
                            {displayProperties.map((property, index) => (
                                <div key={property.id} className="w-full px-2">
                                    {renderPropertyCard(property, index)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Controls */}
                    {displayProperties.length > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <Button
                                onClick={() => handleSwipe('right')}
                                disabled={currentIndex === 0}
                                variant="outline"
                                size="sm"
                                className={TOUCH_FRIENDLY_CLASSES.button}
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Previous
                            </Button>

                            <div className="flex space-x-1">
                                {displayProperties.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentIndex(index)}
                                        className={cn(
                                            "w-2 h-2 rounded-full transition-colors",
                                            index === currentIndex ? "bg-primary" : "bg-muted"
                                        )}
                                        aria-label={`Go to property ${index + 1}`}
                                        title={`Go to property ${index + 1}`}
                                    />
                                ))}
                            </div>

                            <Button
                                onClick={() => handleSwipe('left')}
                                disabled={currentIndex === displayProperties.length - 1}
                                variant="outline"
                                size="sm"
                                className={TOUCH_FRIENDLY_CLASSES.button}
                            >
                                Next
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Notes Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Comparison Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="Add your notes about this comparison..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className={cn(TOUCH_FRIENDLY_CLASSES.input, "min-h-[100px]")}
                    />
                </CardContent>
            </Card>

            {/* Swipe Instructions for Mobile */}
            {viewMode === 'stacked' && displayProperties.length > 1 && (
                <div className="text-center text-sm text-muted-foreground">
                    Swipe left or right to compare properties
                </div>
            )}
        </div>
    );
}