/**
 * Profile Image Upload Component
 * Specialized component for uploading profile images to S3
 */

'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { useS3Upload } from '@/hooks/use-s3-upload';
import { cn } from '@/lib/utils/common';

export interface ProfileImageUploadProps {
    userId: string;
    currentImageUrl?: string;
    userName?: string;
    onImageUpdate?: (url: string) => void;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
    xl: 'h-40 w-40',
};

/**
 * Profile image upload component with avatar preview
 * 
 * @example
 * ```tsx
 * <ProfileImageUpload
 *   userId={user.uid}
 *   currentImageUrl={profile.photoURL}
 *   userName={profile.name}
 *   onImageUpdate={(url) => updateProfile({ photoURL: url })}
 *   size="lg"
 * />
 * ```
 */
export function ProfileImageUpload({
    userId,
    currentImageUrl,
    userName = 'User',
    onImageUpdate,
    size = 'lg',
    className,
}: ProfileImageUploadProps) {
    const [imageUrl, setImageUrl] = useState(currentImageUrl);
    const [isHovered, setIsHovered] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const reactId = useId();
    const inputId = userId ? `profile-image-input-${userId}` : `profile-image-input-${reactId}`;

    // Update local imageUrl when currentImageUrl prop changes
    useEffect(() => {
        setImageUrl(currentImageUrl);
    }, [currentImageUrl]);

    const { upload, isUploading, error } = useS3Upload({
        maxSizeMB: 5,
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        onSuccess: (url) => {
            setImageUrl(url);
            onImageUpdate?.(url);
        },
    });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        await upload(file, userId, 'profile-image');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className={cn('flex flex-col items-center gap-4', className)}>
            <div
                className="relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <Avatar className={cn(sizeClasses[size], 'border-2 border-border')}>
                    <AvatarImage src={imageUrl} alt={userName} />
                    <AvatarFallback className="text-lg font-semibold">
                        {getInitials(userName)}
                    </AvatarFallback>
                </Avatar>

                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                )}

                {!isUploading && isHovered && (
                    <label
                        htmlFor={inputId}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer transition-opacity"
                    >
                        <Camera className="h-8 w-8 text-white" />
                    </label>
                )}

                <input
                    id={inputId}
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="sr-only"
                    disabled={isUploading}
                />
            </div>

            <div className="text-center">
                <label htmlFor={inputId}>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        onClick={() => inputRef.current?.click()}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Camera className="mr-2 h-4 w-4" />
                                Change Photo
                            </>
                        )}
                    </Button>
                </label>
                {error && (
                    <p className="text-xs text-red-500 mt-2">{error}</p>
                )}
            </div>
        </div>
    );
}
