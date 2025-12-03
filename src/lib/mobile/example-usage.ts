/**
 * Mobile Repository - Example Usage
 * 
 * This file demonstrates how to use the mobile repository methods.
 * These examples can be used as reference for implementing mobile features.
 */

import { repository } from '@/aws/dynamodb/repository';
import type {
    MobileCapture,
    QuickAction,
    PropertyShare,
    VoiceNote,
    LocationCheckIn,
} from './types';

/**
 * Example 1: Creating and querying mobile captures
 */
export async function exampleMobileCapture(userId: string) {
    // Create a photo capture
    const captureId = crypto.randomUUID();
    const captureData: MobileCapture = {
        id: captureId,
        userId,
        type: 'photo',
        content: 's3://bucket/captures/photo-123.jpg',
        location: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
        },
        timestamp: Date.now(),
        processed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await repository.createMobileCapture(userId, captureId, captureData);

    // Query recent captures
    const recentCaptures = await repository.queryMobileCaptures(userId, {
        limit: 10,
    });

    console.log(`Found ${recentCaptures.count} recent captures`);

    // Update capture after processing
    await repository.updateMobileCapture(userId, captureId, {
        processed: true,
        analysis: {
            propertyType: 'Single Family Home',
            features: ['Hardwood floors', 'Updated kitchen', 'Large backyard'],
            condition: 'good',
            marketingHighlights: ['Move-in ready', 'Great location'],
            improvements: ['Paint exterior', 'Update landscaping'],
        },
    });

    return captureId;
}

/**
 * Example 2: Managing quick actions
 */
export async function exampleQuickActions(userId: string) {
    // Create a quick action
    const actionId = crypto.randomUUID();
    const actionData: QuickAction = {
        id: actionId,
        userId,
        actionType: 'create_content',
        label: 'Create Social Post',
        icon: 'camera',
        route: '/studio/write',
        config: {
            contentType: 'social',
            platform: 'instagram',
        },
        usageCount: 0,
        lastUsed: Date.now(),
        isPinned: true,
        createdAt: new Date().toISOString(),
    };

    await repository.createQuickAction(userId, actionId, actionData);

    // Increment usage count when action is used
    const action = await repository.getQuickAction(userId, actionId);
    if (action) {
        await repository.updateQuickAction(userId, actionId, {
            usageCount: action.usageCount + 1,
            lastUsed: Date.now(),
        });
    }

    // Query all actions
    const allActions = await repository.queryQuickActions(userId);
    console.log(`User has ${allActions.count} quick actions configured`);

    return actionId;
}

/**
 * Example 3: Property sharing with tracking
 */
export async function examplePropertyShare(
    userId: string,
    propertyId: string
) {
    // Create a share via QR code
    const shareId = crypto.randomUUID();
    const shareData: PropertyShare = {
        id: shareId,
        userId,
        propertyId,
        method: 'qr',
        trackingUrl: `https://app.example.com/share/${shareId}`,
        qrCodeUrl: `https://s3.amazonaws.com/qr-codes/${shareId}.png`,
        views: 0,
        clicks: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    await repository.createPropertyShare(userId, shareId, shareData);

    // Track engagement when someone views the share
    const share = await repository.getPropertyShare(userId, shareId);
    if (share) {
        await repository.updatePropertyShare(userId, shareId, {
            views: share.views + 1,
            lastViewed: Date.now(),
        });
    }

    // Query all shares for analytics
    const allShares = await repository.queryPropertyShares(userId, {
        limit: 50,
    });

    const totalViews = allShares.items.reduce(
        (sum, share) => sum + share.views,
        0
    );
    console.log(`Total views across all shares: ${totalViews}`);

    return shareId;
}

/**
 * Example 4: Voice notes attached to properties
 */
export async function exampleVoiceNotes(
    userId: string,
    propertyId: string
) {
    // Create a voice note
    const noteId = crypto.randomUUID();
    const noteData: VoiceNote = {
        id: noteId,
        userId,
        propertyId,
        audioUrl: 's3://bucket/voice-notes/note-123.mp3',
        transcription: 'Great property with lots of natural light. Needs some cosmetic updates but has good bones.',
        duration: 45, // seconds
        location: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
        },
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
    };

    await repository.createVoiceNote(userId, noteId, noteData);

    // Query all notes for a specific property
    const propertyNotes = await repository.queryVoiceNotesByProperty(
        userId,
        propertyId,
        { limit: 20 }
    );

    console.log(`Found ${propertyNotes.count} notes for this property`);

    // Query all notes for the user
    const allNotes = await repository.queryVoiceNotes(userId);
    console.log(`User has ${allNotes.count} total voice notes`);

    return noteId;
}

/**
 * Example 5: Location check-ins
 */
export async function exampleLocationCheckIns(
    userId: string,
    propertyId: string,
    appointmentId: string
) {
    // Create a check-in
    const checkInId = crypto.randomUUID();
    const checkInData: LocationCheckIn = {
        id: checkInId,
        userId,
        propertyId,
        appointmentId,
        location: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 5,
        },
        address: '123 Main St, San Francisco, CA 94102',
        notes: 'Arrived on time. Client was waiting.',
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
    };

    await repository.createLocationCheckIn(userId, checkInId, checkInData);

    // Query check-ins for a property
    const propertyCheckIns = await repository.queryLocationCheckInsByProperty(
        userId,
        propertyId
    );
    console.log(`${propertyCheckIns.count} check-ins at this property`);

    // Query check-ins for an appointment
    const appointmentCheckIns = await repository.queryLocationCheckInsByAppointment(
        userId,
        appointmentId
    );
    console.log(`${appointmentCheckIns.count} check-ins for this appointment`);

    // Query all check-ins
    const allCheckIns = await repository.queryLocationCheckIns(userId, {
        limit: 100,
    });
    console.log(`User has ${allCheckIns.count} total check-ins`);

    return checkInId;
}

/**
 * Example 6: Pagination through large result sets
 */
export async function examplePagination(userId: string) {
    const allCaptures: MobileCapture[] = [];
    let lastKey = undefined;
    let pageCount = 0;

    do {
        const result = await repository.queryMobileCaptures(userId, {
            limit: 100,
            exclusiveStartKey: lastKey,
        });

        allCaptures.push(...result.items);
        lastKey = result.lastEvaluatedKey;
        pageCount++;

        console.log(`Fetched page ${pageCount}: ${result.items.length} items`);
    } while (lastKey);

    console.log(`Total captures: ${allCaptures.length}`);
    return allCaptures;
}

/**
 * Example 7: Error handling
 */
export async function exampleErrorHandling(userId: string) {
    try {
        const capture = await repository.getMobileCapture(userId, 'non-existent-id');

        if (!capture) {
            console.log('Capture not found');
            return null;
        }

        return capture;
    } catch (error) {
        console.error('Failed to retrieve capture:', error);
        throw error;
    }
}

/**
 * Example 8: Batch operations (using base repository methods)
 */
export async function exampleBatchOperations(userId: string) {
    // Create multiple captures
    const captureIds = [
        crypto.randomUUID(),
        crypto.randomUUID(),
        crypto.randomUUID(),
    ];

    const captures = captureIds.map((id) => ({
        id,
        userId,
        type: 'photo' as const,
        content: `s3://bucket/captures/${id}.jpg`,
        timestamp: Date.now(),
        processed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }));

    // Create all captures
    for (const capture of captures) {
        await repository.createMobileCapture(userId, capture.id, capture);
    }

    console.log(`Created ${captures.length} captures`);

    // Batch get using keys
    const keys = captureIds.map((id) => ({
        PK: `USER#${userId}`,
        SK: `CAPTURE#${id}`,
    }));

    const batchResult = await repository.batchGet(keys);
    console.log(`Retrieved ${batchResult.items.length} captures in batch`);

    return captureIds;
}
