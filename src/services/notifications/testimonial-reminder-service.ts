/**
 * Testimonial Reminder Service
 * 
 * Handles sending reminder emails for pending testimonial requests
 * and expiring old requests that haven't been completed.
 * 
 * Follows established notification service patterns and integrates with
 * the comprehensive notification system for consistent delivery.
 */

import { NotificationType, NotificationPriority } from '@/lib/notifications/types';
import { getNotificationService } from '@/lib/notifications/service';
import { getRepository } from '@/aws/dynamodb/repository';

// ============================================================================
// Configuration Constants
// ============================================================================

/**
 * Configuration for testimonial reminder service
 */
export const TESTIMONIAL_REMINDER_CONFIG = {
    // Days to wait before sending first reminder
    REMINDER_DELAY_DAYS: 7,

    // Days before request expires
    EXPIRATION_DAYS: 30,

    // Maximum reminders to send per request
    MAX_REMINDERS: 2,

    // Days between reminders
    REMINDER_INTERVAL_DAYS: 7,

    // Batch processing configuration
    BATCH_SIZE: 10,
    BATCH_DELAY_MS: 1000,
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculates if a request needs a reminder
 * @param sentAt - When the request was sent
 * @param reminderSentAt - When the last reminder was sent (if any)
 * @returns boolean - Whether a reminder should be sent
 */
function shouldSendReminder(sentAt: string, reminderSentAt?: string): boolean {
    const now = new Date();
    const sentDate = new Date(sentAt);
    const daysSinceSent = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

    // Don't send reminder if request is too new
    if (daysSinceSent < TESTIMONIAL_REMINDER_CONFIG.REMINDER_DELAY_DAYS) {
        return false;
    }

    // If no reminder sent yet, send one
    if (!reminderSentAt) {
        return true;
    }

    // Check if enough time has passed since last reminder
    const lastReminderDate = new Date(reminderSentAt);
    const daysSinceReminder = Math.floor((now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysSinceReminder >= TESTIMONIAL_REMINDER_CONFIG.REMINDER_INTERVAL_DAYS;
}

/**
 * Calculates if a request should be expired
 * @param sentAt - When the request was sent
 * @returns boolean - Whether the request should be expired
 */
function shouldExpireRequest(sentAt: string): boolean {
    const now = new Date();
    const sentDate = new Date(sentAt);
    const daysSinceSent = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysSinceSent >= TESTIMONIAL_REMINDER_CONFIG.EXPIRATION_DAYS;
}

/**
 * Formats error message with context
 * @param operation - The operation that failed
 * @param context - Additional context (user ID, request ID, etc.)
 * @param error - The original error
 * @returns string - Formatted error message
 */
function formatError(operation: string, context: string, error: unknown): string {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return `${operation} failed for ${context}: ${errorMsg}`;
}

export interface TestimonialReminderResult {
    success: boolean;
    remindersSent: number;
    errors: string[];
}

export interface TestimonialExpirationResult {
    success: boolean;
    requestsExpired: number;
    errors: string[];
}

export interface AllUserRemindersResult {
    success: boolean;
    usersProcessed: number;
    totalRemindersSent: number;
    totalRequestsExpired: number;
    errors: string[];
}

/**
 * Send reminder emails for pending testimonial requests for a specific user
 * 
 * @param userId - The user ID to send reminders for
 * @returns Promise<TestimonialReminderResult> - Result with count and any errors
 */
export async function sendTestimonialReminders(userId: string): Promise<TestimonialReminderResult> {
    const errors: string[] = [];
    let remindersSent = 0;

    try {
        // Validate input
        if (!userId || typeof userId !== 'string') {
            throw new Error('Valid userId is required');
        }

        console.log(`Processing testimonial reminders for user: ${userId}`);

        // TODO: Implement actual logic:
        // 1. Query pending testimonial requests older than X days
        // 2. Check if reminder already sent recently
        // 3. Use notification service to send reminders
        // 4. Update request records with reminder timestamp

        // Example implementation structure:
        /*
        const repository = getRepository();
        const notificationService = getNotificationService();
        
        // Query pending requests that need reminders
        const pendingRequests = await repository.query(
            `USER#${userId}`,
            { beginsWith: 'REQUEST#' },
            {
                filter: {
                    status: 'pending',
                    sentAt: { '<': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
                    reminderSentAt: { exists: false }
                }
            }
        );

        for (const request of pendingRequests) {
            try {
                // Send reminder notification
                await notificationService.createNotification({
                    userId,
                    type: NotificationType.REMINDER,
                    priority: NotificationPriority.MEDIUM,
                    title: 'Testimonial Request Reminder',
                    content: `Don't forget to follow up on your testimonial request for ${request.clientName}`,
                    actionUrl: `/testimonials/requests/${request.id}`,
                    actionText: 'View Request'
                });

                // Update request with reminder timestamp
                await repository.update(
                    `USER#${userId}`,
                    `REQUEST#${request.id}`,
                    { reminderSentAt: new Date().toISOString() }
                );

                remindersSent++;
            } catch (error) {
                const errorMsg = `Failed to send reminder for request ${request.id}: ${error.message}`;
                console.error(errorMsg);
                errors.push(errorMsg);
            }
        }
        */

        console.log(`Testimonial reminders completed for user ${userId}: ${remindersSent} sent`);

        return {
            success: errors.length === 0,
            remindersSent,
            errors,
        };

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Failed to process testimonial reminders for user ${userId}:`, error);

        return {
            success: false,
            remindersSent,
            errors: [errorMsg],
        };
    }
}

/**
 * Expire old testimonial requests that haven't been completed
 * 
 * @param userId - The user ID to expire requests for
 * @returns Promise<TestimonialExpirationResult> - Result with count and any errors
 */
export async function expireOldTestimonialRequests(userId: string): Promise<TestimonialExpirationResult> {
    const errors: string[] = [];
    let requestsExpired = 0;

    try {
        // Validate input
        if (!userId || typeof userId !== 'string') {
            throw new Error('Valid userId is required');
        }

        console.log(`Processing testimonial request expiration for user: ${userId}`);

        // TODO: Implement actual logic:
        // 1. Query pending requests older than expiration threshold (e.g., 30 days)
        // 2. Update status to 'expired'
        // 3. Optionally notify user about expired requests

        // Example implementation structure:
        /*
        const repository = getRepository();
        const notificationService = getNotificationService();
        const expirationThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        // Query pending requests older than threshold
        const expiredRequests = await repository.query(
            `USER#${userId}`,
            { beginsWith: 'REQUEST#' },
            {
                filter: {
                    status: 'pending',
                    sentAt: { '<': expirationThreshold.toISOString() }
                }
            }
        );

        for (const request of expiredRequests) {
            try {
                // Update request status to expired
                await repository.update(
                    `USER#${userId}`,
                    `REQUEST#${request.id}`,
                    { 
                        status: 'expired',
                        expiredAt: new Date().toISOString()
                    }
                );

                requestsExpired++;
            } catch (error) {
                const errorMsg = `Failed to expire request ${request.id}: ${error.message}`;
                console.error(errorMsg);
                errors.push(errorMsg);
            }
        }

        // Optionally notify user if requests were expired
        if (requestsExpired > 0) {
            await notificationService.createNotification({
                userId,
                type: NotificationType.SYSTEM,
                priority: NotificationPriority.LOW,
                title: 'Testimonial Requests Expired',
                content: `${requestsExpired} testimonial request(s) have expired and been automatically closed.`,
                actionUrl: '/testimonials/requests',
                actionText: 'View Requests'
            });
        }
        */

        console.log(`Testimonial request expiration completed for user ${userId}: ${requestsExpired} expired`);

        return {
            success: errors.length === 0,
            requestsExpired,
            errors,
        };

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Failed to process testimonial request expiration for user ${userId}:`, error);

        return {
            success: false,
            requestsExpired,
            errors: [errorMsg],
        };
    }
}

/**
 * Process testimonial reminders for all users
 * This function is typically called by a scheduled Lambda or cron job
 * 
 * @returns Promise<AllUserRemindersResult> - Aggregate results for all users
 */
export async function processAllUserReminders(): Promise<AllUserRemindersResult> {
    const errors: string[] = [];
    let usersProcessed = 0;
    let totalRemindersSent = 0;
    let totalRequestsExpired = 0;

    try {
        console.log('Starting batch processing of testimonial reminders for all users');

        // TODO: Implement actual logic:
        // 1. Query all users who have testimonial requests
        // 2. Process reminders and expirations for each user
        // 3. Implement rate limiting and error handling
        // 4. Log progress and results

        // Example implementation structure:
        /*
        const repository = getRepository();
        
        // Get all users with testimonial requests (use GSI or scan with filter)
        const usersWithRequests = await repository.scan({
            FilterExpression: 'begins_with(SK, :sk_prefix) AND attribute_exists(#status)',
            ExpressionAttributeValues: {
                ':sk_prefix': 'REQUEST#'
            },
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ProjectionExpression: 'PK'
        });

        // Extract unique user IDs
        const uniqueUserIds = [...new Set(
            usersWithRequests.map(item => item.PK.replace('USER#', ''))
        )];

        console.log(`Found ${uniqueUserIds.length} users with testimonial requests`);

        // Process each user with rate limiting
        const BATCH_SIZE = 10;
        const DELAY_BETWEEN_BATCHES = 1000; // 1 second

        for (let i = 0; i < uniqueUserIds.length; i += BATCH_SIZE) {
            const batch = uniqueUserIds.slice(i, i + BATCH_SIZE);
            
            await Promise.all(batch.map(async (userId) => {
                try {
                    // Process reminders
                    const reminderResult = await sendTestimonialReminders(userId);
                    totalRemindersSent += reminderResult.remindersSent;
                    
                    if (!reminderResult.success) {
                        errors.push(...reminderResult.errors);
                    }

                    // Process expirations
                    const expirationResult = await expireOldTestimonialRequests(userId);
                    totalRequestsExpired += expirationResult.requestsExpired;
                    
                    if (!expirationResult.success) {
                        errors.push(...expirationResult.errors);
                    }

                    usersProcessed++;
                } catch (error) {
                    const errorMsg = `Failed to process user ${userId}: ${error.message}`;
                    console.error(errorMsg);
                    errors.push(errorMsg);
                }
            }));

            // Rate limiting delay between batches
            if (i + BATCH_SIZE < uniqueUserIds.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            }
        }
        */

        console.log(`Batch processing completed: ${usersProcessed} users processed, ${totalRemindersSent} reminders sent, ${totalRequestsExpired} requests expired`);

        return {
            success: errors.length === 0,
            usersProcessed,
            totalRemindersSent,
            totalRequestsExpired,
            errors,
        };

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Failed to process batch testimonial reminders:', error);

        return {
            success: false,
            usersProcessed,
            totalRemindersSent,
            totalRequestsExpired,
            errors: [errorMsg],
        };
    }
}