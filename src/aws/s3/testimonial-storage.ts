/**
 * Testimonial S3 Storage Utilities
 * 
 * Provides helper functions for managing testimonial client photos in S3
 * following the established folder structure pattern.
 */

import { uploadFile, deleteFile, fileExists } from './client';

/**
 * Generates the S3 key for a testimonial client photo
 * Pattern: users/<userId>/testimonials/<testimonialId>/client-photo.<ext>
 * 
 * @param userId - The agent's user ID
 * @param testimonialId - The testimonial ID
 * @param extension - File extension (e.g., 'jpg', 'png')
 * @returns The S3 key for the client photo
 */
export function getTestimonialPhotoKey(
    userId: string,
    testimonialId: string,
    extension: string = 'jpg'
): string {
    return `users/${userId}/testimonials/${testimonialId}/client-photo.${extension}`;
}

/**
 * Generates the S3 folder prefix for all testimonial photos for a user
 * Pattern: users/<userId>/testimonials/
 * 
 * @param userId - The agent's user ID
 * @returns The S3 prefix for testimonial photos
 */
export function getTestimonialFolderPrefix(userId: string): string {
    return `users/${userId}/testimonials/`;
}

/**
 * Uploads a client photo for a testimonial
 * 
 * @param userId - The agent's user ID
 * @param testimonialId - The testimonial ID
 * @param file - The photo file as Buffer or Blob
 * @param contentType - The MIME type (e.g., 'image/jpeg')
 * @returns The S3 URL of the uploaded photo
 */
export async function uploadTestimonialPhoto(
    userId: string,
    testimonialId: string,
    file: Buffer | Blob,
    contentType: string
): Promise<string> {
    // Extract extension from content type
    const extension = contentType.split('/')[1] || 'jpg';
    const key = getTestimonialPhotoKey(userId, testimonialId, extension);

    const metadata = {
        userId,
        testimonialId,
        uploadedAt: new Date().toISOString(),
    };

    return uploadFile(key, file, contentType, metadata);
}

/**
 * Deletes a client photo for a testimonial
 * 
 * @param userId - The agent's user ID
 * @param testimonialId - The testimonial ID
 * @param extension - File extension (default: 'jpg')
 */
export async function deleteTestimonialPhoto(
    userId: string,
    testimonialId: string,
    extension: string = 'jpg'
): Promise<void> {
    const key = getTestimonialPhotoKey(userId, testimonialId, extension);

    // Check if file exists before attempting to delete
    const exists = await fileExists(key);
    if (exists) {
        await deleteFile(key);
    }
}

/**
 * Deletes all photos associated with a testimonial
 * Tries common image extensions
 * 
 * @param userId - The agent's user ID
 * @param testimonialId - The testimonial ID
 */
export async function deleteAllTestimonialPhotos(
    userId: string,
    testimonialId: string
): Promise<void> {
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    // Attempt to delete all possible extensions
    await Promise.all(
        extensions.map(ext =>
            deleteTestimonialPhoto(userId, testimonialId, ext).catch(() => {
                // Ignore errors if file doesn't exist
            })
        )
    );
}

/**
 * Checks if a testimonial has a client photo
 * 
 * @param userId - The agent's user ID
 * @param testimonialId - The testimonial ID
 * @returns True if a photo exists, false otherwise
 */
export async function testimonialPhotoExists(
    userId: string,
    testimonialId: string
): Promise<boolean> {
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    // Check each extension
    for (const ext of extensions) {
        const key = getTestimonialPhotoKey(userId, testimonialId, ext);
        if (await fileExists(key)) {
            return true;
        }
    }

    return false;
}
