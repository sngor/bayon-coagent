/**
 * React hook for uploading files to S3
 * Provides upload progress, error handling, and URL management
 */

import { useState, useCallback } from 'react';
import { uploadFileToS3Action, getPresignedUrlAction, deleteFileFromS3Action } from '@/app/actions';

export interface UseS3UploadOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export interface UseS3UploadReturn {
  upload: (file: File, userId: string, fileType?: string) => Promise<string | null>;
  isUploading: boolean;
  error: string | null;
  uploadedUrl: string | null;
  progress: number;
  reset: () => void;
  getPresignedUrl: (key: string, expiresIn?: number) => Promise<string | null>;
  deleteFile: (key: string) => Promise<boolean>;
}

/**
 * Hook for uploading files to S3
 * 
 * @param options - Configuration options for the upload
 * @returns Upload functions and state
 * 
 * @example
 * ```tsx
 * const { upload, isUploading, error, uploadedUrl } = useS3Upload({
 *   onSuccess: (url) => console.log('Uploaded:', url),
 *   onError: (err) => console.error('Error:', err),
 *   maxSizeMB: 5,
 *   allowedTypes: ['image/jpeg', 'image/png']
 * });
 * 
 * const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *   const file = e.target.files?.[0];
 *   if (file) {
 *     await upload(file, userId, 'profile-image');
 *   }
 * };
 * ```
 */
export function useS3Upload(options: UseS3UploadOptions = {}): UseS3UploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const {
    onSuccess,
    onError,
    maxSizeMB = 10,
    allowedTypes,
  } = options;

  const reset = useCallback(() => {
    setIsUploading(false);
    setError(null);
    setUploadedUrl(null);
    setProgress(0);
  }, []);

  const upload = useCallback(
    async (file: File, userId: string, fileType: string = 'document'): Promise<string | null> => {
      try {
        setIsUploading(true);
        setError(null);
        setProgress(0);

        // Client-side validation
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
          const errorMsg = `File size exceeds ${maxSizeMB}MB limit`;
          setError(errorMsg);
          onError?.(errorMsg);
          return null;
        }

        if (allowedTypes && !allowedTypes.includes(file.type)) {
          const errorMsg = `File type ${file.type} is not allowed`;
          setError(errorMsg);
          onError?.(errorMsg);
          return null;
        }

        // Simulate progress (since we don't have real progress from server action)
        setProgress(30);

        // Try presigned direct-to-S3 upload first to avoid sending large bodies through Server Actions
        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `users/${userId}/${fileType}/${timestamp}-${sanitizedFileName}`;

        setProgress(60);

        try {
          const presigned = await (await import('@/app/actions')).getPresignedUploadUrlAction(key, file.type);
          if (presigned?.success && presigned.url) {
            // Upload directly to S3 using the presigned PUT URL
            const uploadResp = await fetch(presigned.url, {
              method: 'PUT',
              headers: {
                'Content-Type': file.type,
              },
              body: file,
            });

            if (!uploadResp.ok) {
              throw new Error(`Upload failed with status ${uploadResp.status}`);
            }

            // Get a presigned GET URL so the client can access the object
            const getUrlResult = await (await import('@/app/actions')).getPresignedUrlAction(key, 60 * 60 * 24);
            const publicUrl = (getUrlResult && getUrlResult.success && getUrlResult.url) ? getUrlResult.url : undefined;

            setProgress(100);

            if (publicUrl) {
              setUploadedUrl(publicUrl);
              onSuccess?.(publicUrl);
              return publicUrl;
            }

            // If we couldn't get a GET presigned URL, return the presigned PUT url (less ideal)
            setUploadedUrl(presigned.url);
            onSuccess?.(presigned.url);
            return presigned.url;
          }
        } catch (presignErr: any) {
          // Fall back to server-side upload if presigned upload is not available
          console.warn('Presigned upload failed, falling back to server upload:', presignErr);
        }

        // Fallback: create FormData and use server action to upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        formData.append('fileType', fileType);

        setProgress(60);

        const result = await uploadFileToS3Action(formData);

        setProgress(100);

        if (!result.success || !result.url) {
          const errorMsg = result.error || 'Upload failed';
          setError(errorMsg);
          onError?.(errorMsg);
          return null;
        }

        setUploadedUrl(result.url);
        onSuccess?.(result.url);
        return result.url;
      } catch (err: any) {
        const errorMsg = err.message || 'An unexpected error occurred';
        setError(errorMsg);
        onError?.(errorMsg);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [maxSizeMB, allowedTypes, onSuccess, onError]
  );

  const getPresignedUrl = useCallback(
    async (key: string, expiresIn: number = 3600): Promise<string | null> => {
      try {
        const result = await getPresignedUrlAction(key, expiresIn);
        
        if (!result.success || !result.url) {
          const errorMsg = result.error || 'Failed to get presigned URL';
          setError(errorMsg);
          return null;
        }

        return result.url;
      } catch (err: any) {
        const errorMsg = err.message || 'An unexpected error occurred';
        setError(errorMsg);
        return null;
      }
    },
    []
  );

  const deleteFile = useCallback(
    async (key: string): Promise<boolean> => {
      try {
        const result = await deleteFileFromS3Action(key);
        
        if (!result.success) {
          const errorMsg = result.error || 'Failed to delete file';
          setError(errorMsg);
          return false;
        }

        return true;
      } catch (err: any) {
        const errorMsg = err.message || 'An unexpected error occurred';
        setError(errorMsg);
        return false;
      }
    },
    []
  );

  return {
    upload,
    isUploading,
    error,
    uploadedUrl,
    progress,
    reset,
    getPresignedUrl,
    deleteFile,
  };
}
