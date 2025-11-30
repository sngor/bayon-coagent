'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { QuickCapture, type CapturedPhoto } from './quick-capture';
import { PhotoDescriptionDisplay, type PhotoDescription } from './photo-description-display';
import { uploadPhotoAction } from '@/features/client-dashboards/actions/mobile-actions';
import { useToast } from '@/hooks/use-toast';
import { OfflineSyncManager } from '@/lib/offline-sync-manager';

export interface QuickCaptureWorkflowProps {
    userId: string;
    onSaveToLibrary?: (photo: CapturedPhoto, description: PhotoDescription, photoUrl: string) => void;
    className?: string;
}

type WorkflowState = 'capture' | 'uploading' | 'generating' | 'display';

export function QuickCaptureWorkflow({
    userId,
    onSaveToLibrary,
    className
}: QuickCaptureWorkflowProps) {
    const [state, setState] = useState<WorkflowState>('capture');
    const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [description, setDescription] = useState<PhotoDescription | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncManager] = useState(() => new OfflineSyncManager());

    const { toast } = useToast();

    // Monitor connectivity
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Handle photo capture
    const handlePhotoCapture = useCallback(async (photo: CapturedPhoto) => {
        setCapturedPhoto(photo);

        if (!isOnline) {
            // Queue for offline processing
            try {
                const base64Data = await blobToBase64(photo.blob);

                const operationData = {
                    photo: {
                        id: photo.id,
                        base64Data,
                        metadata: photo.metadata,
                        timestamp: photo.timestamp
                    },
                    userId,
                    type: 'photo-capture'
                };

                await syncManager.queueOperation({
                    type: 'photo',
                    data: operationData,
                    timestamp: Date.now()
                });

                toast({
                    title: "Photo queued for sync",
                    description: "Your photo will be processed when you're back online.",
                });

                // Reset to capture state for more photos
                setState('capture');
                setCapturedPhoto(null);

            } catch (error: any) {
                console.error('Offline queue error:', error);
                toast({
                    title: "Failed to queue photo",
                    description: "Unable to save photo for offline sync.",
                    variant: "destructive",
                });
                setState('capture');
                setCapturedPhoto(null);
            }
            return;
        }

        // Online processing
        setState('uploading');

        try {
            // Convert blob to File object for FormData
            const file = new File([photo.blob], `photo-${photo.id}.jpg`, { type: 'image/jpeg' });

            // Create FormData for upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('context', 'Mobile photo capture');

            // Upload photo to S3 and generate AI description
            const uploadResult = await uploadPhotoAction(null, formData);

            if (!uploadResult.success || !uploadResult.data?.uploadUrl) {
                throw new Error(uploadResult.message || 'Failed to upload photo');
            }

            setPhotoUrl(uploadResult.data.uploadUrl);
            setState('generating');

            // Check if we got a description from the upload
            if (uploadResult.data.description) {
                const photoDescription: PhotoDescription = {
                    description: uploadResult.data.description.description,
                    keyFeatures: uploadResult.data.description.keyFeatures || [],
                    tags: uploadResult.data.description.tags || [],
                    roomType: uploadResult.data.description.roomType,
                    marketingAppeal: uploadResult.data.description.marketingAppeal || 'medium',
                    improvementSuggestions: uploadResult.data.description.improvementSuggestions,
                };

                setDescription(photoDescription);
                setState('display');

                toast({
                    title: "Photo processed successfully",
                    description: "Your photo has been uploaded and analyzed.",
                });
            } else {
                // No description was generated
                toast({
                    title: "Photo uploaded",
                    description: "Photo uploaded but description generation is not available.",
                });

                // Reset to capture state
                setState('capture');
                setCapturedPhoto(null);
                setPhotoUrl(null);
            }

        } catch (error: any) {
            console.error('Photo processing error:', error);
            toast({
                title: "Processing failed",
                description: error.message || "Failed to process photo. Please try again.",
                variant: "destructive",
            });

            // Reset to capture state
            setState('capture');
            setCapturedPhoto(null);
            setPhotoUrl(null);
            setDescription(null);
        }
    }, [userId, isOnline, syncManager, toast]);

    // Handle description edit
    const handleDescriptionEdit = useCallback((newDescription: string) => {
        if (description) {
            setDescription({
                ...description,
                description: newDescription
            });
        }
    }, [description]);

    // Handle save to library
    const handleSaveToLibrary = useCallback(async (photo: CapturedPhoto, desc: PhotoDescription) => {
        if (!photoUrl) return;

        setIsSaving(true);

        try {
            // Call the parent callback if provided
            if (onSaveToLibrary) {
                await onSaveToLibrary(photo, desc, photoUrl);
            }

            toast({
                title: "Saved to library",
                description: "Photo and description have been saved to your content library.",
            });

            // Reset workflow
            setState('capture');
            setCapturedPhoto(null);
            setPhotoUrl(null);
            setDescription(null);

        } catch (error: any) {
            console.error('Save to library error:', error);
            toast({
                title: "Save failed",
                description: error.message || "Failed to save to library. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    }, [photoUrl, onSaveToLibrary, toast]);

    // Render based on current state
    switch (state) {
        case 'capture':
            return (
                <div className="space-y-2">
                    {!isOnline && (
                        <div className="w-full max-w-md mx-auto">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex items-center text-amber-800">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                                    <span className="text-sm font-medium">Offline Mode</span>
                                </div>
                                <p className="text-xs text-amber-700 mt-1">
                                    Photos will be queued and processed when you're back online.
                                </p>
                            </div>
                        </div>
                    )}
                    <QuickCapture
                        userId={userId}
                        onCapture={handlePhotoCapture}
                        className={className}
                    />
                </div>
            );

        case 'uploading':
            return (
                <div className="w-full max-w-md mx-auto">
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-sm text-muted-foreground">Uploading photo...</p>
                    </div>
                </div>
            );

        case 'generating':
        case 'display':
            if (!capturedPhoto || !description) {
                return (
                    <div className="w-full max-w-md mx-auto">
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">Processing...</p>
                        </div>
                    </div>
                );
            }

            return (
                <PhotoDescriptionDisplay
                    photo={capturedPhoto}
                    description={description}
                    onDescriptionEdit={handleDescriptionEdit}
                    onSaveToLibrary={handleSaveToLibrary}
                    isGenerating={state === 'generating'}
                    isSaving={isSaving}
                    className={className}
                />
            );

        default:
            return null;
    }
}

// Helper function to convert blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}