'use client';

/**
 * Edit History List Component for Reimagine Image Toolkit
 * 
 * Features:
 * - Display edit history with thumbnails
 * - Show edit type, timestamp, and status
 * - Implement lazy loading for images
 * - Provide download and delete actions
 * - Show edit chains with visual indicators
 * 
 * Requirements: 7.2, 7.3, 7.4, 7.5, 9.3, 9.4
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download,
    Trash2,
    Eye,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    ChevronRight,
    Image as ImageIcon,
    AlertCircle,
    Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { StandardErrorDisplay } from '@/components/standard';
import { getEditHistoryAction, deleteEditAction, getDownloadUrlAction } from '@/app/reimagine-actions';
import { OptimizedImage } from './optimized-image';
import type { EditType } from '@/ai/schemas/reimagine-schemas';

interface EditHistoryItem {
    editId: string;
    imageId: string;
    editType: EditType;
    originalUrl: string;
    resultUrl: string;
    createdAt: string;
    status: string;
    parentEditId?: string;
}

interface EditHistoryListProps {
    userId: string;
    onViewEdit?: (item: EditHistoryItem) => void;
    onEditResult?: (item: EditHistoryItem) => void;
    className?: string;
}

export function EditHistoryList({
    userId,
    onViewEdit,
    onEditResult,
    className,
}: EditHistoryListProps) {
    const [edits, setEdits] = useState<EditHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    // Load edit history on mount
    useEffect(() => {
        loadEditHistory();
    }, [userId]);

    // Load edit history from server
    const loadEditHistory = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await getEditHistoryAction(userId, 50);

            if (!response.success) {
                throw new Error(response.error || 'Failed to load edit history');
            }

            setEdits(response.edits || []);
        } catch (err) {
            console.error('Error loading edit history:', err);
            setError(err instanceof Error ? err.message : 'Failed to load edit history');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Handle delete edit
    const handleDelete = useCallback(
        async (editId: string) => {
            if (!confirm('Are you sure you want to delete this edit? This action cannot be undone.')) {
                return;
            }

            try {
                setDeletingIds((prev) => new Set(prev).add(editId));

                const response = await deleteEditAction(userId, editId);

                if (!response.success) {
                    throw new Error(response.error || 'Failed to delete edit');
                }

                // Remove from local state
                setEdits((prev) => prev.filter((edit) => edit.editId !== editId));
            } catch (err) {
                console.error('Error deleting edit:', err);
                alert(err instanceof Error ? err.message : 'Failed to delete edit');
            } finally {
                setDeletingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(editId);
                    return next;
                });
            }
        },
        [userId]
    );

    // Handle download edit (Requirement 7.3)
    const handleDownload = useCallback(async (item: EditHistoryItem) => {
        try {
            // Get presigned download URL with proper headers
            const response = await getDownloadUrlAction(userId, item.editId);

            if (!response.success || !response.downloadUrl) {
                throw new Error(response.error || 'Failed to generate download URL');
            }

            // Create a temporary anchor element to trigger download
            const link = document.createElement('a');
            link.href = response.downloadUrl;
            link.download = response.filename || `${formatEditType(item.editType)}-${new Date(item.createdAt).toISOString().split('T')[0]}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error downloading edit:', err);
            alert(err instanceof Error ? err.message : 'Failed to download image. Please try again.');
        }
    }, [userId]);

    // Format edit type for display
    const formatEditType = (type: EditType): string => {
        return type
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Format timestamp for display
    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    // Get status badge variant and icon
    const getStatusDisplay = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return {
                    variant: 'default' as const,
                    icon: CheckCircle2,
                    label: 'Completed',
                    color: 'text-green-600',
                };
            case 'preview':
                return {
                    variant: 'secondary' as const,
                    icon: Eye,
                    label: 'Preview',
                    color: 'text-blue-600',
                };
            case 'processing':
                return {
                    variant: 'secondary' as const,
                    icon: Loader2,
                    label: 'Processing',
                    color: 'text-yellow-600',
                };
            case 'failed':
                return {
                    variant: 'destructive' as const,
                    icon: XCircle,
                    label: 'Failed',
                    color: 'text-red-600',
                };
            default:
                return {
                    variant: 'outline' as const,
                    icon: Clock,
                    label: status,
                    color: 'text-gray-600',
                };
        }
    };

    // Build edit chains
    const buildEditChains = useCallback(() => {
        const chains = new Map<string, EditHistoryItem[]>();
        const childMap = new Map<string, EditHistoryItem[]>();

        // Group edits by parent
        edits.forEach((edit) => {
            if (edit.parentEditId) {
                const siblings = childMap.get(edit.parentEditId) || [];
                siblings.push(edit);
                childMap.set(edit.parentEditId, siblings);
            }
        });

        // Build chains starting from root edits
        edits.forEach((edit) => {
            if (!edit.parentEditId) {
                const chain: EditHistoryItem[] = [edit];
                let current = edit;

                // Follow the chain
                while (childMap.has(current.editId)) {
                    const children = childMap.get(current.editId)!;
                    if (children.length > 0) {
                        current = children[0]; // Take first child
                        chain.push(current);
                    } else {
                        break;
                    }
                }

                chains.set(edit.editId, chain);
            }
        });

        return chains;
    }, [edits]);

    const editChains = buildEditChains();

    // Render loading state
    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Edit History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Render error state
    if (error) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Edit History</CardTitle>
                </CardHeader>
                <CardContent>
                    <StandardErrorDisplay
                        title="Failed to Load Edit History"
                        message={error}
                        variant="error"
                        action={{
                            label: "Try Again",
                            onClick: loadEditHistory
                        }}
                    />
                </CardContent>
            </Card>
        );
    }

    // Render empty state
    if (edits.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Edit History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">
                            No edits yet. Upload an image and start editing to see your history here.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Edit History</CardTitle>
                    <Badge variant="secondary">{edits.length} edits</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {Array.from(editChains.values()).map((chain) => {
                                const rootEdit = chain[0];
                                const isChain = chain.length > 1;

                                return (
                                    <motion.div
                                        key={rootEdit.editId}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-2"
                                    >
                                        {chain.map((item, index) => {
                                            const statusDisplay = getStatusDisplay(item.status);
                                            const StatusIcon = statusDisplay.icon;
                                            const isDeleting = deletingIds.has(item.editId);
                                            const isChainItem = index > 0;

                                            return (
                                                <div
                                                    key={item.editId}
                                                    className={cn(
                                                        'relative',
                                                        isChainItem && 'ml-8'
                                                    )}
                                                >
                                                    {/* Chain connector */}
                                                    {isChainItem && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center">
                                                            <div className="w-px h-full bg-border" />
                                                            <ChevronRight className="absolute h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                    )}

                                                    <Card
                                                        className={cn(
                                                            'transition-all duration-200',
                                                            isDeleting && 'opacity-50'
                                                        )}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex gap-4">
                                                                {/* Thumbnail with lazy loading */}
                                                                <div className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
                                                                    <OptimizedImage
                                                                        src={item.resultUrl}
                                                                        alt={`${formatEditType(item.editType)} result`}
                                                                        width={96}
                                                                        height={96}
                                                                        className="w-full h-full"
                                                                        quality={75}
                                                                    />
                                                                    {isChainItem && (
                                                                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                                                                            #{index + 1}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Details */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                                        <div className="flex-1 min-w-0">
                                                                            <h3 className="font-medium text-sm truncate">
                                                                                {formatEditType(item.editType)}
                                                                            </h3>
                                                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                                                <Clock className="h-3 w-3" />
                                                                                {formatTimestamp(item.createdAt)}
                                                                            </p>
                                                                        </div>
                                                                        <Badge
                                                                            variant={statusDisplay.variant}
                                                                            className="flex items-center gap-1"
                                                                        >
                                                                            <StatusIcon
                                                                                className={cn(
                                                                                    'h-3 w-3',
                                                                                    item.status === 'processing' && 'animate-spin'
                                                                                )}
                                                                            />
                                                                            {statusDisplay.label}
                                                                        </Badge>
                                                                    </div>

                                                                    {/* Actions */}
                                                                    <div className="flex items-center gap-2 mt-3">
                                                                        {onViewEdit && (
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        onClick={() => onViewEdit(item)}
                                                                                        disabled={isDeleting}
                                                                                    >
                                                                                        <Eye className="h-4 w-4" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>View</TooltipContent>
                                                                            </Tooltip>
                                                                        )}

                                                                        {/* Edit Result button for completed edits (Requirement 9.1) */}
                                                                        {onEditResult && item.status === 'completed' && (
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="default"
                                                                                        size="sm"
                                                                                        onClick={() => onEditResult(item)}
                                                                                        disabled={isDeleting}
                                                                                    >
                                                                                        <Edit3 className="h-4 w-4" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>Edit Result</TooltipContent>
                                                                            </Tooltip>
                                                                        )}

                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => handleDownload(item)}
                                                                                    disabled={isDeleting}
                                                                                >
                                                                                    <Download className="h-4 w-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Download</TooltipContent>
                                                                        </Tooltip>

                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => handleDelete(item.editId)}
                                                                                    disabled={isDeleting}
                                                                                >
                                                                                    {isDeleting ? (
                                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                                    ) : (
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    )}
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Delete</TooltipContent>
                                                                        </Tooltip>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            );
                                        })}

                                        {/* Chain indicator */}
                                        {isChain && (
                                            <div className="ml-8 text-xs text-muted-foreground flex items-center gap-1">
                                                <ChevronRight className="h-3 w-3" />
                                                Edit chain ({chain.length} edits)
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}
