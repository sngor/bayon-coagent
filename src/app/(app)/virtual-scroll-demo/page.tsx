'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VirtualList } from '@/components/ui/virtual-list';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/use-pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StandardEmptyState } from '@/components/standard/empty-state';
import { Search, List, Grid, Zap } from 'lucide-react';

// Generate sample data
interface SampleItem {
    id: number;
    title: string;
    description: string;
    status: 'active' | 'pending' | 'completed';
    date: string;
}

const generateSampleData = (count: number): SampleItem[] => {
    const statuses: Array<'active' | 'pending' | 'completed'> = ['active', 'pending', 'completed'];
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        title: `Item ${i + 1}`,
        description: `This is a description for item ${i + 1}. It contains some sample text to demonstrate the virtual scrolling functionality.`,
        status: statuses[i % 3],
        date: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
    }));
};

export default function VirtualScrollDemo() {
    const [itemCount, setItemCount] = useState(1000);
    const [searchQuery, setSearchQuery] = useState('');
    const [mode, setMode] = useState<'virtual' | 'pagination'>('virtual');

    // Generate data
    const allItems = useMemo(() => generateSampleData(itemCount), [itemCount]);

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!searchQuery) return allItems;
        return allItems.filter(
            (item) =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allItems, searchQuery]);

    // Pagination setup
    const pagination = usePagination(filteredItems, { itemsPerPage: 20 });

    // Render item function
    const renderItem = (item: SampleItem, index: number) => (
        <div className="p-4 border-b hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{item.title}</h4>
                        <Badge
                            variant={
                                item.status === 'completed'
                                    ? 'default'
                                    : item.status === 'active'
                                        ? 'secondary'
                                        : 'outline'
                            }
                        >
                            {item.status}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.date}</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Virtual Scrolling Demo</h1>
                <p className="text-muted-foreground">
                    Efficiently render large lists with virtual scrolling or pagination
                </p>
            </div>

            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>Adjust settings to test performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="itemCount">Number of Items: {itemCount}</Label>
                            <Input
                                id="itemCount"
                                type="range"
                                min="100"
                                max="10000"
                                step="100"
                                value={itemCount}
                                onChange={(e) => setItemCount(Number(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Drag to change the number of items (100 - 10,000)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="search">Search Items</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Search by title or description..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <Badge variant="outline" className="gap-1">
                            <List className="h-3 w-3" />
                            Total: {allItems.length}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                            <Search className="h-3 w-3" />
                            Filtered: {filteredItems.length}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Display modes */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'virtual' | 'pagination')}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="virtual" className="gap-2">
                        <Zap className="h-4 w-4" />
                        Virtual Scrolling
                    </TabsTrigger>
                    <TabsTrigger value="pagination" className="gap-2">
                        <Grid className="h-4 w-4" />
                        Pagination
                    </TabsTrigger>
                </TabsList>

                {/* Virtual Scrolling Mode */}
                <TabsContent value="virtual" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Virtual Scrolling</CardTitle>
                            <CardDescription>
                                Only renders visible items for optimal performance. Scroll smoothly through{' '}
                                {filteredItems.length.toLocaleString()} items.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filteredItems.length > 0 ? (
                                <VirtualList
                                    items={filteredItems}
                                    itemHeight={80}
                                    containerHeight={600}
                                    renderItem={renderItem}
                                    className="border rounded-lg"
                                    overscan={5}
                                    enabled={true}
                                />
                            ) : (
                                <StandardEmptyState
                                    icon={<Search className="h-12 w-12 text-muted-foreground" />}
                                    title="No items found"
                                    description="No items found matching your search. Try adjusting your search terms."
                                    variant="compact"
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-primary" />
                                    Performance Benefits
                                </h4>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>Only renders visible items (typically 10-20 at a time)</li>
                                    <li>Smooth 60fps scrolling even with 10,000+ items</li>
                                    <li>Minimal memory footprint</li>
                                    <li>Instant search and filtering</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pagination Mode */}
                <TabsContent value="pagination" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pagination</CardTitle>
                            <CardDescription>
                                Traditional pagination approach. Showing {pagination.pageItems.length} items per
                                page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border rounded-lg">
                                {pagination.pageItems.length > 0 ? (
                                    pagination.pageItems.map((item, index) => (
                                        <div key={item.id}>{renderItem(item, index)}</div>
                                    ))
                                ) : (
                                    <StandardEmptyState
                                        icon={<Search className="h-12 w-12 text-muted-foreground" />}
                                        title="No items found"
                                        description="No items found matching your search. Try adjusting your search terms."
                                        variant="compact"
                                    />
                                )}
                            </div>

                            {filteredItems.length > 0 && (
                                <Pagination
                                    currentPage={pagination.currentPage}
                                    totalPages={pagination.totalPages}
                                    onPageChange={pagination.goToPage}
                                    startIndex={pagination.startIndex}
                                    endIndex={pagination.endIndex}
                                    totalItems={filteredItems.length}
                                    showFirstLast={true}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Grid className="h-4 w-4 text-primary" />
                                    When to Use Pagination
                                </h4>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>Better for SEO (each page has a unique URL)</li>
                                    <li>Easier to bookmark specific pages</li>
                                    <li>Better for server-side data fetching</li>
                                    <li>More familiar UX for some users</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Performance comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Comparison</CardTitle>
                    <CardDescription>Understanding when to use each approach</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h4 className="font-medium text-primary">Virtual Scrolling</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">DOM Nodes:</span>
                                    <span className="font-medium">~15-20</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Memory Usage:</span>
                                    <span className="font-medium">Low</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Scroll Performance:</span>
                                    <span className="font-medium text-green-600">Excellent</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Best for:</span>
                                    <span className="font-medium">10,000+ items</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-medium text-primary">Pagination</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">DOM Nodes:</span>
                                    <span className="font-medium">20 per page</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Memory Usage:</span>
                                    <span className="font-medium">Low</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">SEO:</span>
                                    <span className="font-medium text-green-600">Better</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Best for:</span>
                                    <span className="font-medium">Server-side data</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
