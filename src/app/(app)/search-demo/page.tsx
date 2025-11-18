'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { NoResultsEmptyState } from '@/components/ui/empty-states';
import { filterBySearchAndFilters, highlightMatches, countFilterOptions } from '@/lib/search-utils';
import { FilterControls, useFilters, type FilterGroup } from '@/components/ui/filter-controls';
import { FileText, Search } from 'lucide-react';

// Sample data for demonstration
const sampleContent = [
    {
        id: '1',
        title: 'Understanding Real Estate Market Trends',
        description: 'A comprehensive guide to analyzing market trends in your local area.',
        category: 'Market Analysis',
    },
    {
        id: '2',
        title: 'First-Time Homebuyer Tips',
        description: 'Essential advice for buyers entering the real estate market for the first time.',
        category: 'Buyer Guide',
    },
    {
        id: '3',
        title: 'Staging Your Home for Maximum Appeal',
        description: 'Professional staging techniques to attract more buyers and increase sale price.',
        category: 'Selling Tips',
    },
    {
        id: '4',
        title: 'Investment Property Analysis',
        description: 'How to evaluate rental properties and calculate potential returns.',
        category: 'Investment',
    },
    {
        id: '5',
        title: 'Negotiation Strategies for Sellers',
        description: 'Proven tactics to get the best price when selling your property.',
        category: 'Selling Tips',
    },
    {
        id: '6',
        title: 'Understanding Mortgage Options',
        description: 'A detailed breakdown of different mortgage types and which might be right for you.',
        category: 'Financing',
    },
];

export default function SearchDemoPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const { selectedFilters, handleFilterChange, handleClearAll, hasActiveFilters } = useFilters();

    // Calculate category counts
    const categoryCounts = useMemo(() => {
        return countFilterOptions(sampleContent, (item) => item.category);
    }, []);

    // Define filter groups
    const filterGroups: FilterGroup[] = useMemo(() => [
        {
            id: 'category',
            label: 'Category',
            options: [
                { value: 'Market Analysis', label: 'Market Analysis', count: categoryCounts['Market Analysis'] },
                { value: 'Buyer Guide', label: 'Buyer Guide', count: categoryCounts['Buyer Guide'] },
                { value: 'Selling Tips', label: 'Selling Tips', count: categoryCounts['Selling Tips'] },
                { value: 'Investment', label: 'Investment', count: categoryCounts['Investment'] },
                { value: 'Financing', label: 'Financing', count: categoryCounts['Financing'] },
            ],
        },
    ], [categoryCounts]);

    // Filter content based on search query and filters
    const filteredContent = useMemo(() => {
        return filterBySearchAndFilters(
            sampleContent,
            searchQuery,
            selectedFilters,
            (item) => [item.title, item.description, item.category],
            (item) => ({ category: item.category })
        );
    }, [searchQuery, selectedFilters]);

    return (
        <div className="animate-fade-in-up space-y-8">
            <PageHeader
                title="Search Functionality Demo"
                description="Demonstration of the reusable search component with real-time filtering and result highlighting."
            />

            {/* Search and Filter Controls */}
            <div className="space-y-4">
                <div className="max-w-md">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onClear={() => setSearchQuery('')}
                        placeholder="Search content by title, description, or category..."
                        aria-label="Search content"
                    />
                </div>

                {/* Filter Controls */}
                <FilterControls
                    filterGroups={filterGroups}
                    selectedFilters={selectedFilters}
                    onFilterChange={handleFilterChange}
                    onClearAll={handleClearAll}
                />
            </div>

            {/* Search Stats */}
            {(searchQuery || hasActiveFilters) && (
                <div className="text-sm text-muted-foreground">
                    Found {filteredContent.length} of {sampleContent.length} results
                    {searchQuery && ` for "${searchQuery}"`}
                    {hasActiveFilters && ' with active filters'}
                </div>
            )}

            {/* No Results State */}
            {(searchQuery || hasActiveFilters) && filteredContent.length === 0 && (
                <NoResultsEmptyState
                    searchTerm={searchQuery}
                    onClearSearch={() => {
                        setSearchQuery('');
                        handleClearAll();
                    }}
                    icon={<Search className="w-8 h-8 text-muted-foreground" />}
                />
            )}

            {/* Results Grid */}
            {filteredContent.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredContent.map((item) => (
                        <Card key={item.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                                    <div className="flex-1 min-w-0">
                                        <CardTitle
                                            className="text-lg font-headline line-clamp-2"
                                            dangerouslySetInnerHTML={{
                                                __html: searchQuery
                                                    ? highlightMatches(item.title, searchQuery)
                                                    : item.title,
                                            }}
                                        />
                                    </div>
                                </div>
                                <CardDescription
                                    className="line-clamp-2"
                                    dangerouslySetInnerHTML={{
                                        __html: searchQuery
                                            ? highlightMatches(item.description, searchQuery)
                                            : item.description,
                                    }}
                                />
                            </CardHeader>
                            <CardContent>
                                <span
                                    className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium"
                                    dangerouslySetInnerHTML={{
                                        __html: searchQuery
                                            ? highlightMatches(item.category, searchQuery)
                                            : item.category,
                                    }}
                                />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State (no search or filters) */}
            {!searchQuery && !hasActiveFilters && (
                <Card className="border-dashed">
                    <CardContent className="text-center py-12">
                        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Try searching and filtering</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Use the search box and filters above to find content. Try searching for "buyer", "market", or "investment", or filter by category.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
