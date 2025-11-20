'use client';

import { useState } from 'react';
import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';

export default function SearchDemoPage() {
    const [searchValue, setSearchValue] = useState('');
    const [fastSearch, setFastSearch] = useState('');
    const [slowSearch, setSlowSearch] = useState('');

    // Sample data to filter
    const sampleData = [
        { id: 1, title: 'Luxury Condo in Downtown', category: 'Listing', price: '$450,000' },
        { id: 2, title: 'Family Home with Pool', category: 'Listing', price: '$650,000' },
        { id: 3, title: 'Modern Apartment', category: 'Listing', price: '$320,000' },
        { id: 4, title: 'Blog Post: Market Trends 2024', category: 'Content', price: 'N/A' },
        { id: 5, title: 'Social Media: Open House Tips', category: 'Content', price: 'N/A' },
        { id: 6, title: 'Neighborhood Guide: Downtown', category: 'Content', price: 'N/A' },
        { id: 7, title: 'Victorian House Restoration', category: 'Listing', price: '$890,000' },
        { id: 8, title: 'Beachfront Property', category: 'Listing', price: '$1,200,000' },
    ];

    const filteredData = sampleData.filter(item =>
        item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.category.toLowerCase().includes(searchValue.toLowerCase())
    );

    return (
        <StandardPageLayout
            title="Search Component Demo"
            description="Debounced search input with real-time filtering"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Search</CardTitle>
                        <CardDescription>
                            Default 300ms debounce with clear button
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <SearchInput
                            value={searchValue}
                            onChange={setSearchValue}
                            placeholder="Search listings and content..."
                        />
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Search value: <code className="bg-muted px-2 py-1 rounded">{searchValue || '(empty)'}</code>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Results: {filteredData.length} of {sampleData.length}
                            </p>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {filteredData.map(item => (
                                <div key={item.id} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-medium text-sm">{item.title}</h4>
                                            <p className="text-xs text-muted-foreground mt-1">{item.price}</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Fast Debounce (100ms)</CardTitle>
                            <CardDescription>Quick response for small datasets</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SearchInput
                                value={fastSearch}
                                onChange={setFastSearch}
                                debounceMs={100}
                                placeholder="Fast search..."
                            />
                            <p className="text-sm text-muted-foreground">
                                Value: <code className="bg-muted px-2 py-1 rounded">{fastSearch || '(empty)'}</code>
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Slow Debounce (1000ms)</CardTitle>
                            <CardDescription>Reduced API calls for expensive searches</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SearchInput
                                value={slowSearch}
                                onChange={setSlowSearch}
                                debounceMs={1000}
                                placeholder="Slow search..."
                            />
                            <p className="text-sm text-muted-foreground">
                                Value: <code className="bg-muted px-2 py-1 rounded">{slowSearch || '(empty)'}</code>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li>✓ Debounced input for performance optimization</li>
                            <li>✓ Immediate visual feedback (UI updates instantly)</li>
                            <li>✓ Clear button appears when text is present</li>
                            <li>✓ Search icon indicator</li>
                            <li>✓ Configurable debounce delay</li>
                            <li>✓ Accessible keyboard navigation</li>
                            <li>✓ Optimistic UI updates (&lt;16ms response)</li>
                            <li>✓ Custom placeholder support</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { SearchInput } from '@/components/ui/search-input';

const [search, setSearch] = useState('');

<SearchInput
  value={search}
  onChange={setSearch}
  placeholder="Search..."
  debounceMs={300}
  onClear={() => console.log('Cleared')}
/>`}</code>
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
