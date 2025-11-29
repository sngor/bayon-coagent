/**
 * Email Channel Handler
 * 
 * Handles delivery of email notifications using AWS SES.
 * Supports templates, digest generation, and batching.
 * Validates Requirements: 4.1, 4.2, 4.4
 */

import {
    Notification,
    NotificationPreferences,
    NotificationRecipient,
    DeliveryResult,
    DeliveryStatus,
    FormattedContent,
    NotificationTemplate,
    NotificationChannel,
    NotificationType,
    EmailFrequency,
} from "../types";
import { BaseChannelHandler } from "./base-channel-handler";
import {
    sendEmail,
    sendBulkTemplatedEmail,
    getEmailTemplate,
    upsertEmailTemplate,
    templateExists
} from "@/aws/ses/client";
import {
    createNotificationError,
    ErrorCodes,
    withErrorHandling,
} from "../errors";
import { getUnsubscribeService } from "../unsubscribe-service";

/**
 * Email template data for rendering
 */
interface EmailTemplateData {
    agentName: string;
    notificationTitle: string;
    notificationContent: string;
    notificationType: string;
    priority: string;
    actionUrl?: string;
    actionText?: string;
    createdAt: string;
    unsubscribeUrl: string;
    preferencesUrl: string;
}

/**
 * Email Channel Handler
 * Delivers notifications via email using AWS SES
 */
export class EmailChannelHandler extends BaseChannelHandler {
    readonly channel = NotificationChannel.EMAIL;

    private readonly defaultFromEmail: string;
    private readonly appUrl: string;

    constructor() {
        super();
        this.defaultFromEmail = process.env.SES_FROM_EMAIL || 'noreply@bayoncoagent.com';
        this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bayoncoagent.com';
    }

    /**
     * Delivers an email notification
     * 
     * @param notification Notification to deliver
     * @param recipient Recipient information
     * @returns Delivery result
     */
    async deliver(
        notification: Notification,
        recipient: NotificationRecipient
    ): Promise<DeliveryResult> {
        try {
            // Validate recipient has email
            this.validateRecipient(recipient, ['userId', 'email']);

            if (!recipient.email) {
                throw createNotificationError(
                    ErrorCodes.MISSING_REQUIRED_FIELD,
                    'Recipient email address is required',
                    { userId: recipient.userId, notificationId: notification.id }
                );
            }

            // Check unsubscribe compliance - Validates Requirements: 4.5
            const unsubscribeService = getUnsubscribeService();
            const canSendEmail = await unsubscribeService.canSendEmail(
                recipient.userId,
                notification.type
            );

            if (!canSendEmail) {
                return this.createSuccessResult(undefined, {
                    skipped: true,
                    reason: 'User has unsubscribed from this notification type',
                });
            }

            // Check if we should send email now (quiet hours check)
            if (!this.shouldSendNow(notification, recipient.preferences)) {
                return this.createSuccessResult(undefined, {
                    queued: true,
                    reason: 'Queued due to quiet hours or digest mode',
                });
            }

            // Format content for email
            const formattedContent = await this.formatContent(notification);

            // Send email via SES with error handling
            const messageId = await withErrorHandling(
                async () => sendEmail(
                    recipient.email!,
                    formattedContent.subject || notification.title,
                    formattedContent.html || formattedContent.body,
                    this.defaultFromEmail,
                    true // isHtml
                ),
                ErrorCodes.EMAIL_DELIVERY_FAILED,
                {
                    notificationId: notification.id,
                    userId: recipient.userId,
                    email: recipient.email,
                }
            );

            // Log delivery attempt
            const result = this.createSuccessResult(messageId, {
                email: recipient.email,
                messageId,
            });
            this.logDeliveryAttempt(notification, recipient, result);

            return result;
        } catch (error: any) {
            // Check for specific SES errors
            let errorCode: string = ErrorCodes.EMAIL_DELIVERY_FAILED;
            if (error.code === 'MessageRejected' || error.message?.includes('bounce')) {
                errorCode = ErrorCodes.EMAIL_BOUNCE;
            } else if (error.message?.includes('complaint')) {
                errorCode = ErrorCodes.EMAIL_COMPLAINT;
            }

            const result = this.createFailureResult(
                error instanceof Error ? error.message : "Failed to deliver email notification",
                { errorCode }
            );
            this.logDeliveryAttempt(notification, recipient, result);
            return result;
        }
    }

    /**
     * Validates delivery of an email notification
     * For email, we rely on SES delivery status
     * 
     * @param deliveryId Message ID from SES
     * @returns Delivery status
     */
    async validateDelivery(deliveryId: string): Promise<DeliveryStatus> {
        // In a production system, this would query SES for delivery status
        // For now, we'll return SENT as we don't have bounce/complaint tracking yet
        // TODO: Implement SES SNS notifications for bounces and complaints
        return DeliveryStatus.SENT;
    }

    /**
     * Formats notification content for email delivery
     * 
     * @param notification Notification to format
     * @param template Optional template
     * @returns Formatted email content
     */
    async formatContent(
        notification: Notification,
        template?: NotificationTemplate
    ): Promise<FormattedContent> {
        // If template is provided, use it
        if (template) {
            return this.renderTemplate(notification, template);
        }

        // Otherwise, generate email from notification data
        const subject = this.generateSubject(notification);
        const htmlBody = this.generateHtmlBody(notification);
        const textBody = this.generateTextBody(notification);

        return {
            subject,
            body: textBody,
            html: htmlBody,
        };
    }

    /**
     * Checks if email channel is enabled in preferences
     * 
     * @param preferences User preferences
     * @returns True if enabled
     */
    protected isChannelEnabled(preferences: NotificationPreferences): boolean {
        return preferences.channels.email.enabled;
    }

    /**
     * Checks if notification type is allowed for email channel
     * 
     * @param notification Notification to check
     * @param preferences User preferences
     * @returns True if allowed
     */
    protected isNotificationTypeAllowed(
        notification: Notification,
        preferences: NotificationPreferences
    ): boolean {
        return preferences.channels.email.types.includes(notification.type);
    }

    // ============================================================================
    // Email Generation Methods
    // ============================================================================

    /**
     * Generates email subject line
     * 
     * @param notification Notification
     * @returns Subject line
     */
    private generateSubject(notification: Notification): string {
        const priorityPrefix = notification.priority === 'critical' ? '[URGENT] ' : '';
        return `${priorityPrefix}${notification.title}`;
    }

    /**
     * Generates HTML email body
     * 
     * @param notification Notification
     * @returns HTML body
     */
    private generateHtmlBody(notification: Notification): string {
        const unsubscribeUrl = this.generateUnsubscribeUrl(notification.userId);
        const preferencesUrl = this.generatePreferencesUrl();

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.sanitizeContent(notification.title)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Bayon Coagent</h1>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        ${this.getPriorityBadge(notification.priority)}
        
        <h2 style="color: #1f2937; margin-top: 20px; margin-bottom: 15px; font-size: 20px;">
            ${this.sanitizeContent(notification.title)}
        </h2>
        
        <div style="color: #4b5563; margin-bottom: 25px; font-size: 15px; line-height: 1.8;">
            ${this.formatContentForHtml(notification.content)}
        </div>
        
        ${notification.actionUrl && notification.actionText ? `
        <div style="text-align: center; margin: 30px 0;">
            <a href="${notification.actionUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
                ${this.sanitizeContent(notification.actionText)}
            </a>
        </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
            <p style="margin: 5px 0;">
                <strong>Type:</strong> ${this.formatNotificationType(notification.type)}
            </p>
            <p style="margin: 5px 0;">
                <strong>Time:</strong> ${new Date(notification.createdAt).toLocaleString()}
            </p>
        </div>
    </div>
    
    <div style="margin-top: 20px; padding: 20px; background: #f9fafb; border-radius: 6px; font-size: 12px; color: #6b7280; text-align: center;">
        <p style="margin: 5px 0;">
            <a href="${preferencesUrl}" style="color: #667eea; text-decoration: none;">Manage notification preferences</a>
            &nbsp;|&nbsp;
            <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
        </p>
        <p style="margin: 10px 0 5px 0;">
            © ${new Date().getFullYear()} Bayon Coagent. All rights reserved.
        </p>
    </div>
</body>
</html>
        `.trim();
    }

    /**
     * Generates plain text email body
     * 
     * @param notification Notification
     * @returns Text body
     */
    private generateTextBody(notification: Notification): string {
        const unsubscribeUrl = this.generateUnsubscribeUrl(notification.userId);
        const preferencesUrl = this.generatePreferencesUrl();

        let text = `
BAYON COAGENT NOTIFICATION
${notification.priority === 'critical' ? '[URGENT]' : ''}

${notification.title}

${notification.content}
        `.trim();

        if (notification.actionUrl && notification.actionText) {
            text += `\n\n${notification.actionText}: ${notification.actionUrl}`;
        }

        text += `\n\n---\nType: ${this.formatNotificationType(notification.type)}`;
        text += `\nTime: ${new Date(notification.createdAt).toLocaleString()}`;
        text += `\n\n---\nManage preferences: ${preferencesUrl}`;
        text += `\nUnsubscribe: ${unsubscribeUrl}`;

        return text;
    }

    /**
     * Renders a notification using a template
     * 
     * @param notification Notification
     * @param template Template to use
     * @returns Formatted content
     */
    private renderTemplate(
        notification: Notification,
        template: NotificationTemplate
    ): FormattedContent {
        // Simple template variable replacement
        // In production, use a proper template engine like Handlebars or Mustache
        const data: Record<string, string> = {
            title: notification.title,
            content: notification.content,
            type: this.formatNotificationType(notification.type),
            priority: notification.priority,
            actionUrl: notification.actionUrl || '',
            actionText: notification.actionText || '',
            createdAt: new Date(notification.createdAt).toLocaleString(),
            unsubscribeUrl: this.generateUnsubscribeUrl(notification.userId),
            preferencesUrl: this.generatePreferencesUrl(),
        };

        let subject = template.subject || notification.title;
        let body = template.bodyTemplate;
        let html = template.htmlTemplate;

        // Replace variables
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, value);
            body = body.replace(regex, value);
            if (html) {
                html = html.replace(regex, value);
            }
        }

        return {
            subject,
            body,
            html,
        };
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    /**
     * Checks if email should be sent now based on preferences
     * 
     * @param notification Notification
     * @param preferences User preferences
     * @returns True if should send now
     */
    private shouldSendNow(
        notification: Notification,
        preferences: NotificationPreferences
    ): boolean {
        // Critical notifications always send immediately
        if (notification.priority === 'critical') {
            return true;
        }

        // Check frequency setting
        if (preferences.channels.email.frequency !== EmailFrequency.IMMEDIATE) {
            // Should be queued for digest
            return false;
        }

        // Check quiet hours
        const quietHours = preferences.channels.email.quietHours;
        if (quietHours?.enabled) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const isInQuietHours = this.isTimeInRange(
                currentTime,
                quietHours.startTime,
                quietHours.endTime
            );

            if (isInQuietHours) {
                return false;
            }
        }

        return true;
    }

    /**
     * Checks if a time is within a range
     * 
     * @param time Time to check (HH:MM)
     * @param start Start time (HH:MM)
     * @param end End time (HH:MM)
     * @returns True if time is in range
     */
    private isTimeInRange(time: string, start: string, end: string): boolean {
        const timeMinutes = this.timeToMinutes(time);
        const startMinutes = this.timeToMinutes(start);
        const endMinutes = this.timeToMinutes(end);

        // Handle ranges that span midnight
        if (startMinutes > endMinutes) {
            return timeMinutes >= startMinutes || timeMinutes < endMinutes;
        }

        return timeMinutes >= startMinutes && timeMinutes < endMinutes;
    }

    /**
     * Converts time string to minutes since midnight
     * 
     * @param time Time string (HH:MM)
     * @returns Minutes since midnight
     */
    private timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Formats notification type for display
     * 
     * @param type Notification type
     * @returns Formatted type
     */
    private formatNotificationType(type: NotificationType): string {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Formats content for HTML display
     * 
     * @param content Content to format
     * @returns Formatted HTML
     */
    private formatContentForHtml(content: string): string {
        // Sanitize and convert line breaks to <br>
        const sanitized = this.sanitizeContent(content);
        return sanitized.replace(/\n/g, '<br>');
    }

    /**
     * Gets priority badge HTML
     * 
     * @param priority Priority level
     * @returns HTML badge
     */
    private getPriorityBadge(priority: string): string {
        const colors: Record<string, string> = {
            critical: '#dc2626',
            high: '#ea580c',
            medium: '#ca8a04',
            low: '#65a30d',
        };

        const color = colors[priority] || colors.medium;

        return `
        <div style="display: inline-block; background: ${color}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
            ${priority}
        </div>
        `;
    }

    /**
     * Generates unsubscribe URL with secure token
     * Validates Requirements: 4.5
     * 
     * @param userId User ID
     * @param email User email (optional, will be fetched if not provided)
     * @returns Unsubscribe URL
     */
    private generateUnsubscribeUrl(userId: string, email?: string): string {
        // If email is not provided, use a simple user-based URL
        // In production, email should always be provided for proper token generation
        if (!email) {
            return `${this.appUrl}/settings/notifications/unsubscribe?user=${userId}`;
        }

        const unsubscribeService = getUnsubscribeService();
        return unsubscribeService.generateUnsubscribeUrl(userId, email);
    }

    /**
     * Generates preferences URL
     * 
     * @returns Preferences URL
     */
    private generatePreferencesUrl(): string {
        return `${this.appUrl}/settings/notifications`;
    }

    // ============================================================================
    // Template Management Methods
    // ============================================================================

    /**
     * Creates or updates an email template in SES
     * 
     * @param template Template to create/update
     */
    async createOrUpdateTemplate(template: NotificationTemplate): Promise<void> {
        if (template.channel !== NotificationChannel.EMAIL) {
            throw new Error('Template must be for email channel');
        }

        if (!template.htmlTemplate) {
            throw new Error('Email template must have HTML template');
        }

        await upsertEmailTemplate(
            template.id,
            template.subject || '{{title}}',
            template.htmlTemplate,
            template.bodyTemplate
        );
    }

    /**
     * Gets an email template from SES
     * 
     * @param templateId Template ID
     * @returns Template or null if not found
     */
    async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
        try {
            const sesTemplate = await getEmailTemplate(templateId);

            return {
                id: sesTemplate.TemplateName || templateId,
                type: NotificationType.SYSTEM, // Default type
                channel: NotificationChannel.EMAIL,
                subject: sesTemplate.SubjectPart,
                bodyTemplate: sesTemplate.TextPart || '',
                htmlTemplate: sesTemplate.HtmlPart,
            };
        } catch (error: any) {
            if (error.name === 'TemplateDoesNotExistException') {
                return null;
            }
            throw error;
        }
    }

    /**
     * Checks if a template exists in SES
     * 
     * @param templateId Template ID
     * @returns True if template exists
     */
    async hasTemplate(templateId: string): Promise<boolean> {
        return await templateExists(templateId);
    }

    // ============================================================================
    // Digest Email Methods
    // ============================================================================

    /**
     * Generates a digest email from multiple notifications
     * Validates Requirements: 3.5, 4.4
     * 
     * @param notifications Array of notifications to include in digest
     * @param recipient Recipient information
     * @param frequency Digest frequency (daily, weekly, etc.)
     * @returns Delivery result
     */
    async sendDigestEmail(
        notifications: Notification[],
        recipient: NotificationRecipient,
        frequency: EmailFrequency
    ): Promise<DeliveryResult> {
        try {
            // Validate recipient has email
            this.validateRecipient(recipient, ['userId', 'email']);

            if (!recipient.email) {
                throw new Error('Recipient email address is required');
            }

            if (notifications.length === 0) {
                return this.createSuccessResult(undefined, {
                    skipped: true,
                    reason: 'No notifications to include in digest',
                });
            }

            // Group notifications by type
            const groupedNotifications = this.groupNotificationsByType(notifications);

            // Generate digest content
            const digestContent = this.generateDigestContent(
                groupedNotifications,
                frequency,
                recipient
            );

            // Send digest email
            const messageId = await sendEmail(
                recipient.email,
                digestContent.subject || `Your ${frequency} notification digest`,
                digestContent.html || digestContent.body,
                this.defaultFromEmail,
                true
            );

            return this.createSuccessResult(messageId, {
                email: recipient.email,
                messageId,
                notificationCount: notifications.length,
                digestFrequency: frequency,
            });
        } catch (error) {
            return this.createFailureResult(
                error instanceof Error ? error.message : "Failed to send digest email"
            );
        }
    }

    /**
     * Sends digest emails to multiple recipients using SES bulk templated email
     * 
     * @param digestData Array of digest data for each recipient
     * @returns Array of delivery results
     */
    async sendBulkDigestEmails(
        digestData: Array<{
            recipient: NotificationRecipient;
            notifications: Notification[];
            frequency: EmailFrequency;
        }>
    ): Promise<DeliveryResult[]> {
        const results: DeliveryResult[] = [];

        // Process in batches of 50 (SES bulk email limit)
        const batchSize = 50;
        for (let i = 0; i < digestData.length; i += batchSize) {
            const batch = digestData.slice(i, i + batchSize);

            // Send each digest individually for now
            // In production, you might want to use SES templates for better performance
            for (const data of batch) {
                const result = await this.sendDigestEmail(
                    data.notifications,
                    data.recipient,
                    data.frequency
                );
                results.push(result);
            }
        }

        return results;
    }

    /**
     * Groups notifications by type for digest display
     * 
     * @param notifications Notifications to group
     * @returns Grouped notifications
     */
    private groupNotificationsByType(
        notifications: Notification[]
    ): Map<NotificationType, Notification[]> {
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
     * 
     * @param groupedNotifications Notifications grouped by type
     * @param frequency Digest frequency
     * @param recipient Recipient information
     * @returns Formatted digest content
     */
    private generateDigestContent(
        groupedNotifications: Map<NotificationType, Notification[]>,
        frequency: EmailFrequency,
        recipient: NotificationRecipient
    ): FormattedContent {
        const totalCount = Array.from(groupedNotifications.values())
            .reduce((sum, notifications) => sum + notifications.length, 0);

        const subject = this.generateDigestSubject(frequency, totalCount);
        const htmlBody = this.generateDigestHtmlBody(groupedNotifications, frequency, recipient);
        const textBody = this.generateDigestTextBody(groupedNotifications, frequency);

        return {
            subject,
            body: textBody,
            html: htmlBody,
        };
    }

    /**
     * Generates digest email subject
     * 
     * @param frequency Digest frequency
     * @param count Number of notifications
     * @returns Subject line
     */
    private generateDigestSubject(frequency: EmailFrequency, count: number): string {
        const frequencyText = frequency.charAt(0).toUpperCase() + frequency.slice(1);
        return `Your ${frequencyText} Digest: ${count} notification${count !== 1 ? 's' : ''}`;
    }

    /**
     * Generates digest HTML body
     * 
     * @param groupedNotifications Notifications grouped by type
     * @param frequency Digest frequency
     * @param recipient Recipient information
     * @returns HTML body
     */
    private generateDigestHtmlBody(
        groupedNotifications: Map<NotificationType, Notification[]>,
        frequency: EmailFrequency,
        recipient: NotificationRecipient
    ): string {
        const unsubscribeUrl = this.generateUnsubscribeUrl(recipient.userId);
        const preferencesUrl = this.generatePreferencesUrl();

        const totalCount = Array.from(groupedNotifications.values())
            .reduce((sum, notifications) => sum + notifications.length, 0);

        let notificationSections = '';

        // Sort types by priority (critical first)
        const sortedTypes = Array.from(groupedNotifications.entries()).sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            const maxPriorityA = Math.min(...a[1].map(n => priorityOrder[n.priority] || 2));
            const maxPriorityB = Math.min(...b[1].map(n => priorityOrder[n.priority] || 2));
            return maxPriorityA - maxPriorityB;
        });

        for (const [type, notifications] of sortedTypes) {
            notificationSections += `
            <div style="margin-bottom: 30px;">
                <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">
                    ${this.formatNotificationType(type)} (${notifications.length})
                </h3>
                ${notifications.map(notification => this.generateDigestNotificationItem(notification)).join('')}
            </div>
            `;
        }

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your ${frequency} Notification Digest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Bayon Coagent</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px;">
            Your ${frequency} notification digest
        </p>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <p style="font-size: 16px; color: #4b5563; margin: 0;">
                You have <strong style="color: #667eea;">${totalCount}</strong> notification${totalCount !== 1 ? 's' : ''} from the past ${frequency === EmailFrequency.DAILY ? 'day' : frequency === EmailFrequency.WEEKLY ? 'week' : 'period'}
            </p>
        </div>

        ${notificationSections}

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <a href="${this.appUrl}/notifications" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
                View All Notifications
            </a>
        </div>
    </div>
    
    <div style="margin-top: 20px; padding: 20px; background: #f9fafb; border-radius: 6px; font-size: 12px; color: #6b7280; text-align: center;">
        <p style="margin: 5px 0;">
            <a href="${preferencesUrl}" style="color: #667eea; text-decoration: none;">Manage notification preferences</a>
            &nbsp;|&nbsp;
            <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
        </p>
        <p style="margin: 10px 0 5px 0;">
            © ${new Date().getFullYear()} Bayon Coagent. All rights reserved.
        </p>
    </div>
</body>
</html>
        `.trim();
    }

    /**
     * Generates HTML for a single notification in digest
     * 
     * @param notification Notification to render
     * @returns HTML string
     */
    private generateDigestNotificationItem(notification: Notification): string {
        const priorityColor = {
            critical: '#dc2626',
            high: '#ea580c',
            medium: '#ca8a04',
            low: '#65a30d',
        }[notification.priority] || '#ca8a04';

        return `
        <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid ${priorityColor};">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <h4 style="color: #1f2937; margin: 0; font-size: 15px; font-weight: 600;">
                    ${this.sanitizeContent(notification.title)}
                </h4>
                <span style="font-size: 11px; color: #6b7280; white-space: nowrap; margin-left: 10px;">
                    ${new Date(notification.createdAt).toLocaleDateString()}
                </span>
            </div>
            <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.5;">
                ${this.truncateContent(this.sanitizeContent(notification.content), 150)}
            </p>
            ${notification.actionUrl && notification.actionText ? `
            <div style="margin-top: 10px;">
                <a href="${notification.actionUrl}" 
                   style="color: #667eea; text-decoration: none; font-size: 13px; font-weight: 600;">
                    ${this.sanitizeContent(notification.actionText)} →
                </a>
            </div>
            ` : ''}
        </div>
        `;
    }

    /**
     * Generates digest plain text body
     * 
     * @param groupedNotifications Notifications grouped by type
     * @param frequency Digest frequency
     * @returns Text body
     */
    private generateDigestTextBody(
        groupedNotifications: Map<NotificationType, Notification[]>,
        frequency: EmailFrequency
    ): string {
        const totalCount = Array.from(groupedNotifications.values())
            .reduce((sum, notifications) => sum + notifications.length, 0);

        let text = `
BAYON COAGENT - ${frequency.toUpperCase()} NOTIFICATION DIGEST

You have ${totalCount} notification${totalCount !== 1 ? 's' : ''} from the past ${frequency === EmailFrequency.DAILY ? 'day' : frequency === EmailFrequency.WEEKLY ? 'week' : 'period'}

`;

        for (const [type, notifications] of groupedNotifications.entries()) {
            text += `\n${this.formatNotificationType(type).toUpperCase()} (${notifications.length})\n`;
            text += '='.repeat(50) + '\n\n';

            for (const notification of notifications) {
                text += `${notification.title}\n`;
                text += `${this.truncateContent(notification.content, 150)}\n`;
                if (notification.actionUrl) {
                    text += `${notification.actionUrl}\n`;
                }
                text += `Date: ${new Date(notification.createdAt).toLocaleDateString()}\n\n`;
            }
        }

        text += `\nView all notifications: ${this.appUrl}/notifications\n`;

        return text.trim();
    }
}

/**
 * Singleton instance of the email channel handler
 */
let emailChannelHandler: EmailChannelHandler | null = null;

/**
 * Gets the email channel handler instance
 * @returns EmailChannelHandler instance
 */
export function getEmailChannelHandler(): EmailChannelHandler {
    if (!emailChannelHandler) {
        emailChannelHandler = new EmailChannelHandler();
    }
    return emailChannelHandler;
}

/**
 * Resets the email channel handler instance
 * Useful for testing
 */
export function resetEmailChannelHandler(): void {
    emailChannelHandler = null;
}
