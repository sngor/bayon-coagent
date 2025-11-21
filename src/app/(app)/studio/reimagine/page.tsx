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
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { useUser } from '@/aws/auth/use-user';
import { StandardPageLayout, StandardErrorDisplay } from '@/components/standard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ImageUploader } from '@/components/reimagine/image-uploader';
import { EditPreview } from '@/components/reimagine/edit-preview';
import { EditHistoryList } from '@/components/reimagine/edit-history-list';
import { ProcessingProgress, type ProcessingStatus } from '@/components/reimagine/processing-progress';
import { RateLimitStatus } from '@/components/reimagine/rate-limit-status';
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
} from '@/app/reimagine-actions';
import type {
    EditType,
    EditSuggestion,
    EditParams,
} from '@/ai/schemas/reimagine-schemas';
import { cn } from '@/lib/utils';

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
            description: 'Transform daytime photos to golden hour',
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
        async (imageId: string, suggestions: EditSuggestion[], editType: EditType, params: EditParams) => {
            setCurrentImage({ imageId, suggestions });

            try {
                setWorkflowState('processing');
                setProcessingStatus('processing');
                setProcessingError(null);

                // Process the edit immediately
                const result = await processEditAction(
                    userId,
                    imageId,
                    editType,
                    params,
                    chainEditData?.parentEditId
                );

                if (result.success && result.editId && result.resultUrl) {
                    // Get original image URL
                    const originalImageResult = await getOriginalImageAction(userId, result.editId);
                    const originalUrl = originalImageResult.success ? originalImageResult.originalUrl || '' : '';

                    setPreviewData({
                        editId: result.editId,
                        originalUrl,
                        editedUrl: result.resultUrl,
                        editType: editType,
                    });

                    setProcessingStatus('completed');
                    setWorkflowState('preview');
                } else {
                    throw new Error(result.error || 'Failed to process edit');
                }
            } catch (error) {
                console.error('Edit processing error:', error);
                const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
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
            } else {
                throw new Error(result.error || 'Failed to accept edit');
            }
        } catch (error) {
            console.error('Accept error:', error);
            alert(error instanceof Error ? error.message : 'Failed to accept edit');
        }
    }, [previewData, userId]);

    // Handle preview regenerate - go back to upload
    const handlePreviewRegenerate = useCallback(() => {
        setPreviewData(null);
        setCurrentImage(null);
        setWorkflowState('upload');
    }, []);

    // Handle preview cancel
    const handlePreviewCancel = useCallback(() => {
        setPreviewData(null);
        setActiveEdit(null);
        setChainEditData(null);
        setCurrentImage(null);
        setWorkflowState('upload');
    }, []);

    // Handle edit result (chained edit) - Requirement 9.1
    const handleEditResult = useCallback((item: any) => {
        // Set up for a chained edit
        setChainEditData({
            parentEditId: item.editId,
            imageId: item.imageId,
        });

        // Set current image for the chained edit
        setCurrentImage({
            imageId: item.imageId,
            suggestions: [],
        });

        // Move back to upload for chained edit
        setWorkflowState('upload');
    }, []);

    // Handle back navigation
    const handleBack = useCallback(() => {
        if (workflowState === 'preview') {
            setPreviewData(null);
            setCurrentImage(null);
            setWorkflowState('upload');
        }
    }, [workflowState]);

    return (
        <StandardPageLayout
            spacing="default"
            maxWidth="wide"
        >
            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Main Workflow */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Back Button */}
                    {workflowState === 'preview' && (
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            className="mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    )}

                    {/* Upload State - Combined with edit type selection */}
                    {workflowState === 'upload' && (
                        <ImageUploader
                            userId={userId}
                            onUploadComplete={handleUploadComplete}
                            onUploadError={handleUploadError}
                        />
                    )}

                    {/* Processing State */}
                    {workflowState === 'processing' && (
                        <Card>
                            <CardContent className="p-8">
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                    <div className="text-center">
                                        <h3 className="font-semibold text-lg mb-1">Processing your image...</h3>
                                        <p className="text-sm text-muted-foreground">
                                            This usually takes 30-60 seconds
                                        </p>
                                    </div>
                                    {processingError && (
                                        <StandardErrorDisplay
                                            title="Processing Error"
                                            message={processingError}
                                            variant="error"
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
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
                        />
                    )}
                </div>

                {/* Right Column: Rate Limits & Edit History (Requirement 11.5) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Rate Limit Status */}
                    <RateLimitStatus userId={userId} />

                    {/* Edit History */}
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
                        }}
                        onEditResult={handleEditResult}
                    />
                </div>
            </div>
        </StandardPageLayout>
    );
}
