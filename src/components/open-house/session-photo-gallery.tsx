'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionPhoto } from '@/lib/open-house/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadSessionPhoto, deleteSessionPhoto } from '@/app/(app)/open-house/actions';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface SessionPhotoGalleryProps {
    sessionId: string;
    photos: SessionPhoto[];
}

/**
 * Session Photo Gallery Component
 * Displays photos for an open house session with upload and delete capabilities
 * Validates Requirements: 12.3, 12.4
 */
export function SessionPhotoGallery({
    sessionId,
    photos,
}: SessionPhotoGalleryProps) {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<SessionPhoto | null>(null);
    const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
    const { toast } = useToast();

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Invalid file type',
                description: 'Please upload an image file.',
                variant: 'destructive',
            });
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Please upload an image smaller than 10MB.',
                variant: 'destructive',
            });
            return;
        }

        setUploading(true);

        try {
            // Convert file to base64
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = e.target?.result as string;

                const result = await uploadSessionPhoto(sessionId, base64, file.type);

                if (result.success) {
                    toast({
                        title: 'Photo uploaded',
                        description: result.photo?.aiDescription
                            ? 'Photo uploaded with AI description'
                            : 'Photo uploaded successfully',
                    });
                    router.refresh();
                } else {
                    toast({
                        title: 'Upload failed',
                        description: result.error || 'Failed to upload photo',
                        variant: 'destructive',
                    });
                }

                setUploading(false);
            };

            reader.onerror = () => {
                toast({
                    title: 'Upload failed',
                    description: 'Failed to read file',
                    variant: 'destructive',
                });
                setUploading(false);
            };

            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast({
                title: 'Upload failed',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
            setUploading(false);
        }
    };

    const handleDeletePhoto = async (photoId: string) => {
        setDeletingPhotoId(photoId);

        try {
            const result = await deleteSessionPhoto(sessionId, photoId);

            if (result.success) {
                toast({
                    title: 'Photo deleted',
                    description: 'Photo has been removed from the session',
                });
                setSelectedPhoto(null);
                router.refresh();
            } else {
                toast({
                    title: 'Delete failed',
                    description: result.error || 'Failed to delete photo',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            toast({
                title: 'Delete failed',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setDeletingPhotoId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Upload Button */}
            <div className="flex items-center gap-4">
                <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    aria-label="Upload photo"
                />
                <Button
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    disabled={uploading}
                    variant="outline"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Photo
                        </>
                    )}
                </Button>
                <p className="text-sm text-muted-foreground">
                    Upload photos from the open house (max 10MB)
                </p>
            </div>

            {/* Photo Grid */}
            {photos.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center">
                            No photos yet. Upload photos to document the open house.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                        <Card
                            key={photo.photoId}
                            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSelectedPhoto(photo)}
                        >
                            <div className="relative aspect-square">
                                <img
                                    src={photo.url}
                                    alt={photo.aiDescription || 'Session photo'}
                                    className="w-full h-full object-cover"
                                />
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="absolute top-2 right-2 h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePhoto(photo.photoId);
                                    }}
                                    disabled={deletingPhotoId === photo.photoId}
                                >
                                    {deletingPhotoId === photo.photoId ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <X className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {photo.aiDescription && (
                                <CardContent className="p-3">
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {photo.aiDescription}
                                    </p>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Photo Detail Dialog */}
            <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Photo Details</DialogTitle>
                        <DialogDescription>
                            Captured at{' '}
                            {selectedPhoto &&
                                new Date(selectedPhoto.capturedAt).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPhoto && (
                        <div className="space-y-4">
                            <div className="relative w-full">
                                <img
                                    src={selectedPhoto.url}
                                    alt={selectedPhoto.aiDescription || 'Session photo'}
                                    className="w-full h-auto rounded-lg"
                                />
                            </div>
                            {selectedPhoto.aiDescription && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold">AI Description</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedPhoto.aiDescription}
                                    </p>
                                </div>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedPhoto(null)}
                                >
                                    Close
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleDeletePhoto(selectedPhoto.photoId)}
                                    disabled={deletingPhotoId === selectedPhoto.photoId}
                                >
                                    {deletingPhotoId === selectedPhoto.photoId ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Photo'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
