'use server';

/**
 * Server Actions for Mobile Features
 * 
 * This module provides server actions for mobile-specific functionality including:
 * - Photo upload and AI description generation
 * - Voice recording upload and transcription
 * - Meeting preparation materials generation
 * - Open house session management
 * - Market statistics retrieval and caching
 * - Sync operations for offline functionality
 * - Push notification management
 * 
 * All actions follow the established patterns with proper error handling,
 * validation, and AWS service integration.
 */

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getRepository } from '@/aws/dynamodb/repository';
import { uploadFile, getPresignedUrl } from '@/aws/s3';
import { getCurrentUser } from '@/aws/auth/cognito-client';

// Import mobile-specific DynamoDB keys
import {
    getSyncOperationKeys,
    getMarketStatsKeys,
    getOpenHouseSessionKeys,
    getMeetingPrepKeys,
    getPropertyComparisonKeys,
    getNotificationPreferencesKeys,
    getPushTokenKeys,
    getImageMetadataKeys,
} from '@/aws/dynamodb/keys';

// Import Bedrock flows for mobile features
import {
    generatePhotoDescription,
    type GeneratePhotoDescriptionInput,
    type GeneratePhotoDescriptionOutput,
} from '@/aws/bedrock/flows/generate-photo-description';

import {
    transcribeAudio,
    estimateTranscriptionQuality,
    extractKeyPhrases,
    analyzeSentiment,
} from '@/aws/bedrock/flows/transcribe-audio';

import { convertVoiceToContent } from '@/aws/bedrock/flows/voice-to-content';

// Import types from schemas
import type {
    VoiceToContentInput,
    VoiceToContentOutput,
} from '@/ai/schemas/voice-to-content-schemas';

import {
    generateMeetingPrep,
    type GenerateMeetingPrepInput,
    type GenerateMeetingPrepOutput,
} from '@/aws/bedrock/flows/generate-meeting-prep';

// Import schemas for validation
import type { AudioTranscriptionInput } from '@/ai/schemas/audio-transcription-schemas';

/**
 * Error handling utility for mobile actions
 */
const handleMobileError = (error: any, defaultMessage: string): string => {
    if (error instanceof Error) {
        const lowerCaseMessage = error.message.toLowerCase();

        // Mobile-specific errors
        if (lowerCaseMessage.includes('file too large') || lowerCaseMessage.includes('size')) {
            return 'File is too large. Please use a smaller file and try again.';
        }
        if (lowerCaseMessage.includes('unsupported format') || lowerCaseMessage.includes('format')) {
            return 'File format not supported. Please use JPEG, PNG, or WebP for images, or MP3/WAV for audio.';
        }
        if (lowerCaseMessage.includes('network') || lowerCaseMessage.includes('offline')) {
            return 'Network connection required. Your data has been saved locally and will sync when online.';
        }
        if (lowerCaseMessage.includes('quota') || lowerCaseMessage.includes('limit')) {
            return 'Upload limit reached. Please try again later or contact support.';
        }

        // Return original error if it's user-friendly
        if (error.message && error.message.length < 200) {
            return error.message;
        }
    }

    console.error('Mobile Action Error:', error);
    return defaultMessage;
};

// ==================== Photo Upload and Description Actions ====================

const photoUploadSchema = z.object({
    file: z.instanceof(File),
    context: z.string().optional(),
});

export async function uploadPhotoAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: {
        photoId?: string;
        uploadUrl?: string;
        description?: GeneratePhotoDescriptionOutput;
    } | null;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user?.id) {
            return {
                message: 'Authentication required. Please sign in to upload photos.',
                data: null,
                errors: { auth: ['User not authenticated'] },
            };
        }

        // Validate form data
        const file = formData.get('file') as File;
        const context = formData.get('context') as string;

        if (!file) {
            return {
                message: 'No file provided',
                data: null,
                errors: { file: ['File is required'] },
            };
        }

        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return {
                message: 'Invalid file type. Please upload JPEG, PNG, or WebP images.',
                data: null,
                errors: { file: ['Invalid file type'] },
            };
        }

        // 10MB limit for mobile photos
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return {
                message: 'File too large. Please use an image smaller than 10MB.',
                data: null,
                errors: { file: ['File too large'] },
            };
        }

        // Generate unique photo ID and S3 key
        const photoId = uuidv4();
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const s3Key = `users/${user.id}/mobile/photos/${photoId}/${timestamp}.${fileExtension}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to S3
        await uploadFile(s3Key, buffer, file.type);

        // Generate presigned URL for immediate access
        const uploadUrl = await getPresignedUrl(s3Key, 3600); // 1 hour expiration

        // Save image metadata to DynamoDB
        const repository = getRepository();
        const imageKeys = getImageMetadataKeys(user.id, photoId);

        const imageMetadata = {
            id: photoId,
            userId: user.id,
            originalKey: s3Key,
            filename: file.name,
            contentType: file.type,
            size: file.size,
            width: 0, // Will be updated after analysis
            height: 0, // Will be updated after analysis
            uploadedAt: new Date().toISOString(),
            context: context || '',
        };

        await repository.create(imageKeys.PK, imageKeys.SK, 'ImageMetadata', imageMetadata);

        // Generate AI description
        let description: GeneratePhotoDescriptionOutput | undefined;
        try {
            const base64Image = buffer.toString('base64');
            const imageFormat = file.type.split('/')[1] as 'jpeg' | 'png' | 'webp';

            const descriptionInput: GeneratePhotoDescriptionInput = {
                imageData: base64Image,
                imageFormat,
                metadata: {
                    width: 0, // Placeholder - would need image processing to get actual dimensions
                    height: 0,
                    size: file.size,
                    timestamp: Date.now(),
                },
                userId: user.id,
                context: context || 'Property photo captured on mobile device',
            };

            description = await generatePhotoDescription(descriptionInput);

            // Update image metadata with description
            await repository.update(imageKeys.PK, imageKeys.SK, {
                description: description.description,
                keyFeatures: description.keyFeatures,
                tags: description.tags,
                roomType: description.roomType,
                marketingAppeal: description.marketingAppeal,
            });

        } catch (error) {
            console.error('Error generating photo description:', error);
            // Continue without description - photo is still uploaded
        }

        return {
            message: 'success',
            data: {
                photoId,
                uploadUrl,
                description,
            },
            errors: {},
        };

    } catch (error) {
        const errorMessage = handleMobileError(error, 'Failed to upload photo. Please try again.');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

// ==================== Voice Recording Actions ====================

const voiceUploadSchema = z.object({
    file: z.instanceof(File),
    duration: z.number().min(1).max(600), // 1 second to 10 minutes
    contentType: z.enum(['blog', 'social', 'market-update', 'notes']),
    context: z.string().optional(),
});

export async function uploadVoiceRecordingAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: {
        recordingId?: string;
        transcript?: string;
        content?: VoiceToContentOutput;
    } | null;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user?.id) {
            return {
                message: 'Authentication required. Please sign in to upload voice recordings.',
                data: null,
                errors: { auth: ['User not authenticated'] },
            };
        }

        // Validate form data
        const file = formData.get('file') as File;
        const duration = parseFloat(formData.get('duration') as string);
        const contentType = formData.get('contentType') as string;
        const context = formData.get('context') as string;

        const validatedFields = voiceUploadSchema.safeParse({
            file,
            duration,
            contentType,
            context,
        });

        if (!validatedFields.success) {
            return {
                message: 'Invalid voice recording data',
                data: null,
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const { file: audioFile, duration: audioDuration, contentType: targetContentType } = validatedFields.data;

        // Validate audio file type
        const allowedAudioTypes = ['audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4'];
        if (!allowedAudioTypes.includes(audioFile.type)) {
            return {
                message: 'Invalid audio format. Please use MP3, WAV, WebM, OGG, or MP4.',
                data: null,
                errors: { file: ['Invalid audio format'] },
            };
        }

        // 50MB limit for audio files
        const maxSize = 50 * 1024 * 1024;
        if (audioFile.size > maxSize) {
            return {
                message: 'Audio file too large. Please use a file smaller than 50MB.',
                data: null,
                errors: { file: ['File too large'] },
            };
        }

        // Generate unique recording ID and S3 key
        const recordingId = uuidv4();
        const timestamp = Date.now();
        const fileExtension = audioFile.name.split('.').pop() || 'mp3';
        const s3Key = `users/${user.id}/mobile/audio/${recordingId}/${timestamp}.${fileExtension}`;

        // Convert file to buffer and upload to S3
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await uploadFile(s3Key, buffer, audioFile.type);

        // Transcribe audio (simplified implementation for development)
        let transcript = '';
        let transcriptionConfidence = 0.8;

        try {
            // For development, we'll use a simplified transcription approach
            // In production, this would integrate with AWS Transcribe or similar service
            const audioFormat = audioFile.type.split('/')[1] as 'webm' | 'mp4' | 'wav' | 'ogg';

            const transcriptionInput: AudioTranscriptionInput = {
                audioData: buffer.toString('base64'),
                audioFormat,
                duration: audioDuration,
                context: context || 'Real estate voice memo',
                userId: user.id,
            };

            const transcriptionResult = await transcribeAudio(transcriptionInput);

            transcript = transcriptionResult.transcript;
            transcriptionConfidence = transcriptionResult.confidence;

        } catch (error) {
            console.error('Error transcribing audio:', error);
            // Provide fallback transcript for development
            transcript = `Voice memo recorded for ${Math.round(audioDuration)} seconds. Transcription will be available when audio processing is fully configured.`;
            transcriptionConfidence = 0.5;
        }

        // Convert transcript to structured content
        let generatedContent: VoiceToContentOutput | undefined;
        try {
            const contentInput: VoiceToContentInput = {
                transcript,
                contentType: targetContentType as any,
                tone: 'professional',
                length: 'medium',
                targetAudience: 'Real estate clients and prospects',
                context: context || 'Mobile voice memo',
                userId: user.id,
            };

            generatedContent = await convertVoiceToContent(contentInput);

        } catch (error) {
            console.error('Error generating content from voice:', error);
            // Continue without generated content
        }

        // Save recording metadata to DynamoDB
        const repository = getRepository();
        const recordingKeys = {
            PK: `USER#${user.id}`,
            SK: `VOICERECORDING#${recordingId}`,
        };

        const recordingMetadata = {
            id: recordingId,
            userId: user.id,
            s3Key,
            filename: audioFile.name,
            contentType: audioFile.type,
            size: audioFile.size,
            duration: audioDuration,
            transcript,
            transcriptionConfidence,
            targetContentType,
            context: context || '',
            generatedContent,
            uploadedAt: new Date().toISOString(),
        };

        await repository.create(recordingKeys.PK, recordingKeys.SK, 'VoiceRecording', recordingMetadata);

        return {
            message: 'success',
            data: {
                recordingId,
                transcript,
                content: generatedContent,
            },
            errors: {},
        };

    } catch (error) {
        const errorMessage = handleMobileError(error, 'Failed to process voice recording. Please try again.');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

// ==================== Meeting Preparation Actions ====================

const meetingPrepSchema = z.object({
    clientName: z.string().min(1, 'Client name is required'),
    clientEmail: z.string().email('Valid email is required'),
    meetingPurpose: z.string().min(10, 'Please provide more details about the meeting purpose'),
    propertyInterests: z.array(z.string()).min(1, 'At least one property interest is required'),
    budget: z.object({
        min: z.number().min(0),
        max: z.number().min(0),
    }),
    notes: z.string().optional(),
});

export async function generateMeetingPrepAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: (GenerateMeetingPrepOutput & { prepId?: string }) | null;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user?.id) {
            return {
                message: 'Authentication required. Please sign in to generate meeting prep.',
                data: null,
                errors: { auth: ['User not authenticated'] },
            };
        }

        // Parse and validate form data
        const clientName = formData.get('clientName') as string;
        const clientEmail = formData.get('clientEmail') as string;
        const meetingPurpose = formData.get('meetingPurpose') as string;
        const propertyInterestsStr = formData.get('propertyInterests') as string;
        const budgetMinStr = formData.get('budgetMin') as string;
        const budgetMaxStr = formData.get('budgetMax') as string;
        const notes = formData.get('notes') as string;

        let propertyInterests: string[] = [];
        try {
            propertyInterests = JSON.parse(propertyInterestsStr || '[]');
        } catch {
            propertyInterests = propertyInterestsStr ? [propertyInterestsStr] : [];
        }

        const validatedFields = meetingPrepSchema.safeParse({
            clientName,
            clientEmail,
            meetingPurpose,
            propertyInterests,
            budget: {
                min: parseFloat(budgetMinStr) || 0,
                max: parseFloat(budgetMaxStr) || 0,
            },
            notes,
        });

        if (!validatedFields.success) {
            return {
                message: 'Invalid meeting preparation data',
                data: null,
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const meetingData = validatedFields.data;

        // Generate meeting preparation materials
        const prepInput: GenerateMeetingPrepInput = {
            clientName: meetingData.clientName,
            clientEmail: meetingData.clientEmail,
            meetingPurpose: meetingData.meetingPurpose,
            propertyInterests: meetingData.propertyInterests,
            budget: meetingData.budget,
            notes: meetingData.notes || '',
            userId: user.id,
        };

        const prepResult = await generateMeetingPrep(prepInput);

        // Save meeting prep to DynamoDB
        const repository = getRepository();
        const prepId = uuidv4();
        const prepKeys = getMeetingPrepKeys(user.id, prepId);

        const meetingPrepData = {
            id: prepId,
            userId: user.id,
            clientInfo: meetingData,
            materials: prepResult,
            createdAt: new Date().toISOString(),
        };

        await repository.create(prepKeys.PK, prepKeys.SK, 'MeetingPrep', meetingPrepData);

        return {
            message: 'success',
            data: {
                ...prepResult,
                prepId,
            },
            errors: {},
        };

    } catch (error) {
        const errorMessage = handleMobileError(error, 'Failed to generate meeting preparation materials. Please try again.');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

// ==================== Open House Session Actions ====================

const openHouseSessionSchema = z.object({
    propertyId: z.string().min(1, 'Property ID is required'),
    propertyAddress: z.string().min(1, 'Property address is required'),
});

const visitorCheckinSchema = z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    name: z.string().min(1, 'Visitor name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    interestLevel: z.enum(['low', 'medium', 'high']),
    notes: z.string().optional(),
});

export async function startOpenHouseSessionAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: { sessionId?: string; startTime?: string } | null;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user?.id) {
            return {
                message: 'Authentication required. Please sign in to start an open house session.',
                data: null,
                errors: { auth: ['User not authenticated'] },
            };
        }

        // Validate form data
        const propertyId = formData.get('propertyId') as string;
        const propertyAddress = formData.get('propertyAddress') as string;

        const validatedFields = openHouseSessionSchema.safeParse({
            propertyId,
            propertyAddress,
        });

        if (!validatedFields.success) {
            return {
                message: 'Invalid open house session data',
                data: null,
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        // Generate session ID and create session
        const sessionId = uuidv4();
        const startTime = new Date().toISOString();

        const repository = getRepository();
        const sessionKeys = getOpenHouseSessionKeys(user.id, sessionId);

        const sessionData = {
            sessionId,
            userId: user.id,
            propertyId: validatedFields.data.propertyId,
            propertyAddress: validatedFields.data.propertyAddress,
            startTime,
            endTime: null,
            visitors: [],
            status: 'active',
        };

        await repository.create(sessionKeys.PK, sessionKeys.SK, 'OpenHouseSession', sessionData);

        return {
            message: 'success',
            data: {
                sessionId,
                startTime,
            },
            errors: {},
        };

    } catch (error) {
        const errorMessage = handleMobileError(error, 'Failed to start open house session. Please try again.');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

export async function checkinVisitorAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: { visitorId?: string } | null;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user?.id) {
            return {
                message: 'Authentication required. Please sign in to check in visitors.',
                data: null,
                errors: { auth: ['User not authenticated'] },
            };
        }

        // Validate form data
        const sessionId = formData.get('sessionId') as string;
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const interestLevel = formData.get('interestLevel') as string;
        const notes = formData.get('notes') as string;

        const validatedFields = visitorCheckinSchema.safeParse({
            sessionId,
            name,
            email,
            phone,
            interestLevel,
            notes,
        });

        if (!validatedFields.success) {
            return {
                message: 'Invalid visitor check-in data',
                data: null,
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const visitorData = validatedFields.data;

        // Get the open house session
        const repository = getRepository();
        const sessionKeys = getOpenHouseSessionKeys(user.id, sessionId);
        const sessionResult = await repository.get(sessionKeys.PK, sessionKeys.SK);

        if (!sessionResult || !(sessionResult as any).Data) {
            return {
                message: 'Open house session not found',
                data: null,
                errors: { session: ['Session not found'] },
            };
        }

        const session = (sessionResult as any).Data;

        // Verify session is active
        if (session.status !== 'active') {
            return {
                message: 'Open house session is not active',
                data: null,
                errors: { session: ['Session not active'] },
            };
        }

        // Create visitor record
        const visitorId = uuidv4();
        const visitor = {
            id: visitorId,
            name: visitorData.name,
            email: visitorData.email,
            phone: visitorData.phone,
            interestLevel: visitorData.interestLevel,
            notes: visitorData.notes || '',
            timestamp: new Date().toISOString(),
        };

        // Add visitor to session
        const updatedVisitors = [...(session.visitors || []), visitor];
        await repository.update(sessionKeys.PK, sessionKeys.SK, {
            visitors: updatedVisitors,
        });

        return {
            message: 'success',
            data: {
                visitorId,
            },
            errors: {},
        };

    } catch (error) {
        const errorMessage = handleMobileError(error, 'Failed to check in visitor. Please try again.');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

export async function endOpenHouseSessionAction(
    sessionId: string
): Promise<{
    message: string;
    data: {
        summary?: {
            totalVisitors: number;
            highInterest: number;
            mediumInterest: number;
            lowInterest: number;
            endTime: string;
        };
    } | null;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user?.id) {
            return {
                message: 'Authentication required. Please sign in to end the session.',
                data: null,
                errors: { auth: ['User not authenticated'] },
            };
        }

        if (!sessionId) {
            return {
                message: 'Session ID is required',
                data: null,
                errors: { sessionId: ['Session ID is required'] },
            };
        }

        // Get the open house session
        const repository = getRepository();
        const sessionKeys = getOpenHouseSessionKeys(user.id, sessionId);
        const sessionResult = await repository.get(sessionKeys.PK, sessionKeys.SK);

        if (!sessionResult || !(sessionResult as any).Data) {
            return {
                message: 'Open house session not found',
                data: null,
                errors: { session: ['Session not found'] },
            };
        }

        const session = (sessionResult as any).Data;

        // Verify session is active
        if (session.status !== 'active') {
            return {
                message: 'Open house session is already ended',
                data: null,
                errors: { session: ['Session already ended'] },
            };
        }

        // Calculate summary statistics
        const visitors = session.visitors || [];
        const endTime = new Date().toISOString();

        const summary = {
            totalVisitors: visitors.length,
            highInterest: visitors.filter((v: any) => v.interestLevel === 'high').length,
            mediumInterest: visitors.filter((v: any) => v.interestLevel === 'medium').length,
            lowInterest: visitors.filter((v: any) => v.interestLevel === 'low').length,
            endTime,
        };

        // Update session status
        await repository.update(sessionKeys.PK, sessionKeys.SK, {
            status: 'ended',
            endTime,
            summary,
        });

        return {
            message: 'success',
            data: {
                summary,
            },
            errors: {},
        };

    } catch (error) {
        const errorMessage = handleMobileError(error, 'Failed to end open house session. Please try again.');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

// ==================== Market Statistics Actions ====================

const marketStatsSchema = z.object({
    location: z.string().min(3, 'Location must be at least 3 characters'),
});

export async function fetchMarketStatsAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: {
        location?: string;
        stats?: {
            medianPrice: number;
            inventoryLevel: number;
            daysOnMarket: number;
            priceTrend: 'up' | 'down' | 'stable';
            timestamp: string;
            cached: boolean;
        };
    } | null;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user?.id) {
            return {
                message: 'Authentication required. Please sign in to fetch market stats.',
                data: null,
                errors: { auth: ['User not authenticated'] },
            };
        }

        // Validate form data
        const location = formData.get('location') as string;

        const validatedFields = marketStatsSchema.safeParse({
            location,
        });

        if (!validatedFields.success) {
            return {
                message: 'Invalid location data',
                data: null,
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const { location: searchLocation } = validatedFields.data;

        // Check for cached market stats
        const repository = getRepository();
        const statsKeys = getMarketStatsKeys(user.id, searchLocation);
        const cachedResult = await repository.get(statsKeys.PK, statsKeys.SK);

        let stats: any;
        let cached = false;

        if (cachedResult && (cachedResult as any).Data) {
            const cachedStats = (cachedResult as any).Data;
            const cacheAge = Date.now() - new Date(cachedStats.timestamp).getTime();
            const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours

            if (cacheAge < maxCacheAge) {
                // Use cached data
                stats = cachedStats.stats;
                cached = true;
            }
        }

        if (!cached) {
            // Fetch fresh market data (simplified implementation for development)
            // In production, this would integrate with real market data APIs
            stats = {
                medianPrice: Math.floor(Math.random() * 500000) + 300000, // $300k - $800k
                inventoryLevel: Math.floor(Math.random() * 100) + 50, // 50-150 properties
                daysOnMarket: Math.floor(Math.random() * 60) + 15, // 15-75 days
                priceTrend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
                timestamp: new Date().toISOString(),
                cached: false,
            };

            // Cache the new data
            const cacheData = {
                location: searchLocation,
                stats,
                timestamp: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            };

            await repository.create(statsKeys.PK, statsKeys.SK, 'MarketStats', cacheData);
        }

        return {
            message: 'success',
            data: {
                location: searchLocation,
                stats: {
                    ...stats,
                    cached,
                },
            },
            errors: {},
        };

    } catch (error) {
        const errorMessage = handleMobileError(error, 'Failed to fetch market statistics. Please try again.');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

// ==================== Sync Operations Actions ====================

export async function queueSyncOperationAction(
    operationType: string,
    operationData: any
): Promise<{
    message: string;
    data: { operationId?: string } | null;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user?.id) {
            return {
                message: 'Authentication required. Please sign in to queue sync operations.',
                data: null,
                errors: { auth: ['User not authenticated'] },
            };
        }

        // Generate operation ID
        const operationId = uuidv4();

        // Create sync operation record
        const repository = getRepository();
        const syncKeys = getSyncOperationKeys(user.id, operationId);

        const syncOperation = {
            id: operationId,
            userId: user.id,
            type: operationType,
            data: operationData,
            status: 'pending',
            retryCount: 0,
            createdAt: new Date().toISOString(),
            lastAttempt: null,
            error: null,
        };

        await repository.create(syncKeys.PK, syncKeys.SK, 'SyncOperation', syncOperation);

        return {
            message: 'success',
            data: {
                operationId,
            },
            errors: {},
        };

    } catch (error) {
        const errorMessage = handleMobileError(error, 'Failed to queue sync operation. Please try again.');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

export async function getSyncQueueStatusAction(): Promise<{
    message: string;
    data: {
        pending?: number;
        failed?: number;
        completed?: number;
    } | null;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user?.id) {
            return {
                message: 'Authentication required. Please sign in to check sync status.',
                data: null,
                errors: { auth: ['User not authenticated'] },
            };
        }

        // Query sync operations for the user
        const repository = getRepository();
        const userPK = `USER#${user.id}`;

        // This would need to be implemented in the repository to query by SK prefix
        // For now, return a simplified status
        const status = {
            pending: 0,
            failed: 0,
            completed: 0,
        };

        return {
            message: 'success',
            data: status,
            errors: {},
        };

    } catch (error) {
        const errorMessage = handleMobileError(error, 'Failed to get sync queue status. Please try again.');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

// ==================== Push Notification Actions ====================

const notificationPrefsSchema = z.object({
    enabled: z.boolean(),
    priceChanges: z.boolean(),
    newListings: z.boolean(),
    trendShifts: z.boolean(),
    quietHours: z.object({
        start: z.string(),
        end: z.string(),
    }).optional(),
});

export async function updateNotificationPreferencesAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: any;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user?.id) {
            return {
                message: 'Authentication required. Please sign in to update notification preferences.',
                data: null,
                errors: { auth: ['User not authenticated'] },
            };
        }

        // Parse form data
        const enabled = formData.get('enabled') === 'true';
        const priceChanges = formData.get('priceChanges') === 'true';
        const newListings = formData.get('newListings') === 'true';
        const trendShifts = formData.get('trendShifts') === 'true';
        const quietHoursStart = formData.get('quietHoursStart') as string;
        const quietHoursEnd = formData.get('quietHoursEnd') as string;

        const preferences = {
            enabled,
            priceChanges,
            newListings,
            trendShifts,
            quietHours: quietHoursStart && quietHoursEnd ? {
                start: quietHoursStart,
                end: quietHoursEnd,
            } : undefined,
        };

        const validatedFields = notificationPrefsSchema.safeParse(preferences);

        if (!validatedFields.success) {
            return {
                message: 'Invalid notification preferences',
                data: null,
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        // Save preferences to DynamoDB
        const repository = getRepository();
        const prefsKeys = getNotificationPreferencesKeys(user.id);

        const prefsData = {
            userId: user.id,
            ...validatedFields.data,
            updatedAt: new Date().toISOString(),
        };

        await repository.create(prefsKeys.PK, prefsKeys.SK, 'NotificationPreferences', prefsData);

        return {
            message: 'success',
            data: prefsData,
            errors: {},
        };

    } catch (error) {
        const errorMessage = handleMobileError(error, 'Failed to update notification preferences. Please try again.');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}

export async function registerPushTokenAction(
    deviceId: string,
    pushToken: string
): Promise<{
    message: string;
    data: any;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user?.id) {
            return {
                message: 'Authentication required. Please sign in to register push token.',
                data: null,
                errors: { auth: ['User not authenticated'] },
            };
        }

        if (!deviceId || !pushToken) {
            return {
                message: 'Device ID and push token are required',
                data: null,
                errors: { token: ['Device ID and push token are required'] },
            };
        }

        // Save push token to DynamoDB
        const repository = getRepository();
        const tokenKeys = getPushTokenKeys(user.id, deviceId);

        const tokenData = {
            userId: user.id,
            deviceId,
            pushToken,
            registeredAt: new Date().toISOString(),
            active: true,
        };

        await repository.create(tokenKeys.PK, tokenKeys.SK, 'PushToken', tokenData);

        return {
            message: 'success',
            data: { registered: true },
            errors: {},
        };

    } catch (error) {
        const errorMessage = handleMobileError(error, 'Failed to register push token. Please try again.');
        return {
            message: errorMessage,
            data: null,
            errors: {},
        };
    }
}