/**
 * Testimonial Reminder Service
 * 
 * Handles automated reminder emails for pending testimonial requests
 * Validates Requirements: 2.5
 */

import {
    queryPendingRequestsOlderThan,
    updateTestimonialRequestStatus
} from '@/aws/dynamodb';
import { sendEmail } from '@/aws/ses/client';
import { generateTestimonialReminderEmail } from '@/lib/email-templates/testimonial-reminder';
import { getNotificationService } from '@/lib/notifications/service';
import { NotificationType, NotificationPriority, NotificationChannel } from '@/lib/notifications/types';

/**
 * Sends reminder emails for pending testimonial requests older than 14 days
 * @param userId Optional user ID to process reminders for a specific user
 * @returns Number of reminders sent
 */
export async function sendTestimonialReminders(userId?: string): Promise<{
    success: boolean;
    remindersSent: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let remindersSent = 0;

    try {
        // If userId is provided, process only that user's requests
        // Otherwise, we would need to scan all users (not implemented here for efficiency)
        if (!userId) {
            return {
                success: false,
                remindersSent: 0,
                errors: ['User ID is required for reminder processing'],
            };
        }

        // Query pending requests older than 14 days
        const result = await queryPendingRequestsOlderThan(userId, 14);

        if (result.items.length === 0) {
            return {
                success: true,
                remindersSent: 0,
                errors: [],
            };
        }

        // Get notification service
        const notificationService = getNotificationService();

        // Get user profile for agent info
        const { getUserProfileKeys } = await import('@/aws/dynamodb/keys');
        const { getRepository } = await import('@/aws/dynamodb');
        const repository = getRepository();
        const profileKeys = getUserProfileKeys(userId);
        const profile = await repository.get<any>(profileKeys.PK, profileKeys.SK);

        const agentName = profile?.name || 'Your Agent';
        const agencyName = profile?.agencyName;
        const fromEmail = process.env.SES_FROM_EMAIL || 'noreply@bayoncoagent.com';

        // Process each pending request
        for (const request of result.items) {
            try {
                // Generate full submission URL
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bayoncoagent.com';
                const fullSubmissionLink = `${appUrl}${request.submissionLink}`;

                // Generate reminder email content
                const emailContent = generateTestimonialReminderEmail({
                    clientName: request.clientName,
                    agentName,
                    agencyName,
                    submissionLink: fullSubmissionLink,
                    expiresAt: request.expiresAt,
                });

                // Send reminder email via AWS SES
                await sendEmail(
                    request.clientEmail,
                    emailContent.subject,
                    emailContent.html,
                    fromEmail,
                    true // isHtml
                );

                // Create in-app notification for agent
                await notificationService.createNotification({
                    userId: request.userId,
                    type: NotificationType.SYSTEM,
                    priority: NotificationPriority.MEDIUM,
                    title: 'Testimonial Reminder Sent',
                    content: `Reminder email sent to ${request.clientName} for their pending testimonial. The request was sent ${Math.floor((Date.now() - new Date(request.sentAt).getTime()) / (1000 * 60 * 60 * 24))} days ago.`,
                    metadata: {
                        requestId: request.id,
                        clientName: request.clientName,
                        clientEmail: request.clientEmail,
                        sentAt: request.sentAt,
                        reminderSentAt: new Date().toISOString(),
                    },
                    channels: [NotificationChannel.IN_APP],
                });

                // Update request with reminder sent timestamp
                await updateTestimonialRequestStatus(
                    request.userId,
                    request.id,
                    'pending',
                    {
                        reminderSentAt: new Date().toISOString(),
                    }
                );

                remindersSent++;
                console.log(`[TESTIMONIAL_REMINDER] Sent reminder to ${request.clientEmail} for request ${request.id}`);
            } catch (error: any) {
                console.error(`[TESTIMONIAL_REMINDER] Error processing request ${request.id}:`, error);
                errors.push(`Failed to send reminder for request ${request.id}: ${error.message}`);
            }
        }

        return {
            success: true,
            remindersSent,
            errors,
        };
    } catch (error: any) {
        console.error('[TESTIMONIAL_REMINDER] Error sending reminders:', error);
        return {
            success: false,
            remindersSent,
            errors: [error.message || 'Failed to send reminders'],
        };
    }
}

/**
 * Checks and expires old testimonial requests
 * @param userId Optional user ID to process for a specific user
 * @returns Number of requests expired
 */
export async function expireOldTestimonialRequests(userId?: string): Promise<{
    success: boolean;
    requestsExpired: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let requestsExpired = 0;

    try {
        if (!userId) {
            return {
                success: false,
                requestsExpired: 0,
                errors: ['User ID is required for expiration processing'],
            };
        }

        // Query all pending requests
        const { queryTestimonialRequests } = await import('@/aws/dynamodb');
        const result = await queryTestimonialRequests(userId);

        const now = new Date();

        // Check each request for expiration
        for (const request of result.items) {
            if (request.status !== 'pending') continue;

            const expiresAt = new Date(request.expiresAt);
            if (now > expiresAt) {
                try {
                    await updateTestimonialRequestStatus(request.userId, request.id, 'expired');
                    requestsExpired++;
                } catch (error: any) {
                    console.error(`[TESTIMONIAL_REMINDER] Error expiring request ${request.id}:`, error);
                    errors.push(`Failed to expire request ${request.id}: ${error.message}`);
                }
            }
        }

        return {
            success: true,
            requestsExpired,
            errors,
        };
    } catch (error: any) {
        console.error('[TESTIMONIAL_REMINDER] Error expiring requests:', error);
        return {
            success: false,
            requestsExpired,
            errors: [error.message || 'Failed to expire requests'],
        };
    }
}

/**
 * Processes reminders for all users with pending testimonial requests
 * This function scans the database for all users with pending requests
 * and sends reminders where appropriate.
 * 
 * Note: In a production system with many users, this should be optimized
 * using a GSI or by maintaining a separate index of users with pending requests.
 * 
 * @returns Summary of processing results
 */
export async function processAllUserReminders(): Promise<{
    success: boolean;
    usersProcessed: number;
    totalRemindersSent: number;
    totalRequestsExpired: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let usersProcessed = 0;
    let totalRemindersSent = 0;
    let totalRequestsExpired = 0;

    try {
        // Get all users with testimonial requests
        // This is a simplified implementation - in production, you'd want to use
        // a GSI or maintain a separate index for efficiency
        const { getRepository } = await import('@/aws/dynamodb');
        const repository = getRepository();

        // Scan for all testimonial requests
        const scanResult = await repository.scan<any>({
            filterExpression: 'begins_with(#sk, :requestPrefix)',
            expressionAttributeNames: {
                '#sk': 'SK',
            },
            expressionAttributeValues: {
                ':requestPrefix': 'REQUEST#',
            },
        });

        // Group requests by userId
        const userRequests = new Map<string, any[]>();
        for (const item of scanResult.items) {
            const userId = item.userId;
            if (!userRequests.has(userId)) {
                userRequests.set(userId, []);
            }
            userRequests.get(userId)!.push(item);
        }

        // Process each user
        for (const [userId, requests] of userRequests) {
            try {
                // Send reminders for this user
                const reminderResult = await sendTestimonialReminders(userId);
                totalRemindersSent += reminderResult.remindersSent;
                errors.push(...reminderResult.errors);

                // Expire old requests for this user
                const expirationResult = await expireOldTestimonialRequests(userId);
                totalRequestsExpired += expirationResult.requestsExpired;
                errors.push(...expirationResult.errors);

                usersProcessed++;
            } catch (error: any) {
                console.error(`[TESTIMONIAL_REMINDER] Error processing user ${userId}:`, error);
                errors.push(`Failed to process user ${userId}: ${error.message}`);
            }
        }

        return {
            success: true,
            usersProcessed,
            totalRemindersSent,
            totalRequestsExpired,
            errors,
        };
    } catch (error: any) {
        console.error('[TESTIMONIAL_REMINDER] Error processing all users:', error);
        return {
            success: false,
            usersProcessed,
            totalRemindersSent,
            totalRequestsExpired,
            errors: [error.message || 'Failed to process all users'],
        };
    }
}
