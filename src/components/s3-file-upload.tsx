/**
 * S3 File Upload Component
 * A reusable component for uploading files to S3 with progress indication
 */

'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { useS3Upload } from '@/hooks/use-s3-upload';
import { cn } from '@/lib/utils';

export interface S3FileUploadProps {
    userId: string;
    fileType?: string;
    accept?: string;
    maxSizeMB?: number;
    onUploadComplete?: (url: string) => void;
    onUploadError?: (error: string) => void;
    className?: string;
    buttonText?: string;
    showPreview?: boolean;
}

/**
 * File upload component that uploads to S3
 * 
 * @example
 * ```tsx
 * <S3FileUpload
 *   userId={user.uid}
 *   fileType="profile-image"
 *   accept="image/*"
 *   maxSizeMB={5}
 *   onUploadComplete={(url) => console.log('Uploaded:', url)}
 *   showPreview
 * />
 * ```
 */
export function S3FileUpload({
    userId,
    fileType = 'document',
    accept,
    maxSizeMB = 10,
    onUploadComplete,
    onUploadError,
    className,
    buttonText = 'Upload File',
    showPreview = false,
}: S3FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { upload, isUploading, error, uploadedUrl, progress, reset } = useS3Upload({
        maxSizeMB,
        onSuccess: (url) => {
            onUploadComplete?.(url);
        },
        onError: (err) => {
            onUploadError?.(err);
        },
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);

        // Create preview for images
        if (showPreview && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        await upload(selectedFile, userId, fileType);
    };

    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        reset();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={cn('space-y-4', className)}>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
                aria-label="File upload input"
            />

            {!selectedFile && !uploadedUrl && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleButtonClick}
                    disabled={isUploading}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {buttonText}
                </Button>
            )}

            {selectedFile && !uploadedUrl && (
                <div className="space-y-3">
                    {showPreview && previewUrl && (
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground truncate flex-1">
                            {selectedFile.name}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            disabled={isUploading}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {isUploading && (
                        <div className="space-y-2">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                                Uploading... {progress}%
                            </p>
                        </div>
                    )}

                    {!isUploading && (
                        <Button
                            type="button"
                            onClick={handleUpload}
                            size="sm"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload to S3
                        </Button>
                    )}
                </div>
            )}

            {uploadedUrl && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-green-700 dark:text-green-300">
                        File uploaded successfully
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="ml-auto"
                    >
                        Upload Another
                    </Button>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-700 dark:text-red-300">
                        {error}
                    </span>
                </div>
            )}
        </div>
    );
}
