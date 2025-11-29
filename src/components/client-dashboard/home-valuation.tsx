'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Home, TrendingUp, MapPin, Calendar, DollarSign, MessageSquare } from 'lucide-react';
import { generateValuationForDashboard } from '@/features/client-dashboards/actions/client-dashboard-actions';
import type { PropertyValuationOutput } from '@/aws/bedrock/flows/property-valuation';

interface HomeValuationProps {
    token: string;
    primaryColor: string;
    onContactAgent: () => void;
}

/**
 * Home Valuation Component
 * 
 * Provides a form for clients to request home valuations and displays results.
 * 
 * Features:
 * - Property address input
 * - Square footage, bedrooms, bathrooms
 * - Year built and property type
 * - Special features (optional)
 * - Displays valuation results with estimated value range
 * - Shows confidence level indicator
 * - Lists comparable properties used
 * - Displays market trends summary
 * - "Discuss This Valuation" CTA button
 * - Agent branding and disclaimer
 * 
 * Requirements: 5.1, 5.3
 */
export function HomeValuation({ token, primaryColor, onContactAgent }: HomeValuationProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [valuation, setValuation] = useState<PropertyValuationOutput | null>(null);

    // Form state
    const [address, setAddress] = useState('');
    const [squareFeet, setSquareFeet] = useState('');
    const [bedrooms, setBedrooms] = useState('');
    const [bathrooms, setBathrooms] = useState('');
    const [yearBuilt, setYearBuilt] = useState('');
    const [propertyType, setPropertyType] = useState('');
    const [specialFeatures, setSpecialFeatures] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Build property description
            const propertyDescription = `
Property Address: ${address}
Square Footage: ${squareFeet} sqft
Bedrooms: ${bedrooms}
Bathrooms: ${bathrooms}
Year Built: ${yearBuilt}
Property Type: ${propertyType}
${specialFeatures ? `Special Features: ${specialFeatures}` : ''}
            `.trim();

            const result = await generateValuationForDashboard(token, propertyDescription);

            if (result.message === 'success' && result.data) {
                setValuation(result.data);
            } else {
                setError(result.message || 'Failed to generate valuation');
            }
        } catch (err) {
            console.error('Valuation error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getConfidenceBadgeColor = (level: string) => {
        switch (level) {
            case 'high':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'low':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Valuation Request Form */}
            {!valuation && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Property Address */}
                        <div className="md:col-span-2">
                            <Label htmlFor="address">Property Address *</Label>
                            <Input
                                id="address"
                                type="text"
                                placeholder="123 Main St, City, State ZIP"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                                className="mt-1.5"
                            />
                        </div>

                        {/* Square Footage */}
                        <div>
                            <Label htmlFor="squareFeet">Square Footage *</Label>
                            <Input
                                id="squareFeet"
                                type="number"
                                placeholder="2000"
                                value={squareFeet}
                                onChange={(e) => setSquareFeet(e.target.value)}
                                required
                                min="1"
                                className="mt-1.5"
                            />
                        </div>

                        {/* Bedrooms */}
                        <div>
                            <Label htmlFor="bedrooms">Bedrooms *</Label>
                            <Input
                                id="bedrooms"
                                type="number"
                                placeholder="3"
                                value={bedrooms}
                                onChange={(e) => setBedrooms(e.target.value)}
                                required
                                min="0"
                                className="mt-1.5"
                            />
                        </div>

                        {/* Bathrooms */}
                        <div>
                            <Label htmlFor="bathrooms">Bathrooms *</Label>
                            <Input
                                id="bathrooms"
                                type="number"
                                step="0.5"
                                placeholder="2"
                                value={bathrooms}
                                onChange={(e) => setBathrooms(e.target.value)}
                                required
                                min="0"
                                className="mt-1.5"
                            />
                        </div>

                        {/* Year Built */}
                        <div>
                            <Label htmlFor="yearBuilt">Year Built *</Label>
                            <Input
                                id="yearBuilt"
                                type="number"
                                placeholder="2000"
                                value={yearBuilt}
                                onChange={(e) => setYearBuilt(e.target.value)}
                                required
                                min="1800"
                                max={new Date().getFullYear()}
                                className="mt-1.5"
                            />
                        </div>

                        {/* Property Type */}
                        <div className="md:col-span-2">
                            <Label htmlFor="propertyType">Property Type *</Label>
                            <Select value={propertyType} onValueChange={setPropertyType} required>
                                <SelectTrigger className="mt-1.5">
                                    <SelectValue placeholder="Select property type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single-family">Single Family Home</SelectItem>
                                    <SelectItem value="condo">Condominium</SelectItem>
                                    <SelectItem value="townhouse">Townhouse</SelectItem>
                                    <SelectItem value="multi-family">Multi-Family</SelectItem>
                                    <SelectItem value="land">Land</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Special Features */}
                        <div className="md:col-span-2">
                            <Label htmlFor="specialFeatures">Special Features (Optional)</Label>
                            <Textarea
                                id="specialFeatures"
                                placeholder="e.g., Pool, Updated kitchen, Large lot, Mountain views..."
                                value={specialFeatures}
                                onChange={(e) => setSpecialFeatures(e.target.value)}
                                rows={3}
                                className="mt-1.5"
                            />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                        style={{ backgroundColor: primaryColor }}
                        size="lg"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Generating Valuation...
                            </>
                        ) : (
                            <>
                                <Home className="mr-2 h-5 w-5" />
                                Get Home Valuation
                            </>
                        )}
                    </Button>
                </form>
            )}

            {/* Valuation Results */}
            {valuation && (
                <div className="space-y-6">
                    {/* Estimated Value Card */}
                    <Card className="border-2" style={{ borderColor: `${primaryColor}40` }}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-2xl">Estimated Home Value</CardTitle>
                                    <CardDescription className="mt-1">
                                        {valuation.propertyAnalysis?.address || address}
                                    </CardDescription>
                                </div>
                                <Badge className={getConfidenceBadgeColor(valuation.marketValuation.confidenceLevel)}>
                                    {valuation.marketValuation.confidenceLevel.toUpperCase()} CONFIDENCE
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Main Estimated Value */}
                            <div className="text-center py-6 rounded-lg" style={{ backgroundColor: `${primaryColor}10` }}>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Estimated Value</p>
                                <p className="text-4xl font-bold" style={{ color: primaryColor }}>
                                    {formatCurrency(valuation.marketValuation.estimatedValue)}
                                </p>
                            </div>

                            {/* Value Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Low Estimate</p>
                                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(valuation.marketValuation.valueRange.low)}
                                    </p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">High Estimate</p>
                                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(valuation.marketValuation.valueRange.high)}
                                    </p>
                                </div>
                            </div>

                            {/* Last Sale Info */}
                            {valuation.marketValuation.lastSaleInfo && (
                                <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Last Sale</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(valuation.marketValuation.lastSaleInfo.price || 0)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            {valuation.marketValuation.lastSaleInfo.date}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Comparable Properties */}
                    {valuation.comparableProperties && valuation.comparableProperties.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                                    Comparable Properties
                                </CardTitle>
                                <CardDescription>
                                    Recent sales in your area used for this valuation
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {valuation.comparableProperties.map((comp, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                                    {comp.address}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                    {comp.beds && <span>{comp.beds} beds</span>}
                                                    {comp.baths && <span>• {comp.baths} baths</span>}
                                                    {comp.sqft && <span>• {comp.sqft.toLocaleString()} sqft</span>}
                                                </div>
                                                {comp.saleDate && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                        Sold: {comp.saleDate}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {formatCurrency(comp.price)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Market Trends */}
                    {valuation.marketAnalysis && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" style={{ color: primaryColor }} />
                                    Market Analysis
                                </CardTitle>
                                <CardDescription>
                                    Current market conditions in your area
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Market Condition */}
                                <div className="p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}10` }}>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Market Condition</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {valuation.marketAnalysis.marketCondition}
                                    </p>
                                </div>

                                {/* Market Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    {valuation.marketAnalysis.medianPrice && (
                                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Median Price</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(valuation.marketAnalysis.medianPrice)}
                                            </p>
                                        </div>
                                    )}
                                    {valuation.marketAnalysis.averageDaysOnMarket && (
                                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg. Days on Market</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {valuation.marketAnalysis.averageDaysOnMarket} days
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Market Trends */}
                                {valuation.marketAnalysis.marketTrends && valuation.marketAnalysis.marketTrends.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Trends</p>
                                        <ul className="space-y-2">
                                            {valuation.marketAnalysis.marketTrends.map((trend, index) => (
                                                <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <span className="text-lg" style={{ color: primaryColor }}>•</span>
                                                    <span>{trend}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Key Factors */}
                    {valuation.keyFactors && valuation.keyFactors.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Key Valuation Factors</CardTitle>
                                <CardDescription>
                                    Factors influencing this property's value
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {valuation.keyFactors.map((factor, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <DollarSign className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                                            <span>{factor}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Recommendations */}
                    {valuation.recommendations && valuation.recommendations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Recommendations</CardTitle>
                                <CardDescription>
                                    Expert recommendations for your property
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {valuation.recommendations.map((rec, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <span className="text-lg" style={{ color: primaryColor }}>✓</span>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Disclaimer */}
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                            <strong>Disclaimer:</strong> {valuation.disclaimer}
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={onContactAgent}
                            className="flex-1"
                            style={{ backgroundColor: primaryColor }}
                            size="lg"
                        >
                            <MessageSquare className="mr-2 h-5 w-5" />
                            Discuss This Valuation
                        </Button>
                        <Button
                            onClick={() => setValuation(null)}
                            variant="outline"
                            className="flex-1"
                            size="lg"
                        >
                            Request Another Valuation
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
