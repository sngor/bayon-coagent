/**
 * Security Integration Examples
 * 
 * This file demonstrates how to integrate security features into mobile components
 */

import {
    encryptLocationData,
    decryptLocationData,
    stripExifData,
    deleteVoiceRecording,
    storeSecureToken,
    getSecureToken,
    rateLimiters,
    withRateLimit,
} from './security';

// ============================================================================
// Example 1: Encrypting Location Before Storing
// ============================================================================

export async function saveLocationWithEncryption(
    userId: string,
    location: { latitude: number; longitude: number; accuracy?: number }
) {
    // Encrypt the location data
    const encryptedLocation = await encryptLocationData(location);

    // Store in DynamoDB with encrypted location
    const checkIn = {
        PK: `USER#${userId}`,
        SK: `CHECKIN#${Date.now()}`,
        id: crypto.randomUUID(),
        userId,
        encryptedLocation, // Store encrypted
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
    };

    // Save to database (implementation depends on your repository)
    // await repository.putItem(checkIn);

    return checkIn;
}

export async function retrieveLocationWithDecryption(encryptedLocation: string) {
    // Decrypt when retrieving
    const location = await decryptLocationData(encryptedLocation);
    return location;
}

// ============================================================================
// Example 2: Stripping EXIF Before Upload
// ============================================================================

export async function uploadPhotoWithPrivacy(file: File, userId: string) {
    // Strip EXIF data before uploading
    const strippedFile = await stripExifData(file);

    // Now upload the stripped file to S3
    const formData = new FormData();
    formData.append('file', strippedFile);
    formData.append('userId', userId);

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Upload failed');
    }

    const { url } = await response.json();
    return url;
}

// ============================================================================
// Example 3: Voice Recording with Auto-Delete Option
// ============================================================================

export async function handleVoiceRecordingWithPrivacy(
    userId: string,
    audioBlob: Blob,
    autoDelete: boolean = false
) {
    // Upload audio file
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('userId', userId);

    const uploadResponse = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
    });

    if (!uploadResponse.ok) {
        throw new Error('Audio upload failed');
    }

    const { audioUrl } = await uploadResponse.json();

    // Transcribe the audio
    const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl }),
    });

    if (!transcribeResponse.ok) {
        throw new Error('Transcription failed');
    }

    const { transcription } = await transcribeResponse.json();

    // Save voice note
    const voiceNoteId = crypto.randomUUID();
    const voiceNote = {
        PK: `USER#${userId}`,
        SK: `VOICENOTE#${voiceNoteId}`,
        id: voiceNoteId,
        userId,
        audioUrl,
        transcription,
        duration: 0, // Calculate from blob
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
    };

    // Save to database
    // await repository.putItem(voiceNote);

    // If auto-delete is enabled, delete the audio file but keep transcription
    if (autoDelete) {
        await deleteVoiceRecording(userId, voiceNoteId);
        // Update the record to remove audioUrl
        voiceNote.audioUrl = '';
    }

    return voiceNote;
}

// ============================================================================
// Example 4: Secure Token Storage for OAuth
// ============================================================================

export async function storeOAuthTokenSecurely(
    provider: string,
    accessToken: string,
    refreshToken?: string
) {
    // Store access token
    await storeSecureToken(`oauth_${provider}_access`, accessToken);

    // Store refresh token if available
    if (refreshToken) {
        await storeSecureToken(`oauth_${provider}_refresh`, refreshToken);
    }

    return true;
}

export async function retrieveOAuthToken(provider: string) {
    const accessToken = await getSecureToken(`oauth_${provider}_access`);
    const refreshToken = await getSecureToken(`oauth_${provider}_refresh`);

    return {
        accessToken,
        refreshToken,
    };
}

// ============================================================================
// Example 5: Rate-Limited API Calls
// ============================================================================

export async function analyzePhotoWithRateLimit(
    userId: string,
    photoUrl: string
) {
    // Apply rate limiting to vision API calls
    return withRateLimit(
        userId, // Use userId as the rate limit key
        rateLimiters.vision,
        async () => {
            // Make the actual API call
            const response = await fetch('/api/analyze-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoUrl }),
            });

            if (!response.ok) {
                throw new Error('Photo analysis failed');
            }

            return response.json();
        }
    );
}

export async function transcribeAudioWithRateLimit(
    userId: string,
    audioUrl: string
) {
    // Apply rate limiting to transcription API calls
    return withRateLimit(
        userId,
        rateLimiters.transcription,
        async () => {
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioUrl }),
            });

            if (!response.ok) {
                throw new Error('Transcription failed');
            }

            return response.json();
        }
    );
}

export async function sharePropertyWithRateLimit(
    userId: string,
    propertyId: string,
    method: 'qr' | 'sms' | 'email'
) {
    // Apply rate limiting to share operations
    return withRateLimit(
        userId,
        rateLimiters.share,
        async () => {
            const response = await fetch('/api/share-property', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId, method }),
            });

            if (!response.ok) {
                throw new Error('Share failed');
            }

            return response.json();
        }
    );
}

// ============================================================================
// Example 6: Complete Quick Capture Flow with Security
// ============================================================================

export async function secureQuickCapture(
    userId: string,
    captureType: 'photo' | 'voice',
    file: File | Blob,
    location?: { latitude: number; longitude: number; accuracy?: number }
) {
    let processedFile: File | Blob = file;
    let encryptedLocation: string | undefined;

    // If it's a photo, strip EXIF data
    if (captureType === 'photo' && file instanceof File) {
        processedFile = await stripExifData(file);
    }

    // If location is provided, encrypt it
    if (location) {
        encryptedLocation = await encryptLocationData(location);
    }

    // Apply rate limiting based on capture type
    const limiter = captureType === 'photo' ? rateLimiters.vision : rateLimiters.transcription;

    return withRateLimit(userId, limiter, async () => {
        // Upload the processed file
        const formData = new FormData();
        formData.append('file', processedFile);
        formData.append('userId', userId);
        formData.append('type', captureType);
        if (encryptedLocation) {
            formData.append('encryptedLocation', encryptedLocation);
        }

        const response = await fetch('/api/quick-capture', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Quick capture failed');
        }

        return response.json();
    });
}

// ============================================================================
// Example 7: Privacy-Aware Share Flow
// ============================================================================

export async function privacyAwareShare(
    userId: string,
    propertyId: string,
    photos: File[],
    method: 'qr' | 'sms' | 'email' | 'social'
) {
    // Strip EXIF from all photos before sharing
    const strippedPhotos = await Promise.all(
        photos.map(photo => stripExifData(photo))
    );

    // Apply rate limiting
    return withRateLimit(userId, rateLimiters.share, async () => {
        // Upload stripped photos
        const uploadPromises = strippedPhotos.map(async (photo) => {
            const formData = new FormData();
            formData.append('file', photo);
            formData.append('userId', userId);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Photo upload failed');
            }

            const { url } = await response.json();
            return url;
        });

        const photoUrls = await Promise.all(uploadPromises);

        // Create share with stripped photos
        const response = await fetch('/api/share-property', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                propertyId,
                method,
                photoUrls,
            }),
        });

        if (!response.ok) {
            throw new Error('Share creation failed');
        }

        return response.json();
    });
}
