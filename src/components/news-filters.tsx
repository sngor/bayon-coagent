'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, TrendingUp, Home, DollarSign, Building, Users, BarChart3 } from 'lucide-react';

interface NewsFiltersProps {
    onFilterChange?: (location: string) => void;
    defaultLocation?: string;
}

const MARKET_CATEGORIES = [
    { id: 'market-trends', label: 'Market Trends', icon: TrendingUp, query: 'housing market trends' },
    { id: 'home-sales', label: 'Home Sales', icon: Home, query: 'home sales data' },
    { id: 'mortgage-rates', label: 'Mortgage Rates', icon: DollarSign, query: 'mortgage rates interest' },
    { id: 'commercial', label: 'Commercial', icon: Building, query: 'commercial real estate' },
    { id: 'investment', label: 'Investment', icon: BarChart3, query: 'real estate investment' },
    { id: 'demographics', label: 'Demographics', icon: Users, query: 'housing demographics migration' },
];

export function NewsFilters({ onFilterChange, defaultLocation = '' }: NewsFiltersProps) {
    const [location, setLocation] = useState(defaultLocation);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let searchQuery = location;

        if (selectedCategory) {
            const category = MARKET_CATEGORIES.find(cat => cat.id === selectedCategory);
            if (category) {
                searchQuery = location ? `${location} ${category.query}` : category.query;
            }
        }

        onFilterChange?.(searchQuery);
    };

    const handleCategoryClick = (categoryId: string) => {
        const newCategory = selectedCategory === categoryId ? null : categoryId;
        setSelectedCategory(newCategory);

        // Auto-apply filter when category is selected
        let searchQuery = location;
        if (newCategory) {
            const category = MARKET_CATEGORIES.find(cat => cat.id === newCategory);
            if (category) {
                searchQuery = location ? `${location} ${category.query}` : category.query;
            }
        }
        onFilterChange?.(searchQuery);
    };

    const handleClear = () => {
        setLocation('');
        setSelectedCategory(null);
        onFilterChange?.('');
    };

    return (
        <div className="space-y-4">
            {/* Location Filter */}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <Label htmlFor="location" className="sr-only">
                        Location
                    </Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="location"
                            name="location"
                            placeholder="Filter by location (e.g., San Francisco, CA)"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button type="submit" className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Filter News
                    </Button>
                    {(location || selectedCategory) && (
                        <Button type="button" variant="outline" onClick={handleClear}>
                            Clear All
                        </Button>
                    )}
                </div>
            </form>

            {/* Market Categories */}
            <div>
                <Label className="text-sm font-medium mb-3 block">Market Focus Areas</Label>
                <div className="flex flex-wrap gap-2">
                    {MARKET_CATEGORIES.map((category) => {
                        const Icon = category.icon;
                        const isSelected = selectedCategory === category.id;

                        return (
                            <Badge
                                key={category.id}
                                variant={isSelected ? "default" : "secondary"}
                                className={`cursor-pointer transition-colors hover:bg-primary/80 ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/80'
                                    }`}
                                onClick={() => handleCategoryClick(category.id)}
                            >
                                <Icon className="h-3 w-3 mr-1" />
                                {category.label}
                            </Badge>
                        );
                    })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Click on categories to focus news on specific market areas
                </p>
            </div>
        </div>
    );
}