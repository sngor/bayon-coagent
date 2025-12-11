'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Home, MapPin, Bed, Bath, Square } from 'lucide-react';

interface Property {
    ListingId: string;
    UnparsedAddress: string;
    City: string;
    StateOrProvince: string;
    ListPrice: number;
    BedroomsTotal: number;
    BathroomsTotalInteger: number;
    LivingArea: number;
    StandardStatus: string;
    PropertyType: string;
    OriginatingSystemName: string;
    Media?: Array<{
        MediaURL: string;
        MediaCategory?: string;
        Order?: number;
    }>;
}

export default function TestMLSPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProperties = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/test-mls-properties');

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setProperties(data.properties || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch properties');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatSquareFeet = (sqft: number) => {
        return new Intl.NumberFormat('en-US').format(sqft);
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">MLS Grid Demo Test</h1>
                <p className="text-muted-foreground">
                    Test the MLS Grid API integration with live demo data
                </p>
            </div>

            <div className="mb-6">
                <Button
                    onClick={fetchProperties}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading Properties...
                        </>
                    ) : (
                        <>
                            <Home className="h-4 w-4" />
                            Fetch Demo Properties
                        </>
                    )}
                </Button>
            </div>

            {error && (
                <Card className="mb-6 border-destructive">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
                            <span className="font-semibold">Error:</span>
                            <span>{error}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {properties.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">
                            Found {properties.length} Properties
                        </h2>
                        <Badge variant="secondary">
                            Demo Data from MLS Grid
                        </Badge>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {properties.map((property) => (
                            <Card key={property.ListingId} className="overflow-hidden">
                                {property.Media && property.Media.length > 0 && (
                                    <div className="aspect-video relative bg-muted">
                                        <img
                                            src={property.Media[0].MediaURL}
                                            alt={property.UnparsedAddress}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}

                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-lg leading-tight">
                                            {formatPrice(property.ListPrice)}
                                        </CardTitle>
                                        <Badge
                                            variant={property.StandardStatus === 'Active' ? 'default' : 'secondary'}
                                            className="shrink-0"
                                        >
                                            {property.StandardStatus}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                        <div className="text-sm">
                                            <div className="font-medium">{property.UnparsedAddress}</div>
                                            <div className="text-muted-foreground">
                                                {property.City}, {property.StateOrProvince}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Bed className="h-4 w-4 text-muted-foreground" />
                                            <span>{property.BedroomsTotal || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Bath className="h-4 w-4 text-muted-foreground" />
                                            <span>{property.BathroomsTotalInteger || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Square className="h-4 w-4 text-muted-foreground" />
                                            <span>{formatSquareFeet(property.LivingArea || 0)}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                                        <div>Type: {property.PropertyType}</div>
                                        <div>MLS: {property.OriginatingSystemName}</div>
                                        <div>ID: {property.ListingId}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {!loading && !error && properties.length === 0 && (
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Properties Loaded</h3>
                        <p className="text-muted-foreground mb-4">
                            Click "Fetch Demo Properties" to load sample data from MLS Grid
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}