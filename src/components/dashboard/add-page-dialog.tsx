'use client';

import { useState } from 'react';
import { Search, Pin, Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { getCategoryForPage, searchPages, HUB_CATEGORIES, type PageMetadata } from '@/lib/page-metadata';
import { getIcon } from '@/lib/icon-utils';



import { type FavoriteItem } from '@/hooks/use-favorites';

interface AddPageDialogProps {
    favorites: FavoriteItem[];
    onAddPage: (page: PageMetadata) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddPageDialog({ favorites, onAddPage, isOpen, onOpenChange }: AddPageDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleOpenChange = (open: boolean) => {
        onOpenChange(open);
        if (!open) setSearchQuery('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <div className="w-full aspect-square rounded-xl border-2 border-dashed border-muted hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer p-4 flex flex-col items-center justify-center text-center">
                    <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Add Page</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">Customize actions</p>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add to Quick Actions</DialogTitle>
                    <DialogDescription>
                        Choose pages to add to your dashboard quick actions.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search pages..."
                            className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                            onChange={(e) => setSearchQuery(e.target.value)}
                            value={searchQuery}
                        />
                    </div>

                    {/* Pages List */}
                    <div className="max-h-96 overflow-y-auto space-y-4">
                        {(() => {
                            const filteredPages = searchPages(searchQuery);

                            const categorizedPages = filteredPages.reduce((acc: Record<string, PageMetadata[]>, page) => {
                                const category = getCategoryForPage(page.href);
                                if (!acc[category]) acc[category] = [];
                                acc[category].push(page);
                                return acc;
                            }, {});

                            const sortedCategories = Object.entries(categorizedPages).sort(([a], [b]) => {
                                const aIndex = HUB_CATEGORIES.indexOf(a as any);
                                const bIndex = HUB_CATEGORIES.indexOf(b as any);
                                if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
                                if (aIndex === -1) return 1;
                                if (bIndex === -1) return -1;
                                return aIndex - bIndex;
                            });

                            if (sortedCategories.length === 0) {
                                return (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No pages found matching "{searchQuery}"</p>
                                    </div>
                                );
                            }

                            return sortedCategories.map(([category, pages]) => (
                                <div key={category}>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                                        {category}
                                    </h4>
                                    <div className="space-y-1">
                                        {pages.map((page) => {
                                            const Icon = getIcon(page.icon);
                                            const isFavorited = favorites.some(f => f.id === page.id);

                                            return (
                                                <button
                                                    key={page.id}
                                                    type="button"
                                                    onClick={() => onAddPage(page)}
                                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                                                >
                                                    <div className={`w-8 h-8 rounded-lg ${page.color} flex items-center justify-center text-white flex-shrink-0`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-sm">{page.title}</div>
                                                        <div className="text-xs text-muted-foreground truncate">{page.description}</div>
                                                    </div>
                                                    {isFavorited && (
                                                        <Pin className="w-4 h-4 text-primary fill-current flex-shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}