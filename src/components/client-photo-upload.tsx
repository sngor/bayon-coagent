"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useS3Upload } from "@/hooks/use-s3-upload";
import Image from "next/image";

interface ClientPhotoUploadProps {
    userId: string;
    currentPhotoUrl?: string;
    onPhotoUploaded: (url: string) => void;
    onPhotoRemoved?: () => void;
}

export function ClientPhotoUpload({
    userId,
    currentPhotoUrl,
    onPhotoUploaded,
    onPhotoRemoved,
}: ClientPhotoUploadProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        currentPhotoUrl || null
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { upload, isUploading, error } = useS3Upload({
        maxSizeMB: 5,
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
        onSuccess: (url) => {
            setPreviewUrl(url);
            onPhotoUploaded(url);
        },
        onError: (err) => {
            console.error("Upload error:", err);
        },
    });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to S3
        await upload(file, userId, "testimonials");
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onPhotoRemoved?.();
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">Client Photo (Optional)</label>

            {previewUrl ? (
                <Card className="relative w-full max-w-xs">
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                        <Image
                            src={previewUrl}
                            alt="Client photo"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemove}
                        disabled={isUploading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </Card>
            ) : (
                <Card
                    className="border-2 border-dashed cursor-pointer hover:border-primary transition-colors"
                    onClick={handleClick}
                >
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        {isUploading ? (
                            <>
                                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
                                <p className="text-sm text-muted-foreground">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-sm font-medium mb-1">
                                    Click to upload client photo
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    PNG, JPG or WebP (max 5MB)
                                </p>
                            </>
                        )}
                    </div>
                </Card>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
                aria-label="Upload client photo"
            />

            {error && (
                <p className="text-sm text-destructive" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
