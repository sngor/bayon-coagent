/**
 * Open House Session API Endpoint
 * 
 * GET /api/open-house/sessions/[sessionId]
 * Returns complete session data including visitors for external integrations
 * 
 * Validates Requirements: 10.1, 10.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';
import { OpenHouseSession, Visitor } from '@/lib/open-house/types';
import { checkRateLimit } from '@/lib/api/rate-limiter';

/**
 * GET handler for session data
 * Returns session details and visitor list
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
                {
                    success: false,
                    error: 'Authentication required',
                    code: 'UNAUTHORIZED'
                },
                { status: 401 }
            );
        }

        // Rate limiting - 100 requests per minute per user
        const rateLimitResult = await checkRateLimit(user.id, 'open-house-api', 100, 60);
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Rate limit exceeded',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: rateLimitResult.retryAfter
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
                        'X-RateLimit-Limit': '100',
                        'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
                        'X-RateLimit-Reset': rateLimitResult.resetAt?.toString() || ''
                    }
                }
            );
        }

        const { sessionId } = params;

        if (!sessionId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Session ID is required',
                    code: 'INVALID_REQUEST'
                },
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
                {
                    success: false,
                    error: 'Session not found',
                    code: 'NOT_FOUND'
                },
                { status: 404 }
            );
        }

        // Verify ownership
        if (session.userId !== user.id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Access denied',
                    code: 'FORBIDDEN'
                },
                { status: 403 }
            );
        }

        // Get all visitors for this session
        const visitorsResult = await repository.queryVisitorsBySession<Visitor>(
            user.id,
            sessionId
        );
        const visitors = visitorsResult.items || [];

        // Format response with complete session data
        const response = {
            success: true,
            data: {
                session: {
                    sessionId: session.sessionId,
                    propertyId: session.propertyId,
                    propertyAddress: session.propertyAddress,
                    scheduledDate: session.scheduledDate,
                    scheduledStartTime: session.scheduledStartTime,
                    scheduledEndTime: session.scheduledEndTime,
                    actualStartTime: session.actualStartTime,
                    actualEndTime: session.actualEndTime,
                    status: session.status,
                    qrCodeUrl: session.qrCodeUrl,
                    visitorCount: session.visitorCount,
                    interestLevelDistribution: session.interestLevelDistribution,
                    notes: session.notes,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt
                },
                visitors: visitors.map(visitor => ({
                    visitorId: visitor.visitorId,
                    name: visitor.name,
                    email: visitor.email,
                    phone: visitor.phone,
                    interestLevel: visitor.interestLevel,
                    notes: visitor.notes,
                    checkInTime: visitor.checkInTime,
                    followUpGenerated: visitor.followUpGenerated,
                    followUpSent: visitor.followUpSent,
                    followUpSentAt: visitor.followUpSentAt,
                    source: visitor.source,
                    createdAt: visitor.createdAt,
                    updatedAt: visitor.updatedAt
                }))
            },
            meta: {
                totalVisitors: visitors.length,
                requestedAt: new Date().toISOString()
            }
        };

        return NextResponse.json(response, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                'X-RateLimit-Limit': '100',
                'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '99'
            }
        });

    } catch (error) {
        console.error('[API] Open House session fetch error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch session data',
                code: 'INTERNAL_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
