'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import * as RealEstateIcons from '@/components/ui/real-estate-icons';

export default function RealEstateIconsDemoPage() {
    const icons = [
        { name: 'HouseKey', component: RealEstateIcons.HouseKey, description: 'House with key - property access' },
        { name: 'OpenHouse', component: RealEstateIcons.OpenHouse, description: 'Open house event' },
        { name: 'PropertySearch', component: RealEstateIcons.PropertySearch, description: 'Property search' },
        { name: 'Sold', component: RealEstateIcons.Sold, description: 'Sold property' },
        { name: 'ForSale', component: RealEstateIcons.ForSale, description: 'Property for sale' },
        { name: 'Neighborhood', component: RealEstateIcons.Neighborhood, description: 'Neighborhood/community' },
        { name: 'Mortgage', component: RealEstateIcons.Mortgage, description: 'Mortgage/financing' },
        { name: 'PropertyValue', component: RealEstateIcons.PropertyValue, description: 'Property valuation' },
        { name: 'Listing', component: RealEstateIcons.Listing, description: 'Property listing' },
        { name: 'VirtualTour', component: RealEstateIcons.VirtualTour, description: 'Virtual tour' },
    ];

    return (
        <StandardPageLayout
            title="Real Estate Icons"
            description="Custom real estate-specific icon set"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Icon Gallery</CardTitle>
                        <CardDescription>
                            Custom SVG icons designed specifically for real estate applications
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {icons.map(({ name, component: Icon, description }) => (
                                <div
                                    key={name}
                                    className="flex flex-col items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
                                >
                                    <Icon className="h-8 w-8" />
                                    <div className="text-center">
                                        <div className="text-sm font-medium">{name}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Size Variations</CardTitle>
                        <CardDescription>Icons scale smoothly at different sizes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-6">
                            <div className="flex flex-col items-center gap-2">
                                <RealEstateIcons.HouseKey className="h-4 w-4" />
                                <span className="text-xs text-muted-foreground">16px</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <RealEstateIcons.HouseKey className="h-6 w-6" />
                                <span className="text-xs text-muted-foreground">24px</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <RealEstateIcons.HouseKey className="h-8 w-8" />
                                <span className="text-xs text-muted-foreground">32px</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <RealEstateIcons.HouseKey className="h-12 w-12" />
                                <span className="text-xs text-muted-foreground">48px</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <RealEstateIcons.HouseKey className="h-16 w-16" />
                                <span className="text-xs text-muted-foreground">64px</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Color Variations</CardTitle>
                        <CardDescription>Icons inherit text color and support custom colors</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-6">
                            <RealEstateIcons.PropertySearch className="h-8 w-8 text-primary" />
                            <RealEstateIcons.Sold className="h-8 w-8 text-green-600" />
                            <RealEstateIcons.ForSale className="h-8 w-8 text-blue-600" />
                            <RealEstateIcons.Mortgage className="h-8 w-8 text-orange-600" />
                            <RealEstateIcons.PropertyValue className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                        <CardDescription>Import and use like any Lucide icon</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { HouseKey, PropertySearch } from '@/components/ui/real-estate-icons';

<HouseKey className="h-6 w-6" />
<PropertySearch className="h-6 w-6 text-primary" />`}</code>
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
