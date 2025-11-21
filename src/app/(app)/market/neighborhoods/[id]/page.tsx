/**
 * Neighborhood Profile Viewer Page
 * 
 * Displays formatted neighborhood profiles with sections, interactive charts,
 * maps for amenities, and export/regenerate functionality.
 * 
 * Requirements: 5.1-5.10, 8.5
 */

import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MapPin,
    TrendingUp,
    Users,
    GraduationCap,
    Coffee,
    Calendar,
    DollarSign,
    Clock,
    Home,
    BarChart3,
    Map
} from 'lucide-react';
import { NeighborhoodProfileExportButtons } from '@/components/neighborhood-profile/neighborhood-profile-export-client';
import { RegenerateButton } from '@/components/neighborhood-profile/regenerate-button';
import { getRepository } from '@/aws/dynamodb/repository';
import { getNeighborhoodProfileKeys } from '@/aws/dynamodb/keys';
import { getCurrentUser } from '@/aws/auth/cognito-client';
import type { NeighborhoodProfile } from '@/lib/alerts/types';

interface NeighborhoodProfilePageProps {
    params: {
        id: string;
    };
}

async function getNeighborhoodProfile(profileId: string): Promise<NeighborhoodProfile | null> {
    try {
        const user = await getCurrentUser();
        if (!user?.id) return null;

        const repository = getRepository();
        const profileKeys = getNeighborhoodProfileKeys(user.id, profileId);
        const result = await repository.get(profileKeys.PK, profileKeys.SK);

        return result as NeighborhoodProfile || null;
    } catch (error) {
        console.error('Failed to fetch neighborhood profile:', error);
        return null;
    }
}

function LoadingSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded"></div>
                    ))}
                </div>

                <div className="h-64 bg-gray-200 rounded mb-6"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
            </div>
        </div>
    );
}

async function NeighborhoodProfileContent({ profileId }: { profileId: string }) {
    const profile = await getNeighborhoodProfile(profileId);

    if (!profile) {
        notFound();
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="h-8 w-8 text-blue-600" />
                        {profile.location}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Generated on {formatDate(profile.generatedAt)}
                    </p>
                </div>
                <div className="flex gap-2">
                    <NeighborhoodProfileExportButtons
                        profileId={profile.id}
                        className="flex-shrink-0"
                    />
                    <RegenerateButton profileId={profile.id} />
                </div>
            </div>

            {/* Market Data Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Median Price</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${profile.marketData.medianSalePrice.toLocaleString()}
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg. Days on Market</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {profile.marketData.avgDaysOnMarket}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Sales Volume</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {profile.marketData.salesVolume}
                                </p>
                            </div>
                            <Home className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Walkability</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {profile.walkabilityScore}/100
                                </p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Market Data History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Price History (12 Months)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {profile.marketData.priceHistory.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {profile.marketData.priceHistory.slice(-6).map((data, index) => {
                                    const date = new Date(data.month);
                                    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                                    return (
                                        <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm font-medium text-gray-600">{monthName}</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                ${(data.medianPrice / 1000).toFixed(0)}K
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">
                                Price history data will be available once market data is collected.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Market Analysis & Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed">
                            {profile.aiInsights}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Demographics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Demographics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Population</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {profile.demographics.population.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Median Household Income</p>
                                <p className="text-xl font-bold text-gray-900">
                                    ${profile.demographics.medianHouseholdIncome.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg. Household Size</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {profile.demographics.householdComposition.averageHouseholdSize.toFixed(1)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900">Age Distribution</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Under 18</span>
                                    <span className="text-sm font-medium">{profile.demographics.ageDistribution.under18.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">18-34</span>
                                    <span className="text-sm font-medium">{profile.demographics.ageDistribution.age18to34.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">35-54</span>
                                    <span className="text-sm font-medium">{profile.demographics.ageDistribution.age35to54.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">55-74</span>
                                    <span className="text-sm font-medium">{profile.demographics.ageDistribution.age55to74.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">75+</span>
                                    <span className="text-sm font-medium">{profile.demographics.ageDistribution.over75.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900">Household Composition</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Family Households</span>
                                    <span className="text-sm font-medium">{profile.demographics.householdComposition.familyHouseholds.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Non-Family Households</span>
                                    <span className="text-sm font-medium">{profile.demographics.householdComposition.nonFamilyHouseholds.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Schools */}
            {profile.schools.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Schools
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {profile.schools.map((school, index) => (
                                <div key={index} className="border rounded-lg p-4 space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{school.name}</h4>
                                            <p className="text-sm text-gray-600">
                                                {school.type.charAt(0).toUpperCase() + school.type.slice(1)} • {school.grades}
                                            </p>
                                        </div>
                                        <Badge variant={school.rating >= 8 ? "default" : school.rating >= 6 ? "secondary" : "outline"}>
                                            {school.rating}/10
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {school.distance.toFixed(1)} miles away
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Amenities */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Coffee className="h-5 w-5" />
                        Lifestyle & Amenities
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Walkability Score */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">Walkability Score</h4>
                            <span className="text-2xl font-bold text-blue-600">{profile.walkabilityScore}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 relative">
                            <div
                                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-300 absolute top-0 left-0"
                                style={{ width: `${profile.walkabilityScore}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {profile.walkabilityScore >= 90 ? "Walker's Paradise" :
                                profile.walkabilityScore >= 70 ? "Very Walkable" :
                                    profile.walkabilityScore >= 50 ? "Somewhat Walkable" :
                                        profile.walkabilityScore >= 25 ? "Car-Dependent" : "Car-Dependent"}
                        </p>
                    </div>

                    {/* Amenities Map Visualization */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Map className="h-5 w-5" />
                            <h4 className="font-semibold text-gray-900">Nearby Amenities</h4>
                        </div>

                        {/* Distance-based visualization */}
                        <div className="space-y-4">
                            {Object.entries(profile.amenities).map(([category, items]) => {
                                const categoryIcon = {
                                    restaurants: '🍽️',
                                    shopping: '🛍️',
                                    parks: '🌳',
                                    healthcare: '🏥',
                                    entertainment: '🎭'
                                }[category] || '📍';

                                const nearbyItems = (items as any[]).filter((item: any) => item.distance <= 1);
                                if (nearbyItems.length === 0) return null;

                                return (
                                    <div key={category} className="border rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-lg">{categoryIcon}</span>
                                            <h5 className="font-medium text-gray-900 capitalize">
                                                {category.replace(/([A-Z])/g, ' $1').trim()}
                                            </h5>
                                            <Badge variant="secondary" className="ml-auto">
                                                {nearbyItems.length} within 1 mile
                                            </Badge>
                                        </div>

                                        {/* Distance visualization */}
                                        <div className="space-y-2">
                                            {nearbyItems.slice(0, 3).map((item: any, index: number) => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {item.name}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {item.distance?.toFixed(1) || 'N/A'} mi
                                                            </span>
                                                        </div>
                                                        {/* Distance bar */}
                                                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1 relative">
                                                            <div
                                                                className="bg-blue-500 h-1 rounded-full transition-all duration-300 absolute top-0 left-0"
                                                                style={{
                                                                    width: `${Math.max(10, 100 - (item.distance * 100))}%`
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {nearbyItems.length > 3 && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    +{nearbyItems.length - 3} more nearby
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Complete Amenities Grid */}
                    <div className="border-t pt-6">
                        <h4 className="font-semibold text-gray-900 mb-4">All Amenities</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(profile.amenities).map(([category, items]) => (
                                <div key={category} className="space-y-3">
                                    <h5 className="font-medium text-gray-900 capitalize">
                                        {category.replace(/([A-Z])/g, ' $1').trim()}
                                    </h5>
                                    <div className="space-y-2">
                                        {(items as any[]).slice(0, 5).map((item: any, index: number) => (
                                            <div key={index} className="flex justify-between text-sm">
                                                <span className="text-gray-700 truncate">{item.name}</span>
                                                <span className="text-gray-500 ml-2 flex-shrink-0">
                                                    {item.distance?.toFixed(1) || 'N/A'} mi
                                                </span>
                                            </div>
                                        ))}
                                        {(items as any[]).length > 5 && (
                                            <p className="text-xs text-gray-500">
                                                +{(items as any[]).length - 5} more
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Export Information */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-1">Export & Share</h4>
                            <p className="text-blue-800 text-sm mb-3">
                                Export this neighborhood profile as PDF or HTML to share with clients.
                                The export includes your branding and contact information.
                            </p>
                            {profile.exportUrls && (
                                <div className="space-y-1">
                                    {profile.exportUrls.pdf && (
                                        <p className="text-xs text-blue-700">
                                            Last PDF export: Available
                                        </p>
                                    )}
                                    {profile.exportUrls.html && (
                                        <p className="text-xs text-blue-700">
                                            Last HTML export: Available
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function NeighborhoodProfilePage({ params }: NeighborhoodProfilePageProps) {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <NeighborhoodProfileContent profileId={params.id} />
        </Suspense>
    );
}