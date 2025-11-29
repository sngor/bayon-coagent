/**
 * Testimonial Reminders Cron Job
 * 
 * Scheduled job to send reminder emails for pending testimonial requests
 * Should be triggered daily via AWS EventBridge or similar scheduler
 * 
 * Validates Requirements: 2.5
 * 
 * Usage:
 * - GET /api/cron/testimonial-reminders - Process all users
 * - GET /api/cron/testimonial-reminders?userId=USER_ID - Process specific user
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    sendTestimonialReminders,
    expireOldTestimonialRequests,
    processAllUserReminders
} from '@/services/notifications/testimonial-reminder-service';

// This should be called by a cron job (e.g., AWS EventBridge)
// For security, you might want to add authentication via a secret token
export async function GET(request: NextRequest) {
    try {
        // Verify cron secret (optional but recommended)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');

        // If userId is provided, process only that user
        if (userId) {
            // Send reminders for pending requests
            const reminderResult = await sendTestimonialReminders(userId);

            // Expire old requests
            const expirationResult = await expireOldTestimonialRequests(userId);

            return NextResponse.json({
                success: true,
                mode: 'single-user',
                userId,
                reminders: {
                    sent: reminderResult.remindersSent,
                    errors: reminderResult.errors,
                },
                expirations: {
                    expired: expirationResult.requestsExpired,
                    errors: expirationResult.errors,
                },
                timestamp: new Date().toISOString(),
            });
        }

        // Otherwise, process all users
        const result = await processAllUserReminders();

        return NextResponse.json({
            success: result.success,
            mode: 'all-users',
            usersProcessed: result.usersProcessed,
            totalRemindersSent: result.totalRemindersSent,
            totalRequestsExpired: result.totalRequestsExpired,
            errors: result.errors,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[CRON] Error in testimonial reminders job:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to process testimonial reminders',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
    return GET(request);
}
