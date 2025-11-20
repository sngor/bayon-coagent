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
import { StandardPageLayout } from '@/components/standard';
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

// Workflow states
type WorkflowState =
    | 'select-edit-type' // Initial state: select what edit to perform
    | 'upload'           // Edit type selected: upload image
    | 'configure-edit'   // Image uploaded: configure parameters
    | 'processing'       // Edit processing
    | 'preview'          // Edit complete: preview result
    | 'history';         // View edit history

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
    const [workflowState, setWorkflowState] = useState<WorkflowState>('select-edit-type');
    const [currentImage, setCurrentImage] = useState<CurrentImage | null>(null);
    const [activeEdit, setActiveEdit] = useState<ActiveEdit | null>(null);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [chainEditData, setChainEditData] = useState<ChainEditData | null>(null);

    // Processing state
    const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
    const [processingError, setProcessingError] = useState<string | null>(null);
    const [processingProgress, setProcessingProgress] = useState(0);

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

    // Handle edit type selection (new first step)
    const handleEditTypeSelect = useCallback((editType: EditType) => {
        setActiveEdit({ editType });
        setWorkflowState('upload');
    }, []);

    // Handle upload complete
    const handleUploadComplete = useCallback(
        (imageId: string, suggestions: EditSuggestion[]) => {
            setCurrentImage({ imageId, suggestions });
            setWorkflowState('configure-edit');
        },
        []
    );

    // Handle upload error
    const handleUploadError = useCallback((error: string) => {
        console.error('Upload error:', error);
        setProcessingStatus('failed');
        setProcessingError(error);
    }, []);



    // Handle edit form submission
    const handleEditSubmit = useCallback(
        async (params: EditParams) => {
            if (!currentImage || !activeEdit) return;

            try {
                setWorkflowState('processing');
                setProcessingStatus('processing');
                setProcessingError(null);
                setProcessingProgress(0);

                // Simulate progress updates
                const progressInterval = setInterval(() => {
                    setProcessingProgress((prev) => {
                        if (prev >= 90) {
                            clearInterval(progressInterval);
                            return 90;
                        }
                        return prev + 10;
                    });
                }, 1000);

                // Process the edit (with optional parent edit ID for chaining)
                const result = await processEditAction(
                    userId,
                    currentImage.imageId,
                    activeEdit.editType,
                    params,
                    chainEditData?.parentEditId // Pass parent edit ID if this is a chained edit
                );

                clearInterval(progressInterval);
                setProcessingProgress(100);

                if (result.success && result.editId && result.resultUrl) {
                    // Get original image URL from the getOriginalImageAction
                    const originalImageResult = await getOriginalImageAction(userId, result.editId);
                    const originalUrl = originalImageResult.success ? originalImageResult.originalUrl || '' : '';

                    setPreviewData({
                        editId: result.editId,
                        originalUrl,
                        editedUrl: result.resultUrl,
                        editType: activeEdit.editType,
                    });

                    setProcessingStatus('completed');
                    setWorkflowState('preview');
                } else {
                    throw new Error(result.error || 'Failed to process edit');
                }
            } catch (error) {
                console.error('Edit processing error:', error);
                const errorMessage =
                    error instanceof Error ? error.message : 'An unexpected error occurred';
                setProcessingStatus('failed');
                setProcessingError(errorMessage);
            }
        },
        [currentImage, activeEdit, userId, chainEditData]
    );

    // Handle edit form cancel
    const handleEditCancel = useCallback(() => {
        setActiveEdit(null);
        setWorkflowState('select-edit');
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
                setWorkflowState('select-edit-type');
            } else {
                throw new Error(result.error || 'Failed to accept edit');
            }
        } catch (error) {
            console.error('Accept error:', error);
            alert(error instanceof Error ? error.message : 'Failed to accept edit');
        }
    }, [previewData, userId]);

    // Handle preview regenerate
    const handlePreviewRegenerate = useCallback(() => {
        setPreviewData(null);
        setWorkflowState('configure-edit');
    }, []);

    // Handle preview cancel
    const handlePreviewCancel = useCallback(() => {
        setPreviewData(null);
        setActiveEdit(null);
        setChainEditData(null);
        setWorkflowState('select-edit');
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
            suggestions: [], // No suggestions for chained edits
        });

        // Move to edit type selection for chained edit
        setWorkflowState('select-edit-type');
    }, []);

    // Handle back navigation
    const handleBack = useCallback(() => {
        switch (workflowState) {
            case 'upload':
                setActiveEdit(null);
                setCurrentImage(null);
                setWorkflowState('select-edit-type');
                break;
            case 'configure-edit':
                setCurrentImage(null);
                setWorkflowState('upload');
                break;
            case 'preview':
                setPreviewData(null);
                setWorkflowState('configure-edit');
                break;
            default:
                break;
        }
    }, [workflowState]);

    // Render edit form based on active edit type
    const renderEditForm = () => {
        if (!activeEdit) return null;

        const baseProps = {
            onSubmit: handleEditSubmit,
            onCancel: handleEditCancel,
            isProcessing: processingStatus === 'processing',
        };

        switch (activeEdit.editType) {
            case 'virtual-staging':
                return (
                    <VirtualStagingForm
                        {...baseProps}
                        defaultValues={activeEdit.suggestedParams as any}
                    />
                );
            case 'day-to-dusk':
                return (
                    <DayToDuskForm
                        {...baseProps}
                        defaultValues={activeEdit.suggestedParams as any}
                    />
                );
            case 'enhance':
                return (
                    <EnhanceForm
                        {...baseProps}
                        defaultValues={activeEdit.suggestedParams as any}
                    />
                );
            case 'item-removal':
                return (
                    <ItemRemovalForm
                        {...baseProps}
                        defaultValues={activeEdit.suggestedParams as any}
                    />
                );
            case 'virtual-renovation':
                return (
                    <VirtualRenovationForm
                        {...baseProps}
                        defaultValues={activeEdit.suggestedParams as any}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <StandardPageLayout
            title="Reimagine Image Toolkit"
            description="Transform your property photos with AI-powered editing tools"
            spacing="default"
            maxWidth="wide"
        >
            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Main Workflow */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Back Button */}
                    <AnimatePresence>
                        {workflowState !== 'select-edit-type' && workflowState !== 'processing' && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="mb-4"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Edit Type Selection State */}
                    <AnimatePresence mode="wait">
                        {workflowState === 'select-edit-type' && (
                            <motion.div
                                key="select-edit-type"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Choose Your Edit Type</CardTitle>
                                        <CardDescription>
                                            Select the type of transformation you want to apply to your property photo
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {editTypes.map((type) => (
                                                <Card
                                                    key={type.id}
                                                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-2 hover:border-primary"
                                                    onClick={() => handleEditTypeSelect(type.id)}
                                                >
                                                    <CardContent className="p-6">
                                                        <div className="flex items-start gap-4">
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-2xl flex-shrink-0",
                                                                type.color
                                                            )}>
                                                                {type.icon}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h3 className="font-semibold text-lg mb-1">
                                                                    {type.title}
                                                                </h3>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {type.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Upload State */}
                        {workflowState === 'upload' && activeEdit && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-4"
                            >
                                {/* Show selected edit type */}
                                <Card className="border-primary bg-primary/5">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                            <span className="font-medium">
                                                Selected: {activeEdit.editType
                                                    .split('-')
                                                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                                    .join(' ')}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                                <ImageUploader
                                    userId={userId}
                                    onUploadComplete={handleUploadComplete}
                                    onUploadError={handleUploadError}
                                />
                            </motion.div>
                        )}

                        {/* Configure Edit State */}
                        {workflowState === 'configure-edit' && activeEdit && (
                            <motion.div
                                key="configure-edit"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-4"
                            >
                                <div>
                                    <h2 className="text-2xl font-bold font-headline mb-2">
                                        Configure{' '}
                                        {activeEdit.editType
                                            .split('-')
                                            .map(
                                                (word) =>
                                                    word.charAt(0).toUpperCase() + word.slice(1)
                                            )
                                            .join(' ')}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Adjust the parameters for your edit
                                    </p>
                                </div>
                                {renderEditForm()}
                            </motion.div>
                        )}

                        {/* Processing State */}
                        {workflowState === 'processing' && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <ProcessingProgress
                                    status={processingStatus}
                                    progress={processingProgress}
                                    error={processingError || undefined}
                                    onRetry={() => {
                                        setWorkflowState('configure-edit');
                                        setProcessingStatus('idle');
                                        setProcessingError(null);
                                    }}
                                />
                            </motion.div>
                        )}

                        {/* Preview State */}
                        {workflowState === 'preview' && previewData && (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <EditPreview
                                    originalUrl={previewData.originalUrl}
                                    editedUrl={previewData.editedUrl}
                                    editType={previewData.editType}
                                    onAccept={handlePreviewAccept}
                                    onRegenerate={handlePreviewRegenerate}
                                    onCancel={handlePreviewCancel}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
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
