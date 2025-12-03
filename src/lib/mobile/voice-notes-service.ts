/**
 * Voice Notes Service
 * 
 * Handles voice note operations including:
 * - Audio upload to S3
 * - Transcription via AWS Transcribe
 * - Property attachment
 * - Photo compression and upload
 * - Cloud sync to DynamoDB
 * - Offline queue support
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { v4 as uuidv4 } from 'uuid';
import { uploadFile, getPresignedUrl } from '@/aws/s3';
import { getRepository } from '@/aws/dynamodb/repository';
import { offlineSyncManager } from '@/lib/offline-sync-manager';

export interface VoiceNoteMetadata {
    id: string;
    userId: string;
    audioUrl: string;
    audioS3Key: string;
    duration: number;
    transcription?: string;
    transcriptionConfidence?: number;
    propertyId?: string;
    propertyAddress?: string;
    photoUrls?: string[];
    photoS3Keys?: string[];
    location?: {
        latitude: number;
        longitude: number;
        accuracy: number;
    };
    notes?: string;
    timestamp: number;
    createdAt: string;
    updatedAt: string;
    synced: boolean;
}

export interface SaveVoiceNoteOptions {
    userId: string;
    audioBlob: Blob;
    duration: number;
    propertyId?: string;
    propertyAddress?: string;
    photos?: File[];
    location?: {
        latitude: number;
        longitude: number;
        accuracy: number;
    };
    notes?: string;
    timestamp: number;
}

export interface TranscriptionResult {
    transcript: string;
    confidence: number;
    keyPhrases?: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
}

/**
 * Compress image for mobile upload
 */
async function compressImage(file: File, maxSizeMB: number = 2): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions (max 1920px width)
                const maxWidth = 1920;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob with compression
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    'image/jpeg',
                    0.85 // 85% quality
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Upload audio file to S3
 */
async function uploadAudio(
    userId: string,
    noteId: string,
    audioBlob: Blob
): Promise<{ s3Key: string; url: string }> {
    const timestamp = Date.now();
    const extension = audioBlob.type.includes('webm') ? 'webm' : 'mp4';
    const s3Key = `users/${userId}/voice-notes/${noteId}/audio-${timestamp}.${extension}`;

    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadFile(s3Key, buffer, audioBlob.type);

    const url = await getPresignedUrl(s3Key, 3600); // 1 hour expiration

    return { s3Key, url };
}

/**
 * Upload photos to S3 with compression
 */
async function uploadPhotos(
    userId: string,
    noteId: string,
    photos: File[]
): Promise<{ s3Keys: string[]; urls: string[] }> {
    const s3Keys: string[] = [];
    const urls: string[] = [];

    for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        // Compress image
        const compressedBlob = await compressImage(photo);

        // Generate S3 key
        const timestamp = Date.now();
        const s3Key = `users/${userId}/voice-notes/${noteId}/photo-${i}-${timestamp}.jpg`;

        // Upload to S3
        const arrayBuffer = await compressedBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await uploadFile(s3Key, buffer, 'image/jpeg');

        // Get presigned URL
        const url = await getPresignedUrl(s3Key, 3600);

        s3Keys.push(s3Key);
        urls.push(url);
    }

    return { s3Keys, urls };
}

/**
 * Save voice note to DynamoDB
 */
async function saveToDatabase(
    metadata: VoiceNoteMetadata
): Promise<void> {
    const repository = getRepository();

    const pk = `USER#${metadata.userId}`;
    const sk = `VOICENOTE#${metadata.id}`;

    await repository.create(pk, sk, 'VoiceNote', metadata);
}

/**
 * Queue voice note for offline sync
 */
async function queueForOfflineSync(
    options: SaveVoiceNoteOptions,
    audioBase64: string,
    photosBase64?: string[]
): Promise<string> {
    const noteId = uuidv4();

    await offlineSyncManager.queueOperation({
        type: 'voice-note',
        data: {
            noteId,
            userId: options.userId,
            audioData: audioBase64,
            audioFormat: options.audioBlob.type,
            duration: options.duration,
            propertyId: options.propertyId,
            propertyAddress: options.propertyAddress,
            photosData: photosBase64,
            location: options.location,
            notes: options.notes,
            timestamp: options.timestamp
        },
        timestamp: Date.now()
    });

    return noteId;
}

/**
 * Main function to save voice note
 * Handles both online and offline scenarios
 */
export async function saveVoiceNote(
    options: SaveVoiceNoteOptions
): Promise<{ noteId: string; metadata?: VoiceNoteMetadata }> {
    const noteId = uuidv4();

    // Check if online
    const isOnline = navigator.onLine;

    if (!isOnline) {
        // Queue for offline sync
        const audioArrayBuffer = await options.audioBlob.arrayBuffer();
        const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');

        let photosBase64: string[] | undefined;
        if (options.photos && options.photos.length > 0) {
            photosBase64 = [];
            for (const photo of options.photos) {
                const photoArrayBuffer = await photo.arrayBuffer();
                const photoBase64 = Buffer.from(photoArrayBuffer).toString('base64');
                photosBase64.push(photoBase64);
            }
        }

        await queueForOfflineSync(options, audioBase64, photosBase64);

        return { noteId };
    }

    // Online: Upload and save immediately
    try {
        // Upload audio
        const { s3Key: audioS3Key, url: audioUrl } = await uploadAudio(
            options.userId,
            noteId,
            options.audioBlob
        );

        // Upload photos if present
        let photoUrls: string[] | undefined;
        let photoS3Keys: string[] | undefined;
        if (options.photos && options.photos.length > 0) {
            const photoResult = await uploadPhotos(options.userId, noteId, options.photos);
            photoUrls = photoResult.urls;
            photoS3Keys = photoResult.s3Keys;
        }

        // Create metadata
        const metadata: VoiceNoteMetadata = {
            id: noteId,
            userId: options.userId,
            audioUrl,
            audioS3Key,
            duration: options.duration,
            propertyId: options.propertyId,
            propertyAddress: options.propertyAddress,
            photoUrls,
            photoS3Keys,
            location: options.location,
            notes: options.notes,
            timestamp: options.timestamp,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            synced: true
        };

        // Save to database
        await saveToDatabase(metadata);

        return { noteId, metadata };

    } catch (error) {
        console.error('Error saving voice note:', error);

        // Fallback to offline queue
        const audioArrayBuffer = await options.audioBlob.arrayBuffer();
        const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');

        let photosBase64: string[] | undefined;
        if (options.photos && options.photos.length > 0) {
            photosBase64 = [];
            for (const photo of options.photos) {
                const photoArrayBuffer = await photo.arrayBuffer();
                const photoBase64 = Buffer.from(photoArrayBuffer).toString('base64');
                photosBase64.push(photoBase64);
            }
        }

        await queueForOfflineSync(options, audioBase64, photosBase64);

        throw error;
    }
}

/**
 * Get voice notes for a user
 */
export async function getVoiceNotes(
    userId: string,
    limit: number = 50
): Promise<VoiceNoteMetadata[]> {
    const repository = getRepository();

    const pk = `USER#${userId}`;
    const skPrefix = 'VOICENOTE#';

    const result = await repository.query(pk, {
        limit,
        scanIndexForward: false // Most recent first
    });

    return result.items
        .filter((item: any) => item.SK.startsWith(skPrefix))
        .map((item: any) => item.Data as VoiceNoteMetadata);
}

/**
 * Get voice notes for a specific property
 */
export async function getVoiceNotesForProperty(
    userId: string,
    propertyId: string
): Promise<VoiceNoteMetadata[]> {
    const allNotes = await getVoiceNotes(userId, 100);
    return allNotes.filter(note => note.propertyId === propertyId);
}

/**
 * Delete voice note
 */
export async function deleteVoiceNote(
    userId: string,
    noteId: string
): Promise<void> {
    const repository = getRepository();

    const pk = `USER#${userId}`;
    const sk = `VOICENOTE#${noteId}`;

    await repository.delete(pk, sk);

    // Note: In production, you should also delete the S3 files
    // This would require additional implementation
}

/**
 * Update voice note with transcription
 */
export async function updateVoiceNoteTranscription(
    userId: string,
    noteId: string,
    transcription: TranscriptionResult
): Promise<void> {
    const repository = getRepository();

    const pk = `USER#${userId}`;
    const sk = `VOICENOTE#${noteId}`;

    await repository.update(pk, sk, {
        transcription: transcription.transcript,
        transcriptionConfidence: transcription.confidence,
        updatedAt: new Date().toISOString()
    });
}
