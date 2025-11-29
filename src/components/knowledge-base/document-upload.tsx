'use client';

import { useCallback, useState } from 'react';
import { Upload, X, FileText, File, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UploadFile {
    file: File;
    id: string;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

interface DocumentUploadProps {
    onUploadComplete?: (files: File[]) => void;
    maxSize?: number; // in MB
    acceptedTypes?: string[];
    uploadFn?: (file: File) => Promise<any>;
}

const DEFAULT_ACCEPTED_TYPES = ['.pdf', '.docx', '.doc', '.txt', '.md'];
const DEFAULT_MAX_SIZE = 25; // MB

export function DocumentUpload({
    onUploadComplete,
    maxSize = DEFAULT_MAX_SIZE,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    uploadFn,
}: DocumentUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);

    const validateFile = (file: File): string | null => {
        // Check file size
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSize) {
            return `File size exceeds ${maxSize}MB limit`;
        }

        // Check file type
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(extension)) {
            return `File type not supported. Accepted: ${acceptedTypes.join(', ')}`;
        }

        return null;
    };

    const uploadToServer = async (uploadFile: UploadFile) => {
        setUploadFiles((prev) =>
            prev.map((f) =>
                f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f
            )
        );

        try {
            if (uploadFn) {
                // Use provided upload function
                const formData = new FormData();
                formData.append('file', uploadFile.file);

                // We wrap this in a promise to allow for progress simulation if needed, 
                // but for now we just await the result
                await uploadFn(uploadFile.file);
            } else {
                // Simulate upload if no function provided
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += 20;
                    setUploadFiles((prev) =>
                        prev.map((f) =>
                            f.id === uploadFile.id ? { ...f, progress: Math.min(progress, 90) } : f
                        )
                    );
                }, 300);

                await new Promise(resolve => setTimeout(resolve, 2000));
                clearInterval(progressInterval);
            }

            setUploadFiles((prev) =>
                prev.map((f) =>
                    f.id === uploadFile.id
                        ? { ...f, status: 'success' as const, progress: 100 }
                        : f
                )
            );

            // Call onUploadComplete if provided
            if (onUploadComplete) {
                // Wait a bit before calling to show success state
                setTimeout(() => {
                    onUploadComplete([uploadFile.file]);
                }, 500);
            }
        } catch (error) {
            setUploadFiles((prev) =>
                prev.map((f) =>
                    f.id === uploadFile.id
                        ? {
                            ...f,
                            status: 'error' as const,
                            error: error instanceof Error ? error.message : 'Upload failed',
                        }
                        : f
                )
            );
        }
    };

    const handleFiles = useCallback((files: FileList | null) => {
        if (!files) return;

        const newFiles: UploadFile[] = [];

        Array.from(files).forEach((file) => {
            const error = validateFile(file);
            newFiles.push({
                file,
                id: Math.random().toString(36).substring(7),
                progress: 0,
                status: error ? 'error' : 'pending',
                error: error || undefined,
            });
        });

        setUploadFiles((prev) => [...prev, ...newFiles]);

        // Upload valid files
        newFiles.forEach((uploadFile) => {
            if (uploadFile.status === 'error') return;
            uploadToServer(uploadFile);
        });
    }, []);

    const removeFile = (fileId: string) => {
        setUploadFiles((prev) => prev.filter((f) => f.id !== fileId));
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    }, [handleFiles]);

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return FileText;
        return File;
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'relative border-2 border-dashed rounded-lg p-12 transition-colors',
                    isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                )}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    multiple
                    accept={acceptedTypes.join(',')}
                    onChange={handleFileInput}
                />

                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="rounded-full bg-primary/10 p-4">
                        <Upload className="h-8 w-8 text-primary" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                            Drop files here or click to browse
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Supported formats: {acceptedTypes.join(', ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Maximum file size: {maxSize}MB
                        </p>
                    </div>

                    <Button asChild variant="outline">
                        <label htmlFor="file-upload" className="cursor-pointer">
                            Select Files
                        </label>
                    </Button>
                </div>
            </div>

            {/* Upload Progress List */}
            {uploadFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Uploading {uploadFiles.length} file(s)</h4>
                    <div className="space-y-2">
                        {uploadFiles.map((uploadFile) => {
                            const FileIcon = getFileIcon(uploadFile.file.name);

                            return (
                                <div
                                    key={uploadFile.id}
                                    className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                                >
                                    <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium truncate">
                                                {uploadFile.file.name}
                                            </p>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>

                                        {uploadFile.status === 'uploading' && (
                                            <Progress value={uploadFile.progress} className="h-1" />
                                        )}

                                        {uploadFile.status === 'error' && (
                                            <p className="text-xs text-destructive flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {uploadFile.error}
                                            </p>
                                        )}

                                        {uploadFile.status === 'success' && (
                                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Upload complete
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(uploadFile.id)}
                                        className="flex-shrink-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
