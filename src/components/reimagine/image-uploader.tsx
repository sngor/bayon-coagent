'use client';

/**
 * Image Uploader Component for Reimagine Image Toolkit
 * 
 * Features:
 * - Drag-and-drop file upload
 * - File validation (size, format)
 * - Upload progress indicator
 * - Image preview after upload
 * - AI-generated suggestions display
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 13.3
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Sparkles, AlertCircle, Image as ImageIcon, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { reAnalyzeImageAction } from '@/app/reimagine-actions';
import { type EditSuggestion } from '@/ai/schemas/reimagine-schemas';
import { cn } from '@/lib/utils';
import { HelpTooltip, HelpText } from './help-tooltip';
import { StandardErrorDisplay } from '@/components/standard';

interface ImageUploaderProps {
    userId: string;
    onUploadComplete: (imageId: string, suggestions: EditSuggestion[]) => void;
    onUploadError: (error: string) => void;
}

export function ImageUploader({
    userId,
    onUploadComplete,
    onUploadError,
}: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<EditSuggestion[]>([]);
    const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
    const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
    const [isReanalyzing, setIsReanalyzing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // File validation
    const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

        if (file.size > MAX_SIZE) {
            return {
                valid: false,
                error: 'File size exceeds 10MB limit. Please compress your image or select a smaller file.',
            };
        }

        if (!SUPPORTED_FORMATS.includes(file.type)) {
            return {
                valid: false,
                error: 'Unsupported file format. Please upload JPEG, PNG, or WebP images.',
            };
        }

        return { valid: true };
    }, []);

    // Handle file selection
    const handleFileSelect = useCallback(
        (file: File) => {
            setError(null);
            setSuggestions([]);
            setUploadedImageId(null);

            // Validate file (Requirement 1.2, 1.3)
            const validation = validateFile(file);
            if (!validation.valid) {
                setError(validation.error!);
                onUploadError(validation.error!);
                return;
            }

            setSelectedFile(file);

            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        },
        [validateFile, onUploadError]
    );

    // Handle file upload
    const handleUpload = useCallback(async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            // Create form data
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('userId', userId);

            // Upload image via API route (Requirement 1.4)
            const response = await fetch('/api/reimagine/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (result.success && result.imageId) {
                setUploadedImageId(result.imageId);
                setSuggestions(result.suggestions || []);

                // Notify parent component
                onUploadComplete(result.imageId, result.suggestions || []);

                // Show analysis error if present but upload succeeded
                if (result.error) {
                    setError(result.error);
                }
            } else {
                setError(result.error || 'Upload failed. Please try again.');
                onUploadError(result.error || 'Upload failed. Please try again.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);
            onUploadError(errorMessage);
        } finally {
            setIsUploading(false);
        }
    }, [selectedFile, userId, onUploadComplete, onUploadError]);

    // Handle drag events
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        },
        [handleFileSelect]
    );

    // Handle file input change
    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFileSelect(files[0]);
            }
        },
        [handleFileSelect]
    );

    // Handle click to select file
    const handleClickToSelect = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    // Clear selection
    const handleClear = useCallback(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setError(null);
        setSuggestions([]);
        setUploadedImageId(null);
        setUploadProgress(0);
        setDismissedSuggestions(new Set());

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    // Handle suggestion dismissal (Requirement 13.10)
    const handleDismissSuggestion = useCallback((editType: string) => {
        setDismissedSuggestions((prev) => {
            const newSet = new Set(prev);
            newSet.add(editType);
            return newSet;
        });
    }, []);

    // Handle re-analysis (Requirement 13.10)
    const handleReanalyze = useCallback(async () => {
        if (!uploadedImageId) return;

        setIsReanalyzing(true);
        setError(null);

        try {
            const result = await reAnalyzeImageAction(userId, uploadedImageId);

            if (result.success && result.suggestions) {
                // Clear dismissed suggestions and show new ones
                setDismissedSuggestions(new Set());
                setSuggestions(result.suggestions);

                // Notify parent component with new suggestions
                onUploadComplete(uploadedImageId, result.suggestions);
            } else {
                setError(result.error || 'Failed to re-analyze image. Please try again.');
            }
        } catch (err) {
            console.error('Re-analysis error:', err);
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);
        } finally {
            setIsReanalyzing(false);
        }
    }, [uploadedImageId, userId, onUploadComplete]);

    // Get priority badge color
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-500 text-white';
            case 'medium':
                return 'bg-yellow-500 text-white';
            case 'low':
                return 'bg-blue-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    // Format edit type for display
    const formatEditType = (editType: string) => {
        return editType
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Property Image
                    <HelpTooltip
                        content="Upload high-quality property photos (1920x1080 or higher recommended). Our AI will analyze your image and suggest the best edits to enhance your listing."
                        side="right"
                    />
                </CardTitle>
                <CardDescription>
                    Upload a property photo to get started. Supports JPEG, PNG, and WebP up to 10MB.
                </CardDescription>
                <HelpText className="mt-2">
                    💡 <strong>Tip:</strong> For best results, use well-lit photos taken from eye level. Turn on all lights for interior shots.
                </HelpText>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileInputChange}
                    className="hidden"
                    aria-label="Upload property image"
                />

                {/* Error display */}
                {error && (
                    <StandardErrorDisplay
                        title="Upload Error"
                        message={error}
                        variant="error"
                    />
                )}

                {/* Upload area or preview */}
                {!selectedFile ? (
                    <div
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleClickToSelect}
                        className={cn(
                            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
                            'hover:border-primary hover:bg-accent/50',
                            isDragging && 'border-primary bg-accent/50 scale-[1.02]',
                            'min-h-[200px] flex flex-col items-center justify-center gap-4'
                        )}
                    >
                        <div className="rounded-full bg-primary/10 p-4">
                            <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-medium">
                                {isDragging ? 'Drop your image here' : 'Drag & drop your image here'}
                            </p>
                            <p className="text-sm text-muted-foreground">or click to browse files</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            JPEG, PNG, or WebP • Max 10MB
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Image preview */}
                        <div className="relative rounded-lg overflow-hidden border bg-muted">
                            {previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-full h-auto max-h-[400px] object-contain"
                                />
                            )}
                            {!uploadedImageId && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={handleClear}
                                    disabled={isUploading}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* File info */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{selectedFile.name}</span>
                            </div>
                            <span className="text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </div>

                        {/* Upload progress */}
                        {isUploading && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Uploading...</span>
                                    <span className="font-medium">{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} />
                            </div>
                        )}

                        {/* Upload button */}
                        {!uploadedImageId && !isUploading && (
                            <Button
                                onClick={handleUpload}
                                className="w-full"
                                size="lg"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Image
                            </Button>
                        )}

                        {/* AI Suggestions (Requirement 13.3, 13.10) */}
                        {uploadedImageId && suggestions.length > 0 && (
                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold">AI Suggestions</h3>
                                        <HelpTooltip
                                            content="Our AI analyzed your image and identified opportunities for improvement. Click any suggestion to automatically pre-fill the edit form with recommended settings."
                                            side="right"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleReanalyze}
                                        disabled={isReanalyzing}
                                    >
                                        <RefreshCw className={cn('h-4 w-4 mr-2', isReanalyzing && 'animate-spin')} />
                                        Re-analyze
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Based on your image, we recommend these edits:
                                </p>
                                <div className="space-y-2">
                                    {suggestions
                                        .filter((suggestion) => !dismissedSuggestions.has(suggestion.editType))
                                        .map((suggestion, index) => (
                                            <Card key={index} className="p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">
                                                                {formatEditType(suggestion.editType)}
                                                            </span>
                                                            <Badge className={getPriorityColor(suggestion.priority)}>
                                                                {suggestion.priority}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {suggestion.reason}
                                                        </p>
                                                        {suggestion.confidence && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 shrink-0"
                                                        onClick={() => handleDismissSuggestion(suggestion.editType)}
                                                        title="Dismiss suggestion"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </Card>
                                        ))}
                                </div>
                                {/* Show message if all suggestions are dismissed */}
                                {suggestions.every((s) => dismissedSuggestions.has(s.editType)) && (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-muted-foreground">
                                            All suggestions dismissed. Click "Re-analyze" to generate new suggestions.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Upload another button */}
                        {uploadedImageId && (
                            <Button
                                variant="outline"
                                onClick={handleClear}
                                className="w-full"
                            >
                                Upload Another Image
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
