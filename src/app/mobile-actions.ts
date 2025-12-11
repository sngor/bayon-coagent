'use server';

import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';
import { getPropertyShareKeys } from '@/aws/dynamodb';
import {
    createShareRecord,
    formatSMSMessage,
    formatEmailMessage,
    generatePropertyQR,
    generateTrackingUrl,
} from '@/lib/mobile/quick-share';
import { z } from 'zod';

const sharePropertySchema = z.object({
    propertyId: z.string().min(1, 'Property ID is required'),
    method: z.enum(['qr', 'sms', 'email', 'social']),
    recipient: z.string().optional(),
    customMessage: z.string().optional(),
    propertyData: z.object({
        address: z.string().optional(),
        price: z.string().optional(),
        beds: z.number().optional(),
        baths: z.number().optional(),
        sqft: z.number().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
    }).optional(),
});

/**
 * Server action to share a property
 * Creates a share record in DynamoDB and returns share information
 */
export async function sharePropertyAction(
    prevState: any,
    formData: FormData
) {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                success: false,
                data: null,
                errors: { auth: ['You must be logged in to share properties'] },
            };
        }

        // Parse property data if provided
        let propertyData;
        const propertyDataStr = formData.get('propertyData');
        if (propertyDataStr) {
            try {
                propertyData = JSON.parse(propertyDataStr as string);
            } catch (e) {
                console.error('Failed to parse property data:', e);
            }
        }

        // Validate input
        const validatedFields = sharePropertySchema.safeParse({
            propertyId: formData.get('propertyId'),
            method: formData.get('method'),
            recipient: formData.get('recipient') || undefined,
            customMessage: formData.get('customMessage') || undefined,
            propertyData,
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                success: false,
                data: null,
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const { propertyId, method, recipient, propertyData: propData } = validatedFields.data;

        // Create share record
        const shareRecord = createShareRecord(user.id, propertyId, method, recipient);

        // Generate QR code if method is 'qr'
        let qrCodeDataUrl: string | undefined;
        if (method === 'qr') {
            qrCodeDataUrl = await generatePropertyQR(propertyId, user.id);
        }

        // Save to DynamoDB
        const repository = getRepository();
        const keys = getPropertyShareKeys(user.id, shareRecord.id);

        await repository.create(keys.PK, keys.SK, 'PropertyShare', shareRecord);

        // Prepare response data based on method
        let responseData: any = {
            shareId: shareRecord.id,
            trackingUrl: shareRecord.trackingUrl,
            qrCodeDataUrl,
        };

        // Add formatted messages for SMS/Email
        if (method === 'sms' && propData) {
            responseData.smsMessage = formatSMSMessage(propData, shareRecord.trackingUrl);
        }

        if (method === 'email' && propData) {
            const emailData = formatEmailMessage(
                propData,
                shareRecord.trackingUrl,
                (user as any).name || undefined
            );
            responseData.emailSubject = emailData.subject;
            responseData.emailBody = emailData.body;
        }

        return {
            message: 'success',
            success: true,
            data: responseData,
            errors: {},
        };
    } catch (error) {
        console.error('Share property error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to share property';
        return {
            message: errorMessage,
            success: false,
            data: null,
            errors: {},
        };
    }
}

/**
 * Server action to track share engagement
 * Updates view and click counts for a share
 */
export async function trackShareEngagementAction(
    shareId: string,
    eventType: 'view' | 'click'
) {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                success: false,
                errors: {},
            };
        }

        const repository = getRepository();
        const keys = getPropertyShareKeys(user.id, shareId);

        // Get current share data
        const shareData = await repository.get<any>(keys.PK, keys.SK);
        if (!shareData) {
            return {
                message: 'Share not found',
                success: false,
                errors: {},
            };
        }

        // Update metrics
        const updates: any = {
            lastViewed: Date.now(),
        };

        if (eventType === 'view') {
            updates.views = (shareData.views || 0) + 1;
        } else if (eventType === 'click') {
            updates.clicks = (shareData.clicks || 0) + 1;
        }

        await repository.update(keys.PK, keys.SK, updates);

        return {
            message: 'success',
            success: true,
            errors: {},
        };
    } catch (error) {
        console.error('Track engagement error:', error);
        return {
            message: 'Failed to track engagement',
            success: false,
            errors: {},
        };
    }
}

/**
 * Server action to get share engagement metrics
 */
export async function getShareMetricsAction(shareId: string) {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                success: false,
                data: null,
                errors: {},
            };
        }

        const repository = getRepository();
        const keys = getPropertyShareKeys(user.id, shareId);

        const shareData = await repository.get<any>(keys.PK, keys.SK);
        if (!shareData) {
            return {
                message: 'Share not found',
                success: false,
                data: null,
                errors: {},
            };
        }

        return {
            message: 'success',
            success: true,
            data: {
                shareId: shareData.id,
                views: shareData.views || 0,
                clicks: shareData.clicks || 0,
                lastViewed: shareData.lastViewed,
                createdAt: shareData.createdAt,
            },
            errors: {},
        };
    } catch (error) {
        console.error('Get share metrics error:', error);
        return {
            message: 'Failed to get metrics',
            success: false,
            data: null,
            errors: {},
        };
    }
}

/**
 * Server action to get all shares for a user
 */
export async function getUserSharesAction(limit: number = 50) {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                success: false,
                data: [],
                errors: {},
            };
        }

        const repository = getRepository();
        const result = await repository.query(
            `USER#${user.id}`,
            'SHARE#',
            {
                limit,
                scanIndexForward: false, // Most recent first
            }
        );

        return {
            message: 'success',
            success: true,
            data: result.items,
            errors: {},
        };
    } catch (error) {
        console.error('Get user shares error:', error);
        return {
            message: 'Failed to get shares',
            success: false,
            data: [],
            errors: {},
        };
    }
}
