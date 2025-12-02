/**
 * API Route for Processing Follow-up Sequence Touchpoints
 * 
 * This endpoint should be called periodically by a cron job (e.g., every 5 minutes)
 * to process pending touchpoints for all users.
 * 
 * Validates Requirements: 15.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { processAllPendingTouchpoints } from '@/lib/open-house/sequence-processor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-house/process-touchpoints
 * 
 * Processes all pending touchpoints across all users
 * 
 * Authentication: Requires a valid cron secret token
 */
export async function POST(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Process all pending touchpoints
        const results = await processAllPendingTouchpoints();

        return NextResponse.json({
            success: true,
            processed: results.processed,
            failed: results.failed,
            errors: results.errors,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in process-touchpoints API:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/open-house/process-touchpoints
 * 
 * Health check endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: 'process-touchpoints',
        message: 'Use POST to process touchpoints',
    });
}
