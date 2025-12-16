'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BookOpen, Plus, MoreVertical, FileText, Image, Video, Edit, Calendar, Eye, Tag, Download, Trash2 } from 'lucide-react';
import type { KnowledgeDocument } from './types';

interface DocumentListProps {
    documents: KnowledgeDocument[];
    onAddDocument: () => void;
    onDeleteDocument: (id: string) => void;
}

// Utility functions moved to separate file for reusability
const getTypeIcon = (type: KnowledgeDocument['type']) => {
    switch (type) {
        case 'pdf':
        case 'doc':
        case 'txt':
            return <FileText className="h-4 w-4" />;
        case 'image':
            return <Image className="h-4 w-4" />;
        case 'video':
            return <Video className="h-4 w-4" />;
        case 'url':
            return <BookOpen className="h-4 w-4" />;
        case 'note':
            return <Edit className="h-4 w-4" />;
        default:
            return <FileText className="h-4 w-4" />;
    }
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
    } else {
        return date.toLocaleDateString();
    }
};

export function DocumentList({ documents, onAddDocument, onDeleteDocument }: DocumentListProps) {
    if (documents.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
                    <p className="text-muted-foreground text-center mb-4">
                        Start building your knowledge base by adding documents, notes, or web links.
                    </p>
                    <Button onClick={onAddDocument}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Document
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {documents.map((document) => (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        {getTypeIcon(document.type)}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-lg truncate">{document.title}</h4>
                                        <Badge variant="outline" className="text-xs">
                                            {document.type.toUpperCase()}
                                        </Badge>
                                        {!document.isProcessed && (
                                            <Badge variant="secondary" className="text-xs">
                                                {document.processingStatus}
                                            </Badge>
                                        )}
                                    </div>
                                    {document.summary && (
                                        <p className="text-muted-foreground mb-3">{document.summary}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(document.uploadedAt)}
                                        </div>
                                        {document.size && (
                                            <div className="flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                {formatFileSize(document.size)}
                                            </div>
                                        )}
                                        {document.lastAccessed && (
                                            <div className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                Last accessed {formatDate(document.lastAccessed)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {document.tags.map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                <Tag className="h-2 w-2 mr-1" />
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => onDeleteDocument(document.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}