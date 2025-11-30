'use client';

/**
 * Neighborhood Profile Generator Component
 * 
 * Provides UI for generating neighborhood profiles with location input,
 * generation progress, profile preview, and export functionality.
 * 
 * Requirements: 5.1-5.10
 */

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { MapPin, Loader2, FileText, Globe, CheckCircle, Download } from 'lucide-react';
import type { NeighborhoodProfile } from '@/lib/alerts/types';
import type { Profile } from '@/lib/types/common';
import { useUser } from '@/aws/auth';

interface NeighborhoodProfileGeneratorProps {
    onProfileGenerated?: (profile: NeighborhoodProfile) => void;
    className?: string;
}

export function NeighborhoodProfileGenerator({
    onProfileGenerated,
    className
}: NeighborhoodProfileGeneratorProps) {
    const { user } = useUser();
    const [location, setLocation] = useState('');
    const [generatedProfile, setGeneratedProfile] = useState<NeighborhoodProfile | null>(null);
    const [agentProfile, setAgentProfile] = useState<Profile>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState<'pdf' | 'html' | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleGenerate = async () => {
        if (!location.trim()) {
            toast({
                variant: 'destructive',
                title: 'Location Required',
                description: 'Please enter a location to generate a neighborhood profile.'
            });
            return;
        }

        if (!user?.id) {
            toast({
                variant: 'destructive',
                title: 'Authentication Required',
                description: 'Please log in to generate neighborhood profiles.'
            });
            return;
        }

        setIsGenerating(true);

        startTransition(async () => {
            try {
                // Import the server action
                const { generateNeighborhoodProfileAction } = await import('@/app/actions');

                // Create form data
                const formData = new FormData();
                formData.set('location', location.trim());

                // Call the server action
                const result = await generateNeighborhoodProfileAction({}, formData);

                if (result.message === 'success' && result.data) {
                    const profile = result.data;
                    setGeneratedProfile(profile);
                    onProfileGenerated?.(profile);

                    toast({
                        title: 'Profile Generated',
                        description: `Neighborhood profile for ${location} has been generated successfully.`
                    });

                    // Get agent profile for export functionality
                    const { getRepository, getUserProfileKeys } = await import('@/aws/dynamodb');
                    const repository = getRepository();
                    const profileKeys = getUserProfileKeys(user.id);
                    const userProfileResult = await repository.get(profileKeys.PK, profileKeys.SK);

                    if (userProfileResult && typeof userProfileResult === 'object' && 'Data' in userProfileResult && userProfileResult.Data) {
                        setAgentProfile(userProfileResult.Data as Profile);
                    }

                } else {
                    throw new Error(result.message || 'Failed to generate neighborhood profile');
                }

            } catch (error) {
                console.error('Profile generation failed:', error);
                toast({
                    variant: 'destructive',
                    title: 'Generation Failed',
                    description: 'Could not generate neighborhood profile. Please try again.'
                });
            } finally {
                setIsGenerating(false);
            }
        });
    };

    const handleExport = async (format: 'pdf' | 'html') => {
        if (!generatedProfile) return;

        setIsExporting(format);

        try {
            // Import the server action
            const { exportNeighborhoodProfileAction } = await import('@/app/actions');

            // Call the server action
            const result = await exportNeighborhoodProfileAction(generatedProfile.id, format);

            if (result.message === 'Export generated successfully' && result.data?.url) {
                // Open the export URL in a new tab
                window.open(result.data.url, '_blank');

                toast({
                    title: 'Export Complete',
                    description: `Your neighborhood profile has been exported as ${format.toUpperCase()}.`
                });
            } else {
                throw new Error(result.message || 'Failed to export neighborhood profile');
            }

        } catch (error) {
            console.error('Export failed:', error);
            toast({
                variant: 'destructive',
                title: 'Export Failed',
                description: `Could not export profile as ${format.toUpperCase()}. Please try again.`
            });
        } finally {
            setIsExporting(null);
        }
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Generation Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Generate Neighborhood Profile
                    </CardTitle>
                    <CardDescription>
                        Create a comprehensive neighborhood analysis with market data, demographics, schools, and amenities.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <div className="flex gap-2">
                            <Input
                                id="location"
                                placeholder="Enter address, city, or ZIP code..."
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                disabled={isGenerating || isPending}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleGenerate();
                                    }
                                }}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating || isPending || !location.trim()}
                            >
                                {isGenerating || isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <MapPin className="h-4 w-4 mr-2" />
                                )}
                                {isGenerating || isPending ? 'Generating...' : 'Generate Profile'}
                            </Button>
                        </div>
                    </div>

                    {(isGenerating || isPending) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                <div>
                                    <p className="font-medium text-blue-900">Generating neighborhood profile...</p>
                                    <p className="text-sm text-blue-700">
                                        This may take up to 60 seconds as we gather data from multiple sources.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Generated Profile Preview */}
            {generatedProfile && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    Profile Generated
                                </CardTitle>
                                <CardDescription>
                                    Neighborhood profile for {generatedProfile.location}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExport('pdf')}
                                    disabled={isExporting === 'pdf'}
                                >
                                    {isExporting === 'pdf' ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <FileText className="h-4 w-4 mr-2" />
                                    )}
                                    Export PDF
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExport('html')}
                                    disabled={isExporting === 'html'}
                                >
                                    {isExporting === 'html' ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Globe className="h-4 w-4 mr-2" />
                                    )}
                                    Export HTML
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* AI Insights Preview */}
                        <div>
                            <h4 className="font-headline font-semibold mb-2">AI Insights</h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-700 line-clamp-4">
                                    {generatedProfile.aiInsights}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Market Data Summary */}
                        <div>
                            <h4 className="font-headline font-semibold mb-3">Market Summary</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 rounded-lg p-3 text-center">
                                    <p className="text-sm text-blue-600 font-medium">Median Price</p>
                                    <p className="text-lg font-bold text-blue-900">
                                        ${generatedProfile.marketData.medianSalePrice.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <p className="text-sm text-green-600 font-medium">Avg. DOM</p>
                                    <p className="text-lg font-bold text-green-900">
                                        {generatedProfile.marketData.avgDaysOnMarket} days
                                    </p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3 text-center">
                                    <p className="text-sm text-purple-600 font-medium">Sales Volume</p>
                                    <p className="text-lg font-bold text-purple-900">
                                        {generatedProfile.marketData.salesVolume}
                                    </p>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-3 text-center">
                                    <p className="text-sm text-orange-600 font-medium">Walkability</p>
                                    <p className="text-lg font-bold text-orange-900">
                                        {generatedProfile.walkabilityScore}/100
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Demographics Summary */}
                        <div>
                            <h4 className="font-headline font-semibold mb-3">Demographics</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm text-gray-600 font-medium">Population</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {generatedProfile.demographics.population.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm text-gray-600 font-medium">Median Income</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        ${generatedProfile.demographics.medianHouseholdIncome.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm text-gray-600 font-medium">Avg. Household Size</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {generatedProfile.demographics.householdComposition.averageHouseholdSize.toFixed(1)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Schools Preview */}
                        {generatedProfile.schools.length > 0 && (
                            <div>
                                <h4 className="font-headline font-semibold mb-3">Top Schools</h4>
                                <div className="space-y-2">
                                    {generatedProfile.schools.slice(0, 3).map((school, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium">{school.name}</p>
                                                <p className="text-sm text-gray-600">
                                                    {school.type.charAt(0).toUpperCase() + school.type.slice(1)} • {school.grades}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">{school.rating}/10</p>
                                                <p className="text-sm text-gray-600">{school.distance.toFixed(1)} mi</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Amenities Preview */}
                        <div>
                            <h4 className="font-headline font-semibold mb-3">Nearby Amenities</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {generatedProfile.amenities.restaurants.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">Restaurants</p>
                                        <div className="space-y-1">
                                            {generatedProfile.amenities.restaurants.slice(0, 3).map((restaurant, index) => (
                                                <div key={index} className="flex justify-between text-sm">
                                                    <span>{restaurant.name}</span>
                                                    <span className="text-gray-500">{restaurant.distance.toFixed(1)} mi</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {generatedProfile.amenities.parks.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">Parks</p>
                                        <div className="space-y-1">
                                            {generatedProfile.amenities.parks.slice(0, 3).map((park, index) => (
                                                <div key={index} className="flex justify-between text-sm">
                                                    <span>{park.name}</span>
                                                    <span className="text-gray-500">{park.distance.toFixed(1)} mi</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> This profile has been saved to your Library under Reports.
                                You can export it as PDF or HTML to share with clients.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}