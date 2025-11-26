'use client';

import { FileText, File, MoreVertical, Eye, Download, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Document {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadDate: string;
    status: 'pending' | 'processing' | 'indexed' | 'failed';
    title?: string;
    tags?: string[];
    accessCount?: number;
}

interface DocumentCardProps {
    document: Document;
    onPreview?: (document: Document) => void;
    onEdit?: (document: Document) => void;
    onDelete?: (document: Document) => void;
    onDownload?: (document: Document) => void;
}

export function DocumentCard({
    document,
    onPreview,
    onEdit,
    onDelete,
    onDownload,
}: DocumentCardProps) {
    const getFileIcon = (fileType: string) => {
        if (fileType === 'pdf') return FileText;
        return File;
    };

    const getStatusBadge = (status: Document['status']) => {
        const variants = {
            pending: { label: 'Pending', variant: 'secondary' as const },
            processing: { label: 'Processing', variant: 'default' as const },
            indexed: { label: 'Indexed', variant: 'default' as const },
            failed: { label: 'Failed', variant: 'destructive' as const },
        };

        const config = variants[status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const FileIcon = getFileIcon(document.fileType);

    return (
        <div className="group relative flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            {/* File Icon */}
            <div className={cn(
                'flex-shrink-0 rounded-md p-3',
                document.status === 'indexed'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
            )}>
                <FileIcon className="h-6 w-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
                {/* Title & Status */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">
                            {document.title || document.fileName}
                        </h3>
                        {document.title && (
                            <p className="text-xs text-muted-foreground truncate">
                                {document.fileName}
                            </p>
                        )}
                    </div>
                    {getStatusBadge(document.status)}
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatFileSize(document.fileSize)}</span>
                    <span>•</span>
                    <span>{formatDate(document.uploadDate)}</span>
                    {document.accessCount !== undefined && document.accessCount > 0 && (
                        <>
                            <span>•</span>
                            <span>{document.accessCount} references</span>
                        </>
                    )}
                </div>

                {/* Tags */}
                {document.tags && document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {document.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {onPreview && (
                        <DropdownMenuItem onClick={() => onPreview(document)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                        </DropdownMenuItem>
                    )}
                    {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(document)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Details
                        </DropdownMenuItem>
                    )}
                    {onDownload && (
                        <DropdownMenuItem onClick={() => onDownload(document)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </DropdownMenuItem>
                    )}
                    {onDelete && (
                        <DropdownMenuItem
                            onClick={() => onDelete(document)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
