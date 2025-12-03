import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getRepository } from '@/aws/dynamodb/repository';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Bed, Bath, Maximize, MapPin, Phone, Mail } from 'lucide-react';
import { trackShareEngagementAction } from '@/app/mobile-actions';

interface SharePageProps {
    params: {
        shareId: string;
    };
    searchParams: {
        property?: string;
        user?: string;
    };
}

async function getShareData(shareId: string, userId?: string) {
    if (!userId) return null;

    try {
        const repository = getRepository();
        const shareData = await repository.get(
            `USER#${userId}`,
            `SHARE#${shareId}`
        );
        return shareData;
    } catch (error) {
        console.error('Failed to load share data:', error);
        return null;
    }
}

async function getPropertyData(propertyId: string, userId?: string) {
    if (!userId || !propertyId) return null;

    try {
        const repository = getRepository();
        // Try to get listing data
        const listingData = await repository.get(
            `USER#${userId}`,
            `LISTING#${propertyId}`
        );
        return listingData;
    } catch (error) {
        console.error('Failed to load property data:', error);
        return null;
    }
}

export default async function SharePage({ params, searchParams }: SharePageProps) {
    const { shareId } = params;
    const { property: propertyId, user: userId } = searchParams;

    // Track view
    if (userId) {
        try {
            await trackShareEngagementAction(shareId, 'view');
        } catch (error) {
            console.error('Failed to track view:', error);
        }
    }

    const shareData = await getShareData(shareId, userId);
    const propertyData = await getPropertyData(propertyId || '', userId);

    if (!shareData) {
        notFound();
    }

    // Use property data from share record if listing not found
    const displayData: any = propertyData || shareData;

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile-optimized layout */}
            <div className="max-w-2xl mx-auto p-4 space-y-4">
                {/* Header */}
                <div className="text-center space-y-2 py-6">
                    <Home className="h-12 w-12 mx-auto text-primary" />
                    <h1 className="text-2xl font-bold">Property Information</h1>
                    <p className="text-muted-foreground">
                        Shared by your real estate agent
                    </p>
                </div>

                {/* Property Image */}
                {displayData.imageUrl && (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                            src={displayData.imageUrl}
                            alt="Property"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Property Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">
                            {displayData.address || 'Property Details'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Price */}
                        {displayData.price && (
                            <div>
                                <div className="text-3xl font-bold text-primary">
                                    ${displayData.price}
                                </div>
                            </div>
                        )}

                        {/* Key Features */}
                        <div className="grid grid-cols-3 gap-4">
                            {displayData.beds && (
                                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                                    <Bed className="h-6 w-6 mb-2 text-muted-foreground" />
                                    <div className="text-2xl font-bold">{displayData.beds}</div>
                                    <div className="text-xs text-muted-foreground">Bedrooms</div>
                                </div>
                            )}
                            {displayData.baths && (
                                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                                    <Bath className="h-6 w-6 mb-2 text-muted-foreground" />
                                    <div className="text-2xl font-bold">{displayData.baths}</div>
                                    <div className="text-xs text-muted-foreground">Bathrooms</div>
                                </div>
                            )}
                            {displayData.sqft && (
                                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                                    <Maximize className="h-6 w-6 mb-2 text-muted-foreground" />
                                    <div className="text-2xl font-bold">
                                        {displayData.sqft.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Sq Ft</div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {displayData.description && (
                            <div className="space-y-2">
                                <h3 className="font-semibold">Description</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {displayData.description}
                                </p>
                            </div>
                        )}

                        {/* Location */}
                        {displayData.address && (
                            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <div className="font-medium">Location</div>
                                    <div className="text-sm text-muted-foreground">
                                        {displayData.address}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Contact CTA */}
                <Card>
                    <CardContent className="pt-6 space-y-3">
                        <h3 className="font-semibold text-center mb-4">
                            Interested in this property?
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                size="lg"
                                className="w-full"
                                onClick={async () => {
                                    if (userId) {
                                        await trackShareEngagementAction(shareId, 'click');
                                    }
                                    window.location.href = 'tel:+15551234567';
                                }}
                            >
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full"
                                onClick={async () => {
                                    if (userId) {
                                        await trackShareEngagementAction(shareId, 'click');
                                    }
                                    window.location.href = 'mailto:agent@example.com';
                                }}
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Email
                            </Button>
                        </div>
                        <Button
                            size="lg"
                            variant="secondary"
                            className="w-full"
                            onClick={async () => {
                                if (userId) {
                                    await trackShareEngagementAction(shareId, 'click');
                                }
                                // Could link to a contact form or scheduling page
                            }}
                        >
                            Schedule a Showing
                        </Button>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground py-6">
                    <p>Powered by Bayon Coagent</p>
                </div>
            </div>
        </div>
    );
}
