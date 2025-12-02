import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';
import { OpenHouseSession } from '@/lib/open-house/types';

/**
 * GET /api/open-house/sessions/[sessionId]/stats
 * 
 * Returns current session statistics for real-time updates
 * Validates Requirements: 11.1, 11.2
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { sessionId } = params;

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        // Get session from DynamoDB
        const repository = getRepository();
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Return session data (the hook will calculate stats from this)
        return NextResponse.json({
            success: true,
            session,
        });
    } catch (error) {
        console.error('Error fetching session stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch session stats' },
            { status: 500 }
        );
    }
}
