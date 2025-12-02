'use client';

/**
 * PhotoSelector Component
 * 
 * Allows selection of session photos for inclusion in follow-up content.
 * Displays photos in a grid with checkboxes for multi-select.
 * 
 * Validates Requirements: 12.4
 */

import { useState } from 'react';
import { SessionPhoto } from '@/lib/open-house/types';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, CheckCircle2, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface PhotoSelectorProps {
    photos: SessionPhoto[];
    selectedPhotoIds?: string[];
    onSelectionChange?: (photoIds: string[]) => void;
    maxSelection?: number;
    showPreview?: boolean;
}

/**
 * Photo Selector Component
 * Enables photo selection for follow-up content
 * Validates Requirements: 12.4
 */
export function PhotoSelector({
    photos,
    selectedPhotoIds = [],
    onSelectionChange,
    maxSelection,
    showPreview = true,
}: PhotoSelectorProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>(selectedPhotoIds);
    const [previewPhoto, setPreviewPhoto] = useState<SessionPhoto | null>(null);

    const handleTogglePhoto = (photoId: string) => {
        let newSelection: string[];

        if (selectedIds.includes(photoId)) {
            // Remove from selection
            newSelection = selectedIds.filter(id => id !== photoId);
        } else {
            // Add to selection (check max limit)
            if (maxSelection && selectedIds.length >= maxSelection) {
                return; // Don't add if max reached
            }
            newSelection = [...selectedIds, photoId];
        }

        setSelectedIds(newSelection);
        onSelectionChange?.(newSelection);
    };

    const handleSelectAll = () => {
        const allIds = photos.map(p => p.photoId);
        const newSelection = maxSelection ? allIds.slice(0, maxSelection) : allIds;
        setSelectedIds(newSelection);
        onSelectionChange?.(newSelection);
    };

    const handleClearSelection = () => {
        setSelectedIds([]);
        onSelectionChange?.([]);
    };

    if (photos.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                        No photos available for this session
                    </p>
                    <p className="text-sm text-muted-foreground text-center mt-1">
                        Upload photos to include them in follow-up content
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Selection Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="outline">
                        {selectedIds.length} selected
                        {maxSelection && ` / ${maxSelection} max`}
                    </Badge>
                    {selectedIds.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearSelection}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
                {selectedIds.length < photos.length && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        disabled={maxSelection ? selectedIds.length >= maxSelection : false}
                    >
                        Select All
                        {maxSelection && ` (${maxSelection})`}
                    </Button>
                )}
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => {
                    const isSelected = selectedIds.includes(photo.photoId);
                    const isDisabled = maxSelection && !isSelected && selectedIds.length >= maxSelection;

                    return (
                        <Card
                            key={photo.photoId}
                            className={`overflow-hidden cursor-pointer transition-all ${isSelected
                                    ? 'ring-2 ring-primary shadow-lg'
                                    : 'hover:shadow-md'
                                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => !isDisabled && handleTogglePhoto(photo.photoId)}
                        >
                            <div className="relative aspect-square">
                                <img
                                    src={photo.url}
                                    alt={photo.aiDescription || 'Session photo'}
                                    className="w-full h-full object-cover"
                                />

                                {/* Selection Checkbox */}
                                <div className="absolute top-2 left-2">
                                    <div className="bg-background/80 backdrop-blur-sm rounded-md p-1">
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => !isDisabled && handleTogglePhoto(photo.photoId)}
                                            disabled={isDisabled}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>

                                {/* Selected Indicator */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2">
                                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    </div>
                                )}

                                {/* Preview Button */}
                                {showPreview && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="absolute bottom-2 right-2 h-7 text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewPhoto(photo);
                                        }}
                                    >
                                        Preview
                                    </Button>
                                )}
                            </div>

                            {/* AI Description */}
                            {photo.aiDescription && (
                                <CardContent className="p-3">
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {photo.aiDescription}
                                    </p>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Preview Dialog */}
            {showPreview && (
                <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Photo Preview</DialogTitle>
                            <DialogDescription>
                                {previewPhoto &&
                                    new Date(previewPhoto.capturedAt).toLocaleString()}
                            </DialogDescription>
                        </DialogHeader>
                        {previewPhoto && (
                            <div className="space-y-4">
                                <div className="relative w-full">
                                    <img
                                        src={previewPhoto.url}
                                        alt={previewPhoto.aiDescription || 'Session photo'}
                                        className="w-full h-auto rounded-lg"
                                    />
                                </div>
                                {previewPhoto.aiDescription && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">AI Description</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {previewPhoto.aiDescription}
                                        </p>
                                    </div>
                                )}
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setPreviewPhoto(null)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            handleTogglePhoto(previewPhoto.photoId);
                                            setPreviewPhoto(null);
                                        }}
                                    >
                                        {selectedIds.includes(previewPhoto.photoId)
                                            ? 'Deselect'
                                            : 'Select Photo'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
