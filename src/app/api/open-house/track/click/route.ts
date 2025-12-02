/**
 * Link Click Tracking Endpoint
 * 
 * Records when a link in a follow-up email is clicked, then redirects to the destination.
 * Validates Requirements: 13.5, 15.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/aws/dynamodb/repository';
import { FollowUpContent } from '@/lib/open-house/types';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const sessionId = searchParams.get('sessionId');
        const visitorId = searchParams.get('visitorId');
        const url = searchParams.get('url');

        // Validate parameters
        if (!sessionId || !visitorId || !url) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // Decode the destination URL
        const destinationUrl = decodeURIComponent(url);

        // Validate the destination URL
        try {
            new URL(destinationUrl);
        } catch {
            return NextResponse.json(
                { error: 'Invalid destination URL' },
                { status: 400 }
            );
        }

        // Record the link click (async, don't wait for it)
        recordLinkClick(sessionId, visitorId).catch((error) => {
            console.error('Error recording link click:', error);
        });

        // Redirect to the destination URL immediately
        return NextResponse.redirect(destinationUrl, 302);
    } catch (error) {
        console.error('Error in click tracking:', error);

        // If we have a URL, still redirect even if tracking fails
        const url = request.nextUrl.searchParams.get('url');
        if (url) {
            try {
                const destinationUrl = decodeURIComponent(url);
                return NextResponse.redirect(destinationUrl, 302);
            } catch {
                // Fall through to error response
            }
        }

        return NextResponse.json(
            { error: 'Failed to process click tracking' },
            { status: 500 }
        );
    }
}

/**
 * Records a link click in the database
 */
async function recordLinkClick(sessionId: string, visitorId: string): Promise<void> {
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

        // Only record the first click (don't overwrite if already clicked)
        if (!content.clickedAt) {
            const now = new Date().toISOString();
            const timestamp = Date.now();

            await repository.put({
                PK: `USER#${userId}`,
                SK: `FOLLOWUP#${sessionId}#${visitorId}`,
                EntityType: 'FollowUpContent',
                Data: {
                    ...content,
                    clickedAt: now,
                },
                CreatedAt: timestamp,
                UpdatedAt: timestamp,
            });

            console.log(`Link clicked: sessionId=${sessionId}, visitorId=${visitorId}`);
        }
    }
}
