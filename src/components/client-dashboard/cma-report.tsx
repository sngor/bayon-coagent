'use client';

import { useMemo } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Home, TrendingUp, Calendar, DollarSign, MapPin, Bed, Bath, Maximize } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * CMA Report Component
 * 
 * Comprehensive visualization component for Comparative Market Analysis reports.
 * Includes:
 * - Property comparison table (subject vs comparables)
 * - Price trend chart (using recharts)
 * - Map showing subject property and comparables (react-google-maps)
 * - Market statistics cards (median price, DOM, inventory level)
 * - Price recommendation callout
 * 
 * Requirements: 3.5
 */

interface SubjectProperty {
    address: string;
    beds: number;
    baths: number;
    sqft: number;
    yearBuilt: number;
}

interface ComparableProperty {
    address: string;
    soldPrice: number;
    soldDate: string;
    beds: number;
    baths: number;
    sqft: number;
    distance: number;
}

interface MarketTrends {
    medianPrice: number;
    daysOnMarket: number;
    inventoryLevel: 'low' | 'medium' | 'high';
}

interface PriceRecommendation {
    low: number;
    mid: number;
    high: number;
}

interface CMAReportProps {
    subjectProperty: SubjectProperty;
    comparables: ComparableProperty[];
    marketTrends: MarketTrends;
    priceRecommendation: PriceRecommendation;
    agentNotes?: string;
    primaryColor?: string;
    onContactAgent?: () => void;
}

export function CMAReport({
    subjectProperty,
    comparables,
    marketTrends,
    priceRecommendation,
    agentNotes,
    primaryColor = '#3b82f6',
    onContactAgent,
}: CMAReportProps) {
    // Prepare data for price trend chart
    const priceChartData = useMemo(() => {
        const sortedComps = [...comparables].sort(
            (a, b) => new Date(a.soldDate).getTime() - new Date(b.soldDate).getTime()
        );

        return sortedComps.map((comp) => ({
            date: new Date(comp.soldDate).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
            }),
            price: comp.soldPrice,
            pricePerSqft: Math.round(comp.soldPrice / comp.sqft),
            address: comp.address.split(',')[0], // Short address for tooltip
        }));
    }, [comparables]);

    // Prepare data for comparison bar chart
    const comparisonData = useMemo(() => {
        return comparables.map((comp, index) => ({
            name: `Comp ${index + 1}`,
            price: comp.soldPrice,
            pricePerSqft: Math.round(comp.soldPrice / comp.sqft),
            address: comp.address.split(',')[0],
        }));
    }, [comparables]);

    // Calculate average price per sqft
    const avgPricePerSqft = useMemo(() => {
        const total = comparables.reduce((sum, comp) => sum + comp.soldPrice / comp.sqft, 0);
        return Math.round(total / comparables.length);
    }, [comparables]);

    // Estimated value based on subject property sqft
    const estimatedValue = useMemo(() => {
        return Math.round(avgPricePerSqft * subjectProperty.sqft);
    }, [avgPricePerSqft, subjectProperty.sqft]);

    // Inventory level color
    const inventoryColor = {
        low: '#ef4444', // red
        medium: '#f59e0b', // amber
        high: '#10b981', // green
    }[marketTrends.inventoryLevel];

    return (
        <div className="space-y-6">
            {/* Price Recommendation Callout */}
            <Card
                className="border-2 shadow-lg"
                style={{ borderColor: primaryColor }}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${primaryColor}20` }}
                        >
                            <DollarSign className="h-6 w-6" style={{ color: primaryColor }} />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Price Recommendation</CardTitle>
                            <CardDescription>Based on comparative market analysis</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Low</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                ${priceRecommendation.low.toLocaleString()}
                            </p>
                        </div>
                        <div
                            className="text-center p-4 rounded-lg"
                            style={{ backgroundColor: `${primaryColor}15` }}
                        >
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Recommended</p>
                            <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                                ${priceRecommendation.mid.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">High</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                ${priceRecommendation.high.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Average Price per Sq Ft:</strong> ${avgPricePerSqft.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            <strong>Estimated Value:</strong> ${estimatedValue.toLocaleString()} (based on {subjectProperty.sqft.toLocaleString()} sq ft)
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Market Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg">Median Price</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            ${marketTrends.medianPrice.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Market median
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-amber-600" />
                            <CardTitle className="text-lg">Days on Market</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {marketTrends.daysOnMarket}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Average days
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Home className="h-5 w-5" style={{ color: inventoryColor }} />
                            <CardTitle className="text-lg">Inventory Level</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Badge
                            variant="outline"
                            className="text-lg px-3 py-1"
                            style={{
                                borderColor: inventoryColor,
                                color: inventoryColor,
                            }}
                        >
                            {marketTrends.inventoryLevel.toUpperCase()}
                        </Badge>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {marketTrends.inventoryLevel === 'low' && 'Seller\'s market'}
                            {marketTrends.inventoryLevel === 'medium' && 'Balanced market'}
                            {marketTrends.inventoryLevel === 'high' && 'Buyer\'s market'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Subject Property Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                        Subject Property
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {subjectProperty.address}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2">
                                <Bed className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">
                                    <strong>{subjectProperty.beds}</strong> beds
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Bath className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">
                                    <strong>{subjectProperty.baths}</strong> baths
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Maximize className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">
                                    <strong>{subjectProperty.sqft.toLocaleString()}</strong> sq ft
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">
                                    Built <strong>{subjectProperty.yearBuilt}</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Property Comparison Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Comparable Properties</CardTitle>
                    <CardDescription>
                        {comparables.length} comparable properties used in this analysis
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800">
                                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                                        Address
                                    </th>
                                    <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                                        Sold Price
                                    </th>
                                    <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                                        $/Sq Ft
                                    </th>
                                    <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                                        Beds
                                    </th>
                                    <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                                        Baths
                                    </th>
                                    <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                                        Sq Ft
                                    </th>
                                    <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                                        Distance
                                    </th>
                                    <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                                        Sold Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparables.map((comp, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    >
                                        <td className="py-3 px-2 text-gray-900 dark:text-white">
                                            {comp.address}
                                        </td>
                                        <td className="py-3 px-2 text-right font-semibold text-gray-900 dark:text-white">
                                            ${comp.soldPrice.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                                            ${Math.round(comp.soldPrice / comp.sqft).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-2 text-center text-gray-700 dark:text-gray-300">
                                            {comp.beds}
                                        </td>
                                        <td className="py-3 px-2 text-center text-gray-700 dark:text-gray-300">
                                            {comp.baths}
                                        </td>
                                        <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                                            {comp.sqft.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                                            {comp.distance.toFixed(2)} mi
                                        </td>
                                        <td className="py-3 px-2 text-center text-gray-700 dark:text-gray-300">
                                            {new Date(comp.soldDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Price Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Price Trends</CardTitle>
                    <CardDescription>
                        Historical sale prices of comparable properties
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={priceChartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                            <XAxis
                                dataKey="date"
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                            />
                            <YAxis
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                }}
                                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Price']}
                                labelFormatter={(label) => `Sold: ${label}`}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke={primaryColor}
                                strokeWidth={2}
                                dot={{ fill: primaryColor, r: 4 }}
                                activeDot={{ r: 6 }}
                                name="Sale Price"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Price per Sq Ft Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Price per Square Foot Comparison</CardTitle>
                    <CardDescription>
                        Comparing value across comparable properties
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={comparisonData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                            <XAxis
                                dataKey="name"
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                            />
                            <YAxis
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                }}
                                formatter={(value: any, name: string) => [
                                    `$${value.toLocaleString()}`,
                                    name === 'pricePerSqft' ? 'Price/Sq Ft' : 'Total Price',
                                ]}
                            />
                            <Legend />
                            <Bar dataKey="pricePerSqft" name="Price per Sq Ft" radius={[8, 8, 0, 0]}>
                                {comparisonData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={primaryColor} opacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Map showing properties */}
            <Card>
                <CardHeader>
                    <CardTitle>Property Locations</CardTitle>
                    <CardDescription>
                        Subject property and comparable properties on map
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PropertyMap
                        subjectProperty={subjectProperty}
                        comparables={comparables}
                        primaryColor={primaryColor}
                    />
                </CardContent>
            </Card>

            {/* Agent Notes */}
            {agentNotes && (
                <Card>
                    <CardHeader>
                        <CardTitle>Agent Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {agentNotes}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Questions About This Report?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Contact your agent to discuss this analysis and next steps
                        </p>
                        <Button
                            size="lg"
                            style={{ backgroundColor: primaryColor, color: '#ffffff' }}
                            onClick={onContactAgent}
                        >
                            Discuss This Report
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Property Map Component
 * 
 * Displays subject property and comparables on Google Maps
 */
interface PropertyMapProps {
    subjectProperty: SubjectProperty;
    comparables: ComparableProperty[];
    primaryColor: string;
}

function PropertyMap({ subjectProperty, comparables, primaryColor }: PropertyMapProps) {
    // Note: In a real implementation, you would geocode addresses to get lat/lng
    // For this demo, we'll use placeholder coordinates
    // You would need to integrate with a geocoding service like Google Geocoding API

    const mapContainerStyle = {
        width: '100%',
        height: '400px',
        borderRadius: '8px',
    };

    // Placeholder center (would be calculated from actual property locations)
    const center = {
        lat: 37.7749,
        lng: -122.4194,
    };

    return (
        <div className="relative">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Interactive map visualization
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                    Map integration requires Google Maps API key configuration
                </p>
                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: primaryColor }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            Subject Property: {subjectProperty.address}
                        </span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            {comparables.length} Comparable Properties
                        </span>
                    </div>
                </div>
            </div>

            {/* Uncomment when Google Maps API key is configured */}
            {/* <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={13}
                >
                    <Marker
                        position={center}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: primaryColor,
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                        }}
                        title={subjectProperty.address}
                    />
                    {comparables.map((comp, index) => (
                        <Marker
                            key={index}
                            position={{ lat: center.lat + (Math.random() - 0.5) * 0.02, lng: center.lng + (Math.random() - 0.5) * 0.02 }}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 7,
                                fillColor: '#9ca3af',
                                fillOpacity: 0.8,
                                strokeColor: '#ffffff',
                                strokeWeight: 2,
                            }}
                            title={comp.address}
                        />
                    ))}
                </GoogleMap>
            </LoadScript> */}
        </div>
    );
}
