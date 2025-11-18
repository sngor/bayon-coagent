/**
 * Filter Controls Demo Component
 * 
 * This file demonstrates the usage of the FilterControls component
 * with various configurations and use cases.
 */

import { useState } from 'react';
import { FilterControls, useFilters, type FilterGroup } from '@/components/ui/filter-controls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Sample data for demonstration
const sampleProducts = [
    { id: 1, name: 'Modern Condo', category: 'Residential', price: 'High', status: 'Available' },
    { id: 2, name: 'Office Space', category: 'Commercial', price: 'Medium', status: 'Sold' },
    { id: 3, name: 'Luxury Villa', category: 'Residential', price: 'High', status: 'Available' },
    { id: 4, name: 'Retail Store', category: 'Commercial', price: 'Low', status: 'Pending' },
    { id: 5, name: 'Apartment', category: 'Residential', price: 'Medium', status: 'Available' },
];

export function FilterControlsDemo() {
    const { selectedFilters, handleFilterChange, handleClearAll } = useFilters();

    // Define filter groups
    const filterGroups: FilterGroup[] = [
        {
            id: 'category',
            label: 'Category',
            options: [
                { value: 'Residential', label: 'Residential', count: 3 },
                { value: 'Commercial', label: 'Commercial', count: 2 },
            ],
        },
        {
            id: 'price',
            label: 'Price Range',
            options: [
                { value: 'Low', label: 'Low', count: 1 },
                { value: 'Medium', label: 'Medium', count: 2 },
                { value: 'High', label: 'High', count: 2 },
            ],
        },
        {
            id: 'status',
            label: 'Status',
            options: [
                { value: 'Available', label: 'Available', count: 3 },
                { value: 'Pending', label: 'Pending', count: 1 },
                { value: 'Sold', label: 'Sold', count: 1 },
            ],
        },
    ];

    // Filter products based on selections
    const filteredProducts = sampleProducts.filter((product) => {
        const categoryMatch =
            selectedFilters.category?.length === 0 ||
            !selectedFilters.category ||
            selectedFilters.category.includes(product.category);

        const priceMatch =
            selectedFilters.price?.length === 0 ||
            !selectedFilters.price ||
            selectedFilters.price.includes(product.price);

        const statusMatch =
            selectedFilters.status?.length === 0 ||
            !selectedFilters.status ||
            selectedFilters.status.includes(product.status);

        return categoryMatch && priceMatch && statusMatch;
    });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Filter Controls Demo</CardTitle>
                    <CardDescription>
                        Interactive demonstration of the filter controls component
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Filter Controls */}
                    <div>
                        <h3 className="text-sm font-medium mb-3">Filters</h3>
                        <FilterControls
                            filterGroups={filterGroups}
                            selectedFilters={selectedFilters}
                            onFilterChange={handleFilterChange}
                            onClearAll={handleClearAll}
                        />
                    </div>

                    {/* Results */}
                    <div>
                        <h3 className="text-sm font-medium mb-3">
                            Results ({filteredProducts.length} of {sampleProducts.length})
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredProducts.map((product) => (
                                <Card key={product.id}>
                                    <CardHeader>
                                        <CardTitle className="text-base">{product.name}</CardTitle>
                                        <CardDescription>
                                            {product.category} • {product.price} • {product.status}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                        {filteredProducts.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No products match your filters
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Usage Examples:
 * 
 * 1. Basic Usage:
 * ```tsx
 * const { selectedFilters, handleFilterChange, handleClearAll } = useFilters();
 * 
 * <FilterControls
 *   filterGroups={filterGroups}
 *   selectedFilters={selectedFilters}
 *   onFilterChange={handleFilterChange}
 *   onClearAll={handleClearAll}
 * />
 * ```
 * 
 * 2. With Search Integration:
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const { selectedFilters, handleFilterChange, handleClearAll } = useFilters();
 * 
 * const filteredItems = filterBySearchAndFilters(
 *   items,
 *   searchQuery,
 *   selectedFilters,
 *   (item) => [item.name, item.description],
 *   (item) => ({ category: item.category, status: item.status })
 * );
 * ```
 * 
 * 3. Custom Initial Filters:
 * ```tsx
 * const { selectedFilters, handleFilterChange } = useFilters({
 *   category: ['Residential'],
 *   status: ['Available']
 * });
 * ```
 */
