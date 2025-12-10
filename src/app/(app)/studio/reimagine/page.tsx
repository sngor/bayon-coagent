'use client';

/**
 * Reimagine Image Toolkit - Main Page
 * 
 * This is the main orchestration page for the Reimagine Image Toolkit.
 * It composes all the components and manages the workflow state for:
 * - Image upload
 * - Edit selection and parameter input
 * - Edit processing and progress tracking
 * - Preview and acceptance
 * - Edit history display
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, Loader2, XCircle } from 'lucide-react';
import { useUser } from '@/aws/auth/use-user';
import { StandardPageLayout, StandardErrorDisplay, StandardLoadingSpinner } from '@/components/standard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    AnimatedTabs as Tabs,
    AnimatedTabsContent as TabsContent,
    AnimatedTabsList as TabsList,
    AnimatedTabsTrigger as TabsTrigger,
} from '@/components/ui/animated-tabs';
import { ImageUploader } from '@/components/reimagine/image-uploader';
import { EditPreview } from '@/components/reimagine/edit-preview';
import { EditHistoryList } from '@/components/reimagine/edit-history-list';
import { ProcessingProgress, type ProcessingStatus } from '@/components/reimagine/processing-progress';
import { RateLimitStatus } from '@/components/reimagine/rate-limit-status';
import { MultiAngleStagingInterface } from '@/components/reimagine/multi-angle-staging-interface';
import {
    VirtualStagingForm,
    DayToDuskForm,
    EnhanceForm,
    ItemRemovalForm,
    VirtualRenovationForm,
} from '@/components/reimagine/edit-forms';
import {
    processEditAction,
    acceptEditAction,
    getOriginalImageAction,
} from '@/features/intelligence/actions/reimagine-actions';
import type {
    EditType,
    EditSuggestion,
    EditParams,
} from '@/ai/schemas/reimagine-schemas';
import { cn } from '@/lib/utils/common';


// Workflow states - simplified to 3 states
type WorkflowState =
    | 'upload'           // Upload image and select edit type
    | 'processing'       // Edit processing
    | 'preview';         // Edit complete: preview result

interface CurrentImage {
    imageId: string;
    suggestions: EditSuggestion[];
}

interface ActiveEdit {
    editType: EditType;
    suggestedParams?: Partial<EditParams>;
}

interface PreviewData {
    editId: string;
    originalUrl: string;
    editedUrl: string;
    editType: EditType;
    editParams?: EditParams; // Store original parameters for regeneration
    sourceImageId?: string; // Store source image ID for regeneration
}

interface SavedFormState {
    editType: EditType;
    imageId: string;
    imageUrl: string;
}

interface ChainEditData {
    parentEditId: string;
    imageId: string;
}

export default function ReimagineToolkitPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();

    // Workflow state
    const [workflowState, setWorkflowState] = useState<WorkflowState>('upload');
    const [currentImage, setCurrentImage] = useState<CurrentImage | null>(null);
    const [activeEdit, setActiveEdit] = useState<ActiveEdit | null>(null);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [chainEditData, setChainEditData] = useState<ChainEditData | null>(null);

    // Processing state
    const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
    const [processingError, setProcessingError] = useState<string | null>(null);

    // History refresh trigger
    const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

    // Preloaded image for chained edits
    const [preloadedImage, setPreloadedImage] = useState<{ id: string; url: string } | null>(null);

    // Saved form state for back navigation
    const [savedFormState, setSavedFormState] = useState<SavedFormState | null>(null);

    // Authentication check and redirect (Requirement 11.4)
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    // Show loading state while checking authentication
    if (isUserLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect if not authenticated
    if (!user) {
        return null;
    }

    // Get user ID
    const userId = user?.id || '';

    // Edit type options for selection
    const editTypes = [
        {
            id: 'virtual-staging' as EditType,
            title: 'Virtual Staging',
            description: 'Add furniture and decor to empty rooms',
            icon: '🛋️',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            id: 'day-to-dusk' as EditType,
            title: 'Day to Dusk',
            description: 'Transform between daytime and golden hour',
            icon: '🌅',
            color: 'from-orange-500 to-pink-500',
        },
        {
            id: 'enhance' as EditType,
            title: 'Enhance',
            description: 'Improve image quality and lighting',
            icon: '✨',
            color: 'from-purple-500 to-indigo-500',
        },
        {
            id: 'item-removal' as EditType,
            title: 'Item Removal',
            description: 'Remove unwanted objects from photos',
            icon: '🗑️',
            color: 'from-red-500 to-rose-500',
        },
        {
            id: 'virtual-renovation' as EditType,
            title: 'Virtual Renovation',
            description: 'Visualize renovations and updates',
            icon: '🏗️',
            color: 'from-green-500 to-emerald-500',
        },
    ];

    // Handle upload complete - now directly processes the edit
    const handleUploadComplete = useCallback(
        async (imageId: string, suggestions?: EditSuggestion[], editType?: EditType, params?: EditParams) => {
            setCurrentImage({ imageId, suggestions: suggestions || [] });

            let result;
            try {
                setWorkflowState('processing');
                setProcessingStatus('processing');
                setProcessingError(null);

                console.log('Processing edit with:', { userId, imageId, editType, params });

                // Validate required data
                if (!userId) {
                    throw new Error('User ID is missing. Please refresh the page and try again.');
                }
                if (!imageId) {
                    throw new Error('Image ID is missing. Please upload the image again.');
                }
                if (!editType) {
                    throw new Error('Edit type is missing. Please select an edit type.');
                }
                if (!params) {
                    throw new Error('Edit parameters are missing. Please fill in the form.');
                }

                // Process the edit immediately
                result = await processEditAction(
                    userId,
                    imageId,
                    editType,
                    params,
                    chainEditData?.parentEditId
                );

                console.log('Process edit result:', result);

                if (!result) {
                    throw new Error('No response from server. Please check your connection and try again.');
                }

                if (result.success && result.editId && result.resultUrl) {
                    // Get original image URL
                    const originalImageResult = await getOriginalImageAction(userId, result.editId);

                    if (!originalImageResult) {
                        console.warn('Failed to get original image URL, using empty string');
                    }

                    const originalUrl = originalImageResult?.success ? originalImageResult.originalUrl || '' : '';

                    setPreviewData({
                        editId: result.editId,
                        originalUrl,
                        editedUrl: result.resultUrl,
                        editType: editType,
                        editParams: params, // Store parameters for regeneration
                        sourceImageId: imageId, // Store source image ID for regeneration
                    });

                    setProcessingStatus('completed');
                    setWorkflowState('preview');
                } else {
                    const errorMsg = result.error || 'Failed to process edit. Please try again.';
                    throw new Error(errorMsg);
                }
            } catch (error) {
                console.error('Edit processing error:', error);
                console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
                console.error('Result was:', result);
                console.error('Input data:', { userId, imageId, editType, params });

                const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
                setProcessingStatus('failed');
                setProcessingError(errorMessage);
                setWorkflowState('upload'); // Go back to upload on error
            }
        },
        [userId, chainEditData]
    );

    // Handle upload error
    const handleUploadError = useCallback((error: string) => {
        console.error('Upload error:', error);
        setProcessingStatus('failed');
        setProcessingError(error);
    }, []);

    // Handle change image - reset to upload state
    const handleChangeImage = useCallback(() => {
        setCurrentImage(null);
        setActiveEdit(null);
        setPreviewData(null);
        setChainEditData(null);
        setPreloadedImage(null);
        setSavedFormState(null);
        setProcessingStatus('idle');
        setProcessingError(null);
        setWorkflowState('upload');
    }, []);





    // Handle preview accept
    const handlePreviewAccept = useCallback(async () => {
        if (!previewData) return;

        try {
            const result = await acceptEditAction(userId, previewData.editId);

            if (result.success) {
                // Refresh history
                setHistoryRefreshKey((prev) => prev + 1);

                // Reset to initial state
                setCurrentImage(null);
                setActiveEdit(null);
                setPreviewData(null);
                setChainEditData(null);
                setWorkflowState('upload');

                // Switch back to history tab to see the saved edit
                setActiveTab('history');
            } else {
                throw new Error(result.error || 'Failed to accept edit');
            }
        } catch (error) {
            console.error('Accept error:', error);
            alert(error instanceof Error ? error.message : 'Failed to accept edit');
        }
    }, [previewData, userId]);

    // Handle preview regenerate - reprocess with same parameters
    const handlePreviewRegenerate = useCallback(async () => {
        if (!previewData || !previewData.editParams || !previewData.sourceImageId) {
            // Fallback to going back to upload if we don't have the necessary data
            setPreviewData(null);
            setCurrentImage(null);
            setWorkflowState('upload');
            return;
        }

        try {
            setProcessingStatus('processing');
            setProcessingError(null);

            // Regenerate with the same parameters
            const result = await processEditAction(
                userId,
                previewData.sourceImageId,
                previewData.editType,
                previewData.editParams,
                chainEditData?.parentEditId
            );

            if (result.success && result.editId && result.resultUrl) {
                // Get original image URL
                const originalImageResult = await getOriginalImageAction(userId, result.editId);
                const originalUrl = originalImageResult.success ? originalImageResult.originalUrl || '' : '';

                // Update preview data with new result but keep same parameters
                setPreviewData({
                    editId: result.editId,
                    originalUrl,
                    editedUrl: result.resultUrl,
                    editType: previewData.editType,
                    editParams: previewData.editParams, // Keep original parameters
                    sourceImageId: previewData.sourceImageId, // Keep source image ID
                });

                setProcessingStatus('completed');
                // Stay in preview state to show the new result
            } else {
                throw new Error(result.error || 'Failed to regenerate edit');
            }
        } catch (error) {
            console.error('Regenerate error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate image';
            setProcessingStatus('failed');
            setProcessingError(errorMessage);
            // Stay in preview state so user can try again
        }
    }, [previewData, userId, chainEditData]);

    // Handle preview cancel
    const handlePreviewCancel = useCallback(() => {
        setPreviewData(null);
        setActiveEdit(null);
        setChainEditData(null);
        setCurrentImage(null);
        setPreloadedImage(null);
        setWorkflowState('upload');
    }, []);

    // Handle edit result (chained edit) - Requirement 9.1
    const handleEditResult = useCallback((item: any) => {
        // Set up for a chained edit with the result image
        setChainEditData({
            parentEditId: item.editId,
            imageId: item.editId, // Use the edit ID as the image ID for chained edits
        });

        // Set current image for the chained edit with the result URL
        setCurrentImage({
            imageId: item.editId,
            suggestions: [],
        });

        // Set preloaded image for the uploader
        setPreloadedImage({
            id: item.editId,
            url: item.resultUrl,
        });

        // Clear preview data
        setPreviewData(null);

        // Move back to upload for chained edit
        setWorkflowState('upload');

        // Switch to Create tab to show the upload interface
        setActiveTab('create');
    }, []);

    // Handle back navigation - preserve image and settings
    const handleBack = useCallback(() => {
        if (workflowState === 'preview' && previewData) {
            // Save the form state before going back
            if (previewData.sourceImageId && previewData.originalUrl && previewData.editType) {
                setSavedFormState({
                    editType: previewData.editType,
                    imageId: previewData.sourceImageId,
                    imageUrl: previewData.originalUrl,
                });

                setPreloadedImage({
                    id: previewData.sourceImageId,
                    url: previewData.originalUrl,
                });
                setCurrentImage({
                    imageId: previewData.sourceImageId,
                    suggestions: [],
                });
            }

            // Clear preview and go back to upload state
            setPreviewData(null);
            setProcessingStatus('idle');
            setProcessingError(null);
            setWorkflowState('upload');
        }
    }, [workflowState, previewData]);

    // Active tab state
    const [activeTab, setActiveTab] = useState<string>('create');

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <Card className="mb-6">
                    <CardHeader className="pb-0">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold font-headline">Reimagine Image Toolkit</h1>
                            <p className="text-muted-foreground">Transform property photos with AI</p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <TabsList>
                            <TabsTrigger value="create">Single Edit</TabsTrigger>
                            <TabsTrigger value="multi-angle">Multi-Angle</TabsTrigger>
                            <TabsTrigger value="history">History</TabsTrigger>
                        </TabsList>
                    </CardContent>
                </Card>

                {/* Create Tab */}
                <TabsContent value="create" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Main Workflow */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Navigation Buttons */}
                            <div className="flex items-center justify-between">
                                {workflowState === 'preview' && (
                                    <Button
                                        variant="ghost"
                                        onClick={handleBack}
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back
                                    </Button>
                                )}
                                {(currentImage || previewData) && (
                                    <Button
                                        variant="outline"
                                        onClick={handleChangeImage}
                                        className={cn(!workflowState || workflowState === 'upload' ? 'ml-auto' : '')}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reset
                                    </Button>
                                )}
                            </div>

                            {/* Upload State - Combined with edit type selection */}
                            {workflowState === 'upload' && (
                                <ImageUploader
                                    key={savedFormState ? `saved-${savedFormState.imageId}` : (preloadedImage?.id || 'new')}
                                    userId={userId}
                                    onUploadComplete={handleUploadComplete}
                                    onUploadError={handleUploadError}
                                    onChangeImage={handleChangeImage}
                                    preloadedImageId={savedFormState?.imageId || preloadedImage?.id}
                                    preloadedImageUrl={savedFormState?.imageUrl || preloadedImage?.url}
                                    preselectedEditType={savedFormState?.editType}
                                />
                            )}

                            {/* Processing State */}
                            {workflowState === 'processing' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                                        <CardContent className="p-12">
                                            <div className="flex flex-col items-center justify-center space-y-6">
                                                {/* Animated Icon */}
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.1, 1],
                                                        rotate: [0, 5, -5, 0],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                    className="relative"
                                                >
                                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                                                    <div className="relative bg-primary/10 p-6 rounded-full">
                                                        <Sparkles className="h-12 w-12 text-primary" />
                                                    </div>
                                                </motion.div>

                                                {/* Loading Text */}
                                                <div className="text-center space-y-2">
                                                    <motion.h3
                                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                        className="text-2xl font-headline font-semibold text-primary"
                                                    >
                                                        {previewData?.editType === 'virtual-staging' ? 'Staging your room...' :
                                                            previewData?.editType === 'day-to-dusk' ? 'Transforming to golden hour...' :
                                                                previewData?.editType === 'enhance' ? 'Enhancing your image...' :
                                                                    previewData?.editType === 'item-removal' ? 'Removing unwanted items...' :
                                                                        previewData?.editType === 'virtual-renovation' ? 'Visualizing your renovation...' :
                                                                            'Processing your image...'}
                                                    </motion.h3>
                                                    <p className="text-muted-foreground">
                                                        This may take 30-60 seconds
                                                    </p>
                                                </div>

                                                {/* Progress Dots */}
                                                <div className="flex gap-2">
                                                    {[0, 1, 2].map((i) => (
                                                        <motion.div
                                                            key={i}
                                                            animate={{
                                                                scale: [1, 1.5, 1],
                                                                opacity: [0.3, 1, 0.3],
                                                            }}
                                                            transition={{
                                                                duration: 1.5,
                                                                repeat: Infinity,
                                                                delay: i * 0.2,
                                                            }}
                                                            className="w-2 h-2 bg-primary rounded-full"
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {processingError && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-6"
                                                >
                                                    <StandardErrorDisplay
                                                        title="Processing Error"
                                                        message={processingError}
                                                        variant="error"
                                                    />
                                                </motion.div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {/* Preview State */}
                            {workflowState === 'preview' && previewData && (
                                <EditPreview
                                    originalUrl={previewData.originalUrl}
                                    editedUrl={previewData.editedUrl}
                                    editType={previewData.editType}
                                    onAccept={handlePreviewAccept}
                                    onRegenerate={handlePreviewRegenerate}
                                    onCancel={handlePreviewCancel}
                                    isLoading={processingStatus === 'processing'}
                                />
                            )}
                        </div>

                        {/* Right Column: Rate Limits */}
                        <div className="lg:col-span-1 space-y-6">
                            <RateLimitStatus userId={userId} />
                        </div>
                    </div>
                </TabsContent>

                {/* Multi-Angle Tab */}
                <TabsContent value="multi-angle" className="mt-6">
                    <MultiAngleStagingInterface userId={userId} />
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="mt-6">
                    <EditHistoryList
                        key={historyRefreshKey}
                        userId={userId}
                        onViewEdit={(item) => {
                            // Handle viewing an edit from history
                            setPreviewData({
                                editId: item.editId,
                                originalUrl: item.originalUrl,
                                editedUrl: item.resultUrl,
                                editType: item.editType,
                            });
                            setWorkflowState('preview');
                            // Switch to Create tab to show the preview
                            setActiveTab('create');
                        }}
                        onEditResult={handleEditResult}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
