'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Folder } from 'lucide-react';
interface KnowledgeCategory {
    id: string;
    name: string;
    description: string;
    documentCount: number;
    color: string;
}

interface CategoryGridProps {
    categories: KnowledgeCategory[];
    selectedCategory: string;
    onCategorySelect: (categoryId: string) => void;
}

export function CategoryGrid({ categories, selectedCategory, onCategorySelect }: CategoryGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
                <Card
                    key={category.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedCategory === category.id ? 'ring-2 ring-primary' : ''
                        }`}
                    onClick={() => onCategorySelect(selectedCategory === category.id ? 'all' : category.id)}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Folder className="h-5 w-5 text-primary" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">{category.name}</h4>
                                <p className="text-sm text-muted-foreground">{category.documentCount} docs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}