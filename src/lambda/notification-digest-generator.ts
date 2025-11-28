/**
 * Notification Digest Generator Lambda Function
 * 
 * Generates and sends daily and weekly digest emails for notifications.
 * Validates Requirements: 3.5, 4.4
 * 
 * This Lambda is triggered on a schedule to:
 * - Generate daily digests for users with daily frequency preference
 * - Generate weekly digests for users with weekly frequency preference
 * - Batch notifications by type and format them into digest emails
 * - Respect user-specific digest times and quiet hours
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
    Notification,
    NotificationPreferences,
    NotificationType,
    NotificationChannel,
    EmailFrequency,
} from '@/lib/notifications/types';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const sesClient = new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@bayoncoagent.com';

interface LambdaEvent {
    source?: string;
    'detail-type'?: string;
    detail?: {
        frequency: 'daily' | 'weekly';
        userIds?: string[];
    };
}

interface LambdaContext {
    getRemainingTimeInMillis(): number;
    functionName: string;
    awsRequestId: string;
}

interface DigestResult {
    statusCode: number;
    body: string;
    processed: number;
    sent: number;
    errors: string[];
}

/**
 * Lambda handler for digest generation
 */
export const handler = async (event: LambdaEvent, context: LambdaContext): Promise<DigestResult> => {
    console.log('[Digest Generator] Started', {
        event,
        requestId: context.awsRequestId,
    });

    try {
        const frequency = event.detail?.frequency || 'daily';
        const userIds = event.detail?.userIds;

        if (frequency === 'daily') {
            return await generateDailyDigests(userIds);
        } else if (frequency === 'weekly') {
            return await generateWeeklyDigests(userIds);
        } else {
            throw new Error(`Invalid frequency: ${frequency}`);
        }
    } catch (error) {
        console.error('[Digest Generator] Failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Digest generation failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            processed: 0,
            sent: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
    }
};

/**
 * Generates and sends daily digests
 */
async function generateDailyDigests(userIds?: string[]): Promise<DigestResult> {
    console.log('[Digest Generator] Generating daily digests', { userIds });

    const results = {
        processed: 0,
        sent: 0,
        errors: [] as string[],
    };

    try {
        // Get users with daily digest enabled
        const users = userIds || await getUsersWithDigestFrequency(EmailFrequency.DAILY);
        console.log(`[Digest Generator] Found ${users.length} users for daily digest`);

        for (const userId of users) {
            try {
                results.processed++;

                // Get user preferences
                const preferences = await getUserPreferences(userId);
                if (!preferences) {
                    results.errors.push(`No preferences found for user ${userId}`);
                    continue;
                }

                // Check if it's the right time for this user's digest
                if (!isDigestTime(preferences, 'daily')) {
                    console.log(`[Digest Generator] Skipping user ${userId} - not digest time`);
                    continue;
                }

                // Get unread notifications from the last 24 hours
                const notifications = await getUnreadNotifications(userId, 24);

                if (notifications.length === 0) {
                    console.log(`[Digest Generator] No notifications for user ${userId}`);
                    continue;
                }

                // Generate and send digest email
                await sendDigestEmail(userId, preferences, notifications, 'daily');
                results.sent++;

                console.log(`[Digest Generator] Daily digest sent to user ${userId} with ${notifications.length} notifications`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.errors.push(`Error processing user ${userId}: ${errorMessage}`);
                console.error(`[Digest Generator] Error for user ${userId}:`, error);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Processed daily digests for ${results.processed} users, sent ${results.sent} emails`,
                processed: results.processed,
                sent: results.sent,
                errors: results.errors,
            }),
            processed: results.processed,
            sent: results.sent,
            errors: results.errors,
        };
    } catch (error) {
        console.error('[Digest Generator] Failed to generate daily digests:', error);
        throw error;
    }
}

/**
 * Generates and sends weekly digests
 */
async function generateWeeklyDigests(userIds?: string[]): Promise<DigestResult> {
    console.log('[Digest Generator] Generating weekly digests', { userIds });

    const results = {
        processed: 0,
        sent: 0,
        errors: [] as string[],
    };

    try {
        // Get users with weekly digest enabled
        const users = userIds || await getUsersWithDigestFrequency(EmailFrequency.WEEKLY);
        console.log(`[Digest Generator] Found ${users.length} users for weekly digest`);

        for (const userId of users) {
            try {
                results.processed++;

                // Get user preferences
                const preferences = await getUserPreferences(userId);
                if (!preferences) {
                    results.errors.push(`No preferences found for user ${userId}`);
                    continue;
                }

                // Check if it's the right time for this user's digest
                if (!isDigestTime(preferences, 'weekly')) {
                    console.log(`[Digest Generator] Skipping user ${userId} - not digest time`);
                    continue;
                }

                // Get unread notifications from the last 7 days
                const notifications = await getUnreadNotifications(userId, 168); // 7 days * 24 hours

                if (notifications.length === 0) {
                    console.log(`[Digest Generator] No notifications for user ${userId}`);
                    continue;
                }

                // Generate and send digest email
                await sendDigestEmail(userId, preferences, notifications, 'weekly');
                results.sent++;

                console.log(`[Digest Generator] Weekly digest sent to user ${userId} with ${notifications.length} notifications`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.errors.push(`Error processing user ${userId}: ${errorMessage}`);
                console.error(`[Digest Generator] Error for user ${userId}:`, error);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Processed weekly digests for ${results.processed} users, sent ${results.sent} emails`,
                processed: results.processed,
                sent: results.sent,
                errors: results.errors,
            }),
            processed: results.processed,
            sent: results.sent,
            errors: results.errors,
        };
    } catch (error) {
        console.error('[Digest Generator] Failed to generate weekly digests:', error);
        throw error;
    }
}

/**
 * Gets users with a specific digest frequency
 */
async function getUsersWithDigestFrequency(frequency: EmailFrequency): Promise<string[]> {
    const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'SK = :sk AND #data.#channels.#email.#enabled = :enabled AND #data.#channels.#email.#frequency = :frequency',
        ExpressionAttributeNames: {
            '#data': 'Data',
            '#channels': 'channels',
            '#email': 'email',
            '#enabled': 'enabled',
            '#frequency': 'frequency',
        },
        ExpressionAttributeValues: {
            ':sk': 'NOTIFICATION_PREFERENCES',
            ':enabled': true,
            ':frequency': frequency,
        },
        ProjectionExpression: 'PK',
    });

    const response = await docClient.send(command);
    return response.Items?.map(item => item.PK.replace('USER#', '')) || [];
}

/**
 * Gets user notification preferences
 */
async function getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
            ':sk': 'NOTIFICATION_PREFERENCES',
        },
    });

    const response = await docClient.send(command);
    return response.Items?.[0]?.Data as NotificationPreferences || null;
}

/**
 * Gets unread notifications for a user within a time window
 */
async function getUnreadNotifications(userId: string, hoursBack: number): Promise<Notification[]> {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        FilterExpression: '#data.#status = :status AND #data.#createdAt >= :cutoff AND contains(#data.#channels, :emailChannel)',
        ExpressionAttributeNames: {
            '#data': 'Data',
            '#status': 'status',
            '#createdAt': 'createdAt',
            '#channels': 'channels',
        },
        ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
            ':skPrefix': 'NOTIFICATION#',
            ':status': 'sent',
            ':cutoff': cutoffTime,
            ':emailChannel': NotificationChannel.EMAIL,
        },
    });

    const response = await docClient.send(command);
    return response.Items?.map(item => item.Data as Notification) || [];
}

/**
 * Checks if it's the right time to send a digest based on user preferences
 */
function isDigestTime(preferences: NotificationPreferences, frequency: 'daily' | 'weekly'): boolean {
    const emailPrefs = preferences.channels.email;

    // Check if email is enabled
    if (!emailPrefs.enabled) {
        return false;
    }

    // Check if frequency matches
    if (emailPrefs.frequency !== frequency) {
        return false;
    }

    // Check quiet hours
    if (emailPrefs.quietHours?.enabled) {
        const now = new Date();
        const timezone = emailPrefs.quietHours.timezone || 'UTC';

        // Convert current time to user's timezone
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const currentHour = userTime.getHours();
        const currentMinute = userTime.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        // Parse quiet hours
        const [startHour, startMinute] = emailPrefs.quietHours.startTime.split(':').map(Number);
        const [endHour, endMinute] = emailPrefs.quietHours.endTime.split(':').map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        // Check if current time is within quiet hours
        if (startTime <= endTime) {
            // Normal case: quiet hours don't cross midnight
            if (currentTime >= startTime && currentTime <= endTime) {
                return false;
            }
        } else {
            // Quiet hours cross midnight
            if (currentTime >= startTime || currentTime <= endTime) {
                return false;
            }
        }
    }

    // Check digest time preference
    if (emailPrefs.digestTime) {
        const now = new Date();
        const timezone = emailPrefs.quietHours?.timezone || 'UTC';
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const currentHour = userTime.getHours();

        const [digestHour] = emailPrefs.digestTime.split(':').map(Number);

        // Allow a 1-hour window for digest delivery
        if (Math.abs(currentHour - digestHour) > 1) {
            return false;
        }
    }

    return true;
}

/**
 * Sends a digest email to a user
 */
async function sendDigestEmail(
    userId: string,
    preferences: NotificationPreferences,
    notifications: Notification[],
    frequency: 'daily' | 'weekly'
): Promise<void> {
    const emailAddress = preferences.channels.email.address;
    if (!emailAddress) {
        throw new Error(`No email address for user ${userId}`);
    }

    // Group notifications by type
    const groupedNotifications = groupNotificationsByType(notifications);

    // Generate email content
    const { subject, htmlBody, textBody } = generateDigestEmailContent(
        groupedNotifications,
        frequency
    );

    // Send email via SES
    const command = new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: {
            ToAddresses: [emailAddress],
        },
        Message: {
            Subject: {
                Data: subject,
                Charset: 'UTF-8',
            },
            Body: {
                Html: {
                    Data: htmlBody,
                    Charset: 'UTF-8',
                },
                Text: {
                    Data: textBody,
                    Charset: 'UTF-8',
                },
            },
        },
    });

    await sesClient.send(command);

    console.log(`[Digest Generator] Email sent to ${emailAddress}`);
}

/**
 * Groups notifications by type
 */
function groupNotificationsByType(notifications: Notification[]): Map<NotificationType, Notification[]> {
    const grouped = new Map<NotificationType, Notification[]>();

    for (const notification of notifications) {
        const existing = grouped.get(notification.type) || [];
        existing.push(notification);
        grouped.set(notification.type, existing);
    }

    return grouped;
}

/**
 * Generates digest email content
 */
function generateDigestEmailContent(
    groupedNotifications: Map<NotificationType, Notification[]>,
    frequency: 'daily' | 'weekly'
): { subject: string; htmlBody: string; textBody: string } {
    const totalCount = Array.from(groupedNotifications.values()).reduce((sum, arr) => sum + arr.length, 0);
    const subject = `Your ${frequency} digest: ${totalCount} notification${totalCount !== 1 ? 's' : ''}`;

    // Generate HTML body
    let htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; }
        .notification { background: #f3f4f6; border-left: 4px solid #2563eb; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .notification-title { font-weight: bold; color: #1e40af; margin-bottom: 5px; }
        .notification-content { color: #4b5563; }
        .notification-time { color: #6b7280; font-size: 0.875rem; margin-top: 5px; }
        .notification-action { margin-top: 10px; }
        .notification-action a { color: #2563eb; text-decoration: none; font-weight: 500; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.875rem; }
    </style>
</head>
<body>
    <h1>${frequency === 'daily' ? 'Daily' : 'Weekly'} Notification Digest</h1>
    <p>You have ${totalCount} notification${totalCount !== 1 ? 's' : ''} from the past ${frequency === 'daily' ? '24 hours' : 'week'}.</p>
`;

    // Generate text body
    let textBody = `${frequency === 'daily' ? 'Daily' : 'Weekly'} Notification Digest\n\n`;
    textBody += `You have ${totalCount} notification${totalCount !== 1 ? 's' : ''} from the past ${frequency === 'daily' ? '24 hours' : 'week'}.\n\n`;

    // Add notifications grouped by type
    const typeLabels: Record<NotificationType, string> = {
        [NotificationType.SYSTEM]: 'System Notifications',
        [NotificationType.ALERT]: 'Alerts',
        [NotificationType.REMINDER]: 'Reminders',
        [NotificationType.ACHIEVEMENT]: 'Achievements',
        [NotificationType.ANNOUNCEMENT]: 'Announcements',
        [NotificationType.TASK_COMPLETION]: 'Task Completions',
        [NotificationType.FEATURE_UPDATE]: 'Feature Updates',
    };

    for (const [type, notifications] of groupedNotifications.entries()) {
        htmlBody += `<h2>${typeLabels[type]} (${notifications.length})</h2>`;
        textBody += `\n${typeLabels[type]} (${notifications.length})\n${'='.repeat(50)}\n`;

        for (const notification of notifications) {
            const timeAgo = getTimeAgo(notification.createdAt);

            htmlBody += `
    <div class="notification">
        <div class="notification-title">${escapeHtml(notification.title)}</div>
        <div class="notification-content">${escapeHtml(notification.content)}</div>
        <div class="notification-time">${timeAgo}</div>
        ${notification.actionUrl ? `<div class="notification-action"><a href="${escapeHtml(notification.actionUrl)}">${escapeHtml(notification.actionText || 'View Details')}</a></div>` : ''}
    </div>
`;

            textBody += `\n${notification.title}\n${notification.content}\n${timeAgo}\n`;
            if (notification.actionUrl) {
                textBody += `${notification.actionText || 'View Details'}: ${notification.actionUrl}\n`;
            }
            textBody += '\n';
        }
    }

    htmlBody += `
    <div class="footer">
        <p>You're receiving this digest because you've enabled ${frequency} email notifications in your preferences.</p>
        <p>To change your notification preferences, visit your account settings.</p>
    </div>
</body>
</html>
`;

    textBody += `\n${'='.repeat(50)}\n`;
    textBody += `You're receiving this digest because you've enabled ${frequency} email notifications in your preferences.\n`;
    textBody += `To change your notification preferences, visit your account settings.\n`;

    return { subject, htmlBody, textBody };
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Gets a human-readable time ago string
 */
function getTimeAgo(timestamp: string): string {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}
