/**
 * Testimonial Service
 * 
 * High-level service functions that combine repository and S3 operations
 * for testimonial management.
 */

import {
    createTestimonial,
    getTestimonial,
    updateTestimonial,
    deleteTestimonial,
    queryTestimonials,
    queryFeaturedTestimonials,
} from './testimonial-repository';
import {
    uploadTestimonialPhoto,
    deleteAllTestimonialPhotos,
} from '../s3/testimonial-storage';
import { Testimonial } from '@/lib/types';
import { QueryOptions, QueryResult } from './types';

/**
 * Uploads a client photo and associates it with a testimonial
 * 
 * @param userId User ID
 * @param testimonialId Testimonial ID
 * @param file Photo file as Buffer or Blob
 * @param contentType MIME type of the photo
 * @returns The S3 URL of the uploaded photo
 */
export async function uploadClientPhoto(
    userId: string,
    testimonialId: string,
    file: Buffer | Blob,
    contentType: string
): Promise<string> {
    // Upload the photo to S3
    const photoUrl = await uploadTestimonialPhoto(
        userId,
        testimonialId,
        file,
        contentType
    );

    // Update the testimonial record with the photo URL
    await updateTestimonial(userId, testimonialId, {
        clientPhotoUrl: photoUrl,
    });

    return photoUrl;
}

/**
 * Deletes a testimonial and all associated S3 assets atomically
 * 
 * @param userId User ID
 * @param testimonialId Testimonial ID
 */
export async function deleteTestimonialWithAssets(
    userId: string,
    testimonialId: string
): Promise<void> {
    // Get the testimonial to check if it has a photo
    const testimonial = await getTestimonial(userId, testimonialId);

    if (!testimonial) {
        throw new Error(`Testimonial not found: ${testimonialId}`);
    }

    // Delete S3 assets first (if they exist)
    if (testimonial.clientPhotoUrl) {
        try {
            await deleteAllTestimonialPhotos(userId, testimonialId);
        } catch (error) {
            console.error('Error deleting testimonial photos:', error);
            // Continue with DynamoDB deletion even if S3 deletion fails
        }
    }

    // Delete the DynamoDB record
    await deleteTestimonial(userId, testimonialId);
}

// Re-export repository functions for convenience
export {
    createTestimonial,
    getTestimonial,
    updateTestimonial,
    queryTestimonials,
    queryFeaturedTestimonials,
};

export type { Testimonial, QueryOptions, QueryResult };
