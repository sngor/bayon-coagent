'use client';

import React, { useState } from 'react';
import { PropertyComparison, Property, SavedComparison } from './property-comparison';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Sample property data for demo
const sampleProperties: Property[] = [
    {
        id: 'prop-1',
        address: '123 Oak Street, Springfield, IL 62701',
        price: 285000,
        size: 1850,
        beds: 3,
        baths: 2,
        features: ['Hardwood Floors', 'Updated Kitchen', 'Fenced Yard', 'Garage', 'Central Air'],
        photos: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop']
    },
    {
        id: 'prop-2',
        address: '456 Maple Avenue, Springfield, IL 62702',
        price: 320000,
        size: 2100,
        beds: 4,
        baths: 2.5,
        features: ['Granite Counters', 'Master Suite', 'Deck', 'Two-Car Garage', 'Fireplace'],
        photos: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop']
    },
    {
        id: 'prop-3',
        address: '789 Pine Road, Springfield, IL 62703',
        price: 265000,
        size: 1650,
        beds: 3,
        baths: 2,
        features: ['Open Floor Plan', 'Stainless Appliances', 'Patio', 'Storage Shed', 'New Roof'],
        photos: ['https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=400&h=300&fit=crop']
    }
];

export default function PropertyComparisonDemo() {
    const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
    const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);

    const handlePropertyToggle = (property: Property) => {
        setSelectedProperties(prev => {
            const isSelected = prev.some(p => p.id === property.id);
            if (isSelected) {
                return prev.filter(p => p.id !== property.id);
            } else {
                return [...prev, property];
            }
        });
    };

    const handleSaveComparison = async (comparison: SavedComparison) => {
        setSavedComparisons(prev => [...prev, comparison]);
        console.log('Comparison saved:', comparison);
        alert(`Comparison saved with ${comparison.properties.length} properties!`);
    };

    const clearSelection = () => {
        setSelectedProperties([]);
    };

    return (
        <div className="space-y-6 p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Property Comparison Demo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-headline text-lg font-medium mb-3">Available Properties</h3>
                        <div className="grid gap-3">
                            {sampleProperties.map(property => (
                                <div
                                    key={property.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedProperties.some(p => p.id === property.id)
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                    onClick={() => handlePropertyToggle(property)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-medium">${property.price.toLocaleString()}</p>
                                            <p className="text-sm text-muted-foreground">{property.address}</p>
                                            <p className="text-sm">
                                                {property.beds} bed • {property.baths} bath • {property.size.toLocaleString()} sq ft
                                            </p>
                                        </div>
                                        <div className="ml-2">
                                            {selectedProperties.some(p => p.id === property.id) && (
                                                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={clearSelection}
                            variant="outline"
                            disabled={selectedProperties.length === 0}
                        >
                            Clear Selection ({selectedProperties.length})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {selectedProperties.length > 0 && (
                <PropertyComparison
                    properties={selectedProperties}
                    userId="demo-user-123"
                    onSave={handleSaveComparison}
                />
            )}

            {savedComparisons.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Saved Comparisons ({savedComparisons.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {savedComparisons.map(comparison => (
                                <div key={comparison.id} className="p-3 border rounded-lg">
                                    <p className="font-medium">
                                        {comparison.properties.length} Properties Compared
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(comparison.createdAt).toLocaleString()}
                                    </p>
                                    {comparison.notes && (
                                        <p className="text-sm mt-1">{comparison.notes}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}