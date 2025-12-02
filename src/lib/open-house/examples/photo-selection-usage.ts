/**
 * Photo Selection Usage Examples
 * 
 * Demonstrates how to use photo selection for follow-up content generation.
 * 
 * Validates Requirements: 12.4
 */

import {
    generateFollowUpContent,
    getSessionPhotos,
} from '@/app/(app)/open-house/actions';
import type { SessionPhoto } from '@/lib/open-house/types';

/**
 * Example 1: Generate follow-up with selected photos
 * Requirement 12.4: Photos can be selected for follow-up content
 */
export async function generateFollowUpWithPhotos(
    sessionId: string,
    visitorId: string,
    selectedPhotoIds: string[]
): Promise<void> {
    const result = await generateFollowUpContent(
        sessionId,
        visitorId,
        selectedPhotoIds
    );

    if (result.success && result.content) {
        console.log('Follow-up generated with photos');
        console.log('Content ID:', result.content.contentId);
        console.log('Selected photos:', result.content.photoIds);
        console.log('Email subject:', result.content.emailSubject);
    } else {
        console.error('Failed to generate follow-up:', result.error);
    }
}

/**
 * Example 2: Generate follow-up without photos
 */
export async function generateFollowUpWithoutPhotos(
    sessionId: string,
    visitorId: string
): Promise<void> {
    const result = await generateFollowUpContent(
        sessionId,
        visitorId
    );

    if (result.success && result.content) {
        console.log('Follow-up generated without photos');
        console.log('Content ID:', result.content.contentId);
        console.log('Photo IDs:', result.content.photoIds || 'None');
    }
}

/**
 * Example 3: Select top 3 photos for follow-up
 */
export async function selectTopPhotosForFollowUp(
    sessionId: string,
    maxPhotos: number = 3
): Promise<string[]> {
    const result = await getSessionPhotos(sessionId);

    if (!result.success || !result.photos) {
        return [];
    }

    // Select the first N photos (could be based on other criteria)
    return result.photos
        .slice(0, maxPhotos)
        .map(photo => photo.photoId);
}

/**
 * Example 4: Filter photos by AI description keywords
 */
export function filterPhotosByKeywords(
    photos: SessionPhoto[],
    keywords: string[]
): SessionPhoto[] {
    return photos.filter(photo => {
        if (!photo.aiDescription) return false;

        const description = photo.aiDescription.toLowerCase();
        return keywords.some(keyword =>
            description.includes(keyword.toLowerCase())
        );
    });
}

/**
 * Example 5: Select photos for high-interest visitors
 */
export async function selectPhotosForHighInterestVisitor(
    sessionId: string
): Promise<string[]> {
    const result = await getSessionPhotos(sessionId);

    if (!result.success || !result.photos) {
        return [];
    }

    // For high-interest visitors, select photos highlighting key features
    const keyFeatures = ['kitchen', 'master', 'living room', 'backyard'];
    const relevantPhotos = filterPhotosByKeywords(result.photos, keyFeatures);

    // Return up to 3 photo IDs
    return relevantPhotos
        .slice(0, 3)
        .map(photo => photo.photoId);
}

/**
 * Example 6: Validate photo selection
 */
export function validatePhotoSelection(
    selectedPhotoIds: string[],
    availablePhotos: SessionPhoto[],
    maxSelection: number = 3
): { valid: boolean; error?: string } {
    // Check max selection limit
    if (selectedPhotoIds.length > maxSelection) {
        return {
            valid: false,
            error: `Cannot select more than ${maxSelection} photos`,
        };
    }

    // Check if all selected photos exist
    const availablePhotoIds = availablePhotos.map(p => p.photoId);
    const invalidPhotos = selectedPhotoIds.filter(
        id => !availablePhotoIds.includes(id)
    );

    if (invalidPhotos.length > 0) {
        return {
            valid: false,
            error: `Invalid photo IDs: ${invalidPhotos.join(', ')}`,
        };
    }

    return { valid: true };
}

/**
 * Example 7: Get photo URLs for email template
 */
export function getPhotoUrlsForEmail(
    photos: SessionPhoto[],
    selectedPhotoIds: string[]
): Array<{ url: string; description: string }> {
    return photos
        .filter(photo => selectedPhotoIds.includes(photo.photoId))
        .map(photo => ({
            url: photo.url,
            description: photo.aiDescription || 'Property photo',
        }));
}

/**
 * Example 8: Create HTML for photos in email
 */
export function createPhotoEmailHTML(
    photos: SessionPhoto[],
    selectedPhotoIds: string[]
): string {
    const selectedPhotos = photos.filter(p =>
        selectedPhotoIds.includes(p.photoId)
    );

    if (selectedPhotos.length === 0) {
        return '';
    }

    const photoHTML = selectedPhotos
        .map(
            photo => `
        <div style="margin-bottom: 20px;">
            <img 
                src="${photo.url}" 
                alt="${photo.aiDescription || 'Property photo'}"
                style="width: 100%; max-width: 600px; height: auto; border-radius: 8px;"
            />
            ${photo.aiDescription
                    ? `<p style="margin-top: 8px; color: #666; font-size: 14px;">${photo.aiDescription}</p>`
                    : ''
                }
        </div>
    `
        )
        .join('');

    return `
        <div style="margin: 20px 0;">
            <h3 style="margin-bottom: 16px;">Property Photos</h3>
            ${photoHTML}
        </div>
    `;
}

/**
 * Example 9: Track photo selection analytics
 */
export interface PhotoSelectionAnalytics {
    totalPhotos: number;
    selectedPhotos: number;
    selectionRate: number;
    mostSelectedPhoto?: string;
}

export function calculatePhotoSelectionAnalytics(
    allPhotos: SessionPhoto[],
    selectionsByVisitor: Record<string, string[]>
): PhotoSelectionAnalytics {
    const totalPhotos = allPhotos.length;
    const allSelections = Object.values(selectionsByVisitor).flat();
    const selectedPhotos = new Set(allSelections).size;
    const selectionRate = totalPhotos > 0 ? (selectedPhotos / totalPhotos) * 100 : 0;

    // Find most selected photo
    const photoSelectionCounts = allSelections.reduce((acc, photoId) => {
        acc[photoId] = (acc[photoId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const mostSelectedPhoto = Object.entries(photoSelectionCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0];

    return {
        totalPhotos,
        selectedPhotos,
        selectionRate: Math.round(selectionRate),
        mostSelectedPhoto,
    };
}

/**
 * Example 10: Bulk generate follow-ups with smart photo selection
 */
export async function bulkGenerateWithSmartPhotoSelection(
    sessionId: string,
    visitorIds: string[]
): Promise<void> {
    const photosResult = await getSessionPhotos(sessionId);

    if (!photosResult.success || !photosResult.photos) {
        console.log('No photos available for session');
        return;
    }

    const photos = photosResult.photos;

    for (const visitorId of visitorIds) {
        // Smart selection: pick 2-3 random photos for variety
        const shuffled = [...photos].sort(() => Math.random() - 0.5);
        const selectedPhotoIds = shuffled
            .slice(0, Math.floor(Math.random() * 2) + 2) // 2-3 photos
            .map(p => p.photoId);

        const result = await generateFollowUpContent(
            sessionId,
            visitorId,
            selectedPhotoIds
        );

        if (result.success) {
            console.log(`✓ Generated follow-up for visitor ${visitorId} with ${selectedPhotoIds.length} photos`);
        } else {
            console.error(`✗ Failed for visitor ${visitorId}:`, result.error);
        }
    }
}
