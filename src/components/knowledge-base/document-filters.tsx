'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search } from 'lucide-react';
import type { KnowledgeCategory } from './types';

interface DocumentFiltersProps {
    searchQuery: string;
    selectedCategory: string;
    selectedType: string;
    categories: KnowledgeCategory[];
    onSearchChange: (query: string) => void;
    onCategoryChange: (category: string) => void;
    onTypeChange: (type: string) => void;
    onClearFilters: () => void;
}

export function DocumentFilters({
    searchQuery,
    selectedCategory,
    selectedType,
    categories,
    onSearchChange,
    onCategoryChange,
    onTypeChange,
    onClearFilters
}: DocumentFiltersProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Search</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={selectedCategory} onValueChange={onCategoryChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="All categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={selectedType} onValueChange={onTypeChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="doc">Document</SelectItem>
                                <SelectItem value="txt">Text</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="url">Web Link</SelectItem>
                                <SelectItem value="note">Note</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button variant="outline" className="w-full" onClick={onClearFilters}>
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}