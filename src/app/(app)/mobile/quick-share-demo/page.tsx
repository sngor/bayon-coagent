import { QuickShareInterface } from '@/components/mobile/quick-share-interface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function QuickShareDemoPage() {
    // Sample property data for demo
    const sampleProperty = {
        address: '123 Main Street, San Francisco, CA 94102',
        price: '1,250,000',
        beds: 3,
        baths: 2,
        sqft: 1850,
        description:
            'Beautiful Victorian home in the heart of San Francisco. Features include hardwood floors, updated kitchen, and a spacious backyard. Walking distance to parks, restaurants, and public transportation.',
        imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    };

    return (
        <div className="container max-w-4xl py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Quick Share Demo</h1>
                <p className="text-muted-foreground mt-2">
                    Test the Quick Share functionality for mobile agents
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sample Property</CardTitle>
                    <CardDescription>
                        This is a sample property for testing the Quick Share feature
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {sampleProperty.imageUrl && (
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                <img
                                    src={sampleProperty.imageUrl}
                                    alt="Property"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div>
                            <h3 className="font-semibold text-lg">{sampleProperty.address}</h3>
                            <p className="text-2xl font-bold text-primary mt-2">
                                ${sampleProperty.price}
                            </p>
                            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                <span>{sampleProperty.beds} beds</span>
                                <span>{sampleProperty.baths} baths</span>
                                <span>{sampleProperty.sqft.toLocaleString()} sqft</span>
                            </div>
                            <p className="mt-4 text-muted-foreground">
                                {sampleProperty.description}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <QuickShareInterface
                propertyId="demo-property-123"
                propertyData={sampleProperty}
            />
        </div>
    );
}
