'use client';

import React, { useState, useCallback } from 'react';
import { Edit3, Save, X, Tag, Star, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TOUCH_FRIENDLY_CLASSES } from '@/lib/mobile-optimization';
import type { CapturedPhoto } from './quick-capture';

export interface PhotoDescription {
    description: string;
    keyFeatures: string[];
    tags: string[];
    roomType?: string;
    marketingAppeal: 'high' | 'medium' | 'low';
    improvementSuggestions?: string[];
}

export interface PhotoDescriptionDisplayProps {
    photo: CapturedPhoto;
    description: PhotoDescription;
    onDescriptionEdit: (newDescription: string) => void;
    onSaveToLibrary: (photo: CapturedPhoto, description: PhotoDescription) => void;
    isGenerating?: boolean;
    isSaving?: boolean;
    className?: string;
}

export function PhotoDescriptionDisplay({
    photo,
    description,
    onDescriptionEdit,
    onSaveToLibrary,
    isGenerating = false,
    isSaving = false,
    className
}: PhotoDescriptionDisplayProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedDescription, setEditedDescription] = useState(description.description);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    // Create photo URL when component mounts
    React.useEffect(() => {
        const url = URL.createObjectURL(photo.blob);
        setPhotoUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [photo.blob]);

    const handleSaveEdit = useCallback(() => {
        onDescriptionEdit(editedDescription);
        setIsEditing(false);
    }, [editedDescription, onDescriptionEdit]);

    const handleCancelEdit = useCallback(() => {
        setEditedDescription(description.description);
        setIsEditing(false);
    }, [description.description]);

    const handleSaveToLibrary = useCallback(() => {
        const updatedDescription = {
            ...description,
            description: editedDescription
        };
        onSaveToLibrary(photo, updatedDescription);
    }, [photo, description, editedDescription, onSaveToLibrary]);

    const getMarketingAppealColor = (appeal: string) => {
        switch (appeal) {
            case 'high': return 'bg-green-100 text-green-800 border-green-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getMarketingAppealIcon = (appeal: string) => {
        switch (appeal) {
            case 'high': return <Star className="w-3 h-3" />;
            case 'medium': return <AlertCircle className="w-3 h-3" />;
            case 'low': return <AlertCircle className="w-3 h-3" />;
            default: return null;
        }
    };

    if (isGenerating) {
        return (
            <Card className={cn("w-full max-w-md mx-auto", className)}>
                <CardContent className="p-4">
                    <div className="space-y-4">
                        {photoUrl && (
                            <div className="relative">
                                <img
                                    src={photoUrl}
                                    alt="Captured photo"
                                    className="w-full h-auto rounded-lg"
                                />
                                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                    {photo.metadata.width} × {photo.metadata.height}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-center py-8">
                            <div className="text-center space-y-2">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                <p className="text-sm text-muted-foreground">
                                    Generating AI description...
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("w-full max-w-md mx-auto", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>Photo Description</span>
                    {description.roomType && (
                        <Badge variant="outline" className="text-xs">
                            {description.roomType}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Photo Display */}
                {photoUrl && (
                    <div className="relative">
                        <img
                            src={photoUrl}
                            alt="Captured photo"
                            className="w-full h-auto rounded-lg"
                        />
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            {photo.metadata.width} × {photo.metadata.height}
                        </div>
                        <div className="absolute bottom-2 left-2">
                            <Badge
                                className={cn(
                                    "text-xs",
                                    getMarketingAppealColor(description.marketingAppeal)
                                )}
                            >
                                {getMarketingAppealIcon(description.marketingAppeal)}
                                <span className="ml-1 capitalize">{description.marketingAppeal} Appeal</span>
                            </Badge>
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="font-headline font-medium text-sm">Description</h4>
                        {!isEditing && (
                            <Button
                                onClick={() => setIsEditing(true)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                            >
                                <Edit3 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-2">
                            <Textarea
                                value={editedDescription}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                className={cn(TOUCH_FRIENDLY_CLASSES.input, "resize-none")}
                                rows={3}
                                placeholder="Edit the description..."
                            />
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSaveEdit}
                                    size="sm"
                                    className={TOUCH_FRIENDLY_CLASSES.button}
                                >
                                    <Save className="w-4 h-4 mr-1" />
                                    Save
                                </Button>
                                <Button
                                    onClick={handleCancelEdit}
                                    variant="outline"
                                    size="sm"
                                    className={TOUCH_FRIENDLY_CLASSES.button}
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {editedDescription}
                        </p>
                    )}
                </div>

                {/* Key Features */}
                {description.keyFeatures.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-headline font-medium text-sm">Key Features</h4>
                        <div className="flex flex-wrap gap-1">
                            {description.keyFeatures.map((feature, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                    {feature}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tags */}
                {description.tags.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-headline font-medium text-sm flex items-center">
                            <Tag className="w-4 h-4 mr-1" />
                            Tags
                        </h4>
                        <div className="flex flex-wrap gap-1">
                            {description.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Improvement Suggestions */}
                {description.improvementSuggestions && description.improvementSuggestions.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-headline font-medium text-sm text-amber-700">Suggestions</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                            {description.improvementSuggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="text-amber-500 mr-1">•</span>
                                    <span>{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Photo Metadata */}
                <div className="text-xs text-muted-foreground border-t pt-2">
                    <p>Size: {(photo.metadata.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p>Captured: {new Date(photo.timestamp).toLocaleString()}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={handleSaveToLibrary}
                        disabled={isSaving}
                        className={cn(TOUCH_FRIENDLY_CLASSES.button, "flex-1")}
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Save to Library
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}