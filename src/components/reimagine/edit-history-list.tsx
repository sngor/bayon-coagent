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
    Pencil,
    Check,
    X as XIcon,
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
import { StandardErrorDisplay, StandardLoadingSpinner } from '@/components/standard';
import { getEditHistoryAction, deleteEditAction, getDownloadUrlAction, updateEditNameAction } from '@/app/reimagine-actions';
import { OptimizedImage } from './optimized-image';
import { DeleteConfirmationModal } from './delete-confirmation-modal';
import { ImageViewerModal } from './image-viewer-modal';
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
    name?: string;
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
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editToDelete, setEditToDelete] = useState<{ id: string; type: string } | null>(null);
    const [viewerModalOpen, setViewerModalOpen] = useState(false);
    const [viewerImage, setViewerImage] = useState<EditHistoryItem | null>(null);
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<string>('');

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

    // Open delete confirmation modal
    const handleDeleteClick = useCallback((editId: string, editType: EditType) => {
        setEditToDelete({ id: editId, type: formatEditType(editType) });
        setDeleteModalOpen(true);
    }, []);

    // Close delete modal
    const handleDeleteCancel = useCallback(() => {
        setDeleteModalOpen(false);
        setEditToDelete(null);
    }, []);

    // Open image viewer modal
    const handleViewClick = useCallback((item: EditHistoryItem) => {
        setViewerImage(item);
        setViewerModalOpen(true);
    }, []);

    // Close image viewer modal
    const handleViewerClose = useCallback(() => {
        setViewerModalOpen(false);
        setViewerImage(null);
    }, []);

    // Start editing name
    const handleStartEditName = useCallback((item: EditHistoryItem) => {
        setEditingNameId(item.editId);
        setEditingName(item.name || '');
    }, []);

    // Cancel editing name
    const handleCancelEditName = useCallback(() => {
        setEditingNameId(null);
        setEditingName('');
    }, []);

    // Save edited name
    const handleSaveEditName = useCallback(async (editId: string) => {
        try {
            const response = await updateEditNameAction(userId, editId, editingName);

            if (!response.success) {
                throw new Error(response.error || 'Failed to update name');
            }

            // Update local state
            setEdits((prev) =>
                prev.map((edit) =>
                    edit.editId === editId ? { ...edit, name: editingName || undefined } : edit
                )
            );

            // Clear editing state
            setEditingNameId(null);
            setEditingName('');
        } catch (err) {
            console.error('Error updating name:', err);
            alert(err instanceof Error ? err.message : 'Failed to update name');
        }
    }, [userId, editingName]);

    // Confirm delete
    const handleDeleteConfirm = useCallback(async () => {
        if (!editToDelete) return;

        try {
            setDeletingIds((prev) => new Set(prev).add(editToDelete.id));

            const response = await deleteEditAction(userId, editToDelete.id);

            if (!response.success) {
                throw new Error(response.error || 'Failed to delete edit');
            }

            // Remove from local state
            setEdits((prev) => prev.filter((edit) => edit.editId !== editToDelete.id));

            // Close modal
            setDeleteModalOpen(false);
            setEditToDelete(null);
        } catch (err) {
            console.error('Error deleting edit:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete edit');
        } finally {
            setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(editToDelete.id);
                return next;
            });
        }
    }, [editToDelete, userId]);

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
                    <StandardLoadingSpinner
                        variant="default"
                        message="Loading edit history..."
                        size="md"
                    />
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
                                                            'group transition-all duration-200',
                                                            isDeleting && 'opacity-50'
                                                        )}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex gap-4">
                                                                {/* Thumbnail with lazy loading */}
                                                                <div className="relative flex-shrink-0 w-48 max-h-48 rounded-lg overflow-hidden">
                                                                    <OptimizedImage
                                                                        src={item.resultUrl}
                                                                        alt={`${formatEditType(item.editType)} result`}
                                                                        width={192}
                                                                        height={192}
                                                                        className="w-full h-auto object-contain"
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
                                                                            {editingNameId === item.editId ? (
                                                                                <div className="flex items-center gap-1 mb-1">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={editingName}
                                                                                        onChange={(e) => setEditingName(e.target.value)}
                                                                                        className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                                                                        placeholder="Enter name..."
                                                                                        autoFocus
                                                                                        maxLength={100}
                                                                                    />
                                                                                    <button
                                                                                        onClick={() => handleSaveEditName(item.editId)}
                                                                                        className="p-1 hover:bg-muted rounded"
                                                                                        aria-label="Save name"
                                                                                    >
                                                                                        <Check className="h-4 w-4 text-green-600" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={handleCancelEditName}
                                                                                        className="p-1 hover:bg-muted rounded"
                                                                                        aria-label="Cancel"
                                                                                    >
                                                                                        <XIcon className="h-4 w-4 text-muted-foreground" />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <h3 className="font-headline font-medium text-sm truncate">
                                                                                        {item.name || formatEditType(item.editType)}
                                                                                    </h3>
                                                                                    <button
                                                                                        onClick={() => handleStartEditName(item)}
                                                                                        className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                        aria-label="Edit name"
                                                                                    >
                                                                                        <Pencil className="h-3 w-3 text-muted-foreground" />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {formatEditType(item.editType)}
                                                                                </Badge>
                                                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                                    <Clock className="h-3 w-3" />
                                                                                    {formatTimestamp(item.createdAt)}
                                                                                </p>
                                                                            </div>
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
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => handleViewClick(item)}
                                                                                    disabled={isDeleting}
                                                                                >
                                                                                    <Eye className="h-4 w-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>View</TooltipContent>
                                                                        </Tooltip>

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
                                                                                    onClick={() => handleDeleteClick(item.editId, item.editType)}
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

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                isDeleting={editToDelete ? deletingIds.has(editToDelete.id) : false}
                editType={editToDelete?.type}
            />

            {/* Image Viewer Modal */}
            {viewerImage && (
                <ImageViewerModal
                    isOpen={viewerModalOpen}
                    onClose={handleViewerClose}
                    originalUrl={viewerImage.originalUrl}
                    editedUrl={viewerImage.resultUrl}
                    editType={formatEditType(viewerImage.editType)}
                    onDownload={() => handleDownload(viewerImage)}
                />
            )}
        </Card>
    );
}
