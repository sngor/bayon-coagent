/**
 * Photo Management Usage Examples
 * 
 * Demonstrates how to use the photo capture and storage functionality
 * for open house sessions.
 * 
 * Validates Requirements: 12.1, 12.2, 12.3
 */

import {
    uploadSessionPhoto,
    getSessionPhotos,
    deleteSessionPhoto,
} from '@/app/(app)/open-house/actions';

/**
 * Example 1: Upload a photo from a file input
 * Requirement 12.1: Photos are associated with sessions
 * Requirement 12.2: Photo uploads generate AI descriptions
 */
export async function uploadPhotoFromFileInput(
    sessionId: string,
    file: File
): Promise<void> {
    // Convert file to base64
    const reader = new FileReader();

    reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        // Upload photo with AI description generation
        const result = await uploadSessionPhoto(
            sessionId,
            base64,
            file.type
        );

        if (result.success && result.photo) {
            console.log('Photo uploaded successfully');
            console.log('Photo ID:', result.photo.photoId);
            console.log('Photo URL:', result.photo.url);
            console.log('AI Description:', result.photo.aiDescription);
        } else {
            console.error('Upload failed:', result.error);
        }
    };

    reader.readAsDataURL(file);
}

/**
 * Example 2: Upload a photo from a Buffer (server-side)
 * Requirement 12.1: Photos are associated with sessions
 */
export async function uploadPhotoFromBuffer(
    sessionId: string,
    imageBuffer: Buffer,
    contentType: string
): Promise<void> {
    const result = await uploadSessionPhoto(
        sessionId,
        imageBuffer,
        contentType
    );

    if (result.success && result.photo) {
        console.log('Photo uploaded:', result.photo.photoId);
        console.log('S3 Key:', result.photo.s3Key);
        console.log('URL:', result.photo.url);

        if (result.photo.aiDescription) {
            console.log('AI generated description:', result.photo.aiDescription);
        }
    }
}

/**
 * Example 3: Retrieve all photos for a session
 * Requirement 12.3: Session photos are retrievable
 */
export async function displaySessionPhotos(sessionId: string): Promise<void> {
    const result = await getSessionPhotos(sessionId);

    if (result.success && result.photos) {
        console.log(`Found ${result.photos.length} photos`);

        result.photos.forEach((photo, index) => {
            console.log(`\nPhoto ${index + 1}:`);
            console.log('  ID:', photo.photoId);
            console.log('  URL:', photo.url);
            console.log('  Captured:', new Date(photo.capturedAt).toLocaleString());

            if (photo.aiDescription) {
                console.log('  Description:', photo.aiDescription);
            }
        });
    }
}

/**
 * Example 4: Delete a photo from a session
 */
export async function removePhoto(
    sessionId: string,
    photoId: string
): Promise<void> {
    const result = await deleteSessionPhoto(sessionId, photoId);

    if (result.success) {
        console.log('Photo deleted successfully');
    } else {
        console.error('Delete failed:', result.error);
    }
}

/**
 * Example 5: Upload multiple photos in sequence
 * Requirement 12.1: Photos are associated with sessions
 */
export async function uploadMultiplePhotos(
    sessionId: string,
    files: File[]
): Promise<void> {
    console.log(`Uploading ${files.length} photos...`);

    const results = await Promise.all(
        files.map(async (file) => {
            const reader = new FileReader();

            return new Promise<void>((resolve) => {
                reader.onload = async (e) => {
                    const base64 = e.target?.result as string;
                    const result = await uploadSessionPhoto(
                        sessionId,
                        base64,
                        file.type
                    );

                    if (result.success) {
                        console.log(`✓ Uploaded: ${file.name}`);
                        if (result.photo?.aiDescription) {
                            console.log(`  AI: ${result.photo.aiDescription}`);
                        }
                    } else {
                        console.error(`✗ Failed: ${file.name} - ${result.error}`);
                    }

                    resolve();
                };

                reader.readAsDataURL(file);
            });
        })
    );

    console.log('All uploads complete');
}

/**
 * Example 6: Display photos in a gallery with AI descriptions
 * Requirement 12.3: Session photos are retrievable
 * Requirement 12.4: Photos can be included in follow-up content
 */
export async function createPhotoGalleryHTML(sessionId: string): Promise<string> {
    const result = await getSessionPhotos(sessionId);

    if (!result.success || !result.photos) {
        return '<p>No photos available</p>';
    }

    const photoCards = result.photos.map((photo) => `
        <div class="photo-card">
            <img src="${photo.url}" alt="${photo.aiDescription || 'Session photo'}" />
            ${photo.aiDescription ? `
                <div class="photo-description">
                    <p>${photo.aiDescription}</p>
                </div>
            ` : ''}
            <div class="photo-meta">
                <small>Captured: ${new Date(photo.capturedAt).toLocaleString()}</small>
            </div>
        </div>
    `).join('');

    return `
        <div class="photo-gallery">
            <h3>Open House Photos</h3>
            <div class="photo-grid">
                ${photoCards}
            </div>
        </div>
    `;
}

/**
 * Example 7: Get photos for use in follow-up emails
 * Requirement 12.4: Photos can be selected for follow-up content
 */
export async function getPhotosForFollowUp(
    sessionId: string,
    maxPhotos: number = 3
): Promise<Array<{ url: string; description: string }>> {
    const result = await getSessionPhotos(sessionId);

    if (!result.success || !result.photos) {
        return [];
    }

    // Return up to maxPhotos with descriptions
    return result.photos
        .slice(0, maxPhotos)
        .map((photo) => ({
            url: photo.url,
            description: photo.aiDescription || 'Property photo',
        }));
}

/**
 * Example 8: Validate photo before upload
 */
export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
        return {
            valid: false,
            error: 'File must be an image',
        };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'File size must be less than 10MB',
        };
    }

    // Check file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(extension)) {
        return {
            valid: false,
            error: 'File must be a valid image format (JPG, PNG, GIF, WebP)',
        };
    }

    return { valid: true };
}

/**
 * Example 9: Batch delete photos
 */
export async function deleteMultiplePhotos(
    sessionId: string,
    photoIds: string[]
): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const photoId of photoIds) {
        const result = await deleteSessionPhoto(sessionId, photoId);
        if (result.success) {
            success++;
        } else {
            failed++;
            console.error(`Failed to delete photo ${photoId}:`, result.error);
        }
    }

    return { success, failed };
}

/**
 * Example 10: Get photo statistics for a session
 */
export async function getPhotoStatistics(sessionId: string): Promise<{
    totalPhotos: number;
    photosWithDescriptions: number;
    averageDescriptionLength: number;
    oldestPhoto?: Date;
    newestPhoto?: Date;
}> {
    const result = await getSessionPhotos(sessionId);

    if (!result.success || !result.photos || result.photos.length === 0) {
        return {
            totalPhotos: 0,
            photosWithDescriptions: 0,
            averageDescriptionLength: 0,
        };
    }

    const photos = result.photos;
    const photosWithDescriptions = photos.filter((p) => p.aiDescription).length;

    const totalDescriptionLength = photos.reduce(
        (sum, p) => sum + (p.aiDescription?.length || 0),
        0
    );
    const averageDescriptionLength = photosWithDescriptions > 0
        ? totalDescriptionLength / photosWithDescriptions
        : 0;

    const timestamps = photos.map((p) => new Date(p.capturedAt).getTime());
    const oldestPhoto = new Date(Math.min(...timestamps));
    const newestPhoto = new Date(Math.max(...timestamps));

    return {
        totalPhotos: photos.length,
        photosWithDescriptions,
        averageDescriptionLength: Math.round(averageDescriptionLength),
        oldestPhoto,
        newestPhoto,
    };
}
