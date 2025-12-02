import { SessionPhoto } from '@/lib/open-house/types';
import { SessionPhotoGallery } from './session-photo-gallery';
import { getSessionPhotos } from '@/app/(app)/open-house/actions';

interface SessionPhotoGalleryWrapperProps {
    sessionId: string;
    initialPhotos: SessionPhoto[];
}

/**
 * Server Component wrapper for SessionPhotoGallery
 * Handles server-side data fetching and refresh
 */
export async function SessionPhotoGalleryWrapper({
    sessionId,
    initialPhotos,
}: SessionPhotoGalleryWrapperProps) {
    return (
        <SessionPhotoGallery
            sessionId={sessionId}
            photos={initialPhotos}
        />
    );
}
