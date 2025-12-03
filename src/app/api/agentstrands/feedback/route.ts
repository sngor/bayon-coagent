import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';

/**
 * POST /api/agentstrands/feedback
 * 
 * Submit feedback for strand-generated content
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { taskId, strandId, feedbackType, rating, edits, engagement, metadata } = body;

        // Validate required fields
        if (!taskId || !strandId || !feedbackType) {
            return NextResponse.json(
                { error: 'Missing required fields: taskId, strandId, feedbackType' },
                { status: 400 }
            );
        }

        // Validate feedback type
        if (!['rating', 'edit', 'engagement'].includes(feedbackType)) {
            return NextResponse.json(
                { error: 'Invalid feedbackType. Must be: rating, edit, or engagement' },
                { status: 400 }
            );
        }

        // Validate type-specific data
        if (feedbackType === 'rating' && (rating === undefined || rating < 1 || rating > 5)) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        if (feedbackType === 'edit' && !edits) {
            return NextResponse.json(
                { error: 'Edit feedback requires edits data' },
                { status: 400 }
            );
        }

        if (feedbackType === 'engagement' && !engagement) {
            return NextResponse.json(
                { error: 'Engagement feedback requires engagement data' },
                { status: 400 }
            );
        }

        const repository = getRepository();
        const feedbackId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        const feedbackRecord = {
            id: feedbackId,
            userId: user.id,
            taskId,
            strandId,
            feedbackType,
            rating: feedbackType === 'rating' ? rating : undefined,
            edits: feedbackType === 'edit' ? edits : undefined,
            engagement: feedbackType === 'engagement' ? engagement : undefined,
            timestamp,
            metadata: metadata || {},
        };

        // Store feedback in DynamoDB
        await repository.create(
            `USER#${user.id}`,
            `FEEDBACK#${taskId}#${timestamp}`,
            'Feedback',
            feedbackRecord
        );

        return NextResponse.json({
            success: true,
            feedbackId,
            message: 'Feedback recorded successfully',
        });
    } catch (error) {
        console.error('Failed to record feedback:', error);
        return NextResponse.json(
            { error: 'Failed to record feedback' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/agentstrands/feedback?taskId=xxx&strandId=xxx&feedbackType=xxx
 * 
 * Retrieve feedback records with optional filters
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get('taskId');
        const strandId = searchParams.get('strandId');
        const feedbackType = searchParams.get('feedbackType');
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const repository = getRepository();

        // Query feedback records for the user
        const result = await repository.query(
            `USER#${user.id}`,
            'FEEDBACK#',
            { limit }
        );

        let feedbackRecords = result.items || [];

        // Apply filters
        if (taskId) {
            feedbackRecords = feedbackRecords.filter((record: any) => record.taskId === taskId);
        }
        if (strandId) {
            feedbackRecords = feedbackRecords.filter((record: any) => record.strandId === strandId);
        }
        if (feedbackType) {
            feedbackRecords = feedbackRecords.filter((record: any) => record.feedbackType === feedbackType);
        }

        return NextResponse.json({
            feedbackRecords,
            count: feedbackRecords.length,
        });
    } catch (error) {
        console.error('Failed to retrieve feedback:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve feedback' },
            { status: 500 }
        );
    }
}
