'use client';

import { Button } from '@/components/ui/button';
import { FolderPlus, Plus } from 'lucide-react';

interface KnowledgeBaseHeaderProps {
    onCreateCategory: () => void;
    onAddDocument: () => void;
}

export function KnowledgeBaseHeader({ onCreateCategory, onAddDocument }: KnowledgeBaseHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
                <p className="text-muted-foreground">
                    Centralized repository for research materials and insights
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onCreateCategory}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Category
                </Button>
                <Button onClick={onAddDocument}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                </Button>
            </div>
        </div>
    );
}