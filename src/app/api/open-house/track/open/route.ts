/**
 * Email Open Tracking Endpoint
 * 
 * Records when a follow-up email is opened by serving a 1x1 transparent GIF.
 * Validates Requirements: 13.5, 15.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/aws/dynamodb/repository';
import { FollowUpContent } from '@/lib/open-house/types';

// 1x1 transparent GIF in base64
const TRACKING_PIXEL = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const sessionId = searchParams.get('sessionId');
        const visitorId = searchParams.get('visitorId');

        // Validate parameters
        if (!sessionId || !visitorId) {
            // Still return the pixel even if tracking fails
            return new NextResponse(TRACKING_PIXEL, {
                status: 200,
                headers: {
                    'Content-Type': 'image/gif',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });
        }

        // Record the email open
        const repository = getRepository();

        // Get the follow-up content to find the userId
        const followUpContent = await repository.query<FollowUpContent>({
            IndexName: undefined,
            KeyConditionExpression: 'begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':sk': `FOLLOWUP#${sessionId}#${visitorId}`,
            },
            Limit: 1,
        });

        if (followUpContent.items.length > 0) {
            const content = followUpContent.items[0];
            const userId = content.userId;

            // Only record the first open (don't overwrite if already opened)
            if (!content.openedAt) {
                const now = new Date().toISOString();
                const timestamp = Date.now();

                await repository.put({
                    PK: `USER#${userId}`,
                    SK: `FOLLOWUP#${sessionId}#${visitorId}`,
                    EntityType: 'FollowUpContent',
                    Data: {
                        ...content,
                        openedAt: now,
                    },
                    CreatedAt: timestamp,
                    UpdatedAt: timestamp,
                });

                console.log(`Email opened: sessionId=${sessionId}, visitorId=${visitorId}`);
            }
        }

        // Always return the tracking pixel
        return new NextResponse(TRACKING_PIXEL, {
            status: 200,
            headers: {
                'Content-Type': 'image/gif',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        console.error('Error tracking email open:', error);

        // Still return the pixel even if tracking fails
        return new NextResponse(TRACKING_PIXEL, {
            status: 200,
            headers: {
                'Content-Type': 'image/gif',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    }
}
